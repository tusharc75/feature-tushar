import { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { getObjKeysWithValues, serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Form, Formik } from 'formik';
import FormTypes from 'src/components/Helpers/FormTypes';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';

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
      .put(`${routes.product.path}/${productId}/service-master/update-frequency`, { ...values, _id: serviceData?._id })
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
          <Formik
            initialValues={initialData.values}
            // validationSchema={yupSchema(initialData.fields)}
            // validateOnMount
            onSubmit={handleSave}
          >
            {({ values, errors, touched, submitForm, setFieldValue }) => (
              <>
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <Box mt={2}>
                      {initialData?.fields.length > 0 &&
                        initialData?.fields.map((field, i) => (
                          <Box key={i}>
                            <FormTypes
                              {...field}
                              fieldData={field}
                              fields={initialData.fields}
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
                          </Box>
                        ))}
                    </Box>
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
