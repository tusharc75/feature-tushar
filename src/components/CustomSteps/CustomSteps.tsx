import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { FaCheckCircle } from 'react-icons/fa';
import { isMobile } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
  root: {
    // width: "98%",
    // padding: "10px",
    // margin: "1%",
    // marginBottom: '25px',
    // boxShadow: "1px 3px 3px #ddd"
  },

  button: {
    marginRight: theme.spacing(1)
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  inActive: {
    borderRadius: '12px 40px 40px 50px !important',
    background: 'var(--flow-inActive, #ebebeb)',
    border: theme.palette.type === 'dark' ? '0px solid #9f9ead !important' : '',
    borderLeft: theme.palette.type === 'dark' ? '6px solid #bab9b9 !important' : '6px solid var(--grey) !important'
  },
  currentStep: {
    background: 'var(--flow-currentStep, #fff)',
    borderRadius: '12px 40px 40px 50px !important',
    border: theme.palette.type === 'dark' ? '1px solid #f99336 !important' : '1px solid #d6d5d5 !important',
    borderLeft: theme.palette.type === 'dark' ? '6px solid #f99336 !important' : '6px solid #378280 !important',
    color: '#378280 !important'
  },
  active: {
    background: 'var(--flow-active, #c8e9ce)',
    borderRadius: '12px 40px 40px 50px !important',
    color: 'var(--secondary) !important',
    border: theme.palette.type === 'dark' ? '1px solid #686e97 !important' : '',
    borderLeft: '6px solid var(--new_theme_color) !important',
    padding: '10px 8px !important',
    ['@media (max-width: 560px)']: {
      padding: '5px 8px !important'
    }
  },
  pbStepper: {
    overflow: 'none',
    [theme.breakpoints.down('xs')]: {
      overflow: 'auto'
    }
  },
  icon: {
    fontSize: '18px !important'
  },
  text: {}
}));

export default function CustomSteps({ steps, active }) {
  const classes = useStyles();
  const [skipped] = useState(new Set());

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  return (
    <div className={classes.root}>
      <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={active + 1}>
        {steps.map((step, index) => {
          const stepProps: any = {};
          const labelProps: any = {};
          // if (isStepOptional(index)) {
          //     labelProps["optional"] = <Typography variant="caption">Optional</Typography>;
          // }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step
              key={index}
              {...stepProps}
              style={isMobile ? { width: '50%' } : { width: `${100 / steps.length}%` }}
              className={`${index <= active ? classes.active : index === active + 1 ? classes.currentStep : classes.inActive}`}
              //className={`${active > index ? classes.completed : (index === active ? classes.current : "")} ${classes[setBackGroundColor[step.text]] ?? ''}`}
            >
              <StepLabel
                className="step-label-layout"
                {...labelProps}
                icon={active >= index ? <FaCheckCircle size={18} /> : index === active ? index + 1 : index + 1}
              >
                {step.text}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </div>
  );
}
