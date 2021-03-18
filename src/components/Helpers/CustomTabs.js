import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Typography, Tabs, Tab } from "@material-ui/core";

const AntTabs = withStyles((theme) => ({
  root: {
    // borderBottom: "1px solid #e8e8e8",
  },
  indicator: {
    backgroundColor: theme.palette.darkBg,
  },
}))(Tabs);

const AntTab = withStyles((theme) => ({
  root: {
    textTransform: "none",
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),

    "&:hover": {
      color: theme.palette.darkBg,
      opacity: 1,
    },
    "&$selected": {
      color: theme.palette.darkBg,
      fontWeight: theme.typography.fontWeightMedium,
    },
    "&:focus": {
      color: theme.palette.darkBg,
    },
  },
  selected: {},
}))((props) => <Tab disableRipple {...props} />);

const CustomTabs = ({ value, setValue, tabs }) => {
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <div>
      <AntTabs
        value={value}
        onChange={handleTabChange}
        aria-label="ant example"
      >
        {tabs.map((tab, i) => (
          <AntTab key={i} label={tab} />
        ))}
      </AntTabs>
      <Typography />
    </div>
  );
};

export default CustomTabs;
