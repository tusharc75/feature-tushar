import { Box, Button, Dialog, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import { Form, Formik } from 'formik';
import React from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, productInventory, sidebarResource } from 'src/constants/helpers';

function RevertQtyDialog({ referenceType, productName, product, onClose, onSuccess, qty, revertedQty, ledgerId, serialNumber = [] }) {
  const toastConfig = React.useContext(CustomToastContext);
  const [loading, setLoading] = React.useState(false);

  function validate(values) {
    const errors = {};
    if (values.revertQty <= 0) {
      errors['revertQty'] = 'Please enter valid revert qty';
    }
    if (parseInt(values.revertQty) > qty - revertedQty) {
      errors['revertQty'] = 'Insufficient Quantity !';
    }
    if (serialNumber?.length && values.serialNumber?.length !== parseInt(values.revertQty)) {
      errors['serialNumber'] = 'Please select serial number for each qty';
    }
    return errors;
  }

  const handleSubmit = (values) => {
    setLoading(true);
    let data = {
      revertQty: parseInt(values.revertQty),
      comment: values.comment,
      ...(serialNumber?.length ? { serialNumber: values.serialNumber } : {})
    };
    if ([sidebarResource.workOrder, sidebarResource.fieldTicket]?.includes(referenceType)) {
      axiosInstance()
        .put(`/material-handling/revert/${ledgerId}`, {
          ...data,
          referenceType: referenceType
        })
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(`${productInventory.api}/${product}/ledger-revert/${ledgerId}`, data)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog open={true} fullWidth TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader
        onClose={onClose}
        title={productName !== '' ? `Revert - ${productName}` : 'Revert'}
        showManimizeMaximize={false}
        showRequiredLabel={false}
      />
      <Formik
        initialValues={{ revertQty: qty - revertedQty, comment: 'Reverted', ...(serialNumber?.length ? { serialNumber: [] } : {}) }}
        onSubmit={handleSubmit}
        validateOnMount
        validate={validate}
      >
        {({ touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogContent>
              <TextField
                margin="dense"
                type="number"
                label="Revert Qty"
                name="revertQty"
                required
                fullWidth
                variant="outlined"
                value={values['revertQty']}
                error={touched['revertQty'] && Boolean(errors['revertQty'])}
                helperText={touched['revertQty'] && errors['revertQty']}
                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                onChange={(e) => {
                  setFieldValue('revertQty', e.target.value?.replace(/\D/g, ''));
                }}
              />
              {serialNumber?.length ? (
                <Box mt={2} mb={1}>
                  <Autocomplete
                    options={[{ optionValue: 'all', optionLabel: 'Select All' }, ...serialNumber]}
                    fullWidth
                    multiple
                    size="small"
                    value={values?.serialNumber ? serialNumber?.filter((data: any) => values?.serialNumber?.includes(data.optionValue)) : []}
                    getOptionLabel={(option) => option.optionLabel}
                    getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                    onChange={(_, newVal: any) => {
                      const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                      const values = isAll ? [...serialNumber?.map((o) => o.optionValue)] : newVal?.map((val) => val.optionValue);
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
                Revert
              </CustomButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default RevertQtyDialog;
