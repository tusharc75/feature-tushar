import { useState } from 'react';
import { Dialog, Box, TextField, Table, TableHead, Paper, TableContainer, TableBody, TableCell, TableRow } from '@mui/material';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form, FieldArray } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ReturnQtyDialog = ({ products, loading, handleClose, handleSuccess }) => {
  const [fullScreen, setFullScreen] = useState(true);

  const initialProducts = products.map(product => ({
    ...product,
    returnQty: 0
  }));

  const handleSubmit = (values) => {
    handleSuccess(values.products);
  };

  const validate = (values) => {
    let errors = {};
    if (values?.products?.length > 0) {
      values.products.forEach((product, index) => {
        if (isNaN(product.returnQty) || product.returnQty === '') {
          errors[`returnQty_${index}`] = 'Return Qty must be a number';
        } else if (product.returnQty < 0 || product.returnQty > product.qty) {
          errors[`returnQty_${index}`] = `Return Qty must be between 0 and ${product.qty}`;
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
    >
      <CustomDialogHeader
        title={'Return Products'}
        onClose={handleClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      {products ? (
        <Formik
          initialValues={{ products: initialProducts }}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ submitForm, values, errors, setFieldValue }) => (
            <>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box display="flex" flexDirection="column">
                    <TableContainer component={Paper}>
                      <Table aria-label="products return table">
                        <TableHead>
                          <TableRow>
                            <TableCell width="60%" align="left" className="min-w-[200px]">
                              Product
                            </TableCell>
                            <TableCell width="20%" align="left" className="min-w-[100px]">
                              Qty
                            </TableCell>
                            <TableCell width="20%" align="left" className="min-w-[150px]">
                              Return Qty
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <FieldArray
                            name="products"
                            render={() =>
                              values.products.map((product, index) => (
                                <TableRow key={index}>
                                  <TableCell align="left">{product.productName}</TableCell>
                                  <TableCell align="left">{product.qty}</TableCell>
                                  <TableCell align="left">
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      type="number"
                                      size="small"
                                      name={`products[${index}].returnQty`}
                                      placeholder="Return Qty"
                                      value={product.returnQty}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value, 10);
                                        setFieldValue(`products[${index}].returnQty`, isNaN(value) ? '' : value);
                                      }}
                                      error={Boolean(errors[`returnQty_${index}`])}
                                      helperText={errors[`returnQty_${index}`]}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            }
                          />
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  onClick={submitForm}
                  buttonType="theme"
                  disabled={loading}
                  isLoading={loading}
                >
                  Submit
                </ThemeButton>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ReturnQtyDialog;
