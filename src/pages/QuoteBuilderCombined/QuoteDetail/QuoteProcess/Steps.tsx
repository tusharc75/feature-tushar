import React, { useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import axiosInstance from "../../../../axios/axiosInstance";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";
import clsx from "clsx";
import { GiBackwardTime } from "react-icons/gi";
import { RiShareForwardFill } from "react-icons/ri";
import { TiArrowBack } from "react-icons/ti";
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
  Box,
  CircularProgress
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
import NewStepper from "../../../../components/Helpers/NewStepper";
import CustomDialogFooter from "../../../../components/CustomDialog/CustomDialogFooter";
import CustomDialogContent from "../../../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../../../components/CustomDialog/CustomDialogHeader";
import { isMobile } from "react-device-detect";

const useStyles = makeStyles((theme) => ({
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    fontWeight: "bold",
  },
  pStepper: {
    padding: "5px 4px",
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
    padding: "10px 8px",
    width: "20%",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px 40px 40px 50px",
    border: "1px solid #d6d5d5",
    [theme.breakpoints.down("xs")]: {
      width: "50%",
      padding: "2px"
    },
  },
  inActive: {
    background: "#ebebeb",
    borderLeft:"6px solid var(--grey)",
  },
  currentStep: {
    background: "#ffffff",
    borderLeft:"6px solid #378280",
    color:"#378280 !important",
    // borderLeft:"4px solid #378280",

  },
  active: {
    background: "#f9f1e2",
    borderBottom:"0px solid var(--warning)",
    color:"#378280 !important",
    borderLeft:"6px solid var(--warning)",


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
  "@media (max-width: 760px)": {
      step: {
        padding: "5px 6px",
    },

  }
}));

const useColorlibStepIconStyles = makeStyles((theme) => ({
  root: {
    color: "#d1c4c4",
    width: 30,
    height: 30,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    color: "#378280 !important",
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
    handleViewPdf,
    allowedToEdit,
    DOAData = null,
    quoteData,
    globalLoading = false
  } = props;
  const classes = useStyles();
  let activeStep = currentStep;
  const toastConfig = useContext(CustomToastContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const options = ["Booked", "Not Booked", "Invalid"];
  const [showManualCustomerActionDialog, setShowManualCustomerActionDialog] =
    useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value.trimStart());
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
      1: <GiBackwardTime size={20} />,
      2: <GoPencil size={20} />,

      4: <AiOutlineCloseCircle size={20} color={rejected ? "red" : ""} />,
      5: <FaHourglassHalf size={20} />,
    };

    return (
      <div
        className={clsx(classes.root, {
          [classes.active]: active,
          [classes.completed]: completed,
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
      handleViewPdf()
    }
    axiosInstance()
      .post(`quote-builder/updateprocess/${id}?version=${version}`, {
        processStatus: steps[activeStep + 1]?.key,
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
      let tempComment = quoteData.versions[version]?.comment ?? []
      if (typeof tempComment === 'string') {
        tempComment = [tempComment];
      }
      let dataObj = {
        status: selectedOption?.trim() + " by Customer",
        manual: true,
        comment: tempComment
      };
      if (selectedOption === "Invalid") {
        dataObj.comment.push(comment);
      }

      let { comment: msg } = dataObj

      msg = msg?.filter(x => x);

      dataObj.comment = msg

      if (selectedOption === "Invalid" && comment === "") {
        setCommentError("Please write your comment!")
      } else {
        setSubmitting(true)
        axiosInstance()
          .post(
            `quote-builder/updateStatusfromCustomer/${id}?version=${version}`,
            dataObj
          )
          .then(() => {
            setSubmitting(false)
            activeStep = activeStep + 1;
            Refresh(version);
          })
          .catch((error) => {
            setSubmitting(false)
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const handleBack = () => {
    axiosInstance()
      .post(`quote-builder/updateprocess/${id}?version=${version}`, {
        processStatus: steps[activeStep - 1]?.key,
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
    setSelectedOption(null)
    setComment("")
    setCommentError(null)
  }

  return (
    <div>
      <div className="position-relative">
        {!versionStatus.includes("Accepted by Customer") &&
          approvedQuote.approved && approvedQuote.versionApproved === version && (
            <div className="d-flex align-items-center justify-content-center flex-column m-3">
              <Typography className={classes.approved}>
                Quote version - {approvedQuote.versionApproved} of this quote has
                been Approved
              </Typography>
            </div>
          )}
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
              {DOAData &&
                <>
                  <NewStepper heading={" "} quoteDOA={DOAData} />
                  <div className="d-flex align-items-center justify-content-center flex-column m-3">
                    <FcClock size={30} />
                    <Typography className={classes.sent}>DOA Sent</Typography>
                  </div>
                </>
              }
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
            className="d-flex align-items-center justify-content-center "
          >
            {!isMobile && activeStep !== steps.length - 1 && (
              <>
                <div>
                  {(
                    <div>
                      <IconButton
                        color="primary"
                        disabled={
                          currentStep <= 0 || !allowedToEdit ||
                          versionStatus.includes("Rejected by Customer") ||
                          (steps.length === 5 && currentStep > 3) ||
                          versionStatus.includes("Sent for DOA") ||
                          (steps.length === 6 && currentStep >= 4) ||
                          versionStatus.includes("Sent to Customer") ||
                          loading || globalLoading
                        }
                        className={"stepperButton"}
                        onClick={handleBack}
                      >
                        <TiArrowBack size={32}/>
                      </IconButton>
                    </div>
                  )}
                </div>
              </>
            )}
          </Grid>
          <Grid item xs={12} sm={12} md={10}>
            <div className={classes.pStepper}>
              <Grid container>
                <Grid
                  item
                  xs={6}
                  className="d-flex align-items-center justify-content-start "
                >
                  {isMobile && activeStep !== steps.length - 1 && (
                    <>
                      <div>
                        {(
                          <div>
                            <IconButton
                              color="primary"
                              disabled={
                                !allowedToEdit ||
                                approvedQuote.approved ||
                                versionStatus.includes("Rejected by Customer") ||
                                (steps.length === 5 && currentStep > 3) ||
                                versionStatus.includes("Sent for DOA") ||
                                (steps.length === 6 && currentStep >= 4) ||
                                versionStatus.includes("Sent to Customer") ||
                                loading || globalLoading
                              }
                              onClick={handleBack}
                              size="small"
                            >
                              <TiArrowBack  size={24}/>
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
                  className="d-flex align-items-center justify-content-end"
                >
                  {isMobile && activeStep !== steps.length - 1 && (
                    <>
                      <div>
                        {(
                          <div>
                            {versionStatus.split(" ")[0] !== "Rejected" ? (
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  if (
                                    versionStatus.includes("Sent to Customer") ||
                                    steps[currentStep]?.key === "Send To Customer" ||
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
                                  loading || globalLoading ||
                                  !nextStep ||
                                  versionStatus.includes("Sent for DOA") ||
                                  versionStatus.includes("Accepted  by DOA") ||
                                  steps[currentStep]?.key === "DOA Process" ||
                                  approvedQuote.approved
                                  // || versionStatus.includes("Sent to Customer") ||
                                  // steps[currentStep] === "Send To Customer" ||
                                  // versionStatus === "Sent to Customer"
                                }
                              >
                                {versionStatus.includes("Accepted  by DOA")
                                  ? "End"
                                  : <RiShareForwardFill size={20}/>}
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
                    key={label.label}
                    className={clsx(classes.step, {
                      [classes.active]:
                        currentStep > i ||
                        steps[currentStep]?.key === "End" || approvedQuote.approved,
                      [classes.currentStep]: currentStep === i,
                      [classes.inActive]: currentStep !== i,
                    })}
                  >
                    <StepLabel
                      style={{ color: "#555" }}
                      // StepIconComponent={ColorlibStepIcon}
                      className={
                        currentStep === i || approvedQuote.approved
                          ? "currentStepColor"
                          : null
                      }
                    >
                      {label.label}
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
            {!isMobile && activeStep !== steps.length - 1 && (
              <>
                <div>
                  {(
                    <div>
                      {versionStatus.split(" ")[0] !== "Rejected" ? (
                        <IconButton
                          onClick={() => {
                            if (
                              versionStatus.includes("Sent to Customer") ||
                              steps[currentStep]?.key === "Send To Customer" ||
                              versionStatus === "Sent to Customer"
                            ) {
                              setShowManualCustomerActionDialog(true);
                            } else {
                              handleNext();
                            }
                          }}
                          disabled={
                            !allowedToEdit ||
                            loading || globalLoading ||
                            !nextStep ||
                            versionStatus.includes("Sent for DOA") ||
                            versionStatus.includes("Accepted  by DOA") ||
                            steps[currentStep]?.key === "DOA Process" ||
                            approvedQuote.approved
                          }
                          className={"stepperButtonNext"}
                        >
                          <RiShareForwardFill/>
                          {versionStatus.includes("Accepted  by DOA")
                            ? ""
                            : ""}
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
      </div>

      {showManualCustomerActionDialog && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={showManualCustomerActionDialog}
          onClose={closeManualDiaog}
          aria-labelledby="assign-roles-dialog"
        >
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
            <Button
              onClick={closeManualDiaog}
              color="primary"
              size="small"
              disabled={submitting}
            >
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
