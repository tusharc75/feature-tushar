import { Button, Dialog } from '@material-ui/core';
import React from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';

const ArrangeService = (props) => {
  const { data, title, onClose, onSubmit, isSubmitting } = props;
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <CustomDialogHeader title={title || 'Assign'} onClose={onClose} />
      <CustomDialogContent>
        <div>Yo, How are you???? bby</div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" disabled={isSubmitting} color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={isSubmitting || !Boolean(onSubmit)} color="primary">
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ArrangeService;
