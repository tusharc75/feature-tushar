import React, { useContext, useState } from 'react';
import { Dialog, Button, Box, TextField, Grid, Chip, Typography } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { Formik, Form, FieldArray, Field } from 'formik';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { rentalManagement } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';

const ReturnTicketDialog = ({ onClose, onSuccess, productList, invoiceQtyData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleSubmit = (values) => {
    delete values['orderQuantity'];
    onSuccess(values);
  };

  const validate = (values) => {
    let errors: any = {};
    if (values.length > 0) {
      values.map((d) => {
        const returnQty = parseInt(d.returnQuantity);
        const consumeQty = parseInt(d.consumeQuantity);
        const invoiceData = invoiceQtyData?.find((i) => i?._id === d?.row?.uniqueId);
        const invoiceQuantity = invoiceData?.qty || 0;
        let product = d?.row;
        if (!product?.serialized && returnQty > product.qty - invoiceQuantity) {
          errors.returnQuantity = `Return quantity can not be greater than Returnable quantity (${product.qty - invoiceQuantity})`;
        } else if (returnQty > product.qty) {
          errors.returnQuantity = 'Return quantity should not be more then order quantity';
        } else {
          errors.returnQuantity = '';
        }
        if (consumeQty > product.qty) {
          errors.consumeQuantity = 'Consume quantity should not be more then order quantity';
        } else {
          errors.consumeQuantity = '';
        }
        if (consumeQty + returnQty > product.qty && !errors?.returnQuantity && !errors?.consumeQuantity) {
          errors['sum'] = 'The sum of the quantities you return and consume cannot exceed the quantity you ordered.';
        } else {
          errors['sum'] = '';
        }
      });
    }
    return errors;
  };

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
        title={'Return Transaction'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <Formik
          initialValues={{
            products: productList.map((d) => ({
              _id: d._id,
              product: d.productName,
              productId: d.productId,
              returnQuantity: 0,
              consumeQuantity: 0,
              orderQuantity: d.qty || 0,
              row: d
            }))
          }}
          enableReinitialize={true}
          onSubmit={() => {}}
        >
          {({ values }) => (
            <>
              <CustomDialogContent>
                {values.products && values.products.length ? (
                  <Box p={2}>
                    <Form>
                      <Box display="flex" justifyContent="space-evenly" alignItems="center">
                        <Grid item md={12}>
                          <Box>
                            <FieldArray
                              name="products"
                              render={(arrayHelpers) => (
                                <div>
                                  {values.products.map((data, index) => (
                                    <Box key={data?.productId} border={'1px solid #dddddd'} borderRadius={4} mb={2} p={2} pt={2}>
                                      <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={1}>
                                          <Chip color="primary" label={index + 1} />
                                        </Grid>
                                        <Grid item xs={12} md={11}>
                                          <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12}>
                                              <Typography>
                                                <b>{data?.product}</b>
                                              </Typography>
                                            </Grid>
                                            {validate([data])['sum'] && (
                                              <Grid item xs={12}>
                                                <Typography color="error">{validate([data])['sum']}</Typography>
                                              </Grid>
                                            )}
                                          </Grid>
                                          <Box mt={1}>
                                            <Grid container spacing={2} alignItems="center">
                                              <Grid item xs={12} md={4}>
                                                <Field
                                                  fullWidth
                                                  label="Return"
                                                  variant="outlined"
                                                  type="number"
                                                  size="small"
                                                  component={TextField}
                                                  name="returnQuantity"
                                                  placeholder="Return Quantity"
                                                  value={data.returnQuantity}
                                                  onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    arrayHelpers.replace(index, {
                                                      ...values.products[index],
                                                      ['returnQuantity']: parseInt(value)
                                                    });
                                                  }}
                                                  error={validate([data])?.returnQuantity}
                                                  helperText={validate([data]).returnQuantity ? validate([data]).returnQuantity : ''}
                                                />
                                              </Grid>
                                              <Grid item xs={12} md={4}>
                                                <Field
                                                  fullWidth
                                                  label="Consume"
                                                  variant="outlined"
                                                  type="number"
                                                  size="small"
                                                  component={TextField}
                                                  name="consumeQuantity"
                                                  placeholder="Consume Quantity"
                                                  value={data.consumeQuantity}
                                                  onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    arrayHelpers.replace(index, {
                                                      ...values.products[index],
                                                      ['consumeQuantity']: parseInt(value)
                                                    });
                                                  }}
                                                  error={validate([data])?.consumeQuantity}
                                                  helperText={validate([data]).consumeQuantity ? validate([data]).consumeQuantity : ''}
                                                />
                                              </Grid>
                                              <Grid item xs={12} md={4}>
                                                <Field
                                                  fullWidth
                                                  label="Order Quantity"
                                                  variant="outlined"
                                                  type="number"
                                                  size="small"
                                                  component={TextField}
                                                  name="orderQuantity"
                                                  placeholder="Order Quantity"
                                                  value={data.orderQuantity}
                                                  disabled
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
                <Button variant="outlined" color="primary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!validate(values.products).returnQuantity && !validate(values.products).consumeQuantity && !validate(values.products).sum) {
                      handleSubmit(values);
                    }
                  }}
                  variant="contained"
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

export default ReturnTicketDialog;
function useEffect(arg0: () => void, arg1: any[]) {
  throw new Error('Function not implemented.');
}
