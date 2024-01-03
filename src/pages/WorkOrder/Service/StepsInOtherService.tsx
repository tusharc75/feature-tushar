import { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, IconButton, TextField, Theme, Typography, createStyles, makeStyles } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, WORKORDER_SERVICE_STATUS, WORKORDER_SERVICE_STEP_STATUS, workOrder } from 'src/constants/helpers';
import { Add, DeleteOutline, FileCopyOutlined } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    heading: {
      fontSize: theme.typography.pxToRem(16)
    },
    accordionHeading: {
      padding: '16px 16px 16px 16px',
      ['@media (min-width:768px)']: {
        padding: '16px 20px 16px 16px'
      },
      ['@media (min-width:1024px)']: {
        padding: '16px 40px 16px 16px'
      },

      '& > div': {
        alignItems: 'center',
        justifyContent: 'space-between'
      }
      // '&:first-of-type': {
      //   borderRadius: '8px 8px 0 0'
      // }
      // '&:last-of-type': {
      //   borderRadius: '0 0 8px 8px'
      // }
    },
    red: {
      backgroundColor: 'rgba(255,0,0,.1)'
    },
    white: {
      backgroundColor: 'var(--dark-secondary, white)'
    }
  })
);

const StepsInOtherServices = ({ workOrderId, service, allowedToEdit, onClose }) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [steps, setSteps] = useState([]);
  const [addNewStep, setAddNewStep] = useState({ open: false, clone: false, cloneStepData: null });

  useEffect(() => {
    axiosInstance()
      .get(`${workOrder.api}/${workOrderId}/detail`)
      .then(({ data: { data } }) => {
        const services: any = [];
        data?.services?.forEach((s) => {
          if (s?.order > service?.order) {
            services.push({
              optionLabel: s?.serviceName,
              optionValue: s?._id,
              uniqueId: s?.uniqueId,
              status: s?.status
            });
          }
        });
        setServiceOptions(services);
      });
  }, [workOrderId, service]);

  useEffect(() => {
    if (selectedService) {
      axiosInstance()
        .get(`${workOrder.api}/service/detail/${workOrderId}/${selectedService?.optionValue}/${selectedService?.uniqueId}`)
        .then(({ data: { data } }) => {
          setSteps(data?.steps?.sort((a, b) => a?.order - b?.order));
        });
    }
  }, [selectedService]);

  const handleAddStep = (values: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`, values)
      .then(({ data }) => {
        const temp = selectedService;
        setSelectedService(null);
        setSelectedService(temp);
        setAddNewStep({ open: false, clone: false, cloneStepData: null });
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      fullWidth
    >
      <CustomDialogHeader title={'Step Information'} onClose={onClose} showRequiredLabel={false} />
      <CustomDialogContent>
        <Box display="flex" alignContent="center" justifyContent="space-between">
          <Autocomplete
            id="service"
            style={{ minWidth: '300px' }}
            options={serviceOptions}
            getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
            getOptionSelected={(option: any, val) => option.optionValue === val}
            value={selectedService}
            onChange={(e: any, value) => {
              setSelectedService(value);
            }}
            disableClearable
            renderInput={(params) => (
              <TextField {...params} margin="dense" variant="outlined" label="Select Service" placeholder="Select Service" name="service" />
            )}
          />
          <Box mt={1}>
            <Button
              variant={'outlined'}
              color="primary"
              size="small"
              startIcon={<Add />}
              aria-controls="add-menu"
              disabled={!selectedService}
              onClick={() => {
                setAddNewStep({ open: true, clone: false, cloneStepData: null });
              }}
            >
              Add Steps
            </Button>
          </Box>
        </Box>
        <Box mt={2}>
          {steps?.length > 0 &&
            steps?.map((step) => {
              return (
                <Box
                  key={`${step._id}`}
                  border={1}
                  borderColor={'var(--common-border-color)'}
                  className={`${classes.accordionHeading}  ${classes.white} transition-all duration-500 `}
                >
                  <Box sx={{ display: 'flex' }} gridGap={'8px'}>
                    <span className="bg-[var(--primary)] dark:bg-[var(--dark-primary)] rounded-full text-white text-[13px] px-[12px] py-[1px]">
                      {step?.order}
                    </span>
                    <Box
                      className="mr-auto basis-[calc(100%-56px)] sm:basis-[calc(100%-155px)] flex flex-wrap items-center justify-between gap-[8px]"
                      gridGap={'8px'}
                    >
                      <Box className="flex items-center gap-2 flex-grow text-[var(--primary-text)]">
                        <div className="flex items-start gap-2 w-full">
                          <Typography className={`${classes.heading} flex-grow [word-break:break-all]`} style={{ fontWeight: '600' }}>
                            {step.stepName}
                          </Typography>
                        </div>
                      </Box>
                    </Box>
                    <div className="flex  md:gap-1 items-center">
                      <HtmlTooltip enterTouchDelay={0} title="Clone" placement="top" arrow>
                        <IconButton
                          size="small"
                          color="inherit"
                          aria-label="Clone"
                          onClick={(e) => {
                            setAddNewStep({ open: true, clone: true, cloneStepData: step });
                          }}
                        >
                          <FileCopyOutlined style={{ fontSize: '18px' }} />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  </Box>
                </Box>
              );
            })}
        </Box>
        {addNewStep.open && (
          <StepDialog
            handleClose={() => {
              setAddNewStep({ open: false, clone: false, cloneStepData: null });
            }}
            handleSucess={(data) => {
              if (addNewStep.clone) {
                delete data?.stepId;
              }
              handleAddStep(data);
            }}
            stepId={addNewStep.clone ? addNewStep.cloneStepData?._id : ''}
            stepData={addNewStep.clone ? addNewStep.cloneStepData : null}
            steps={steps}
            reference={'workOrder'}
            workOrderId={workOrderId}
            serviceId={selectedService?.optionValue}
            uniqueId={selectedService?.uniqueId}
            isClone={addNewStep.clone}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default StepsInOtherServices;
