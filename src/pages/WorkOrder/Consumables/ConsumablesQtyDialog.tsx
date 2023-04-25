import {
  Box,
  Button,
  Dialog,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  makeStyles
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { sidebarResource, workOrder } from 'src/constants/helpers';

const useClasses = makeStyles(() => ({
  tableContainer: {
    maxHeight: 'calc(100vh - 200px)'
  }
}));

const ConsumablesQtyDialog = ({ workOrderId, onClose, onSuccess, selectedRecords, service, uniqueId, stepId, serviceName }) => {

  const classes = useClasses();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  const validate = (values) => {
    let errors: any = {};
    if (values?.length > 0) {
      values.map((d) => {
        if (user?.user?.brandPolicy?.storageLocation && !d.storageLocation) {
          errors.storageLocation = 'Storage Location is required .';
        }
        let tempProduct = selectedRecords.find((u) => u._id === d._id);
        let qty = tempProduct.qty;
        if (tempProduct && d.consumedQty > qty) {
          errors.consumedQty = 'Consume Qty is limited to Qty.';
        }
      });
    }
    return errors;
  };

  const handleSubmit = (values) => {
    const data: any = {}
    data.service = service;
    data.uniqueId = uniqueId;
    data.stepId = stepId;
    const products: any = []
    values?.products?.forEach((e) => {
      if (parseInt(e?.consumedQty)) {
        products.push({
          _id: e?._id,
          product: e?.materialId,
          qty: parseInt(e?.consumedQty),
          storageLocation: user?.user?.brandPolicy?.storageLocation ? e?.storageLocation : null
        })
      }
    })
    data.products = products;
    if (products?.length) {
      setIsSubmitting(true)
      axiosInstance().put(`${workOrder.api}/${workOrderId}/consumable/consumable-consume`, data).then(({ data }) => {
        onSuccess();
        setIsSubmitting(false)
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
        .catch((error) => {
          setIsSubmitting(false)
          toastConfig.setToastConfig(error);
        });
    }
  };

  const getStorageLocation = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          // const storageLocationOption = data[sidebarResource.storageLocation]?.filter(e => e.warehouse === warehouse);
          // setStorageLocationOptions(storageLocationOption);
          setStorageLocationOptions(data[sidebarResource.storageLocation]);
        }
      });
  };

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, [])

  return (
    <Dialog
      open
      fullScreen={fullScreen || isMobile || isTablet}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader
        title={`${serviceName} - Products/Consumables`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <Formik
        initialValues={{
          products: selectedRecords?.map((item) => ({
            _id: item?._id,
            materialId: item?.materialId,
            product: item?.product,
            qty: item.qty - (item?.consumedQty || 0),
            consumedQty: 0,
            storageLocation: null
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => { }}
      >
        {({ values, setFieldValue, errors }) => (
          <>
            <CustomDialogContent>
              {values?.products && values?.products?.length ? (
                <Box p={2}>
                  <Form>
                    <FieldArray
                      name="products"
                      render={(arrayHelpers) => (
                        <TableContainer className={classes.tableContainer} component={Paper}>
                          <Table aria-label="customized table">
                            <TableHead>
                              <TableRow>
                                <TableCell>Index</TableCell>
                                <TableCell align="left">Product</TableCell>
                                {user?.user?.brandPolicy?.storageLocation &&
                                  <TableCell align="left">Storage Location</TableCell>
                                }
                                <TableCell align="left">{'Qty'}</TableCell>
                                <TableCell align="left">{'Consume Qty'}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {values?.products?.map((value: any, index) => (
                                <TableRow key={value._id}>
                                  <TableCell component="th" scope="row">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell align="left">{value['product']}</TableCell>
                                  {
                                    user?.user?.brandPolicy?.storageLocation &&
                                    <TableCell align="left">
                                      <Autocomplete
                                        disableClearable
                                        options={storageLocationOptions}
                                        getOptionLabel={(option: any) => option ? option.optionLabel : ''}
                                        getOptionSelected={(option: any, val) => option.optionValue === val}
                                        value={storageLocationOptions.filter((data) => data.optionValue === value['storageLocation']).length ? storageLocationOptions.filter((data) => data.optionValue === value['storageLocation'])[0] : ''}
                                        onChange={(e, val) => {
                                          arrayHelpers.replace(index, {
                                            ...values.products[index],
                                            storageLocation: val?.optionValue
                                          });
                                        }}
                                        renderInput={(params) =>
                                          <TextField
                                            {...params}
                                            style={{ minWidth: '200px' }}
                                            margin="dense"
                                            name="storageLocation"
                                            variant="outlined"
                                            fullWidth
                                            required
                                            error={validate([value])?.storageLocation}
                                            helperText={validate([value])?.storageLocation ? 'Storage Location is required' : ''}
                                          />
                                        }
                                      />
                                    </TableCell>
                                  }
                                  <TableCell align="left">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      placeholder={'qty'}
                                      autoComplete="off"
                                      name={'qty'}
                                      disabled={true}
                                      type="number"
                                      value={value['qty']}
                                    />
                                  </TableCell>
                                  <TableCell align="left">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      placeholder={'Consume Qty'}
                                      autoComplete="off"
                                      name={'consumedQty'}
                                      type="number"
                                      required
                                      value={value['consumedQty']}
                                      error={validate([value])?.consumedQty}
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        arrayHelpers.replace(index, {
                                          ...values.products[index],
                                          consumedQty: value
                                        });
                                      }}
                                      helperText={validate([value])?.consumedQty ? 'Consume Qty is limited to Qty.' : ''}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    />
                  </Form>
                </Box>
              ) : (
                <Box p={2} height={300} bgcolor="white">
                  <CommonSkeleton lenArray={[...Array(6).keys()]} />
                </Box>
              )}
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                variant="outlined"
                disabled={isSubmitting}
                size="small"
                color="primary"
                onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!validate(values.products).consumedQty && (user?.user?.brandPolicy?.storageLocation && !validate(values.products).storageLocation)) {
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
  );
};

export default ConsumablesQtyDialog;
