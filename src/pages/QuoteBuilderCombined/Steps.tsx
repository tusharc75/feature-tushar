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
import { StepIconProps, Grid } from "@material-ui/core";
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
import { FaHourglassHalf } from "react-icons/fa";
import { getObjKeysWithValues } from "../../constants/helpers";

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
    // marginTop: "8px",
    // position: "absolute",
    // right: "12px",
    // bottom: "0",
    // color: theme.palette.primary.main,
  },
  pStepper: {
    padding: "10px 4px",
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
    border: "1px solid #d6d5d5",
  },
  inActive: {
    background: "#ebebeb",
  },
  currentStep: {
    background: "#ffffff",
    // boxShadow: "2px 2px 6px #a7a3a3",
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
    color: "#d1c4c4",
    width: 30,
    height: 30,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    color: "#047d1c !important",
  },
  completed: {
    color: "#3f3f02 !important",
  },
  rejected: {
    color: "#b3a6a6 !important",
  },
});

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
    DOAlimit,
    totalCost,
    handleSendReminder = null,
    reminderLoading = false,
    hideReminderButton = false,
    openInvoiceDialog,
  } = props;
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
      4: <AiOutlineCloseCircle size={20} color={rejected ? "red" : ""} />,
      5: <FaHourglassHalf size={20} />,
    };

    return (
      <div
        className={clsx(classes.root, {
          [classes.active]: active,
          [classes.completed]: completed || approvedQuote.approved,
          [classes.rejected]: rejected,
        })}
      >
        {icons[approvedQuote.approved ? "3" : String(status)]}
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
        {!versionStatus.includes("Accepted by Customer") &&
        approvedQuote.approved ? (
          <div className="d-flex align-items-center justify-content-center flex-column m-3">
            <Typography className={classes.approved}>
              Quote version - {approvedQuote.versionApproved} of this quote has
              been Approved
            </Typography>
          </div>
        ) : (
          <>
            {steps[currentStep] === "DOA Process" && totalCost > DOAlimit && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <Typography
                  className={classes.rejected}
                  variant="body1"
                  style={{ fontWeight: "normal" }}
                >
                  User doesn't have DOA setup for this amount
                </Typography>
              </div>
            )}
            {versionStatus === "Sent for DOA" && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcClock size={30} />
                <Typography className={classes.sent}>DOA Sent</Typography>
              </div>
            )}
            {versionStatus.split(" (")[0] === "Accepted  by DOA" && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcApproval size={30} />
                <Typography className={classes.approved}>
                  Approved by DOA
                </Typography>
              </div>
            )}
            {versionStatus.split(" (")[0] === "Rejected by DOA" && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcCancel size={30} />
                <Typography className={classes.rejected}>
                  Rejected by DOA
                </Typography>
              </div>
            )}
            {versionStatus === "Sent to Customer" && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcClock size={30} />
                <Typography className={classes.sent}>
                  Quote has been sent to customer
                </Typography>
              </div>
            )}
            {versionStatus === "Sent to Customer" && !hideReminderButton ? (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <Button
                  className="mx-1"
                  color="primary"
                  variant="contained"
                  type="button"
                  size="small"
                  disabled={reminderLoading}
                  onClick={handleSendReminder}
                >
                  Send Reminder
                </Button>
              </div>
            ) : null}
            {versionStatus.includes("Accepted by Customer") && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcApproval size={30} />
                <Typography className={classes.approved}>
                  Approved by Customer
                </Typography>

                <Button variant="outlined" onClick={openInvoiceDialog}>
                  Update Invoice Information
                </Button>
              </div>
            )}
            {versionStatus.includes("Rejected by Customer") && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcCancel size={30} />
                <Typography className={classes.rejected}>
                  Rejected by Customer
                </Typography>
              </div>
            )}
          </>
        )}
        {/* 
        {activeStep !== steps.length - 1 && (
          <>
            <div>
              {!approvedQuote.approved && (
                <div className={classes.stepperNext}>
                  {activeStep === 1 || activeStep === 2 ? (
                    // <IoIosArrowDropleftCircle className="cursor-pointer" size={28} onClick={handleBack} />
                    <Button
                      variant="contained"
                      color="primary"
                      className="mr-1"
                      onClick={handleBack}
                      disabled={loading}
                      size="small"
                      startIcon={<IoIosArrowDropleftCircle />}
                    >
                      Back
                    </Button>
                  ) : null}
                  {versionStatus.split(" ")[0] != "Rejected" ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      size="small"
                      disabled={
                        loading ||
                        !nextStep ||
                        versionStatus.includes("Accepted  by DOA") ||
                        versionStatus.includes("Sent to Customer") ||
                        steps[currentStep] === "Send To Customer" ||
                        versionStatus === "Sent to Customer"
                      }
                      endIcon={<IoIosArrowDroprightCircle />}
                    >
                      {activeStep === steps.length - 1 ? "Finish" : "Next"}
                    </Button>
                  ) : (
                    <p>{versionStatus}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )} */}
        <Grid container>
          <Grid
            item
            xs={12}
            sm={2}
            md={1}
            className="d-flex align-items-center justify-content-end"
          >
            {activeStep !== steps.length - 1 && (
              <>
                <div>
                  {!approvedQuote.approved && (
                    <div className={classes.stepperNext}>
                      {activeStep === 1 || activeStep === 2 ? (
                        // <IoIosArrowDropleftCircle className="cursor-pointer" size={28} onClick={handleBack} />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleBack}
                          disabled={loading}
                          size="small"
                          startIcon={<IoIosArrowDropleftCircle />}
                        >
                          Back
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            )}
          </Grid>
          <Grid item xs={12} sm={8} md={10}>
            <div className={classes.pStepper}>
              <Stepper className="pbStepper" activeStep={activeStep}>
                {steps.map((label, i) => (
                  <Step
                    key={label}
                    className={clsx(classes.step, {
                      [classes.active]:
                        currentStep > i ||
                        steps[currentStep] === "End" ||
                        approvedQuote.approved,
                      [classes.currentStep]: currentStep == i,
                      [classes.inActive]: currentStep !== i,
                    })}
                  >
                    <StepLabel
                      StepIconComponent={ColorlibStepIcon}
                      className={
                        currentStep === i || approvedQuote.approved
                          ? "currentStepColor"
                          : null
                      }
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </div>
          </Grid>
          <Grid
            item
            xs={12}
            sm={2}
            md={1}
            className="d-flex align-items-center justify-content-start"
          >
            {activeStep !== steps.length - 1 && (
              <>
                <div>
                  {!approvedQuote.approved && (
                    <div className={classes.stepperNext}>
                      {versionStatus.split(" ")[0] != "Rejected" ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleNext}
                          size="small"
                          disabled={
                            loading ||
                            !nextStep ||
                            versionStatus.includes("Accepted  by DOA") ||
                            versionStatus.includes("Sent to Customer") ||
                            steps[currentStep] === "Send To Customer" ||
                            versionStatus === "Sent to Customer"
                          }
                          endIcon={<IoIosArrowDroprightCircle />}
                        >
                          {activeStep === steps.length - 1 ? "Finish" : "Next"}
                        </Button>
                      ) : (
                        <p>{versionStatus}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default Steps;
