import { useState, useEffect, useContext } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Box } from '@mui/material';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { fetch_rental_cost_fields } from 'src/components/RentalManagment/helper';

const DeliveryTicketAdditionalCost = ({ renderedFrom, additionalCost }) => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchAdditionalCost = async () => {
    try {
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });
      let data = additionalCost;
      let rows = data.map((u) => {
        let res = {
          ...prepareDataForGrid(u, user)
        };
        return res;
      });
      dispatch({ type: 'initialize', data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      toastConfig.setToastConfig(error);
      dispatch({ type: 'loading', loading: false });
    }
  };

  const fetchGridColumns = async () => {
    const fields = await fetch_rental_cost_fields('USD', isOffline);
    let columns = generateColumns(renderedFrom, fields, null, false, 'USD');
    setColumns(columns);
    fetchAdditionalCost();
  };

  return (
    <Box mt={2}>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 150px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchAdditionalCost}
          isClientSideGrid={true}
          hideSelection={true}
          hideAction={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default DeliveryTicketAdditionalCost;
