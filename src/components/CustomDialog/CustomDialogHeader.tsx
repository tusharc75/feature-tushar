import React from 'react'
import {
    IconButton,
    Typography,
    makeStyles
} from "@material-ui/core";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from "@material-ui/icons/Close";
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1.5, 1.5, 1.5, 2),
        // borderBottom: `1px solid #daf5ff`
    },
    closeButton: {
        position: "absolute",
        right: theme.spacing(1.5),
        top: theme.spacing(1.5),
        color: theme.palette.grey[500],
    },
    dialogTitle: {
        fontSize: "1.2rem"
    }
}));

function CustomDialogHeader({ title, onClose }) {
    const classes = useStyles();

    return (
        <React.Fragment>
            <MuiDialogTitle disableTypography className={classes.root}>
                <Typography variant="h6" className={classes.dialogTitle}>{title}</Typography>
                {
                    onClose && <IconButton
                        aria-label="close"
                        className={classes.closeButton}
                        onClick={onClose}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                }
            </MuiDialogTitle>
        </React.Fragment>
    )
}

CustomDialogHeader.propTypes = {
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func
}

export default CustomDialogHeader
