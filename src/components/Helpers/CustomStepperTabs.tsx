import React from 'react';
import clsx from 'clsx';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottom: '1px solid #dadada',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  step: {
    color: '#aaa',
    padding: theme.spacing(1),
    minWidth: '100px',
    textAlign: 'center'
  },
  inactive: {
    color: '#aaa',
    borderBottom: `3px solid #aaa`,
    marginRight: 5
  },
  active: {
    color: theme.palette.primary.main,
    borderBottom: `3px solid ${theme.palette.primary.main}`, //  dargBg
    marginRight: 5
  }
}));

const CustomStepperTabs = ({ steps, value }) => {
  const classes = useStyles();
  return (
    <Box className={classes.container}>
      {steps.map((step, i) => (
        <Box
          key={i}
          className={clsx(classes.step, {
            [classes.active]: value >= i,
            [classes.inactive]: value !== i
          })}
        >
          <Typography variant="body2">{step}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default CustomStepperTabs;
