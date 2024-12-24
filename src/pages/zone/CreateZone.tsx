import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from './../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box } from '@mui/material';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import { useData } from 'src/StateProvider/Provider';

const CreateZone = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();
  const { zoneId, onClose, onSuccess, isUpdateDisabled = false, isClone = false } = props;
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [saveClick, setSaveClick] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Zone')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (zoneId) {
          axiosInstance()
            .get(`/zone/` + zoneId)
            .then(({ data: { data } }) => {
              let tempOptionArray = fieldsDataForUpdate.find((d) => d.fieldName === 'name').option;
              fieldsDataForUpdate.find((d) => d.fieldName === 'name').option = tempOptionArray.filter((data) => data.optionValue !== zoneId);
              const { name, ...rest } = data;
              setCloneHeading(name);
              if (isClone) {
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate, true, user)
                });
              } else {
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setInitialData({
            fields: fieldsDataForCreate,
            values: getObjKeys('', fieldsDataForCreate)
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [zoneId]);

  const handleSubmit = (values) => {
    setSaveClick(true);
    if (zoneId && !isClone) {
      values._id = zoneId;
      axiosInstance()
        .put(`/zone`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
          setSaveClick(false);
        });
    } else {
      axiosInstance()
        .post(`/zone`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess(data);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Zone Created Successfully'
          });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
          setSaveClick(false);
        });
    }
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
                title={
                  isClone
                    ? `Clone - ${cloneHeading}`
                    : zoneId
                      ? !isUpdateDisabled
                        ? 'Update ' + resources?.zone?.titleSingular
                        : values['name']
                      : 'Create ' + resources?.zone?.titleSingular
                }
                onClose={() => {
                  if (isEqual(values, initialData.values)) onClose();
                  else setShowConfirmDialog(true);
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
                    if (isEqual(values, initialData.values)) onClose();
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
  );
};

export default CreateZone;
