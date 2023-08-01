import { Box, Button, Chip, CircularProgress, Dialog, TextField } from '@material-ui/core';
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
import InputField from 'src/components/Helpers/InputField';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, GenerateResourceLineNumber, RESOURCE_LABEL, generateUniqueIdOnly, serviceMaster, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { useHistory } from 'react-router-dom';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FaDiceOne } from 'react-icons/fa';
import { findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import moment from 'moment';

const ManageFieldTicket = ({ onClose, onSuccess, isClone = false, id = null, referenceData = null, fullScreenView = false, renderedFrom = '' }) => {
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

  useEffect(() => {
    fetchFields();
    referenceData?.service && fetchServiceSteps(referenceData?.service);
  }, []);

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
        data = await findOne(objectStore.resource, objectStore.fieldTicket);
      } else {
        const response = await axiosInstance().get('/field?resource=Field Ticket');
        data = response?.data?.data;
      }
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

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
          setCloneHeading(fieldTicketNumber);
          tempData = rest;
        } else {
          if (referenceData && renderedFrom === `${camelCase(routes?.fieldServiceOrder.title)}_grid-0`) {
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
          values: getObjKeysWithValues(tempData, fields)
        });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        tempInitialData['fieldTicketNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (referenceData) {
          if (renderedFrom === `${camelCase(routes?.fieldServiceOrder.title)}_grid-0`) {
            fieldsDataForCreate?.forEach((e) => {
              if (e.fieldName === 'fieldServiceOrder') {
                tempInitialData['fieldServiceOrder'] = referenceData?.fieldServiceOrder;
                e.disableOnEdit = true;
                e.isUneditable = true;
              }
            });
            if (referenceData?.warehouse && fieldsDataForCreate?.some((e) => e.fieldName === 'warehouse')) {
              tempInitialData['warehouse'] = referenceData?.warehouse;
            }
            if (referenceData?.customerAccount && fieldsDataForCreate?.some((e) => e.fieldName === 'customerAccount')) {
              tempInitialData['customerAccount'] = referenceData?.customerAccount;
            }
            if (referenceData?.billingAddress && fieldsDataForCreate?.some((e) => e.fieldName === 'billingAddress')) {
              tempInitialData['billingAddress'] = referenceData?.billingAddress;
            }
            if (referenceData?.shippingAddress && fieldsDataForCreate?.some((e) => e.fieldName === 'shippingAddress')) {
              tempInitialData['shippingAddress'] = referenceData?.shippingAddress;
            }
            if (referenceData?.estimateStartDate && fieldsDataForCreate?.some((e) => e.fieldName === 'estimateStartDate')) {
              tempInitialData['estimateStartDate'] = referenceData?.estimateStartDate;
            }
            if (referenceData?.estimateEndDate && fieldsDataForCreate?.some((e) => e.fieldName === 'estimateEndDate')) {
              tempInitialData['estimateEndDate'] = referenceData?.estimateEndDate;
            }
            if (referenceData?.wellName && fieldsDataForCreate?.some((e) => e.fieldName === 'wellName')) {
              tempInitialData['wellName'] = referenceData?.wellName;
            }
            if (referenceData?.wellNumber && fieldsDataForCreate?.some((e) => e.fieldName === 'wellNumber')) {
              tempInitialData['wellNumber'] = referenceData?.wellNumber;
            }
            if (referenceData?.currency && fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
              tempInitialData['currency'] = referenceData?.currency;
            }
            if (referenceData?.technician && fieldsDataForCreate?.some((e) => e.fieldName === 'technician')) {
              tempInitialData['technician'] = referenceData?.technician;
            }
            if (referenceData?.service && fieldsDataForCreate?.some((e) => e.fieldName === 'service')) {
              tempInitialData['service'] = referenceData?.service;
            }
            if (referenceData?.collaborator && fieldsDataForCreate?.some((e) => e.fieldName === 'collaborator')) {
              tempInitialData['collaborator'] = referenceData?.collaborator;
            }
          }
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

  const restoreObjKeysWithValues = (dataObj: object, fields: any[]) => {
    const obj = { ...dataObj };
    fields.forEach((field) => {
      if (field.type === 'dropDown' && field.lookup) {
        let filter: any = field?.option?.filter((e) => e.optionValue === dataObj[field.fieldName]);
        if (filter.length) {
          obj[field.fieldName] = {
            optionLabel: filter[0].optionLabel,
            optionValue: filter[0].optionValue
          };
        }
      } else if (field.type === 'multiSelect') {
        if (dataObj[field.fieldName] && dataObj[field.fieldName].length) {
          let option = [];
          dataObj[field.fieldName].forEach((e: any) => {
            option.push({
              optionLabel: e,
              optionValue: e
            });
          });
          obj[field.fieldName] = option;
        }
      } else if (field.type === 'date') {
        obj[field.fieldName] = moment(dataObj[field.fieldName]).format('YYYY-MM-DD');
      } else {
        obj[field.fieldName] = dataObj[field.fieldName];
      }
    });
    return obj;
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    values.steps = completeSteps;
    if (isOffline) {
      setSubmitting(true);
      const _id: any = id || Math.floor(Math.random() * 1000000).toString();
      const formattedValue: any = restoreObjKeysWithValues(values, initialData.fields);
      formattedValue._id = _id;
      await insertUpdate(objectStore.fieldTicket, _id, formattedValue);
      if (id) {
        await insertUpdate(objectStore.offlineDataSync, _id, { type: 'fieldTicket', data: { ...values, _id, offlineSyncStatus: 'update' } });
      } else {
        await insertUpdate(objectStore.offlineDataSync, _id, { type: 'fieldTicket', data: { ...values, _id, offlineSyncStatus: 'new' } });
      }

      onSuccess();
      setSubmitting(false);
    } else if (id && !isClone) {
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
    } else {
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
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
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
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
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
                  disabled={loading || submitting}
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
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageFieldTicket;
