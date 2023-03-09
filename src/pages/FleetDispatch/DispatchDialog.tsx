import { Button, CircularProgress, Dialog } from '@material-ui/core';
import React, { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';


const DispatchDialog = ({ handleClose, handleSucess, fleet, job }) => {

    const toastConfig = useContext(CustomToastContext);

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [submitting, setSubmitting] = useState(false);

    const handleDispatch = () => {
        setSubmitting(true);
        const data = {
            job: job?._id,
            asset: job?.asset?._id,
            fleet: fleet?._id,
            dispatchComment: "",
            dispatchDocuments: [],
            dispatchSignature: ""
        }
        axiosInstance().post(`/fleet-dispatch`, data)
            .then(({ data }) => {
                setSubmitting(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: "Dispatch Successfully"
                });
                handleSucess()
            })
            .catch((error) => {
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
    }

    return (<Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {

            }
        }}
        open={true}
    >
        <CustomDialogHeader
            title={"Dispatch Fleet"}
            onClose={(e, reason) => {
                handleClose()
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        />
        <CustomDialogContent>

        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                type="button"
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                    handleClose()
                }}
            >
                Cancel
            </Button>
            <CustomButton
                loading={false}
                variant="contained"
                color="primary"
                startIcon={submitting && <CircularProgress size={20} color='inherit' />}
                disabled={submitting}
                onClick={(e) => {
                    handleDispatch()
                }}
            >
                Dispatch
            </CustomButton>
        </CustomDialogFooter>
    </Dialog >
    );
};

export default DispatchDialog;
