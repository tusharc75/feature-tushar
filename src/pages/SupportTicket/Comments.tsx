import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import TinyMce from './../../components/TinyMCE';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import RefreshIcon from '@mui/icons-material/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDateTime } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useData } from 'src/StateProvider/Provider';
import AttachmentThumbnail from 'src/pages/SupportTicket/AttachmentThumbnail';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const Comments = ({ uniqueId, supportTicketData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const {
    state: { permissions },
  }: any = useData();
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [addComment, setAddComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setData(null);
    let url = `${routes.supportTicket.path}/${uniqueId}/comment`;
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        if (data && data?.length) {
          setData(data);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

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
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    setComment('');
  };

  return (
    <div className="relative">
      <div className='my-4'>
        <ThemeButton buttonType='theme' onClick={() => setAddComment(true)}>
          Add
        </ThemeButton>
        <span className="absolute right-0 top-0 z-[1] flex size-[40px] items-center justify-center rounded-full bg-[var(--dark-secondary,white)] shadow-md">
          <HtmlTooltip className="size-[30px]" title={'Refresh'}>
            <IconButton size="small" onClick={() => fetchData()} style={{ marginRight: '16px' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </span>
      </div>


      {data ? (
        <>
          <div className="[scrollbar-gutter: stable] relative mb-2 max-h-[calc(100vh-500px)] min-h-[300px] space-y-2 overflow-y-auto px-2">
            {data.length > 0 ? (
              data.map((item: any) => (
                <div key={item._id} className="rounded-md border p-2">
                  <p className="mb-2 flex flex-wrap gap-[10px] text-[13px] text-[var(--primary-text)] ">
                    <span className="font-semibold">{item?.user?.optionLabel}</span>
                    <span className="ml-2 text-[#969696] dark:text-gray-400">{displayDateTime(item.date)}</span>
                  </p>
                  <div
                    className="max-image [&_*:last-child]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: item?.comment
                    }}
                  />
                  {item?.attachments && item.attachments.length > 0 && (
                    <div className='mt-3'>
                      <AttachmentThumbnail
                        attachments={item.attachments}
                        handleDeleteAttachment={() => { }}
                        allowedToEdit={false}
                        brand={supportTicketData?.brand}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="absolute left-1/2 top-1/2 select-none text-gray-500 [transform:translate(-50%,-50%)]">No Data Found</div>
            )}
          </div>
          {permissions?.brandSupportTickets?.isUpdate && addComment && (
            <div>
              <div className="mb-3  ">
                {attachments.length > 0 && (
                  <AttachmentThumbnail // can be import from component
                    attachments={attachments}
                    handleDeleteAttachment={handleDeleteAttachment}
                    allowedToEdit={true}
                    brand={supportTicketData?.brand}
                  />
                )}
              </div>
              <div className="mb-3 ">
                <input
                  type='file'
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id='file-upload'
                  accept='*/*'
                />
                <label htmlFor='file-upload'>
                  <ThemeButton
                    component='span'
                    disabled={uploadingFiles}
                    isLoading={uploadingFiles}
                    buttonType='themeBorder'
                    startIcon={<AttachFileIcon fontSize='small' />}
                  >
                    Attach file(s)
                  </ThemeButton>
                </label>
              </div>
              <Grid size={{ xs: 12 }}>
                <TinyMce
                  id="comment"
                  onChange={(value) => {
                    setComment(value);
                  }}
                  initialValue={''}
                  height={200}
                  doNotShowUploadFile={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }} className="mt-2 ">
                <ThemeButton disabled={comment === '' && attachments.length === 0} buttonType="theme" onClick={handleSubmit}>
                  Send
                </ThemeButton>
              </Grid>
            </div>
          )}
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </div>
  );
};
export default Comments;
