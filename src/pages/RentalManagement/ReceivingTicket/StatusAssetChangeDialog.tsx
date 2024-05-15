import { Fragment, useContext, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { CustomDialogTransition, getObjKeysWithValues, yupSchema, serializedAsset, sidebarResource } from '../../../constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { FieldArray, Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CircularProgress, Typography } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export default function StatusChangeFieldDialog({ onClose, onSuccess, statusFields, assetData, referenceData, setAssetsData }) {
  const toastConfig = useContext(CustomToastContext);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const fields = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
    let fieldsData = fields?.data?.data;
    fieldsData = fieldsData.filter((d) => [...statusFields].includes(d.fieldData.fieldName));
    let fieldsDataForUpdate = fieldsData.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
    let values = {};
    let tempAssetData = [];
    for (const data of assetData) {
      let temp = getObjKeysWithValues(data, fieldsDataForUpdate);
      temp['_id'] = data?._id;
      temp['assetNumber'] = data?.assetNumber;
      tempAssetData.push(temp);
    }
    values['assetData'] = tempAssetData;
    setInitialData({
      fields: fieldsDataForUpdate,
      values: values
    });
  };
 
  const handleSubmit = (values) => {
    setSubmitting(true);
    let apiCalls = [];
    values?.assetData?.forEach((value) => {
      const matchedAsset = assetData?.find((e) => e._id === value._id);
      let updatedValue = {
        ...value,
        productCategory: matchedAsset.productCategory.optionValue,
        product: matchedAsset.product.optionValue,
        warehouse: matchedAsset.warehouseId,
        assetNumberType: matchedAsset.assetNumberType,
        status: matchedAsset.status
      };
      apiCalls.push(axiosInstance().put(`${serializedAsset.api}`, updatedValue));
    });
    Promise.all(apiCalls)
      .then(() => {
        setAssetsData(values?.assetData)
        onSuccess(referenceData);
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      fullScreen={fullScreen}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} enableReinitialize={true} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`Status Change Fields`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box className="form-box">
                    <FieldArray
                      name="assetData"
                      render={(arrayHelpers) => (
                        <div className="grid gap-[15px] sm:gap-[18px]">
                          {values?.assetData?.map((data, index) => (
                            <div
                              style={{ border: '1.5px solid var(--common-border-color)' }}
                              className=" flex flex-col rounded-[6px] pt-[17px] px-[23px] pb-[21px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)]"
                              key={index}
                            >
                              <div>
                                <span>
                                  <span className="text-[var(--primary-text)] font-semibold">Asset Number: </span>
                                  {data.assetNumber}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] md:gap-[25px] mt-[28px]">
                                {initialData?.fields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      values={data}
                                      errors={errors}
                                      touched={touched}
                                      disabled={field?.disableOnEdit || field?.isUneditable}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(`assetData.${index}.${field.fieldName}`, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      fields={initialData?.fields}
                                    />
                                  </Grid>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(14).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
