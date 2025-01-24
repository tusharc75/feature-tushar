import React from 'react';
import { makeStyles } from '@mui/styles';
import Button from '@mui/material/Button';

const useStyles = makeStyles({
  root: {
    background: 'linear-gradient(90deg, #DD5052 4.81%, #DD9044 100%)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    height: 48,
    padding: '0 30px'
  }
});

export default function ButtonDesign({ title }) {
  const classes = useStyles();
  return <Button className={classes.root}>{title}</Button>;
}
