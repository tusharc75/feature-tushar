import { useState, useEffect, useContext } from 'react';
import { Box, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import LeadTimeAddDialog from './ManageServiceSteps';
import axiosInstance from 'src/axios/axiosInstance';
import ManageServiceSteps from './ManageServiceSteps';
import { serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const Steps = ({ Id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [steps, setSteps] = useState([]);
  const [assignStepsDialog, setAssignStepsDialog] = useState(false);
  const [isAssigning, setAssigning] = useState(false);

  const [options, setOptions] = useState([]);

  useEffect(() => {
    fetchStepsData();
  }, [Id]);

  const fetchStepsData = async () => {
    setLoadingSteps(true);

    axiosInstance()
      .get(`${serviceMaster.api}/steps/${Id}`)
      .then(({ data: { data } }) => {
        console.log(data);
        setOptions(data);
        setLoadingSteps(false);
      })
      .catch((err) => {
        setLoadingSteps(false);
      });
  };

  const handleUpdateSteps = () => {
    setAssigning(true);
    console.log(options);
    const value = {
      serviceId: Id,
      steps: options
    };
    axiosInstance()
      .post(`${serviceMaster.api}/steps`, value)
      .then(() => {
        setAssigning(false);
        fetchStepsData();
        setAssignStepsDialog(false);
        toastConfig.setToastConfig({
          open: true,
          message: 'Steps updated successfully',
          severity: 'success'
        });
      })
      .catch((err) => {
        setAssigning(false);
        setAssignStepsDialog(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <Paper style={{ overflow: 'hidden' }}>
        <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Steps</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setAssignStepsDialog(true);
            }}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        {options?.length ? (
          <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={3} justifyContent={'center'}>
                <Typography variant="body1">Sr. No</Typography>
              </Grid>
              <Grid item xs={9} justifyContent={'center'}>
                <Typography variant="body1">Step</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : null}
        {options?.length ? (
          options?.map((steps, index) => (
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
        ) : loadingSteps ? (
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
      </Paper>
      {assignStepsDialog && (
        <ManageServiceSteps
          title={'Assign Steps'}
          onClose={() => {
            setAssignStepsDialog(false);
          }}
          handleUpdateSteps={handleUpdateSteps}
          isAssigning={isAssigning}
          options={options}
          setOptions={setOptions}
        />
      )}
    </>
  );
};

export default Steps;
