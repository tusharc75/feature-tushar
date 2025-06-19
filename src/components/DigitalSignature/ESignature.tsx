import { useState, useContext } from 'react';
import {
  Button,
  Dialog,
  Autocomplete,
  TextField,
  Box,
} from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';

const ESignatureDialog = ({ attachmentId, allAttachments, open, onClose }: any) => {
  const [signatureRequestData, setSignatureRequestData] = useState({
    emails: [] as string[],
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  const handleSignatureRequestSubmit = async () => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = signatureRequestData.emails.filter(
        (email) => !emailRegex.test(email)
      );

      if (invalidEmails.length) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: `Invalid emails: ${invalidEmails.join(', ')}`,
        });
        return;
      }

      setLoading(true);
      const response = await axiosInstance().post('/esignature/send-for-signature', {
        attachmentId,
        emails: signatureRequestData.emails,
        comment: signatureRequestData.comment,
        selectedAttachments: allAttachments,
      });

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: response.data.message || 'Files sent for signature successfully',
      });

      onClose();
      setLoading(false);
    } catch (error: any) { 
      setLoading(false);
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: error.response?.data?.message || 'An error occurred',
      });
    }
  };

  const handleSignatureRequestClose = () => {
    setSignatureRequestData({
      emails: [],
      comment: '',
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleSignatureRequestClose}
      fullWidth={true}
      maxWidth="sm"
    >
      <CustomDialogHeader
        onClose={handleSignatureRequestClose}
        title="Send for Signature"
        showManimizeMaximize={false}
        showRequiredLabel={false}
      />

      <CustomDialogContent dividers>
        <Box sx={{ mt: 2 }}>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={signatureRequestData.emails}
            onChange={(event, newValue) => {
              setSignatureRequestData({
                ...signatureRequestData,
                emails: newValue as string[],
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Emails"
                variant="outlined"
                margin="normal"
                placeholder="Add email and press Enter"
              />
            )}
          />
          <TextField
            fullWidth
            label="Comment"
            variant="outlined"
            margin="normal"
            multiline
            rows={4}
            value={signatureRequestData.comment}
            onChange={(e) =>
              setSignatureRequestData({ ...signatureRequestData, comment: e.target.value })
            }
          />
        </Box>
      </CustomDialogContent>

      <CustomDialogFooter>
        <Button onClick={handleSignatureRequestClose}>Cancel</Button>
        <Button
          onClick={handleSignatureRequestSubmit}
          disabled={!signatureRequestData.emails.length || loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ESignatureDialog;