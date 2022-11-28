import React, { useContext, useState } from 'react'
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "./CustomDialog/CustomDialogHeader";
import CustomDialogContent from "./CustomDialog/CustomDialogContent";

export default function ContentFullScreen({ children, title, fullScreen, setFullScreen, isheader = true }) {
    return fullScreen ?
        <Dialog
            fullScreen={true}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
           {isheader && <CustomDialogHeader title={title} showRequiredLabel={false} onClose={() => { setFullScreen(!fullScreen) }} ></CustomDialogHeader>}
            <CustomDialogContent>
                {children}
            </CustomDialogContent>
        </Dialog>
        : children
}
