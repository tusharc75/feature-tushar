import React, { useState } from "react";
import PropTypes from "prop-types";
import { Grid } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

import "./customheader.scss";

const CustomHeader = (props) => {
  const { heading, children, options, onTypeChange, icon } = props;

  const [filter, setFilter] = useState("All Accounts");

  const handleFilter = (event, newFilter) => {
    if (filter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
    }
  };

  return (
    <React.Fragment>
      <Grid
        container
        className="header-panel"
        justify="space-between"
        alignContent="center"
      >
        <Grid item className="d-flex align-items-center gap-1">
          {icon} <span className="listingHeader">{heading}</span>
          {options && (
            <ToggleButtonGroup
              size="small"
              className="ml-8"
              value={filter}
              exclusive
              onChange={handleFilter}
            >
              {options.map((k, index) => {
                return (
                  <ToggleButton value={k.key} key={index}>
                    {k.key}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          )}
        </Grid>
        {/* <Box className="ml-2">
          {icon} */}
        {/* {options && Object.keys(options).length ? (

            <FormControl className="customHeaderDropdown">
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
          ) : null} */}
        {/* <div className="customActiveInavtiveTab">
            {total ? (
              <Box
                className="customHeaderCustomTab"
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Badge badgeContent={total} color="primary">
                  <Chip label={heading}></Chip>
                </Badge>
              </Box>
            ) : null}

            {active ? (
              <Box
                className="customHeaderActiveCustomTab"
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Badge badgeContent={active} color="primary">
                  <Chip label=" Active Customs" />
                </Badge>
              </Box>
            ) : null}

            {inactive ? (
              <Box
                className="customHeaderInactiveCustomTab"
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Badge badgeContent={inactive} color="secondary">
                  <Chip label="Inactive Customs" />
                </Badge>
              </Box>
            ) : null}
            <Box component="span" marginX={1} />
          </div> */}
        {/* </Box> */}
        <Grid item>
          <Grid container alignItems="center" style={{ height: "100%" }}>
            {children}
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

CustomHeader.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  inactive: PropTypes.any,
  heading: PropTypes.string.isRequired,
  children: PropTypes.node,
  selectedType: PropTypes.any,
  onTypeChange: PropTypes.any,
  options: PropTypes.any,
  icon: PropTypes.any,
  secondHeading: PropTypes.string,
};

export default CustomHeader;
