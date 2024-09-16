import { useEffect, useState, useContext, useCallback } from 'react';
import { Dialog, Button, CircularProgress, useTheme, useMediaQuery, Box } from '@material-ui/core';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { getObjKeys, yupSchema, getObjKeysWithValues, sidebarResource, CustomDialogTransition } from '../../constants/helpers';
import { useLocation, useHistory } from 'react-router-dom';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useData } from '../../StateProvider/Provider';
import { isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { isEqual } from 'lodash';

export default function ManageUserDialog({
  open,
  close,
  onSuccess,
  isNew,
  userId = null,
  dataToUpdate,
  isClone = false,
  redirectToDetailsScreen = true,
  isUserSetupPermission = false
}) {
  const {
    state: { user, permissions }
  }: any = useData();
  const { setToastConfig } = useContext(CustomToastContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [initialData, setInitialData] = useState({ fields: [], values: dataToUpdate ? dataToUpdate : {} });
  const location = useLocation();
  const history = useHistory();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeadingName, setCloneHeadingName] = useState('');

  const getInitialData = useCallback(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=User')
      .then(({ data: { data } }) => {
        const newFields = [];
        data.filter((d) => (isNew ? d.isCreate : d.isUpdate)).map((_f) => newFields.push(_f.fieldData));
        if (isClone && userId) {
          axiosInstance()
            .get(`/user/${userId}`)
            .then(({ data: { data } }) => {
              const { _id, createdBy, permissions, firstName, lastName, updatedBy, ...rest } = data;
              setInitialData({
                fields: newFields,
                values: isNew ? getObjKeys('', newFields) : getObjKeysWithValues({ ...rest }, newFields)
              });
              setCloneHeadingName(firstName);
            });
        } else {
          setInitialData({
            fields: newFields,
            values: isNew ? getObjKeys('', newFields) : getObjKeysWithValues(dataToUpdate, newFields)
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    getInitialData();
  }, [getInitialData]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (isNew) {
      axiosInstance()
        .post('/user', values)
        .then(({ data }) => {
          const newId = data.data[0]._id;
          setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          history.push({
            pathname: `/user/detail/${newId}`,
            search: isUserSetupPermission ? '?userSetup=true' : '',
            state: { location: location }
          });
          close();
        })
        .catch((error) => {
          setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      axiosInstance()
        .put(`/user`, { ...values, _id: userId })
        .then(({ data }) => {
          setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          onSuccess(data);
        })
        .catch((error) => {
          setToastConfig(error);
          setSubmitting(false);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);

      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {!loading && initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader
                title={
                  isClone
                    ? `Clone User - ${cloneHeadingName}`
                    : isNew
                      ? 'Create New User'
                      : `Updating ${[dataToUpdate.firstName, dataToUpdate.lastName].filter((f) => f).join(' ')}`
                }
                onClose={() => {
                  if (isEqual(values, initialData.values)) close();
                  else setShowConfirmDialog(true);
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
                    resource={sidebarResource.user}
                    referenceId={userId || null}
                    collaborateTools = {true}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (isEqual(values, initialData.values)) close();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={isSubmitting || loading || uploadingImageOrFileProgress > 0}
                >
                  {isSubmitting ? <CircularProgress size={22} /> : 'Save'}
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    close();
                  }}
                />
              ) : null}
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
}
