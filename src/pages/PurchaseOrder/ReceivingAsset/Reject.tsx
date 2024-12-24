import { useContext, useEffect, useState } from 'react';
import { Dialog, Button, Box, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form, FieldArray } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  CustomDialogTransition,
  MATERIAL_TYPE,
  convertDateInDateTime,
  convertDateTimToDate,
  dateFormatForInputControl,
  productInventory,
  purchaseOrder,
  sidebarResource
} from '../../../constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import moment from 'moment';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { startCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';

const Reject = ({ purchaseOrderID, onClose, onSuccess, material, purchaseOrderData, materialserializedAssets, materialSerialNumbers }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, resources }
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
  }, []);

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
          setStorageLocationOptions(data[sidebarResource.storageLocation]?.filter((e) => e.warehouse === purchaseOrderData?.warehouse?.optionValue));
        }
      });
  };

  const handleReject = (values, rejectDate) => {
    setIsSubmitting(true);
    const data: any = [];
    values?.forEach((element) => {
      if (parseInt(element?.rejectQuantity)) {
        data.push({
          _id: element._id,
          type: element.type,
          materialId: element.materialId,
          qty: parseInt(element?.rejectQuantity),
          comment: element?.comment === '' ? 'Rejected' : element?.comment,
          supplierPartNumber: element?.supplierPartNumber,
          storageLocation: user?.user?.brandPolicy?.storageLocation ? element?.storageLocation?.optionValue : null,
          serializedProduct: element?.row?.serializedProduct || false,
          assetQty: element?.assetIds?.length,
          assetIds: element?.assetIds?.map((s) => s?.optionValue),
          serialNumber: element?.serialNumber?.map((s) => s?.optionValue)
        });
      }
    });

    if (data?.length) {
      axiosInstance()
        .post(`${purchaseOrder.api}/reject-inventory/${purchaseOrderID}`, { material: data, rejectDate: moment(rejectDate).format('MM/DD/YYYY') })
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
        let tempProduct = material.find((u) => u._id === d._id);
        if (tempProduct && d.rejectQuantity > tempProduct.qty - (tempProduct.rejectQuantity || 0)) {
          errors.rejectQuantity = 'Please enter valid qty';
        }
        if (d.rejectQuantity <= 0) {
          errors.rejectQuantity = 'Should be greater';
        }
        if (user?.user?.brandPolicy?.storageLocation) {
          if (tempProduct && !d.storageLocation) {
            errors.storageLocation = 'Storage Location is required';
          }
        }
        if (tempProduct?.serializedProduct) {
          if (tempProduct?.qty - (tempProduct?.actualReceived || 0) < parseInt(d?.rejectQuantity || 0) + parseInt(tempProduct.rejectQuantity || 0)) {
            const removeActualReceivedQty =
              parseInt(d?.rejectQuantity || 0) + parseInt(tempProduct.rejectQuantity || 0) - (tempProduct?.qty - (tempProduct?.actualReceived || 0));

            const totalSelected = d?.assetIds?.length + d.serialNumber?.length;

            if (user?.user?.brandPolicy?.productInventorySerialNumberRequired || materialSerialNumbers[tempProduct?._id]?.length) {
              if (totalSelected !== removeActualReceivedQty) {
                errors['assetIds'] = `Selected ${resources?.serializedAsset?.titlePlural} & Serial Numbers must be equal to reject quantity`;
                errors['serialNumber'] = `Selected ${resources?.serializedAsset?.titlePlural} & Serial Numbers must be equal to reject quantity`;
              }
            } else if (tempProduct?.assetQty) {
              if (removeActualReceivedQty !== d?.assetIds?.length) {
                errors['assetIds'] = `Selected ${resources?.serializedAsset?.titlePlural} must be equal to reject quantity`;
              }
            }
          }
        }
      });
    }
    return errors;
  };

  const validateDate = (values) => {
    let errors: any = {};

    if (moment(values['rejectDate']).isBefore(convertDateTimToDate(purchaseOrderData?.purchaseOrderDate))) {
      errors['rejectDate'] = `Date entered prior to the purchase order date`;
    }

    if (lockDate) {
      if (!moment(values['rejectDate']).isSameOrAfter(moment(lockDate))) {
        errors['rejectDate'] = `Date entered prior to the locked date`;
      }
    }
    if (moment(values['rejectDate']).isAfter(moment())) {
      errors['rejectDate'] = `Please select valid date`;
    }
    return errors;
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
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
            material: material.map((d) => ({
              _id: d._id,
              type: d.type,
              materialId: d.materialId,
              detail: d.detail,
              storageLocation: purchaseOrderData?.storageLocation || null,
              rejectQuantity: d.qty - (d?.rejectQuantity || 0),
              comment: '',
              supplierPartNumber: '',
              assetIds: [],
              serialNumber: [],
              row: d
            }))
          }}
          enableReinitialize={true}
          onSubmit={() => {}}
        >
          {({ values, setFieldValue, errors }) => (
            <>
              <CustomDialogContent>
                {values.material && values.material.length ? (
                  <Box p={2}>
                    <Form>
                      <FieldArray
                        name="material"
                        render={(arrayHelpers) => (
                          <div>
                            <div className="grid gap-[15px] sm:gap-[18px]">
                              {values.material.map((data, index) => (
                                <div
                                  style={{ border: '1.5px solid var(--common-border-color)' }}
                                  className="grid gap-[15px] rounded-[6px] px-[23px] pb-[21px] pt-[17px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)] sm:grid-cols-[24px,1fr] md:gap-[29px]"
                                  key={index}
                                >
                                  <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-[var(--new\_theme\_color)]">
                                    <p className="text-[13px] font-[700] leading-none text-white">{index + 1}</p>
                                  </div>
                                  <div>
                                    <div
                                      style={{ borderBottom: '1px solid var(--common-border-color)' }}
                                      className="flex flex-wrap gap-[20px]  border-b border-b-[var(--common-border-color)] pb-[9px] md:gap-[61px]"
                                    >
                                      <span>
                                        <span className="font-semibold text-[var(--primary-text)]">Type: </span>
                                        {startCase(data?.type)}
                                      </span>
                                      <span>
                                        <span className="font-semibold text-[var(--primary-text)]">PO Quantity: </span>
                                        {data?.row?.qty}
                                      </span>
                                      <span>
                                        <span className="font-semibold text-[var(--primary-text)]">Received: </span>
                                        {data?.row?.actualReceived || 0}
                                      </span>
                                      <span>
                                        <span className="font-semibold text-[var(--primary-text)]">Rejected: </span>
                                        {data?.row?.rejectQuantity || 0}
                                      </span>
                                    </div>
                                    <div className="mt-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-3">
                                      <TextField
                                        variant="outlined"
                                        name={`${data?.type}_${data?._id}`}
                                        label={startCase(data?.type)}
                                        value={data?.detail}
                                        size="small"
                                        disabled
                                      />
                                      {user?.user?.brandPolicy?.storageLocation && (
                                        <Autocomplete
                                          id="select-storage-location"
                                          size="small"
                                          value={data?.storageLocation}
                                          options={storageLocationOptions}
                                          getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                          onChange={(_, newValue) => {
                                            arrayHelpers.replace(index, {
                                              ...values.material[index],
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
                                              helperText={validate([data]).storageLocation}
                                              required
                                            />
                                          )}
                                        />
                                      )}
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
                                            ...values.material[index],
                                            ['rejectQuantity']: value
                                          });
                                        }}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        error={validate([data])?.rejectQuantity}
                                        helperText={validate([data]).rejectQuantity}
                                      />
                                      {data.type === MATERIAL_TYPE.product && (
                                        <TextField
                                          fullWidth
                                          label="Supplier Part Number"
                                          variant="outlined"
                                          type="text"
                                          size="small"
                                          name="supplierPartNumber"
                                          placeholder="Supplier Part Number"
                                          value={data.supplierPartNumber}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values.material[index],
                                              ['supplierPartNumber']: e.target.value
                                            });
                                          }}
                                        />
                                      )}
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
                                            ...values.material[index],
                                            ['comment']: e.target.value
                                          });
                                        }}
                                      />
                                    </div>
                                    {data?.row?.serializedProduct && (
                                      <div className="mt-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-1 md:gap-[25px] lg:grid-cols-2">
                                        <Autocomplete
                                          size="small"
                                          multiple
                                          disableCloseOnSelect={true}
                                          value={data?.assetIds}
                                          options={[{ optionLabel: 'All', optionValue: 'All' }, ...(materialserializedAssets[data?._id] || [])]}
                                          getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                          onChange={(_, newValue) => {
                                            var tempValue = newValue;
                                            if (newValue?.find((e) => e.optionValue === 'All')) {
                                              tempValue = materialserializedAssets[data?._id] || [];
                                            }
                                            arrayHelpers.replace(index, {
                                              ...values.material[index],
                                              ['assetIds']: tempValue
                                            });
                                          }}
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              variant="outlined"
                                              name="assetIds"
                                              label={resources?.serializedAsset?.titlePlural}
                                              error={validate([data]).assetIds}
                                              helperText={validate([data]).assetIds}
                                            />
                                          )}
                                        />
                                        {user?.user?.brandPolicy?.purchaseOrderSerializedAddInventory && (
                                          <Autocomplete
                                            size="small"
                                            multiple
                                            disableCloseOnSelect={true}
                                            value={data?.serialNumber}
                                            options={[{ optionLabel: 'All', optionValue: 'All' }, ...(materialSerialNumbers[data?._id] || [])]}
                                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                            onChange={(_, newValue) => {
                                              var tempValue = newValue;
                                              if (newValue?.find((e) => e.optionValue === 'All')) {
                                                tempValue = materialSerialNumbers[data?._id] || [];
                                              }
                                              arrayHelpers.replace(index, {
                                                ...values.material[index],
                                                ['serialNumber']: tempValue
                                              });
                                            }}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                variant="outlined"
                                                name="serialNumber"
                                                label="Serial Numbers"
                                                error={validate([data]).serialNumber}
                                                required={user?.user?.brandPolicy?.productInventorySerialNumberRequired ? true : false}
                                                helperText={validate([data]).serialNumber}
                                              />
                                            )}
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      />
                      <div className="datepicker mt-[14px]">
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
                          error={validateDate(values)?.rejectDate}
                          helperText={validateDate(values)?.rejectDate ? validateDate(values)?.rejectDate : ''}
                        />
                      </div>
                    </Form>
                  </Box>
                ) : (
                  <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(6).keys()]} />
                  </Box>
                )}
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button variant="outlined" disabled={isSubmitting} color="primary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  id={'dialog-save-button'}
                  onClick={() => {
                    if (
                      !validate(values.material).rejectQuantity &&
                      !validate(values.material).storageLocation &&
                      !validate(values.material).assetIds &&
                      !validate(values.material).serialNumber &&
                      !validateDate(values)?.rejectDate
                    ) {
                      handleReject(values.material, values.rejectDate);
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
