import { useContext, useState } from 'react';
import { Dialog, TextField, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, purchaseOrder, sidebarResource } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import CustomAssetDialog from 'src/pages/ConvertInventory/InventoryToAsset/CustomAssetDialog';
import { isEqual } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form } from 'formik';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const AssetQtyDialog = ({ onClose, onSuccess, product, purchaseOrderData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const {
    state: { user, resources }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, products: [] });

  const handleSubmit = (values) => {
    setAssetNumberDialog({
      open: true,
      products: [
        {
          ...product,
          product: product.productId,
          qty: parseInt(values?.qty),
          warehouse: purchaseOrderData?.warehouse?.optionValue,
          storageLocation: user?.user?.brandPolicy?.storageLocation ? purchaseOrderData?.storageLocation?.optionValue : null
        }
      ]
    });
  };

  const handleReceive = (products) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${purchaseOrder.api}/add-assets/${purchaseOrderData?._id}`, { products: products })
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setAssetNumberDialog({ open: false, products: [] });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  function validate(values) {
    const errors = {};
    if (values.qty <= 0) {
      errors['qty'] = 'Please enter valid qty';
    }
    if (values.qty > product?.qty - (product?.actualReceived || 0) - (product?.assetQty || 0)) {
      errors['qty'] = 'Please enter valid qty';
    }
    return errors;
  }

  return (
    <>
      <Dialog
        open
        TransitionComponent={CustomDialogTransition}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
      >
        <Formik initialValues={{ qty: 1 }} onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <CustomDialogHeader
                title={`Create ${resources?.serializedAsset?.titleSingular}`}
                onClose={onClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Box p={2}>
                  <TextField
                    fullWidth
                    label="Asset Quantity"
                    variant="outlined"
                    type="number"
                    size="small"
                    name="qty"
                    placeholder="Asset Quantity"
                    value={values['qty']}
                    error={touched['qty'] && Boolean(errors['qty'])}
                    helperText={touched['qty'] && errors['qty']}
                    onChange={(e) => {
                      setFieldValue('qty', e.target.value);
                    }}
                    required
                  />
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton disabled={isSubmitting} buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton onClick={onSuccess} buttonType="theme">
                  Submit
                </ThemeButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      </Dialog>
      {assetNumberDialog.open && (
        <CustomAssetDialog
          handleClose={() => setAssetNumberDialog({ open: false, products: [] })}
          products={[...assetNumberDialog.products]?.map((e: any) => {
            return { ...e, id: e._id, productName: product?.productName };
          })}
          handleSuccess={(rows) => {
            const products = assetNumberDialog.products;
            products?.forEach((e) => {
              e.assetNumbers = rows?.find((ele) => isEqual(ele._id, e.id))?.assetNumbers || [];
            });
            handleReceive(products);
          }}
          loading={isSubmitting}
          resource={sidebarResource.purchaseOrder}
        />
      )}
    </>
  );
};

export default AssetQtyDialog;
