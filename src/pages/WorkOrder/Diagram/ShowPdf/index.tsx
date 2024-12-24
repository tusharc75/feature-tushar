import { Box, Button } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from 'src/components/Loader';

const ShowPdf = ({ data }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [url, seturl] = useState();

  const mimeTypeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg'
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    const fileName = data?.name || data?.url.split('/').pop();
    link.setAttribute('download', fileName);
    link.click();
  };

  const extension = data?.url.split('.').pop().toLowerCase();
  const mimeType = mimeTypeMap[extension] || 'application/octet-stream'; // Default to a binary type if unknown

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get(`user/download?fileName=${encodeURIComponent(data?.url)}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: mimeType });
        const fileURL: any = URL.createObjectURL(file);
        seturl(fileURL);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [data]);

  return (
    <Box height={'calc(100vh - 75px)'}>
      {loading ? (
        <Loader style={{ minHeight: 500 }} text="Loading..." />
      ) : (
        <>
          {mimeType !== 'application/pdf' && (
            <Box mb={2}>
              <Button onClick={handleDownload} variant="contained" color="primary">
                Download
              </Button>
            </Box>
          )}
          <iframe title={data?.name} src={url} width="100%" height="100%" frameBorder="0" scrolling="auto" contextMenu="none"></iframe>
        </>
      )}
    </Box>
  );
};

export default ShowPdf;
