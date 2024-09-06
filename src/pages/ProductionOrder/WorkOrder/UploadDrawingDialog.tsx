import { useState, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CircularProgress, Dialog } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, productionOrder } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';

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
            <Button
              variant="contained"
              color="primary"
              component="span"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={24} /> : null}
            >
              {isUploading ? 'Uploading...' : 'Select File *'}
            </Button>
          </label>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button type="button" variant="outlined" color="primary" size="small" onClick={handleClose}>
          Cancel
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default UploadDrawingDialog;
