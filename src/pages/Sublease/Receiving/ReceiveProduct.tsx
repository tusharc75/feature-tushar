import { Box, Dialog, TextField } from '@mui/material';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { convertDateInDateTime, CustomDialogTransition, sublease, SUBLEASE_TYPE } from 'src/constants/helpers';
import AssetDialog from 'src/pages/Sublease/Receiving/AssetDialog';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

const ReceiveProduct = ({ onClose, material, subleaseId, onSuccess, subleaseData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, material: [], receiveDate: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (values) => {
    const data: any = [];
    values?.material?.forEach((element) => {
      if (parseInt(element?.qty)) {
        data.push({
          _id: element._id,
          product: element.materialId,
          productName: element.productName,
          qty: parseInt(element?.qty)
        });
      }
    });
    if (data?.length) {
      setAssetNumberDialog({ open: true, material: data, receiveDate: values?.receiveDate });
    } else {
      onSuccess();
    }
  };

  const handleReceive = (material, receiveDate) => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${sublease.api}/${subleaseId}/receive-sublease`, {
        material: material?.map((m) => ({
          _id: m?._id,
          product: m?.product,
          assetNumber: m?.assetNumber,
          assetNumberType: m?.assetNumberType
        })),
        receiveDate: receiveDate
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setAssetNumberDialog({ open: false, material: [], receiveDate: null });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const validate = (values) => {
    let errors: any = {};
    if (values.length > 0) {
      values.map((d) => {
        let tempProduct = material.find((u) => u.uniqueId === d._id);
        const qty = tempProduct?.qty - tempProduct?.assetQty;
        if (!d.qty) {
          errors.qty = 'Please enter valid quantity';
        } else if (tempProduct && d.qty > qty) {
          errors.qty = 'Receiving quantity is more than actual quantity';
        }
      });
    }
    return errors;
  };

  const validateDate = (values) => {
    let errors: any = {};

    if (dayjs(values['receiveDate']).isAfter(dayjs())) {
      errors['receiveDate'] = `Please select valid date`;
    }
    return errors;
  };

  return (
    <>
      <Dialog
        open
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        maxWidth="md"
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
      >
        <CustomDialogHeader title={'Receiving'} onClose={onClose}></CustomDialogHeader>
        <Formik
          initialValues={{
            receiveDate: new Date(),
            material: material.map((d) => ({
              _id: d.uniqueId,
              materialId: d.materialId,
              productName: d.productName,
              totalQty: d.qty,
              assetQty: d.assetQty,
              qty: d.qty - d?.assetQty
            }))
          }}
          enableReinitialize={true}
          onSubmit={() => { }}
        >
          {({ values, setFieldValue }) => (
            <>
              <CustomDialogContent>
                {values.material && values.material.length ? (
                  <Box p={2}>
                    <Form>
                      <FieldArray
                        name="material"
                        render={(arrayHelpers) => (
                          <div className="grid gap-[15px] sm:gap-[18px]">
                            {values.material.map((data, index) => (
                              <div
                                style={{ border: '1.5px solid var(--common-border-color)' }}
                                className="grid gap-[15px] rounded-[6px] px-[23px] pb-[21px] pt-[17px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)] sm:grid-cols-[24px,1fr] md:gap-[29px]"
                                key={index}
                              >
                                <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-[var(--new\_theme\_color)]">
                                  <p className="text-[13px] font-[700] leading-none text-white">{index + 1}</p>
                                </div>
                                <div>
                                  <div
                                    style={{ borderBottom: '1px solid var(--common-border-color)' }}
                                    className="flex flex-wrap gap-[20px]  border-b border-b-[var(--common-border-color)] pb-[9px] md:gap-[61px]"
                                  >
                                    <span>
                                      <span className="font-semibold text-[var(--primary-text)]">Quantity: </span>
                                      {data?.totalQty}
                                    </span>
                                    <span>
                                      <span className="font-semibold text-[var(--primary-text)]">Received: </span>
                                      {data?.assetQty || 0}
                                    </span>
                                  </div>
                                  <div className="mt-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-3">
                                    <TextField
                                      variant="outlined"
                                      name={`${data?._id}`}
                                      label={'Product'}
                                      value={data?.productName}
                                      size="small"
                                      disabled
                                    />
                                    <TextField
                                      fullWidth
                                      label="Quantity"
                                      variant="outlined"
                                      type="number"
                                      size="small"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      name="qty"
                                      required
                                      placeholder="Asset Quantity"
                                      value={data.qty}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        arrayHelpers.replace(index, {
                                          ...values.material[index],
                                          ['qty']: value
                                        });
                                      }}
                                      error={validate([data])?.qty}
                                      helperText={validate([data]).qty ? validate([data]).qty : ''}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      {subleaseData?.type === SUBLEASE_TYPE.vendor && (
                        <div className="datepicker mt-[14px]">
                          <CustomDatePicker
                            label="Received Date"
                            required
                            size="small"
                            margin="dense"
                            name="receiveDate"
                            placeholder="Receive Date"
                            value={values.receiveDate}
                            maxDate={new Date()}
                            onChange={(value) => {
                              setFieldValue('receiveDate', convertDateInDateTime(value));
                            }}
                            error={validateDate(values)?.receiveDate}
                            helperText={validateDate(values)?.receiveDate ? validateDate(values)?.receiveDate : ''}
                          />
                        </div>
                      )}
                    </Form>
                  </Box>
                ) : (
                  <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(6).keys()]} />
                  </Box>
                )}
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={onClose} id="receive-dialog-cancel-button">
                  Cancel
                </ThemeButton>
                <ThemeButton
                  onClick={() => {
                    if (
                      !validate(values.material).qty &&
                      (subleaseData.type === SUBLEASE_TYPE.vendor ? !validateDate(values)?.receiveDate : true)
                    ) {
                      handleSubmit(values);
                    }
                  }}
                  buttonType="theme"
                  id="receive-dialog-save-button"
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      </Dialog>
      {assetNumberDialog.open && (
        <AssetDialog
          handleClose={() => setAssetNumberDialog({ open: false, material: [], receiveDate: null })}
          products={assetNumberDialog.material}
          handleSuccess={(rows) => {
            handleReceive(rows, assetNumberDialog.receiveDate);
          }}
          loading={isSubmitting}
          subleaseId={subleaseId}
        />
      )}
    </>
  );
};

export default ReceiveProduct;
