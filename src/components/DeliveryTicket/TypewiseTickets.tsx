import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import Grid from '@mui/material/Grid/Grid';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, deliveryTicket, sidebarResource, DELIVERY_FROM_TO_TYPE } from '../../constants/helpers';
import { prepareDataForGrid } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import routes from '../Helpers/Routes';
import { Link } from 'react-router-dom';
import PreviewDownloadMultiple from './PreviewDownloadMultiple';

const TypewiseTickets = ({ referenceType, referenceId, renderedFrom }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.deliveryTicket}`)
      .then(({ data: { data } }) => {
        let columns = [];
        data = data.filter((e) => !['productInventory', 'pickupFromType', 'deliveryToType'].includes(e?.fieldData?.fieldName));
        let newColumns = generateColumns(renderedFrom, data, routes.deliveryTicketDetail.path);
        columns = [...newColumns, ...getStaticFields()];
        columns = columns.filter((e) => !['warehouse', 'customerAccount', 'supplierAccount'].includes(e.field));
        columns.forEach((column) => {
          if (column.accessor === 'pickupFrom') {
            column.cell = ({ row }) => (
              <>
                <Link
                  className="link text-truncate"
                  title={row.original[column.accessor]}
                  target="_blank"
                  to={
                    row.original?.pickupFromType === DELIVERY_FROM_TO_TYPE.plant
                      ? `${routes.warehouseDetail.path}/${row.original.pickupFromId}`
                      : row.original?.pickupFromType === DELIVERY_FROM_TO_TYPE.customer
                        ? `${routes.customerAccountDetail.path}/${row.original?.pickupFromId}`
                        : `${routes.supplierAccountDetail.path}/${row.original?.pickupFromId}`
                  }
                >
                  {row.original[column.accessor]}
                </Link>
              </>
            );
          }
          if (column.accessor === 'deliveryTo') {
            column.cell = ({ row }) => (
              <>
                <Link
                  className="link text-truncate"
                  title={row.original[column.accessor]}
                  target="_blank"
                  to={
                    row.original?.deliveryToType === DELIVERY_FROM_TO_TYPE.plant
                      ? `${routes.warehouseDetail.path}/${row.original.deliveryToId}`
                      : row.original?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer
                        ? `${routes.customerAccountDetail.path}/${row.original?.deliveryToId}`
                        : `${routes.supplierAccountDetail.path}/${row.original?.deliveryToId}`
                  }
                >
                  {row.original[column.accessor]}
                </Link>
              </>
            );
          }
        });
        setColumns([...columns]);
        fetchRecords();
      });
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    let data;
    const response = await axiosInstance().get(`${deliveryTicket.api}/typewise?referenceType=${referenceType}&referenceId=${referenceId}`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject = prepareDataForGrid(u, user);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" p={1} pt={1} pb={0}>
        <PreviewDownloadMultiple referenceIds={selectedRecords.length > 0 ? selectedRecords.map((s) => s._id) : dataRows.map((d) => d._id)} />
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchRecords}
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

export default TypewiseTickets;
