import React from 'react';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { isMobile, isTablet } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    border: `1px solid ${theme.palette.error.main}`,
    color: theme.palette.error.main,
    background: '#fff'
  }
}));

function DeleteButton({ text, onClick, ...rest }) {
  const classes = useStyles();

  return (
    <Button className={'btn-outline-red-v1'} size="small" onClick={onClick} {...rest}>
      {text}
    </Button>
  );
}

export default DeleteButton;
