import { Box, Dialog, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import dayjs from 'dayjs';
import { Form, Formik } from 'formik';
import CustomDatePicker from 'src/components/CustomDatePicker';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import MultiLine from 'src/components/Helpers/FormTypes/MultiLine';
import { CustomDialogTransition, MATERIAL_REQUEST_STATUS, PRODUCT_SERIAL_NUMBER_STATUS } from 'src/constants/helpers';

function QtyDialog({ open, loading, onClose, data, status, onSuccess, minDate }) {

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
    if (status === MATERIAL_REQUEST_STATUS.processed) {
      if (!values?.processedDate) {
        errors['processedDate'] = `Processed Date is required`;
      }
      if (dayjs(values?.processedDate).isBefore(minDate, 'day')) {
        errors['processedDate'] = `Date entered prior to the request date`;
      }
      if (dayjs(values?.processedDate).isAfter(dayjs(), 'day')) {
        errors['processedDate'] = `Please select valid date`;
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
        initialValues={{ qty: parseInt(data?.qty) - parseInt(data?.processedQty || 0), comment: '', serialNumber: [], processedDate: data?.requestDate || new Date() }}
        onSubmit={onSuccess}
        validateOnMount
        validate={validate}
      >
        {({ touched, errors, setFieldValue, values, submitForm }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogContent>
              {status === MATERIAL_REQUEST_STATUS.processed && data && (
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
                    isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
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
              {status === MATERIAL_REQUEST_STATUS.processed && (
                <div className="datepicker mt-[10px]">
                  <CustomDatePicker
                    label={`Processed Date`}
                    required
                    autoOk
                    fullWidth
                    size="small"
                    margin="dense"
                    name='processedDate'
                    placeholder={`Processed Date`}
                    value={values?.processedDate}
                    minDate={minDate}
                    maxDate={new Date()}
                    onChange={(value) => {
                      setFieldValue('processedDate', value);
                    }}
                    error={touched['processedDate'] && Boolean(errors['processedDate'])}
                    helperText={touched['processedDate'] && errors['processedDate']}
                  />
                </div>
              )}
              <Box pt={2}>
                <MultiLine
                  label="Comment"
                  value={values['comment']}
                  required={status === MATERIAL_REQUEST_STATUS.processed ? false : true}
                  error={Boolean(errors['comment'])}
                  touched={Boolean(errors['comment']) ? String(errors['comment']) : ''}
                  onChange={(value) => {
                    setFieldValue('comment', value);
                  }}
                />
              </Box>
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
                onClick={submitForm}
                isLoading={loading}
                buttonType="theme"
                disabled={loading}
              >
                Submit
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default QtyDialog;
