import { Box, Button, CircularProgress, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import routes from 'src/components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  yupSchema
} from 'src/constants/helpers';

const ManageHolidays = ({ payrollPolicyId, currency, id = null, onSuccess, onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const fields = await fetch_child_resource_fields(CHILD_RESOURCE.payrollHoliday, currency, true);

      if (id) {
        axiosInstance()
          .get(`${routes?.payrollPolicy?.path}/holidays/${payrollPolicyId}/${id}`)
          .then(({ data: { data } }) => {
            setInitialData({
              fields: fields,
              values: getObjKeysWithValues(data, fields)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        setInitialData({
          fields: fields,
          values: getObjKeys('', fields)
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (id) {
      values._id = id;
      axiosInstance()
        .put(`${routes.payrollPolicy?.path}/holidays/${payrollPolicyId}`, values)
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
        .post(`${routes.payrollPolicy?.path}/holidays/${payrollPolicyId}`, values)
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
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullScreen={fullScreen}
        TransitionComponent={CustomDialogTransition}
        open={true}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
        fullWidth
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
                  title={'Holiday Information'}
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
    </>
  );
};

export default ManageHolidays;
