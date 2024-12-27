import React, { useContext, useEffect, useState } from 'react';
import { Dialog, Button, Box, TextField, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
  CustomDialogTransition,
  MATERIAL_TYPE,
  convertDateInDateTime,
  convertDateTimToDate,
  productInventory,
  purchaseOrder,
  sidebarResource
} from '../../../constants/helpers';
import { Formik, Form, FieldArray } from 'formik';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { read, utils, writeFile } from 'xlsx';
import moment from 'moment';
import CustomAssetDialog from 'src/pages/ConvertInventory/InventoryToAsset/CustomAssetDialog';
import { isEqual, startCase } from 'lodash';
import CustomDatePicker from 'src/components/CustomDatePicker';

const Receive = ({ purchaseOrderID, onClose, onSuccess, material, purchaseOrderData }) => {
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

  const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, material: [], receiveDate: null });

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
    const data: any = [];
    values?.material?.forEach((element) => {
      if (parseInt(element?.inventoryQuantity) || parseInt(element?.assetQuantity)) {
        data.push({
          _id: element._id,
          type: element.type,
          materialId: element.materialId,
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
      if (data?.find((e) => e?.assetQuantity)) {
        setAssetNumberDialog({ open: true, material: data, receiveDate: values?.receiveDate });
      } else {
        handleReceive(data, values?.receiveDate);
      }
    } else {
      onSuccess();
    }
  };

  const handleReceive = (material, receiveDate) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${purchaseOrder.api}/receive-inventory/${purchaseOrderID}`, { material: material, receiveDate: receiveDate })
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setAssetNumberDialog({ open: false, material: [], receiveDate: null });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
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
        let tempProduct = material.find((u) => u._id === d._id);
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
        if (tempProduct && !d.warehouse) {
          errors.warehouse = 'Plant is required';
        }
        if (user?.user?.brandPolicy?.storageLocation) {
          if (tempProduct && !d.storageLocation) {
            errors.storageLocation = 'Storage Location is required';
          }
        }
        if (tempProduct?.serializedProduct) {
          if (d.serialNumber?.length > parseInt(d.inventoryQuantity)) {
            errors['serialNumber'] = `Please enter serial numbers same as quantity`;
          }
        }
        if (parseInt(d.inventoryQuantity) && tempProduct?.serializedProduct && user?.user?.brandPolicy?.purchaseOrderSerializedAddInventory) {
          if (user?.user?.brandPolicy?.productInventorySerialNumberRequired && parseInt(d.inventoryQuantity) !== d.serialNumber?.length) {
            errors['serialNumber'] = `Please enter serial numbers same as quantity`;
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
      Product: data?.detail || '',
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
          ...values.material[index],
          serialNumber: strSerialNumber
        });
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  return (
    <>
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
          title={'Receiving'}
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        ></CustomDialogHeader>
        <Formik
          initialValues={{
            receiveDate: new Date(),
            material: material.map((d) => ({
              _id: d._id,
              type: d.type,
              materialId: d.materialId,
              detail: d.detail,
              warehouse: defaultWareHouse || '',
              storageLocation: purchaseOrderData?.storageLocation || null,
              inventoryQuantity: !d.serializedProduct ? d.qty - (d.actualReceived || 0) - (d.rejectQuantity || 0) : 0,
              assetQuantity: d.serializedProduct ? d.qty - (d.actualReceived || 0) - (d.rejectQuantity || 0) : 0,
              serializedProduct: d.serializedProduct || false,
              serialNumber: [],
              comment: '',
              supplierPartNumber: '',
              row: d
            }))
          }}
          enableReinitialize={true}
          onSubmit={() => { }}
        >
          {({ values, setFieldValue, errors }) => (
            <>
              <CustomDialogContent>
                {values.material && values.material.length && warehouseOptions ? (
                  <Box p={2}>
                    <Form>
                      <FieldArray
                        name="material"
                        render={(arrayHelpers) => (
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
                                    <Autocomplete
                                      size="small"
                                      value={data.warehouse}
                                      options={warehouseOptions}
                                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                      disabled
                                      onChange={(_, newValue) => {
                                        arrayHelpers.replace(index, {
                                          ...values.material[index],
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
                                            helperText={validate([data]).storageLocation ? 'Storage Location is required' : ''}
                                            required
                                          />
                                        )}
                                      />
                                    )}
                                    {data?.serializedProduct && !user?.user?.brandPolicy?.purchaseOrderSerializedAddInventory ? null : (
                                      <TextField
                                        fullWidth
                                        label="Quantity"
                                        variant="outlined"
                                        type="number"
                                        size="small"
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        name="inventoryQuantity"
                                        placeholder="Quantity"
                                        value={data.inventoryQuantity}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9]/g, '');
                                          arrayHelpers.replace(index, {
                                            ...values.material[index],
                                            ['inventoryQuantity']: value
                                          });
                                        }}
                                        error={validate([data])?.inventoryQuantity}
                                        helperText={validate([data]).inventoryQuantity ? 'Receiving quantity is more than actual quantity' : ''}
                                      />
                                    )}
                                    {data?.serializedProduct && (
                                      <TextField
                                        fullWidth
                                        label="Asset Quantity"
                                        variant="outlined"
                                        type="number"
                                        size="small"
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        name="assetQuantity"
                                        placeholder="Asset Quantity"
                                        value={data.assetQuantity}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9]/g, '');
                                          arrayHelpers.replace(index, {
                                            ...values.material[index],
                                            ['assetQuantity']: value
                                          });
                                        }}
                                        error={validate([data])?.assetQuantity}
                                        helperText={validate([data]).assetQuantity ? 'Receiving quantity is more than actual quantity' : ''}
                                      />
                                    )}
                                    {data?.type === MATERIAL_TYPE.product && (
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
                                    {data?.serializedProduct && user?.user?.brandPolicy?.purchaseOrderSerializedAddInventory && (
                                      <div className="flex items-center gap-2">
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
                                              ...values.material[index],
                                              ['serialNumber']: val
                                            });
                                          }}
                                          isOptionEqualToValue={(item, current) => item === current}
                                          getOptionLabel={(option) => option}
                                          renderInput={(props) => (
                                            <TextField
                                              {...props}
                                              placeholder={`Serial Numbers`}
                                              variant="outlined"
                                              name="serialNumber"
                                              label={'Serial Numbers'}
                                              error={validate([data])?.serialNumber}
                                              helperText={validate([data]).serialNumber}
                                              required={user?.user?.brandPolicy?.productInventorySerialNumberRequired ? true : false}
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
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      <div className="datepicker mt-[14px]">
                        <CustomDatePicker
                          label="Received Date"
                          required
                          autoOk
                          size="small"
                          margin="dense"
                          name="receiveDate"
                          placeholder="Receive Date"
                          value={values.receiveDate}
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
                  id={'dialog-save-button'}
                  onClick={() => {
                    if (
                      !validate(values.material).inventoryQuantity &&
                      !validate(values.material).warehouse &&
                      !validate(values.material).storageLocation &&
                      !validate(values.material).assetQuantity &&
                      !validate(values.material).serialNumber &&
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
      </Dialog>
      {assetNumberDialog.open && (
        <CustomAssetDialog
          handleClose={() => setAssetNumberDialog({ open: false, material: [], receiveDate: null })}
          products={assetNumberDialog.material
            ?.filter((e) => e.serializedProduct && e.type === MATERIAL_TYPE.product)
            ?.map((e) => {
              return { id: e._id, productName: material.find((u) => u._id === e._id)?.detail, qty: e.assetQuantity };
            })}
          handleSuccess={(rows) => {
            const material = assetNumberDialog.material;
            material?.forEach((e) => {
              e.assetNumbers = rows?.find((ele) => isEqual(ele.id, e._id))?.assetNumbers || [];
            });
            handleReceive(material, assetNumberDialog.receiveDate);
          }}
          loading={isSubmitting}
          resource={sidebarResource.purchaseOrder}
        />
      )}
    </>
  );
};

export default Receive;
