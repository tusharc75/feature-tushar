import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Grid,
  Typography,
  Select,
  MenuItem,
  Chip,
  Badge,
} from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import "./customheader.scss";

const useStyles = makeStyles((theme) => ({
  box: {
    backgroundColor: "#E6F4FF",
    borderRadius: 6,
    padding: theme.spacing(0.5, 1.5),
  },
}));

const BrandHeader = (props) => {
  const {
    total,
    active,
    inactive,
    heading,
    children,
    options,
    onTypeChange,
    selectedType,
    icon,
    secondHeading
  } = props;
  const classes = useStyles();

  return (
    <React.Fragment>
      <Grid container justify="space-between" alignContent="center">
        <Box className="brandHeader">
          {icon}
          {options && Object.keys(options).length ? (

            <FormControl className="brandHeaderDropdown">
              <InputLabel id="demo-simple-select-label">{secondHeading}</InputLabel>
              <Select
                style={{ width: "160px" }}
                displayEmpty
                labelId="demo-simple-select-outlined-label"
                disableUnderline={true}
                inputProps={{ "aria-label": "Without label" }}
                id="demo-simple-select-outlined"
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                value={selectedType}
                onChange={onTypeChange}
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
            </FormControl>
          ) : null}
          <div className="brandActiveInavtiveTab">
            {total ? (
              <Box
                className="brandHeaderBrandTab"
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Badge badgeContent={total} color="primary">
                  <Chip label={heading}></Chip>
                </Badge>
              </Box>
            ) : null}

            {active ? (
              <Box
                className="brandHeaderActiveBrandTab"
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Badge badgeContent={active} color="primary">
                  <Chip label=" Active Brands" />
                </Badge>
              </Box>
            ) : null}

            {inactive ? (
              <Box
                className="brandHeaderInactiveBrandTab"
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Badge badgeContent={inactive} color="secondary">
                  <Chip label="Inactive Brands" />
                </Badge>
              </Box>
            ) : null}
            <Box component="span" marginX={1} />
          </div>

          {/* {total ? (
            <Box className={classes.box}>
              <Typography>{`Total ${heading}`}
                <Typography style={{ color: "#0068AB", fontWeight: "bold" }}>
                  {total}
                </Typography>
              </Typography>
            </Box>
          ) : (
              ""
            )}
          <Box component="span" marginX={1} /> */}
          {/* {active ? (
            <Box className={classes.box}>
              <Typography>{`Active ${heading}`}</Typography>
              <Typography style={{ color: "#1A7C1B", fontWeight: "bold" }}>
                {active}
              </Typography>
            </Box>
          ) : (
              ""
            )}
          <Box component="span" marginX={1} /> */}
          {/* {inactive ? (
            <Box className={classes.box}>
              <Typography>{`Inactive ${heading}`}</Typography>
              <Typography style={{ color: "#D63F19", fontWeight: "bold" }}>
                {inactive}
              </Typography>
            </Box>
          ) : (
              ""
            )} */}
        </Box>
        {/*<Grid item>*/}
        {/*  {*/}
        {/*    showHeading ?*/}
        {/*      <Typography variant="h6" component="h2">*/}
        {/*        {heading}*/}
        {/*      </Typography> : null*/}
        {/*  }*/}

        {/*</Grid>*/}
        <Grid item>
          <Grid container alignItems="center" style={{ height: "100%" }}>
            {children}
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

BrandHeader.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  inactive: PropTypes.any,
  heading: PropTypes.string.isRequired,
  children: PropTypes.node,
  selectedType: PropTypes.any,
  onTypeChange: PropTypes.any,
  options: PropTypes.any,
  icon: PropTypes.any,
  secondHeading: PropTypes.string
};

export default BrandHeader;
