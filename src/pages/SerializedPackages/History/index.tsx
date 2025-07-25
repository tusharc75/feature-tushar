import { useContext, useEffect } from 'react';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { displayDateTime, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { Box } from '@mui/material';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';

const History = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource?.serializedPackages)}_History`;

  const {
    state: { permissions, resources }
  }: any = useData();

  const columns = [
    {
      accessor: 'reference',
      Header: 'Reference',
      disableFilters: true,
      disableSortBy: false,
      disabled: true,
      Cell: ({ row }) => {
        const to =
          row?.original?.type === sidebarResource?.assemblyOrder
            ? routes.assemblyOrderDetail.path
            : row?.original?.type === sidebarResource?.serializedPackages
              ? routes?.serializedPackagesDetail.path
              : row?.original?.type === sidebarResource?.rentalManagement
                ? routes?.rentalManagementDetail?.path
                : ['Loading Ticket', 'Delivery Ticket']?.includes(row?.original?.type)
                  ? routes?.deliveryTicketDetail?.path
                  : null;
        return (
          <div>
            {row.original.reference ? (
              to ? (
                <Link
                  className="link"
                  title={row.original.reference}
                  to={`${to}/${row.original.referenceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.original.reference}
                </Link>
              ) : (
                <h5 className="text-truncate">{row.original.reference}</h5>
              )
            ) : (
              <NoDataCell />
            )}
          </div>
        );
      }
    },
    {
      accessor: 'type',
      Header: 'Type',
      Cell: ({ row }) => (row.original?.type ? <div>{row.original?.type}</div> : <NoDataCell />)
    },
    {
      accessor: 'date',
      Header: 'Date & Time',
      disabled: true,
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row.original?.date ? (
          <div className="createBy" title={`${displayDateTime(row.original?.date)}`}>
            {displayDateTime(row.original?.date)}
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (row.original?.status ? <div>{row.original?.status}</div> : <NoDataCell />)
    },
    {
      accessor: 'comments',
      Header: 'Comment',
      Cell: ({ row }) =>
        row.original?.comments ? (
          <div>
            <p title={row.original?.comments}>{row.original?.comments}</p>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
      Cell: ({ row }) => (
        <div>
          {row.original?.warehouse ? (
            permissions?.warehouse?.isRead ? (
              <Link
                className="link"
                title={row.original?.warehouse}
                to={`${routes.warehouseDetail.path}/${row.original?.warehouseId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original?.warehouse}
              </Link>
            ) : (
              <span>{row.original?.warehouse}</span>
            )
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'ownerType',
      Header: 'Owner Type',
      Cell: ({ row }) => (row.original?.ownerType ? <div>{row.original?.ownerType}</div> : <NoDataCell />)
    },
    {
      accessor: 'owner',
      Header: 'Owner',
      Cell: ({ row }) => (row.original?.owner ? <div>{row.original?.owner}</div> : <NoDataCell />)
    }
  ];

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting } = state;

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, page, limit, filters, sorting]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    const { deepFilters } = gridFilterParser(filters);

    if (deepFilters?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
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
      .get(`/history/serialized-package/${id}${queryString}`)
      .then(({ data: { data, count } }) => {
        const rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
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
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showFilters={false}
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
