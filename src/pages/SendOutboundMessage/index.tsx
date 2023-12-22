import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { Box, Button, TextField } from '@material-ui/core';
import { AddOutlined } from '@material-ui/icons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { Autocomplete } from '@material-ui/lab';
import ManageSendOutboundMessage from './manageSendOutboundMessage';

let searchTimeout;

const SendOutboundMessage = () => {
  const renderedFrom = camelCase(routes?.sendOutboundMessage?.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [renderCount, setRenderCount] = useState(0);
  const [manageSendOutBoundMessageDialog, setManageSendOutBoundMessageDialog] = useState(false);
  const [serializedAssetOptions, setSerializedAssetOptions] = useState([]);
  const [selectedSerializedAsset, setSelectedSerializedAsset] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const serializedAssetColumn = [
    {
      accessor: 'serializedAsset',
      Header: 'Serialized Asset',
      Cell: ({ row }) =>
        row?.original?.serializedAsset ? (
          <h5
            className="link text-truncate"
            onClick={() => {
              window.open(`${routes.serializedAssetDetail.path}/${row?.original?.serializedAssetId}`);
            }}
          >
            {row?.original?.serializedAsset}
          </h5>
        ) : (
          <NoDataCell />
        )
    }
  ];

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.outboundMessage}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, null, true);

        setColumns([...serializedAssetColumn, ...newColumns]);
      });
  };

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Serialized Asset`)
      .then(({ data: { data } }) => {
        setSerializedAssetOptions(data['Serialized Asset']);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 1) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, selectedSerializedAsset]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`/iot-out-bound-message${queryString}`)
      .then(({ data: { data, count } }) => {
        const rows = data?.map((d) => {
          delete d?.outboundMessageDetail?._id;
          delete d?.outboundMessageDetail?.brand;
          delete d?.outboundMessageDetail?.createdBy;
          return {
            _id: d?._id,
            serializedAsset: d?.serializedAsset?.optionLabel,
            serializedAssetId: d?.serializedAsset?.optionValue,
            ...d?.outboundMessageDetail
          };
        });

        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedSerializedAsset) {
      deepFilters.push({
        field: 'serializedAsset',
        term: selectedSerializedAsset?.optionLabel
      });
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.sendOutboundMessage]} />
        {/* <ImportExportLinks
        permissions={{ isCreate: true, isUpdate: true, isRead: true }}
        module={routes.supportTicket.title}
        api={routes.supportTicket.path}
        afterImportCompleted={() => {}}
        isExportAllOrSomeFeature={true}
        total={rowCount}
        recordsToExport={selectedRecords?.length}
        ids={selectedRecords?.map((obj) => obj._id)}
        onExportToExcelSuccess={() => {
          fetchData();
        }}
        additionalParams={`${getQueryString(true)}&ignoreInternalFields=${true}`}
        onlyExport={true}
      /> */}
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex justify-between align-items-center gap-1 w-full'}>
              <Autocomplete
                options={serializedAssetOptions}
                style={{ minWidth: '350px' }}
                getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={selectedSerializedAsset}
                onChange={(e, val) => {
                  setSelectedSerializedAsset(val);
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="dense" name={'serializedAsset'} label={'Serialized Asset'} variant="outlined" />
                )}
              />
            </div>
            <div className="flex flex-wrap gap-[8px] justify-end align-items-center">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setManageSendOutBoundMessageDialog(true);
                  }}
                  startIcon={<AddOutlined />}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {manageSendOutBoundMessageDialog && (
        <ManageSendOutboundMessage
          assetId={selectedSerializedAsset?.optionValue || null}
          onSuccess={() => {
            fetchData();
            setManageSendOutBoundMessageDialog(false);
          }}
          onClose={() => {
            setManageSendOutBoundMessageDialog(false);
          }}
        />
      )}
    </section>
  );
};

export default SendOutboundMessage;
