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

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

// const Transition = React.forwardRef(function Transition(props, ref) {
//   return <Slide direction="up" ref={ref} {...props} />;
// });

const FullScreenDialog = (props) => {
  const classes = useStyles();
  const { open, close, children, save, heading, loading } = props;

  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={close}
        // TransitionComponent={Transition}
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
            {loading ? (
              <CircularProgress color="inherit" />
            ) : (
              <Button autoFocus color="inherit" onClick={save}>
                save
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Box width="100%">{children}</Box>
      </Dialog>
    </div>
  );
};

export default FullScreenDialog;
