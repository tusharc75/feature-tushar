import { useState, useEffect, useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Dialog, Button, CircularProgress, Typography } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from 'src/pages/Leads/Header.module.scss';
import { useData } from 'src/StateProvider/Provider';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, productInventory, sidebarResource } from 'src/constants/helpers';
import { isMobile } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer, } from 'src/components/CustomReactTableNew';

const AddInventory = ({ warehouse, storageLocation, close, isAdding, submit, renderedFrom, ignoreIds }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  const { page, limit, selectedRecords, search, filters, sorting, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [inventories, setInventories] = useState([]);
  const { getColumnData } = useColumns();

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchFields = async () => {
    const productResult = await axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`);
    const data = productResult?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
    });
    columns.unshift(
      {
        accessor: 'qty',
        Header: 'Quantity',
        show: true,
        disabled: false,
        Cell: ({ row }) => (row.original.qty),
        cellRenderer: 'commonRenderer',
        cellEditor: 'numericCellEditor',
        editable: true,
        filter: false
      },
      {
        accessor: 'inventory',
        Header: 'Inventory',
        show: true,
        disabled: false,
        Cell: ({ row }) => (row.original.inventory),
        cellEditor: 'numericCellEditor',
        editable: false,
        filter: false
      }
    );
    setColumns([...columns, ...getStaticFields()]);
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${productInventory.api}?wareHouse=${warehouse}&${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          const selectedData = selectedRecords.find((d: any) => d._id === u._id);
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u._id;
          finalObject['inventory'] = u?.inventory ? u?.inventory - (u?.softHold || 0) : 0;
          finalObject['qty'] = selectedData ? selectedData.qty : finalObject['inventory'] ? 1 : 0;
          finalObject['hideSelection'] = finalObject['inventory'] ? false : true;
          return {
            ...finalObject
          };
        });
        if (selectedRecords.length > 0 && showFilteredRecordsOnly) {
          rows = selectedRecords;
        }
        dispatch({ type: 'initialize', data: rows, count: count });
        setInventories(rows);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getQueryString = () => {
    let deepFilter = `page=${page}&limit=${limit}`;

    if (storageLocation) {
      deepFilter = deepFilter + `&storageLocation=${storageLocation}`;
    }

    if (ignoreIds?.length) {
      deepFilter = deepFilter + `&ignoreIds=${JSON.stringify(ignoreIds)}`;
    }

    const updatedFilters = [];
    if (!user?.user?.brandPolicy?.showSerializedProduct) {
      updatedFilters.push({ field: 'serializedProduct', term: 'No' });
    }

    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
    }

    if (updatedFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${selectedRecords?.map((m) => m._id)}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return `${deepFilter}&filterType=and`;
  };

  const handleClickSave = () => {
    const _data = selectedRecords?.map((d) => ({
      product: d.productId,
      qty: Number(d.qty)
    }));
    submit(_data);
  };

  const onCellValueChanged = (data, row) => {
    if (Number(data.qty) > Number(row.inventory)) {
      toastConfig.setToastConfig({
        type: 'warning',
        message: "Qty can't be greater then inventory",
        open: true
      });
      return;
    }
    const newRecords = inventories.map((d) => {
      if (d.productId === row.productId) {
        d.qty = Number(data.qty);
      }
      return d;
    });
    dispatch({ type: 'update', data: newRecords });
  };

  let disableSave =
    selectedRecords?.length === 0 ||
    selectedRecords?.filter((d: any) => Number(d.qty) === 0).length > 0 ||
    selectedRecords?.filter((d: any) => Number(d.qty) > Number(d.inventory)).length > 0 ||
    isAdding;

  return (
    <Dialog open fullScreen fullWidth onClose={close}>
      <CustomDialogHeader title="Add Product" onClose={close} showRequiredLabel={false} />
      <CustomDialogContent>
        <Box
          display={'flex'}
          mb={1}
          flexDirection={isMobile ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems={isMobile ? 'flex-start' : 'center'}
        >
          <div style={{ order: isMobile ? 2 : 1 }}>
            {selectedRecords?.filter((d: any) => d.qty === 0).length > 0 && (
              <Typography variant="body2" color="error">
                Enter quantity before you save
              </Typography>
            )}
            {selectedRecords?.filter((d: any) => Number(d.qty) > Number(d.inventory)).length > 0 && (
              <Typography variant="body2" color="error">
                Quantity should be less then inventory
              </Typography>
            )}
          </div>
          <Box order={isMobile ? 1 : 2} display="flex" justifyContent={'space-between'} minWidth={isMobile ? '100%' : '300px'}>
            <SearchBox
              onChange={handleSearch}
              className={styles.search_box_input}
              width={'245px'}
              style={isMobile ? { flex: 1 } : {}}
              size="small"
              value={search}
            />
            <Box mx={1} />
            <Box>
              <Button
                startIcon={isAdding && <CircularProgress size={18} color="inherit" />}
                disabled={disableSave}
                onClick={handleClickSave}
                variant="contained"
                color="primary"
                size="small"
              >
                Add{' '}
                {selectedRecords.length > 0
                  ? '(' + selectedRecords.length + ')'
                  : ''}
              </Button>
            </Box>
          </Box>
        </Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchProductInventory}
            showOnlyShowFilteredRecordSwitch={true}
            onSaveEdit={onCellValueChanged}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddInventory;
