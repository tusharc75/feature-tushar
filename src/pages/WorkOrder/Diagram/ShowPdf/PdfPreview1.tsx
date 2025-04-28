import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { b64toBlob, cn, convertBlobToBase64 } from 'src/constants/helpers';
import Editor, { EditorRef } from 'src/pages/WorkOrder/Diagram/ImageEditor/Editor';

const PdfPreview1 = ({ data, fetchData, setSelectedAttachment, handleClose = null }) => {
  const editorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [pageImages, setPageImages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editedPages, setEditedPages] = useState({});

  useEffect(() => {
    loadPdfPages();
  }, [data]);

  const loadPdfPages = async () => {
    try {
      const response = await axiosInstance().get(`/user/pdf`, {
        params: {
          fileName: data?.url,
          attachmentId: data?.attachmentId
        }
      });

      const images = response.data.map((bufferData) => {
        const buffer = new Uint8Array(bufferData.data);
        const blob = new Blob([buffer], { type: 'image/png' });
        return URL.createObjectURL(blob);
      });

      setPageImages(images);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const saveCurrentPageEdits = async () => {
    if (!editorRef.current) return;
    const instance = editorRef.current.getInstance();
    const editedDataUrl = instance.toDataURL({
      format: 'image/png',
      quality: 1.0
    });
    // Return the promise from setState to ensure it completes
    return new Promise(resolve => {
      setEditedPages(prev => {
        const updated = { ...prev, [currentPageIndex]: editedDataUrl };
        resolve(updated); // Resolve with the updated state
        return updated;
      });
    });
  };
  
  const handleSave = async () => {
    if (!editorRef.current) return;
    setSubmitting(true);
    try {
      // Wait for the current page edits to be saved AND get the updated editedPages
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
        fileName: data?.url,
        attachmentId: data?.attachmentId
      });
  
      await axiosInstance().put(`/attachment/replace/${data?.attachmentId}`, {
        oldUrl: data?.url,
        url: data?.url
      });
  
      setSelectedAttachment(null);
      fetchData();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    axiosInstance()
      .get(`/user/download?fileName=${encodeURIComponent(data?.url)}`, { responseType: 'blob' })
      .then((res) => {
        const blobData = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blobData);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${data?.url}`);
        link.click();
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
            Page {currentPageIndex + 1} of {pageImages.length}
            </Typography>
        </Box>
        <div className="flex items-center gap-2">
          <ThemeButton 
            disabled={currentPageIndex === 0 || loading} 
            onClick={handlePreviousPage}
          >
            Prev
          </ThemeButton>
          <ThemeButton 
            disabled={currentPageIndex === pageImages.length - 1 || loading} 
            onClick={handleNextPage}
          >
            Next
          </ThemeButton>
          <ThemeButton 
            disabled={isSubmitting || loading} 
            isLoading={isSubmitting} 
            buttonType="theme" 
            onClick={handleSave}
          >
            Save
          </ThemeButton>
          <ThemeButton 
            disabled={loading} 
            onClick={handleDownload} 
            buttonType="theme"
          >
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
            <Typography variant="h6">PDF Loading...</Typography>
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

export default PdfPreview1;
