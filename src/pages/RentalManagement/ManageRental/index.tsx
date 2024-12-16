import { Box, Button, Grid } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomButton from '../../../components/Helpers/CustomButton';
import FormTypes from '../../../components/Helpers/FormTypes';
import routes from '../../../components/Helpers/Routes';
import {
  CustomDialogTransition,
  GenerateResourceLineNumber,
  getObjKeys,
  getObjKeysWithValues,
  RENTAL_STATUS,
  rentalManagement,
  setFieldsInAscendingOrder,
  yupSchema
} from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';

const ManageRentalManagementDialog = ({
  isClone,
  rentalManagementId,
  rentalManagementData = null,
  onClose,
  onSuccess,
  open,
  referenceData = null,
  isDisableCustomerAccount = false,
  isAutomated = false
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);

  const [rentalData, setRentalData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [rentalDetails, setRentalDetails] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(rentalData.fields));
  }, [rentalData.fields]);

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [rentalManagementId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Rental Management');
      fieldData = response?.data?.data;

      fieldData = fieldData?.filter((e) => !['quotation'].includes(e?.fieldData?.fieldName));

      var fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      var fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (rentalManagementId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${rentalManagement.api}/` + rentalManagementId);
          data = response?.data?.data;
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, rentalJobName, updatedBy, ...rest } = data;
            rest['status'] = RENTAL_STATUS.new;
            rest['rentalJobName'] = GenerateResourceLineNumber(fieldsDataForCreate);
            fieldsDataForCreate = fieldsDataForCreate?.filter(
              (obj) => !['actualStartDate', 'actualEndDate', 'actualJobDuration'].includes(obj.fieldName)
            );
            setCloneHeading(rentalJobName);
            setRentalData({
              fields: fieldsDataForCreate,
              initialValues: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user), estimateEndDate: null }
            });
            setLoading(false);
          } else {
            setRentalDetails(data);
            if (data?.canEdit === false) {
              fieldsDataForUpdate?.forEach((e) => {
                if (['customerAccount', 'parentAccount']?.includes(e?.fieldName)) {
                  e.isUneditable = true;
                }
              });
            }
            if (data?.actualStartDate === '' || !data?.actualStartDate) {
              fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !['actualStartDate'].includes(obj.fieldName));
            }
            if (data?.actualEndDate === '' || !data?.actualEndDate) {
              fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !['actualEndDate'].includes(obj.fieldName));
            }
            setRentalData({
              fields: fieldsDataForUpdate,
              initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        fieldsDataForCreate = fieldsDataForCreate?.filter(
          (obj) => !['actualStartDate', 'actualEndDate', 'actualJobDuration'].includes(obj.fieldName)
        );
        let initialData = getObjKeys('', fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          initialData['currency'] = user.user?.brandCurrency;
        }
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'estimateEndDate')) {
          initialData['estimateEndDate'] = null;
        }
        initialData['rentalJobName'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (referenceData) {
          if (fieldsDataForCreate?.some((e) => e.fieldName === 'warehouse')) {
            initialData['warehouse'] = referenceData?.warehouse;
          }
        }
        setRentalData({
          fields: fieldsDataForCreate,
          initialValues: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);

    if (rentalManagementId && isClone === false) {
      values._id = rentalManagementId;
      axiosInstance()
        .put(`${rentalManagement.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${rentalManagement.api}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          if (referenceData || isAutomated) {
            onSuccess(data);
          } else {
            history.push(`${routes.rentalManagementDetail.path}/${data?._id}`);
            setLoading(false);
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
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={open}
    >
      {rentalData.fields.length ? (
        <Formik
          initialValues={rentalData.initialValues}
          validationSchema={yupSchema(rentalData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  !rentalManagementId
                    ? `Create ${resources?.rentalManagement?.titleSingular}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${rentalManagementData?.rentalJobName}`}`
                }
                onClose={() => {
                  if (isEqual(rentalData.initialValues, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData &&
                    formsData.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    {field.fieldName === 'estimateStartDate' ? (
                                      <FormTypes
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        fieldData={field}
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
                                        fieldData={field}
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
                                    ) : field.fieldName === 'actualStartDate' ? (
                                      <FormTypes
                                        {...field}
                                        disabled={values['status'] === RENTAL_STATUS.readyToInvoice ? false : true}
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
                                    ) : field.fieldName === 'actualEndDate' ? (
                                      <FormTypes
                                        {...field}
                                        disabled={values['status'] === RENTAL_STATUS.readyToInvoice ? false : true}
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
                                        rentalManagementId={rentalManagementId}
                                        {...field}
                                        fieldData={field}
                                        disabled={
                                          field.fieldName === 'currency'
                                            ? rentalDetails && rentalDetails?.material?.length
                                              ? true
                                              : false
                                            : field.fieldName === 'warehouse'
                                              ? rentalDetails && rentalDetails?.productInventory?.length
                                                ? true
                                                : false
                                              : field.fieldName === 'customerAccount'
                                                ? isDisableCustomerAccount
                                                : rentalManagementId && field.disableOnEdit && !isClone
                                        }
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
                                        imageOrFileUploadCompletePercentage={
                                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                            ? (completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                              }
                                            : null
                                        }
                                        fields={rentalData.fields}
                                      />
                                    )}
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        )
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (isEqual(rentalData.initialValues, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  id="dialog-save-button"
                  variant="contained"
                  color="primary"
                  disabled={uploadingImageOrFileProgress > 0 || loading || (!isClone && isEqual(rentalData.initialValues, values))}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    submitForm();
                  }}
                  close={() => setShowConfirmDialog(false)}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              )}
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

export default ManageRentalManagementDialog;
