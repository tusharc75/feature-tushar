import { useState, useEffect, Fragment, useContext, useRef, FC } from 'react';
import { Formik, Form } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  transferAsset,
  setFieldsInAscendingOrder,
  GenerateResourceLineNumber,
} from 'src/constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import { useData } from 'src/StateProvider/Provider';
import { FaDiceOne } from 'react-icons/fa';
import { isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

interface Props {
  isClone?: boolean;
  transferAssetId?: any;
  onClose?: any;
  onSuccess?: any;
  number?: string;
  referenceType?: string;
  referenceId?: string;
  referenceData?: any;
  assets?: any;
}

const ManageTransferAsset: FC<Props> = (props) => {
  const {
    state: { user, resources }
  }: any = useData();
  const {
    isClone = false,
    transferAssetId = null,
    onClose,
    onSuccess,
    number = '',
    referenceType = null,
    referenceId = null,
    referenceData = null,
    assets = null
  } = props;

  const toastConfig = useContext(CustomToastContext);
  const initialRender = useRef(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState(null);

  const [plantsToCategoryOptions, setPlantsToCategoryOptions] = useState([]);
  const [plantShipToOptions, setPlantShipToOptions] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('');

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [createDateMin, setCreateDateMin] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        data = data.filter((e) => !['rentalJob', 'repairOrder']?.includes(e?.fieldData?.fieldName));

        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        const plantsToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transfertoPlant')?.fieldData.option;
        const plantToOptions = data.find((obj) => obj?.fieldData.fieldName === 'plantShipTo')?.fieldData.option;

        setPlantsToCategoryOptions(plantsToOptions);
        setPlantShipToOptions(plantToOptions);

        if (transferAssetId) {
          axiosInstance()
            .get(`${transferAsset.api}/` + transferAssetId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, entity, transferAssetNumber, ...rest } = data;
                let oldValues = { ...rest };
                oldValues.transferAssetNumber = GenerateResourceLineNumber(fieldsDataForCreate);
                oldValues.status = 'New';
                setCloneHeading(transferAssetNumber);
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(oldValues, fieldsDataForCreate, true, user)
                });
              } else {
                if (data?.canEdit === false) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['transferType', 'transferFromPlant']?.includes(e?.fieldName)) {
                      e.isUneditable = true;
                      e.disableOnEdit = true;
                    }
                  });
                }
                if (data?.ticketCreated) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (
                      ['transfertoPlant', 'plantShipTo', 'transfertoSupplier', 'supplierShipTo', 'transfertoCustomer', 'customerShipTo']?.includes(
                        e?.fieldName
                      )
                    ) {
                      e.isUneditable = true;
                      e.disableOnEdit = true;
                    }
                  });
                }
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
          setAllFields(fieldsDataForUpdate);
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          setAllFields(fieldsDataForCreate);
          createValues.transferAssetNumber = GenerateResourceLineNumber(fieldsDataForCreate);
          if (referenceType && referenceData) {
            for (const key in referenceData) {
              if (referenceData[key] && fieldsDataForCreate?.some((e) => e.fieldName === key)) {
                createValues[key] = referenceData[key];
              }
            }
            if (referenceType === 'Rental Job') {
              fieldsDataForCreate?.forEach((e) => {
                if (e.fieldName === 'transfertoPlant') {
                  const plantAddress = e?.option?.filter((e) => e.optionValue === referenceData?.transfertoPlant);
                  if (plantAddress.length) {
                    createValues['plantShipTo'] = plantAddress[0].address;
                  }
                }
                if (['transferFromPlant', 'transfertoPlant', 'plantShipTo', 'transferType']?.includes(e.fieldName)) {
                  e.disableOnEdit = true;
                  e.isUneditable = true;
                }
              });
              createValues['rentalJob'] = referenceId;
            }
            if (referenceType === 'Repair Order') {
              fieldsDataForCreate?.forEach((e) => {
                if (['transferFromPlant', 'transferType']?.includes(e.fieldName)) {
                  e.disableOnEdit = true;
                  e.isUneditable = true;
                }
              });
              createValues['repairOrder'] = referenceId;
            }
          }
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

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
    } else {
      let fields = initialData.fields;
      if (fields.length > 0 && formValues) {
        fields = fields.map((field) => {
          const sectionFields = field.sectionFields.map((_f) => {
            if (_f.fieldName === 'transfertoPlant' || _f.fieldName === 'plantShipTo') {
              if (formValues.transferType === 'Internal') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            if (_f.fieldName === 'transfertoCustomer' || _f.fieldName === 'customerShipTo') {
              if (formValues.transferType === 'External Customer') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            if (_f.fieldName === 'transfertoSupplier' || _f.fieldName === 'supplierShipTo') {
              if (formValues.transferType === 'External Supplier') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            return _f;
          });
          return {
            ...field,
            sectionFields
          };
        });
      }
      setInitialData({ ...initialData, fields });
    }
  }, [formValues]);

  useEffect(() => {
    if (allFields?.some((e) => e?.fieldName === 'createDate') && assets && assets?.length) {
      findValidationDate();
    }
  }, [allFields, assets]);

  const findValidationDate = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/rental-management/assets-last-date`, { assets: assets, last: 1 });
    var lastDate: any = new Date();
    if (data?.date) {
      lastDate = new Date(data?.date);
      lastDate.setHours(0, 0, 0);
    }
    setCreateDateMin(lastDate);
  };

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

  const validate = (values) => {
    const errors = {};
    if (values?.transferType === 'Internal') {
      if (values?.transferFromPlant === values?.transfertoPlant) {
        errors['transfertoPlant'] = 'Transfer from and to plant can not be same';
      }
    }
    if (createDateMin && allFields?.find((e) => e?.fieldName === 'createDate')) {
      if (!dayjs(values['createDate']).isSameOrAfter(dayjs(createDateMin))) {
        errors['createDate'] = `Please select valid date`;
      }
    }
    return errors;
  };

  return (
    <Dialog
      disableEnforceFocus
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
        <Formik
          innerRef={(ref) => {
            if (ref) {
              setFormValues(ref.values);
            } else {
              setFormValues(null);
            }
          }}
          validate={validate}
          validateOnMount
          initialValues={initialData.values}
          validationSchema={yupSchema(allFields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  transferAssetId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${resources?.transferAsset?.titleSingular} (${number})`
                    : 'Create ' + resources?.transferAsset?.titleSingular
                }
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
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
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container alignItems="center">
                            {form.sectionFields.map((field, index2) =>
                              field.fieldName === 'transfertoPlant' || field.fieldName === 'plantShipTo' ? (
                                values?.transferType.includes('Internal') && (
                                  <Fragment key={index2}>
                                    {field.fieldName === 'transfertoPlant' && (
                                      <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                        <FormTypes
                                          {...field}
                                          disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                          values={values}
                                          hidelookupAddButton={true}
                                          errors={errors}
                                          fieldData={field}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                            const address = field.option?.find((_d: any) => _d?.optionValue === value)?.address ?? '';
                                            setFieldValue('plantShipTo', address);
                                          }}
                                          required={values?.transferType.includes('Internal')}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      </Grid>
                                    )}
                                    {field.fieldName === 'plantShipTo' && (
                                      <Grid key={index2} size={{ xs: 12, sm: 6, md: 6 }}>
                                        <FormTypes
                                          {...field}
                                          disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          fieldData={field}
                                          hidelookupAddButton={true}
                                          type={field.type}
                                          options={
                                            plantShipToOptions.filter(
                                              (plant) =>
                                                plant?.optionValue ===
                                                plantsToCategoryOptions.find((p) => p.optionValue === values?.transfertoPlant)?.address
                                            ) ?? []
                                          }
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={values?.transferType.includes('Internal')}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      </Grid>
                                    )}
                                  </Fragment>
                                )
                              ) : field.fieldName === 'transfertoSupplier' || field.fieldName === 'supplierShipTo' ? (
                                values?.transferType.includes('Supplier') && (
                                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      fieldData={field}
                                      fields={allFields}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={values?.transferType.includes('Supplier')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                )
                              ) : field.fieldName === 'transfertoCustomer' || field.fieldName === 'customerShipTo' ? (
                                values?.transferType.includes('Customer') && (
                                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      fieldData={field}
                                      fields={allFields}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={values?.transferType.includes('Customer')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                )
                              ) : field.fieldName === 'transferType' ? (
                                <Grid key={index2} size={{ xs: 12, sm: 6, md: 6 }}>
                                  <FormTypes
                                    {...field}
                                    disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
                                    fields={allFields}
                                    type={field.type}
                                    options={field.option}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    onChange={(e, val) => {
                                      setFieldValue(field.fieldName, val?.optionValue ?? '');
                                      if (allFields?.some((e) => e.fieldName === 'transfertoCustomer')) {
                                        setFieldValue('transfertoCustomer', '');
                                      }
                                      if (allFields?.some((e) => e.fieldName === 'transfertoSupplier')) {
                                        setFieldValue('transfertoSupplier', '');
                                      }
                                      if (allFields?.some((e) => e.fieldName === 'transfertoPlant')) {
                                        setFieldValue('transfertoPlant', '');
                                      }
                                      if (allFields?.some((e) => e.fieldName === 'customerShipTo')) {
                                        setFieldValue('customerShipTo', '');
                                      }
                                      if (allFields?.some((e) => e.fieldName === 'supplierShipTo')) {
                                        setFieldValue('supplierShipTo', '');
                                      }
                                      if (allFields?.some((e) => e.fieldName === 'plantShipTo')) {
                                        setFieldValue('plantShipTo', '');
                                      }
                                    }}
                                  />
                                </Grid>
                              ) : field.fieldName === 'transferFromPlant' ? (
                                <Grid key={index2} size={{ xs: 12, sm: 6, md: 6 }}>
                                  <FormTypes
                                    {...field}
                                    disabled={Boolean(transferAssetId) && field.disableOnEdit}
                                    values={values}
                                    hidelookupAddButton={true}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
                                    type={field.type}
                                    options={field.option}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                      const address = field.option?.find((_d: any) => _d?.optionValue === value)?.address ?? '';
                                      if (address === values?.plantShipTo) {
                                        setFieldValue('plantShipTo', '');
                                        setFieldValue('transfertoPlant', '');
                                      }
                                    }}
                                  />
                                </Grid>
                              ) : field.fieldName === 'createDate' ? (
                                <Grid key={index2} size={{ xs: 12, sm: 6, md: 6 }}>
                                  <FormTypes
                                    {...field}
                                    fieldData={field}
                                    fields={initialData.fields}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    {...(createDateMin ? { minDate: createDateMin } : {})}
                                  />
                                </Grid>
                              ) : (
                                <Grid key={index2} size={{ xs: 12, sm: 6, md: 6 }}>
                                  <FormTypes
                                    {...field}
                                    disabled={
                                      (Boolean(transferAssetId) && field.disableOnEdit) ||
                                      (field.fieldName === 'transferAssetNumber' && field?.isSystemGenerate)
                                    }
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
                                    fields={allFields}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
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
                <ThemeButton
                  buttonType="transparent"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton isLoading={isSubmitting} disabled={isSubmitting} buttonType="theme" onClick={submitForm}>
                  {' '}
                  Save
                </ThemeButton>
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
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageTransferAsset;
