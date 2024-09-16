import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { Form, Formik } from 'formik';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';

const CustomDialog = (props) => {
  const { open, setOpen, selectedData, setSelectedData, data, setData, children, dialogTitle } = props;

  const handleClose = () => {
    setOpen(false);
    setSelectedData(null);
  };

  const handleUpdateEntity = (newData) => {
    const updatedData = data.map((d) => {
      if (d.id === newData.id) {
        return newData;
      }
      return d;
    });

    setData(updatedData);
    handleClose();
  };

  return (
    <Dialog maxWidth="lg" TransitionComponent={CustomDialogTransition} open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <Formik initialValues={selectedData} onSubmit={() => {}}>
        {({ values }) => (
          <>
            <CustomDialogHeader title={dialogTitle} />

            <DialogContent>
              <Form>{children}</Form>
            </DialogContent>

            <DialogActions>
              <Button size="small" onClick={handleClose} color="primary">
                Close
              </Button>
              <Button onClick={() => handleUpdateEntity(values)} color="primary">
                Update
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default CustomDialog;
