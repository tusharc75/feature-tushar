import { Dialog } from '@mui/material';
import React, { memo } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';

type CellDialogProps = {
  children: React.ReactNode;
  dialogTitle?: string;
  text?: string;
  enableDilaog?: boolean;
};

const CellDialogImpl = ({ children, dialogTitle = 'View', text = 'View', enableDilaog = true }: CellDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const onClose = () => setOpen(false);

  return (
    <>
      {enableDilaog ? (
        <>
          <span onClick={() => setOpen(true)} className="link block !text-[var(--link)]">
            {text}
          </span>
          <Dialog TransitionComponent={CustomDialogTransition} maxWidth="md" fullWidth open={open} onClose={onClose}>
            <CustomDialogHeader title={dialogTitle} onClose={onClose} showRequiredLabel={false} />
            <CustomDialogContent>{children}</CustomDialogContent>
          </Dialog>
        </>
      ) : (
        <>{children}</>
      )}
    </>
  );
};

const CellDialog = memo(CellDialogImpl);

export default CellDialog;
