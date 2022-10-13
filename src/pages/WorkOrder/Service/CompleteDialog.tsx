import React from 'react';
import { Dialog, Button, Box, TextField, Typography } from '@material-ui/core';

import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const CompleteDialog = ({ handleClose, serviceName, updateStatus, comment, setComment }) => {
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
        }
      }}>
      <CustomDialogHeader title="Confirmation" onClose={handleClose} />
      <CustomDialogContent>
        <Box>
          <Typography>  All steps are done for{' '}
            <Box component="span" fontWeight="bold">   {serviceName}   </Box>
            , Do you want to complete it?
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
        <Button variant="contained" size="small" onClick={updateStatus} color='primary'>
          Complete
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default CompleteDialog;
