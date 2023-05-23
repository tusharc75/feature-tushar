import { useState, useEffect } from 'react';
import { Box, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import LeadTimeAddDialog from './CustomLeadTimeDialog';

const LeadTimeMaster = ({ Id, type, className = '', minHeight = null }) => {
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
      <Box className={`${className} single-form-v1`} style={{ overflow: 'hidden' }}>
        <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
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
        <Box className="formdata-v1" style={{ minHeight }}>
          {leadTimeData?.steps?.length ? (
            <Box width={'100%'}>
              <Grid container>
                <Grid item xs={2}>
                  <Typography className="table-head-v1 br-0" style={{ width: '100%' }} variant="body1">
                    Index
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className="table-head-v1  br-0" style={{ width: '100%' }} variant="body1">
                    Status
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography className="table-head-v1" style={{ width: '100%' }} variant="body1">
                    Days
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
          {leadTimeData?.steps?.length ? (
            leadTimeData?.steps?.map((steps, index) => (
              <Box key={index} width={'100%'}>
                <Grid container>
                  <Grid item xs={2}>
                    <Typography className="table-body-v1 bt-0 br-0" style={{ width: '100%' }} variant="body2">
                      {index + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className="table-body-v1  bt-0 br-0" style={{ width: '100%' }}>
                      {steps?.leadTimeStatus || ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography className="table-body-v1  bt-0" style={{ width: '100%' }}>
                      {steps?.days || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))
          ) : loadingPLT ? (
            <Box width={'100%'}>
              <Grid container>
                <Grid item xs={6} justifyContent={'center'}>
                  <Typography variant="body2">Loading ...</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box width={'100%'}>
              <Grid container>
                <Grid item xs={6} justifyContent={'center'}>
                  <Typography variant="body2">No Data Found</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {leadTimeData?.steps?.length ? (
            <Box width={'100%'}>
              <Grid container>
                <Grid item xs={2}>
                  <Typography variant="body2"></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography className="table-head-v1  bt-0 br-0" style={{ width: '100%' }}>
                    Total
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography className="table-body-v1  bt-0" style={{ width: '100%' }}>
                    {leadTimeData?.leadTimeDays || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </Box>
      </Box>
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
