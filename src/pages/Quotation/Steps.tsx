import React, { useContext, Fragment, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import clsx from 'clsx';
import { GiBackwardTime } from 'react-icons/gi';
import IconButton from '@material-ui/core/IconButton';
import {
  StepIconProps,
  Grid,
  Dialog,
  List,
  ListItem,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Box,
  TextField,
  CircularProgress
} from '@material-ui/core';
import { IoIosArrowDroprightCircle, IoIosArrowDropleftCircle } from 'react-icons/io';
import { GoPencil } from 'react-icons/go';
import { BsCheckCircle } from 'react-icons/bs';
import { AiOutlineCloseCircle, AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { FaHourglassHalf } from 'react-icons/fa';
import styles from '../RentalManagement/Retal.module.scss';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import { isMobile, isTablet } from 'react-device-detect';
import { RiShareForwardFill } from 'react-icons/ri';
import { TiArrowBack } from 'react-icons/ti';
import MobileStepper from '@material-ui/core/MobileStepper';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import CustomMobileStepperOpportunities from '../../components/CustomMobileStepperOpportunities';
import { FiMaximize2 } from 'react-icons/fi';
import transitions from '@material-ui/core/styles/transitions';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { quotation, QUOTATION_STATUS } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
  backButton: {
    marginRight: theme.spacing(1)
  },
  BlackSvg: {
    userSelect: 'none',
    '& svg': {
      fill: '#000',
      transition: 'fill .4s, opacity .4s'
    },
    '&:hover svg': {
      fill: 'var(--primary)'
    },
    '&.Mui-disabled': {
      PointerEvents: 'none',
      '& svg': {
        opacity: '0.3'
      }
    }
  },
  instructions: {
    fontWeight: 'bold'
  },
  pStepper: {
    padding: '10px 4px',
    borderRadius: '4px',
    [theme.breakpoints.down('xs')]: {
      padding: '4px'
    }
  },
  pbStepper: {
    overflow: 'none',
    justifyContent: 'space-evenly',
    [theme.breakpoints.down('xs')]: {
      overflow: 'auto'
    }
  },
  step: {
    paddingLeft: '8px',
    paddingRight: '8px',
    padding: '10px 8px',
    width: '20%',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '2px',
    borderRadius: '12px 40px 40px 50px',
    border: '1px solid #d6d5d5',
    [theme.breakpoints.down('xs')]: {
      width: '50%',
      padding: '2px'
    }
  },
  inActive: {
    flex: '1',
    background: '#E5E5E5',
    border: '2px solid #258C89',
    '& .MuiStepLabel-label': {
      color: '#000 !important'
    }
  },
  currentStep: {
    flex: '1',
    border: '2px solid #258C89',
    backgroundColor: '#ffffff',
    color: '#FFF',
    fontWeight: 600,
    '& .MuiStepLabel-label': {
      color: '#000 !important',
      fontWeight: '600'
    },
    '& .MuiIconButton-label': {
      '& svg': {
        fill: '#258C89',
        stroke: '#258C89'
      }
    },
    '& svg': {
      fill: 'rgba(37, 140, 137, 0.26)',
      fontSize: '20px !important',
      '& text': {
        fill: '#000'
      }
    }
  },
  active: {
    flex: '1',
    background: '#c8e9ce',
    color: '#378280 !important',
    border: '2px solid #258C89',
    backgroundColor: '#258C89',
    '& .MuiStepLabel-label': {
      color: '#fff !important',
      fontWeight: '600'
    },
    '& .MuiIconButton-label': {
      '& svg': {
        fill: '#fff',
        stroke: '#fff'
      }
    },
    '& svg': {
      fill: '#fff',
      fontSize: '20px !important',
      '& text': {
        fill: '#000'
      }
    }
  },
  sent: {
    color: '#00acc1',
    fontWeight: 'bold'
  },
  approved: {
    color: '#6ca826',
    fontWeight: 'bold'
  },
  rejected: {
    color: '#d60f0f',
    fontWeight: 'bold'
  },
  '@media only screen and (max-width: 1160px)': {
    pbStepper: {
      '& .MuiStepLabel-iconContainer': {
        display: 'none'
      }
    }
  }
}));

