import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, Box, Avatar, Paper, Tooltip } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 0,
  },
  detailHeader: {
    borderBottom: "1px solid #e9e9e9",
    padding: "4px 11px",
    background: "#f5f5f5",
    borderRadius: "6px 6px 0 0"
  },
  box: {
    padding: theme.spacing(0.5, 1.5),
    borderRadius: "4px",
    margin: theme.spacing(1.5),
    boxShadow: "2px 2px 4px #2e0607",
    background: "linear-gradient(to bottom right, #570305 0%, #c54e52 100%);"
  },
  labelColor: {
    color: "#fff",
  },
  skeleton: {
    marginRight: "10px",
  },
}));

const DetailsPageHeader = (props) => {
  const { mainPoints, heading, children, showHeading, loading, isApproved } = props;
  const classes = useStyles();
  return (
    <>
      <Paper elevation={0}>
        <Grid container justify="space-between" className="detailHeader">
          <Grid item className="d-flex align-items-center gap-1">
            {loading ? (
              <Skeleton width={100} />
            ) : showHeading ? (
              <>
                <Typography
                  className="text-capitalize"
                  style={{ display: "inline-block" }}
                  variant="h6"
                  component="h2"
                  color="primary"
                >
                  <span className="d-flex align-items-center gap-2"><span className="listingHeader">{heading}</span> {
                    isApproved && <Tooltip title="Approved"><CheckCircleIcon color="primary" /></Tooltip>
                  }</span>


                </Typography>
              </>
            ) : null}
          </Grid>
          <Grid item>{children}</Grid>
        </Grid>
        <Box display="flex">
          {loading ? (
            <Grid container wrap="nowrap">
              {[...Array(4).keys()].map((i, index) => (
                <React.Fragment key={index}>
                  <Skeleton
                    variant="rect"
                    className={classes.skeleton}
                    width={80}
                    height={50}
                  />
                  <Box marginY={1} />
                </React.Fragment>
              ))}
            </Grid>
          ) : mainPoints && Object.keys(mainPoints).length ? (
            Object.keys(mainPoints).map((key, i) => {
              return (
                <React.Fragment key={i}>
                  {mainPoints[key] ? (

                    <Box className={classes.box}>
                      <Typography
                        align="center"
                        variant="subtitle1"
                        style={{ opacity: 0.9 }}
                        className={`text-capitalize ${classes.labelColor}`}
                      >
                        {key}
                      </Typography>
                      <Typography
                        align="center"
                        className={classes.labelColor}
                        style={{ fontWeight: 500 }}
                      >
                        {mainPoints[key] || ""}
                      </Typography>
                    </Box>
                  ) : null}
                </React.Fragment>
              );
            })
          ) : null}
        </Box>
      </Paper>
    </>
  );
};

DetailsPageHeader.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  inactive: PropTypes.any,
  heading: PropTypes.string.isRequired,
  children: PropTypes.node,
  loading: PropTypes.any,
  logo: PropTypes.any,
  mainPoints: PropTypes.any,
  showHeading: PropTypes.any,
  isApproved: PropTypes.any
};

export default DetailsPageHeader;
