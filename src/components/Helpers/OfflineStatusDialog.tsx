import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import { Typography } from '@material-ui/core';

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
    const { open } = props;

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
            {/* <DialogTitle id="confirmation-dialog-title" className="text-white">Offline</DialogTitle> */}
            <DialogContent dividers>
                {
                    <Typography>You are offline</Typography>
                }
            </DialogContent>
        </Dialog>
    );
}

OfflineStatusDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onOk: PropTypes.func,
    okBtnLoading: PropTypes.any
};

