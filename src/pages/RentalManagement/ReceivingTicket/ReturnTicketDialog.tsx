import React, { useContext, useState } from 'react';
import { Dialog, Button, Box, TextField, Chip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { Formik, Form, FieldArray } from 'formik';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition } from 'src/constants/helpers';

const ReturnTicketDialog = ({ onClose, onSuccess, products, invoiceQtyData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  if (!products?.length) {
    onSuccess([]);
  }

  const handleSubmit = (values) => {
    delete values['orderQuantity'];
    const rows = values?.products?.filter((e) => e.returnQuantity > 0);
    if (rows?.length) {
      onSuccess(rows);
    } else {
      onClose();
    }
  };

  const validate = (values) => {
    let errors: any = {};
    if (values.length > 0) {
      values.map((d) => {
        const returnQty = parseInt(d.returnQuantity);
        const consumeQty = parseInt(d.consumeQty);
        const invoiceData = invoiceQtyData?.find((i) => i?._id === d?.row?.uniqueId);
        const invoiceQuantity = invoiceData?.qty || 0;
        let product = d?.row;
        if (returnQty > product.qty) {
          errors.returnQuantity = 'Return quantity is not more then order quantity';
        } else if (returnQty > product.qty - invoiceQuantity - consumeQty) {
          errors.returnQuantity = `Sum of return and consume quantity cannot exceed the quantity you ordered`;
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
      TransitionComponent={CustomDialogTransition}
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
      <Formik
        initialValues={{
          products: products?.map((d) => ({
            _id: d._id,
            product: d.productName,
            productId: d.productId,
            returnQuantity: d.qty - (invoiceQtyData?.find((i) => i?._id === d?.uniqueId)?.qty || 0) - (d?.consumeQty || 0),
            consumeQty: d.consumeQty,
            invoiceQty: invoiceQtyData?.find((i) => i?._id === d?.uniqueId)?.qty || 0,
            orderQuantity: d.qty || 0,
            uniqueId: d?.uniqueId,
            productSerialNumbers: d?.productSerialNumbers,
            row: d
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => { }}
      >
        {({ values }) => (
          <>
            <CustomDialogContent>
              {values.products && values.products.length ? (
                <Box p={2}>
                  <Form>
                    <Box display="flex" justifyContent="space-evenly" alignItems="center">
                      <Grid size={{md:12}}>
                        <Box>
                          <FieldArray
                            name="products"
                            render={(arrayHelpers) => (
                              <div>
                                {values.products.map((data, index) => (
                                  <Box key={data?.productId} border={'1px solid #dddddd'} borderRadius={4} mb={2} p={2} pt={2}>
                                    <Grid container spacing={2} alignItems="center">
                                      <Grid size={{xs:12, md:1}}>
                                        <Chip color="primary" label={index + 1} />
                                      </Grid>
                                      <Grid size={{xs:12, md:11}}>
                                        <Grid container spacing={2} alignItems="center">
                                          <Grid size={{xs:12}}>
                                            <Typography>
                                              <b>{data?.product}</b>
                                            </Typography>
                                          </Grid>
                                        </Grid>
                                        <Box mt={1}>
                                          <Grid container spacing={2} alignItems="center">
                                            <Grid size={{xs:12, md:3}}>
                                              <TextField
                                                fullWidth
                                                label="Return Quantity"
                                                variant="outlined"
                                                type="number"
                                                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                size="small"
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
                                            <Grid size={{xs:12, md:3}}>
                                              <TextField
                                                fullWidth
                                                label="Consumed Quantity"
                                                variant="outlined"
                                                type="number"
                                                size="small"
                                                disabled
                                                name="consumeQty"
                                                placeholder="Consumed Quantity"
                                                value={data.consumeQty}
                                              />
                                            </Grid>
                                            <Grid size={{xs:12, md:3}}>
                                              <TextField
                                                fullWidth
                                                label="Invoiced Quantity"
                                                variant="outlined"
                                                type="number"
                                                size="small"
                                                disabled
                                                name="invoiceQty"
                                                placeholder="Invoiced Quantity"
                                                value={data.invoiceQty}
                                              />
                                            </Grid>
                                            <Grid size={{xs:12, md:3}}>
                                              <TextField
                                                fullWidth
                                                label="Order Quantity"
                                                variant="outlined"
                                                type="number"
                                                size="small"
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
                <Box p={2} height={300}>
                  <CommonSkeleton lenArray={[...Array(6).keys()]} />
                </Box>
              )}
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" variant="outlined" color="primary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!validate(values.products).returnQuantity) {
                    handleSubmit(values);
                  }
                }}
                variant="contained"
                color="primary"
                size="small"
              >
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog >
  );
};

export default ReturnTicketDialog;
function useEffect(arg0: () => void, arg1: any[]) {
  throw new Error('Function not implemented.');
}
