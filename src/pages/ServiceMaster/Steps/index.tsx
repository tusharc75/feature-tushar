import { useState, useEffect, useContext } from 'react';
import { Box, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';
import ManageServiceSteps from './ManageServiceSteps';
import { serviceMaster } from 'src/constants/helpers';

const Steps = ({ serviceId }) => {

  const [stepDialog, setStepDialog] = useState(false);
  const [stepOptions, setStepOptions] = useState(null);

  useEffect(() => {
    fetchStepsData();
  }, [serviceId]);

  const fetchStepsData = async () => {
    axiosInstance()
      .get(`${serviceMaster.api}/steps/${serviceId}`)
      .then(({ data: { data } }) => {
        setStepOptions(data);
      })
      .catch((err) => {
      });
  };

  return (
    <>
      <Paper style={{ overflow: 'hidden' }}>
        <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Service Steps</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setStepDialog(true);
            }}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        {(stepOptions && stepOptions?.length) ? (
          <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={3} justifyContent={'center'}>
                <Typography variant="body1">#</Typography>
              </Grid>
              <Grid item xs={9} justifyContent={'center'}>
                <Typography variant="body1">Step</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : null}
        {stepOptions?.length ? (
          stepOptions?.map((steps, index) => (
            <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
              <Grid container>
                <Grid item xs={3} justifyContent={'center'}>
                  <Typography variant="body2">{index + 1}</Typography>
                </Grid>
                <Grid item xs={9} justifyContent={'center'}>
                  <Typography variant="body2">{steps?.step || ''}</Typography>
                </Grid>
              </Grid>
            </Box>
          ))
        ) : !stepOptions ? (
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
                <Typography variant="body2">No Steps Found</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      {stepDialog && (
        <ManageServiceSteps
          handleClose={() => {
            setStepDialog(false);
          }}
          handleSucess={() => {
            setStepDialog(false);
            fetchStepsData()
          }}
          serviceId={serviceId}
          stepOptions={stepOptions}
        />
      )}
    </>
  );
};

export default Steps;
