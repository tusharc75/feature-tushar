import { useState, useContext } from 'react';
import {
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
import MultiLine from 'src/components/Helpers/FormTypes/MultiLine';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const SendForSignatureDialog = ({ attachmentId, allAttachments, onClose }: any) => {

  const [initialData, setInitialData] = useState({ emails: [] as string[], comment: '' });
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  const handleSubmit = async () => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = initialData.emails.filter(
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
        emails: initialData.emails,
        comment: initialData.comment,
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
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm"
    >
      <CustomDialogHeader
        onClose={onClose}
        title="Send for Signature"
        showManimizeMaximize={false}
        showRequiredLabel={false}
      />
      <CustomDialogContent dividers>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={initialData.emails}
          onChange={(event, newValue) => {
            setInitialData({
              ...initialData,
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
              size='small'
              required
              placeholder="Add email and press Enter"
            />
          )}
        />
        <Box mt={2}>
          <MultiLine
            label="Comment"
            onChange={(value) => {
              setInitialData({ ...initialData, comment: value })
            }}
            value={initialData.comment}
            required={false}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType='transparent' onClick={onClose}>Cancel</ThemeButton>
        <ThemeButton
          buttonType="theme"
          onClick={handleSubmit}
          isLoading={loading}
          disabled={!initialData?.emails?.length || loading}
        >
          Send
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default SendForSignatureDialog;