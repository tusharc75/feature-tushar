import { Assessment, Call, Email, Event } from '@mui/icons-material';
import { Paper, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React from 'react';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: 445,
    margin: theme.spacing(1),
    border: '1px solid #dadada'
  }
}));

// withStyles((theme) => ({
//   root: {
//     textTransform: "none",
//     minWidth: 72,
//     fontWeight: theme.typography.fontWeightMedium,
//     marginRight: theme.spacing(4),
//     "&$selected": {
//       color: theme.palette.primary.main,
//     },
//     "&:focus": {
//       color: theme.palette.primary.main,
//     },
//   },
//   selected: {},
// }))
const StyledTab = (props) => <Tab disableRipple {...props} />;

const Activity = () => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div>
      <Paper square elevation={0} className={classes.root}>
        <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary">
          <StyledTab icon={<Call />} label="Call a log" />
          <StyledTab icon={<Assessment />} label="New Task" />
          <StyledTab icon={<Email />} label="Email" />
          <StyledTab icon={<Event />} label="New Event" />
        </Tabs>
      </Paper>
    </div>
  );
};

export default Activity;
