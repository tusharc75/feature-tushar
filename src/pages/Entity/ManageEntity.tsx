import { useEffect, useState, useContext, Fragment } from 'react';
import { Dialog, Button, CircularProgress, useTheme, Box } from '@mui/material';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useHistory } from 'react-router-dom';
import { getObjKeys, yupSchema, getObjKeysWithValues, CustomDialogTransition, sidebarResource } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
interface InitialData {
  fields: any[];
  values: object;
}

const ManageEntity = ({ open, close, fetchData, isNew, values = {}, isClone = false, entityId = null, fetchEntities = null }) => {
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: values
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Entity')
      .then(async ({ data: { data } }) => {
        const fieldsData = isNew
          ? data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData)
          : data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        let tempData = getObjKeys('', fieldsData);
        if (isClone) {
          const {
            data: { data }
          } = await axiosInstance().get(`/entity/${entityId}`);
          const { entityName, ...rest } = data;
          setCloneHeading(entityName);
          tempData = getObjKeysWithValues({ ...rest }, fieldsData, true, user);
        }

        setInitialData({
          fields: fieldsData,
          values: isNew ? tempData : getObjKeysWithValues(values, fieldsData)
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (enteredValues) => {
    setSubmitting(true);
    if (isNew) {
      axiosInstance()
        .post('/entity', enteredValues)
        .then(({ data }) => {
          const newId = data.data._id;
          setSubmitting(false);
          fetchData();
          toastConfig.setToastConfig({
            type: 'success',
            open: true,
            message: data.message
          });
          history.push(`/entity/detail/${newId}`);
          close();
        })
        .catch((err) => {
          setSubmitting(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      const { createdBy, updatedBy, ...rest } = enteredValues;
      axiosInstance()
        .put(`/entity`, { _id: values['_id'], ...rest })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          close();
          fetchData();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  isClone
                    ? `Clone - ${cloneHeading}`
                    : isNew
                      ? `Create New ${resources?.entity?.titleSingular}`
                      : `Update ${resources?.entity?.titleSingular}`
                }
                onClose={() => {
                  if (isEqual(initialData.values, values)) close();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.entity}
                    referenceId={entityId || null}
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
                    if (isEqual(initialData.values, values)) close();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="contained" color="primary" size="small" onClick={submitForm} disabled={isSubmitting || loading}>
                  {isSubmitting ? <CircularProgress size={22} /> : 'Submit'}
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    close();
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

export default ManageEntity;
