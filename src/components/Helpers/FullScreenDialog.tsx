import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Box from "@material-ui/core/Box";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import Slide from "@material-ui/core/Slide";
import { CircularProgress } from "@material-ui/core";
import { TransitionProps } from "@material-ui/core/transitions";

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FullScreenDialog = (props) => {
  const classes = useStyles();
  const { open, close, children, heading } = props;

  return <Dialog
    fullScreen
    open={open}
    onClose={close}
    TransitionComponent={Transition}
  >
    <AppBar className={classes.appBar}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={close}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          {heading}
        </Typography>
      </Toolbar>
    </AppBar>
    <Box width="100%">{children}</Box>
  </Dialog>
};

export default FullScreenDialog;
