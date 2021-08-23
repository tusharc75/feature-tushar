import React from "react";
import Dialog from "@material-ui/core/Dialog";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import { CustomDialogTransition } from "../../constants/helpers";

const FullScreenDialog = (props) => {
  const { open, close, children, heading, className = "" } = props;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={close}
      TransitionComponent={CustomDialogTransition}
      className={className}
    >
      <CustomDialogHeader title={heading} onClose={close} />

      <CustomDialogContent>{children}</CustomDialogContent>
    </Dialog>
  );
};

export default FullScreenDialog;
