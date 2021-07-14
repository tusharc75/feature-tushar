import React, { useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import clsx from "clsx";
import { GiBackwardTime } from "react-icons/gi";
import IconButton from '@material-ui/core/IconButton';

import {
  StepIconProps,
  Grid,
  Dialog,
  ListItemText,
  ListItem,
  List,
  ListItemIcon,
  Checkbox,
  TextField,
} from "@material-ui/core";
import {
  IoIosArrowDroprightCircle,
  IoIosArrowDropleftCircle,
} from "react-icons/io";
import { GoPencil } from "react-icons/go";
import { BsCheckCircle } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { FcCancel } from "react-icons/fc";
import { FcClock } from "react-icons/fc";
import { FcApproval } from "react-icons/fc";
import { FaHourglassHalf } from "react-icons/fa";
import NewStepper from "../../components/Helpers/NewStepper";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import { isMobile } from "react-device-detect";

const useStyles = makeStyles((theme) => ({
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    fontWeight: "bold",
  },
  pStepper: {
    padding: "10px 4px",
    borderRadius: "4px",
    [theme.breakpoints.down("xs")]: {
      padding: "4px",
    },
  },
  pbStepper: {
    overflow: "none",
    [theme.breakpoints.down("xs")]: {
      overflow: "auto"
    },
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
    [theme.breakpoints.down("xs")]: {
      width: "50%",
      padding: "2px"
    },
  },
  inActive: {
    background: "#ebebeb",
  },
  currentStep: {
    background: "#ffffff",
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

const useColorlibStepIconStyles = makeStyles((theme) =>({
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
    allowedToEdit,
    DOAlimit,
    totalCost,
    handleSendReminder = null,
    reminderLoading = false,
    hideReminderButton = false,
    DOAData = null,
  } = props;
  const classes = useStyles();
  let activeStep = currentStep;
  const toastConfig = useContext(CustomToastContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const options = ["Booked", "Not Booked", "Invalid"];
  const [showManualCustomerActionDialog, setShowManualCustomerActionDialog] =
    useState(false);
  const [comment, setComment] = useState("");
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
  };
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
      } else if (
        versionStatus.includes("Rejected by Customer") ||
        versionStatus.includes("Not Booked by Customer") ||
        versionStatus.includes("Invalid by Customer")
      ) {
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
      if (
        versionStatus.includes("Rejected") ||
        versionStatus.includes("Not Booked") ||
        versionStatus.includes("Invalid")
      ) {
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
      1: <GiBackwardTime size={20}/>,
      2: <GoPencil size={20}/>,
      3: <BsCheckCircle size={20}/>,
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
    if (currentStep === 2) {
      handleVersionUpdate();
    }
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

  const manualSendToCustomer = () => {
    if (selectedOption) {
      let dataObj = {
        status: selectedOption + " by Customer",
        manual: true,
      };
      if (selectedOption === "Invalid") {
        dataObj["comment"] = comment;
      }
      axiosInstance()
        .post(
          `quote-builder/updateStatusfromCustomer/${id}?version=${version}`,
          dataObj
        )
        .then(({ data }) => {
          const nextStep = activeStep + 1;

          activeStep = activeStep + 1;
          Refresh(version);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
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
    <div>
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
            {/* {steps[currentStep] === "DOA Process" && totalCost > DOAlimit && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <Typography
                  className={classes.rejected}
                  variant="body1"
                  style={{ fontWeight: "normal" }}
                >
                  User doesn't have DOA setup for this amount
                </Typography>
              </div>
            )} */}
            {versionStatus === "Sent for DOA" && (
              <>
                {DOAData && <NewStepper heading={" "} quoteDOA={DOAData} />}

                <div className="d-flex align-items-center justify-content-center flex-column m-3">
                  <FcClock size={30} />
                  <Typography className={classes.sent}>DOA Sent</Typography>
                </div>
              </>
            )}
            {versionStatus.split(" (")[0] === "Accepted  by DOA" && (
              <>
                {DOAData && <NewStepper heading={" "} quoteDOA={DOAData} />}

                <div className="d-flex align-items-center justify-content-center flex-column m-3">
                  <FcApproval size={30} />
                  <Typography className={classes.approved}>
                    Approved by DOA
                  </Typography>
                </div>
              </>
            )}
            {versionStatus.split(" (")[0] === "Rejected by DOA" && (
              <>
                {DOAData && <NewStepper heading={" "} quoteDOA={DOAData} />}

                <div className="d-flex align-items-center justify-content-center flex-column m-3">
                  <FcCancel size={30} />
                  <Typography className={classes.rejected}>
                    Rejected by DOA
                  </Typography>
                </div>
              </>
            )}
            {versionStatus === "Sent to Customer" && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcClock size={30} />
                <Typography className={classes.sent}>
                  Quote has been sent to customer
                </Typography>
              </div>
            )}
            {/* {versionStatus === "Sent to Customer" && !hideReminderButton ? (
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
            )
             : null} */}
            {versionStatus.includes("Accepted by Customer") && (
              <div className="d-flex align-items-center justify-content-center flex-column m-3">
                <FcApproval size={30} />
                <Typography className={classes.approved}>
                  Approved by Customer
                </Typography>
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
            className="d-flex align-items-center justify-content-center mt-2"
          >
            {!isMobile && activeStep !== steps.length - 1 && (
              <>
                <div>
                  {!approvedQuote.approved && (
                    <div>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={
                          !allowedToEdit ||
                          versionStatus.includes("Rejected by Customer") ||
                          (steps.length === 5 && currentStep > 3) ||
                          versionStatus.includes("Sent for DOA") ||
                          (steps.length === 6 && currentStep >= 4) ||
                          versionStatus.includes("Sent to Customer") ||
                          loading
                        }
                        onClick={handleBack}
                        size="small"
                        startIcon={<IoIosArrowDropleftCircle />}
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </Grid>
          <Grid item xs={12} sm={8} md={10}>
            <div className={classes.pStepper}>
            <Grid container>
          <Grid
            item
            xs={6}
            className="d-flex align-items-center justify-content-start mt-1 mb-1"
          >
            {isMobile && activeStep !== steps.length - 1 && (
              <>
                <div>
                  {!approvedQuote.approved && (
                    <div>
                      <IconButton
                        color="primary"
                        disabled={
                          !allowedToEdit ||
                          versionStatus.includes("Rejected by Customer") ||
                          (steps.length === 5 && currentStep > 3) ||
                          versionStatus.includes("Sent for DOA") ||
                          (steps.length === 6 && currentStep >= 4) ||
                          versionStatus.includes("Sent to Customer") ||
                          loading
                        }
                        onClick={handleBack}
                        size="small"
                      >
                       <IoIosArrowDropleftCircle />
                      </IconButton>
                    </div>
                  )}
                </div>
              </>
            )}
          </Grid>
          <Grid
            item
            xs={6}
            className="d-flex align-items-center justify-content-end mt-1 mb-1"
          >
            {isMobile && activeStep !== steps.length - 1 && (
              <>
                <div>
                  {!approvedQuote.approved && (
                    <div>
                      {versionStatus.split(" ")[0] !== "Rejected" ? (
                        <IconButton
                          color="primary"
                          onClick={() => {
                            if (
                              versionStatus.includes("Sent to Customer") ||
                              steps[currentStep] === "Send To Customer" ||
                              versionStatus === "Sent to Customer"
                            ) {
                              setShowManualCustomerActionDialog(true);
                            } else {
                              handleNext();
                            }
                          }}
                          size="small"
                          disabled={
                            !allowedToEdit ||
                            loading ||
                            !nextStep ||
                            versionStatus.includes("Accepted  by DOA")
                            // || versionStatus.includes("Sent to Customer") ||
                            // steps[currentStep] === "Send To Customer" ||
                            // versionStatus === "Sent to Customer"
                          }   
                        >
                          {versionStatus.includes("Accepted  by DOA")
                            ? "End"
                            :<IoIosArrowDroprightCircle />}
                        </IconButton>
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
              <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={activeStep}>
                {steps.map((label, i) => (
                  <Step
                    key={label}
                    className={clsx(classes.step, {
                      [classes.active]:
                        currentStep > i ||
                        steps[currentStep] === "End" ||
                        approvedQuote.approved,
                      [classes.currentStep]: currentStep === i,
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
            className="d-flex align-items-center justify-content-center"
          >
            {!isMobile &&  activeStep !== steps.length - 1 && (
              <>
                <div>
                  {!approvedQuote.approved && (
                    <div>
                      {versionStatus.split(" ")[0] !== "Rejected" ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            if (
                              versionStatus.includes("Sent to Customer") ||
                              steps[currentStep] === "Send To Customer" ||
                              versionStatus === "Sent to Customer"
                            ) {
                              setShowManualCustomerActionDialog(true);
                            } else {
                              handleNext();
                            }
                          }}
                          size="small"
                          disabled={
                            !allowedToEdit ||
                            loading ||
                            !nextStep ||
                            versionStatus.includes("Accepted  by DOA")
                            // || versionStatus.includes("Sent to Customer") ||
                            // steps[currentStep] === "Send To Customer" ||
                            // versionStatus === "Sent to Customer"
                          }
                          endIcon={<IoIosArrowDroprightCircle />}
                        >
                          {versionStatus.includes("Accepted  by DOA")
                            ? "End"
                            : "Next"}
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

      {showManualCustomerActionDialog && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={showManualCustomerActionDialog}
          onClose={() => setShowManualCustomerActionDialog(false)}
          aria-labelledby="assign-roles-dialog"
        >
          <CustomDialogHeader title={`Reason For Ending`} />
          <CustomDialogContent>
            <>
              <List style={{ padding: 0 }}>
                {options.map((option) => (
                  <ListItem divider>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          e.target.checked
                            ? setSelectedOption(option)
                            : setSelectedOption(null);
                        }}
                        checked={option === selectedOption}
                        inputProps={{
                          "aria-labelledby": `checkbox-list-label-${option}`,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={option} />
                  </ListItem>
                ))}
              </List>
              {selectedOption === "Invalid" && (
                <TextField
                  id="outlined-multiline-static"
                  label="Comment"
                  multiline
                  value={comment}
                  onChange={handleChange}
                  rows={4}
                  variant="outlined"
                />
              )}
            </>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              onClick={() => setShowManualCustomerActionDialog(false)}
              color="primary"
              size="small"
            >
              Cancel
            </Button>
            <Button
              onClick={manualSendToCustomer}
              color="primary"
              size="small"
              variant="contained"
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
