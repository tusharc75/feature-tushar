import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography, useMediaQuery } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ShowFileUploader from 'src/components/ShowFileUploader';
import { b64toBlob, cn } from 'src/constants/helpers';
import Editor, { EditorRef } from 'src/pages/WorkOrder/Diagram/ImageEditor/Editor';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ToastImageEditor = ({ data, fetchData, setSelectedFile, handleClose = null, uploads, setUploads }) => {
  const toastConfig = useContext(CustomToastContext);

  const editorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    loadImage();
  }, [data]);

  const loadImage = async () => {
    try {
      const response = await axiosInstance().get('/user/download?fileName=' + encodeURIComponent(data?.fileName), {
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
    const instance = editorRef.current.getInstance();
    const imageData = instance.toDataURL();
    const blob: any = b64toBlob(imageData);
    const type = `image/${data?.fileName?.split('.')[1]}`;
    const file: any = new File([blob], data?.name, { type });

    handleClose()
    if (file) {
      const newUploads = [{ file, progress: 0, status: 'uploading', _id: Math.random().toString(36).substring(7) }]
      setUploads((prev) => [...prev, ...newUploads]);

      await Promise.allSettled(
        newUploads.map(({ file, _id }) => {
          return new Promise(async (resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('_id', data?._id)

            let fake = 0;
            const fakeInterval = setInterval(() => {
              fake = Math.min(fake + Math.random() * 15, 90);
              setUploads((prev) => prev.map((u) => (u?._id === _id ? { ...u, progress: Math.round(fake) } : u)));
            }, 200);

            axiosInstance()
              .put(`/attachment-new/replace`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              .then(({ data }) => {
                clearInterval(fakeInterval);
                setUploads((prev) => prev.map((u) => (u?._id === _id ? { ...u, status: 'completed', progress: 100 } : u)));
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data.message
                });
                resolve('success');
              })
              .catch((error) => {
                clearInterval(fakeInterval);
                setUploads((prev) => prev.map((u) => (u?._id === _id ? { ...u, status: 'failed' } : u)));
                toastConfig.setToastConfig(error);
                reject('failed');
              });
          });
        })
      );
    }
    fetchData()
  };

  const handleDownload = () => {
    if (!editorRef.current) return;
    const instance = editorRef.current.getInstance();
    const dataUrl = instance.toDataURL();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.setAttribute('download', data?.fileName);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="h-screen">
      <head className="flex items-center justify-between gap-2 border-b px-4 py-3">
        {data.name && <h6 className="line-clamp-1 text-base font-semibold">{data.name}</h6>}
        <div className="flex items-center gap-2">
          <ThemeButton disabled={loading} isLoading={false} buttonType="theme" onClick={handleSave}>
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
      <ShowFileUploader uploads={uploads} setUploads={setUploads} />
    </div>
  );
};

export default ToastImageEditor;
