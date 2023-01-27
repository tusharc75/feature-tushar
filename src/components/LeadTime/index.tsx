import { useState, useEffect } from 'react';
import { Box, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import LeadTimeAddDialog from './CustomLeadTimeDialog';

const LeadTimeMaster = ({ Id, type }) => {
  const [loadingPLT, setLoadingPLT] = useState(false);
  const [leadTimeData, setLeadTimeData] = useState(null);
  const [leadTimeDialogOpen, setLeadTimeDialogOpen] = useState(false);
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchLeadTimeData();
  }, [Id]);

  const apiMain = (type) => {
    switch (type) {
      case 'product':
        return 'product';
      case 'service':
        return 'service-master';
      case 'package':
        return 'packages';
    }
  };
  const fetchLeadTimeData = async () => {
    setLoadingPLT(true);

    axiosInstance()
      .get(`${apiMain(type)}/lead-time/${Id}`)
      .then(({ data: { data } }) => {
        setLeadTimeData(data);
        setLoadingPLT(false);
      })
      .catch((err) => {
        setLoadingPLT(false);
      });
  };

  const handleAddLeadTime = (leadTimeId) => {
    setAssigning(true);
    const valueType = type === 'package' ? 'packageId' : type;
    const value = {
      [valueType]: Id,
      leadTimeMaster: leadTimeId
    };
    axiosInstance()
      .post(`${apiMain(type)}/lead-time`, value)
      .then(() => {
        setAssigning(false);
        fetchLeadTimeData();
        setLeadTimeDialogOpen(false);
      })
      .catch((err) => {
        setAssigning(false);
        setLeadTimeDialogOpen(false);
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
              setLeadTimeDialogOpen(true);
            }}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        {leadTimeData?.steps?.length ? (
          <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={2}>
                <Typography variant="body1">Index</Typography>
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
        {leadTimeData?.steps?.length ? (
          leadTimeData?.steps?.map((steps, index) => (
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
        {leadTimeData?.steps?.length ? (
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
                <Typography variant="body2">{leadTimeData?.leadTimeDays || 0}</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : null}
      </Paper>
      {leadTimeDialogOpen && (
        <LeadTimeAddDialog
          title={'Assign Lead Time'}
          onClose={() => {
            setLeadTimeDialogOpen(false);
          }}
          handleAddLeadTime={handleAddLeadTime}
          isAssigning={isAssigning}
        />
      )}
    </>
  );
};

export default LeadTimeMaster;
