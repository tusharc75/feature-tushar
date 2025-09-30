import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Dialog } from '@mui/material';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../constants/helpers';
import { getObjKeys, yupSchema, workOrder, sidebarResource } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { fetch_resource_fields } from 'src/components/ResourceFields';
import InputField from 'src/components/Helpers/InputField';

const BulkEditWorkOrder = ({ onClose, onSuccess, workOrderIds = [] }) => {
  const {
    state: { resources }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const { fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource.workOrder, [
        'workOrderNumber',
        'type',
        'product',
        'warehouse',
        'serializedAsset',
        'package',
        'serializedPackage',
        'status',
        'productionOrder',
        'repairOrder',
        'repairJob',
        'assemblyOrder',
        'disassemblyOrder',
        'serviceProcessStatus',
        'owner',
        'collaborator'
      ]);
      fieldsDataForUpdate?.forEach((e) => {
        if (e?.required) {
          e.required = false
        }
      })
      const tempInitialData = getObjKeys('', fieldsDataForUpdate);
      fieldsDataForUpdate?.filter((e) => {
        if (e?.type === 'date' || e?.type === 'datetime') {
          tempInitialData[e.fieldName] = ''
        }
      })
      setInitialData({
        fields: fieldsDataForUpdate,
        values: tempInitialData
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    values._ids = workOrderIds;
    Object.keys(values).forEach((key) => {
      if (!values[key]) {
        delete values[key];
      }
    });
    axiosInstance()
      .put(`${workOrder.api}/bulk-update`, values)
      .then(({ data }) => {
        setLoading(false);
        onSuccess();
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setLoading(false);
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
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
                  if (!isEqual(values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={`Update ${resources?.workOrder?.titlePlural}`}
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
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (!isEqual(values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  disabled={isSubmitting || loading}
                  isLoading={loading}
                  buttonType="theme"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
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

export default BulkEditWorkOrder;
