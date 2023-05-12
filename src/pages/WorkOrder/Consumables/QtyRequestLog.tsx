import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateTimeFormat } from 'src/constants/helpers';

function QtyRequestLog({ onClose, workOrderId, uniqueId }) {

  const [fullScreen, setFullScreen] = useState(false);

  const toastConfig = useContext(CustomToastContext);
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [workOrderId, uniqueId]);

  const fetchData = () => {
    axiosInstance().get(`/material-handling/request/${workOrderId}`)
      .then(({ data: { data } }) => {
        setRequestData(data?.filter((e) => e.uniqueId === uniqueId))
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (<Dialog
    open
    fullScreen={fullScreen}
    maxWidth="md"
    fullWidth
    onClose={(e, reason) => {
      if (reason !== 'backdropClick') {
        onClose();
      }
    }}
  >
    <CustomDialogHeader
      title={'Logs'}
      onClose={onClose}
      isMinimized={!fullScreen}
      onMinimizeMaximize={() => {
        setFullScreen((prevState) => !prevState);
      }}
      showManimizeMaximize={true}
    />

    <CustomDialogContent>
      {requestData ?
        <Box p={2}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Request By</TableCell>
                  <TableCell>Responce By</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requestData?.map((data, index) => {
                  return <TableRow key={index}>
                    <TableCell scope="row">{data?.product?.optionLabel}</TableCell>
                    <TableCell scope="row">{data?.qty}</TableCell>
                    <TableCell scope="row">
                      <Typography variant='body2'>{data?.requestBy?.optionLabel}</Typography>
                      <Typography variant='body2'>{moment(data?.requestDate)?.format(dateTimeFormat)}</Typography>
                    </TableCell>
                    <TableCell scope="row">
                      {data?.responseBy ?
                        <>
                          <Typography variant='body2'>{data?.responseBy?.optionLabel}</Typography>
                          <Typography variant='body2'>{moment(data?.responseBy)?.format(dateTimeFormat)}</Typography>
                        </> :
                        <span>---</span>
                      }
                    </TableCell>
                    <TableCell scope="row">
                      {data?.status}
                    </TableCell>
                  </TableRow>
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box> :
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}
    </CustomDialogContent>
  </Dialog>
  );
}

export default QtyRequestLog;
