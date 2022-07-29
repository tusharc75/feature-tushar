import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import BoxWithBorder from '../../../components/BoxWithBorder';
import { Skeleton } from '@material-ui/lab';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import LeadTimeAddDialog from '../../../components/CustomLeadTimeDialog/CustomLeadTimeDialog';
import { AnyObject } from 'yup/lib/types';

const LeadTimeMaster = ({ product, productData }) => {
  const [loadingPLT, setLoadingPLT] = useState(false);
  const [productLeadTime, setProductLeadTime] = useState(null);
  const [addLeadTime, setAddLeadTime] = useState({ open: false, productId: null });
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchLeadTimeData();
  }, [product, productData]);
  const fetchLeadTimeData = async () => {
    setLoadingPLT(true);
    axiosInstance()
      .get(`product/lead-time/${product}`)
      .then(async ({ data: { data } }) => {
        setProductLeadTime(data);
        setLoadingPLT(false);
      })
      .catch((err) => {
        setLoadingPLT(false);
      });
  };

  const handleAddLeadTime = (leadTimeId) => {
    setAssigning(true);
    const value = {
      product: product,
      leadTimeMaster: leadTimeId
    };
    axiosInstance()
      .post(`product/lead-time`, value)
      .then(() => {
        setAssigning(false);
        fetchLeadTimeData();
        setAddLeadTime({ open: false, productId: null });
      })
      .catch((err) => {
        setAssigning(false);
        setAddLeadTime({ open: false, productId: null });
      });
  };

  return (
    <>
      <Paper style={{ overflow: 'hidden' }}>
        <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Lead Time</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setAddLeadTime({ open: true, productId: null });
            }}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        {productLeadTime?.steps?.length ? (
          <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={2}>
                <Typography variant="body1">#</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">Status</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1">Days</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : null}
        {productLeadTime?.steps?.length ? (
          productLeadTime?.steps?.map((steps, index) => (
            <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
              <Grid container>
                <Grid item xs={2}>
                  <Typography variant="body2">{index + 1}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{steps?.leadTimeStatus || ''}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">{steps?.days || 0}</Typography>
                </Grid>
              </Grid>
            </Box>
          ))
        ) : loadingPLT ? (
          <Box bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={6} justifyContent={'center'}>
                <Typography variant="body2">Loading ...</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={6} justifyContent={'center'}>
                <Typography variant="body2">No Data Found</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        {productLeadTime?.steps?.length ? (
          <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={2}>
                <Typography variant="body2"></Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                  Total
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">{productLeadTime?.leadTimeDays || 0}</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : null}
      </Paper>
      {addLeadTime.open && (
        <LeadTimeAddDialog
          title={'Assign Lead Time'}
          onClose={() => {
            setAddLeadTime({ open: false, productId: null });
          }}
          handleAddLeadTime={handleAddLeadTime}
          productId={addLeadTime.productId}
          isAssigning={isAssigning}
        />
      )}
    </>
  );
};

export default LeadTimeMaster;
