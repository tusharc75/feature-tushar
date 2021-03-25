import React from 'react'
import { withStyles } from '@material-ui/core';
import MuiDialogActions from '@material-ui/core/DialogActions';
import PropTypes from 'prop-types';

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1.5, 2),
        position: "sticky",
        bottom: 0,
        right: 0,
        left: 0,
        width: "100%",
        zIndex: 100000,
    }
}))(MuiDialogActions);

function CustomDialogFooter({ children }) {
    return (
        <React.Fragment>
            <DialogActions>
                {children}
            </DialogActions>
        </React.Fragment>
    )
}

CustomDialogFooter.propTypes = {
    children: PropTypes.any,
}

export default CustomDialogFooter
