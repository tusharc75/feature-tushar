import { CustomDialogTransition } from 'src/constants/helpers';
import CreditMemoMaterial from 'src/pages/CreditMemo/Material';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import routes from 'src/components/Helpers/Routes';

const MaterialDialog = ({ creditMemoDetail, handleClose, allowedToEdit }) => {

  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={`${routes?.creditMemo.title}: ${creditMemoDetail?.creditMemoNumber}`}
          onClose={() => {
            handleClose();
          }}
          showRequiredLabel={false}
        />
        <CustomDialogContent isFooterPresent={false}>
          <CreditMemoMaterial creditMemoData={creditMemoDetail} allowedToEdit={allowedToEdit} />
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default MaterialDialog;
