import { Fragment, useContext, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { CustomDialogTransition, serializedAsset } from '../../constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CircularProgress, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export default function ChangeProductNameDialog({ onClose, onSuccess, fields, currentProduct, productInventoryId }) {
  const toastConfig = useContext(CustomToastContext);
  const [submitting, setSubmitting] = useState(false);
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    const productField = fields?.find((f) => f.fieldData.fieldName === 'product')?.fieldData || [];
    setProductOptions(productField.option);
  }, []);

  const handleSubmit = (values) => {
    setSubmitting(true);
    const data = {
      prevProductName: currentProduct.optionLabel,
      productName: values.product.optionLabel,
      productId: values.product.optionValue,
      productCategoryId: values.product.productCategory,
      _id: productInventoryId
    };
    axiosInstance()
      .put(`${serializedAsset.api}/change-product`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const validate = (values) => {
    const errors = {};
    if (!values['product']) {
      errors['product'] = 'Select the product';
    } else if (values['product']?.optionValue == currentProduct.optionValue) {
      errors['product'] = 'Select a different product';
    }
    return errors;
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={'sm'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {productOptions?.length ? (
        <Formik initialValues={{ product: currentProduct }} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  onClose();
                }}
                title={`Change Product Name`}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <div className="py-2">
                    <Autocomplete
                      size="small"
                      options={productOptions}
                      value={values['product']}
                      onChange={(_, val) => {
                        setFieldValue('product', val);
                      }}
                      getOptionSelected={(option, val) => (option ? option.optionLabel === val.optionLabel : false)}
                      getOptionLabel={(option) => option.optionLabel}
                      renderInput={(props) => (
                        <TextField
                          {...props}
                          required
                          variant="outlined"
                          label={`Select Product`}
                          name="product"
                          size="small"
                          error={touched?.product && Boolean(errors[`product`])}
                          helperText={touched?.product && errors[`product`]}
                        />
                      )}
                    />
                  </div>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
