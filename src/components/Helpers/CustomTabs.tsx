import React from "react";
import { makeStyles, withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography, Tabs, Tab } from "@material-ui/core";

const AntTabs = withStyles((theme) => ({
  root: {
    // borderBottom: "1px solid #e8e8e8",
  },
  indicator: {
    backgroundColor: theme.palette.primary.main,  //  dargBg
  },
}))(Tabs);


const AntTab = withStyles((theme: Theme) =>
  createStyles({
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
  }),
)((props: StyledTabProps) => <Tab disableRipple {...props} />);


interface StyledTabProps {
  label: string;
}

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
