import { useState, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CircularProgress, Dialog } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ZipUploadDialog = ({ open, onClose, onSubmit }) => {
  const toastConfig = useContext(CustomToastContext);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed')) {
      setIsUploading(true);
      try {
        await onSubmit(file); 
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setIsUploading(false); 
      }
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <CustomDialogHeader title="Upload ZIP File" onClose={onClose} />
      <CustomDialogContent>
        <Box mt={2} mb={1}>
          <input
            id="zip-upload"
            name="zip-upload"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={handleFileChange}
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
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </label>
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ZipUploadDialog;
