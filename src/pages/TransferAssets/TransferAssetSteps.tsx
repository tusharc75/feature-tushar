import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import clsx from 'clsx';
import IconButton from '@material-ui/core/IconButton';
import { Grid } from '@material-ui/core';
import { IoIosArrowDropleftCircle } from 'react-icons/io';
import { isMobile } from 'react-device-detect';
import { TiArrowBack } from 'react-icons/ti';
import { RiShareForwardFill } from 'react-icons/ri';
import MobileStepper from '@material-ui/core/MobileStepper';
import Button from '@material-ui/core/Button';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';

const useStyles = makeStyles((theme) => ({
  backButton: {
    marginRight: theme.spacing(1)
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
    background: '#ebebeb',
    borderLeft: '6px solid var(--grey)'
  },
  currentStep: {
    flex: '1',
    background: '#ffffff',
    borderLeft: '6px solid #378280',
    color: '#378280 !important'
  },
  active: {
    flex: '1',
    background: '#c8e9ce',
    borderBottom: '0px solid var(--warning)',
    color: 'var(--secondary) !important',
    borderLeft: '6px solid var(--secondary)'
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
  }
}));

const TransferSteps = (props) => {
  const { isPrevStep, isNextStep, steps, currentStep, isTransferEnded, setCurrentStep, isInternal, updateStatus } = props;
  const classes = useStyles();
  let activeStep = currentStep;

  const goNext = () => {
    setCurrentStep((prevStep) => {
      const newStep = prevStep + 1;
      updateStatus(newStep);
      return newStep;
    });
  };

  const goPrev = () => {
    setCurrentStep((prevStep) => {
      const newStep = prevStep - 1;
      updateStatus(newStep);
      return newStep;
    });
  };

  return (
    <div>
      {isMobile ? (
        <div>
          <MobileStepper
            style={{ background: '#dee2e6' }}
            variant="dots"
            steps={steps.length}
            position="bottom"
            activeStep={activeStep}
            nextButton={
              <Button
                size="small"
                color="primary"
                variant="contained"
                hidden={currentStep >= 2 || (currentStep === 0 && isNextStep)}
                disabled={(isInternal ? currentStep >= 1 : currentStep >= 2) || !isNextStep || isTransferEnded}
                onClick={goNext}
                endIcon={currentStep < 2 && <KeyboardArrowRight />}
              >
                {steps[currentStep + 1] ?? 'Reciving Ticket'}
              </Button>
              // : <Button size="small" disabled={loading} color="primary" onClick={handleNext} variant="contained" endIcon={<KeyboardArrowRight />}>
              //   {steps[activeStep + 1]?.label ?? ""}
              // </Button>
            }
            backButton={
              <Button
                size="small"
                disabled={currentStep === 0 || !isPrevStep || isTransferEnded}
                variant="contained"
                color="primary"
                hidden={currentStep <= 0 || (currentStep === 0 && isPrevStep)}
                onClick={goPrev}
                startIcon={currentStep > 0 && <KeyboardArrowLeft />}
              >
                {steps[activeStep - 1] ?? 'Assets'}
              </Button>
              // <Button size="small" disabled={loading} color="primary" onClick={handleBack} variant="contained" startIcon={<KeyboardArrowLeft />}>
              //   {steps[activeStep - 1]?.label ?? ""}
              // </Button>
            }
          />
        </div>
      ) : (
        <div className="position-relative">
          <Grid container xs={12}>
            <Grid item xs={12} sm={2} md={1} className="d-flex align-items-center justify-content-center mt-2">
              {!isMobile && (
                <>
                  <div>
                    {
                      <div>
                        <IconButton disabled={currentStep === 0 || !isPrevStep || isTransferEnded} onClick={goPrev} className="stepperButton">
                          <TiArrowBack size={30} />
                        </IconButton>
                      </div>
                    }
                  </div>
                </>
              )}
            </Grid>
            <Grid item xs={12} sm={8} md={10}>
              <div className={classes.pStepper}>
                <Grid container>
                  <Grid item xs={6}>
                    {isMobile && (
                      <>
                        <div>
                          {
                            <div>
                              <IconButton
                                color="primary"
                                disabled={currentStep === 0 || !isPrevStep || isTransferEnded}
                                onClick={goNext}
                                size="small"
                              >
                                <IoIosArrowDropleftCircle />
                              </IconButton>
                            </div>
                          }
                        </div>
                      </>
                    )}
                  </Grid>
                  <Grid item xs={6} className="d-flex align-items-center justify-content-end mt-1 mb-1">
                    {isMobile && (
                      <>
                        <div>
                          {
                            <div>
                              {
                                <IconButton
                                  color="primary"
                                  onClick={goNext}
                                  size="small"
                                  disabled={(isInternal ? currentStep >= 1 : currentStep >= 2) || !isNextStep || isTransferEnded}
                                >
                                  Next
                                </IconButton>
                              }
                            </div>
                          }
                        </div>
                      </>
                    )}
                  </Grid>
                </Grid>
                <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={isTransferEnded ? steps.length + 1 : activeStep}>
                  {steps.map((label: string, i: number) => (
                    <Step
                      key={label}
                      className={clsx(classes.step, {
                        [classes.active]: currentStep > i || isTransferEnded,
                        [classes.currentStep]: currentStep === i,
                        [classes.inActive]: currentStep !== i
                      })}
                    >
                      <StepLabel style={{ color: '#555' }} className="currentStepColor">
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </div>
            </Grid>
            <Grid item xs={12} sm={2} md={1} className="d-flex align-items-center justify-content-center mt-2 ">
              {!isMobile && (
                <>
                  <div>
                    {
                      <div>
                        {
                          <IconButton
                            onClick={goNext}
                            disabled={(isInternal ? currentStep >= 1 : currentStep >= 2) || !isNextStep || isTransferEnded}
                            className="stepperButtonNext"
                          >
                            <RiShareForwardFill />
                          </IconButton>
                        }
                      </div>
                    }
                  </div>
                </>
              )}
            </Grid>
          </Grid>
        </div>
      )}
    </div>
  );
};

export default TransferSteps;
