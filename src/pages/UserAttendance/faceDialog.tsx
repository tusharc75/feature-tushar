import { useEffect, useRef, useState } from 'react'
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Box, Dialog } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FaceLiveNess from 'src/components/FaceLiveness/AWS';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

function FaceDialog({ onClose }) {

    const [loading, setLoading] = useState<boolean>(true);
    const [sessionId, setSessionId] = useState<any>(null);
    const [gettingOutModal, setGettingOutModal] = useState({ open: false, text: "" });
    useEffect(() => {
        fetchCreateLiveness();
    }, []);

    const fetchCreateLiveness: () => Promise<void> = async () => {
        setLoading(true);
        const res = await axiosInstance().get('/user/liveness-session');
        const data = res.data.data;
        setSessionId(data.SessionId);
        setLoading(false);
    };

    const onCompleteScan = async (sessionId) => {
        const complete = await axiosInstance().get(`/face-attendance/attend/${sessionId}`)
        const data = complete.data.data;
        if (data && data.gettingOut) {
            setGettingOutModal({ open: true, text: "You are getting out!" });
        } else {
            setGettingOutModal({ open: true, text: "You are getting in!" });
        }
    };

    const onError = (error) => {
        setTimeout(() => {
            onClose();
        }, 1000);
    };


    return (
        <Dialog
            maxWidth="md"
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={true}
            fullScreen
        >
            <CustomDialogContent>
                {
                    loading ? (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    ) : (
                        <FaceLiveNess
                            sessionId={sessionId}
                            onComplete={onCompleteScan}
                            onUserCancel={onClose}
                            onError={onError}
                            autoStart={true} />
                    )
                }
                {
                    gettingOutModal.open && (
                        <ConfirmationDialog
                            open={gettingOutModal.open}
                            message={gettingOutModal.text}
                            onClose={() => {
                                setGettingOutModal({ open: false, text: "" });
                                onClose();
                            }}
                            onOk={() => {
                                setGettingOutModal({ open: false, text: "" });
                                onClose();
                            }}
                        />
                    )
                }
            </CustomDialogContent>
        </Dialog>
    )
}

export default FaceDialog;