import { useEffect, useRef, useState } from 'react'
import axiosInstance from 'src/axios/axiosInstance';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import {
    Loader, ThemeProvider, View
} from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import awsexports from '../../amplifyconfiguration.json';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Box } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FaceLiveNess from 'src/components/FaceLiveness/AWS';

Amplify.configure(awsexports);

function UserAttendance() {
    const [cameraPermission, setCameraPermission] = useState('prompt');
    const [loading, setLoading] = useState<boolean>(true);
    const [sessionId, setSessionId] = useState<any>(null);
    const [gettingOutModal, setGettingOutModal] = useState(false);
    const videoStream = useRef(null);

    useEffect(() => {
        if (cameraPermission === 'granted' || cameraPermission === 'prompt') {
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                })
                .then((stream) => {
                    setCameraPermission('granted');
                    videoStream.current = stream; // Store the stream
                    stream.getTracks().forEach((track) => track.stop()); // Stop the stream initially
                })
                .catch((err) => {
                    console.error('Camera access denied:', err);
                    setCameraPermission('denied');
                });
        }

        return () => {
            if (videoStream.current) {
                videoStream.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [cameraPermission]);

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
        const complete = await axiosInstance().get(`/user-attendance/attend/${sessionId}`)
        const data = complete.data.data;
        if (data && data.gettingOut) {
            setGettingOutModal(true);
        } else {
            fetchCreateLiveness();
        }
    };

    const onError = (error) => {
        setTimeout(() => {
            fetchCreateLiveness();
        }, 5000);
    };


    return (<section className="main-container-v1">
        {loading ? (
            <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        ) : (
            <FaceLiveNess
                sessionId={sessionId}
                onComplete={onCompleteScan}
                onUserCancel={() => { }}
                onError={onError}
                autoStart={true} />
        )}
        {gettingOutModal && (
            <ConfirmationDialog
                open={gettingOutModal}
                message={`You are getting out!`}
                onClose={() => {
                    setGettingOutModal(false);
                    fetchCreateLiveness();
                }}
                onOk={() => {
                    setGettingOutModal(false);
                    fetchCreateLiveness();
                }}
            />
        )}
    </section>
    )
}

export default UserAttendance