import { useEffect, useContext } from 'react';
import { Box, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { dateTimeFormat, employeeMaster, sidebarResource } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import moment from 'moment';

const History = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* <h5 className="text-truncate" title={row?.original?.reference}>
                {row?.original?.reference}
              </h5> */}
              {row?.original?.referenceId && (
                <Box ml={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const route =
                        row?.original?.referenceType === sidebarResource.fieldTicket
                          ? routes.fieldTicketDetail.path
                          : row?.original?.referenceType === sidebarResource.rentalManagement
                          ? routes.rentalManagementDetail.path
                          : '';
                      window.open(`${route}/${row?.original?.referenceId}`);
                    }}
                  >
                    <OpenInNewIcon fontSize="small" color="primary" />
                  </IconButton>
                </Box>
              )}
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'referenceType',
      Header: 'Type',
      minWidth: 150,
      width: 150,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.referenceType ? (
            <h5 className="text-truncate" title={row?.original?.referenceType}>
              {row?.original?.referenceType}
            </h5>
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
      canFilter: false,
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
      canFilter: false,
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
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${employeeMaster.api}/history/${id}`)
      .then(({ data: { data } }) => {
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
        dispatch({ type: 'initialize', data: data, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={`${camelCase(routes?.employeeMaster.title)}_History`}
          isClientSideGrid={true}
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
