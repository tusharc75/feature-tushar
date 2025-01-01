import { Dialog, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';

function QtyWithdrawalDialog({ referenceId, referenceType, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  function validate(values) {
    const errors = {};
    if (values.qty <= 0) {
      errors['qty'] = 'Please enter valid qty';
    }
    if (parseInt(values.qty) > parseInt(data?.qty) - parseInt(data?.processedQty || 0)) {
      errors['qty'] = 'Insufficient Quantity !';
    }
    return errors;
  }

  const handleSubmit = (values) => {
    setLoading(true);
    const postData: any = {
      referenceType: referenceType,
      referenceId: referenceId,
      requests: [
        {
          uniqueId: data.uniqueId,
          _id: data._id,
          qty: parseInt(values?.qty)
        }
      ]
    };
    axiosInstance()
      .put(`material-handling/withdrawal-request`, postData)
      .then(({ data }) => {
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog open={true} fullWidth TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader onClose={onClose} title={`Close Request`} showManimizeMaximize={false} showRequiredLabel={false} />
      <Formik
        initialValues={{ qty: parseInt(data?.qty) - parseInt(data?.processedQty || 0) }}
        onSubmit={handleSubmit}
        validateOnMount
        validate={validate}
      >
        {({ touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogContent>
              <TextField
                margin="dense"
                size="small"
                type="number"
                label="Qty"
                name="qty"
                required
                fullWidth
                variant="outlined"
                value={values['qty']}
                error={touched['qty'] && Boolean(errors['qty'])}
                helperText={touched['qty'] && errors['qty']}
                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                onChange={(e) => {
                  setFieldValue('qty', e.target.value?.replace(/\D/g, ''));
                }}
              />
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton
                buttonType="transparent"
                onClick={() => {
                  onClose();
                }}
              >
                Cancel
              </ThemeButton>
              <ThemeButton
                isLoading={loading}
                buttonType="theme"
                onClick={handleSubmit}
                disabled={loading}>
                Close Request
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default QtyWithdrawalDialog;
