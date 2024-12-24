import React from 'react';
import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2)
    }
  }
}));

const CustomToast = (props) => {
  const { open, close, message, type, hideDuration = 6000, anchorOrigin = null } = props;
  const classes = useStyles();

  return (
    <>
      {open && (
        <div className={classes.root}>
          <Snackbar
            open={open}
            autoHideDuration={hideDuration}
            onClose={close}
            anchorOrigin={
              anchorOrigin
                ? anchorOrigin
                : {
                    vertical: 'top',
                    horizontal: 'center'
                  }
            }
          >
            <Alert onClose={close} severity={type}>
              {message}
            </Alert>
          </Snackbar>
        </div>
      )}
    </>
  );
};

CustomToast.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  message: PropTypes.any.isRequired,
  type: PropTypes.string.isRequired,
  anchorOrigin: PropTypes.object
};

export default CustomToast;
