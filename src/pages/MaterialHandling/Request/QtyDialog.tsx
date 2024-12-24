import { Box, Button, Dialog, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { Form, Formik } from 'formik';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, MATERIAL_REQUEST_STATUS, PRODUCT_SERIAL_NUMBER_STATUS } from 'src/constants/helpers';

function QtyDialog({ open, loading, onClose, data, status, onSuccess }) {
  const serialNumberOptions = data?.serialNumber?.filter((s: any) => s?.status === PRODUCT_SERIAL_NUMBER_STATUS.available) || [];

  function validate(values) {
    const errors = {};
    if (status === MATERIAL_REQUEST_STATUS.processed && data) {
      if (values.qty <= 0) {
        errors['qty'] = 'Please enter valid qty';
      }
      if (parseInt(values.qty) > parseInt(data?.qty) - parseInt(data?.processedQty || 0)) {
        errors['qty'] = 'Insufficient Quantity !';
      }
    }
    if (status === MATERIAL_REQUEST_STATUS.closed) {
      if (!values.comment) {
        errors['comment'] = 'Comment is required';
      }
    }
    if (status === MATERIAL_REQUEST_STATUS.processed && serialNumberOptions.length && values.serialNumber?.length !== parseInt(values.qty)) {
      errors['serialNumber'] = 'Please select serial number for each qty';
    }
    return errors;
  }

  return (
    <Dialog open={open} fullWidth TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader
        onClose={onClose}
        title={`${status === MATERIAL_REQUEST_STATUS.processed ? 'Process' : 'Close'}${data ? ' - ' : ''}${data?.productName || ''}`}
        showManimizeMaximize={false}
        showRequiredLabel={true}
      />
      <Formik
        initialValues={{ qty: parseInt(data?.qty) - parseInt(data?.processedQty || 0), comment: '', serialNumber: [] }}
        onSubmit={onSuccess}
        validateOnMount
        validate={validate}
      >
        {({ touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogContent>
              {status === MATERIAL_REQUEST_STATUS.processed && data && (
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
              )}
              {status === MATERIAL_REQUEST_STATUS.processed && data && serialNumberOptions?.length ? (
                <Box mt={2} mb={1}>
                  <Autocomplete
                    options={[{ optionValue: 'all', optionLabel: 'Select All' }, ...serialNumberOptions]}
                    fullWidth
                    multiple
                    size="small"
                    value={values?.serialNumber ? serialNumberOptions?.filter((data: any) => values?.serialNumber?.includes(data.optionValue)) : []}
                    getOptionLabel={(option) => option.optionLabel}
                    getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                    onChange={(_, newVal: any) => {
                      const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                      const values = isAll ? [...serialNumberOptions?.map((o) => o.optionValue)] : newVal?.map((val) => val.optionValue);
                      setFieldValue('serialNumber', values);
                    }}
                    renderInput={(params) => (
                      <TextField
                        required={true}
                        {...params}
                        label="Select Serial Number"
                        name="serialNumber"
                        variant="outlined"
                        error={touched['serialNumber'] && Boolean(errors['serialNumber'])}
                        helperText={touched['serialNumber'] && errors['serialNumber']}
                      />
                    )}
                  />
                </Box>
              ) : null}
              <TextField
                margin="dense"
                type="text"
                label="Comment"
                name="comment"
                fullWidth
                multiline
                rows={2}
                required={status === MATERIAL_REQUEST_STATUS.processed ? false : true}
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
                  onClose();
                }}
              >
                Cancel
              </Button>
              <CustomButton loading={loading} variant="contained" color="primary" disabled={loading} type="submit">
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
