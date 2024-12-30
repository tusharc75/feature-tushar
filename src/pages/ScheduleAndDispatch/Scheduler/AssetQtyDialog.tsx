import { Button, Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Formik } from 'formik';
import { Fragment, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AssetQtyDialog = ({ warehouse, product, handleClose, handleSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values) => {
    setLoading(true);
    axiosInstance()
      .put(`${rentalManagement.api}/schedule-and-dispatch/add-available-asset`, {
        qty: values?.qty,
        warehouse: warehouse,
        product: product
      })
      .then(({ data }) => {
        setLoading(false);
        handleSuccess(data.data || []);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const validate = (values) => {
    const errors = {};
    if (values?.qty == 0) {
      errors['qty'] = 'Please add quantity';
    }
    return errors;
  };

  return (
    <Fragment>
      <Dialog
        maxWidth="sm"
        fullWidth
        fullScreen={false}
        aria-labelledby="customized-dialog-title"
        open={true}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
      >
        <CustomDialogHeader
          title={'Add Asset Quantity'}
          onClose={() => {
            handleClose();
          }}
          onMinimizeMaximize={null}
          showManimizeMaximize={false}
        ></CustomDialogHeader>
        <Formik initialValues={{ qty: 0 }} onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ touched, errors, setFieldValue, values, submitForm }) => (
            <Fragment>
              <CustomDialogContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 12, sm: 12 }}>
                    <TextField
                      margin="dense"
                      size="small"
                      type="number"
                      label="Quantity"
                      name="quantity"
                      variant="outlined"
                      required
                      fullWidth
                      value={values['qty']}
                      error={touched['qty'] && Boolean(errors['qty'])}
                      helperText={touched['qty'] && errors['qty']}
                      onChange={(e) => {
                        setFieldValue('qty', Number(e.target.value));
                      }}
                    />
                  </Grid>
                </Grid>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton isLoading={loading} disabled={loading} buttonType="theme" onClick={submitForm}>
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </Fragment>
          )}
        </Formik>
      </Dialog>
    </Fragment>
  );
};

export default AssetQtyDialog;
