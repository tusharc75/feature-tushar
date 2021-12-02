import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import clsx from "clsx";
import IconButton from '@material-ui/core/IconButton';
import {

  Grid,
} from "@material-ui/core";
import {

  IoIosArrowDropleftCircle,
} from "react-icons/io";
import { isMobile } from "react-device-detect";
import { TiArrowBack } from "react-icons/ti";
import { RiShareForwardFill } from "react-icons/ri";

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
    justifyContent: "space-evenly",
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
    margin: "2px",
    borderRadius: "12px 40px 40px 50px",
    border: "1px solid #d6d5d5",
    [theme.breakpoints.down("xs")]: {
      width: "50%",
      padding: "2px"
    },
  },
  inActive: {
    flex: "1",
    background: "#ebebeb",
    borderLeft: "6px solid var(--grey)",
  },
  currentStep: {
    flex: "1",
    background: "#ffffff",
    borderLeft: "6px solid #378280",
    color: "#378280 !important",

  },
  active: {
    flex: "1",
    background: "#c8e9ce",
    borderBottom: "0px solid var(--warning)",
    color: "var(--secondary) !important",
    borderLeft: "6px solid var(--secondary)",
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

const TransferSteps = (props) => {
  const {
    isNextStep,
    steps,
    currentStep,
    isTransferEnded,
    setCurrentStep,
    hasAssets
  } = props;
  const classes = useStyles();
  let activeStep = currentStep;

  return (
    <div>
      <div className="position-relative">
        <Grid container xs={12}>
          <Grid
            item
            xs={12}
            sm={2}
            md={1}
            className="d-flex align-items-center justify-content-center mt-2"
          >
            {!isMobile && (
              <>
                <div>
                  {(
                    <div>
                      <IconButton
                        disabled={currentStep === 0 || isTransferEnded}
                        onClick={() => {
                          setCurrentStep(currentStep - 1)
                        }}
                        className="stepperButton"
                      >
                        <TiArrowBack size={30} />
                      </IconButton>
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
                >
                  {isMobile && (
                    <>
                      <div>
                        {(
                          <div>
                            <IconButton
                              color="primary"
                              disabled={currentStep === 1 || (currentStep === 0 && !isNextStep) || isTransferEnded}
                              onClick={() => {
                                setCurrentStep(currentStep + 1)
                              }}
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
                  {isMobile && (
                    <>
                      <div>
                        {(
                          <div>
                            {(
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  setCurrentStep(currentStep + 1)
                                }}
                                size="small"
                                disabled={currentStep >= 1 || !hasAssets || isTransferEnded}

                              >
                                Next
                              </IconButton>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </Grid>
              </Grid>
              <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={activeStep}>
                {steps.map((label: string, i: number) => (
                  <Step
                    key={label}
                    className={clsx(classes.step, {
                      [classes.active]: currentStep > i || isTransferEnded,
                      [classes.currentStep]: currentStep === i,
                      [classes.inActive]: currentStep !== i,

                    })}
                  >
                    <StepLabel
                      style={{ color: "#555" }}
                      className="currentStepColor"
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
            className="d-flex align-items-center justify-content-center mt-2 "
          >
            {!isMobile && (
              <>
                <div>
                  {(
                    <div>
                      {(
                        <IconButton

                          onClick={() => {
                            setCurrentStep(currentStep + 1)
                          }}
                          disabled={currentStep >= 1 || !hasAssets || isTransferEnded}
                          className="stepperButtonNext"
                        >
                          <RiShareForwardFill />
                        </IconButton>
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

export default TransferSteps;
