import Box from '@material-ui/core/Box/Box';
import { useEffect } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
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
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    let data;
    const query = warehouse ? `?warehouse=${warehouse}&isAll=true` : `?isAll=true`;
    const response = await axiosInstance().get(`${productInventory.api}/serial-number/${product}${query}`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
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
            isClientSideGrid={true}
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
