import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, Box, Avatar, Paper } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 0,
  },
  box: {
    backgroundColor: "#E6F4FF",
    borderRadius: 6,
    padding: theme.spacing(0.6, 1.8),
  },
  customHeaderPaper: {
    marginBottom: "16px",
    padding: "10px",
  },
  labelColor: {
    color: "#1a91b5",
  },
  avatar: {
    width: 20,
    height: 20,
    display: "inline-block",
    marginRight: "10px",
  },
  skeleton: {
    marginRight: "10px",
  },
}));

const DetailsPageHeader = (props) => {
  const { mainPoints, heading, children, showHeading, logo, loading } = props;
  const classes = useStyles();
  return (
    <>
      <Paper className={`${classes.customHeaderPaper} my-2`} elevation={0}>
        <Grid container justify="space-between">
          <Grid item>
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
                  {logo ? (
                    <Avatar
                      src={logo}
                      className={classes.avatar}
                      alt="acc_logo"
                    />
                  ) : null}
                  <span>{heading}</span>
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
                    <React.Fragment>
                      <Box className={classes.box}>
                        <Typography
                          align="center"
                          variant="subtitle1"
                          className={`text-capitalize ${classes.labelColor}`}
                        >
                          {key}
                        </Typography>
                        <Typography
                          align="center"
                          color="primary"
                          style={{ fontWeight: 500 }}
                        >
                          {mainPoints[key] || ""}
                        </Typography>
                      </Box>
                      <Box component="span" marginX={1} />
                    </React.Fragment>
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
};

export default DetailsPageHeader;
