import React from 'react'
import { withStyles } from '@material-ui/core';
import MuiDialogActions from '@material-ui/core/DialogActions';
import PropTypes from 'prop-types';

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1.5, 2),
    },
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
