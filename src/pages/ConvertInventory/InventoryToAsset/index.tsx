import { Fragment, useState, useEffect, useContext } from 'react';
import { Box, Dialog, Divider, List, ListItem, ListItemText, TextField } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form } from 'formik';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { convertInventory, CustomDialogTransition, productInventory, sidebarResource } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import Autocomplete from '@mui/material/Autocomplete';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomAssetDialog from './CustomAssetDialog';

const InventoryToAsset = ({ handleClose, handleSuccess, product, warehouse, storageLocation = null }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const { setToastConfig } = useContext(CustomToastContext);

  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const [selectedStorageLocation, setSelectedStorageLocation] = useState(null);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, products: [], qty: 0, warehouse: null, storageLocation: null });

  const [initialData, setInitialData] = useState({
    qty: 1,
    comment: '',
    storageLocation: storageLocation,
    serialNumbers: []
  });

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
      .get(`${productInventory.api}/serial-number?products=${product[0]._id}&warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setSerialNumbers(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setToastConfig(err);
      });
  };

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, [warehouse]);

  const getStorageLocation = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          const storageLocationOption = data[sidebarResource.storageLocation]?.filter((e) => e.warehouse === warehouse);
          setStorageLocationOptions(storageLocationOption);
          if (!storageLocation) {
            setInitialData((preVal) => {
              return { ...preVal, storageLocation: storageLocationOption[0]?.optionValue };
            });
            setSelectedStorageLocation(storageLocationOption[0]?.optionValue);
          } else {
            setSelectedStorageLocation(storageLocation);
          }
        }
      });
  };

  const getCurrentInventory = () => {
    setLoadingInitialData(true);
    let api = `${productInventory.api}/current-inventory?warehouse=${warehouse}&product=${product[0]._id}`;
    if (selectedStorageLocation) {
      api = `${api}&storageLocation=${selectedStorageLocation}`;
    }
    if (product?.length === 1) {
      axiosInstance()
        .get(api)
        .then(({ data: { data } }) => {
          setCurrentInventory(data);
          setLoadingInitialData(false);
        })
        .catch((err) => {
          setToastConfig(err);
          setLoadingInitialData(false);
        });
    }
  };

  useEffect(() => {
    getCurrentInventory();
  }, [selectedStorageLocation]);

  const handleSubmit = (values) => {
    const serialNumberIds = serialNumbers.filter((item: any) => values['serialNumbers'].indexOf(item?.serialNumber) > -1);
    setAssetNumberDialog({
      open: true,
      products: product?.map((e) => {
        return {
          id: e.id,
          productName: e.productName,
          productCategory: e.productCategoryId,
          serialNumberIds: product > 1 ? [] : serialNumberIds.map((item) => item?._id),
          qty: parseInt(values.qty)
        };
      }),
      qty: parseInt(values.qty),
      warehouse: warehouse,
      storageLocation: values?.storageLocation ? values?.storageLocation : null
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
    } else if (product?.length > 1) {
      // Find the product with the minimum inventory
      const minInventoryProduct = product.reduce((minProduct, currentProduct) => {
        if (currentProduct.inventory < minProduct.inventory) {
          return currentProduct;
        }
        return minProduct;
      }, product[0]);

      // Compare input quantity with minimum inventory product
      if (parseInt(values?.qty) > minInventoryProduct.inventory) {
        errors['qty'] = `Insufficient Quantity! Available quantity for ${minInventoryProduct.productName} is ${minInventoryProduct.inventory}.`;
      }
    }

    if (user?.user?.brandPolicy?.storageLocation && !values['storageLocation']) {
      errors['storageLocation'] = 'Please select Storage Location';
    }

    const serialNumbersList = values['serialNumbers'];
    if (serialNumbersList?.length > parseInt(values?.qty)) {
      errors['serialNumbers'] = `Please select serial numbers same as quantity`;
    }
    if (user?.user?.brandPolicy?.productInventorySerialNumberRequired && serialNumbersList.length !== parseInt(values?.qty)) {
      errors['serialNumbers'] = `Please select serial numbers same as quantity`;
    }

    return errors;
  }

  const handleConvert = (rows) => {
    setLoading(true);
    rows?.forEach((e) => {
      delete e.qty;
    });
    const data = {
      qty: assetNumberDialog.qty,
      warehouse: assetNumberDialog.warehouse,
      storageLocation: assetNumberDialog.storageLocation,
      products: rows
    };
    axiosInstance()
      .post(`${convertInventory.api}/convert-inventory-to-asset`, data)
      .then(({ data }) => {
        setLoading(false);
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        handleSuccess();
        handleClose();
      })
      .catch((error) => {
        setLoading(false);
        setToastConfig(error);
      });
  };

  return (
    <Dialog
      fullWidth
      TransitionComponent={CustomDialogTransition}
      maxWidth="sm"
      open={true}
      fullScreen={fullScreen}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-labelledby="assign-roles-dialog"
    >
      {!loadingInitialData ? (
        <Formik initialValues={initialData} onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" className="flex min-h-full flex-col">
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
                      size="small"
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
                      required={true}
                    />
                  </ListItem>
                </List>
                {user?.user?.brandPolicy?.storageLocation && (
                  <Box m={1}>
                    <Autocomplete
                      disableClearable
                      options={storageLocationOptions}
                      getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                      isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                      value={
                        storageLocationOptions.filter((data) => data.optionValue === values['storageLocation']).length
                          ? storageLocationOptions.filter((data) => data.optionValue === values['storageLocation'])[0]
                          : ''
                      }
                      onChange={(e, val) => {
                        setFieldValue('storageLocation', val?.optionValue);
                        setSelectedStorageLocation(val?.optionValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          size="small"
                          name="storageLocation"
                          label="Storage Location"
                          variant="outlined"
                          fullWidth
                          required
                          error={touched['storageLocation'] && Boolean(errors['storageLocation'])}
                          helperText={touched['storageLocation'] && errors['storageLocation']}
                        />
                      )}
                    />
                  </Box>
                )}
                {product?.length === 1 ? (
                  <Fragment>
                    <Box my={2} mx={1}>
                      <Divider />
                    </Box>
                    <Box m={1}>
                      <Autocomplete
                        size="small"
                        options={serialNumbers.map((item: any) => item?.serialNumber)}
                        multiple={true}
                        disableCloseOnSelect
                        value={values['serialNumbers']}
                        onChange={(_, val) => {
                          setFieldValue('serialNumbers', val);
                        }}
                        isOptionEqualToValue={(item, current) => item === current}
                        getOptionLabel={(option) => option}
                        renderInput={(props) => (
                          <TextField
                            {...props}
                            placeholder={'Select Serial Numbers'}
                            variant="outlined"
                            name="serialNumbers"
                            label={'Select Serial Numbers'}
                            error={touched['serialNumbers'] && Boolean(errors['serialNumbers'])}
                            helperText={touched['serialNumbers'] && errors['serialNumbers']}
                            required={user?.user?.brandPolicy?.productInventorySerialNumberRequired ? true : false}
                          />
                        )}
                      />
                    </Box>
                  </Fragment>
                ) : null}
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={handleClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton onClick={handleConvert} isLoading={loading} disabled={loading} buttonType="theme">
                  Convert
                </ThemeButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {assetNumberDialog.open && (
        <CustomAssetDialog
          handleClose={() => setAssetNumberDialog({ open: false, products: [], qty: 0, warehouse: null, storageLocation: null })}
          products={assetNumberDialog.products}
          handleSuccess={(rows) => {
            handleConvert(rows);
          }}
          loading={loading}
          resource={sidebarResource.inventoryToAsset}
        />
      )}
    </Dialog>
  );
};

export default InventoryToAsset;
