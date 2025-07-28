import { CustomDialogTransition } from 'src/constants/helpers';
import CreditMemoMaterial from 'src/pages/CreditMemo/Material';
import { Box, Dialog } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const MaterialDialog = ({ id, handleClose, allowedToEdit }) => {

  useEffect(() => {
    fetchData();
  }, [id]);

  const toastConfig = useContext(CustomToastContext);
  const [creditMemoData, setCreditMemoData] = useState(null);

  const fetchData = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.creditMemo.path}/${id}`);
      setCreditMemoData(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={creditMemoData?.creditMemoNumber}
          onClose={() => {
            handleClose();
          }}
          showRequiredLabel={false}
        />
        <CustomDialogContent isFooterPresent={false}>
          {creditMemoData ?
            <CreditMemoMaterial
              creditMemoData={creditMemoData}
              creditMemoFields={[]}
              allowedToEdit={allowedToEdit}
              fetchCreditMemoData={fetchData}
              fromInvoice={true}

            />
            : <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          }
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default MaterialDialog;
