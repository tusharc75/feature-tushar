import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Box, Button, CircularProgress, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { CHILD_RESOURCE, CustomDialogTransition, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { isEqual } from 'lodash';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import InputField from 'src/components/Helpers/InputField';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';

const AdditionalCostDialog = ({ costData, onClose, handleAddCost, handleUpdateCost, loadingEdit, showSaveAndNext, invoiceData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveAndNext, setSaveAndNext] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceCost, costData?.currency, true);
    if (costData) {
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(costData, data)
      });
    } else {
      setInitialData({
        fields: data,
        values: getObjKeys('', data)
      });
    }
  };

  const handleSubmit = (values) => {
    if (costData) {
      let returnData = [];
      returnData = { ...values, _id: costData._id };
      handleUpdateCost(returnData, saveAndNext);
    } else {
      let returnData = [];
      returnData = { ...values };
      handleAddCost(returnData);
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
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={costData ? `Edit Manual Entry` : `Add Manual Entry`}
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
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                {showSaveAndNext && (
                  <Button
                    disabled={isEqual(initialData.values, values) || loadingEdit}
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                    endIcon={loadingEdit && <CircularProgress color="inherit" size={18} />}
                  >
                    {' '}
                    Save & Next
                  </Button>
                )}
                <Button
                  disabled={isEqual(initialData.values, values) || loadingEdit}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                  endIcon={loadingEdit && <CircularProgress color="inherit" size={18} />}
                >
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

export default AdditionalCostDialog;
