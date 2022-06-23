import { Fragment, useState, useEffect, useContext } from 'react';
import { Box, Button, Dialog, Divider, List, ListItem, ListItemAvatar, ListItemText, TextField } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form, Field } from 'formik';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { productInventory } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';

const RejectProduct = ({ handleClose, handleSuccess, product, POId, warehouse }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (!product && !warehouse) return;
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${productInventory.api}/serial-number/${product.productId}?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (!data || data.lenght === 0) return;
        setSerialNumbers(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (values) => {
    const serialNumberIds = serialNumbers.filter((item: any) => values['serialNumbers'].indexOf(item?.serialNumber) > -1);
    const data = {
      _id: product._id,
      comment: values.comment,
      product: product.productId,
      qty: parseInt(values.qty),
      serialNumber: serialNumberIds.map((item) => item?._id),
    };
    setLoading(true);
    axiosInstance()
      .put(`/purchase-order/reject-inventory/${POId}`, data)
      .then(() => {
        setLoading(false);
        handleSuccess();
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  function validate(values) {
    const errors = {};
    if (values.qty <= 0) {
      errors['qty'] = 'Please enter valid qty';
    }
    const validateQty = product?.inventoryQty;
    if (parseInt(values?.qty) > validateQty) {
      errors['qty'] = 'Qty cannot be more than received quantity';
    }
    const serialNumbersList = values['serialNumbers'];
    if (serialNumbersList?.length > parseInt(values?.qty)) {
      errors['serialNumbers'] = `Please select serial numbers same as quantity`;
    }
    return errors;
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={true}
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-labelledby="assign-roles-dialog"
    >
      <Formik initialValues={{ qty: 1, comment: '' }} onSubmit={handleSubmit} validateOnMount validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogHeader
              title={`Reject/Replacement Product`}
              showRequiredLabel={true}
              onClose={handleClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <List style={{ padding: 0 }}>
                <ListItem key={product.productId}>
                  <ListItemText primary={product?.productName} secondary={`Received Quantity - ${product?.inventoryQty || 0}`} />
                  <Field
                    component={TextFieldFormik}
                    margin="dense"
                    type="number"
                    label="Qty"
                    name="qty"
                    variant="outlined"
                    value={values['qty']}
                    error={touched['qty'] && Boolean(errors['qty'])}
                    helperText={touched['qty'] && errors['qty']}
                    onChange={(e) => {
                      setFieldValue('qty', e.target.value);
                    }}
                  />
                </ListItem>
              </List>
              <Box m={1}>
                <Field
                  component={TextFieldFormik}
                  margin="dense"
                  type="text"
                  label="Comment"
                  name="comment"
                  variant="outlined"
                  rows={3}
                  multiline
                  fullWidth
                  value={values['comment']}
                  error={touched['comment'] && Boolean(errors['comment'])}
                  helperText={touched['comment'] && errors['comment']}
                  onChange={(e) => {
                    setFieldValue('comment', e.target.value);
                  }}
                />
              </Box>
              {product?.serializedProduct ? (
                <Fragment>
                  <Box my={2} mx={1}>
                    <Divider />
                  </Box>
                  <Box m={1}>
                    <Autocomplete
                      size="small"
                      options={serialNumbers.map((item: any) => item?.serialNumber.toString())}
                      freeSolo={false}
                      multiple={true}
                      disableCloseOnSelect
                      value={values['serialNumbers']}
                      onChange={(_, val) => {
                        setFieldValue('serialNumbers', val);
                      }}
                      getOptionSelected={(item, current) => item === current}
                      getOptionLabel={(option) => option}
                      renderInput={(props) => (
                        <TextField
                          {...props}
                          placeholder={''}
                          variant="outlined"
                          name="serialNumbers"
                          label={'Select Serial Numbers'}
                          error={touched['serialNumbers'] && Boolean(errors['serialNumbers'])}
                          helperText={touched['serialNumbers'] && errors['serialNumbers']}
                        />
                      )}
                    />
                  </Box>
                </Fragment>
              ) : null}
            </CustomDialogContent>
            <CustomDialogFooter>
              <CustomButton
                loading={loading}
                disabled={loading}
                variant="contained"
                color="primary"
                type="submit"
                onClick={() => {
                  if (Object.keys(errors).length > 0) return;
                  submitForm();
                }}
              >
                Submit
              </CustomButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default RejectProduct;
