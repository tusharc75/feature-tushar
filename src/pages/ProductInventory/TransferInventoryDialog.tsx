import { Autocomplete, Box, Dialog, TextField } from "@mui/material";
import { FieldArray, Form, Formik } from "formik";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import { ThemeButton } from "src/components/Helpers/Buttons";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomDialogTransition, productInventory, sidebarResource } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";

const TransferInventoryDialog = ({ handleClose, handleSuccess, products }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [loading, setLoading] = useState(false)
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues] = useState({ warehouse: products[0]?.plantId, transferFromStorageLocation: products[0]?.storageLocationId, transferToStorageLocation: '', products: products?.map(p => ({ _id: p?._id, qty: 1 })) })
  const [storageLocationOptions, setStorageLocationOptions] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchStorageLocation();
  }, []);

  const fetchStorageLocation = () => {
    setLoading(true);
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          const storageLocationOption = data[sidebarResource.storageLocation]?.filter((e) => e.warehouse === products[0]?.plantId && e?.optionValue !== products[0]?.storageLocationId);
          setStorageLocationOptions(storageLocationOption);
        }
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    setIsSubmitting(true)
    axiosInstance()
      .put(`${productInventory.api}/transfer-inventory`, { ...values, products: values?.products?.map(p => ({ ...p, qty: parseInt(p?.qty) })) })
      .then(({ data: { data } }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Transfer Inventory Successfully`
        });
        handleSuccess();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });

  }

  const validate = (values) => {
    const errors: any = {};
    values?.products?.forEach((d, i) => {
      const product = products?.find(p => p?._id === d?._id)
      if (parseInt(d?.qty) > product?.availableInventory, parseInt(d?.qty) > product?.availableInventory) {
        if (!errors?.products) {
          errors['products'] = [];
        }
        errors.products[i] = { qty: 'Qty must be less than or equal to Inventory' };
      }

      if (parseInt(d?.qty) <= 0) {
        if (!errors?.products) {
          errors['products'] = [];
        }
        errors.products[i] = { qty: 'Qty must be greater than 0' };
      }

    });

    if (!values?.transferToStorageLocation) {
      errors['transferToStorageLocation'] = `To ${resources?.storageLocation?.titleSingular} is required`;
    }
    return errors;
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      TransitionComponent={CustomDialogTransition}
      open={true}
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-labelledby="assign-roles-dialog"
    >
      {initialValues?.products?.length > 0 || !loading ? (
        <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={handleClose}
                title={'Transfer Inventory'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={true}
              />
              <CustomDialogContent>
                <div className="p-2">
                  <Form>
                    <FieldArray
                      name="products"
                      render={(arrayHelpers) => (
                        <>
                          {values?.products?.map((data, index) => {
                            const product = products?.find(p => p?._id === data?._id)
                            return (
                              <div className="flex items-center justify-between">
                                <div className="flex flex-column gap-1">
                                  <p>{product?.productName}</p>
                                  <p className="text-sm text-gray-400">Inventory : {product?.availableInventory}</p>
                                </div>
                                <TextField
                                  margin="dense"
                                  size="small"
                                  type="number"
                                  label="Qty"
                                  name="qty"
                                  required
                                  variant="outlined"
                                  value={data['qty']}
                                  error={
                                    touched?.products &&
                                    touched?.products[index]?.qty &&
                                    errors?.products &&
                                    Boolean(errors?.products[index]?.qty)
                                  }
                                  helperText={
                                    touched?.products &&
                                    touched?.products[index]?.qty &&
                                    errors?.products &&
                                    errors?.products[index]?.qty
                                  }
                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                  onChange={(e) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.products[index],
                                      ['qty']: e?.target?.value?.replace(/\D/g, '')
                                    });
                                  }}
                                />
                              </div>
                            )
                          })}
                        </>
                      )}
                    />

                    <div className="mt-5">
                      <Autocomplete
                        options={storageLocationOptions}
                        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                        isOptionEqualToValue={(option: any, val) => option?.optionValue === val}
                        value={
                          storageLocationOptions.filter((o) => o?.optionValue === values['transferToStorageLocation']).length
                            ? storageLocationOptions.filter((o) => o?.optionValue === values['transferToStorageLocation'])[0]
                            : ''
                        }
                        onChange={(e, val) => {
                          setFieldValue('transferToStorageLocation', val?.optionValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            name="transferToStorageLocation"
                            label={`To ${resources?.storageLocation?.titleSingular}`}
                            variant="outlined"
                            fullWidth
                            required
                            error={touched['transferToStorageLocation'] && Boolean(errors['transferToStorageLocation'])}
                            helperText={touched['transferToStorageLocation'] && errors['transferToStorageLocation']}
                          />
                        )}
                      />
                    </div>
                  </Form>
                </div>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={handleClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton isLoading={isSubmitting} buttonType="theme" disabled={isSubmitting} onClick={submitForm}>
                  Transfer
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
  )
}

export default TransferInventoryDialog;
