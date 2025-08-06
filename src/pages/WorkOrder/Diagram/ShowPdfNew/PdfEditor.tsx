import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, convertBlobToBase64 } from 'src/constants/helpers';
import Editor, { EditorRef } from 'src/pages/WorkOrder/Diagram/ImageEditor/Editor';
import { backendApi } from 'src/config';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const PdfEditor = ({ data, fetchData, setSelectedFile, handleClose = null }) => {
  const editorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [pageImages, setPageImages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editedPages, setEditedPages] = useState({});
  const [allPagesLoaded, setAllPagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    loadPdfPages();
  }, [data]);

  const loadPdfPages = async () => {
    try {
      setLoading(true);
      setAllPagesLoaded(false);
      setPageImages([]);
      setLoadingProgress({ current: 0, total: 0 });

      const headers = {
        Authorization: `Bearer ${localStorage.token}`
      };

      const response = await fetch(`${backendApi}/user/pdf?fileName=${encodeURIComponent(data?.fileName)}`, {
        method: 'GET',
        headers
      });

      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const images = [];
      let totalPages = 0;
      let completedPages = 0;

      while (true) {
        const { done, value } = await reader?.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const streamData = JSON.parse(line);

              switch (streamData?.type) {
                case 'metadata':
                  totalPages = streamData.totalPages;
                  images.length = totalPages;
                  setLoadingProgress({ current: 0, total: totalPages });
                  break;

                case 'page':
                  if (streamData?.success) {
                    const buffer = new Uint8Array(streamData?.imageBuffer?.data);
                    const blob = new Blob([buffer], { type: 'image/png' });
                    images[streamData?.pageIndex] = URL.createObjectURL(blob);
                    completedPages++;

                    setLoadingProgress({ current: completedPages, total: totalPages });
                    setPageImages([...images]);
                  } else {
                    toastConfig.setToastConfig({
                      open: true,
                      message: `Error loading page ${streamData?.pageIndex}: ${streamData?.error}`,
                      type: 'error'
                    });
                  }
                  break;

                case 'complete':
                  setLoading(false);
                  setAllPagesLoaded(true);
                  break;

                case 'error':
                  toastConfig.setToastConfig(streamData?.error);
              }
            } catch (error) {
              toastConfig.setToastConfig(error);
            }
          }
        }
      }
    } catch (err) {
      toastConfig.setToastConfig(err);
      setLoading(false);
      setAllPagesLoaded(false);
    }
  };

  const saveCurrentPageEdits = async () => {
    if (!editorRef.current) return;
    const instance = editorRef.current.getInstance();
    const editedDataUrl = instance.toDataURL({
      format: 'image/png',
      quality: 1.0
    });
    return new Promise((resolve) => {
      setEditedPages((prev) => {
        const updated = { ...prev, [currentPageIndex]: editedDataUrl };
        resolve(updated);
        return updated;
      });
    });
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    setSubmitting(true);
    try {
      const updatedEditedPages = await saveCurrentPageEdits();
      const imageData = [];
      for (let index = 0; index < pageImages.length; index++) {
        if (updatedEditedPages[index]) {
          imageData.push(updatedEditedPages[index]);
        } else {
          const originalImageUrl = pageImages[index];
          const dataUrl = await convertBlobToBase64(originalImageUrl);
          imageData.push(dataUrl);
        }
      }

      await axiosInstance().post('/user/pdf', {
        images: imageData,
        fileName: data?.fileName,
        attachmentId: data?._id
      });
      await axiosInstance().put(`/attachment/replace/${data?._id}`, {
        oldUrl: data?.fileName,
        url: data?.fileName
      });
      setSelectedFile(null);
      fetchData();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    axiosInstance()
      .get(`/user/download?fileName=${encodeURIComponent(data?.fileName)}`, { responseType: 'blob' })
      .then((res) => {
        const blobData = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blobData);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${data?.fileName}`);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const handleNextPage = async () => {
    await saveCurrentPageEdits();
    if (currentPageIndex < pageImages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePreviousPage = async () => {
    await saveCurrentPageEdits();
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  return (
    <Box>
      <head className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {data.name && <h6 className="line-clamp-1 text-base font-semibold">{data.name}</h6>}
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Page {currentPageIndex + 1} of {loadingProgress?.total || pageImages?.length}
            {!allPagesLoaded && loadingProgress?.total > 0 && (
              <span style={{ color: '#666', marginLeft: '8px' }}>({loadingProgress?.current} loaded)</span>
            )}
          </Typography>
        </Box>
        <div className="flex items-center gap-2">
          <ThemeButton disabled={currentPageIndex === 0 || loading} onClick={handlePreviousPage}>
            Prev
          </ThemeButton>
          <ThemeButton disabled={currentPageIndex === pageImages.length - 1 || loading || !pageImages[currentPageIndex + 1]} onClick={handleNextPage}>
            Next
          </ThemeButton>
          <ThemeButton disabled={isSubmitting || loading || !allPagesLoaded} isLoading={isSubmitting} buttonType="theme" onClick={handleSave}>
            Save
          </ThemeButton>
          <ThemeButton disabled={loading || !allPagesLoaded} onClick={handleDownload} buttonType="theme">
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
        {loading && pageImages?.length === 0 ? (
          <Box
            className="loading"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <Typography variant="h6">Loading PDF...</Typography>
          </Box>
        ) : (
          pageImages[currentPageIndex] && (
            <Editor
              ref={editorRef}
              imageName={data?.name}
              imageUrl={editedPages[currentPageIndex] || pageImages[currentPageIndex]}
              maxHeight={window.innerHeight - 72}
              maxWidth={window.innerWidth - 38}
            />
          )
        )}
      </main>
    </Box>
  );
};

export default PdfEditor;
