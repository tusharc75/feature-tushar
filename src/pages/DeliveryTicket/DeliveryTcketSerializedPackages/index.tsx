import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import { deliveryTicket, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const DeliveryTcketSerializedPackages = ({ deliveryTicketId, renderedFrom }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchColumns = async () => {
    const {fieldsDataForRead} = await fetch_resource_view_fields(sidebarResource.serializedPackages, false);
    const newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes.serializedPackagesDetail.path);
    setColumns([...newColumns, ...getStaticFields()]);
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      let data;
      const response = await axiosInstance().get(`${deliveryTicket.api}/${deliveryTicketId}/serialized-packages`);
      data = response?.data?.data;
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

  return (
    <Box mt={2}>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 150px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
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

export default DeliveryTcketSerializedPackages;
