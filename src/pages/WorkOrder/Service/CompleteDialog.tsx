import { Dialog, Button, Box, TextField, Typography } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';

const CompleteDialog = ({ handleClose, serviceName, updateStatus, comment, setComment }) => {
  return (
    <Dialog
      open
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="sm"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
        }
      }}
    >
      <CustomDialogHeader title="Confirmation" showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        <Box>
          <Typography>
            {' '}
            All steps are performed for{' '}
            <Box component="span" fontWeight="bold">
              {serviceName}
            </Box>
            , do you want to mark it complete?
          </Typography>
          <Box mt={2}>
            <TextField
              multiline
              label="Comment"
              fullWidth
              rows={3}
              maxRows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
            />
          </Box>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" size="small" onClick={handleClose} color='primary'>
          Cancel
        </Button>
        <Button variant="contained" size="small" onClick={updateStatus} color="primary">
          Complete
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default CompleteDialog;
