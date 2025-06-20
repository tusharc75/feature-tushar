import { useState } from 'react';
import SendForSignatureDialog from 'src/components/DigitalSignature/SendForSignatureDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DigitalSignature = ({ attachmentId, type, allAttachments }: any) => {

  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {attachmentId && type === 'file' && (
        <ThemeButton
          buttonType="theme"
          onClick={handleOpen}
        >
          Send for Signature
        </ThemeButton>
      )}
      {open &&
        <SendForSignatureDialog
          attachmentId={attachmentId}
          allAttachments={allAttachments}
          onClose={handleClose}
        />
      }
    </>
  );
}

export default DigitalSignature;