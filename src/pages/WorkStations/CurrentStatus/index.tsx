import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { displayDate, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';

const renderedFrom = `${camelCase(sidebarResource.workStations)}_activeService`;

const CurrentStatus = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const { page, limit, search, filters } = state;

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [id, page, limit, filters]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
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
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes.workStations.path}/current-status/${id}${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          return {
            ...finalObject,
            assignedUsers: u.assignedUsers
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

  const fetchColumns = async () => {
    let column: any = [
      {
        accessor: 'workorder',
        Header: 'Work Order',
        Cell: ({ row }) =>
          row?.original?.workOrderNumber ? (
            <div>
              <Link
                className="link text-truncate"
                title={row?.original?.workOrderNumber}
                to={`${routes?.workOrderDetail?.path}/${row?.original?.workOrderId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row?.original?.workOrderNumber}
              </Link>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'service',
        Header: 'Service',
        Cell: ({ row }) =>
          row?.original?.service ? (
            <div>
              <Link
                className="link text-truncate"
                title={row?.original?.service}
                to={`${routes?.serviceMasterDetail?.path}/${row?.original?.serviceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row?.original?.service}
              </Link>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'assignedUsers',
        Header: 'Assigned Technician',
        filter: false,
        width: 200,
        Cell: ({ row }) =>
          row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            <div>
              {row?.original['assignedUsers']?.map((e, i) => {
                return i === row?.original['assignedUsers'].length - 1 ? (
                  <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                    {e?.optionLabel}
                  </a>
                ) : (
                  <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                    {e?.optionLabel},{' '}
                  </a>
                );
              })}
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'createDate',
        Header: 'Create Date',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (row?.original?.createDate ? <div> {displayDate(row?.original?.createDate)} </div> : <NoDataCell />)
      },
      {
        accessor: 'estimateCompleteDate',
        Header: 'Estimate Complete Date',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (row?.original?.estimateCompleteDate ? <div> {displayDate(row?.original?.estimateCompleteDate)} </div> : <NoDataCell />)
      },
      {
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row }) => (row?.original?.status ? <div> {row?.original?.status} </div> : <NoDataCell />)
      }
    ];
    setColumns([...column]);
  };

  return (
    <Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showOnlyShowFilteredRecordSwitch={false}
          showFilters={false}
          resource={sidebarResource.workStations}
          hideAction={true}
          hideSelection={true}
        />
      ) : (
        <div className="p-2">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </div>
      )}
    </Box>
  );
};

export default CurrentStatus;
