import { Button, Dialog, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import React from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, RESOURCE_LABEL, productInventory, sidebarResource } from 'src/constants/helpers';

function RevertQtyDialog({ referenceType, productName, product, onClose, onSuccess, qty, revertedQty, ledgerId }) {

  const toastConfig = React.useContext(CustomToastContext);
  const [loading, setLoading] = React.useState(false);

  function validate(values) {
    const errors = {};
    if (values.revertQty <= 0) {
      errors['revertQty'] = 'Please enter valid revert qty';
    }
    if (parseInt(values.revertQty) > (qty - revertedQty)) {
      errors['revertQty'] = 'Insufficient Quantity !';
    }
    return errors;
  }

  const handleSubmit = (values) => {
    setLoading(true);
    let data = { revertQty: parseInt(values.revertQty), comment: values.comment };
    if (referenceType === "workOrder") {
      axiosInstance().put(`/material-handling/revert/${ledgerId}`, { ...data, referenceType: sidebarResource.workOrder })
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
    else {
      axiosInstance().put(`${productInventory.api}/${product}/ledger-revert/${ledgerId}`, data)
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
        showRequiredLabel={false} />
      <Formik
        initialValues={{ revertQty: (qty - revertedQty), comment: 'Reverted' }}
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
              <CustomButton
                loading={loading}
                variant="contained"
                color="primary"
                disabled={loading}
                type="submit">
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