const Steps = (props) => {
  const {
    nextStep,
    isNextStep,
    steps,
    currentStep,
    setCurrentStep,
    isStepEnded,
    setStepFullScreen = null,
    updateStatus = null,
    isPrevStep = true,
    quotationId,
    versionId,
    status = QUOTATION_STATUS.acceptByCustomer
  } = props;
  console.log(status);
  const classes = useStyles();
  let activeStep = currentStep;
  const toastConfig = useContext(CustomToastContext);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const options = { Accept: QUOTATION_STATUS.acceptByCustomer, Reject: QUOTATION_STATUS.rejectByCustomer };
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value.trimStart());
  };

  const closeManualDiaog = () => {
    setCustomerAcceptable(false);
    setSelectedOption(null);
    setComment('');
    setCommentError(null);
  };
  const manualSendToCustomer = () => {
    if (selectedOption) {
      setSubmitting(true);
      let dataObj: any = {
        status: options[selectedOption],
        comment: comment || ''
      };
      axiosInstance()
        .put(`${quotation.api}/status/${quotationId}/${versionId}`, dataObj)
        .then(() => {
          setSubmitting(false);
          setCurrentStep((prevStep) => {
            const newStep = prevStep + 1;
            if (updateStatus) {
              updateStatus(newStep);
            }
            return newStep;
          });
          setCustomerAcceptable(false);
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const goNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prevStep) => {
        const newStep = prevStep + 1;
        if (updateStatus) {
          updateStatus(newStep);
        }
        return newStep;
      });
    } else {
      setCustomerAcceptable(true);
    }
  };

  const goPrev = () => {
    setCurrentStep((prevStep) => {
      const newStep = prevStep - 1;
      if (updateStatus) {
        updateStatus(newStep);
      }
      return newStep;
    });
  };

  return (
    <div>
      {isMobile && !isTablet ? (
        // <MobileStepper
        //     style={{ background: "#dee2e6" }}
        //     variant="dots"
        //     steps={steps.length}
        //     position="bottom"
        //     activeStep={currentStep}
        //     nextButton={
        //         <Button size="small"
        //             color="primary"
        //             disabled={currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep || isStepEnded} variant="contained"
        //             endIcon={<KeyboardArrowRight />}
        //             onClick={goNext}
        //          >
        //             {steps[currentStep + 1] ?? ""}
        //         </Button>
        //     }
        //     backButton={
        //         <Button size="small" variant="contained" color={"primary"} startIcon={<KeyboardArrowLeft />}
        //             disabled={currentStep === steps.length || currentStep === 0 || isStepEnded}
        //             onClick={() => {
        //                 setCurrentStep(currentStep - 1)
        //             }}
        //         >
        //             {steps[currentStep - 1] ?? ""}
        //         </Button>
        //     }
        // />
        <CustomMobileStepperOpportunities
          stepName={activeStep + 1 + '/' + steps.length + ' ' + steps[currentStep] ?? ''}
          nextButton={
            <Button
              size="small"
              variant="text"
              color="primary"
              disabled={currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep || isStepEnded}
              endIcon={<AiOutlineRight />}
              className="ml-1 MobileStep-next-back-button"
              onClick={goNext}
            >
              {'Next'}
            </Button>
          }
          backButton={
            <Button
              size="small"
              variant="text"
              color={'primary'}
              startIcon={<AiOutlineLeft />}
              disabled={currentStep === steps.length || currentStep === 0 || isStepEnded || !isPrevStep}
              className={`mr-1 MobileStep-next-back-button `}
              onClick={goPrev}
            >
              {'Back'}
            </Button>
          }
        />
      ) : (
        <div className="position-relative">
          <Grid container className={styles.main_step_box} xs={12}>
            <Grid item xs={12} sm={isMobile ? 12 : 1} md={1} className="d-flex align-items-center justify-content-center mt-2">
              {!isMobile && !isStepEnded && (
                <IconButton
                  disabled={currentStep === steps.length || currentStep === 0}
                  className={`stepperButton ${classes.BlackSvg}`}
                  onClick={goPrev}
                >
                  <TiArrowBack size={30} />
                </IconButton>
              )}
            </Grid>
            <Grid item xs={12} sm={isMobile ? 12 : 10} md={10} style={isMobile ? { padding: '0 10px' } : {}}>
              <div className={classes.pStepper}>
                <Grid container>
                  <Grid item xs={6} className="d-flex align-items-center justify-content-start ">
                    {isMobile && (
                      <>
                        <div>
                          <IconButton
                            color="primary"
                            disabled={currentStep === steps.length || currentStep === 0 || isStepEnded || !isPrevStep}
                            onClick={goPrev}
                            size="small"
                          >
                            <TiArrowBack size={24} />
                          </IconButton>
                        </div>
                      </>
                    )}
                  </Grid>

                  <Grid item xs={6} className="d-flex align-items-center justify-content-end">
                    {isMobile && (
                      <>
                        <div>
                          <IconButton
                            color="primary"
                            onClick={goNext}
                            size="small"
                            disabled={currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep || isStepEnded}
                          >
                            <RiShareForwardFill size={20} />
                          </IconButton>
                        </div>
                      </>
                    )}
                  </Grid>
                </Grid>

                <Stepper className={`${classes.pbStepper} stepper-responsive mt-2`} activeStep={isStepEnded ? steps.length + 1 : activeStep}>
                  {steps.map((label, i) => (
                    <Step
                      key={label}
                      className={clsx(classes.step, {
                        [classes.active]: currentStep > i || isStepEnded,
                        [classes.currentStep]: currentStep === i,
                        [classes.inActive]: currentStep !== i
                      })}
                    >
                      <StepLabel style={{ color: '#555' }} className={'currentStepColor'}>
                        {label}
                        {!isStepEnded && setStepFullScreen && currentStep === i && (
                          <HtmlTooltip title={`Full Screen`}>
                            <IconButton aria-label="Full Screen" onClick={setStepFullScreen} size="small" className="ml-2 p-0">
                              <FiMaximize2 />
                            </IconButton>
                          </HtmlTooltip>
                        )}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </div>
            </Grid>
            <Grid item xs={12} sm={isMobile ? 12 : 1} md={1} className="d-flex align-items-center justify-content-center mt-2 ">
              {!isMobile && !isStepEnded && (
                <Fragment>
                  <IconButton
                    onClick={goNext}
                    disabled={currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep}
                    className={`stepperButtonNext ${classes.BlackSvg}`}
                  >
                    <RiShareForwardFill />
                  </IconButton>
                </Fragment>
              )}
            </Grid>
          </Grid>
        </div>
      )}

      {customerAcceptable && (
        <Dialog fullWidth maxWidth="xs" open={customerAcceptable} onClose={closeManualDiaog} aria-labelledby="assign-roles-dialog">
          <CustomDialogHeader title={`Reason For Ending`} />
          <CustomDialogContent>
            <>
              <List style={{ padding: 0 }}>
                {Object.keys(options).map((option) => (
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
              {selectedOption === 'Reject' && (
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
