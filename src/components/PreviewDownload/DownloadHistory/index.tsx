import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DownloadIcon from '@material-ui/icons/GetApp';
import { Box, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { FILE_PROCESS_STATUS, dateTimeFormat } from 'src/constants/helpers';
import moment from 'moment';

const DownloadHistory = ({ referenceId, resource, loadingType }) => {

    const toastConfig = useContext(CustomToastContext);

    const [historyData, setHistoryData] = useState(null);
    const [isDownloading, setIsDownloading] = useState({ loading: false, id: null })

    useEffect(() => {
        fetchData();
    }, [loadingType]);

    const fetchData = () => {
        axiosInstance().get(`/pdf/async-download/${referenceId}/history?resource=${resource}`)
            .then(({ data: { data } }) => {
                setHistoryData(data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const downloadFile = (data) => {
        setIsDownloading({ loading: true, id: data._id });
        axiosInstance()
            .get(`user/download?fileName=${data?.file}`, {
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
                const file = new Blob([data], { type: 'application/pdf' });
                const fileURL = URL.createObjectURL(file);
                const pdfWindow = window.open();
                pdfWindow.location.href = fileURL;
                toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                setIsDownloading({ loading: false, id: null });
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setIsDownloading({ loading: false, id: null });
            });
    }

    return (<Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
        {historyData && historyData?.length > 0 &&
            <Box sx={{ display: 'flex', flexDirection: 'column' }}  >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historyData?.map((row) => (
                                <TableRow key={row._id}>
                                    <TableCell>{moment(row?.createdBy?.date).format(dateTimeFormat)}</TableCell>
                                    <TableCell>
                                        <Typography variant="inherit">{row?.status}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {row?.status === FILE_PROCESS_STATUS.completed ?
                                            <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={(e) => {
                                                    downloadFile(row);
                                                }}
                                            >
                                                <DownloadIcon />
                                            </IconButton>

                                            : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>}
    </Grid>
    );
};

export default DownloadHistory
