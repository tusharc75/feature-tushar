import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    minHeight: "calc(100vh - 65px)",
  },
}));

const Container = (props) => {
  const { children, style } = props;
  const classes = useStyles();

  return (
    <Paper elevation={0} className={classes.root} style={{ ...style }}>
      {children}
    </Paper>
  );
};

export default Container;
