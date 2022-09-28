import { Fragment, useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form, Field } from 'formik';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import { read, utils, writeFile } from 'xlsx';
import CustomButton from 'src/components/Helpers/CustomButton';
import { capitalize } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { dateFormat, productInventory } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

const AddRemove = ({ handleClose, handleSuccess, product, type, warehouse }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (product.length === 1 && type === 'remove') {
      fetchData();
    }
  }, [type, product]);

  const fetchData = () => {
    setLoadingData(true);
    axiosInstance()
      .get(`${productInventory.api}/serial-number/${product[0]._id}?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (!data || data.lenght === 0) return;
        setSerialNumbers(data);
        setLoadingData(false);
      })
      .catch((err) => {
        setLoadingData(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (values) => {
    let data: any;
    setLoading(true);
    if (type === 'add') {
      data = {
        products: product.lenght > 1
          ? product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), price: parseFloat(values.price), serialNumber: [] }))
          : product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), price: parseFloat(values.price), serialNumber: values['serialNumbers'] })),
        warehouse: warehouse,
        receiveDate: values.receiveDate,
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
          product.lenght > 1
            ? product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), serialNumberIds: [] }))
            : product?.map((e) => ({ product: e._id, qty: parseInt(values.qty), serialNumberIds: serialNumberIds.map((item) => item?._id) })),
        warehouse: warehouse,
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
      var validateQty = product[0]?.availableInventory;
      if (product?.length > 1) {
        validateQty = product?.reduce(function (min, obj) {
          return obj.availableInventory < min ? obj.availableInventory : min;
        }, Infinity);
      }
      if (parseInt(values.qty) > validateQty) {
        errors['qty'] = 'qty not more than inventory';
      }
    }

    if (type === 'add') {
      if (parseFloat(values.price) <= 0) {
        errors['price'] = 'Please enter valid price';
      }
    }

    // find duplicates serial numbers
    const serialNumbersList = values['serialNumbers'];
    const duplicates = serialNumbersList.filter((item, index) => serialNumbersList.indexOf(item) != index);

    if (serialNumbersList.length > Number(values['qty'])) {
      errors['serialNumbers'] = `Please ${type === 'add' ? 'enter' : 'select'} serial numbers same as quantity`;
    } else if (duplicates.length > 0) {
      errors['serialNumbers'] = `Serial numbers cannot be duplicate`;
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
      {loadingData ? (
        <Box p={5} display="flex" justifyContent="center" alignItems="center">
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <Formik initialValues={{ qty: 1, price: 0, comment: '', serialNumbers: [], receiveDate: new Date() }} onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <MuiPickersUtilsProvider utils={MomentUtils}>
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
                        <ListItemText primary={product[0]?.productName} secondary={`Inventory : ${product[0]?.availableInventory}`} />
                      ) : (
                        <ListItemText primary={`${product?.length} Products`} />
                      )}
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
                  {type === 'add' ?
                    <Box m={1}>
                      <Field
                        component={TextFieldFormik}
                        margin="dense"
                        type="number"
                        label="Price"
                        name="price"
                        fullWidth
                        variant="outlined"
                        value={values['price']}
                        error={touched['price'] && Boolean(errors['price'])}
                        helperText={touched['price'] && errors['price']}
                        onChange={(e) => {
                          setFieldValue('price', e.target.value);
                        }}
                      />
                      <Field
                        fullWidth
                        label='Received Date'
                        variant="inline"
                        inputVariant="outlined"
                        autoOk
                        size="small"
                        margin="dense"
                        component={KeyboardDatePicker}
                        name="receiveDate"
                        placeholder="Receive Date"
                        value={values.receiveDate}
                        format={dateFormat}
                        maxDate={new Date()}
                        onChange={(value) => {
                          setFieldValue('receiveDate', value);
                        }}
                      />
                    </Box> : null}
                  <Box m={1}>
                    <Field
                      component={TextFieldFormik}
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
                  <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit" onClick={submitForm}>
                    {capitalize(type)}
                  </CustomButton>
                </CustomDialogFooter>
              </MuiPickersUtilsProvider>
            </Form>
          )}
        </Formik>
      )
      }
    </Dialog >
  );
};

export default AddRemove;
