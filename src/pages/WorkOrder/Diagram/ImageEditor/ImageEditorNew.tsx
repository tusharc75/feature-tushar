import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { b64toBlob, cn } from 'src/constants/helpers';
import Editor, { EditorRef } from 'src/pages/WorkOrder/Diagram/ImageEditor/Editor';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const ToastImageEditor = ({ data, handleClose = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const editorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    loadImage();
  }, [data]);

  const loadImage = async () => {
    axiosInstance()
      .get(`/attachment-new/download?id=${data?._id}`, {
        responseType: 'blob'
      }).then(({ data }) => {
        const blob = new Blob([data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setLoading(false);
      }).catch(err => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      })
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    const instance = editorRef.current.getInstance();
    const imageData = instance.toDataURL();
    const blob: any = b64toBlob(imageData);
    const type = `image/${data?.fileName?.split('.')[1]}`;
    const file: any = new File([blob], data?.name, { type });
    if (file) {
      setIsSubmitting(true)

      const formData = new FormData();
      formData.append('file', file);
      formData.append('_id', data?._id)

      axiosInstance().put(`/attachment-new/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(() => {
        setIsSubmitting(false)
        loadImage()
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      }).catch(error => {
        setIsSubmitting(false)
        toastConfig.setToastConfig(error);
      })
    }
  };

  const handleDownload = () => {
    if (!editorRef.current) return;
    const instance = editorRef.current.getInstance();
    const dataUrl = instance.toDataURL();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.setAttribute('download', data?.name);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="h-screen">
      <head className="flex items-center justify-between gap-2 border-b px-4 py-3">
        {data.name && <h6 className="line-clamp-1 text-base font-semibold">{data.name}</h6>}
        <div className="flex items-center gap-2">
          <ThemeButton disabled={isSubmitting || loading} isLoading={isSubmitting} buttonType="theme" onClick={handleSave}>
            Save
          </ThemeButton>
          <ThemeButton disabled={isSubmitting || loading} onClick={handleDownload} buttonType="theme">
            Download
          </ThemeButton>
          {typeof handleClose === 'function' && (
            <IconButton size="small" color="primary" onClick={handleClose}>
              <Close />
            </IconButton>
          )}
        </div>
      </head>
      <main className={cn('-mt-[1px] w-full overflow-auto ')}>
        {loading ? (
          <Box
            className="loading h-[calc(100vh-60px)]"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h6">Image Loading...</Typography>
          </Box>
        ) : (
          imageUrl && (
            <Editor ref={editorRef} imageName={data?.name} imageUrl={imageUrl} maxHeight={window.innerHeight - 60} maxWidth={window.innerWidth} />
          )
        )}
      </main>
    </div>
  );
};

export default ToastImageEditor;
