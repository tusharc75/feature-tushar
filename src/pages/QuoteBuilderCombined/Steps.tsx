import React, { useContext, useEffect,useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { GiConsoleController } from 'react-icons/gi';
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    padding: "26px 10px !important",
    background: "#fefefe",
    boxShadow: "3px 4px 8px #cfcdcd"
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  stepperNext:{
    marginTop: "10px",
    position: "absolute",
    left: "32%",
  }
}));




const Steps=(props)=> {
    console.log(props);
    const{steps,currentStep,id,version,Refresh,nextStep}=props
    const classes = useStyles();
    var activeStep=currentStep;
    const toastConfig = useContext(CustomToastContext);

    
    const getStepContent=(stepIndex)=> {
    console.log(steps[stepIndex]);
    return(steps[stepIndex]);
    }

  


  const handleNext = () => {
    axiosInstance()
    .post(`quote-builder/updateprocess/${id}?version=${version}`,{processStatus:steps[activeStep+1]})
    .then(({ data }) => {
      const nextStep=activeStep+1
      console.log(nextStep);
      activeStep=activeStep+1;
      Refresh(version)
    })
    .catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };
  return (
    <div className={classes.root}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        {activeStep === steps.length-1 ? (
          <div className="d-flex align-items-center justify-content-center">
            <Typography className={classes.instructions}>All steps completed</Typography>
          </div>
        ) : (
          <div>
            <div className={classes.stepperNext}>
              <Button variant="contained" color="primary" onClick={handleNext} disabled={nextStep?false:true}>
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Steps;