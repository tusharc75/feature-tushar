import { useState, useContext, Fragment } from 'react';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, purchaseOrder } from '../../../constants/helpers';
import { Button, Grid, TextField } from '@mui/material';
import DatePicker from '@mui/lab/DatePicker';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { Formik } from 'formik';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { dateFormat } from '../../../constants/helpers';

const AddInvoice = ({ purchaseOrderId, invoiceData = null, handleClose, handleSucess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
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
          setLoading(false);
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
          setLoading(false);
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
      PaperProps={{
        component: 'form',
        'aria-autocomplete': 'none',
        autoCorrect: 'off'
      }}
    >
      <CustomDialogHeader
        title={invoiceData ? 'Edit Invoice' : 'Add Invoice'}
        onClose={() => {
          handleClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <Formik
        enableReinitialize={true}
        initialValues={{ invoiceNumber: invoiceData?.invoiceNumber || '', invoiceDate: invoiceData?.invoiceDate || new Date() }}
        onSubmit={handleSubmit}
        validateOnMount
        validate={validate}
      >
        {({ touched, errors, setFieldValue, values, submitForm }) => (
          <Fragment>
            <CustomDialogContent>
              <Grid container spacing={2}>
                <Grid xs={12} md={12} sm={12} item>
                  <TextField
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
                  <DatePicker
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
              <CustomButton loading={loading} disabled={loading} variant="contained" type="button" onClick={submitForm} color="primary">
                Save
              </CustomButton>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddInvoice;
