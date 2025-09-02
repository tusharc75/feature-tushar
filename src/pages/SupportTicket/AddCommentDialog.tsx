import { Dialog, DialogContent, Grid } from '@mui/material';
import { useState, useContext } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import TinyMce from 'src/components/TinyMCE';
import AttachmentThumbnail from 'src/pages/SupportTicket/AttachmentThumbnail';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

interface AddCommentDialogProps {
  onClose: () => void;
  supportTicketData: any;
  uniqueId: string;
  fetchData: () => void;
}

const AddCommentDialog = ({ onClose, supportTicketData, uniqueId, fetchData }: AddCommentDialogProps) => {
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length === 0) return;
    setUploadingFiles(true);
    const uploadedFiles = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance().post(`/user/upload?brand=${supportTicketData?.brand}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data.fileName) {
          uploadedFiles.push({
            name: file.name,
            url: response.data.fileName,
            contentType: file.type,
            size: file.size,
          });
        }
      }
      setAttachments((prev) => [...prev, ...uploadedFiles]);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Files uploaded successfully',
      });
    } catch (error) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Failed to upload files',
      });
    } finally {
      setUploadingFiles(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = (attachmentToDelete) => {
    setAttachments((prev) => prev.filter((att) => att !== attachmentToDelete));
    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: 'Attachment removed',
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    axiosInstance()
      .post(`${routes.supportTicket.path}/${uniqueId}/comment`, {
        comment: comment,
        attachments: attachments
      })
      .then(({ data: { data } }) => {
        fetchData();
        setAttachments([]);
        onClose();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    setComment('');
  };

  return (
    <Dialog open={true} maxWidth="md" fullWidth>
      <CustomDialogHeader title="Add Comment" onClose={onClose} />
      <DialogContent>
        <div >
          <Grid container spacing={2} style={{ marginTop: '8px' }}>
            <Grid item xs={12}>
              <TinyMce
                id="comment-dialog"
                onChange={(value) => {
                  setComment(value);
                }}
                initialValue={''}
                height={200}
                doNotShowUploadFile={true}
              />
            </Grid>
          </Grid>
          <div className="mb-3">
            {attachments.length > 0 && (
              <AttachmentThumbnail
                attachments={attachments}
                handleDeleteAttachment={handleDeleteAttachment}
                allowedToEdit={true}
                brand={supportTicketData?.brand}
              />
            )}
          </div>
          <div className="mb-3">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload-dialog"
              accept="*/*"
            />
            <label htmlFor="file-upload-dialog">
              <ThemeButton
                component="span"
                disabled={uploadingFiles}
                isLoading={uploadingFiles}
                buttonType="themeBorder"
                startIcon={<AttachFileIcon fontSize="small" />}
              >
                Attach file(s)
              </ThemeButton>
            </label>
          </div>
        </div>
      </DialogContent>
      <CustomDialogFooter>
        <ThemeButton
          disabled={comment === '' && attachments.length === 0}
          buttonType="theme"
          onClick={handleSubmit}
        >
          Send
        </ThemeButton>
        <ThemeButton buttonType="themeBorder" onClick={onClose}>
          Cancel
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AddCommentDialog;
