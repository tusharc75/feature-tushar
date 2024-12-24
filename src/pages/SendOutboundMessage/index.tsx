import { Box, Button, TextField } from '@mui/material';
import { AddOutlined } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { dateTimeFormat, gridLoadingTimeout, sidebarResource } from 'src/constants/helpers';
import ManageSendOutboundMessage from './manageSendOutboundMessage';
import axios, { CancelTokenSource } from 'axios';

const renderedFrom = camelCase(sidebarResource.sendOutboundMessage);

const SendOutboundMessage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, selectedEntity, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [manageSendOutBoundMessageDialog, setManageSendOutBoundMessageDialog] = useState(false);
  const [serializedAssetOptions, setSerializedAssetOptions] = useState([]);
  const [selectedSerializedAsset, setSelectedSerializedAsset] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const customColumns = [
    {
      accessor: 'serializedAsset',
      Header: resources?.serializedAsset?.titleSingular,
      Cell: ({ row }) =>
        row?.original?.serializedAsset ? (
          <div>
            <h5
              className="link text-truncate"
              onClick={() => {
                window.open(`${routes.serializedAssetDetail.path}/${row?.original?.serializedAssetId}`);
              }}
            >
              {row?.original?.serializedAsset}
            </h5>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'date',
      Header: 'Date',
      disableFilters: true,
      Cell: ({ row }) =>
        row?.original?.date ? <h5 className="text-truncate">{moment(row?.original?.date)?.format(dateTimeFormat)}</h5> : <NoDataCell />
    },
    {
      accessor: 'user',
      Header: 'User',
      Cell: ({ row }) => (row?.original?.user ? <h5 className="text-truncate">{row?.original?.user}</h5> : <NoDataCell />)
    }
  ];

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.outboundMessage}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, null, true);
        setColumns([...customColumns, ...newColumns]);
      });
  };

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Serialized Asset&deepFilter=${JSON.stringify([{ field: 'iotUnit', term: true }])}`)
      .then(({ data: { data } }) => {
        setSerializedAssetOptions(data['Serialized Asset']);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, selectedSerializedAsset]);

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/iot-out-bound-message${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        const rows = data?.map((d) => {
          delete d?.outboundMessageDetail?._id;
          return {
            _id: d?._id,
            serializedAsset: d?.serializedAsset?.optionLabel,
            serializedAssetId: d?.serializedAsset?.optionValue,
            date: d?.date,
            user: d?.user?.optionLabel,
            ...d?.outboundMessageDetail,
            outboundMessageNumber: d?.messageValue || d?.outboundMessageDetail?.outboundMessageNumber
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
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.sendOutboundMessage, title: resources?.sendOutboundMessage?.titlePlural }]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={'align-items-center flex w-full justify-between gap-1'}>
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
                  <TextField
                    {...params}
                    margin="dense"
                    name={'serializedAsset'}
                    label={resources?.serializedAsset?.titleSingular}
                    variant="outlined"
                  />
                )}
              />
            </div>
            <div className="align-items-center flex flex-wrap justify-end gap-[8px]">
              <SearchBox onChange={handleSearch} value={search} />
              <div className="flex flex-wrap items-center gap-[8px]">
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
            hideAction={true}
            hideSelection={true}
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
