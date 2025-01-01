import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, productionOrder } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { Dialog } from '@mui/material';

const UploadDrawingDialog = ({ productionOrderData, handleClose }) => {
  const toastConfig = useContext(CustomToastContext);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      axiosInstance()
        .put(`${productionOrder.api}/upload-drawing/${productionOrderData?._id}`, formData)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleClose();
        })
        .catch((error) => {
          event.target.value = '';
          setIsUploading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" TransitionComponent={CustomDialogTransition} fullWidth>
      <CustomDialogHeader showRequiredLabel={false} title="Upload Drawings" onClose={handleClose} />
      <CustomDialogContent>
        <Box mt={2} mb={1}>
          <input
            id="zip-upload"
            name="zip-upload"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed,application/pdf,.pdf,image/jpeg,image/png,image/gif,image/bmp"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="zip-upload">
            <ThemeButton disabled={isUploading} isLoading={isUploading} buttonType="theme">
              {isUploading ? 'Uploading...' : 'Select File *'}
            </ThemeButton>
          </label>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={handleClose}>
          Cancel
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default UploadDrawingDialog;
