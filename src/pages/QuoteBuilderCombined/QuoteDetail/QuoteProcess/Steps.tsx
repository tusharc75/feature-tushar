import React, { useContext, useState } from 'react';
import { makeStyles } from '@mui/styles';
import axiosInstance from '../../../../axios/axiosInstance';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';
import { Dialog, ListItemText, ListItem, List, ListItemIcon, Checkbox, TextField, Box, Theme } from '@mui/material';
import { FcCancel } from 'react-icons/fc';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { FcApproval } from 'react-icons/fc';
import CustomDialogFooter from '../../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import DoaStepUsers from './DOAStepUsers';

import Steps1 from 'src/components/Steps';
import { CustomDialogTransition, QUOTE_STATUS } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const useStyles = makeStyles((theme: Theme) => ({
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
        isPrevStep={currentStep >= 0 && !loading && !globalLoading && isPrevStep}
        isStepEnded={isStepEnded || currentStep === steps.length}
        steps={steps}
        setCurrentStep={() => { }}
        handleNext={() => {
          if (versionStatus.includes(QUOTE_STATUS.sentToCustomer) && steps[currentStep]?.key === QUOTE_STATUS.sentToCustomer) {
            setShowManualCustomerActionDialog(true);
          } else {
            handleNext();
          }
        }}
        handlePrev={handleBack}
        setStepFullScreen={setStepFullScreen}
      />
      {isMobile && !isTablet ? (
        <></>
      ) : (
        <>
          <div className="absolute right-[0px] top-[-26px] rounded-bl-md text-[20px] font-semibold">
            {!versionStatus.includes(QUOTE_STATUS.acceptByCustomer) && approvedQuote.approved && approvedQuote.versionApproved === version && (
              <div
                className={`${approvedClasses} text d-flex align-items-center justify-content-center max-w-max gap-1  rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px] font-bold`}
              >
                <h6>Quote version - {approvedQuote.versionApproved} of this quote has been Approved</h6>
              </div>
            )}
            <>
              {versionStatus === QUOTE_STATUS.sentforDOA && <DoaStepUsers DOAData={DOAData} versionStatus={QUOTE_STATUS.sentforDOA} />}
              {versionStatus.split(' (')[0] === QUOTE_STATUS.acceptedbyDOA && <DoaStepUsers DOAData={DOAData} versionStatus={QUOTE_STATUS.acceptedbyDOA} />}
              {versionStatus.split(' (')[0] === QUOTE_STATUS.rejectedbyDOA && <DoaStepUsers DOAData={DOAData} versionStatus={QUOTE_STATUS.rejectedbyDOA} />}
              {versionStatus === QUOTE_STATUS.sentToCustomer && (
                <div
                  className={`${classes.sent} d-flex align-items-center justify-content-center max-w-max  gap-1 rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px]`}
                >
                  <AiOutlineClockCircle size={20} />
                  <h6>Quote has been sent to customer</h6>
                </div>
              )}
              {versionStatus.includes(QUOTE_STATUS.acceptByCustomer) && (
                <div
                  className={`${approvedClasses} d-flex align-items-center justify-content-center max-w-max  gap-1 rounded-bl-md bg-[var(--dark-primary)] px-2 py-[3px]`}
                >
                  <FcApproval size={20} />
                  <h6>Approved by Customer</h6>
                </div>
              )}
              {versionStatus.includes(QUOTE_STATUS.rejectByCustomer) && (
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
          <CustomDialogHeader title="Reason For Ending" onClose={closeManualDiaog} />
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
            <ThemeButton onClick={closeManualDiaog} buttonType="transparent">
              Cancel
            </ThemeButton>
            <ThemeButton disabled={!Boolean(selectedOption) || submitting} onClick={manualSendToCustomer} buttonType="theme" isLoading={submitting}>
              Save
            </ThemeButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </div>
  );
};

export default Steps;
