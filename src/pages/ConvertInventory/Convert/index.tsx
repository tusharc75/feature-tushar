import { Fragment, useState, useEffect, useContext } from 'react';
import { Box, Button, Dialog, List, ListItem, ListItemAvatar, ListItemText, TextField } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form, Field } from 'formik';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import CustomButton from 'src/components/Helpers/CustomButton';
import { capitalize } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { convertInventory, productInventory } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

const ConvertInventoryToAsset = ({ handleClose, handleSuccess, product, type, warehouse }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  const handleSubmit = (values) => {
    console.log(product);
    const data = {
      products: product?.map((e) => {
        return { id: e.id, productCategory: e.productCategoryId };
      }),
      qty: parseInt(values.qty),
      warehouse: warehouse
    };
    setLoading(true);

    axiosInstance()
      .post(`${convertInventory.api}/convert-inventory`, data)
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
  };

  function validate(values) {
    const errors = {};
    if (values.qty <= 0) {
      errors['qty'] = 'Please enter valid qty';
    }
    if (type === 'convert') {
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
      <Formik initialValues={{ qty: 1, comment: '' }} onSubmit={handleSubmit} validateOnMount validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
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
                    <ListItemText primary={product[0]?.productName} secondary={`Inventory - ${product[0]?.availableInventory}`} />
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
            </CustomDialogContent>
            <CustomDialogFooter>
              <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit" onClick={submitForm}>
                {capitalize(type)}
              </CustomButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ConvertInventoryToAsset;
