import { useState, useContext, Fragment, useRef, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, purchaseOrder } from '../../../constants/helpers';
import { TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { Formik } from 'formik';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDatePicker from 'src/components/CustomDatePicker';

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
            type: 'success'
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
            type: 'success'
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
                <Grid size={{ xs: 12, md: 12, sm: 12 }}>
                  <TextField
                    id={'enter-invoice-number'}
                    margin="dense"
                    size="small"
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
                <Grid size={{ xs: 12, md: 12, sm: 12 }}>
                  <CustomDatePicker
                    fullWidth
                    size="small"
                    value={values['invoiceDate']}
                    name="invoiceDate"
                    label="Invoice Date"
                    onChange={(date: any) => {
                      setFieldValue('invoiceDate', date ? date : null);
                    }}
                    error={Boolean(touched['invoiceDate']) && Boolean(errors['invoiceDate'])}
                    helperText={Boolean(touched['invoiceDate']) && errors['invoiceDate']}
                    margin="dense"
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
              <ThemeButton id={'dialog-save-button'} isLoading={loading} disabled={loading} buttonType="theme" onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddInvoice;
