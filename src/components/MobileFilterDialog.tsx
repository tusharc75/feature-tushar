import * as React from 'react';
import "./MobileFilterDialog.scss";
import {
    Box,
    Grid,
    Button,
    styled, 
    alpha,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Slide,
    createStyles, 
    makeStyles, 
    Theme,
    Transitions
  } from "@material-ui/core";
  import { TransitionProps } from '@material-ui/core/transitions';



const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MobileFilterDialog({isOpen , handleClose , contentPart , secHeading}) {
 

  return (
    <div>
      <Dialog
        open={isOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        className="mobile-filter-root"
      >
        <DialogContent className="mobile-filter-content">
                 
                 <h3 className="pb-3 sub-filter-heading">{secHeading}</h3>
                 {contentPart}
   
        </DialogContent>
      </Dialog>
    </div>
  );
}