import { Fragment, useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { CustomDialogTransition, getObjKeys, yupSchema } from '../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';
import { isMobile, isTablet } from 'react-device-detect';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import CustomButton from 'src/components/Helpers/CustomButton';

export default function WorkOrderCostDialog({ onClose, workOrderCostFields, onSuccess, isSubmitting, currency, id }) {
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    axiosInstance()
      .get(`${routes?.workOrder?.path}/total-consumables-cost/${id}`)
      .then(({ data: { data } }) => {
        const tempInitialData = getObjKeys('', workOrderCostFields);
        const calValues = autoCalculateSpecificFields(
          { [`consumableCost_${currency.toLowerCase()}`]: data?.totalConsumablesCost },
          tempInitialData,
          workOrderCostFields
        );
        Object.assign(tempInitialData, calValues);
        setInitialData({
          fields: workOrderCostFields,
          values: tempInitialData
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (values) => {
    onSuccess(values);
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={fullScreen}
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} enableReinitialize={true} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`Cost`}
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
                    fieldsData={workOrderCostFields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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
}
