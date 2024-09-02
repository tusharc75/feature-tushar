import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';

const ManageVolumeData = ({ onClose, onSuccess, data = null, assetId }) => {
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const columns = [
    {
      fieldData: {
        fieldLabel: 'Date',
        fieldName: 'date',
        isTooltip: false,
        option: [],
        order: 1,
        required: true,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'date',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
    {
      fieldData: {
        fieldLabel: 'Total Vol In BBLs',
        fieldName: 'TotalVolInBBLs',
        isTooltip: false,
        option: [],
        order: 2,
        required: true,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'number',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
    {
      fieldData: {
        fieldLabel: 'Total Vol Out BBLs',
        fieldName: 'TotalVolOutBBLs',
        isTooltip: false,
        option: [],
        order: 3,
        required: true,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'number',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
    {
      fieldData: {
        fieldLabel: 'Total Minutes Recycle',
        fieldName: 'TotalMinutesRecycle',
        isTooltip: false,
        option: [],
        order: 4,
        required: false,
        defaultValue: 0,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'number',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
    {
      fieldData: {
        fieldLabel: 'Total Minutes Purge',
        fieldName: 'TotalMinutesPurge',
        isTooltip: false,
        option: [],
        order: 5,
        defaultValue: 0,
        required: false,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'number',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
    {
      fieldData: {
        fieldLabel: 'Total Minutes Fill',
        fieldName: 'TotalMinutesFill',
        isTooltip: false,
        option: [],
        order: 6,
        required: true,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'number',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
    {
      fieldData: {
        fieldLabel: 'MINID',
        fieldName: 'minid',
        isTooltip: false,
        option: [],
        order: 7,
        required: true,
        tooltipMessage: '',
        sectionName: 'Volume Data',
        type: 'number',
      },
      isCreate: true,
      isDelete: true,
      isUpdate: true,
    },
  ]

  const fetchFields = async () => {
      let fieldsDataForCreate = columns.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      let fieldsDataForUpdate = columns.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (data) {
        fieldsDataForUpdate[0].isUneditable = true;
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    const updatedValues = {
      TotalVolInBBLs: parseInt(values.TotalVolInBBLs) || 0,
      TotalVolOutBBLs: parseInt(values.TotalVolOutBBLs) || 0,
      TotalMinutesRecycle: parseInt(values.TotalMinutesRecycle) || 0,
      TotalMinutesPurge: parseInt(values.TotalMinutesPurge) || 0,
      TotalMinutesFill: parseInt(values.TotalMinutesFill) || 0,
      minid: parseInt(values.minid) || 0,
      date: values.date,
      asset: assetId
    }
  
    if (data) {
      axiosInstance()
        .put(`${routes.serializedAsset?.path}/iot-volume`, {_id: data?._id, ...updatedValues})
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
        .post(`${routes.serializedAsset?.path}/iot-volume`, updatedValues)
        .then(({ data: { data, message } }) => {
          setLoading(false);
          onSuccess(data.data);
          setSubmitting(true);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit} validate={validate}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={data ? `Edit Volume Data` : 'Create Volume Data'}
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
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
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
                <ConfirmationCancelDialog
                  close={() => setShowConfirmDialog(false)}
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

export default ManageVolumeData;
