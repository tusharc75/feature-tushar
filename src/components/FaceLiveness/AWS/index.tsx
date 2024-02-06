import { useState, useRef, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { ThemeProvider, View } from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import awsexports from '../../../amplifyconfiguration.json';
import "./faceLiveness.scss"

Amplify.configure(awsexports);

const FaceLiveNess = ({ sessionId, onComplete, onUserCancel, onError, autoStart = false  }) => {
    const [cameraPermission, setCameraPermission] = useState('prompt');
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
                    videoStream.current = stream;
                    stream.getTracks().forEach((track) => track.stop());
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

    const handleClick = () => {
        const button:any = document.querySelector('.amplify-button--primary');
        if (button) {
            button.click();
            return;
        } 
    };


    const handleCancel = () => {
        if (videoStream.current) {
            videoStream.current.getTracks().forEach((track) => track.stop());
        }
        onUserCancel();
    };

    return (
        <ThemeProvider>
            <View as="div" width={'calc(100vh - 100px)'} margin={'auto'} >
                <FaceLivenessDetector
                    key={sessionId}
                    disableStartScreen={autoStart}
                    sessionId={sessionId}
                    region={"us-east-1"}
                    onAnalysisComplete={() => onComplete(sessionId)}
                    onUserCancel={handleCancel}
                    onError={onError}
                    components={{
                        PhotosensitiveWarning: (): JSX.Element => {
                            return null;
                        }
                    }}
                />
            </View>
        </ThemeProvider>);
};

export default FaceLiveNess;
