import { useEffect, useState, useContext, useImperativeHandle, forwardRef } from 'react';
import { TextField, Box, CircularProgress, IconButton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import Autocomplete from '@mui/material/Autocomplete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import { displayDateTime, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CustomReactTable, { useColumns, getStaticFields, gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { FiExternalLink } from 'react-icons/fi';
import { camelCase } from 'lodash';

function ListView({ resourceList, selectedResource, setSelectedResource, setQueryString }, ref) {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, resources }
  }: any = useData();
  const { generateColumns } = useColumns();

  const [renderedFrom, setRenderedFrom] = useState('');
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { page, limit, filters, sorting, search } = state;

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResource, setLookUpResource] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);

  const fetchGridColumns = async () => {
    if (selectedResource?.resource === sidebarResource.serializedAsset) {
      setColumns([
        {
          accessor: 'resourceLabel',
          Header: 'Resource',
          Cell: ({ row }) => (
            <>
              {row?.original?.resourceLabel ? (
                <h5 className="text-truncate" title={row?.original?.resourceLabel}>
                  {row?.original?.resourceLabel}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        },
        {
          accessor: 'reference',
          Header: 'Reference',
          Cell: ({ row }) => (
            <>
              {row?.original?.reference ? (
                <div className="flex items-center gap-1">
                  <p className="text-truncate"> {row.original.reference}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (row?.original?.resource === sidebarResource?.rentalManagement) {
                        window.open(`${routes.rentalManagementDetail.path}/${row.original._id}`);
                      } else if (row?.original?.resource === sidebarResource?.planning) {
                        window.open(`${routes.planningDetail.path}/${row.original._id}`);
                      } else if (row?.original?.resource === sidebarResource?.quotation) {
                        window.open(`${routes.quotationDetail.path}/${row.original._id}`);
                      }
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        },
        {
          accessor: 'customerAccount',
          Header: resources?.customerAccount?.titleSingular,
          Cell: ({ row }) => (
            <>
              {row?.original?.customerAccount ? (
                <div className="flex items-center gap-1">
                  <p className="text-truncate"> {row.original.customerAccount}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.customerAccountDetail.path}/${row.original.customerAccountId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        },
        {
          accessor: 'warehouse',
          Header: resources?.warehouse?.titleSingular,
          Cell: ({ row }) => (
            <>
              {row?.original?.warehouse ? (
                <div className="flex items-center gap-1">
                  <p className="text-truncate"> {row.original.warehouse}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.warehouseDetail.path}/${row.original.warehouseId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        },
        {
          accessor: 'startDate',
          Header: 'Start Date',
          disableFilters: true,
          disableSortBy: false,
          Cell: ({ row }) => (
            <div>
              {row?.original?.startDate ? (
                <h5 className="text-truncate" title={displayDateTime(row?.original?.startDate)}>
                  {displayDateTime(row?.original?.startDate)}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        },
        {
          accessor: 'endDate',
          Header: 'End Date',
          disableFilters: true,
          disableSortBy: false,
          Cell: ({ row }) => (
            <div>
              {row?.original?.endDate ? (
                <h5 className="text-truncate" title={displayDateTime(row?.original?.endDate)}>
                  {displayDateTime(row?.original?.endDate)}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        }
      ]);
    } else {
      axiosInstance()
        .get(`/field?resource=${selectedResource.resource}`)
        .then(({ data: { data } }) => {
          const newColumns = generateColumns(renderedFrom, data, selectedResource.path);
          setColumns([...newColumns, ...getStaticFields()]);
        });
    }
  };

  useEffect(() => {
    if (selectedResource) {
      setRenderedFrom(`${routes[selectedResource.key].title}`);
      fetchGridColumns();
    } else {
      setColumns(null);
    }
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      fetchData();
    }
  }, [selectedResource, page, filters, limit, sorting, search, selectedAssets]);

  useImperativeHandle(ref, () => ({
    fetchData
  }));

  useEffect(() => {
    if (selectedResource?.resource === sidebarResource.serializedAsset) {
      setLookupLoading(true);
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.serializedAsset}`)
        .then(({ data: { data } }) => {
          setLookUpResource(data);
          setLookupLoading(false);
        })
        .catch((error) => {
          setLookupLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      setSelectedAssets([]);
    }
  }, [selectedResource]);

  const getQueryString = () => {
    if (selectedResource?.resource === sidebarResource?.serializedAsset) {
      let query = `?resource=${sidebarResource?.serializedAsset}&listView=true`;
      if (selectedAssets?.length) {
        query = `${query}&assetIds=${selectedAssets?.map((a) => a?.optionValue)?.toString()}`;
      }
      return query;
    }

    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    setQueryString(queryString);
    try {
      let data: any = [],
        count;
      const api =
        selectedResource?.resource === sidebarResource.serializedAsset
          ? `/planning-view${queryString}`
          : `${routes[selectedResource.key].path}${queryString}`;
      const response: any = await axiosInstance().get(api);

      data = response?.data?.data?.data ? response?.data?.data?.data : response?.data?.data;
      count = response?.data?.data?.count ? response?.data?.data?.count : response?.data?.count || data?.length;
      const rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        if (selectedResource?.resource === sidebarResource?.serializedAsset) {
          finalObject['resourceLabel'] = resources?.[camelCase(u?.resource)]?.titleSingular || u?.resource;
          finalObject['reference'] =
            u?.resource === sidebarResource?.rentalManagement
              ? u?.rentalJobName
              : u?.resource === sidebarResource?.planning
                ? u?.planningNumber
                : u?.resource === sidebarResource?.quotation
                  ? u?.quotationNumber
                  : '';
          finalObject['startDate'] = u?.resource === sidebarResource?.planning ? u?.startDate : u?.estimateStartDate;
          finalObject['endDate'] = u?.resource === sidebarResource?.planning ? u?.endDate : u?.estimateEndDate;
        }
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <div className="flex gap-2 max-[560px]:pt-[40px] min-[561px]:pr-[100px]">
        <Autocomplete
          options={resourceList}
          getOptionLabel={(option) => (option && option?.title) || ''}
          style={{ width: '350px' }}
          value={selectedResource}
          onChange={(event, newValue) => {
            setSelectedResource(newValue);
          }}
          size="small"
          renderInput={(params) => <TextField {...params} label="Select Resource" size="small" variant="outlined" />}
        />
        {selectedResource?.resource === sidebarResource?.serializedAsset && (
          <Autocomplete
            options={lookupResource ? lookupResource[sidebarResource?.serializedAsset] : []}
            multiple
            disableCloseOnSelect
            style={{ width: '300px' }}
            getOptionLabel={(option: any) => option?.optionLabel}
            value={selectedAssets}
            onChange={(event, newValue) => {
              setSelectedAssets(newValue);
            }}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Select ${resources?.serializedAsset?.titlePlural}`}
                variant="outlined"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {lookupLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }
                }}
              />
            )}
          />
        )}
      </div>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          hideSelection={true}
          hideAction={true}
          showFilters={selectedResource?.resource != sidebarResource?.serializedAsset}
          isClientSideGrid={selectedResource?.resource === sidebarResource?.serializedAsset}
          resource={selectedResource?.resource}
        />
      ) : selectedResource ? (
        <Box height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <Box mt={2}>
          <span>Please Select Resource</span>
        </Box>
      )}
    </>
  );
}

// export default ListView;
export default forwardRef(ListView);
