import { ReactComponent } from 'ag-grid-react/lib/reactComponent';
import { useAppTheme } from 'src/constants/AppConfig';
import React, { FC, ReactElement } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Dialog, Box, Typography, IconButton, DialogContent, DialogProps } from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import { Link } from 'react-router-dom';
import styles from './dashboardModal.module.scss';
import CloseIcon from '@material-ui/icons/Close';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  modalContent: ModalContent | null;
  handleClose: () => void;
  handleRoutes?: (any) => string;
}

export interface ModalContent {
  title: string | ReactElement;
  items?: any[] | null;
  icon: ReactElement;
}

const DashboardModal: FC<ModalProps> = ({ modalContent, handleClose, handleRoutes, children = null, className = '', ...props }) => {
  const [themeColor] = useAppTheme();
  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2)
    }
  }))(MuiDialogContent);

  return (
    <Dialog
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
          marginBottom: 94,
          background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff',
          boxShadow:
            '0px 165px 66px rgba(142, 159, 199, 0.01), 0px 93px 56px rgba(142, 159, 199, 0.05), 0px 41px 41px rgba(142, 159, 199, 0.09), 0px 10px 23px rgba(142, 159, 199, 0.1), 0px 0px 0px rgba(142, 159, 199, 0.1)'
        }
      }}
      open={Boolean(modalContent)}
      className={styles.dialogContainer}
    >
      <Box className={styles.dialogContentContainer} {...props}>
        <MuiDialogTitle disableTypography className={styles.modalHead}>
          <Box className={styles.modalIconAndName}>
            <Box className={styles.modalIcon}>{modalContent?.icon}</Box>
            <Typography variant="h6" className={styles.modalTitle}>
              {modalContent?.title}
            </Typography>
          </Box>
          <IconButton aria-label="close" onClick={() => handleClose()}>
            <CloseIcon />
          </IconButton>
        </MuiDialogTitle>
        <DialogContent className={`${styles.dialogContent} ${className}`}>
          <ul className={styles.linkList}>
            {children
              ? children
              : modalContent?.items
                  ?.filter((item) => !item?.isHidden)
                  .map((item) => (
                    <li key={item.name}>
                      <Typography component="span">
                        <Link to={handleRoutes(item)} className={styles.dialogLinks}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                            <path
                              d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                              fill="currentcolor"
                              stroke="currentcolor"
                            ></path>
                          </svg>
                          {item.resourceLabel || item.name}
                        </Link>
                      </Typography>
                    </li>
                  ))}
          </ul>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default DashboardModal;
