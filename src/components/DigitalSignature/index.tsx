import { useState } from 'react';
import ESignatureDialog from './ESignature'; // No ESignatureDialogRef needed
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DigitalSignature = ({ attachmentId, type, isEditMode, allAttachments }: any) => {
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

  const handleSendForSignatureClick = () => {
    setIsSignatureDialogOpen(true);
  };

  const handleCloseSignatureDialog = () => {
    setIsSignatureDialogOpen(false);
  };

  return (
    <>
      {isEditMode && type === 'file' && (
        <ThemeButton
          buttonType="theme"
          onClick={handleSendForSignatureClick}
          style={{ marginRight: '8px', backgroundColor: 'green' }}
        >
          Send for Signature
        </ThemeButton>
      )}
      <ESignatureDialog
        attachmentId={attachmentId}
        allAttachments={allAttachments}
        open={isSignatureDialogOpen}
        onClose={handleCloseSignatureDialog}
      />
    </>
  );
}

export default DigitalSignature;