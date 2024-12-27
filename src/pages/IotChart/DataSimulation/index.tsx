import { Box, Button, CircularProgress, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, getObjKeys, setFieldsInAscendingOrder, yupSchema } from 'src/constants/helpers';
import { useParams } from 'react-router-dom';
import InputField from 'src/components/Helpers/InputField';

const DataSimulationDialog = ({ onClose }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);

  const { assetId } = useParams();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let createValues = { ...getObjKeys('', fields) };
      setInitialData({
        fields: fields,
        values: createValues
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    const body = { ...values, asset: assetId };
    body.fieldValue = parseFloat(body.fieldValue);
    axiosInstance()
      .post('iot-data-points/iot-data', body)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        onClose();
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

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
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={'Data Simulation'}
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
                  disabled={loading}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  onClick={submitForm}
                  endIcon={loading && <CircularProgress color="inherit" size={18} />}
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

const fields = [
  {
    _id: '6426d49d6ccedf33bf69cc7a',
    fieldLabel: 'Field Name',
    type: 'singleLine',
    option: [],
    required: true,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 0,
    fieldName: 'fieldName',
    sectionName: 'Data Simulation',
    roleType: 0
  },
  {
    _id: '6426d49d6ccedf33bf69cc7b',
    fieldLabel: 'Field Value',
    type: 'number',
    option: [],
    required: true,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 1,
    fieldName: 'fieldValue',
    sectionName: 'Data Simulation',
    roleType: 0
  },
  {
    _id: '6426d49d6ccedf33bf69cc7c',
    fieldLabel: 'Date Time',
    type: 'dateTime',
    option: [],
    required: true,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 2,
    fieldName: 'dateTime',
    sectionName: 'Data Simulation',
    roleType: 0
  }
];

export default DataSimulationDialog;
