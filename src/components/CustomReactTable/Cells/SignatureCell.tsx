import { Dialog } from "@material-ui/core";
import React, { useState } from "react";

function SignatureCell({ base64 }) {

    const [imageDialogProps, setImageDialogProps] = useState<{ open: boolean; src: null | string; alt: string }>({
        open: false,
        src: null,
        alt: ''
    });

    const onClose = React.useCallback(() => {
        setImageDialogProps({ open: false, src: null, alt: '' });
    }, []);

    return <>
        <p
            className="text-truncate -my-[2px] cursor-pointer dark:[filter:invert(1)]"
            role="button"
            onClick={() => {
                setImageDialogProps({
                    open: true,
                    src: base64,
                    alt: `Signature`
                });
            }}
        >
            <img
                src={base64}
                width={65}
                className="max-w-[65px] w-full block max-h-[38px] object-contain  dark:invert"
                alt={`Signature`}
            />
        </p>
        <ImageDialog onClose={onClose} {...imageDialogProps} />
    </>
}

export interface ImageDialogProps {
    open: boolean;
    onClose: () => void;
    src: string | null;
    alt?: string;
}

function ImageDialog(props: ImageDialogProps) {
    const { onClose, open, src, alt } = props;
    return (
        
        <Dialog
            TransitionProps={{ timeout: 300 }}
            onClose={onClose}
            aria-labelledby="simple-dialog-title"
            open={open}
            fullWidth
            maxWidth="xs"
            BackdropProps={{ style: { backdropFilter: 'blur(5px)' } }}
        >
            {src ? (
                <img src={src} alt={alt || ''} className="w-full block max-w-[500px] object-contain mx-auto p-2 h-full dark:[filter:invert(1)]" />
            ) : (
                <div className="w-[444px] h-[278px] p-2 grid place-items-center">
                    <p className="text-gray-500 text-lg">No image to display</p>
                </div>
            )}
        </Dialog>
        
    );
}

export default SignatureCell