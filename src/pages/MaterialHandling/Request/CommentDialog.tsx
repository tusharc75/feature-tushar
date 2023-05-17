import { Box, Button, Dialog, TextField } from '@material-ui/core';
import React from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';

function CommentDialog({ open, loading, onClose, onSuccess }) {

  const [comment, setComment] = React.useState('');

  return (
    <Dialog open={open} fullWidth TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader
        onClose={onClose}
        title={'Comment'}
        showManimizeMaximize={false}
        showRequiredLabel={false}
      />
      <CustomDialogContent>
        <Box p={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)} />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          type="button"
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => {
            onClose()
          }}
        >
          Cancel
        </Button>
        <CustomButton
          loading={loading}
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            onSuccess(comment);
          }}
        >
          Submit
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default CommentDialog;
