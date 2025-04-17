import { useRef, useEffect, useState, useMemo } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ImageEditor from '@toast-ui/react-image-editor';
import 'tui-image-editor/dist/tui-image-editor.min.css';
import axiosInstance from 'src/axios/axiosInstance';
import { b64toBlob, cn } from 'src/constants/helpers';
import './hide-watermark.css';
import { Close } from '@mui/icons-material';
import { useAppTheme } from 'src/constants/AppConfig';

type ThemeConfig = {
  'common.bi.image'?: string;
  'common.bisize.width'?: string;
  'common.bisize.height'?: string;
  'common.backgroundImage'?: string;
  'common.backgroundColor'?: string;
  'common.border'?: string;
  'header.backgroundImage'?: string;
  'header.backgroundColor'?: string;
  'header.border'?: string;
  'loadButton.backgroundColor'?: string;
  'loadButton.border'?: string;
  'loadButton.color'?: string;
  'loadButton.fontFamily'?: string;
  'loadButton.fontSize'?: string;
  'downloadButton.backgroundColor'?: string;
  'downloadButton.border'?: string;
  'downloadButton.color'?: string;
  'downloadButton.fontFamily'?: string;
  'downloadButton.fontSize'?: string;
  'menu.normalIcon.path'?: string;
  'menu.normalIcon.name'?: string;
  'menu.activeIcon.path'?: string;
  'menu.activeIcon.name'?: string;
  'menu.iconSize.width'?: string;
  'menu.iconSize.height'?: string;
  'submenu.backgroundColor'?: string;
  'submenu.partition.color'?: string;
  'submenu.normalIcon.path'?: string;
  'submenu.normalIcon.name'?: string;
  'submenu.activeIcon.path'?: string;
  'submenu.activeIcon.name'?: string;
  'submenu.iconSize.width'?: string;
  'submenu.iconSize.height'?: string;
  'submenu.normalLabel.color'?: string;
  'submenu.normalLabel.fontWeight'?: string;
  'submenu.activeLabel.color'?: string;
  'submenu.activeLabel.fontWeight'?: string;
  'checkbox.border'?: string;
  'checkbox.backgroundColor'?: string;
  'range.pointer.color'?: string;
  'range.bar.color'?: string;
  'range.subbar.color'?: string;
  'range.value.color'?: string;
  'range.value.fontWeight'?: string;
  'range.value.fontSize'?: string;
  'range.value.border'?: string;
  'range.value.backgroundColor'?: string;
  'range.title.color'?: string;
  'range.title.fontWeight'?: string;
  'colorpicker.button.border'?: string;
  'colorpicker.title.color'?: string;
};

const ToastImageEditor = ({ data, fetchData, setSelectedAttachment, handleClose = null }) => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [themeMode] = useAppTheme();

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

  const theme = useMemo(() => {
    if (themeMode === 'dark') {
      return {
        'common.bi.image': '',
        'common.bisize.width': '0px',
        'common.bisize.height': '0px',
        'common.backgroundImage': 'none',
        'common.backgroundColor': '#000000',
        'common.border': '1px solid #3d3d5c'
      } as ThemeConfig;
    }
    return {
      'common.bi.image': '',
      'common.bisize.width': '0px',
      'common.bisize.height': '0px',
      'common.backgroundImage': 'none',
      'common.backgroundColor': '#fff',
      'common.border': '1px solid #dee2e6'
    } as ThemeConfig;
  }, [themeMode]);

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
            <ImageEditor
              key={themeMode}
              ref={editorRef}
              includeUI={{
                loadImage: {
                  path: imageUrl,
                  name: data?.name
                },
                theme,
                menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
                uiSize: {
                  width: '100%',
                  height: '100%'
                },
                themeMode: 'white',

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
      </main>
    </Box>
  );
};

export default ToastImageEditor;
