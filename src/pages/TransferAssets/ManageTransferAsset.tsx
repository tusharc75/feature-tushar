import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, transferAsset, setFieldsInAscendingOrder } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues, RESOURCE_LABEL } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';

const ManageTransferAsset = ({ isClone = false, transferAssetId = null, onClose, onSuccess, number = "" }) => {
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (transferAssetId) {
          axiosInstance()
            .get(`${transferAsset.api}/` + transferAssetId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, serialNumber, ...rest } = data;

                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(rest, fieldsDataForCreate)
                });
              } else {
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues = getObjKeys('', fieldsDataForCreate);
          setAllFields(fieldsDataForCreate);
          setInitialData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [transferAssetId]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (transferAssetId && isClone === false) {
      values._id = transferAssetId;
      axiosInstance()
        .put(`${transferAsset.api}`, values)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${transferAsset.api}`, values)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess(data);
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const isFieldNotTouched = (initialData, values) => {
    return (
      Object.values(simplifyValues(initialData.values, initialData?.fields[0]?.sectionFields || [])).toString() ===
      Object.values(simplifyValues(values, initialData?.fields[0]?.sectionFields || [])).toString()
    );
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(allFields)} onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm, setFieldError }) => (
            <Fragment>
              <CustomDialogHeader
                title={transferAssetId ? (isClone ? 'Clone' : `Update ${RESOURCE_LABEL.transferAsset} (${number})`) : 'Create ' + RESOURCE_LABEL.transferAsset}
                onClose={() => {
                  if (isFieldNotTouched(initialData, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {initialData.fields.length > 0 &&
                    initialData.fields.map((form, i) => (
                      <div key={i}>
                        <h2 className="form-label-style">{form.name}</h2>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) =>
                              field.fieldName === 'transferToPlant' ? (
                                values?.transferType.includes('Internal') ? (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    <FormTypes
                                      isNew={Boolean(transferAssetId)}
                                      {...field}
                                      disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                      values={values}
                                      errors={{ ...errors }}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option.filter(val => val.optionValue !== values?.transferFromPlant) ?? []}
                                      setFieldValue={(name, value) => {
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value);
                                      }}
                                      required={values?.transferType.includes('Internal')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                ) : null
                              ) : field.fieldName === 'transferToSupplier' ? (
                                values?.transferType.includes('Supplier') ? (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    <FormTypes
                                      isNew={Boolean(transferAssetId)}
                                      {...field}
                                      disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value);
                                      }}
                                      required={values?.transferType.includes('Supplier')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                ) : null
                              ) : field.fieldName === 'transferToCustomer' ? (
                                values?.transferType.includes('Customer') ? (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    <FormTypes
                                      isNew={Boolean(transferAssetId)}
                                      {...field}
                                      disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                      values={values}
                                      errors={{ ...errors }}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value);
                                      }}
                                      required={values?.transferType.includes('Customer')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                ) : null
                              ) : field.fieldName === 'transferType' ? (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    isNew={Boolean(transferAssetId)}
                                    {...field}
                                    disabled={Boolean(transferAssetId)}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    onChange={(e, val) => {
                                      if (val?.optionLabel.includes('Supplier')) {
                                        setFieldError("transferToSupplier", 'Transfer To Supplier is required');
                                      } else if (val?.optionLabel.includes('Internal')) {
                                        setFieldError("transferToPlant", 'Transfer To Plant is required');
                                      } else {
                                        setFieldError("transferToCustomer", 'Transfer To Customer is required');
                                      }
                                      setFieldValue(field.fieldName, val?.optionValue ?? "");
                                    }}
                                  />
                                </Grid>
                              ) : (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    isNew={Boolean(transferAssetId)}
                                    {...field}
                                    disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      // handleValuesChange({ [name]: value })
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                </Grid>
                              )
                            )}
                          </Grid>
                        </Box>
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isFieldNotTouched(initialData, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton loading={isSubmitting} disabled={isSubmitting} variant="contained" color="primary" type="submit" onClick={submitForm}>
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>

              {showConfirmDialog ? (
                <ConfirmCancelDialog
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
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageTransferAsset;
