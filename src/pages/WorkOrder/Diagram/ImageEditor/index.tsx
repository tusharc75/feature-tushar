import { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ImageEditor from '@toast-ui/react-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';
import axiosInstance from 'src/axios/axiosInstance';
import { b64toBlob } from 'src/constants/helpers';
import './hide-watermark.css';
import { Close } from '@mui/icons-material';

const ToastImageEditor = ({ data, fetchData, setSelectedAttachment, handleClose = null, fileName = '' }) => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

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
        {fileName && <h6 className="line-clamp-1 text-base font-semibold">{fileName}</h6>}
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
      <Box height={'calc(100vh - 59px)'} width={'calc(100vw)'} style={{ overflow: 'auto' }}>
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
            <ImageEditor
              ref={editorRef}
              includeUI={{
                loadImage: {
                  path: imageUrl,
                  name: data?.name
                },
                theme: {
                  'common.bi.image': '',
                  'common.bisize.width': '0px',
                  'common.bisize.height': '0px',
                  'common.backgroundImage': 'none',
                  'common.backgroundColor': '#000000',
                  'common.border': '1px solid #ddd'
                },
                menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
                uiSize: {
                  width: '98%',
                  height: '98%'
                },
                menuBarPosition: 'left'
              }}
              cssMaxHeight={window.innerHeight - 59}
              cssMaxWidth={window.innerWidth}
              selectionStyle={{
                cornerSize: 20,
                rotatingPointOffset: 70
              }}
              usageStatistics={false}
            />
          )
        )}
      </Box>
    </Box>
  );
};

export default ToastImageEditor;
