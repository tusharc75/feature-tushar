import { Box } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from 'src/components/Loader';

const ShowPdf = ({ data }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [url, seturl] = useState();

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get(`user/download?fileName=${data?.url}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
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
        <iframe title={data?.name} src={url} width="100%" height="100%" frameBorder="0" scrolling="auto" contextMenu="none"></iframe>
      )}
    </Box>
  );
};

export default ShowPdf;
