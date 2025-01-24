import { CustomDialogTransition } from 'src/constants/helpers';
import CreditMemoMaterial from 'src/pages/CreditMemo/Material';
import { Dialog } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const MaterialDialog = ({ creditMemoDetail, handleClose, allowedToEdit }) => {
  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={creditMemoDetail?.creditMemoNumber}
          onClose={() => {
            handleClose();
          }}
          showRequiredLabel={false}
        />
        <CustomDialogContent isFooterPresent={false}>
          <CreditMemoMaterial creditMemoData={creditMemoDetail} allowedToEdit={allowedToEdit} fetchCreditMemoData={() => { }} />
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default MaterialDialog;
