import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, isFieldNotTouched } from './../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box } from '@material-ui/core';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';

const DetailsDialog = (props) => {

  const toastConfig = useContext(CustomToastContext);
  const { onClose, onSuccess, isUpdateDisabled = false, isClone = false } = props;

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formValues, setFormValues] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [saveClick, setSaveClick] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=e-Commerce Policy')
      .then(({ data: { data } }) => {
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        axiosInstance()
          .get(`/e-commerce-policy`)
          .then(({ data: { data } }) => {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    axiosInstance().put(`/e-commerce-policy`, values).then(({ data: { data } }) => {
      setLoading(false);
      onSuccess(data);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Updated Successfully'
      });
    })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
        setSaveClick(false);
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
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={"Update"}
                onClose={() => {
                  onClose();
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    disabled={isUpdateDisabled}
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
                <Button
                  size="small"
                  color="primary"
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
                  {isUpdateDisabled ? 'Close' : 'Cancel'}
                </Button>
                {!isUpdateDisabled && (
                  <CustomButton loading={loading} variant="contained" color="primary" type="submit" disabled={saveClick} onClick={submitForm}>
                    {' '}
                    Save
                  </CustomButton>
                )}
              </CustomDialogFooter>
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

export default DetailsDialog;
