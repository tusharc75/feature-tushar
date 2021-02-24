import React from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import {
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Grid,
  Typography,
  Paper,
} from "@material-ui/core";
import { Check } from "@material-ui/icons";

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
    left: "calc(-90% - 16px)",
    right: "calc(10% - 16px)",
  },
  line: {
    borderColor: "#09445A",
    borderTopWidth: 3,
    borderRadius: 1,
    color: "#09445A"
  },
}))(StepConnector);

const useQontoStepIconStyles = makeStyles((theme) => ({
  root: {
    color: "#09445A",
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
    color: theme.palette.darkBg,
  },
  check: {
    zIndex: 1,
    fontSize: 18,
    color: "white",
  },
}));

function QontoStepIcon(props) {
  const classes = useQontoStepIconStyles();

  return (
    <div
      className={clsx(classes.root)}
    >
      <div
        className={clsx(classes.circle)}
      >
        <Check className={classes.check} />
      </div>
    </div>
  );
}

const NewStepper = ({steps, heading}) => {
  const classes = useStyles();
  
  return (
    <Paper elevation={0} className={classes.container}>
      <Typography variant="h6">{heading}</Typography>

      <Grid container justify="space-between" alignItems="center">
        <Grid item xs={12} md={12} lg={7}>
          <Stepper
            activeStep={-1}
            connector={<QontoConnector />}
            alternativeLabel
          >
            {steps.map((label) => (
              <Step key={label.id}>
                <StepLabel StepIconComponent={QontoStepIcon}>
                  <div style={{color: "#09445A"}}>{label.name}</div>
                  <div style={{color: "#09445A"}}>{label.currency || "$"}{label.limit}</div>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Grid>
      </Grid>
      </Paper>
  );
};

export default NewStepper;
