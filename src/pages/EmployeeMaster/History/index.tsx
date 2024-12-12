import { useState, useEffect, useContext } from 'react';
import { Box, IconButton, TextField } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { dateTimeFormat, employeeMaster, sidebarResource } from 'src/constants/helpers';
import moment from 'moment';
import { useData } from 'src/StateProvider/Provider';
import { Autocomplete } from '@material-ui/lab';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { FiExternalLink } from 'react-icons/fi';


const renderedFrom = `${camelCase(routes?.employeeMaster.title)}_History`;

const History = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, showFilteredRecordsOnly } = state;
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceList, setResourceList] = useState([]);

  const TECHNICIAN_RESOURCE = [
    {
      key: 'fieldTicket',
      resource: sidebarResource.fieldTicket,
      path: routes.fieldTicketDetail.path,
      title: routes.fieldTicket.title
    },
    {
      key: 'workOrder',
      resource: sidebarResource.workOrder,
      path: routes.workOrderDetail.path,
      title: resources?.workOrder?.titlePlural
    },
    {
      key: 'rentalManagement',
      resource: sidebarResource.rentalManagement,
      path: routes.rentalManagementDetail.path,
      title: resources?.rentalManagement?.titlePlural
    }
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
      Cell: ({ row }) => (
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
      Cell: ({ row }) => (
        <div>
          {row?.original?.warehouse ? (
            <a className="link text-truncate" href={`${routes.warehouseDetail.path}/${row?.original?.warehouse?.optionValue}`} target="_blank">
              {row?.original?.warehouse?.optionLabel}
            </a>
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
      Cell: ({ row }) => (
        <>
          {row?.original?.service ? (
            <h5 className="text-truncate" title={row?.original?.service?.optionLabel}>
              {row?.original?.service?.optionLabel}
            </h5>
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
      Cell: ({ row }) => (
        <>
          {row?.original?.startDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.startDate)?.format(dateTimeFormat)}>
              {moment(row?.original?.startDate)?.format(dateTimeFormat)}
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
      Cell: ({ row }) => (
        <>
          {row?.original?.endDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.endDate)?.format(dateTimeFormat)}>
              {moment(row?.original?.endDate)?.format(dateTimeFormat)}
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
        options.push({ ...item, title: routes[item.key] ? routes[item.key]?.title : item.title });
      }
    });
    setResourceList(options);
    if (options.length > 0) setSelectedResource(options[0]);
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

  return (
    <Box>
      <DetailsPageHeader
        isActionButtonVisible={false}
        isAddButtonVisible={false}
        leftSideContents={<LeftSideContents {...{ setSelectedResource, dispatch, selectedResource, resourceList }} />}
        hasXpadding={false}
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

const LeftSideContents = ({ setSelectedResource, dispatch, selectedResource, resourceList }) => {
  return (
    <>
      <Autocomplete
        id="employeemaster-history"
        className="max-w-[400px]"
        fullWidth
        options={resourceList?.map((item) => item)}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" fullWidth margin="none" size="small" required={true} />}
        getOptionLabel={(option) => option?.title}
        onChange={(e, val) => {
          setSelectedResource(val);
          dispatch({ type: 'pageChange', page: 0 });
        }}
        disableClearable={true}
        value={selectedResource}
      />
    </>
  );
};
