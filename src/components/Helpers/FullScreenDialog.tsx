import React from "react";

import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";
import { TransitionProps } from "@material-ui/core/transitions";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FullScreenDialog = (props) => {
  const { open, close, children, heading, className = "", ...rest } = props;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={close}
      TransitionComponent={Transition}
      className={className}
    >
      <CustomDialogHeader title={heading} onClose={close} />

      <CustomDialogContent>{children}</CustomDialogContent>
    </Dialog>
  );
};

export default FullScreenDialog;
