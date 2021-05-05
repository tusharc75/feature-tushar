import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, Box, Select, MenuItem } from "@material-ui/core";
import Container from "./CustomContainer";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100%!important",
    marginTop: 5,
  },
  box: {
    backgroundColor: "#E6F4FF",
    borderRadius: 6,
    padding: theme.spacing(0.5, 1.5),
    marginTop: 5,
    marginLeft: 5,
  },
}));

const BrandHeader = (props) => {
  const {
    total,
    totalHeading,
    active,
    activeHeading,
    inActive,
    inActiveHeading,
    heading,
    children,
    showHeading,
    showDropDown,
    onChange,
    values,
    options,
    placeholder,
  } = props;
  const classes = useStyles();

  return (
    <React.Fragment>
      <Container>
        <Grid container justify="space-between">
          <Grid item>
            {showHeading ? (
              <Typography variant="h6" component="h2">
                {heading}
              </Typography>
            ) : null}
            {showDropDown && Object.keys(options).length ? (
              <Select
                style={{ width: "160px" }}
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                value={values}
                onChange={onChange}
                label="Select Type"
              >
                {Object.keys(options).map((k, index) => {
                  return (
                    <MenuItem key={index} value={options[k]}>
                      {k}
                    </MenuItem>
                  );
                })}
              </Select>
            ) : null}
          </Grid>
          <Grid item>{children}</Grid>
        </Grid>
        <Box display="flex" id="tapleen2">
          {total ? (
            <Box className={classes.box}>
              <Typography>{`${
                totalHeading ? totalHeading : "Total " + heading
              }`}</Typography>
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
              <Typography>{`${
                activeHeading ? activeHeading : "Active " + heading
              }`}</Typography>
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
              <Typography>{`${
                inActiveHeading ? inActiveHeading : "Inactive " + heading
              }`}</Typography>
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
  inActive: PropTypes.any,
  heading: PropTypes.string.isRequired,
  children: PropTypes.node,
  totalHeading: PropTypes.any,
  activeHeading: PropTypes.any,
  inActiveHeading: PropTypes.any,
};

export default BrandHeader;
