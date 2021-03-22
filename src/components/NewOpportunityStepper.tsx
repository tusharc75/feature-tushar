import React from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import {
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
} from "@material-ui/core";
import { Edit } from "@material-ui/icons";
import { Check } from "@material-ui/icons";

function getSteps() {
  return [
    "Create",
    `RFQ to ${"\n"} Supplier`,
    `Supplier Quote ${"\n"} Accepted`,
    "Propose",
    "DOA",
    "Quote Sent",
    `Accept/ ${"\n"} Decline`,
    "Close",
  ];
}

function getStepContent(stepIndex) {
  switch (stepIndex) {
    case 0:
      return "Select campaign settings...";
    case 1:
      return "What is an ad group anyways?";
    case 2:
      return "This is the bit I really care about!";
    default:
      return "Unknown stepIndex";
  }
}

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
  },

  infoContainer: {
    display: "flex",
    marginTop: theme.spacing(2),
    justifyContent: "space-evenly",
    [theme.breakpoints.down("sm")]: "flex-start",
  },

  box: {
    backgroundColor: "#E6F4FF",
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
  },
}));

const QontoConnector = withStyles((theme) => ({
  alternativeLabel: {
    top: 10,
    left: "calc(-50% - 16px)",
    right: "calc(50% - 16px)",
  },
  active: {
    "& $line": {
      borderColor: theme.palette.primary.main,  //  darkBg
    },
  },
  completed: {
    "& $line": {
      borderColor: theme.palette.primary.main,  //  darkBg
    },
  },
  line: {
    borderColor: "#eaeaf0",
    borderTopWidth: 3,
    borderRadius: 1,
  },
}))(StepConnector);

const useQontoStepIconStyles = makeStyles((theme) => ({
  root: {
    color: "#eaeaf0",
    display: "flex",
    alignItems: "center",
  },
  active: {
    color: "#aaa",
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    backgroundColor: "currentColor",
    display: "grid",
    placeItems: "center",
    zIndex: 1,
  },
  completed: {
    color: theme.palette.primary.main,  //  darkBg
  },
  check: {
    zIndex: 1,
    fontSize: 18,
    color: "white",
  },
}));

function QontoStepIcon(props) {
  const classes = useQontoStepIconStyles();
  const { active, completed } = props;

  return (
    <div
      className={clsx(classes.root, {
        [classes.active]: active,
      })}
    >
      {completed ? (
        <div
          className={clsx(classes.circle, {
            [classes.completed]: completed,
          })}
        >
          <Check className={classes.check} />
        </div>
      ) : (
        <div
          className={clsx(classes.circle, {
            [classes.active]: active,
          })}
        >
          <Check className={classes.check} />
        </div>
      )}
    </div>
  );
}

const NewOpportunityHeader = () => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = getSteps();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };
  return (
    <Paper elevation={0} className={classes.container}>
      <Typography variant="h6">New Opportunity</Typography>

      <Grid container justify="space-between" alignItems="center">
        <Grid item xs={12} md={12} lg={5}>
          <Box className={classes.infoContainer}>
            <Box className={classes.box}>
              <Typography variant="h6">Jack Sparrow</Typography>
              <Typography
                component="div"
                style={{ display: "flex", alignItems: "center" }}
              >
                Sales Rep{" "}
                <Edit style={{ width: 18, height: 18, marginLeft: 14 }} />
              </Typography>
            </Box>
            <Box className={classes.box}>
              <Typography variant="h6">Dec 31, 2020</Typography>
              <Typography
                component="div"
                style={{ display: "flex", alignItems: "center" }}
              >
                Closed Date
              </Typography>
            </Box>
            <Box className={classes.box}>
              <Typography variant="h6">InduSteel</Typography>
              <Typography
                component="div"
                style={{ display: "flex", alignItems: "center" }}
              >
                Accounts
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={12} lg={7}>
          <Stepper
            activeStep={activeStep}
            connector={<QontoConnector />}
            alternativeLabel
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Grid>
      </Grid>
      {/* <div>
        {activeStep === steps.length ? (
          <div>
            <Typography className={classes.instructions}>
              All steps completed
            </Typography>
            <Button onClick={handleReset}>Reset</Button>
          </div>
        ) : (
          <div>
            <Typography className={classes.instructions}>
              {getStepContent(activeStep)}
            </Typography>
            <div>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                className={classes.backButton}
              >
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={handleNext}>
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div> */}
    </Paper>
  );
};

export default NewOpportunityHeader;
