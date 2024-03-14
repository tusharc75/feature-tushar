import { useState, useEffect, useContext } from 'react';
import { Box, Button, Dialog, List, ListItem, ListItemText, TextField } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form } from 'formik';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { convertDateInDateTime, convertDateTimToDate, productInventory, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';
import { dateFormatForInputControl } from '../../../constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import moment from 'moment';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import routes from 'src/components/Helpers/Routes';

const RejectProduct = ({ handleClose, handleSuccess, product, POId, warehouse, purchaseOrderData, materialAssets }) => {
  const {
    state: { user }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [lockDate, setLockDate] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (!product && !warehouse) return;
    fetchData();
    fetchSettingsData();
  }, []);

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, [])

  const fetchSettingsData = () => {
    axiosInstance()
      .get(`${productInventory.api}/setting?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (data?.lockDate) {
          setLockDate(data?.lockDate || null);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${productInventory.api}/serial-number/${product.materialId}?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setSerialNumbers(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const getStorageLocation = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          setStorageLocationOptions(data[sidebarResource.storageLocation].filter(e => e.warehouse === warehouse));
        }
      });
  };

  const handleSubmit = (values) => {
    const serialNumberIds = serialNumbers.filter((item: any) => values['serialNumbers']?.indexOf(item?.serialNumber) > -1);
    const data = [
      {
        _id: product._id,
        comment: values?.comment === '' ? 'Rejected' : values?.comment,
        supplierPartNumber: values?.supplierPartNumber,
        type: product.type,
        materialId: product.materialId,
        qty: parseInt(values.qty),
        serialNumber: serialNumberIds?.map((item) => item?._id),
        storageLocation: user?.user?.brandPolicy?.storageLocation ? values['storageLocation'] : null,
        serializedProduct: product?.serializedProduct || false,
        assetQty: product?.assetQty || 0,
        assetIds: values?.assetIds?.map((s) => s?.optionValue)
      }
    ];
    setLoading(true);
    axiosInstance()
      .post(`/purchase-order/reject-inventory/${POId}`, { material: data, rejectDate: moment(values?.rejectDate).format('MM/DD/YYYY') })
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
    const validateQty = product?.qty - (product?.rejectQuantity || 0);
    if (parseInt(values?.qty) > validateQty) {
      errors['qty'] = 'Qty cannot be more than quantity';
    }
    if (product?.assetQty) {
      if (product?.qty - (product?.actualReceived || 0) < parseInt(values?.qty || 0) + parseInt(product.rejectQuantity || 0)) {
        const removeActualReceivedQty = parseInt(values?.qty || 0) + parseInt(product.rejectQuantity || 0) - (product?.qty - (product?.actualReceived || 0));
        if (values?.assetIds?.length !== removeActualReceivedQty) {
          errors['assetIds'] = `Selected ${routes.serializedAsset.title} must be equal to reject quantity`;
        }
      }
    }
    const serialNumbersList = values['serialNumbers'];
    if (serialNumbersList?.length > parseInt(values?.qty)) {
      errors['serialNumbers'] = `Please select serial numbers same as quantity`;
    }
    if (user?.user?.brandPolicy?.storageLocation && !values['storageLocation']) {
      errors['storageLocation'] = `Storage Location is required`;
    }
    if (moment(values["rejectDate"]).isBefore(convertDateTimToDate(purchaseOrderData?.purchaseOrderDate))) {
      errors['rejectDate'] = `Date entered prior to the purchase order date`;
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
      <MuiPickersUtilsProvider utils={DateUtils}>
        <Formik initialValues={{
          qty: 1,
          rejectDate: new Date(),
          comment: '',
          supplierPartNumber: '',
          storageLocation: purchaseOrderData?.storageLocation?.optionValue || null,
          assetIds: []
        }}
          onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate className='min-h-[calc(100%-111px)]'>
              <CustomDialogHeader
                title={`Reject Product`}
                showRequiredLabel={true}
                onClose={handleClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent className='min-h-[100%]'>
                <List style={{ padding: 0 }}>
                  <ListItem key={product.materialId}>
                    <ListItemText
                      primary={product?.detail}
                      secondary={`Quantity : ${product?.qty - (product?.rejectQuantity || 0)}`}
                    />
                    <TextField
                      margin="dense"
                      type="number"
                      required
                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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
                  <TextField
                    margin="dense"
                    type="text"
                    label="Supplier Part Number"
                    name="supplierPartNumber"
                    variant="outlined"
                    fullWidth
                    value={values['supplierPartNumber']}
                    error={touched['supplierPartNumber'] && Boolean(errors['supplierPartNumber'])}
                    helperText={touched['supplierPartNumber'] && errors['supplierPartNumber']}
                    onChange={(e) => {
                      setFieldValue('supplierPartNumber', e.target.value);
                    }}
                  />
                </Box>
                <Box m={1}>
                  <TextField
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
                {product?.serializedProduct && (
                  <Box m={1}>
                    <Autocomplete
                      size="small"
                      multiple
                      disableCloseOnSelect={true}
                      value={values['assetIds']}
                      options={[{ optionLabel: 'All', optionValue: 'All' }, ...materialAssets]}
                      getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                      onChange={(_, newValue) => {
                        var tempValue = newValue;
                        if (tempValue?.find((e) => e.optionValue === 'All')) {
                          tempValue = materialAssets;
                        }
                        setFieldValue('assetIds', tempValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          name="assetIds"
                          label={routes.serializedAsset.title}
                          error={touched['assetIds'] && Boolean(errors['assetIds'])}
                          helperText={touched['assetIds'] && errors['assetIds']}
                        />
                      )}
                    />
                  </Box>
                )}
                {product?.serializedProduct && user?.user?.brandPolicy?.purchaseOrderSerializedAddInventory ? (
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
                ) : null}
                {(user?.user?.brandPolicy?.storageLocation && storageLocationOptions) &&
                  <Box m={1}>
                    <Autocomplete
                      disableClearable
                      options={storageLocationOptions}
                      getOptionLabel={(option: any) => option ? option.optionLabel : ''}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={storageLocationOptions.filter((data) => data.optionValue === values['storageLocation']).length ? storageLocationOptions.filter((data) => data.optionValue === values['storageLocation'])[0] : ''}
                      onChange={(e, val) => {
                        setFieldValue('storageLocation', val?.optionValue);
                      }}
                      renderInput={(params) =>
                        <TextField
                          {...params}
                          variant="outlined"
                          name="storageLocation"
                          label="Storage Location"
                          margin="dense"
                          required
                          error={touched['storageLocation'] && Boolean(errors['storageLocation'])}
                          helperText={touched['storageLocation'] && errors['storageLocation']}
                        />
                      }
                    />
                  </Box>
                }
                <Box m={1}>
                  <KeyboardDatePicker
                    fullWidth
                    label="Reject Date"
                    variant="inline"
                    inputVariant="outlined"
                    autoOk
                    required
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
                    error={touched['rejectDate'] && Boolean(errors['rejectDate'])}
                    helperText={touched['rejectDate'] && errors['rejectDate']}
                  />
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter className=' sticky bottom-0 z-[100]'>
                <Button
                  color="primary"
                  size="small"
                  onClick={handleClose}>
                  Cancel
                </Button>
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
      </MuiPickersUtilsProvider>
    </Dialog>
  );
};

export default RejectProduct;
