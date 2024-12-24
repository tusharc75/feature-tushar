import { Box, Button, Dialog, Grid, Typography } from '@mui/material';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FcApproval, FcCancel } from 'react-icons/fc';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomButton from '../../../components/Helpers/CustomButton';
import { CustomDialogTransition, REPAIR_PROCESS_STATUS, dateTimeFormat, repairJob } from '../../../constants/helpers';

const RepairProcess = ({ onClose, onSuccess, assetId, assetNumber, repaired, repairJobData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [repairProcess, setRepairProcess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [allowComplete, setAllowComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRepairProcess();
  }, []);

  const fetchRepairProcess = () => {
    axiosInstance()
      .get(`${repairJob.api}/${repairJobData?._id}/repair-process/${assetId}`)
      .then(({ data: { data } }) => {
        data?.forEach((element) => {
          element?.steps?.forEach((e, index) => {
            if (e.status === REPAIR_PROCESS_STATUS.start) {
              setActiveStep(index);
            } else if ([REPAIR_PROCESS_STATUS.complete, REPAIR_PROCESS_STATUS.failed]?.includes(e.status)) {
              setActiveStep(index + 1);
            }
          });
          setAllowComplete(element?.steps?.filter((e) => e.status).length === element?.steps?.length);
        });
        setRepairProcess(data);
      });
  };

  const handleUpdate = (_id, name, status) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobData?._id}/repair-process/${assetId}`, { _id: _id, name: name, status: status })
      .then(({ data: { data } }) => {
        toastConfig.setToastConfig({ open: true, type: 'success', message: `Repair Step ${name} ${status} successfully` });
        fetchRepairProcess();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleCompleteRepair = () => {
    setLoading(true);
    axiosInstance()
      .put(`${repairJob.api}/${repairJobData._id}/assets/repaired`, { assets: [assetId], repaired: true })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {}}
      fullWidth
    >
      <Fragment>
        <CustomDialogHeader
          title={`Repair Process - ${assetNumber}`}
          onClose={() => {
            onClose();
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showRequiredLabel={false}
          showManimizeMaximize={true}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Box border={1} borderColor="var(--common-border-color)">
            {repairProcess?.map((process: any, i) => (
              <Fragment>
                <Box key={i} p={1}>
                  <Typography variant="body1">{process.repairType}</Typography>
                </Box>
                <Box p={1} borderTop={1} borderColor="var(--common-border-color)" width={'100%'}>
                  <Grid container>
                    <Grid item xs={1} sm={1} md={1} lg={1}>
                      <Typography variant="body2">Sr.</Typography>
                    </Grid>
                    <Grid item xs={5} sm={5} md={5} lg={5}>
                      <Typography variant="body2">Repair Step</Typography>
                    </Grid>
                    <Grid item xs={3} sm={3} md={3} lg={3}>
                      <Typography variant="body2">Action</Typography>
                    </Grid>
                    <Grid item xs={3} sm={3} md={3} lg={3}>
                      <Typography variant="body2">Duration</Typography>
                    </Grid>
                  </Grid>
                </Box>
                {process?.steps?.map((step, index) => (
                  <Box key={index} p={2} borderTop={1} borderColor="var(--common-border-color)" width={'100%'}>
                    <Grid container>
                      <Grid item xs={1} sm={1} md={1} lg={1}>
                        <Typography variant="body2">{step.order}</Typography>
                      </Grid>
                      <Grid item xs={5} sm={5} md={5} lg={5}>
                        <Typography variant="body2">{step.name}</Typography>
                      </Grid>
                      <Grid item xs={3} sm={3} md={3} lg={3}>
                        {activeStep === index ? (
                          step.status === REPAIR_PROCESS_STATUS.start ? (
                            <Fragment>
                              <Button
                                variant="outlined"
                                color="secondary"
                                aria-controls="simple-menu"
                                aria-haspopup="true"
                                size="small"
                                className="mr-2"
                                onClick={() => handleUpdate(step?._id, step?.name, REPAIR_PROCESS_STATUS.complete)}
                              >
                                {REPAIR_PROCESS_STATUS.complete}
                              </Button>
                              <DeleteButton
                                text={REPAIR_PROCESS_STATUS.failed}
                                onClick={() => handleUpdate(step?._id, step?.name, REPAIR_PROCESS_STATUS.failed)}
                              />
                            </Fragment>
                          ) : (
                            <Button
                              variant="outlined"
                              color="primary"
                              aria-controls="simple-menu"
                              aria-haspopup="true"
                              size="small"
                              onClick={() => handleUpdate(step?._id, step?.name, REPAIR_PROCESS_STATUS.start)}
                            >
                              {REPAIR_PROCESS_STATUS.start}
                            </Button>
                          )
                        ) : null}
                        {step.status === REPAIR_PROCESS_STATUS.complete && (
                          <HtmlTooltip title={REPAIR_PROCESS_STATUS.complete}>
                            <span>
                              <FcApproval fontSize={25} />
                            </span>
                          </HtmlTooltip>
                        )}
                        {step.status === REPAIR_PROCESS_STATUS.failed && (
                          <HtmlTooltip title={REPAIR_PROCESS_STATUS.failed}>
                            <span>
                              <FcCancel fontSize={25} />
                            </span>
                          </HtmlTooltip>
                        )}
                      </Grid>
                      <Grid item xs={3} sm={3} md={3} lg={3}>
                        {step.startDate && <Typography variant="body2">Start Date - {moment(step.startDate).format(dateTimeFormat)}</Typography>}
                        {step.endDate && <Typography variant="body2">End Date - {moment(step.endDate).format(dateTimeFormat)}</Typography>}
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Fragment>
            ))}
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          {allowComplete && !repaired && (
            <CustomButton
              loading={loading}
              variant="contained"
              color="primary"
              type="submit"
              onClick={(e) => {
                handleCompleteRepair();
              }}
              disabled={loading}
            >
              {' '}
              Complete Repair
            </CustomButton>
          )}
        </CustomDialogFooter>
      </Fragment>
    </Dialog>
  );
};

export default RepairProcess;
