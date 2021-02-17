import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@material-ui/core";
import { Form, Formik } from "formik";

const CustomDialog = (props) => {
  const {
    open,
    setOpen,
    selectedData,
    setSelectedData,
    data,
    setData,
    children,
    dialogTitle,
  } = props;

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
    <Formik initialValues={selectedData}>
      {({ values }) => (
        <Form>
          <Dialog
            maxWidth="lg"
            open={open}
            onClose={handleClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogTitle id="form-dialog-title">{dialogTitle}</DialogTitle>
            <DialogContent>{children}</DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Close
              </Button>
              <Button
                onClick={() => handleUpdateEntity(values)}
                color="primary"
              >
                Update
              </Button>
            </DialogActions>
          </Dialog>
        </Form>
      )}
    </Formik>
  );
};

export default CustomDialog;
