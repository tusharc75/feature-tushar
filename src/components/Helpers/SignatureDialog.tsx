import React, { useRef, useState } from 'react'
import { Button, Box, Dialog, Stepper, Step, StepLabel, Typography, Divider } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import SignaturePad from 'react-signature-canvas';

export default function SignatureDialog(props) {
    const { open, onClose, onSigned, forDelivery, steps, label, submitting } = props;
    const [activeStep, setActiveStep] = useState(0)
    const signCanvas: any = useRef(null);
    const [loading, setLoading] = useState(false);

    const clear = () => signCanvas.current.clear();


    const handleClickNext = () => {
        let signedData: any = {};

        if (label === "Start Delivery") {
            signedData = {
                type: activeStep === 0 ? "supervisor" : "deliveryPerson",
                sign: signCanvas.current.getTrimmedCanvas().toDataURL("image/png")
            }
        } else if (label === "Sign-Off") {
            signedData = {
                type: activeStep === 0 ? "deliveryPerson" : "receiver",
                sign: signCanvas.current.getTrimmedCanvas().toDataURL("image/png")
            }
        }

        onSigned(signedData)

        if (activeStep === 0) {
            setActiveStep(prevStep => prevStep + 1)
            clear()
        }
    }

    return (
        <Dialog
            open={open}
            aria-labelledby="customized-dialog-title"
            // maxWidth="sm"
            onClose={() => {
                onClose();
            }}
            fullWidth
            fullScreen={isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
        >
            <CustomDialogHeader
                title="Signature"
                onClose={() => {
                    onClose(false);
                }}
            />
            <CustomDialogContent>
                {forDelivery &&
                    <>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                        <Box textAlign="center" my={2}>
                            <Typography>Sign Below</Typography>
                            <Box mb={2} />
                            <Divider />
                        </Box>
                    </>
                }
                <SignaturePad
                    ref={signCanvas}
                    canvasProps={{ minWidth: 500, width: 500, height: 500 }}
                />
                <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={clear}
                    fullWidth
                >
                    Clear
                </Button>
            </CustomDialogContent>

            <CustomDialogFooter>
                <Button variant="outlined" size="small" disabled={submitting} onClick={onClose} color="primary">
                    Close
                </Button>

                {forDelivery ?
                    <>
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={activeStep === 0 || submitting}
                            onClick={() => setActiveStep(prevStep => prevStep - 1)}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={submitting}
                            onClick={handleClickNext}
                        >
                            {activeStep === 0 ? "Next" : "Submit"}
                        </Button>
                    </>
                    : <Button
                        size="small"
                        disabled={loading}
                        onClick={() => {
                            setLoading(true);
                            onSigned(signCanvas.current.getTrimmedCanvas().toDataURL("image/png"))
                        }} color="primary" variant="contained">
                        {loading ? "Sending..." : "Send"}
                    </Button>}
            </CustomDialogFooter>
        </Dialog >
    )
}
