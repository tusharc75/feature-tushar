import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { b64toBlob, cn } from 'src/constants/helpers';
import Editor, { EditorRef } from 'src/pages/WorkOrder/Diagram/ImageEditor/Editor';

const ToastImageEditor = ({ data, fetchData, setSelectedAttachment, handleClose = null }) => {
  const editorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  // const [themeMode] = useAppTheme();

  useEffect(() => {
    loadImage();
  }, [data]);

  const loadImage = async () => {
    try {
      const response = await axiosInstance().get('/user/download?fileName=' + encodeURIComponent(data?.url), {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    setSubmitting(true);
    try {
      const instance = editorRef.current.getInstance();
      const imageData = instance.toDataURL();
      const blob: any = b64toBlob(imageData);
      const type = `image/${data?.url?.split('.')[1]}`;
      const file: any = new File([blob], data?.name, { type });
      let formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance().post('/user/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await axiosInstance().put(`/attachment/replace/${data?.attachmentId}`, {
        oldUrl: data?.url,
        url: res?.data?.fileName
      });
      setSelectedAttachment(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!editorRef.current) return;
    const instance = editorRef.current.getInstance();
    const dataUrl = instance.toDataURL();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.setAttribute('download', data?.url);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <Box>
      <head className="flex items-center justify-between gap-2 border-b px-4 py-3">
        {data.name && <h6 className="line-clamp-1 text-base font-semibold">{data.name}</h6>}
        <div className="flex items-center gap-2">
          <ThemeButton disabled={isSubmitting || loading} isLoading={isSubmitting} buttonType="theme" onClick={handleSave}>
            Save
          </ThemeButton>
          <ThemeButton disabled={loading} onClick={handleDownload} buttonType="theme">
            Download
          </ThemeButton>
          {typeof handleClose === 'function' && (
            <IconButton size="small" color="primary" onClick={handleClose}>
              <Close />
            </IconButton>
          )}
        </div>
      </head>
      <main className={cn('-mt-[1px] h-[calc(100vh-59px)] w-full overflow-auto')}>
        {loading ? (
          <Box
            className="loading"
            sx={{
              height: '100%',
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
    </Box>
  );
};

export default ToastImageEditor;
