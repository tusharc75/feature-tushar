import { Box, Button, Chip, CircularProgress, Dialog, TextField, Grid } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { camelCase, isEqual, update } from 'lodash';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import {
  CustomDialogTransition,
  FIELD_TICKET_STATUS,
  GenerateResourceLineNumber,
  RESOURCE_LABEL,
  cloneResourceData,
  fieldServiceOrder,
  serviceMaster,
  sidebarResource,
  restoreObjKeysWithValues
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { useHistory } from 'react-router-dom';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FaDiceOne } from 'react-icons/fa';
import { findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import moment from 'moment';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';
import InputField from 'src/components/Helpers/InputField';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const ManageFieldTicket = ({ onClose, onSuccess, isClone = false, id = null, referenceData = null, fullScreenView = false }) => {
  const {
    state: { user }
  }: any = useData();
  const { isOffline } = useContext(CustomOfflineContext);
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(fullScreenView || isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const history = useHistory();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [stepOptions, setStepOptions] = useState(referenceData?.steps || []);
  const [completeSteps, setCompleteSteps] = useState([]);
  const [showConfirmCloneDetailsDialog, setShowConfirmCloneDetailsDialog] = useState(false)
  const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
      isStepDataSet.current = true;
      const ignoreField = ['currency', 'owner', 'pdfTemplate'];
      if (referenceData) {
        ignoreField.push('fieldServiceOrderNumber');
      }
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields, ignoreField)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

  const fetchServiceSteps = (serviceId) => {
    if (!isOffline) {
      axiosInstance()
        .get(`${serviceMaster.api}/steps/${serviceId}`)
        .then(({ data: { data } }) => {
          const steps = data?.map((d) => ({ optionLabel: d.stepName, optionValue: d._id }));
          setStepOptions(steps || []);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      const steps = referenceData?.steps || [];
      setStepOptions(steps);
    }
  };

  const fetchFields = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.fieldTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldTicket}`);
        data = response?.data?.data;
      }
      const allFields = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

      const fieldsDataForCreate = data.filter((obj) => obj.isCreate && !['quotation', 'invoice'].includes(obj?.fieldData?.fieldName)).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate && !['quotation', 'invoice'].includes(obj?.fieldData?.fieldName)).map((d: any) => d.fieldData);

      if (id) {
        let mainData;
        if (isOffline) {
          mainData = await findOne(objectStore.fieldTicket, id);
        } else {
          const response = await axiosInstance().get(`${routes?.fieldTicket?.path}/${id}`);
          mainData = response?.data?.data;
        }
        let fields = fieldsDataForUpdate;
        let tempData = mainData;
        if (isClone) {
          fields = fieldsDataForCreate;
          const { fieldTicketNumber, ...rest } = mainData;
          rest.fieldTicketNumber = GenerateResourceLineNumber(fieldsDataForCreate);
          rest.status = FIELD_TICKET_STATUS.new;
          setCloneHeading(fieldTicketNumber);
          tempData = rest;
        }
        else {
          if (referenceData) {
            fields?.forEach((e) => {
              if (e.fieldName === 'fieldServiceOrder') {
                e.disableOnEdit = true;
                e.isUneditable = true;
              }
            });
          }
        }
        tempData?.service && fetchServiceSteps(tempData?.service?.optionValue);
        setCompleteSteps(tempData?.steps || []);
        setInitialData({
          fields: fields,
          values: isClone ? { ...getObjKeysWithValues(tempData, fields, true, user) } : getObjKeysWithValues(tempData, fields)
        });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        tempInitialData['fieldTicketNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (referenceData) {
          for (const key in referenceData) {
            if (referenceData[key] && allFields?.some((e) => e.fieldName === key)) {
              tempInitialData[key] = referenceData[key];
            }
          }
          fieldsDataForCreate?.forEach((e) => {
            if (e.fieldName === 'fieldServiceOrder') {
              e.disableOnEdit = true;
              e.isUneditable = true;
            }
          });
        }
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          tempInitialData['currency'] = user.user?.brandCurrency;
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    values.steps = completeSteps;
    if (isOffline) {
      setSubmitting(true);
      const _id: any = id || Math.floor(Math.random() * 1000000).toString();
      const data: any = restoreObjKeysWithValues(values, initialData.fields);
      data._id = _id;
      await insertUpdate(objectStore.fieldTicket, _id, data);
      const offlineData = await findOne(objectStore.offlineDataSync, _id);
      if (/^[0-9a-fA-F]{24}$/.test(_id)) {
        await insertUpdate(objectStore.offlineDataSync, _id, { type: 'fieldTicket', data: { ...(offlineData?.data), ...values, _id, offlineSyncStatus: 'update' } });
      } else {
        await insertUpdate(objectStore.offlineDataSync, _id, { type: 'fieldTicket', data: { ...(offlineData?.data), ...values, _id, offlineSyncStatus: 'new' } });
      }
      onSuccess();
      setSubmitting(false);
    }
    else if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes.fieldTicket?.path}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
    else {
      axiosInstance()
        .post(`${routes.fieldTicket?.path}`, values)
        .then(({ data }) => {
          setLoading(false);
          if (referenceData) {
            onSuccess(data.data);
          } else {
            history.push(`${routes.fieldTicket.path}/detail/${data?.data?._id}`);
          }
          setSubmitting(true);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  function validate(values) {
    const errors = {};
    let estimateStartDate = moment(values?.estimateStartDate);
    let estimateEndDate = moment(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid end date';
    }
    return errors;
  }

  const fetchFieldServiceOrderData = async (fieldServiceOrderId) => {

    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldServiceOrder}`);
    const fieldServiceOrderFields = response?.data?.data;

    const { data: { data } } = await axiosInstance().get(`${fieldServiceOrder.api}/${fieldServiceOrderId}`);

    const referenceData: any = cloneResourceData(fieldServiceOrderFields?.map((e) => e?.fieldData), initialData?.fields, data, user.user?.brandCurrency);

    const tempInitialData = getObjKeys('', initialData?.fields);
    tempInitialData['fieldTicketNumber'] = GenerateResourceLineNumber(initialData?.fields);
    tempInitialData['fieldServiceOrder'] = fieldServiceOrderId;
    if (initialData?.fields?.some((e) => e.fieldName === 'currency')) {
      tempInitialData['currency'] = user.user?.brandCurrency;
    }
    for (const key in referenceData) {
      tempInitialData[key] = referenceData[key];
    }
    setInitialData({
      fields: initialData?.fields,
      values: tempInitialData
    });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik
          validate={validate}
          initialValues={initialData.values}
          enableReinitialize={true}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${id
                  ? isClone
                    ? `Clone - ${cloneHeading}`
                    : `Update ${initialData.values?.fieldTicketNumber ? `(${initialData.values?.fieldTicketNumber})` : ''}`
                  : `Create ${routes?.fieldTicket?.title}`
                  }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                      if (name === 'wellNumber') {
                        if (initialData?.fields.find((e) => e?.fieldName === 'numberOfWells')) {
                          if (value) {
                            setFieldValue('numberOfWells', value?.length);
                          } else {
                            setFieldValue('numberOfWells', 0);
                          }
                        }
                      }
                      else if (name === 'fieldServiceOrder') {
                        if (value) {
                          fetchFieldServiceOrderData(value);
                        }
                      }
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.fieldTicket}
                    referenceId={id || null}
                  />
                </Form>
                {initialData?.fields?.find((f) => f?.fieldName === 'service' && f?.lookupResource === RESOURCE_LABEL.serviceMaster) && (
                  <>
                    <div className={'detail-box-content'}>
                      <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                      <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Step Information</h2>
                    </div>
                    <Box marginY={2} />
                    <Autocomplete
                      multiple
                      id="Steps Performed"
                      options={stepOptions?.map((e) => e?.optionLabel) || []}
                      defaultValue={completeSteps?.map((e) => e?.optionLabel) || []}
                      freeSolo
                      getOptionLabel={(option: any) => option}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                      }
                      onChange={(event, newValue) => {
                        const updatedValues = newValue?.map((e) => {
                          const step = referenceData?.steps?.find((step) => step?.optionLabel === e);
                          if (step) {
                            return {
                              optionLabel: step?.optionLabel,
                              optionValue: step?.optionValue
                            };
                          } else {
                            return {
                              optionLabel: e,
                              optionValue: null
                            };
                          }
                        });
                        setCompleteSteps(updatedValues);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} variant="outlined" label="Steps Performed" size="small" placeholder="Steps Performed" />
                      )}
                    />
                  </>
                )}
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
                  id="dialog-save-button"
                  disabled={loading || submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={() => {
                    if (id && isClone) {
                      setShowConfirmCloneDetailsDialog(true)
                    } else {
                      submitForm()
                    }
                  }}
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
                    if (id && isClone) {
                      setShowConfirmCloneDetailsDialog(true)
                    } else {
                      submitForm()
                    }
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
              {showConfirmCloneDetailsDialog && (
                <ConfirmationDialog
                  open={true}
                  message="Please confirm this if you want to clone  details ?"
                  onOk={() => {
                    setFieldValue('fieldTicketId', id)
                    setShowConfirmCloneDetailsDialog(false)
                    submitForm()
                  }}
                  onClose={() => {
                    setShowConfirmCloneDetailsDialog(false)
                    submitForm()
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

export default ManageFieldTicket;
