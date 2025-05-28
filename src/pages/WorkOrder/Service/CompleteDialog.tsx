import { Dialog, Box, TextField, Typography } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, WORK_ORDER_STATUS } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import MultiLine from 'src/components/Helpers/FormTypes/MultiLine';

const CompleteDialog = ({ handleClose, serviceName, updateStatus, comment, setComment, status = WORK_ORDER_STATUS.completed }) => {
  return (
    <Dialog
      open
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="sm"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
    >
      <CustomDialogHeader title="Confirmation" showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        <Box>
          <Typography>
            {' '}
            {`All steps are ${status === WORK_ORDER_STATUS.completed ? 'performed' : 'skipped'} for `}
            <Box component="span" fontWeight="bold">
              {serviceName}
            </Box>
            {`, do you want to mark it ${status === WORK_ORDER_STATUS.completed ? 'complete' : 'skip'}?`}
          </Typography>
          <Box mt={2}>
            <MultiLine
              label="Comment"
              value={comment || ''}
              onChange={(value) => setComment(value)}
            />
          </Box>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          onClick={handleClose}
          buttonType='transparent'
        >
          Cancel
        </ThemeButton>
        <ThemeButton
          onClick={updateStatus}
          buttonType='theme'
        >
          Submit
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default CompleteDialog;
