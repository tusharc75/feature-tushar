import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, Box } from "@material-ui/core";
import Container from "./Container";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100%!important",
    marginTop: 0
  },
  box: {
    backgroundColor: "#E6F4FF",
    borderRadius: 6,
    padding: theme.spacing(0.5, 1.5),
  },
}));

const BrandHeader = (props) => {
  const { total, totalHeading, active, activeHeading, inActive, inActiveHeading, heading, children, showHeading } = props;
  const classes = useStyles();

  return (
    <React.Fragment>
      <Container>
        <Grid container justify="space-between">
          <Grid item>
            {
              showHeading ?
                <Typography variant="h6" component="h2">
                  {heading}
                </Typography> : null
            }
          </Grid>
          <Grid item>{children}</Grid>
        </Grid>
        <Box display="flex" id="tapleen2">
          {total ? (
            <Box className={classes.box}>
              <Typography>{`${totalHeading ? totalHeading : "Total " + heading}`}</Typography>
              <Typography style={{ color: "#0068AB", fontWeight: "bold" }}>
                {total}
              </Typography>
            </Box>
          ) : (
              ""
            )}
          <Box component="span" marginX={1} />
          {active ? (
            <Box className={classes.box}>
              <Typography>{`${activeHeading ? activeHeading : "Active " + heading}`}</Typography>
              <Typography style={{ color: "#1A7C1B", fontWeight: "bold" }}>
                {active}
              </Typography>
            </Box>
          ) : (
              ""
            )}
          <Box component="span" marginX={1} />
          {inActive ? (
            <Box className={classes.box}>
              <Typography>{`${inActiveHeading ? inActiveHeading : "Inactive " + heading}`}</Typography>
              <Typography style={{ color: "#D63F19", fontWeight: "bold" }}>
                {inActive}
              </Typography>
            </Box>
          ) : (
              ""
            )}
        </Box>
      </Container>
    </React.Fragment>
  );
};

BrandHeader.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  inactive: PropTypes.any,
  heading: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default BrandHeader;
