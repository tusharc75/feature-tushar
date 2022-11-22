import { useState, useContext } from 'react';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, purchaseOrder } from '../../../constants/helpers';
import { Button, Grid } from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { TextField as TextFieldFormik } from 'formik-material-ui';
import { Formik, Form, Field } from 'formik';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { dateFormat } from '../../../constants/helpers';

const AddInvoice = ({ purchaseOrderId, invoiceData = null, handleClose, handleSucess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    if (invoiceData) {
      delete values?._id;
      axiosInstance()
        .put(`${purchaseOrder.api}/invoice/${purchaseOrderId}/${invoiceData?._id}`, values)
        .then(({ data }) => {
          handleSucess();
          toastConfig.setToastConfig({
            open: true,
            message: data.message,
            severity: 'success'
          });
        })
        .catch((err) => {
          setLoading(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      axiosInstance()
        .post(`${purchaseOrder.api}/invoice/${purchaseOrderId}`, values)
        .then(({ data }) => {
          handleSucess();
          toastConfig.setToastConfig({
            open: true,
            message: data.message,
            severity: 'success'
          });
        })
        .catch((err) => {
          setLoading(false);
          toastConfig.setToastConfig(err);
        });
    }
  };

  function validate(values) {
    const errors = {};
    if (values.invoiceNumber === '') {
      errors['invoiceNumber'] = 'Please enter invoice number';
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <CustomDialogHeader
        title={'Add Invoice'}
        onClose={() => {
          handleClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <Formik
          initialValues={{ invoiceNumber: invoiceData?.invoiceNumber || '', invoiceDate: invoiceData?.invoiceDate || new Date() }}
          onSubmit={handleSubmit}
          validateOnMount
          validate={validate}
        >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <CustomDialogContent>
                <Grid container spacing={2}>
                  <Grid xs={12} md={12} sm={12} item>
                    <Field
                      component={TextFieldFormik}
                      margin="dense"
                      type="text"
                      label="Invoice Number"
                      name="invoiceNumber"
                      variant="outlined"
                      required
                      fullWidth
                      value={values['invoiceNumber']}
                      error={touched['invoiceNumber'] && Boolean(errors['invoiceNumber'])}
                      helperText={touched['invoiceNumber'] && errors['invoiceNumber']}
                      onChange={(e) => {
                        setFieldValue('invoiceNumber', e.target.value);
                      }}
                    />
                  </Grid>
                  <Grid xs={12} md={12} sm={12} item>
                    <KeyboardDatePicker
                      autoOk
                      fullWidth
                      size="small"
                      variant="inline"
                      inputVariant="outlined"
                      value={values['invoiceDate']}
                      name="invoiceDate"
                      label="Invoice Date"
                      onChange={(date: any) => {
                        setFieldValue('invoiceDate', date ? date : null);
                      }}
                      format={dateFormat}
                      error={Boolean(touched['invoiceDate']) && Boolean(errors['invoiceDate'])}
                      helperText={Boolean(touched['invoiceDate']) && errors['invoiceDate']}
                      InputLabelProps={{
                        shrink: true
                      }}
                      margin="dense"
                    />
                  </Grid>
                </Grid>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  Cancel
                </Button>
                <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit">
                  Save
                </CustomButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      </MuiPickersUtilsProvider>
    </Dialog>
  );
};

export default AddInvoice;
