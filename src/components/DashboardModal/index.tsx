import { Box, Dialog, DialogActions, IconButton, Typography } from '@material-ui/core';
import type { DialogProps } from '@material-ui/core/Dialog';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import { withStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import React, { FC, ReactElement, ReactNode, useState } from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useAppTheme } from 'src/constants/AppConfig';
import styles from './dashboardModal.module.scss';
// node_modules/@material-ui/core/Dialog/Dialog.d.ts

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  modalHead: ModalHead | null;
  handleClose: () => void;
  handleRoutes?: (any) => string;
  dialogProps?: Omit<DialogProps, 'open'>;
  open?: boolean;
  contentMaxHeight?: string;
  footer?: ReactNode;
  dialogContentProps?: React.HTMLAttributes<HTMLDivElement>;
}

export interface ModalHead {
  title: string | ReactElement;
  icon?: ReactElement;
  description?: ReactNode;
  fullScreenOption?: boolean;
}

const CustomDialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2)
  }
}))(MuiDialogContent);

const DashboardModal: FC<ModalProps> = ({
  modalHead,
  dialogProps,
  handleClose,
  handleRoutes,
  children = null,
  className = '',
  open = undefined,
  contentMaxHeight = '250px',
  footer,
  dialogContentProps,
  ...props
}) => {
  const [themeColor] = useAppTheme();

  const [maximized, setMaximized] = useState<boolean>(dialogProps?.fullScreen || false);

  const toggleMaximized = () => {
    setMaximized((prev) => !prev);
  };

  return (
    <Dialog
      {...dialogProps}
      fullScreen={maximized}
      onClose={dialogProps?.onClose || handleClose}
      aria-labelledby="customized-dialog-title"
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(5, 9, 19, 0.74)',
          backdropFilter: 'blur(2px)'
        }
      }}
      PaperProps={{
        style: {
          borderRadius: maximized ? 0 : 16,
          margin: dialogProps?.fullScreen || maximized ? 0 : 15,
          marginBottom: dialogProps?.fullScreen ? 0 : dialogProps?.maxWidth ? 15 : 94,
          width: dialogProps?.maxWidth || dialogProps?.fullScreen ? '100%' : 'unset',
          background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff',
          boxShadow:
            themeColor === 'dark'
              ? '0px 10px 23px 0px rgba(142, 159, 199, 0.10), 0px 20px 50px 0px rgba(142, 159, 199, 0.08)'
              : '0px 165px 66px rgba(142, 159, 199, 0.01), 0px 93px 56px rgba(142, 159, 199, 0.05), 0px 41px 41px rgba(142, 159, 199, 0.09), 0px 10px 23px rgba(142, 159, 199, 0.1), 0px 0px 0px rgba(142, 159, 199, 0.1)',
          ...props.style
        }
      }}
      open={open !== undefined ? open : Boolean(modalHead)}
      className={styles.dialogContainer}
    >
      <MuiDialogTitle disableTypography className={styles.modalHead}>
        <Box className={styles.modalIconAndName}>
          {modalHead?.icon && <Box className={styles.modalIcon}>{modalHead?.icon}</Box>}
          <div className="flex-grow">
            <Typography variant="h6" className={styles.modalTitle}>
              {modalHead?.title}
            </Typography>
            {modalHead?.description && (
              <Typography variant="body2" className="mt-1 text-gray-500 dark:text-gray-400">
                {modalHead.description}
              </Typography>
            )}
          </div>
        </Box>
        <Box className={styles.modalHeadActions} style={{ minWidth: modalHead?.fullScreenOption ? '85px' : '45px' }}>
          {modalHead?.fullScreenOption ? (
            <IconButton aria-label="close" onClick={() => toggleMaximized()}>
              {maximized ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
            </IconButton>
          ) : null}
          <IconButton aria-label="close" onClick={() => handleClose()}>
            <CloseIcon />
          </IconButton>
        </Box>
      </MuiDialogTitle>
      <CustomDialogContent
        {...dialogContentProps}
        className={`${styles.dialogContent} ${className}`}
        style={{ maxHeight: maximized ? 'calc(100vh - 135px)' : contentMaxHeight, ...(dialogContentProps?.style || {}) }}
      >
        {children && children}
      </CustomDialogContent>
      {footer && (
        <DialogActions
          className={styles.footer}
          style={{ background: 'var(--dark-primary, white)', borderTop: '1px solid var(--common-border-color)', paddingBlock: '' }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DashboardModal;
