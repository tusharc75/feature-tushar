import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Grid, Typography, Button, Dialog, IconButton } from '@material-ui/core';
import { useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { serviceMaster } from 'src/constants/helpers';
import StepDialog from './StepDialog';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import ConfiguratorDialog from '../Configuration/Fields/ConfiguratorDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export default function ManageServiceSteps({ handleClose, handleSucess, serviceId }) {

  const toastConfig = useContext(CustomToastContext);
  const [steps, setSteps] = useState([]);
  const [stepDialog, setStepDialog] = useState({ open: false, data: null });
  const [stepFieldsDialog, setStepFieldsDialog] = useState({ open: false, stepId: "" });

  useEffect(() => {
    fetchStepsData();
  }, [serviceId]);

  const fetchStepsData = async () => {
    axiosInstance()
      .get(`${serviceMaster.api}/steps/${serviceId}`)
      .then(({ data: { data } }) => {
        setSteps(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = (stepId) => {
    axiosInstance().delete(`${serviceMaster.api}/steps/${serviceId}/${stepId}`)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        fetchStepsData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <Fragment>
        <CustomDialogHeader
          title={'Steps'}
          onClose={() => {
            handleClose();
          }}
          showManimizeMaximize={false}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Button
            size="small"
            variant='contained'
            color="primary"
            onClick={() => {
              setStepDialog({ open: true, data: null });
            }}
          >
            Add Step
          </Button>
          <Box mt={3}>
            {steps?.map((st, index) => (
              <Box key={index} mb={2} p={2} border={1} borderColor="grey.300" width={'100%'}>
                <Grid container>
                  <Grid item xs={1} justifyContent={'center'}>
                    <Typography variant="body2">{index + 1}</Typography>
                  </Grid>
                  <Grid item xs={5} >
                    <Typography variant="body2">{st?.stepName}</Typography>
                  </Grid>
                  <Grid item xs={6} container justify="flex-end" >
                    <HtmlTooltip title="Edit">
                      <IconButton
                        aria-label="setting"
                        onClick={(e) => {
                          setStepDialog({ open: true, data: st });
                        }}
                        size="small"
                      >
                        <EditIcon color="primary" fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                    <HtmlTooltip title="Add Fields">
                      <IconButton
                        aria-label="setting"
                        onClick={(e) => {
                          setStepFieldsDialog({ open: true, stepId: st._id });
                        }}
                        size="small"
                      >
                        <AddCircleOutlineIcon color="primary" fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                    <HtmlTooltip title="Delete">
                      <IconButton
                        aria-label="setting"
                        onClick={(e) => {
                          handleDelete(st._id)
                        }}
                        size="small"
                      >
                        <DeleteIcon color="error" fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            size="small"
            color="primary"
            onClick={() => {
              handleClose();
            }}
          >
            Cancel
          </Button>
        </CustomDialogFooter>
      </Fragment>
      {stepDialog.open && (
        <StepDialog
          handleClose={() => {
            setStepDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setStepDialog({ open: false, data: null });
            fetchStepsData()
          }}
          serviceId={serviceId}
          stepData={stepDialog.data}
        />
      )}
      {stepFieldsDialog.open && (
        <ConfiguratorDialog
          serviceId={serviceId}
          stepId={stepFieldsDialog.stepId}
          handleClose={() => {
            setStepFieldsDialog({ open: false, stepId: "" });
          }}
          handleSucess={() => {
            setStepFieldsDialog({ open: false, stepId: "" });
          }}
        />
      )}
    </Dialog>
  );
}
