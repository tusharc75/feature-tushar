import { Box, Button, Dialog, TextField, makeStyles } from '@material-ui/core';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import { useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  }
}));

export default function CommentDialog({ required = false, handleSubmit, handleClose }) {
  const classes = useStyles();

  const [comment, setComment] = useState(null);
  const [error, setError] = useState(null);

  return (
    <Dialog
      open={true}
      classes={{
        paper: classes.paper
      }}
      TransitionComponent={CustomDialogTransition}
      onClose={handleClose}
    >
      <CustomDialogHeader title="Comment" showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        <Box className="my-2">
          <TextField
            id="outlined-multiline-static"
            label="Comment"
            multiline
            required={required}
            fullWidth
            rows={4}
            value={comment}
            variant="outlined"
            error={Boolean(error)}
            helperText={Boolean(error) && error}
            onChange={(e) => {
              const commentValue = e.target.value;
              if (commentValue.trim() !== '') {
                setComment(e.target.value);
              }
            }}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" variant="outlined" color="primary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          id={'dialog-submit-button'}
          size="small"
          onClick={() => {
            if (comment) {
              handleSubmit(comment);
            } else {
              setError('Comment is required');
            }
          }}
          variant="contained"
          color="primary"
        >
          Submit
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}
