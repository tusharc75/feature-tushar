import { Button, Dialog, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, MATERIAL_REQUEST_STATUS } from 'src/constants/helpers';

function QtyDialog({ open, loading, onClose, data, status, onSuccess }) {

  function validate(values) {
    const errors = {};
    if (status === MATERIAL_REQUEST_STATUS.processed && data) {
      if (values.qty <= 0) {
        errors['qty'] = 'Please enter valid qty';
      }
      if (parseInt(values.qty) > (parseInt(data?.qty) - parseInt(data?.processedQty || 0))) {
        errors['qty'] = 'Insufficient Quantity !';
      }
    }
    return errors;
  }

  return (
    <Dialog open={open} fullWidth TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader
        onClose={onClose}
        title={`${status === MATERIAL_REQUEST_STATUS.processed ? 'Process' : 'Close'}${data ? ' - ' : ''}${data?.productName}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
      />
      <Formik initialValues={{ qty: parseInt(data?.qty) - parseInt(data?.processedQty || 0) }} onSubmit={onSuccess} validateOnMount validate={validate}>
        {({ touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogContent>
              {status === MATERIAL_REQUEST_STATUS.processed && data &&
                <TextField
                  margin="dense"
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
              }
              <TextField
                margin="dense"
                type="text"
                label="Comment"
                name="comment"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={values['comment']}
                error={touched['comment'] && Boolean(errors['comment'])}
                helperText={touched['comment'] && errors['comment']}
                onChange={(e) => {
                  setFieldValue('comment', e.target.value);
                }}
              />
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                type="button"
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  onClose()
                }}
              >
                Cancel
              </Button>
              <CustomButton
                loading={loading}
                variant="contained"
                color="primary"
                disabled={loading}
                type="submit"
              >
                Submit
              </CustomButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default QtyDialog;
