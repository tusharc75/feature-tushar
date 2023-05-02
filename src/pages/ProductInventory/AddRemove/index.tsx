import { Fragment, useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@material-ui/core';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form } from 'formik';
import { read, utils, writeFile } from 'xlsx';
import CustomButton from 'src/components/Helpers/CustomButton';
import { capitalize } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { convertDateInDateTime, dateFormatForInputControl, productInventory, sidebarResource } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const AddRemove = ({ handleClose, handleSuccess, product, type, warehouse, storageLocation = null }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [availableQtyOnRemoveDate, setAvailableQtyOnRemoveDate] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [lockDate, setLockDate] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  const [initialData, setInitialData] = useState({
    qty: 1,
    price: 0,
    storageLocation: storageLocation,
    comment: '',
    serialNumbers: [],
    customDate: new Date()
  })

  const [loadingInitialData, setLoadingInitialData] = useState(false)
  const [currentInventory, setCurrentInventory] = useState(null)
  const [selectedStorageLocation, setSelectedStorageLocation] = useState(null)

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    if (product.length === 1 && type === 'remove') {
      fetchData();
    }
    fetchSettingsData();
  }, [type, product]);

  const fetchSettingsData = () => {
    axiosInstance().get(`${productInventory.api}/setting?warehouse=${warehouse}`)
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
    setLoadingData(true);
    axiosInstance()
      .get(`${productInventory.api}/serial-number/${product[0]._id}?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setSerialNumbers(data);
        }
        setLoadingData(false);
      })
      .catch((err) => {
        setLoadingData(false);
        toastConfig.setToastConfig(err);
      });
  };

  const getStorageLocation = () => {
    setLoadingInitialData(true)
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          const storageLocationOption = data[sidebarResource.storageLocation]?.filter(e => e.warehouse === warehouse);
          setStorageLocationOptions(storageLocationOption);
          if (!storageLocation) {
            setInitialData((preVal) => { return ({ ...preVal, storageLocation: storageLocationOption[0]?.optionValue }) })
            setSelectedStorageLocation(storageLocationOption[0]?.optionValue)
          } else {
            setSelectedStorageLocation(storageLocation)
          }
        }
        setLoadingInitialData(false)
      });
  };

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, [warehouse])

  const handleSubmit = (values) => {
    let data: any;
    setLoading(true);
    if (type === 'add') {
      data = {
        products:
          product.length > 1
            ? product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), price: parseFloat(values.price), serialNumber: [] }))
            : product?.map((e) => ({
              product: e._id,
              qty: parseInt(values.qty),
              price: parseFloat(values.price),
              serialNumber: values['serialNumbers']
            })),
        warehouse: warehouse,
        storageLocation: values.storageLocation,
        receiveDate: values.customDate,
        comment: values.comment
      };
      axiosInstance()
        .post(`${productInventory.api}/add-inventory`, data)
        .then(({ data: { data } }) => {
          setLoading(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `${capitalize(type)} Inventory Successfully`
          });
          handleSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      const serialNumberIds = serialNumbers.filter((item: any) => values['serialNumbers'].indexOf(item?.serialNumber) > -1);
      data = {
        products:
          product.length > 1
            ? product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), serialNumberIds: [] }))
            : product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), serialNumberIds: serialNumberIds.map((item) => item?._id) })),
        warehouse: warehouse,
        storageLocation: values.storageLocation,
        customDate: moment(values.customDate).format('MM/DD/YYYY'),
        comment: values.comment
      };
      axiosInstance()
        .post(`${productInventory.api}/remove-inventory`, data)
        .then(({ data: { data } }) => {
          setLoading(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `${capitalize(type)} Inventory Successfully`
          });
          handleSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  function validate(values) {
    const errors = {};
    if (values.qty <= 0) {
      errors['qty'] = 'Please enter valid qty';
    }

    if (type === 'remove') {
      if (product?.length === 1) {
        var validateQty = currentInventory;
        let maxQty = availableQtyOnRemoveDate !== null ? Math.min(validateQty, availableQtyOnRemoveDate) : validateQty;
        if (parseInt(values.qty) > maxQty) {
          errors['qty'] = 'Insufficient Quantity !';
        }
      }
    }

    if (type === 'add') {
      if (parseFloat(values.price) <= 0) {
        errors['price'] = 'Please enter valid price';
      }
    }

    if (user?.user?.brandPolicy?.storageLocation && !values['storageLocation']) {
      errors['storageLocation'] = 'Please select Storage Location';
    }
    // find duplicates serial numbers
    const serialNumbersList = values['serialNumbers'];
    const duplicates = serialNumbersList.filter((item, index) => serialNumbersList.indexOf(item) != index);

    if (serialNumbersList.length > Number(values['qty'])) {
      errors['serialNumbers'] = `Please ${type === 'add' ? 'enter' : 'select'} serial numbers same as quantity`;
    } else if (duplicates.length > 0) {
      errors['serialNumbers'] = `Serial numbers cannot be duplicate`;
    }

    if (lockDate) {
      if (!moment(values["customDate"]).isSameOrAfter(moment(lockDate))) {
        errors['customDate'] = `Date entered prior to the locked date`;
      }
    }

    if (moment(values["customDate"]).isAfter(moment())) {
      errors['customDate'] = `Please select valid date`;
    }

    return errors;
  }

  const handleExport = (values) => {
    const { qty } = values;
    const productName = product[0].productName;
    let json_data = [...new Array(Number(qty)).keys()].map((_, i) => ({
      Name: productName,
      'Serial Number': ''
    }));
    const header = ['Name', 'Serial Number'];
    const ws = utils.json_to_sheet(json_data);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, 'Serial Numbers.xlsx');
  };

  const handleImport = (setFieldValue: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
        let serialNumbers = [];
        tableContent.forEach((item) => {
          serialNumbers.push(item[1]?.toString());
        });
        setFieldValue('serialNumbers', serialNumbers);
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  const getCurrentInventory = () => {
    let api = `${productInventory.api}/current-inventory?warehouse=${warehouse}&product=${product[0]._id}`;
    if (selectedStorageLocation) {
      api = `${api}&storageLocation=${selectedStorageLocation}`
    }
    if (product?.length === 1) {
      axiosInstance()
        .get(api)
        .then(({ data: { data } }) => {
          setCurrentInventory(data);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  }

  useEffect(() => {
    getCurrentInventory()
  }, [selectedStorageLocation])

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
      {!loadingData && !loadingInitialData ?
        initialData &&
        <Formik
          initialValues={initialData}
          onSubmit={handleSubmit}
          validateOnMount
          validate={validate}
        >
          {({ touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <MuiPickersUtilsProvider utils={DateUtils}>
                <CustomDialogHeader
                  title={`${capitalize(type)} Inventory`}
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
                    <ListItem key={product[0]?._id}>
                      {product?.length === 1 ? (
                        <ListItemText primary={product[0]?.productName} secondary={`Inventory : ${currentInventory}`} />
                      ) : (
                        <ListItemText primary={`${product?.length} Products`} />
                      )}
                      <TextField
                        margin="dense"
                        type="number"
                        label="Qty"
                        name="qty"
                        required
                        variant="outlined"
                        value={values['qty']}
                        error={touched['qty'] && Boolean(errors['qty'])}
                        helperText={touched['qty'] && errors['qty']}
                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                        onChange={(e) => {
                          setFieldValue('qty', e.target.value?.replace(/\D/g, ""));
                        }}
                      />
                    </ListItem>
                  </List>
                  {type === 'add' ? (
                    <Box m={1}>
                      <TextField
                        margin="dense"
                        type="number"
                        label="Price"
                        name="price"
                        required
                        fullWidth
                        variant="outlined"
                        value={values['price']}
                        error={touched['price'] && Boolean(errors['price'])}
                        helperText={touched['price'] && errors['price']}
                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                        onChange={(e) => {
                          setFieldValue('price', e.target.value);
                        }}
                      />
                    </Box>
                  ) : null}
                  {user?.user?.brandPolicy?.storageLocation &&
                    <Box m={1}>
                      <Autocomplete
                        disableClearable
                        options={storageLocationOptions}
                        getOptionLabel={(option: any) => option ? option.optionLabel : ''}
                        getOptionSelected={(option: any, val) => option.optionValue === val}
                        value={storageLocationOptions.filter((data) => data.optionValue === values['storageLocation']).length ? storageLocationOptions.filter((data) => data.optionValue === values['storageLocation'])[0] : ''}
                        onChange={(e, val) => {
                          setFieldValue('storageLocation', val?.optionValue);
                          setSelectedStorageLocation(val?.optionValue)
                        }}
                        renderInput={(params) =>
                          <TextField
                            {...params}
                            margin="dense"
                            name="storageLocation"
                            label="Storage Location"
                            variant="outlined"
                            fullWidth
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
                      {...(lockDate ? { minDate: lockDate } : {})}
                      fullWidth
                      size="small"
                      margin="dense"
                      autoOk
                      required
                      variant="inline"
                      inputVariant="outlined"
                      value={values.customDate}
                      name="customDate"
                      placeholder={type === 'add' ? 'Receive Date' : 'Remove Date'}
                      label="Custom Date"
                      format={dateFormatForInputControl}
                      maxDate={new Date()}
                      error={touched['customDate'] && Boolean(errors['customDate'])}
                      helperText={touched['customDate'] && errors['customDate']}
                      onChange={(value) => {
                        var newDate = convertDateInDateTime(value);
                        setFieldValue('customDate', newDate);
                        if (type === 'remove' && product.length === 1) {
                          var date = moment(newDate);
                          if (date.isValid()) {
                            var api = `${productInventory.api}/inventory-at-date?date=${newDate}&warehouse=${warehouse}&product=${product[0]._id}`;
                            if (values['storageLocation']) {
                              api = api + `&storageLocation=${values['storageLocation']}`
                            }
                            axiosInstance().get(api)
                              .then(({ data: { data } }) => {
                                setAvailableQtyOnRemoveDate(data);
                              })
                              .catch((err) => {
                                toastConfig.setToastConfig(err);
                              });
                          }
                        }
                      }}
                    />
                    {availableQtyOnRemoveDate || availableQtyOnRemoveDate === 0 ? (
                      <Typography variant="caption">{`Inventory on custom date : ${availableQtyOnRemoveDate}`}</Typography>
                    ) : null}
                  </Box>
                  <Box m={1}>
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
                  </Box>
                  {product?.length === 1 && product[0]?.serializedProduct && (
                    <Fragment>
                      <Box my={2} mx={1}>
                        <Divider />
                      </Box>
                      <Box m={1}>
                        {type === 'add' && (
                          <Box mb={1} display="flex" justifyContent="flex-end">
                            <Box mr={2}>
                              <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }} onClick={() => handleExport(values)}>
                                Export
                              </Typography>
                            </Box>
                            <Box mr={1}>
                              <input
                                accept="json"
                                style={{ display: 'none' }}
                                onChange={handleImport(setFieldValue)}
                                id="import-file"
                                multiple={false}
                                type="file"
                              />
                              <label htmlFor="import-file">
                                <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }}>
                                  Import
                                </Typography>
                              </label>
                            </Box>
                          </Box>
                        )}
                        <Autocomplete
                          size="small"
                          options={type === 'add' ? [] : serialNumbers.map((item: any) => item?.serialNumber)}
                          freeSolo={type === 'add'}
                          multiple={true}
                          disableCloseOnSelect
                          value={values['serialNumbers']}
                          onChange={(_, val) => {
                            if (type === 'remove') {
                              setFieldValue('serialNumbers', val);
                            } else {
                              setFieldValue(
                                'serialNumbers',
                                val.map((item: string) => item.toUpperCase())
                              );
                            }
                          }}
                          getOptionSelected={(item, current) => item === current}
                          getOptionLabel={(option) => option}
                          renderInput={(props) => (
                            <TextField
                              {...props}
                              placeholder={type === 'add' ? 'Enter serial number and press enter' : ''}
                              variant="outlined"
                              name="serialNumbers"
                              label={type === 'add' ? 'Serial Numbers' : 'Select Serial Numbers'}
                              error={touched['serialNumbers'] && Boolean(errors['serialNumbers'])}
                              helperText={touched['serialNumbers'] && errors['serialNumbers']}
                            />
                          )}
                        />
                      </Box>
                    </Fragment>
                  )}
                </CustomDialogContent>
                <CustomDialogFooter>
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
                  >
                    {capitalize(type)}
                  </CustomButton>
                </CustomDialogFooter>
              </MuiPickersUtilsProvider>
            </Form>
          )}
        </Formik>
        : <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}
    </Dialog >
  );
};

export default AddRemove;
