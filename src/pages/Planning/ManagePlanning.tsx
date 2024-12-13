import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, GenerateResourceLineNumber, PLANNING_STATUS } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import InputField from 'src/components/Helpers/InputField';

const ManagePlanning = ({ onClose, onSuccess, isClone = false, id = null }) => {
  const {
    state: { user,resources }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const history = useHistory();

  const fetchFields = async () => {
    try {
      const response = await axiosInstance().get('/field?resource=Planning');
      const data = response?.data?.data;
      let fieldsDataForCreate = data
        .filter((obj) => obj.isCreate && !['rentalJob', 'salesOrder', 'fieldServiceOrder']?.includes(obj.fieldData?.fieldName))
        .map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data
        .filter((obj) => obj.isUpdate && !['rentalJob', 'salesOrder', 'fieldServiceOrder']?.includes(obj.fieldData?.fieldName))
        .map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`${routes?.planning?.path}/${id}`)
          .then(({ data: { data } }) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { planningNumber, ...rest } = data;
              rest.planningNumber = GenerateResourceLineNumber(fieldsDataForCreate);
              setCloneHeading(planningNumber);
              tempData = rest;
              tempData.status = PLANNING_STATUS.open;
            }
            setInitialData({
              fields: fields,
              values: isClone ? { ...getObjKeysWithValues(tempData, fields, true, user) } :getObjKeysWithValues(tempData, fields)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
        tempInitialData['planningNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
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
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes.planning?.path}`, values)
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
        .post(`${routes.planning?.path}`, values)
        .then(({ data }) => {
          setLoading(false);
          setSubmitting(true);
          history.push(`${routes.planningDetail.path}/${data?.data?._id}`);
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

  useEffect(() => {
    fetchFields();
  }, []);

  function validate(values) {
    const errors = {};
    const startDate = moment(values?.startDate);
    const endDate = moment(values?.endDate);
    if (endDate.diff(startDate, 'days') < 0) {
      errors['endDate'] = 'End Date can not be less than the Start date';
    }
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
          validate={validate}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${
                  id
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${initialData.values?.planningNumber ? `(${initialData.values?.planningNumber})` : ''}`
                    : `Create ${resources?.planning?.titleSingular}`
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

export default ManagePlanning;
