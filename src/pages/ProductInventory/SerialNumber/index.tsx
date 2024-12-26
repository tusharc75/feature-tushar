import Box from '@mui/material/Box/Box';
import { useContext, useEffect } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import Grid from '@mui/material/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { displayDate, gridLoadingTimeout } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const renderedFrom = 'serialNumber_grid';

const SerialNumber = ({ product, warehouse }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting } = state;

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, warehouse]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (warehouse) {
      deepFilter = `${deepFilter}&warehouse=${warehouse}`;
    }

    if (product) {
      deepFilter = `${deepFilter}&products=${product}`;
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
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    let queryString = getQueryString();
    axiosInstance()
      .get(`/product-inventory/serial-number${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });

        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const columns = [
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.serialNumber ? (
            <h5 className="text-truncate" title={row?.original?.serialNumber}>
              {row?.original?.serialNumber}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
      disableFilters: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.warehouse ? (
            <h5 className="text-truncate" title={row?.original?.warehouse}>
              {row?.original?.warehouse}
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
      disabled: true,
      Cell: ({ row }) => (
        <h5 className="text-truncate" title={row?.original?.status}>
          {row?.original?.status}
        </h5>
      )
    },
    {
      accessor: 'createdBy',
      Header: 'Created By',
      disableFilters: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.createdBy ? (
            <h5 className="createBy" title={`${row?.original?.createdBy} • ${displayDate(row?.original?.createdByDate)}`}>
              {row?.original?.createdBy}
              <span className="hidden">&nbsp;-&nbsp;</span>
              <span className="createdAtTime badge-date">{displayDate(row?.original?.createdByDate)}</span>
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    }
  ];

  return (
    <>
      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
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
      </Grid>
    </>
  );
};

export default SerialNumber;
