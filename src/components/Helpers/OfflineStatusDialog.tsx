import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import { Typography } from '@material-ui/core';
import { IoCloudOfflineOutline } from 'react-icons/io5'

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
    },
    paper: {
        width: '80%',
        maxHeight: 435,
    },
}));

export default function OfflineStatusDialog(props) {
    const classes = useStyles();

    return (
        <Dialog
            disableBackdropClick
            disableEscapeKeyDown
            maxWidth="xs"
            aria-labelledby="confirmation-dialog-title"
            open={true}
            classes={{
                paper: classes.paper,
            }}
            id="confirmation-dialog"
            keepMounted
        >
            <DialogContent dividers>
                {<div className="d-flex align-items-center flex-column" color="text.grey">
                    <IoCloudOfflineOutline size="40" />
                    <h2 className="mt-2">You're offline</h2>
                </div>
                }
            </DialogContent>
        </Dialog>
    );
}


