import { useState, useEffect, Fragment, useContext } from 'react';
import { Box, Dialog, Button, CircularProgress } from '@mui/material';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';

const ManageWarehouse = ({ warehouseId, close, onSuccess, isClone = false, open }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();
  const [cloneHeading, setCloneHeading] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Warehouse')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (warehouseId) {
          axiosInstance()
            .get(`/warehouse/` + warehouseId)
            .then(({ data: { data } }) => {
              let fields = fieldsDataForUpdate;
              let tempData = data;
              if (isClone) {
                fields = fieldsDataForCreate;
                const { warehouseName, ...rest } = data;
                setCloneHeading(warehouseName);
                tempData = { ...rest };
              }
              setInitialData({
                fields: fields,
                values: isClone ? getObjKeysWithValues(tempData, fields, true, user) : getObjKeysWithValues(tempData, fields)
              });
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
  }, [warehouseId]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (warehouseId && !isClone) {
      values._id = warehouseId;
      axiosInstance()
        .put(`/warehouse`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess();
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
    } else {
      axiosInstance()
        .post(`/warehouse`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess(data);
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
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
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
                    : warehouseId
                      ? `Update ${initialData?.values['warehouseName'] ?? ''}`
                      : `Create ${resources?.warehouse?.titleSingular}`
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
              ></CustomDialogHeader>
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
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(values, initialData.values)) close();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading || submitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
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

export default ManageWarehouse;
