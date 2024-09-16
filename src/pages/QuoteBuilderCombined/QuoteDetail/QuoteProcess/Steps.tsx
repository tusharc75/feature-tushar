import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import axiosInstance from '../../../../axios/axiosInstance';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';

import { Dialog, ListItemText, ListItem, List, ListItemIcon, Checkbox, TextField, Box, CircularProgress } from '@material-ui/core';
import { FcCancel } from 'react-icons/fc';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { FcApproval } from 'react-icons/fc';
import NewStepper from '../../../../components/Helpers/NewStepper';
import CustomDialogFooter from '../../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import DoaStepUsers from './DOAStepUsers';

import Steps1 from 'src/components/Steps';
import { CustomDialogTransition } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
  rejected: {
    background: '#fedddd',
    color: 'var(--error) !important'
  },
  sent: {
    color: '#00acc1',
    fontWeight: 'bold',
    background: '#bdf7ff'
  },

  rejectedByDoa: {
    color: '#d60f0f',
    background: '#fcd4d4',
    fontWeight: 'bold'
  }
}));

const approvedClasses = `text-[#6ca826] bg-[#d8ffaa] dark:text-[#294c00] dark:bg-[#c2ee8f]`;

const Steps = (props) => {
  const {
    steps,
    currentStep,
    id,
    version,
    Refresh,
    nextStep,
    versionStatus,
    loading,
    approvedQuote,
    handleVersionUpdate,
    allowedToEdit,
    DOAData = null,
    quoteData,
    globalLoading = false,
    setStepFullScreen,
    isStepEnded = false,
    isPrevStep = true
  } = props;
  const classes = useStyles();
  let activeStep = currentStep;
  const toastConfig = useContext(CustomToastContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const options = ['Booked', 'Not Booked', 'Others'];
  const [showManualCustomerActionDialog, setShowManualCustomerActionDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value.trimStart());
  };

  const handleNext = () => {
    if (currentStep === 2) {
      handleVersionUpdate();
    }
    axiosInstance()
      .post(`quote-builder/updateprocess/${id}?version=${version}`, {
        processStatus: steps[activeStep + 1]?.key
      })
      .then(() => {
        activeStep = activeStep + 1;
        Refresh(version);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const manualSendToCustomer = () => {
    if (selectedOption) {
      let tempComment = quoteData.versions[version]?.comment ?? [];
      if (typeof tempComment === 'string') {
        tempComment = [tempComment];
      }
      let dataObj = {
        status: selectedOption === 'Others' ? selectedOption?.trim() : selectedOption?.trim() + ' by Customer',
        manual: true,
        comment: tempComment
      };
      if (selectedOption === 'Others' || selectedOption === 'Not Booked') {
        dataObj.comment.push(comment);
      }

      let { comment: msg } = dataObj;

      msg = msg?.filter((x) => x);

      dataObj.comment = msg;

      if ((selectedOption === 'Others' || selectedOption === 'Not Booked') && comment === '') {
        setCommentError('Please write your comment!');
      } else {
        setSubmitting(true);
        axiosInstance()
          .post(`quote-builder/updateStatusfromCustomer/${id}?version=${version}`, dataObj)
          .then(() => {
            setSubmitting(false);
            activeStep = activeStep + 1;
            Refresh(version);
            setShowManualCustomerActionDialog(false);
          })
          .catch((error) => {
            setSubmitting(false);
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const handleBack = () => {
    axiosInstance()
      .post(`quote-builder/updateprocess/${id}?version=${version}`, {
        processStatus: steps[activeStep - 1]?.key
      })
      .then(() => {
        activeStep = activeStep - 1;
        Refresh(version);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const closeManualDiaog = () => {
    setShowManualCustomerActionDialog(false);
    setSelectedOption(null);
    setComment('');
    setCommentError(null);
  };

  return (
    <div>
      <Steps1
        currentStep={currentStep}
        nextStep={!loading && !globalLoading && nextStep}
        isPrevStep={
          currentStep >= 0 && !loading && !globalLoading && isPrevStep
          // allowedToEdit &&
          // !versionStatus.includes('Rejected by Customer') &&
          // !(steps.length === 5 && currentStep > 3) &&
          // !versionStatus.includes('Sent for DOA') &&
          // !(steps.length === 6 && currentStep >= 4) &&
          // !versionStatus.includes('Sent to Customer') &&
        }
        isStepEnded={isStepEnded || currentStep === steps.length}
        steps={steps}
        setCurrentStep={() => {}}
        handleNext={() => {
          if (versionStatus.includes('Sent to Customer') && steps[currentStep]?.key === 'Send To Customer') {
            setShowManualCustomerActionDialog(true);
          } else {
            handleNext();
          }
        }}
        handlePrev={handleBack}
        setStepFullScreen={setStepFullScreen}
      />
      {/* {versionStatus.split(' ')[0] !== 'Rejected' ? null : <p>{versionStatus}</p>} */}
      {isMobile && !isTablet ? (
        <></>
      ) : (
        <>
          <div className="absolute right-[25px] top-[64px] rounded-bl-md  text-[20px] font-semibold">
            {!versionStatus.includes('Accepted by Customer') && approvedQuote.approved && approvedQuote.versionApproved === version && (
              <div
                className={`${approvedClasses} text d-flex align-items-center justify-content-center max-w-max gap-1  rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px] font-bold`}
              >
                <h6>Quote version - {approvedQuote.versionApproved} of this quote has been Approved</h6>
              </div>
            )}
            <>
              {versionStatus === 'Sent for DOA' && <DoaStepUsers DOAData={DOAData} versionStatus={'Sent for DOA'} />}
              {versionStatus.split(' (')[0] === 'Accepted  by DOA' && <DoaStepUsers DOAData={DOAData} versionStatus={'Accepted by DOA'} />}
              {versionStatus.split(' (')[0] === 'Rejected by DOA' && <DoaStepUsers DOAData={DOAData} versionStatus={'Rejected by DOA'} />}
              {versionStatus === 'Sent to Customer' && (
                <div
                  className={`${classes.sent} d-flex align-items-center justify-content-center max-w-max  gap-1 rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px]`}
                >
                  <AiOutlineClockCircle size={20} />
                  <h6>Quote has been sent to customer</h6>
                </div>
              )}
              {versionStatus.includes('Accepted by Customer') && (
                <div
                  className={`${approvedClasses} d-flex align-items-center justify-content-center max-w-max  gap-1 rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px]`}
                >
                  <FcApproval size={20} />
                  <h6>Approved by Customer</h6>
                </div>
              )}
              {versionStatus.includes('Rejected by Customer') && (
                <div
                  className={`${classes.rejected} d-flex align-items-center justify-content-center max-w-max  gap-1 rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px]`}
                >
                  <FcCancel size={20} />
                  <h6>Rejected by Customer</h6>
                </div>
              )}
            </>
          </div>
        </>
      )}

      {showManualCustomerActionDialog && (
        <Dialog
          fullWidth
          maxWidth="xs"
          TransitionComponent={CustomDialogTransition}
          open={showManualCustomerActionDialog}
          onClose={closeManualDiaog}
          aria-labelledby="assign-roles-dialog"
        >
          <CustomDialogHeader title={`Reason For Ending`} />
          <CustomDialogContent>
            <>
              <List style={{ padding: 0 }}>
                {options.map((option) => (
                  <ListItem divider key={option}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          e.target.checked ? setSelectedOption(option) : setSelectedOption(null);
                        }}
                        checked={option === selectedOption}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-${option}`
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={option} />
                  </ListItem>
                ))}
              </List>
              {(selectedOption === 'Others' || selectedOption === 'Not Booked') && (
                <Box my={2}>
                  <TextField
                    fullWidth
                    id="outlined-multiline-static"
                    label="Comment"
                    multiline
                    value={comment}
                    onChange={handleChange}
                    rows={4}
                    variant="outlined"
                    error={Boolean(commentError)}
                    helperText={Boolean(commentError) && commentError}
                  />
                </Box>
              )}
            </>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button onClick={closeManualDiaog} color="primary" size="small" disabled={submitting}>
              Cancel
            </Button>
            <Button
              disabled={!Boolean(selectedOption) || submitting}
              onClick={manualSendToCustomer}
              color="primary"
              size="small"
              variant="contained"
              endIcon={submitting && <CircularProgress size={20} />}
            >
              Save
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
    </div>
  );
};

export default Steps;
