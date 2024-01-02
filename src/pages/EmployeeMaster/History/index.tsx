import { useState, useEffect, useContext } from 'react';
import { Box, IconButton, TextField } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { dateFormat, employeeMaster, sidebarResource } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import moment from 'moment';
import { useData } from 'src/StateProvider/Provider';
import { Autocomplete } from '@material-ui/lab';

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
    title: routes.workOrder.title
  }
];

const History = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { limit, page } = state;
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceList, setResourceList] = useState([]);

  const columns = [
    {
      accessor: 'reference',
      Header: 'Reference',
      minWidth: 150,
      width: 150,
      primaryField: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.referenceType && row?.original?.referenceId ? (
            <div>
              {/* <h5 className="text-truncate" title={row?.original?.reference}>
                {row?.original?.reference}
              </h5> */}
              <div>{row?.original?.referenceId}</div>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${selectedResource.path}/${row?.original?.referenceId}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'service',
      Header: 'Service',
      minWidth: 150,
      width: 150,
      disabled: true,
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
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.startDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.startDate)?.format(dateFormat)}>
              {moment(row?.original?.startDate)?.format(dateFormat)}
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
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.endDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.endDate)?.format(dateFormat)}>
              {moment(row?.original?.endDate)?.format(dateFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      minWidth: 150,
      width: 150,
      Cell: ({ row }) => (
        <>
          {row?.original?.status ? (
            <h5 className="text-truncate" title={row?.original?.status}>
              {row?.original?.status}
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
  }, [id, selectedResource, page, limit]);

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}&referenceType=${selectedResource?.resource}` : '?';
    return deepFilter;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${employeeMaster.api}/history/${id}/${queryString}`)
      .then(({ data: { data, count } }) => {
        // data = data?.map((u, index) => ({
        //   ...u,
        //   _id: index + 1,
        //   id: index + 1,
        //   type: u?.referenceType,
        //   reference: u?.reference?.optionLabel,
        //   referenceId: u?.reference?.optionValue,
        //   service: u?.service?.optionLabel,
        //   serviceId: u?.service?.optionValue,
        //   date: u?.startDate
        // }));
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
      <div className={'flex justify-between align-items-center gap-1 w-full'}>
        <Autocomplete
          id="employeemaster-history"
          style={{ width: '300px' }}
          options={resourceList?.map((item) => item)}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" required={true} />}
          getOptionLabel={(option) => option?.title}
          onChange={(e, val) => {
            setSelectedResource(val);
          }}
          disableClearable={true}
          value={selectedResource}
        />
      </div>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={`${camelCase(routes?.employeeMaster.title)}_History`}
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
