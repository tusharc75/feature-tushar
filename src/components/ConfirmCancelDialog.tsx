import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
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

export default function ConfirmationCancelDialog(props) {
    const classes = useStyles();
    const { onClose, onSave, open } = props;

    return (
        <Dialog
            disableEscapeKeyDown
            maxWidth="xs"
            aria-labelledby="confirmation-dialog-title"
            open={open}
            classes={{
                paper: classes.paper,
            }}
            id="confirmation-dialog"
            keepMounted
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                }
            }}
        >
            <DialogTitle id="confirmation-dialog-title" className="text-white">Confirm</DialogTitle>
            <DialogContent dividers>
                <Typography>Do you want to save changes or Leave?</Typography>
            </DialogContent>
            <DialogActions>
                <Button size="small" autoFocus onClick={onClose} color="primary">Leave</Button>
                <Button size="small" onClick={onSave}
                    color="primary">
                    Save</Button>
            </DialogActions>
        </Dialog>
    );
}

ConfirmationCancelDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    onSave: PropTypes.func,
};

