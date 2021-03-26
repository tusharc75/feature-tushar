import React from 'react'
import CustomDialogHeader from './CustomDialogHeader'
import CustomDialogContent from './CustomDialogContent'

import PropTypes from 'prop-types';
import { Dialog } from '@material-ui/core';

// Under Construction - Don't Use It Right Now: Punit
function CustomDialogComponent({ title, open, onClose, children }) {
    return (
        <Dialog
            disableBackdropClick={true}
            maxWidth="md"
            open={open}
            onClose={onClose}
            aria-labelledby="form-dialog-title"
        >
            {
                title && <CustomDialogHeader title={title} onClose={onClose}></CustomDialogHeader>
            }

            <CustomDialogContent>{children}</CustomDialogContent>
        </Dialog>
    )
}

CustomDialogComponent.propTypes = {
    text: PropTypes.string,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.any,
}


export default CustomDialogComponent
