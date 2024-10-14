import { Box, Button, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { prepareDataForGrid } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { gridLoadingTimeout } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageCycleCountDetermination from './ManageCycleCountDetermination';
import axios, { CancelTokenSource } from 'axios';

const CycleCountDetermination = () => {
  const renderedFrom = camelCase(`${routes.cycleCountDetermination.title}`);
  const [warehouseOption, setWarehouseOption] = useState([]);
  const [warehouse, setWarehouse] = useState(null);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [open, setOpen] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const [editData, setEditData] = useState(null);
  const { rowCount, selectedRecords } = state;
  useEffect(() => {
    getWarehouse();
  }, [selectedEntity]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (warehouse) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    }
  }, [warehouse]);

  const getWarehouse = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOption([...data['Warehouse']]);
        if (data['Warehouse']?.length) {
          setWarehouse(data['Warehouse'][0]?.optionValue);
        }
      });
  };

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'name',
        Header: 'Product Category',
        Cell: ({ row }) =>
          row.original?.name ? (
            <p
              className="link text-truncate"
              title={row?.original?.name}
              onClick={() => window.open(`${routes.productCategoryDetail.path}/${row?.original?._id}`)}
            >
              {row?.original?.name}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'inventoryCycle',
        Header: 'Cycle Code',
        Cell: ({ row }) => (row.original?.inventoryCycle ? <p className="text-truncate">{row.original?.inventoryCycle}</p> : <NoDataCell />)
      },
      {
        accessor: 'user',
        Header: 'User',
        Cell: ({ row }) => (row.original?.user ? <p className="text-truncate">{row.original?.user}</p> : <NoDataCell />)
      }
    ];
    setColumns(columns);
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/cycle-count-determination?warehouse=${warehouse}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setEditData(data);
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const LeftSideContent = () => {
    return (
      <>
        <Autocomplete
          style={{ minWidth: 200, flexGrow: 1 }}
          className="md:max-w-[250px]"
          options={warehouseOption}
          getOptionLabel={(option: any) => option?.optionLabel}
          disableClearable
          value={
            warehouseOption.filter((data) => data.optionValue === warehouse).length
              ? warehouseOption.filter((data) => data.optionValue === warehouse)[0]
              : ''
          }
          onChange={(e, val) => {
            setWarehouse(val && val.optionValue ? val.optionValue : null);
          }}
          renderInput={(params) => (
            <TextField {...params} margin="none" size="small" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
          )}
        />
      </>
    );
  };
  const RightSideContents = () => {
    return (
      <>
        <Button
          className={'no-shadow'}
          onClick={() => {
            setOpen(true);
          }}
          variant={'contained'}
          size="small"
          color="primary"
        >
          Edit
        </Button>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.cycleCountDetermination]} />
        <ImportExportLinks
          permissions={permissions?.cycleCountDetermination}
          module="cycleCountDetermination"
          api={'/cycle-count-determination'}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          isDownloadExcel={false}
          additionalParams={`&warehouse=${warehouse}`}
          onlyExport={false}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={<LeftSideContent />}
          rightSideContents={<RightSideContents />}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            hideSelection={true}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {open && (
          <ManageCycleCountDetermination
            onSuccess={() => {
              setOpen(false);
              fetchData();
            }}
            onClose={() => {
              setOpen(false);
            }}
            data={editData}
            warehouse={warehouse}
            warehouseName={warehouseOption?.find((e) => e?.optionValue === warehouse)?.optionLabel}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default CycleCountDetermination;
