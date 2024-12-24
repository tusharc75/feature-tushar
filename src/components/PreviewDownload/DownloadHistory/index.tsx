import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DownloadIcon from '@mui/icons-material/GetApp';
import { Box, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { FILE_PROCESS_STATUS, dateTimeFormat } from 'src/constants/helpers';
import moment from 'moment';
import SyncIcon from '@mui/icons-material/Sync';
import PreviewIcon from '@mui/icons-material/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

var apiCallInterval: any = null;

const DownloadHistory = ({ referenceId, resource, loadingType }) => {
  const toastConfig = useContext(CustomToastContext);

  const [historyData, setHistoryData] = useState(null);
  const [isDownloading, setIsDownloading] = useState({ loading: false, id: null });

  useEffect(() => {
    fetchData();
  }, [loadingType]);

  const fetchData = () => {
    axiosInstance()
      .get(`/pdf/async-download/${referenceId}/history?resource=${resource}`)
      .then(({ data: { data } }) => {
        setHistoryData(data);
        if (apiCallInterval) {
          clearInterval(apiCallInterval);
        }
        if (data?.length && data?.find((e) => e.status === FILE_PROCESS_STATUS.processing)) {
          apiCallInterval = setInterval(async () => {
            await fetchData();
          }, 30000);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const downloadFile = (data, type) => {
    const fileName = data?.file;
    setIsDownloading({ loading: true, id: data._id });
    axiosInstance()
      .get(`user/download?fileName=${fileName}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Downloaded Successfully',
              open: true,
              type: 'success'
            });
            setTimeout(() => {
              setIsDownloading({ loading: false, id: null });
            }, 2000);
          }
        }
      })
      .then(({ data }) => {
        if (type === 'Preview') {
          const blobData = new Blob([data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = fileURL;
          link.target = '_blank';
          link.style.display = 'none';
          link.click();
          toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewed Successfully.' });
        } else {
          const blobData = new Blob([data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          link.click();
          toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Downloaded Successfully.' });
        }
        setIsDownloading({ loading: false, id: null });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading({ loading: false, id: null });
      });
  };

  return (
    <Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
      {historyData && historyData?.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData?.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{moment(row?.createdBy?.date).format(dateTimeFormat)}</TableCell>
                    <TableCell>
                      <Typography variant="inherit">{row?.pdfType}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="inherit">{row?.status}</Typography>
                    </TableCell>
                    <TableCell>
                      {row?.status === FILE_PROCESS_STATUS.completed ? (
                        <>
                          <HtmlTooltip title="Preview">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                downloadFile(row, 'Preview');
                              }}
                            >
                              <PreviewIcon />
                            </IconButton>
                          </HtmlTooltip>
                          <HtmlTooltip title="Download">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                downloadFile(row, 'Download');
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </HtmlTooltip>
                        </>
                      ) : (
                        <SyncIcon className="rotate" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Grid>
  );
};

export default DownloadHistory;
