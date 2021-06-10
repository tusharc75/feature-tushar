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
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import clsx from "clsx";
import { GiBackwardTime } from "react-icons/gi";
import { StepIconProps } from "@material-ui/core";
import {
  IoIosArrowDroprightCircle,
  IoIosArrowDropleftCircle,
} from "react-icons/io";
import { GoPencil } from "react-icons/go";
import { BsCheckCircle } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { ImHourGlass } from "react-icons/im";
import { FcCancel } from "react-icons/fc";
import { FcClock } from "react-icons/fc";
import { FcApproval } from "react-icons/fc";

const useStyles = makeStyles((theme) => ({
  root: {
    // width: "100%",
    // padding: "26px 10px !important",
    // background: "#fefefe",
    // boxShadow: "3px 4px 8px #cfcdcd",
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    fontWeight: "bold",
  },
  stepperNext: {
    marginTop: "8px",
    position: "absolute",
    right: "22px",
    color: theme.palette.primary.main,
  },
  pStepper: {
    padding: "45px 7px 10px 7px !important",
    // border: "1px solid #ece4e4",
    // background: "#f5f5f5 !important",
    // margin: "5px 8px",
    borderRadius: "4px",
  },
  step: {
    paddingLeft: "8px",
    paddingRight: "8px",
    padding: "5px 8px",
    width: "20%",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "1px",
    borderRadius: "4px",
  },
  inActive: {
    background: "#ebebeb",
  },
  currentStep: {
    background: "#ffffff",
    boxShadow: "2px 2px 6px #a7a3a3",
  },
  currentStepColor: {
    color: "#0e7723 !important",
    fontWeight: 600,
  },
  active: {
    background: "#53ac65",
  },
  sent: {
    color: "#00acc1",
    fontWeight: "bold",
  },
  approved: {
    color: "#6ca826",
    fontWeight: "bold",
  },
  rejected: {
    color: "#d60f0f",
    fontWeight: "bold",
  },
}));

const useColorlibStepIconStyles = makeStyles({
  root: {
    width: 30,
    height: 30,
    display: "flex",
    color: "#000000",
    opacity: "0.2",
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    // backgroundImage:
    //   "linear-gradient( 136deg, rgb(30,118,130) 0%, rgb(30,118,130) 50%, rgb(30,118,130) 100%)",
    // boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
  },
  completed: {
    // backgroundImage:
    //   "linear-gradient( 136deg, rgb(4,125,28) 0%, rgb(4,125,28) 50%, rgb(4,125,28) 100%)",
  },
  rejected: {
    // background: "black",
    // backgroundImage:
    //   "linear-gradient( 136deg, rgb(178, 0, 0) 0%, rgb(178, 0, 0) 50%, rgb(178, 0, 0) 100%)",
  },
});

const Steps = (props) => {
  const { steps, currentStep, id, version, Refresh, nextStep, versionStatus } =
    props;
  const classes = useStyles();
  var activeStep = currentStep;
  const toastConfig = useContext(CustomToastContext);

  const ColorlibStepIcon = (props: StepIconProps) => {
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
        } else {
          if (props.icon === 4) {
            status = 5;
          }
        }
      } else {
        status = 2;
      }
    } else if (completed) {
      status = 3;
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
    if (props.icon === steps.length && props.active) {
      if (versionStatus.includes("Rejected")) {
        status = 4;
        active = false;
        completed = false;
        rejected = true;
      } else {
        status = 3;
        completed = true;
        active = false;
      }
    }

    const icons: { [index: string]: React.ReactElement } = {
      1: <GiBackwardTime size={20} />,
      2: <GoPencil size={20} />,
      3: <BsCheckCircle size={20} />,
      4: <AiOutlineCloseCircle size={20} />,
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

        activeStep = activeStep - 1;
        Refresh(version);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };
  return (
    <div className={classes.root}>
      <div className="position-relative">
        <>
          {versionStatus === "Sent for DOA" && (
            <div className="d-flex align-items-center justify-content-center flex-column m-3">
              <FcClock size={30} />
              <Typography className={classes.sent}>DOA Sent</Typography>
            </div>
          )}
          {versionStatus.split(" ")[0] === "Accepted" && (
            <div className="d-flex align-items-center justify-content-center flex-column m-3">
              <FcApproval size={30} />
              <Typography className={classes.approved}>
                Approved by DOA
              </Typography>
            </div>
          )}
          {versionStatus.split(" ")[0] === "Rejected" && (
            <div className="d-flex align-items-center justify-content-center flex-column m-3">
              <FcCancel size={30} />
              <Typography className={classes.rejected}>
                Rejected by DOA
              </Typography>
            </div>
          )}
        </>
        {activeStep === steps.length - 1 ? (
          <></>
        ) : (
          <>
            <div>
              <div className={classes.stepperNext}>
                {activeStep === 1 || activeStep === 2 ? (
                  // <IoIosArrowDropleftCircle className="cursor-pointer" size={28} onClick={handleBack} />
                  <Button
                    variant="contained"
                    color="primary"
                    className="mr-1"
                    onClick={handleBack}
                    size="small"
                    startIcon={<IoIosArrowDropleftCircle />}
                  >
                    Back
                  </Button>
                ) : null}

                {/* <IoIosArrowDroprightCircle className="cursor-pointer" size={28} onClick={handleNext} /> */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  size="small"
                  disabled={nextStep ? false : true}
                  endIcon={<IoIosArrowDroprightCircle />}
                >
                  {activeStep === steps.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </>
        )}
        <div className={classes.pStepper}>
          <Stepper activeStep={activeStep}>
            {steps.map((label, i) => (
              <>
                <Step
                  key={label}
                  className={clsx(classes.step, {
                    [classes.active]: currentStep > i,
                    [classes.currentStep]: currentStep == i,
                    [classes.inActive]: currentStep !== i,
                  })}
                >
                  <StepLabel
                    StepIconComponent={ColorlibStepIcon}
                    className={
                      currentStep == i ? classes.currentStepColor : null
                    }
                  >
                    {label}
                  </StepLabel>
                </Step>
              </>
            ))}
          </Stepper>
        </div>
      </div>
    </div>
  );
};

export default Steps;
