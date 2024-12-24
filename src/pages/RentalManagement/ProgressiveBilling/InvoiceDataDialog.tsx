import { Box, Button, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { CustomDialogTransition, getObjKeys, sidebarResource, yupSchema } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const InvoiceDataDialog = ({ onClose, onSuccess, invoiceFields }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.invoice}`);
      fieldData = response?.data?.data;
      const fieldsDataForCreate = fieldData
        ?.filter((obj) => obj.isCreate && invoiceFields?.includes(obj?.fieldData?.fieldName))
        .map((d: any) => d.fieldData);
      setInitialData({
        fields: fieldsDataForCreate,
        values: getObjKeys('', fieldsDataForCreate)
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    onSuccess(values);
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData?.values} onSubmit={handleSubmit} validationSchema={yupSchema(initialData.fields)}>
          {({ values, submitForm, setFieldValue, errors, touched }) => (
            <>
              <CustomDialogHeader
                onClose={onClose}
                title={sidebarResource.invoice}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" color="primary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" size="small" type="submit" onClick={submitForm}>
                  Save
                </Button>
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

export default InvoiceDataDialog;
