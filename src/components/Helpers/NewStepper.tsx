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
import { getUniqueCurrencies } from "../../constants/helpers";
import { FcCancel } from "react-icons/fc";
import { FaHourglassHalf } from "react-icons/fa";

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
    color: theme.palette.primary.main,  //  darkBg
  },
  check: {
    zIndex: 1,
    fontSize: 18,
    color: "white",
  },
}));

const useQontoStepIconStylesForQuote = makeStyles((theme) => ({
  root: {
    color: "white",
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
    color: "#047d1c !important",
  },
  cancel: {
    zIndex: 1,
    fontSize: 18,
    color: "#d60f0f",

  },
  pending: {
    zIndex: 1,
    fontSize: 18,
    color: "#d1c4c4",
  },
}));

function QontoStepIcon(status) {
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

function QontoStepIconForApprove(status) {
  const classes = useQontoStepIconStylesForQuote();

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
function QontoStepIconForPending(status) {
  const classes = useQontoStepIconStylesForQuote();

  return (
    <div
      className={clsx(classes.root)}
    >
      <div
        className={clsx(classes.circle)}
      >
        <FaHourglassHalf className={classes.pending} />
      </div>
    </div>
  );
}
function QontoStepIconForReject(status) {
  const classes = useQontoStepIconStylesForQuote();

  return (
    <div
      className={clsx(classes.root)}
    >
      <div
        className={clsx(classes.circle)}
      >
        <FcCancel className={classes.cancel} />
      </div>
    </div>
  );
}
const NewStepper = ({ steps = null, heading, doaCurrency = null, quoteDOA = null }) => {
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
            {
              quoteDOA ?
                (quoteDOA.map((label) => (
                  <Step key={label.id}>
                    <StepLabel StepIconComponent={label.status === "approve" ?
                      QontoStepIconForApprove
                      : label.status === "pending" ?
                        QontoStepIconForPending :
                        QontoStepIconForReject
                    }>
                      <div style={{ color: "#09445A" }}>{`${label.firstName} ${label.lastName}`}</div>
                    </StepLabel>
                  </Step>
                )))
                : (steps.map((label) => (
                  <Step key={label.id}>
                    <StepLabel StepIconComponent={QontoStepIcon}>
                      <div style={{ color: "#09445A" }}>{label.name}</div>
                      {doaCurrency && <div style={{ color: "#09445A" }}>{
                        getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency).length
                          ? getUniqueCurrencies().filter(
                            (data) => data?.currencyCode === doaCurrency
                          )[0].symbolNative
                          : null}{label.amount}
                      </div>}

                    </StepLabel>
                  </Step>
                )))}
          </Stepper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NewStepper;
