import { Fragment, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { CustomDialogTransition, getObjKeysWithValues, yupSchema, sidebarResource } from '../../../constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { FieldArray, Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CircularProgress } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';

export default function AssetDetailsChangeDialog({ onClose, onSuccess, statusPolicy, assetData, setAssetsData }) {

  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [decimalFields, setDecimalFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const fields = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
    let fieldsData = fields?.data?.data;
    fieldsData = fieldsData.filter((d) => statusPolicy?.fields?.includes(d.fieldData.fieldName));
    let fieldsDataForUpdate = fieldsData.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
    let values = {};
    let tempAssetData = [];
    const decimalField = [];
    for (const data of assetData) {
      let initialValues = getObjKeysWithValues(data, fieldsDataForUpdate);
      if (statusPolicy?.sumDecimalField) {
        fieldsDataForUpdate?.forEach((e) => {
          if (e?.type === 'decimal') {
            decimalField.push(e.fieldName)
            initialValues[`${e.fieldName}_orignal`] = initialValues[e.fieldName];
            initialValues[e.fieldName] = 0;
          }
        })
      }
      initialValues['_id'] = data?._id;
      initialValues['assetNumber'] = data?.assetNumber;
      tempAssetData.push(initialValues);
    }
    values['assetData'] = tempAssetData;
    setDecimalFields(decimalField)
    setInitialData({
      fields: fieldsDataForUpdate,
      values: values
    });
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    const data = [];
    values?.assetData?.forEach((ele) => {
      const obj: any = { _id: ele._id }
      statusPolicy?.fields?.forEach((fieldName) => {
        if (statusPolicy?.sumDecimalField && decimalFields?.includes(fieldName)) {
          obj[fieldName] = parseFloat(ele[fieldName] || 0) + parseFloat(ele[`${fieldName}_orignal`] || 0)
        }
        else {
          obj[fieldName] = ele[fieldName]
        }
      })
      data.push(obj)
    })
    setAssetsData(data)
    onSuccess();
    setSubmitting(false);
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
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={routes.serializedAsset.title}
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
                                <span className="text-[var(--primary-text)] font-semibold">{data.assetNumber}</span>
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
