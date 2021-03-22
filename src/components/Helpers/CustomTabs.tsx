import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Typography, Tabs, Tab } from "@material-ui/core";

const AntTabs = withStyles((theme) => ({
  root: {
    // borderBottom: "1px solid #e8e8e8",
  },
  indicator: {
    backgroundColor: theme.palette.primary.main,  //  dargBg
  },
}))(Tabs);

const AntTab = withStyles((theme) => ({
  root: {
    textTransform: "none",
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),

    "&:hover": {
      color: theme.palette.primary.main,  //  dargBg
      opacity: 1,
    },
    "&$selected": {
      color: theme.palette.primary.main,  //  dargBg
      fontWeight: theme.typography.fontWeightMedium,
    },
    "&:focus": {
      color: theme.palette.primary.main,  //  darkBg
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
          <AntTab key={i} />
        ))}
      </AntTabs>
      <Typography />
    </div>
  );
};

export default CustomTabs;
