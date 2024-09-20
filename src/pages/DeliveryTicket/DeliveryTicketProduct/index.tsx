import { useEffect, useContext } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box } from '@material-ui/core';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { gridLoadingTimeout, prepareDataForGrid, deliveryTicket } from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';

const DeliveryTicketProduct = ({ renderedFrom, deliveryTicketId, columns }) => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      let data;
      if (isOffline) {
        const deliveryTicket = await findOne(objectStore.deliveryTicket, deliveryTicketId);
        const response = await findOne(objectStore.rentalManagement, deliveryTicket?.rentalJob?.optionValue);
        const product = deliveryTicket?.products?.map((e) => e.product);
        data = response?.material?.filter((d) => product?.includes(d.materialId)).map((obj) => obj.productDetail);
        data?.forEach((ele) => {
          const res = deliveryTicket?.products?.filter((e) => e.product === ele._id);
          if (res.length) {
            ele.qty = res[0].qty;
          }
        });
      } else {
        const response = await axiosInstance().get(`${deliveryTicket.api}/${deliveryTicketId}/products`);
        data = response?.data?.data;
      }
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
          refreshGrid={fetchProduct}
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

export default DeliveryTicketProduct;
