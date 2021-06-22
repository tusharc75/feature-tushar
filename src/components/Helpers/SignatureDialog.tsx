import React, { useRef, useState } from 'react'
import { Button, Dialog } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import SignaturePad from 'react-signature-canvas';

export default function SignatureDialog({ open, onClose, onSigned }) {

    const signCanvas: any = useRef(null);
    const [loading, setLoading] = useState(false);

    const clear = () => signCanvas.current.clear();

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
                <SignaturePad
                    ref={signCanvas}
                    canvasProps={{ minWidth: 500, width: 500, height: 500 }}
                />
            </CustomDialogContent>

            <CustomDialogFooter>
                <Button size="small" onClick={clear} color="primary">
                    Clear
                </Button>

                <Button size="small"
                    disabled={loading}
                    onClick={() => {
                        setLoading(true);
                        onSigned(signCanvas.current.getTrimmedCanvas().toDataURL("image/png"))
                    }} color="primary" variant="contained">
                    {loading ? "Sending..." : "Send"}
                </Button>
            </CustomDialogFooter>
        </Dialog >
    )
}
