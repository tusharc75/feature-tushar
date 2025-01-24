import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, workOrder, yupSchema } from 'src/constants/helpers';
import DetailsPage from 'src/components/Shared/DetailsPage';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ServiceFieldValueDialog = ({ workOrderId, fields = [], fieldsValue = {}, service, handleClose, handleSuccess, editable = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(editable);

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${service?.uniqueId}/fields-value`, values)
      .then(({ data }) => {
        setSubmitting(false);
        handleSuccess();
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
        }
      }}
      fullWidth
    >
      {fields?.length ? (
        <Formik initialValues={fieldsValue} validationSchema={yupSchema(fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader
                title={service?.serviceName}
                onClose={() => {
                  handleClose();
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Box pt={1}>
                  {isEditing ? (
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      <InputField
                        errors={errors}
                        values={values}
                        setFieldValue={setFieldValue}
                        touched={touched}
                        fieldsData={fields}
                        size="small"
                        fullWidth
                      />
                    </Form>
                  ) : (
                    <DetailsPage containerPadding={'0px'} data={fieldsValue} fields={fields.map((f) => ({ fieldData: f }))} />
                  )}
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType='transparent'
                  onClick={handleClose}
                >
                  Cancel
                </ThemeButton>
                {isEditing ? (
                  <ThemeButton
                    onClick={() => {
                      submitForm();
                    }}
                    buttonType='theme'
                    disabled={submitting}
                    isLoading={submitting}
                  >
                    Save
                  </ThemeButton>
                ) : (
                  <ThemeButton
                    onClick={() => {
                      setIsEditing(true);
                    }}
                    buttonType='theme'
                    disabled={submitting}
                    isLoading={submitting}
                  >
                    Edit
                  </ThemeButton>
                )}
              </CustomDialogFooter>
            </>
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

export default ServiceFieldValueDialog;
