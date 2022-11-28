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
  Chip,
  Box
} from "@material-ui/core";
import { Check } from "@material-ui/icons";
import { getUniqueCurrencies } from "../../constants/helpers";
import { FcCancel } from "react-icons/fc";
import { FaHourglassHalf } from "react-icons/fa";
import { Link } from "react-router-dom";

import HtmlTooltip from '../../components/CustomTooltipTitle'
import routes from "./Routes";

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
    display: "grid",
    placeItems: "center",
    zIndex: 1,
    border: "2px solid #163340",
    padding: "5px 23px 23px 5px",
    marginTop: "-6px",
    background: "#f6f6f6"
  },
  completed: {
    color: theme.palette.primary.main,  //  darkBg
  },
  check: {
    zIndex: 1,
    fontSize: 18,
    color: "#09445A",
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
    border: "2px solid #163340",
    padding: "5px 23px 23px 5px",
    marginTop: "-6px",
    background: "#f6f6f6"
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
const NewStepper = ({ steps = null, heading, doaCurrency = null, quoteDOA = null, doaApproveType = "User" }) => {
  const classes = useStyles();

  return (
    <Paper elevation={0} className={classes.container}>
      <Typography variant="h6">{heading}</Typography>

      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} md={12} lg={7}>
          <Stepper
            activeStep={-1}
            connector={<QontoConnector />}
            alternativeLabel
          >
            {
              quoteDOA ?
                (quoteDOA.map((label, index) => (
                  <Step key={index}>
                    <StepLabel StepIconComponent={label?.status === "approve" ?
                      QontoStepIconForApprove
                      : label?.status === "pending" ?
                        QontoStepIconForPending :
                        QontoStepIconForReject
                    }>
                      <>
                        {label?.status === "pending" ?
                          (<>
                            {label?.users?.slice(0, 3).map((obj) => (
                              <div style={{ color: "#09445A" }}>
                                <Link
                                  title={obj?.firstName}
                                  className="link"
                                  to={`${routes.userDetail.path}/${obj?.id}`}
                                >
                                  {`${obj?.firstName} ${obj?.lastName}`}
                                </Link>
                              </div>
                            ))}
                            {label?.users?.length > 4 && `+ ${label?.users.length - 4} more`}
                          </>
                          )
                          : <div style={{ color: "#09445A" }}>
                            <Link
                              title={label?.users.find(d => d?.status === label?.status)?.firstName}
                              className="link"
                              to={`${routes.userDetail.path}/${label?.users.find(d => d?.status === label?.status)?.id}`}
                            >
                              {`${label?.users.find(d => d?.status === label?.status)?.firstName} ${label?.users.find(d => d.status === label?.status)?.lastName}`}
                            </Link>
                          </div>


                        }
                      </>
                    </StepLabel>
                  </Step>
                )))
                : (steps.filter((item) => !item?.disable).map((label) => (
                  <Step key={label}>
                    <StepLabel StepIconComponent={QontoStepIcon}>
                      {doaApproveType === "User" ?
                        <>
                          {label?.user?.slice(0, 3).filter(user => (user?.firstName && user?.lastName)).map((obj) => (
                            <div style={{ color: "#09445A" }}>
                              <Link
                                title={obj?.firstName}
                                className="link"
                                to={`${routes.userDetail.path}/${obj?._id}`}
                              >
                                {`${obj?.firstName} ${obj?.lastName}`}
                              </Link>
                            </div>
                          ))}
                          {label?.users?.length > 4 && `+ ${label?.users.length - 4} more`}
                          {doaCurrency && <div style={{ color: "#09445A" }}>{
                            getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency).length
                              ? getUniqueCurrencies().filter(
                                (data) => data?.currencyCode === doaCurrency
                              )[0].symbolNative
                              : null}{label?.amount}
                          </div>}
                        </>
                        : <>
                          {label?.role?.slice(0, 3).filter(role => role?.name).map((obj) => (
                            <div style={{ color: "#09445A" }}>
                              <Link
                                title={obj?.name}
                                className="link"
                                to={`${routes.roleDetail.path}/${obj?._id}`}
                              >
                                {`${obj?.name}`}
                              </Link>
                            </div>
                          ))}
                          {label?.role?.length > 4 && `+ ${label?.role.length - 4} more`}
                          {doaCurrency && <div style={{ color: "#09445A" }}>{
                            getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency).length
                              ? getUniqueCurrencies().filter(
                                (data) => data?.currencyCode === doaCurrency
                              )[0].symbolNative
                              : null}{label?.amount}
                          </div>}
                        </>
                      }

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
