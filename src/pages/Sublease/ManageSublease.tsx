import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  sublease,
  setFieldsInAscendingOrder,
  SUBLEASE_STATUS,
  GenerateResourceLineNumber,
  sidebarResource,
  SUBLEASE_TYPE
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@mui/material';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isEqual } from 'lodash';
import moment from 'moment';

const ManageSublease = ({
  isClone = false,
  subleaseId = null,
  onClose,
  onSuccess,
  referenceType = null,
  referenceId = null,
  referenceData = null
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const ref = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [subleaseData, setSubleaseData] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.sublease}`)
      .then(({ data: { data } }) => {
        data = data.filter((d) => !['rentalJob'].includes(d.fieldData.fieldName));
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (subleaseId) {
          axiosInstance()
            .get(`${sublease.api}/` + subleaseId)
            .then(({ data: { data } }) => {
              setSubleaseData(data);
              if (isClone) {
                const { _id, createdBy, updatedBy, serialNumber, ...rest } = data;
                rest['subleaseName'] = GenerateResourceLineNumber(fieldsDataForCreate);
                rest['status'] = SUBLEASE_STATUS.new;
                fieldsDataForCreate = fieldsDataForCreate?.filter((obj) => !['actualStartDate', 'actualEndDate'].includes(obj.fieldName));
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
                });
                setLoading(false);
              } else {
                if (data?.actualStartDate && data?.actualStartDate === '') {
                  fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !['actualStartDate'].includes(obj.fieldName));
                }
                if (data?.actualEndDate && data?.actualEndDate === '') {
                  fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !['actualEndDate'].includes(obj.fieldName));
                }
                if (data?.canEdit === false) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['type', 'supplierAccount', 'warehouse', 'fromWarehouse']?.includes(e?.fieldName)) {
                      e.isUneditable = true;
                    }
                  });
                }
                if (data?.ticketCreated) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['toWarehouse']?.includes(e?.fieldName)) {
                      e.isUneditable = true;
                    }
                  });
                }
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          fieldsDataForCreate = fieldsDataForCreate?.filter((obj) => !['actualStartDate', 'actualEndDate'].includes(obj.fieldName));
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          createValues['subleaseName'] = GenerateResourceLineNumber(fieldsDataForCreate);
          if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
            createValues['currency'] = user.user?.brandCurrency;
          }
          if (referenceType === 'rentalJob') {
            createValues['rentalJob'] = referenceId;
            createValues['estimateStartDate'] = referenceData.estimateStartDate;
            createValues['estimateEndDate'] = referenceData.estimateEndDate;
            if (fieldsDataForCreate?.some((e) => e.fieldName === 'warehouse')) {
              createValues['warehouse'] = referenceData?.warehouse?.optionValue;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellName')) {
              createValues['wellName'] = referenceData?.wellName?.optionValue;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellNumber') && referenceData?.wellNumber) {
              if (referenceData?.wellNumber?.optionValue) {
                createValues['wellNumber'] = referenceData?.wellNumber?.optionValue;
              } else {
                createValues['wellNumber'] = referenceData?.wellNumber?.map((e) => e?.optionValue);
              }
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'afeNumber')) {
              createValues['afeNumber'] = referenceData?.afeNumber;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'processor')) {
              createValues['processor'] = referenceData?.processor?.optionValue;
            }
          }
          createValues['actualStartDate'] = '';
          createValues['actualEndDate'] = '';
          setInitialData({
            fields: fieldsDataForCreate,
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [subleaseId]);

  useEffect(() => {
    if (initialData.values['type']) {
      handleTypeChange(initialData.values['type']);
    } else {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (subleaseId && isClone === false) {
      values._id = subleaseId;
      axiosInstance()
        .put(`${sublease.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${sublease.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          if (referenceType) {
            const material: any = [];
            referenceData.material.forEach((d) => {
              const element: any = {};
              element.materialId = d._id;
              element.type = 'product';
              element.unit = d.unit;
              element.qty = d.assetsCount;
              element.parentId = null;
              element.estimateStartDate = referenceData?.estimateStartDate;
              element.estimateEndDate = referenceData?.estimateEndDate;
              element.actualStartDate = '';
              element.actualEndDate = '';
              material.push(element);
            });
            axiosInstance()
              .post(`${sublease.api}/productpackage/${data._id}`, { material })
              .then(() => {
                onSuccess();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          } else {
            history.push(`${sublease.api}/detail/${data._id}`);
          }
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  function validate(values) {
    const errors = {};
    let estimateStartDate = moment(values?.estimateStartDate);
    let estimateEndDate = moment(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    let actualStartDate = moment(values?.actualStartDate);
    let actualEndDate = moment(values?.actualEndDate);
    if (actualStartDate.format('YYYY-MM-DD') !== actualEndDate.format('YYYY-MM-DD')) {
      if (actualEndDate.diff(actualStartDate, 'days') <= 0) {
        errors['actualEndDate'] = 'Please enter valid actual end date';
      }
    }

    if (values?.type === SUBLEASE_TYPE.interCompany) {
      const fromWarehouseField = initialData?.fields?.find((e) => e.fieldName === 'fromWarehouse');
      if (!values?.fromWarehouse && fromWarehouseField) {
        errors['fromWarehouse'] = `${fromWarehouseField?.fieldLabel} is required`;
      }
      const toWarehouseField = initialData?.fields?.find((e) => e.fieldName === 'toWarehouse');
      if (!values?.toWarehouse && toWarehouseField) {
        errors['toWarehouse'] = `${toWarehouseField?.fieldLabel} is required`;
      }

      if (values?.fromWarehouse && values?.toWarehouse) {
        if (values?.fromWarehouse === values?.toWarehouse) {
          errors['toWarehouse'] = `${fromWarehouseField?.fieldLabel} and ${toWarehouseField?.fieldLabel} should not be same`;
        }
      }
    } else {
      const warehouseField = initialData?.fields?.find((e) => e.fieldName === 'warehouse');
      if (!values?.warehouse) {
        errors['warehouse'] = `${warehouseField?.fieldLabel} is required`;
      }
    }
    return errors;
  }

  const handleTypeChange = (type) => {
    if (type === SUBLEASE_TYPE.interCompany) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields.filter((e) => e.fieldName !== 'warehouse')));
    } else {
      setFormsData(setFieldsInAscendingOrder(initialData.fields.filter((d) => !['fromWarehouse', 'toWarehouse']?.includes(d.fieldName))));
    }
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
      {formsData && formsData.length ? (
        <Formik
          innerRef={ref}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, submitForm, setFieldValue }) => (
            <Fragment>
              <CustomDialogHeader
                title={subleaseId ? (isClone ? 'Clone' : `Update ${subleaseData?.subleaseName}`) : 'Create ' + resources?.sublease?.titleSingular}
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData.length > 0 &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                {field.fieldName === 'estimateStartDate' ? (
                                  <FormTypes
                                    {...field}
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
                                  />
                                ) : field.fieldName === 'estimateEndDate' ? (
                                  <FormTypes
                                    {...field}
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
                                  />
                                ) : ['actualStartDate', 'actualEndDate'].includes(field.fieldName) ? (
                                  <FormTypes
                                    {...field}
                                    fieldData={field}
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
                                  />
                                ) : (
                                  <FormTypes
                                    {...field}
                                    fieldData={field}
                                    disabled={Boolean(subleaseId) && field.disableOnEdit && !isClone}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fields={initialData.fields}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                      if (field.fieldName === 'type') {
                                        handleTypeChange(value);
                                        ['warehouse', 'fromWarehouse', 'toWarehouse']?.forEach((fieldName) => {
                                          if (initialData.fields?.find((ele) => ele.fieldName === fieldName)) {
                                            setFieldValue(fieldName, '');
                                          }
                                        });
                                      }
                                    }}
                                    required={
                                      ['fromWarehouse', 'toWarehouse']?.includes(field.fieldName) && values.type === SUBLEASE_TYPE.interCompany
                                        ? true
                                        : values.type === SUBLEASE_TYPE.vendor && field.fieldName === 'warehouse'
                                          ? true
                                          : field.required
                                    }
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                )}
                              </Grid>
                            ))}
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
                  id="dialog-cancel-button"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  id="dialog-save-button"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={loading}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
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

export default ManageSublease;
