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
import { FieldArray, Form, Formik } from 'formik';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const useClasses = makeStyles(() => ({
  tableContainer: {
    maxHeight: 'calc(100vh - 200px)'
  }
}));

const ConsumablesQtyDialog = ({ onClose, onSuccess, selectedRecords }) => {
  const classes = useClasses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const validate = (values) => {
    let errors: any = {};
    if (values?.length > 0) {
      values.map((d) => {
        let tempProduct = selectedRecords.find((u) => u._id === d.id);
        let qty = tempProduct.qty;
        if (tempProduct && d.receivingQty > qty) {
          errors.receivingQty = 'should be greater';
        }
      });
    }
    return errors;
  };

  const handleSubmit = (values) => {};

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
        title={'Consumables Quantity'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <Formik
        initialValues={{
          selectedProducts: selectedRecords?.map((item) => ({
            id: item?._id,
            product: item?.product,
            qty: item.qty,
            receivingQty: 0
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue, errors }) => (
          <>
            <CustomDialogContent>
              {values?.selectedProducts && values?.selectedProducts?.length ? (
                <Box p={2}>
                  <Form>
                    <FieldArray
                      name="selectedProducts"
                      render={(arrayHelpers) => (
                          <TableContainer className={classes.tableContainer} component={Paper}>
                            <Table aria-label="customized table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Sr.No.</TableCell>
                                  <TableCell align="left">Product</TableCell>
                                  <TableCell align="left">{'Qty'}</TableCell>
                                  <TableCell align="left">{'Receiving Qty'}</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {values?.selectedProducts?.map((value: any, index) => (
                                  <TableRow key={value.id}>
                                    <TableCell component="th" scope="row">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell align="left">{value['product']}</TableCell>
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
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      />
                                    </TableCell>
                                    <TableCell align="left">
                                      <TextField
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        placeholder={'qty'}
                                        autoComplete="off"
                                        name={'receivingQty'}
                                        type="number"
                                        value={value['receivingQty']}
                                        error={validate([value])?.receivingQty}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9]/g, '');
                                          arrayHelpers.replace(index, {
                                            ...values.selectedProducts[index],
                                            receivingQty: value
                                          });
                                        }}
                                        helperText={validate([value])?.receivingQty ? 'Receiving quantity is more than actual quantity' : ''}
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
                  if (!validate(values.selectedProducts).receivingQty) {
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
