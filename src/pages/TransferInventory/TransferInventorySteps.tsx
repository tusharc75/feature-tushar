import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import clsx from 'clsx';
import { isMobile, isTablet } from 'react-device-detect';
import CustomMobileStepperOpportunities from 'src/components/CustomMobileStepperOpportunities';

const useStyles = makeStyles((theme) => ({
  pStepper: {
    margin: '0px auto',
    maxWidth: 800,
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

interface Props {
  steps: string[];
  currentStep: number;
  isTransferEnded?: boolean;
}

const TransferSteps = (props: Props) => {
  const { steps, currentStep, isTransferEnded } = props;
  const classes = useStyles();

  return (
    <>
      {isMobile && !isTablet ? (
        <div>
          <CustomMobileStepperOpportunities stepName={steps[currentStep]} nextButton={<></>} backButton={<></>} />
        </div>
      ) : (
        <div className="position-relative">
          <div className={classes.pStepper}>
            <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={isTransferEnded ? steps.length + 1 : currentStep}>
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
        </div>
      )}
    </>
  );
};

export default TransferSteps;
