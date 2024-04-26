import Box from '@material-ui/core/Box/Box';
import { useEffect, useState } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { dateFormat, gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';

const SerialNumber = ({ product, warehouse }) => {
  const { state, dispatch } = useTableReducer();
  const { page, limit, filters, sorting} = state;
  const [ renderCount, setRenderCount] = useState(0);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    if(renderCount > 0){
      fetchRecords();
    }else{
      setRenderCount(renderCount + 1);
    }
    
  }, [page, limit, filters, sorting]);

  const getQueryString = () => {
   let deepFilter = `&page=${page}&limit=${limit}`;
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


  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    let data;
    const queryString = getQueryString();
    const query = warehouse ? `?wareHouse=${warehouse}&isAll=true` : `?isAll=true`;
    const response = await axiosInstance().get(`${routes?.serialNumber?.path}${product}${query}${queryString}`);   
    // const response = await axiosInstance().get(`${productInventory.api}/serial-number/${product}${query}`);
    data = response?.data?.data;
    let count = response?.data?.count;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };
  const columns = [
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
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
      Header: routes.warehouse.title,
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
      accessor: 'active',
      Header: 'Status',
      Cell: ({ row }) => (
        <h5 className="text-truncate" title={row?.original?.warehouse}>
          {row?.original?.active ? 'Available' : 'Unavailable'}
        </h5>
      )
    },
    {
      accessor: 'createdBy',
      Header: 'Created By',
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.createdBy ? (
            <h5 className="createBy" title={`${row?.original?.createdBy} • ${moment(row?.original?.createdByDate).format(dateFormat)}`}>
              {row?.original?.createdBy}
              <span className="createdAtTime badge-date">{moment(row?.original?.createdByDate)?.format(dateFormat)}</span>
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
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={'serialNumber_grid'}
            refreshGrid={fetchRecords}
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
