import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import moment from 'moment';
import { MATERIAL_REQUEST_STATUS, dateTimeFormat } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';

const Request = ({ workOrder }) => {

  const toastConfig = useContext(CustomToastContext);
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [workOrder]);

  const handleUpdateStatus = (status, ids) => {
    axiosInstance()
      .put(`/material-handling/status/${workOrder}`, { status, ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData()
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = () => {
    axiosInstance().get(`/material-handling/request/${workOrder}`)
      .then(({ data: { data } }) => {
        setRequestData(data)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (requestData ?
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
                  {data?.status === MATERIAL_REQUEST_STATUS.requested ?
                    <Box display='flex'>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                          handleUpdateStatus(MATERIAL_REQUEST_STATUS.processed, [{ _id: data?._id, uniqueId: data?.uniqueId, qty: data?.qty }]);
                        }}
                      >
                        Process
                      </Button>
                      <Box pl={2} />
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          handleUpdateStatus(MATERIAL_REQUEST_STATUS.rejected, [{ _id: data?._id, uniqueId: data?.uniqueId, qty: data?.qty }]);
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                    :
                    <Typography variant='body2'>{data?.status}</Typography>
                  }
                </TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box> :
    <Box p={2} height={500} bgcolor="white">
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>
  );
};

export default Request;
