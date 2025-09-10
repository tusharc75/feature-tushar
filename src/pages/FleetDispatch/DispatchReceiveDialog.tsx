import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import routes from 'src/components/Helpers/Routes';
import { fetch_resource_fields } from 'src/components/ResourceFields';
import {
  CustomDialogTransition,
  GenerateResourceLineNumber,
  getObjKeys,
  getObjKeysWithValues,
  sidebarResource,
  yupSchema
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const DispatchReceiveDialog = ({ handleClose, handleSucess, referenceData= null, type = 'dispatch', _id = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fleetDispatchData, setFleetDispatchData] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource.fleetDispatch);

      fieldsDataAll = fieldsDataAll?.filter((field) =>
        type === 'dispatch' ? !field?.sectionName?.toLowerCase().includes('receive') : !field?.sectionName?.toLowerCase().includes('dispatch')
      );
      fieldsDataForCreate = fieldsDataForCreate?.filter((field) =>
        type === 'dispatch' ? !field?.sectionName?.toLowerCase().includes('receive') : !field?.sectionName?.toLowerCase().includes('dispatch')
      );
      fieldsDataForUpdate = fieldsDataForUpdate?.filter((field) =>
        type === 'dispatch' ? !field?.sectionName?.toLowerCase().includes('receive') : !field?.sectionName?.toLowerCase().includes('dispatch')
      );

      if (_id) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${routes.fleetDispatch.path}/${_id}`);
          data = response?.data?.data;
          setFleetDispatchData(data);

          fieldsDataForUpdate?.forEach((field) => {
            if (['rentalJob', 'asset', 'fleet'].includes(field.fieldName)) {
              field.disableOnEdit = true;
              field.isUneditable = true;
            }
          });

          setInitialData({
            fields: fieldsDataForUpdate,
            values: getObjKeysWithValues(data, fieldsDataAll)
          });
          setLoading(false);
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['dispatchNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);

        if (referenceData) {
          Object.keys(referenceData)?.forEach((key) => {
            if (fieldsDataForCreate?.find((i) => i.fieldName === key)) {
              initialData[key] = referenceData[key];
            }
            const field = fieldsDataForCreate?.find((f) => f?.fieldName === key);
            if (field) {
              field.disableOnEdit = true;
              field.isUneditable = true;
            }
          });
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (_id) {
      values._id = _id;
      axiosInstance()
        .put(`${routes.fleetDispatch.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleSucess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.fleetDispatch.path}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          handleSucess(data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      open={true}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={(values) => {
            handleSubmit(values);
          }}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={type === 'dispatch' ? 'Dispatch' : 'Receive'}
                onClose={handleClose}
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
                    resource={sidebarResource.fleetDispatch}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  onClick={() => {
                    handleClose();
                  }}
                  buttonType="transparent"
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  disabled={loading}
                  onClick={(e) => {
                    submitForm();
                  }}
                  isLoading={loading}
                  buttonType="theme"
                >
                  {type === 'dispatch' ? 'Dispatch' : 'Receive'}
                </ThemeButton>
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

export default DispatchReceiveDialog;
