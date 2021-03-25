import React from 'react'
import { withStyles } from '@material-ui/core';
import MuiDialogContent from '@material-ui/core/DialogContent';
import PropTypes from 'prop-types';

const DialogContent = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(0.5, 2),
        maxHeight: 'calc(100vh - 180px)'
    },
}))(MuiDialogContent);

function CustomDialogContent({ children }) {
    return (
        <React.Fragment>
            <DialogContent dividers>
                {children}
            </DialogContent>
        </React.Fragment>
    )
}

CustomDialogContent.propTypes = {
    children: PropTypes.any,
}

export default CustomDialogContent
