import { ReactComponent } from 'ag-grid-react/lib/reactComponent';
import { useAppTheme } from 'src/constants/AppConfig';
import React, { FC, ReactElement } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Dialog, Box, Typography, IconButton, DialogContent } from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import { Link } from 'react-router-dom';
import styles from './dashboardModal.module.scss';
import CloseIcon from '@material-ui/icons/Close';
import type { DialogProps } from '@material-ui/core/Dialog';
// node_modules/@material-ui/core/Dialog/Dialog.d.ts

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  modalHead: ModalHead | null;
  handleClose: () => void;
  handleRoutes?: (any) => string;
  dialogProps?: Omit<DialogProps, 'open'>;
}

export interface ModalHead {
  title: string | ReactElement;
  icon: ReactElement;
}

const DashboardModal: FC<ModalProps> = ({ modalHead, dialogProps, handleClose, handleRoutes, children = null, className = '', ...props }) => {
  const [themeColor] = useAppTheme();
  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2)
    }
  }))(MuiDialogContent);

  return (
    <Dialog
      {...dialogProps}
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(5, 9, 19, 0.74)',
          backdropFilter: 'blur(2px)'
        }
      }}
      PaperProps={{
        style: {
          borderRadius: 16,
          margin: 15,
          marginBottom: dialogProps?.maxWidth || dialogProps?.fullScreen ? 15 : 94,
          width: dialogProps?.maxWidth || dialogProps?.fullScreen ? '100%' : 'unset',
          background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff',
          boxShadow:
            '0px 165px 66px rgba(142, 159, 199, 0.01), 0px 93px 56px rgba(142, 159, 199, 0.05), 0px 41px 41px rgba(142, 159, 199, 0.09), 0px 10px 23px rgba(142, 159, 199, 0.1), 0px 0px 0px rgba(142, 159, 199, 0.1)'
        }
      }}
      open={Boolean(modalHead)}
      className={styles.dialogContainer}
    >
      <Box
        className={styles.dialogContentContainer}
        {...props}
        style={{ ...props.style, maxWidth: dialogProps?.maxWidth || dialogProps?.fullScreen ? '100%' : '468px' }}
      >
        <MuiDialogTitle disableTypography className={styles.modalHead}>
          <Box className={styles.modalIconAndName}>
            <Box className={styles.modalIcon}>{modalHead?.icon}</Box>
            <Typography variant="h6" className={styles.modalTitle}>
              {modalHead?.title}
            </Typography>
          </Box>
          <IconButton aria-label="close" onClick={() => handleClose()}>
            <CloseIcon />
          </IconButton>
        </MuiDialogTitle>
        <DialogContent
          className={`${styles.dialogContent} ${className}`}
          style={{ maxHeight: dialogProps?.maxWidth || dialogProps?.fullScreen ? 'calc(100vh - 300px)' : '250px' }}
        >
          {children && children}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default DashboardModal;
