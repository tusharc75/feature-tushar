import React from 'react'
import CustomDialogHeader from './CustomDialogHeader'
import CustomDialogContent from './CustomDialogContent'
import CustomDialogFooter from './CustomDialogFooter'
import { isMobile, isTablet } from "react-device-detect";

import PropTypes from 'prop-types';
import { Button, Dialog } from '@material-ui/core';

// Under Construction - Don't Use It Right Now: Punit
function CustomDialogComponent({ title, open, onClose, children }) {
    return (
        <Dialog
            disableBackdropClick={true}
            maxWidth="md"
            open={open}
            onClose={onClose}
            aria-labelledby="form-dialog-title"
            fullScreen={isMobile || isTablet}
            fullWidth
        >
            {
                title && <CustomDialogHeader title={title} onClose={onClose}></CustomDialogHeader>
            }

            <CustomDialogContent>{children}</CustomDialogContent>

            <CustomDialogFooter>
                <Button color="primary" size="small" onClick={onClose}>Close</Button>
            </CustomDialogFooter>
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
