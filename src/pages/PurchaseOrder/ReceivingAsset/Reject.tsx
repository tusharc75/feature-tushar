import React, { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, Chip, ButtonGroup, Container, InputAdornment, Paper, Typography, TableBody } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form, FieldArray } from 'formik';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { convertDateInDateTime, dateFormatForInputControl, productInventory, purchaseOrder, sidebarResource } from '../../../constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import moment from 'moment';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';

const Reject = ({ purchaseOrderID, onClose, onSuccess, productList, purchaseOrderData }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockDate, setLockDate] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);


  useEffect(() => {
    fetchSettingsData();
  }, []);

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, [])

  const fetchSettingsData = () => {
    axiosInstance()
      .get(`${productInventory.api}/setting?warehouse=${purchaseOrderData?.warehouse?.optionValue}`)
      .then(({ data: { data } }) => {
        if (data?.lockDate) {
          setLockDate(data?.lockDate || null);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getStorageLocation = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          setStorageLocationOptions(data[sidebarResource.storageLocation]?.filter(e => e.warehouse === purchaseOrderData?.warehouse?.optionValue));
        }
      });
  };

  const handleReject = (values, rejectDate) => {
    setIsSubmitting(true);
    const data = [];
    values?.forEach((element) => {
      if (parseInt(element?.rejectQuantity)) {
        data.push({
          _id: element._id,
          product: element.productId,
          serializedProduct: element.serializedProduct,
          qty: parseInt(element?.rejectQuantity),
          comment: element?.comment === '' ? 'Rejected' : element?.comment,
          serialNumber: [],
          storageLocation: user?.user?.brandPolicy?.storageLocation ? element?.storageLocation?.optionValue : null,
        });
      }
    });
    if (data?.length) {
      axiosInstance()
        .post(`${purchaseOrder.api}/reject-inventory/${purchaseOrderID}`, { products: data, rejectDate: moment(rejectDate).format('MM/DD/YYYY') })
        .then(({ data }) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsSubmitting(false);
        });
    } else {
      onSuccess();
    }
  };

  const validate = (values) => {
    let errors: any = {};
    if (values.length > 0) {
      values.map((d) => {
        let tempProduct = productList.find((u) => u._id === d._id);
        if (tempProduct && d.rejectQuantity > tempProduct.qty - (tempProduct.rejectQuantity || 0) - (tempProduct.assetQty || 0)) {
          errors.rejectQuantity = 'should be greater';
        }
        if (user?.user?.brandPolicy?.storageLocation) {
          if (tempProduct && !d.storageLocation) {
            errors.storageLocation = 'Storage Location is required';
          }
        }
      });
    }
    return errors;
  };

  const validateDate = (values) => {
    let errors: any = {};

    if (moment(values["rejectDate"]).isBefore(moment(purchaseOrderData?.purchaseOrderDate))) {
      errors['rejectDate'] = `Please select valid date`;
    }

    if (lockDate) {
      if (!moment(values["rejectDate"]).isSameOrAfter(moment(lockDate))) {
        errors['rejectDate'] = `Date entered prior to the locked date`;
      }
    }
    if (moment(values["rejectDate"]).isAfter(moment())) {
      errors['rejectDate'] = `Please select valid date`;
    }
    return errors;
  }

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader
        title={'Reject'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <Formik
          initialValues={{
            rejectDate: new Date(),
            products: productList.map((d) => ({
              _id: d._id,
              storageLocation: purchaseOrderData?.storageLocation || null,
              product: d.productName,
              productId: d.productId,
              rejectQuantity: 0,
              comment: '',
              row: d
            }))
          }}
          enableReinitialize={true}
          onSubmit={() => { }}
        >
          {({ values, setFieldValue, errors }) => (
            <>
              <CustomDialogContent>
                {values.products && values.products.length ? (
                  <Box p={2}>
                    <Form>
                      <Grid direction="row" justify="space-evenly" alignItems="center">
                        <Grid item md={12}>
                          <Box>
                            <FieldArray
                              name="products"
                              render={(arrayHelpers) => (
                                <div>
                                  {values.products.map((data, index) => (
                                    <Box key={index} border={'1px solid #dddddd'} borderRadius={4} mb={2} p={2} pt={2}>
                                      <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={1}>
                                          <Chip color="primary" label={index + 1} />
                                        </Grid>
                                        <Grid item xs={12} md={11}>
                                          <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} md={3}>
                                              <Autocomplete
                                                size="small"
                                                value={data.product}
                                                options={productList}
                                                disabled
                                                getOptionLabel={(option: any) => (option ? option : '')}
                                                onChange={(_, newValue) => {
                                                  arrayHelpers.replace(index, {
                                                    ...values.products[index],
                                                    ['product']: newValue
                                                  });
                                                }}
                                                renderInput={(params) => <TextField {...params} variant="outlined" name="product" label="Product" />}
                                              />
                                            </Grid>
                                            {user?.user?.brandPolicy?.storageLocation &&
                                              <Grid item xs={12} md={3}>
                                                <Autocomplete
                                                  size="small"
                                                  value={data?.storageLocation}
                                                  options={storageLocationOptions}
                                                  getOptionLabel={(option: any) => option ? option.optionLabel : ''}
                                                  onChange={(_, newValue) => {
                                                    arrayHelpers.replace(index, {
                                                      ...values.products[index],
                                                      ['storageLocation']: newValue
                                                    });
                                                  }}
                                                  renderInput={(params) => (
                                                    <TextField
                                                      {...params}
                                                      variant="outlined"
                                                      name="storageLocation"
                                                      label="Storage Location"
                                                      error={validate([data]).storageLocation}
                                                      helperText={validate([data]).storageLocation ? 'Storage Location is required' : ''}
                                                      required
                                                    />
                                                  )}
                                                />
                                              </Grid>
                                            }
                                            <Grid item xs={12} md={3}>
                                              <span>
                                                <b>PO Quantity: </b>
                                                {data?.row?.qty}
                                              </span>
                                              <br />
                                              <span>
                                                <b>Received: </b>
                                                {data?.row?.actualReceived || 0}
                                              </span>
                                              <br />
                                              <span>
                                                <b>Rejected: </b>
                                                {data?.row?.rejectQuantity || 0}
                                              </span>
                                            </Grid>
                                          </Grid>
                                          <Box mt={1}>
                                            <Grid container spacing={2} alignItems="center">
                                              <Grid item xs={12} md={3}>
                                                <TextField
                                                  fullWidth
                                                  label="Reject Quantity"
                                                  variant="outlined"
                                                  type="number"
                                                  size="small"
                                                  name="rejectQuantity"
                                                  placeholder="Reject Quantity"
                                                  value={data.rejectQuantity}
                                                  onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    arrayHelpers.replace(index, {
                                                      ...values.products[index],
                                                      ['rejectQuantity']: value
                                                    });
                                                  }}
                                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                  error={validate([data])?.rejectQuantity}
                                                  helperText={validate([data]).rejectQuantity ? 'Reject quantity is more than quantity' : ''}
                                                />
                                              </Grid>
                                              <Grid item xs={12} md={3}>
                                                <TextField
                                                  fullWidth
                                                  label="Comment"
                                                  variant="outlined"
                                                  type="text"
                                                  size="small"
                                                  name="comment"
                                                  placeholder="Comment"
                                                  value={data.comment}
                                                  onChange={(e) => {
                                                    arrayHelpers.replace(index, {
                                                      ...values.products[index],
                                                      ['comment']: e.target.value
                                                    });
                                                  }}
                                                />
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  ))}
                                </div>
                              )}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                      <Box pt={2}>
                        <KeyboardDatePicker
                          label="Reject Date"
                          variant="inline"
                          inputVariant="outlined"
                          autoOk
                          size="small"
                          margin="dense"
                          name="rejectDate"
                          placeholder="Reject Date"
                          value={values.rejectDate}
                          format={dateFormatForInputControl}
                          minDate={
                            lockDate
                              ? moment(lockDate).diff(moment(purchaseOrderData?.purchaseOrderDate), 'days') > 0
                                ? lockDate
                                : purchaseOrderData?.purchaseOrderDate
                              : purchaseOrderData?.purchaseOrderDate
                          }
                          maxDate={new Date()}
                          onChange={(value) => {
                            setFieldValue('rejectDate', convertDateInDateTime(value));
                          }}
                        />
                      </Box>
                    </Form>
                  </Box>
                ) : (
                  <Box p={2} height={300} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(6).keys()]} />
                  </Box>
                )}
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button variant="outlined" disabled={isSubmitting} color="primary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!validate(values.products).rejectQuantity && !validate(values.products).storageLocation && !validateDate(values)?.rejectDate) {
                      handleReject(values.products, values.rejectDate);
                    }
                  }}
                  size="small"
                  variant="contained"
                  disabled={isSubmitting}
                  color="primary"
                >
                  Save
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      </MuiPickersUtilsProvider>
    </Dialog>
  );
};

export default Reject;
