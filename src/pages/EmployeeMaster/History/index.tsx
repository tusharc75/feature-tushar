import { useState, useEffect, useContext } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { displayDateTime, employeeMaster, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { FiExternalLink } from 'react-icons/fi';
import ContainedTabs, { ContainedTab } from 'src/components/CustomTabs/ContainedTab';

const renderedFrom = `${camelCase(sidebarResource.employeeMaster)}_History`;

const History = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, showFilteredRecordsOnly } = state;


  const [selectedResource, setSelectedResource] = useState(null);
  const [tabValue, setTabValue] = useState(null);


  const [resourceList, setResourceList] = useState([]);

  const TECHNICIAN_RESOURCE = [
    {
      key: 'fieldServiceOrder',
      resource: sidebarResource.fieldServiceOrder,
      path: routes.fieldServiceOrderDetail.path,
      title: resources?.fieldServiceOrder?.titleSingular
    },
    {
      key: 'fieldTicket',
      resource: sidebarResource.fieldTicket,
      path: routes.fieldTicketDetail.path,
      title: resources?.fieldTicket?.titleSingular
    },
    {
      key: 'rentalManagement',
      resource: sidebarResource.rentalManagement,
      path: routes.rentalManagementDetail.path,
      title: resources?.rentalManagement?.titleSingular
    },
    {
      key: 'workOrder',
      resource: sidebarResource.workOrder,
      path: routes.workOrderDetail.path,
      title: resources?.workOrder?.titleSingular
    },
  ];

  const columns = [
    {
      accessor: 'reference',
      Header: selectedResource?.title || 'Reference',
      minWidth: 150,
      width: 150,
      primaryField: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      cell: ({ row }) => (
        <>
          {row?.original?.reference?.optionValue ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.reference?.optionLabel}</div>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${selectedResource.path}/${row?.original?.reference?.optionValue}`);
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
      minWidth: 200,
      width: 200,
      disabled: true,
      cell: ({ row }) => (
        <div>
          {row?.original?.warehouse ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.warehouse?.optionLabel}</div>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouse?.optionValue}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'service',
      Header: 'Service',
      minWidth: 150,
      width: 150,
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      cell: ({ row }) => (
        <>
          {row?.original?.service ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.service?.optionLabel}</div>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serviceMasterDetail.path}/${row?.original?.service?.optionValue}`);
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
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      cell: ({ row }) => (
        <>
          {row?.original?.startDate ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.startDate)}>
              {displayDateTime(row?.original?.startDate)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      cell: ({ row }) => (
        <>
          {row?.original?.endDate ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.endDate)}>
              {displayDateTime(row?.original?.endDate)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    const options: any = [];
    TECHNICIAN_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push(item);
      }
    });
    setResourceList(options);
    if (options.length > 0) {
      setTabValue(options[0]?.key)
      setSelectedResource(options[0])
    }
  }, []);

  useEffect(() => {
    if (id || selectedResource) {
      fetchData();
    }
  }, [id, selectedResource, page, limit, filters, sorting, showFilteredRecordsOnly]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&referenceType=${selectedResource?.resource}`;
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
    return deepFilter;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${employeeMaster.api}/history/${id}/${queryString}`)
      .then(({ data: { data, count } }) => {
        dispatch({ type: 'initialize', data: data, count: count });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleMainTabChange = (event: any, newValue: any) => {
    setTabValue(newValue)
    setSelectedResource(TECHNICIAN_RESOURCE?.find((e) => e.key === newValue))
    dispatch({ type: 'pageChange', page: 0 });
  };

  return (
    <Box>
      <DetailsPageHeader
        isActionButtonVisible={false}
        isAddButtonVisible={false}
        leftSideContents={<LeftSideContents {...{ handleMainTabChange, dispatch, tabValue, resourceList }} />}
        hasXpadding={false}
      />
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default History;

const LeftSideContents = ({ tabValue, resourceList, handleMainTabChange }) => {
  return (
    <>
      <ContainedTabs value={tabValue} onChange={(e, value) => handleMainTabChange(e, value)}>
        {resourceList?.map((res, idx) => (
          <ContainedTab value={res.key} id={res.key} label={`${res.title}`} />
        ))}
      </ContainedTabs>
    </>
  );
};
