import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  makeStyles
} from '@material-ui/core';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 100
  }
}));

interface ErrorMessages {
  index?: number;
  message: string;
}

export default function CustomMessageDialog({
  open,
  errorMessages,
  onClose,
  forwardText
}: {
  open: boolean;
  errorMessages: ErrorMessages[];
  onClose: () => void;
  forwardText?: string;
}) {
  const classes = useStyles();

  const [fullScreen, setFullScreen] = useState(false);

  const getMessageList = (message) => {
    const errorMessages: any = [];
    message?.forEach((m) => {
      const { index, message } = m;
      const existingMessage = errorMessages.find((m) => m?.message === message);
      if (existingMessage) {
        existingMessage.indexes.push(index);
      } else {
        errorMessages.push({ message, indexes: [index] });
      }
    });
    return errorMessages;
  };

  return (
    <Dialog
      disableEscapeKeyDown
      fullScreen={fullScreen || isMobile || isTablet}
      maxWidth="sm"
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="confirmation-dialog-title"
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      id="confirmation-dialog"
      keepMounted
      fullWidth
    >
      <CustomDialogHeader
        title={'Message'}
        onClose={onClose}
        showRequiredLabel={false}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <DialogContent>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Index</TableCell>
              <TableCell align="right">Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getMessageList(errorMessages)?.map((d) => (
              <TableRow>
                <TableCell>{d?.indexes?.map((index) => index).toString()}</TableCell>
                <TableCell align="right">{d?.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose} color="primary">
          {!forwardText ? 'Close' : forwardText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
