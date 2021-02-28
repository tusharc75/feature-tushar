import React from "react";
import PropTypes from "prop-types";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import { makeStyles } from "@material-ui/core/styles";

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    "& > * + *": {
      marginTop: theme.spacing(2),
    },
  },
}));

const CustomToast = (props) => {
  const { open, close, errorMsg, type } = props;
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Snackbar open={open} autoHideDuration={6000} onClose={close}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Alert onClose={close} severity={type}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

CustomToast.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  errorMsg: PropTypes.any.isRequired,
  type: PropTypes.string.isRequired,
};

export default CustomToast;
