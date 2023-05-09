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

const ConsumablesQtyDialog = ({ selectedFieldService, onClose, onSuccess, selectedRecords }) => {
  const classes = useClasses();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);

  const validate = (values) => {
    let errors: any = {};
    if (values?.length > 0) {
      values.map((d) => {
        let tempProduct = selectedRecords.find((u) => u._id === d._id);
        let qty = tempProduct.qty - (tempProduct?.consumedQty || 0);
        if (tempProduct && d.consumedQty > qty) {
          errors.consumedQty = 'Consume Qty is limited to Qty.';
        }
      });
    }
    return errors;
  };

  const handleSubmit = (values) => {
    const data: any = {};
    const products: any = [];
    values?.products?.forEach((e) => {
      if (parseInt(e?.consumedQty)) {
        products.push({
          _id: e?._id,
          consumedQty: parseInt(e?.consumedQty)
        });
      }
    });
    data.technician = {
      _id: selectedFieldService?.technicianAssign?._id,
      uniqueId: selectedFieldService?.technicianAssign?.uniqueId
    };
    data.products = products;
    if (products?.length) {
      setIsSubmitting(true);
      axiosInstance()
        .put(`/field-service-technician/consume`, data)
        .then(({ data }) => {
          onSuccess();
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
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
        title={
          selectedFieldService?.serviceOrderNumber ? `${selectedFieldService?.serviceOrderNumber} - Products/Consumables` : 'Products/Consumables'
        }
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
            product: item?.productName,
            qty: item.qty - (item?.consumedQty || 0),
            consumedQty: 0
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => {}}
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
                                  <TableCell align="left">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      autoComplete="off"
                                      name={'qty'}
                                      disabled={true}
                                      type="number"
                                      value={value['qty']}
                                      label="Qty"
                                      placeholder="Qty"
                                    />
                                  </TableCell>
                                  <TableCell align="left">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
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
                                      label="Consume Qty"
                                      placeholder="Consume Qty"
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
              <Button variant="outlined" disabled={isSubmitting} size="small" color="primary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!validate(values.products).consumedQty) {
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
