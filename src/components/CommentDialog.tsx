import { Box, Dialog, TextField, Theme } from '@mui/material';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import { useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import { makeStyles } from '@mui/styles';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const useStyles = makeStyles((theme: Theme) => ({
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
              setComment(e.target.value);
            }}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          buttonType='transparent'
          onClick={handleClose}
        >
          Cancel
        </ThemeButton>
        <ThemeButton
          id={'dialog-submit-button'}
          buttonType='theme'
          onClick={() => {
            if (comment?.trim()) {
              handleSubmit(comment?.trim());
            } else {
              setError('Comment is required');
            }
          }}
        >
          Submit
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}
