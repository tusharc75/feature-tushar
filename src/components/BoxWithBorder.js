import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Box } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    border: "1px solid #D4D6D7",
    borderRadius: 8,
    padding: theme.spacing(3, 2),
  },
}));

const BoxWithBorder = ({ children }) => {
  const classes = useStyles();
  return (
    <Box component="div" className={classes.root}>
      {children}
    </Box>
  );
};

export default BoxWithBorder;
