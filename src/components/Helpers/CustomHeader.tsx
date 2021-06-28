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
    if (newFilter != null) {
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
        <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center">
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
        <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1" justify="flex-end">
          {children}
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
