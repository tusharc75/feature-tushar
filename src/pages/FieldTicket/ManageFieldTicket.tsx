import { Box, Button, Chip, CircularProgress, Dialog, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
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
import { CustomDialogTransition, generateUniqueIdOnly, isFieldNotTouched, serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FaDiceOne } from 'react-icons/fa';

const ManageFieldTicket = ({ onClose, onSuccess, isClone = false, id = null, referenceData = null, fullScreenView = false }) => {
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(fullScreenView || isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);
  const [stepOptions, setStepOptions] = useState(referenceData?.steps || []);
  const [completeSteps, setCompleteSteps] = useState([]);

  useEffect(() => {
    fetchFields();
    referenceData?.service && fetchServiceSteps(referenceData?.service);
  }, []);

  const fetchServiceSteps = (serviceId) => {
    axiosInstance()
      .get(`${serviceMaster.api}/steps/${serviceId}`)
      .then(({ data: { data } }) => {
        const steps = data?.map((d) => ({ optionLabel: d.stepName, optionValue: d._id }));
        setStepOptions(steps || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get('/field?resource=Field Ticket');
      data = response?.data?.data;
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`${routes?.fieldTicket?.path}/${id}`)
          .then(({ data: { data } }) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { fieldTicketNumber, ...rest } = data;
              rest.fieldTicketNumber = `FT_${generateUniqueIdOnly()}`;
              setCloneHeading(fieldTicketNumber);
              tempData = rest;
            }
            fetchServiceSteps(tempData?.service?.optionValue);
            setCompleteSteps(tempData?.steps || []);
            setInitialData({
              fields: fields,
              values: getObjKeysWithValues(tempData, fields)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        tempInitialData['fieldTicketNumber'] = `FT_${generateUniqueIdOnly()}`;

        if (referenceData) {
          tempInitialData['fieldTicketNumber'] = `FT_${generateUniqueIdOnly()}`;
          tempInitialData['serviceOrder'] = referenceData?.serviceOrder;
          tempInitialData['service'] = referenceData?.service;
          tempInitialData['startDateTime'] = referenceData?.startDateTime;
          tempInitialData['endDateTime'] = referenceData?.endDateTime;
          tempInitialData['technician'] = referenceData?.technician;
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

  const handleSubmit = (values) => {
    setSubmitting(true);
    values.steps = completeSteps;
    if (id && !isClone) {
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
          onSuccess(data.data);
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
    return errors;
  }

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
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validate={validate}
          innerRef={ref}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={`${
                  id
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
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (
                      isFieldNotTouched(
                        {
                          initialValues: initialData.values,
                          fields: initialData.fields
                        },
                        values
                      )
                    )
                      onClose();
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
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageFieldTicket;
