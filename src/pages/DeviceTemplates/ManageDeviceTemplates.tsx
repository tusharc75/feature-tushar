import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box } from '@mui/material';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, getObjKeys, getObjKeysWithValues, yupSchema, sidebarResource } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

const ManageDeviceTemplates = ({ isClone, deviceTemplatesId, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    fetchFields();
  }, [deviceTemplatesId]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.deviceTemplates}`);
      fieldData = response?.data?.data;

      var fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      var fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (deviceTemplatesId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${routes.deviceTemplates.path}/` + deviceTemplatesId);
          data = response?.data?.data;
          if (isClone) {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { _id, createdBy, updatedBy, templateName, ...rest } = data;
              setCloneHeading(templateName);
              tempData = { ...rest };
            }
            setInitialData({
              fields: fields,
              values: getObjKeysWithValues(tempData, fields, true, user)
            });
            setLoading(false);
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        setInitialData({
          fields: fieldsDataForCreate,
          values: getObjKeys('', fieldsDataForCreate)
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (deviceTemplatesId && isClone === false) {
      values._id = deviceTemplatesId;
      axiosInstance()
        .put(`${routes.deviceTemplates.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.deviceTemplates.path}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes.deviceTemplatesDetail.path}/${data?._id}`);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
      >
        {initialData?.fields?.length ? (
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    !deviceTemplatesId
                      ? `Create ${resources?.deviceTemplates?.titleSingular}`
                      : `${isClone ? `Clone - ${cloneHeading}` : `Update ${initialData?.values['templateName'] ?? ''}`}`
                  }
                  onClose={() => {
                    if (isEqual(initialData.values, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
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
                  <ThemeButton
                    buttonType="transparent"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                  >
                    Cancel
                  </ThemeButton>
                  <ThemeButton
                    isLoading={loading}
                    buttonType="theme"
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
                    }}
                  >
                    Save
                  </ThemeButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
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

export default ManageDeviceTemplates;
