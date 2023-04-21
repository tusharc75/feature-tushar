import { Fragment, useState, useEffect, useContext } from 'react';
import { Box, Button, Dialog, Divider, List, ListItem, ListItemAvatar, ListItemText, TextField } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form } from 'formik';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { convertInventory, productInventory, sidebarResource } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const InventoryToAsset = ({ handleClose, handleSuccess, product, warehouse, storageLocation = null }) => {


  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const [selectedStorageLocation, setSelectedStorageLocation] = useState(null)
  const [currentInventory, setCurrentInventory] = useState(null)
  const [loadingInitialData, setLoadingInitialData] = useState(false)
  const [initialData, setInitialData] = useState({
    qty: 1,
    comment: '',
    storageLocation: storageLocation
  })

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    if (product.length === 1) {
      fetchData();
    }
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${productInventory.api}/serial-number/${product[0]._id}?warehouse=${warehouse}`)
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

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, [warehouse])

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

  const handleSubmit = (values) => {
    const serialNumberIds = serialNumbers.filter((item: any) => values['serialNumbers'].indexOf(item?.serialNumber) > -1);
    const data = {
      products: product?.map((e) => {
        return { id: e.id, productCategory: e.productCategoryId, serialNumberIds: product > 1 ? [] : serialNumberIds.map((item) => item?._id) };
      }),
      qty: parseInt(values.qty),
      warehouse: warehouse,
      storageLocation: values?.storageLocation ? values?.storageLocation : null
    };
    setLoading(true);
    axiosInstance()
      .post(`${convertInventory.api}/convert-inventory-to-asset`, data)
      .then(({ data: { data } }) => {
        setLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Convert Inventory to Asset Successfully`
        });
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

    if (product?.length === 1) {
      var validateQty = currentInventory;
      if (parseInt(values?.qty) > validateQty) {
        errors['qty'] = 'Insufficient Quantity !';
      }
    }

    if (user?.user?.brandPolicy?.storageLocation && !values['storageLocation']) {
      errors['storageLocation'] = 'Please select Storage Location';
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
      {!loadingInitialData ?
        <Formik initialValues={initialData} onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <CustomDialogHeader
                title={`Convert Inventory`}
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
                {product?.length === 1 ? (
                  <Fragment>
                    <Box my={2} mx={1}>
                      <Divider />
                    </Box>
                    <Box m={1}>
                      <Autocomplete
                        size="small"
                        options={serialNumbers.map((item: any) => item?.serialNumber)}
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
                <Button
                  color="primary"
                  size="small"
                  onClick={handleClose}>
                  Cancel
                </Button>
                <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit" onClick={submitForm}>
                  Convert
                </CustomButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik> :
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}
    </Dialog>
  );
};

export default InventoryToAsset;
