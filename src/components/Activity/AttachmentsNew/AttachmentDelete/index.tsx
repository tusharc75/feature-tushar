import { useContext, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Box, Dialog } from "@mui/material";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "src/constants/helpers";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import MultiLine from "src/components/Helpers/FormTypes/MultiLine";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { ThemeButton } from "src/components/Helpers/Buttons";

const AttachmentDelete = ({ deleteRequest = false, attachments = [], onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (value) => {
    setComment(value);
  };

  const handleDelete = async () => {
    if (attachments.length > 0) {
      setIsSubmitting(true)
      axiosInstance()
        .put('/attachment-new/remove', { ids: attachments?.map((e) => e._id) })
        .then(({ data }) => {
          setIsSubmitting(false)
          onSuccess()
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false)
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleDeleteRequest = () => {
    setIsSubmitting(true);
    axiosInstance().put('/attachment-new/delete-request', { ids: attachments?.map((e) => e?._id), comment: comment, type: 'create' })
      .then(({ data }) => {
        setIsSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };


  return (
    deleteRequest ? (
      <Dialog
        maxWidth="sm"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
        onClose={(e, reason) => { }}
      >
        <>
          <CustomDialogHeader
            onClose={onClose}
            title={`Delete Request (${attachments?.map((e) => e?.createdBy?.user?.concatedName).join(', ')})`}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
          />
          <CustomDialogContent>
            <Box>
              <MultiLine
                label="Comment"
                onChange={handleChange}
                value={comment}
              />
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton buttonType="transparent" disabled={isSubmitting} onClick={onClose}>
              Cancel
            </ThemeButton>
            <ThemeButton
              disabled={isSubmitting}
              isLoading={isSubmitting}
              buttonType="theme"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteRequest();
              }}
            >
              Request
            </ThemeButton>
          </CustomDialogFooter>
        </>
      </Dialog>
    ) : (
      <ConfirmationDialog
        open={true}
        message={`Are you sure you want to delete ${attachments?.map((e) => e?.name).join(', ')}?`}
        okBtnLoading={isSubmitting}
        onClose={onClose}
        onOk={() => {
          handleDelete();
        }}
      />
    )

  )
}

export default AttachmentDelete;
