import { Dialog } from '@mui/material';
import React, { useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';

function SignatureCell({ base64 }) {
  const [imageDialogProps, setImageDialogProps] = useState<{ open: boolean; src: null | string; alt: string }>({
    open: false,
    src: null,
    alt: ''
  });

  const onClose = React.useCallback(() => {
    setImageDialogProps({ open: false, src: null, alt: '' });
  }, []);

  return (
    <>
      <p
        className="text-truncate -my-[2px] cursor-pointer"
        role="button"
        onClick={() => {
          setImageDialogProps({
            open: true,
            src: base64,
            alt: `Signature`
          });
        }}
      >
        <img src={base64} width={65} className="mx-auto block max-h-[38px] w-fit max-w-[65px] object-contain dark:bg-white" alt={`Signature`} />
      </p>
      <ImageDialog onClose={onClose} {...imageDialogProps} />
    </>
  );
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
      TransitionComponent={CustomDialogTransition}
      TransitionProps={{ timeout: 300 }}
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={open}
      fullWidth
      maxWidth="xs"
      BackdropProps={{ style: { backdropFilter: 'blur(5px)' } }}
    >
      {src ? (
        <img src={src} alt={alt || ''} className="mx-auto block h-full w-full max-w-[500px] bg-white object-contain p-2" />
      ) : (
        <div className="grid h-[278px] w-[444px] place-items-center p-2">
          <p className="text-lg text-gray-500">No image to display</p>
        </div>
      )}
    </Dialog>
  );
}

export default SignatureCell;
