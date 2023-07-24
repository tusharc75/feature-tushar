import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import axiosInstance from '../../../../axios/axiosInstance';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';

import { Dialog, ListItemText, ListItem, List, ListItemIcon, Checkbox, TextField, Box, CircularProgress } from '@material-ui/core';
import { FcCancel } from 'react-icons/fc';
import { FcClock } from 'react-icons/fc';
import { FcApproval } from 'react-icons/fc';
import NewStepper from '../../../../components/Helpers/NewStepper';
import CustomDialogFooter from '../../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';

import Steps1 from 'src/components/Steps';

const useStyles = makeStyles((theme) => ({
  rejected: {
    background: '#f3e78e',
    borderBottom: '0px solid var(--productRed)',
    color: 'var(--error) !important',
    borderLeft: '6px solid var(--error)'
  },
  sent: {
    color: '#00acc1',
    fontWeight: 'bold'
  },
  approved: {
    color: '#6ca826',
    fontWeight: 'bold'
  },
  rejectedByDoa: {
    color: '#d60f0f',
    fontWeight: 'bold'
  }
}));

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
    handleViewPdf,
    allowedToEdit,
    DOAData = null,
    quoteData,
    globalLoading = false,
    setStepFullScreen
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
      handleViewPdf();
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
        isNextStepEnabled={
          allowedToEdit ||
          !loading ||
          !globalLoading ||
          nextStep ||
          !versionStatus.includes('Sent for DOA') ||
          !versionStatus.includes('Accepted  by DOA') ||
          steps[currentStep]?.key !== 'DOA Process' ||
          !approvedQuote.approved
        }
        isPrevStep={
          currentStep >= 0 ||
          allowedToEdit ||
          !versionStatus.includes('Rejected by Customer') ||
          !(steps.length === 5 && currentStep > 3) ||
          !versionStatus.includes('Sent for DOA') ||
          !(steps.length === 6 && currentStep >= 4) ||
          !versionStatus.includes('Sent to Customer') ||
          !loading ||
          !globalLoading
        }
        isStepEnded={currentStep === steps.length}
        steps={steps}
        nextStep={steps[currentStep + 1]}
        setCurrentStep={() => {}}
        handleNext={() => {
          if (versionStatus.includes('Sent to Customer') || steps[currentStep]?.key === 'Send To Customer' || versionStatus === 'Sent to Customer') {
            setShowManualCustomerActionDialog(true);
          } else {
            handleNext();
          }
        }}
        handlePrev={handleBack}
        setStepFullScreen={setStepFullScreen}
      />
      {versionStatus.split(' ')[0] !== 'Rejected' ? null : <p>{versionStatus}</p>}
      {isMobile && !isTablet ? (
        <></>
      ) : (
        <>
          <div className="position-relative">
            {!versionStatus.includes('Accepted by Customer') && approvedQuote.approved && approvedQuote.versionApproved === version && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <Typography className={classes.approved}>Quote version - {approvedQuote.versionApproved} of this quote has been Approved</Typography>
              </div>
            )}
            <>
              {versionStatus === 'Sent for DOA' && (
                <>
                  {DOAData && (
                    <>
                      <NewStepper heading={' '} quoteDOA={DOAData} />
                      <div className="d-flex align-items-center justify-content-center flex-column m-3">
                        <FcClock size={30} />
                        <Typography className={classes.sent}>DOA Sent</Typography>
                      </div>
                    </>
                  )}
                </>
              )}
              {versionStatus.split(' (')[0] === 'Accepted  by DOA' && (
                <>
                  {DOAData && <NewStepper heading={' '} quoteDOA={DOAData} />}

                  <div className="d-flex align-items-center justify-content-center flex-column m-3">
                    <FcApproval size={30} />
                    <Typography className={classes.approved}>Approved by DOA</Typography>
                  </div>
                </>
              )}
              {versionStatus.split(' (')[0] === 'Rejected by DOA' && (
                <>
                  {DOAData && <NewStepper heading={' '} quoteDOA={DOAData} />}

                  <div className="d-flex align-items-center justify-content-center flex-column m-3">
                    <FcCancel size={30} />
                    <Typography className={classes.rejectedByDoa}>Rejected by DOA</Typography>
                  </div>
                </>
              )}
              {versionStatus === 'Sent to Customer' && (
                <div className="d-flex align-items-center justify-content-center flex-column m-3">
                  <FcClock size={30} />
                  <Typography className={classes.sent}>Quote has been sent to customer</Typography>
                </div>
              )}
              {versionStatus.includes('Accepted by Customer') && (
                <div className="d-flex align-items-center justify-content-center flex-column m-3">
                  <FcApproval size={30} />
                  <Typography className={classes.approved}>Approved by Customer</Typography>
                </div>
              )}
              {versionStatus.includes('Rejected by Customer') && (
                <div className="d-flex align-items-center justify-content-center flex-column m-3">
                  <FcCancel size={30} />
                  <Typography className={classes.rejected}>Rejected by Customer</Typography>
                </div>
              )}
            </>
          </div>
        </>
      )}

      {showManualCustomerActionDialog && (
        <Dialog fullWidth maxWidth="xs" open={showManualCustomerActionDialog} onClose={closeManualDiaog} aria-labelledby="assign-roles-dialog">
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
