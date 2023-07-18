import React, { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, Chip, ButtonGroup, Container, InputAdornment, Paper, Typography, TableBody } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
  convertDateInDateTime,
  convertDateTimToDate,
  dateFormatForInputControl,
  productInventory,
  purchaseOrder,
  sidebarResource
} from '../../../constants/helpers';
import { Formik, Form, FieldArray } from 'formik';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { read, utils, writeFile } from 'xlsx';
import DateUtils from '@date-io/date-fns';
import moment from 'moment';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';

const Receive = ({ purchaseOrderID, onClose, onSuccess, productList, purchaseOrderData }) => {
  const [fullScreen, setFullScreen] = useState(true);

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [warehouseOptions, setwareHouseOptions] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  const [defaultWareHouse, setDefaultWareHouse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockDate, setLockDate] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setwareHouseOptions(data['Warehouse']);
        setDefaultWareHouse(data['Warehouse']?.find((d) => d?.optionValue === purchaseOrderData?.warehouse?.optionValue));
      });
    fetchSettingsData();
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

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    const data: any = [];
    values?.seriaizedAsset?.forEach((element) => {
      if (parseInt(element?.inventoryQuantity)) {
        data.push({
          _id: element._id,
          product: element.productId,
          serializedProduct: element.serializedProduct,
          warehouse: element?.warehouse?.optionValue,
          storageLocation: user?.user?.brandPolicy?.storageLocation ? element?.storageLocation?.optionValue : null,
          inventoryQuantity: parseInt(element?.inventoryQuantity),
          assetQuantity: parseInt(element?.assetQuantity),
          serialNumber: element?.serialNumber,
          supplierPartNumber: element?.supplierPartNumber,
          comment: element?.comment
        });
      }
    });
    if (data?.length) {
      axiosInstance()
        .post(`${purchaseOrder.api}/receive-inventory/${purchaseOrderID}`, { products: data, receiveDate: values?.receiveDate })
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
      setIsSubmitting(false);
      onSuccess();
    }
  };

  const getStorageLocation = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          const storageLocationOption = data[sidebarResource.storageLocation]?.filter((e) => e?.warehouse === defaultWareHouse?.optionValue);
          setStorageLocationOptions(storageLocationOption);
        }
      });
  };

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation && defaultWareHouse) {
      getStorageLocation();
    }
  }, [defaultWareHouse]);

  const validate = (values) => {
    let errors: any = {};
    if (values.length > 0) {
      values.map((d) => {
        let tempProduct = productList.find((u) => u._id === d._id);
        let qty = tempProduct.qty - (tempProduct.actualReceived || 0);
        if (tempProduct && d.inventoryQuantity > qty) {
          errors.inventoryQuantity = 'should be greater';
        }
        if (tempProduct && d.assetQuantity > qty) {
          errors.assetQuantity = 'should be greater';
        }
        if (tempProduct && parseInt(d.inventoryQuantity) + parseInt(d.assetQuantity) > qty) {
          errors.inventoryQuantity = 'should be greater';
          errors.assetQuantity = 'should be greater';
        }
        if (tempProduct && parseInt(d.inventoryQuantity) < d.serialNumber?.length) {
          errors.serialNumber = 'should be greater';
        }
        if (tempProduct && !d.warehouse) {
          errors.warehouse = 'Plant is required';
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

    if (moment(values['receiveDate']).isBefore(convertDateTimToDate(purchaseOrderData?.purchaseOrderDate))) {
      errors['receiveDate'] = `Date entered prior to the purchase order date`;
    }

    if (lockDate) {
      if (!moment(values['receiveDate']).isSameOrAfter(moment(lockDate))) {
        errors['receiveDate'] = `Date entered prior to the locked date`;
      }
    }

    if (moment(values['receiveDate']).isAfter(moment())) {
      errors['receiveDate'] = `Please select valid date`;
    }
    return errors;
  };

  const handleExportField = (data: any) => {
    const qty = parseInt(data?.inventoryQuantity) || 0;
    let json_data = [...Array(qty).keys()].map((item) => ({
      Product: data?.product || '',
      'Serial Number': ''
    }));
    const header = ['Product', 'Serial Number'];
    const ws = utils.json_to_sheet(json_data);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, 'PO Serial Number.xlsx');
  };

  const handleImport = (arrayHelpers: any, index: number, values: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files,
      f = files[0];
    let reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const parsedData = utils.sheet_to_json(ws, { header: 1 });
      if (parsedData.length > 1) {
        let tableContent = parsedData.slice(1, parsedData.length);
        const serialNumber = tableContent.map((item: any[]) => item[1]);
        var strSerialNumber = serialNumber?.map(String);
        arrayHelpers.replace(index, {
          ...values.seriaizedAsset[index],
          serialNumber: strSerialNumber
        });
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

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
        title={'Receiving'}
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
            receiveDate: new Date(),
            seriaizedAsset: productList.map((d) => ({
              _id: d._id,
              product: d.productName,
              productId: d.productId,
              warehouse: defaultWareHouse || '',
              storageLocation: purchaseOrderData?.storageLocation || null,
              inventoryQuantity: d.qty - (d.actualReceived || 0) - (d.rejectQuantity || 0),
              assetQuantity: 0,
              serializedProduct: d.serializedProduct || false,
              serialNumber: [],
              comment: '',
              supplierPartNumber: '',
              row: d
            }))
          }}
          enableReinitialize={true}
          onSubmit={() => {}}
        >
          {({ values, setFieldValue, errors }) => (
            <>
              <CustomDialogContent>
                {values.seriaizedAsset && values.seriaizedAsset.length && warehouseOptions ? (
                  <Box p={2}>
                    <Form>
                      <div className="datepicker mb-[14px]">
                        <KeyboardDatePicker
                          label="Received Date"
                          variant="inline"
                          inputVariant="outlined"
                          required
                          autoOk
                          size="small"
                          margin="dense"
                          name="receiveDate"
                          placeholder="Receive Date"
                          value={values.receiveDate}
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
                            setFieldValue('receiveDate', convertDateInDateTime(value));
                          }}
                          error={validateDate(values)?.receiveDate}
                          helperText={validateDate(values)?.receiveDate ? validateDate(values)?.receiveDate : ''}
                        />
                      </div>

                      <FieldArray
                        name="seriaizedAsset"
                        render={(arrayHelpers) => (
                          <div className="grid gap-[15px] sm:gap-[18px]">
                            {values.seriaizedAsset.map((data, index) => (
                              <div
                                style={{ border: '1.5px solid var(--common-border-color)' }}
                                className="rounded-[6px] pt-[17px] px-[23px] pb-[21px] grid sm:grid-cols-[24px,1fr] md:gap-[29px] gap-[15px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)]"
                                key={index}
                              >
                                <div className="bg-[var(--new\_theme\_color)] w-[24px] h-[24px] rounded-[6px] flex items-center justify-center">
                                  <p className="text-white text-[13px] font-[700] leading-none">{index + 1}</p>
                                </div>
                                <div>
                                  <div
                                    style={{ borderBottom: '1px solid var(--common-border-color)' }}
                                    className="flex border-b  border-b-[var(--common-border-color)] gap-[20px] md:gap-[61px] pb-[9px]"
                                  >
                                    <span>
                                      <span className="text-[var(--primary-text)] font-semibold">PO Quantity: </span>
                                      {data?.row?.qty}
                                    </span>
                                    <span>
                                      <span className="text-[var(--primary-text)] font-semibold">Recieved: </span>
                                      {data?.row?.actualReceived || 0}
                                    </span>
                                    <span>
                                      <span className="text-[var(--primary-text)] font-semibold">Rejected: </span>
                                      {data?.row?.rejectQuantity || 0}
                                    </span>
                                  </div>

                                  {/* FIELDS */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] md:gap-[25px] mt-[28px]">
                                    <Autocomplete
                                      size="small"
                                      value={data.product}
                                      options={productList}
                                      disabled
                                      getOptionLabel={(option: any) => (option ? option : '')}
                                      onChange={(_, newValue) => {
                                        arrayHelpers.replace(index, {
                                          ...values.seriaizedAsset[index],
                                          ['product']: newValue
                                        });
                                      }}
                                      renderInput={(params) => <TextField {...params} variant="outlined" name="product" label="Product" />}
                                    />
                                    <Autocomplete
                                      size="small"
                                      value={data.warehouse}
                                      options={warehouseOptions}
                                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                      disabled
                                      onChange={(_, newValue) => {
                                        arrayHelpers.replace(index, {
                                          ...values.seriaizedAsset[index],
                                          ['warehouse']: newValue
                                        });
                                      }}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          variant="outlined"
                                          name="warehouse"
                                          label="Plant"
                                          error={validate([data]).warehouse}
                                          helperText={validate([data]).warehouse ? 'Plant is required' : ''}
                                          required
                                        />
                                      )}
                                    />
                                    {user?.user?.brandPolicy?.storageLocation && (
                                      <Autocomplete
                                        size="small"
                                        value={data?.storageLocation}
                                        options={storageLocationOptions}
                                        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                        onChange={(_, newValue) => {
                                          arrayHelpers.replace(index, {
                                            ...values.seriaizedAsset[index],
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
                                    )}
                                    <TextField
                                      fullWidth
                                      label="Inventory Quantity"
                                      variant="outlined"
                                      type="number"
                                      size="small"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      name="inventoryQuantity"
                                      placeholder="Inventory Quantity"
                                      value={data.inventoryQuantity}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        arrayHelpers.replace(index, {
                                          ...values.seriaizedAsset[index],
                                          ['inventoryQuantity']: value
                                        });
                                      }}
                                      error={validate([data])?.inventoryQuantity}
                                      helperText={validate([data]).inventoryQuantity ? 'Receiving quantity is more than actual quantity' : ''}
                                    />
                                    {data?.serializedProduct && (
                                      <div className="flex gap-2 items-center">
                                        <Autocomplete
                                          options={[]}
                                          size="small"
                                          fullWidth={true}
                                          freeSolo={true}
                                          multiple={true}
                                          disableCloseOnSelect
                                          value={data.serialNumber}
                                          onChange={(_, val) => {
                                            arrayHelpers.replace(index, {
                                              ...values.seriaizedAsset[index],
                                              ['serialNumber']: val
                                            });
                                          }}
                                          getOptionSelected={(item, current) => item === current}
                                          getOptionLabel={(option) => option}
                                          renderInput={(props) => (
                                            <TextField
                                              {...props}
                                              placeholder={`Serial Number`}
                                              variant="outlined"
                                              name="serialNumber"
                                              label={'Serial Number'}
                                              error={validate([data])?.serialNumber}
                                              helperText={
                                                validate([data]).serialNumber ? 'Serial numbers should be less then inventory quantity' : ''
                                              }
                                            />
                                          )}
                                        />
                                        <Typography
                                          className="link cursor-pointer"
                                          style={{ color: 'var(--primary)' }}
                                          onClick={() => handleExportField(data)}
                                        >
                                          Export
                                        </Typography>
                                        <input
                                          accept="json"
                                          style={{ display: 'none' }}
                                          onChange={handleImport(arrayHelpers, index, values)}
                                          id={`import-file-${index}`}
                                          multiple={false}
                                          type="file"
                                        />
                                        <label htmlFor={`import-file-${index}`}>
                                          <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }}>
                                            Import
                                          </Typography>
                                        </label>
                                      </div>
                                    )}
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
                                          ...values.seriaizedAsset[index],
                                          ['supplierPartNumber']: e.target.value
                                        });
                                      }}
                                    />
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
                                          ...values.seriaizedAsset[index],
                                          ['comment']: e.target.value
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </Form>
                  </Box>
                ) : (
                  <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(6).keys()]} />
                  </Box>
                )}
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button variant="outlined" disabled={isSubmitting} size="small" color="primary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (
                      !validate(values.seriaizedAsset).inventoryQuantity &&
                      !validate(values.seriaizedAsset).warehouse &&
                      !validate(values.seriaizedAsset).storageLocation &&
                      !validate(values.seriaizedAsset).assetQuantity &&
                      !validate(values.seriaizedAsset).serialNumber &&
                      !validateDate(values)?.receiveDate
                    ) {
                      handleSubmit(values);
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

export default Receive;
