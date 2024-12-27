import { Add, DeleteOutline, DragIndicator, Edit, FileCopyOutlined, LowPriority } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import { Box, Dialog, IconButton, TextField, Theme, Typography, createStyles } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CustomDialogTransition, WORKORDER_SERVICE_STATUS, WORKORDER_SERVICE_STEP_STATUS, sidebarResource, workOrder } from 'src/constants/helpers';
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

const StepsInOtherServices = ({ workOrderId, resource, service, allowedToEdit, onClose }) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [stepData, setStepData] = useState([]);
  const [steps, setSteps] = useState([]);
  const [manageStep, setManageStep] = useState({ open: false, clone: false, data: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, loading: false, steps: [] });
  const [arrangeView, setArrangeView] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get(`${workOrder.api}/${workOrderId}/detail`)
      .then(({ data: { data } }) => {
        const services: any = [];
        data?.services?.forEach((s) => {
          if (s?.order > service?.order && ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(s?.status)) {
            services.push({
              optionLabel: s?.serviceName,
              optionValue: s?._id,
              uniqueId: s?.uniqueId,
              status: s?.status
            });
          }
        });
        setServiceOptions(services);
        setStepData(data?.stepData);
      });
  }, [workOrderId, service]);

  useEffect(() => {
    if (selectedService) {
      fetchSteps();
    } else {
      setSteps([]);
    }
  }, [selectedService]);

  const fetchSteps = () => {
    axiosInstance()
      .get(`${workOrder.api}/service/detail/${workOrderId}/${selectedService?.optionValue}/${selectedService?.uniqueId}`)
      .then(({ data: { data } }) => {
        setSteps(data?.steps?.sort((a, b) => a?.order - b?.order));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleStep = (values: any) => {
    let api = `${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`;
    if (!manageStep?.clone && manageStep?.data) {
      api = `${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/update-step`;
      values = { ...values, order: manageStep?.data?.order };
    }
    axiosInstance()
      .put(api, values)
      .then(({ data }) => {
        fetchSteps();
        setManageStep({ open: false, clone: false, data: null });
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

  const deleteSteps = () => {
    setShowDeleteConfirmBox((prev) => ({ ...prev, loading: true }));
    const payload = {
      serviceUniqueId: selectedService?.uniqueId,
      steps: showDeleteConfirmBox.steps.map((item) => item._id)
    };
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/remove`, payload)
      .then(({ data }) => {
        fetchSteps();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox({ open: false, loading: false, steps: [] });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleStepUpdate = (rows: any[]) => {
    axiosInstance()
      .put(`${workOrder.api}/steps-order/${workOrderId}/${selectedService?.optionValue}`, { data: rows || [] })
      .then(({ data }) => {
        fetchSteps();
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
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
      <CustomDialogContent isFooterPresent={false}>
        <Box className="my-2 flex flex-wrap items-center justify-between gap-2">
          <Autocomplete
            id="service"
            className="min-w-[250px] flex-grow min-[600px]:max-w-[300px]"
            options={serviceOptions}
            getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
            isOptionEqualToValue={(option: any, val) => option.optionValue === val}
            value={selectedService}
            onChange={(e: any, value) => {
              setSelectedService(value);
            }}
            // disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                margin="none"
                size="small"
                variant="outlined"
                label="Select Service"
                placeholder="Select Service"
                name="service"
              />
            )}
          />
          <Box className="ml-auto flex flex-wrap items-center gap-2">
            <ThemeButton
              iconForMobile={<LowPriority />}
              disabled={
                allowedToEdit &&
                  selectedService &&
                  steps?.length > 0 &&
                  resource === sidebarResource.workOrder &&
                  ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                    selectedService?.status
                  )
                  ? false
                  : true
              }
              onClick={() => setArrangeView(true)}
              mobileTooltip="Arrange"
            >
              <DragIndicator className="-ml-2" fontSize="small" />
              Arrange
            </ThemeButton>
            <ThemeButton
              iconForMobile={<Add />}
              disabled={!selectedService}
              onClick={() => {
                setManageStep({ open: true, clone: false, data: null });
              }}
            >
              <Add className="-ml-2" /> Add Steps
            </ThemeButton>
          </Box>
        </Box>
        <Box mt={2}>
          {steps?.length > 0 ? (
            steps?.map((step) => {
              return (
                <Box
                  key={`${step._id}`}
                  border={1}
                  borderColor={'var(--common-border-color)'}
                  className={`${classes.accordionHeading}  ${classes.white} transition-all duration-500 `}
                >
                  <Box sx={{ display: 'flex' }} gridGap={'8px'}>
                    <span className="rounded-full bg-[var(--primary)] px-[12px] py-[1px] text-[13px] text-white dark:bg-[var(--dark-primary)]">
                      {step?.order}
                    </span>
                    <Box
                      className="mr-auto flex basis-[calc(100%-56px)] flex-wrap items-center justify-between gap-[8px] sm:basis-[calc(100%-155px)]"
                      gridGap={'8px'}
                    >
                      <Box className="flex flex-grow items-center gap-2 text-[var(--primary-text)]">
                        <div className="flex w-full items-start gap-2">
                          <Typography className={`${classes.heading} flex-grow [word-break:break-all]`} style={{ fontWeight: '600' }}>
                            {step.stepName}
                          </Typography>
                        </div>
                      </Box>
                    </Box>
                    <div className="flex items-center md:gap-1">
                      <HtmlTooltip enterTouchDelay={0} title="Edit" placement="top" arrow>
                        <IconButton
                          size="small"
                          color="inherit"
                          aria-label="Edit"
                          onClick={(e) => {
                            setManageStep({ open: true, clone: false, data: step });
                          }}
                        >
                          <Edit color="primary" style={{ fontSize: '18px' }} />
                        </IconButton>
                      </HtmlTooltip>

                      <HtmlTooltip enterTouchDelay={0} title="Clone" placement="top" arrow>
                        <IconButton
                          size="small"
                          color="inherit"
                          aria-label="Clone"
                          onClick={(e) => {
                            setManageStep({ open: true, clone: true, data: step });
                          }}
                        >
                          <FileCopyOutlined style={{ fontSize: '18px' }} />
                        </IconButton>
                      </HtmlTooltip>

                      <HtmlTooltip enterTouchDelay={0} title="Delete" placement="top" arrow>
                        <IconButton
                          size="small"
                          color="inherit"
                          style={{ color: 'red' }}
                          aria-label="delete"
                          disabled={
                            !allowedToEdit ||
                            [
                              WORKORDER_SERVICE_STEP_STATUS.passed,
                              WORKORDER_SERVICE_STEP_STATUS.failed,
                              WORKORDER_SERVICE_STEP_STATUS.completed
                            ].includes(stepData?.find((d) => d.uniqueId === selectedService?.uniqueId && d.stepId === step?._id)?.passFailStatus)
                          }
                          onClick={() => setShowDeleteConfirmBox((prev) => ({ ...prev, open: true, steps: [step] }))}
                        >
                          <DeleteOutline style={{ fontSize: '20px' }} />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  </Box>
                </Box>
              );
            })
          ) : selectedService ? (
            <Box>No Steps</Box>
          ) : (
            <Box>Please Select Service !!</Box>
          )}
        </Box>
        {manageStep.open && (
          <StepDialog
            handleClose={() => {
              setManageStep({ open: false, clone: false, data: null });
            }}
            handleSucess={(data) => {
              if (manageStep?.clone) {
                delete data?.stepId;
              }
              handleStep(data);
            }}
            stepId={manageStep?.data?._id ?? ''}
            stepData={manageStep?.data}
            notEditable={!manageStep?.clone && manageStep?.data ? (manageStep?.data?.customStep === true ? false : true) : false}
            steps={steps}
            reference={'workOrder'}
            workOrderId={workOrderId}
            serviceId={selectedService?.optionValue}
            uniqueId={selectedService?.uniqueId}
            isClone={manageStep?.clone}
          />
        )}

        {showDeleteConfirmBox.open && (
          <ConfirmationDialog
            open={showDeleteConfirmBox.open}
            message={`Are you sure you want to delete ${showDeleteConfirmBox.steps.map((item) => item.stepName).join(', ')}?`}
            onClose={() => {
              setShowDeleteConfirmBox({ open: false, loading: false, steps: [] });
            }}
            okBtnLoading={showDeleteConfirmBox.loading}
            onOk={() => {
              deleteSteps();
            }}
          />
        )}

        {arrangeView && (
          <ArrangeView
            data={
              steps?.map((d) => {
                return { _id: d?._id, name: d?.stepName, order: d?.order };
              }) || []
            }
            title={'Arrange'}
            handleClose={() => setArrangeView(false)}
            handleSubmit={handleStepUpdate}
            loading={false}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default StepsInOtherServices;
