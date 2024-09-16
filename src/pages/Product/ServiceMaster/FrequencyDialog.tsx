import { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, getObjKeysWithValues, serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';

const FrequencyDialog = ({ onClose, onSuccess, serviceData, productId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${serviceMaster.resource}`)
      .then(({ data: { data } }) => {
        let fieldsData = data.filter((obj) => obj.fieldData?.fieldName === 'frequency').map((d: any) => d.fieldData);
        setInitialData({
          fields: fieldsData,
          values: getObjKeysWithValues({ frequency: serviceData?.frequency || '' }, fieldsData)
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [serviceData?._id]);

  const handleSave = (values) => {
    setLoading(true);
    axiosInstance()
      .put(`${routes.product.path}/${productId}/service-master/update-service-data`, { ...values, _id: serviceData?._id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        onSuccess();
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      TransitionComponent={CustomDialogTransition}
      fullScreen={fullScreen}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      aria-labelledby="assign-roles-dialog"
    >
      {initialData?.fields?.length ? (
        <>
          <CustomDialogHeader
            title={`Edit Frequency`}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={true}
            onClose={onClose}
          />
          <Formik initialValues={initialData.values} onSubmit={handleSave}>
            {({ values, errors, touched, submitForm, setFieldValue }) => (
              <>
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
                  <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                    Cancel
                  </Button>
                  <CustomButton
                    disabled={isEqual(initialData?.values, values)}
                    loading={loading}
                    variant="contained"
                    color="primary"
                    onClick={submitForm}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default FrequencyDialog;
