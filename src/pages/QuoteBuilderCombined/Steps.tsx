import React, { useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CreateIcon from "@material-ui/icons/Create";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import SettingsIcon from "@material-ui/icons/Settings";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import clsx from "clsx";
import { GiBackwardTime } from "react-icons/gi";
import { StepIconProps } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    padding: "26px 10px !important",
    background: "#fefefe",
    boxShadow: "3px 4px 8px #cfcdcd",
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  stepperNext: {
    marginTop: "10px",
    position: "absolute",
    left: "32%",
  },
}));

const useColorlibStepIconStyles = makeStyles({
  root: {
    backgroundColor: "#ccc",
    zIndex: 1,
    color: "#fff",
    width: 30,
    height: 30,
    display: "flex",
    borderRadius: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    backgroundImage:
      "linear-gradient( 136deg, rgb(30,118,130) 0%, rgb(30,118,130) 50%, rgb(30,118,130) 100%)",
    boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
  },
  completed: {
    backgroundImage:
      "linear-gradient( 136deg, rgb(4,125,28) 0%, rgb(4,125,28) 50%, rgb(4,125,28) 100%)",
  },
  rejected: {
    backgroundImage:
      "linear-gradient( 136deg, rgb(178, 0, 0) 0%, rgb(178, 0, 0) 50%, rgb(178, 0, 0) 100%)",
  },
});

const Steps = (props) => {
  console.log("Stepper Props");
  console.log(props);
  const { steps, currentStep, id, version, Refresh, nextStep, versionStatus } =
    props;
  const classes = useStyles();
  var activeStep = currentStep;
  const toastConfig = useContext(CustomToastContext);

  const ColorlibStepIcon = (props: StepIconProps) => {
    console.log(props);
    const classes = useColorlibStepIconStyles();
    var { active, completed } = props;
    var rejected = false;
    let status = 1;
    if (active) {
      if (versionStatus === "Sent for DOA") {
        if (props.icon === 4) {
          status = 5;
        }
      } else if (versionStatus === "Sent to Customer") {
        if (steps.length === 6) {
          if (props.icon === 5) {
            status = 5;
          }
        } 
        else {
          if (props.icon === 4) {
            status = 5;
          }
        }
      } else {
        status = 2;
      }
    } else if (completed) {
      status=3
      if (versionStatus.includes("Rejected by DOA")) {
        if (props.icon > 3) {
          status = 4;
          rejected = true;
          completed = false;
        }
      } else if (versionStatus.includes("Rejected by Customer")) {
        if (steps.length === 6) {
          if (props.icon > 4) {
            status = 4;
            rejected = true;
            completed = false;
          }
        } else {
          if (props.icon > 3) {
            status = 4;
            rejected = true;
            completed = false;
          }
        }
      } 
    }
    if(props.icon===steps.length && props.active){
      if(versionStatus.includes("Rejected")){
        status=4
        active=false;
        completed=false;
        rejected=true;
      }
      else{
        status=3
        completed=true;
        active=false
      }
    }

    const icons: { [index: string]: React.ReactElement } = {
      1: <GiBackwardTime />,
      2: <CreateIcon />,
      3: <CheckIcon />,
      4: <CloseIcon />,
      5: <MoreHorizIcon />,
    };

    return (
      <div
        className={clsx(classes.root, {
          [classes.active]: active,
          [classes.completed]: completed,
          [classes.rejected]: rejected,
        })}
      >
        {icons[String(status)]}
      </div>
    );
  };

  const handleNext = () => {
    axiosInstance()
      .post(`quote-builder/updateprocess/${id}?version=${version}`, {
        processStatus: steps[activeStep + 1],
      })
      .then(({ data }) => {
        const nextStep = activeStep + 1;
        console.log(nextStep);
        activeStep = activeStep + 1;
        Refresh(version);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleBack = () => {
    axiosInstance()
      .post(`quote-builder/updateprocess/${id}?version=${version}`, {
        processStatus: steps[activeStep - 1],
      })
      .then(({ data }) => {
        const nextStep = activeStep - 1;
        console.log(nextStep);
        activeStep = activeStep - 1;
        Refresh(version);
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
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        {activeStep === steps.length - 1 ? (
          <div className="d-flex align-items-center justify-content-center">
            <Typography className={classes.instructions}>
              All steps completed
            </Typography>
          </div>
        ) : (
          <div>
            <div className={classes.stepperNext}>
              {activeStep === 1 || activeStep === 2 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBack}
                >
                  Back
                </Button>
              ) : null}
              {(activeStep===4 || (steps.length===6 && activeStep===5)) ?(<Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={nextStep ? false : true}
              >
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>):null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Steps;
