import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { CHILD_RESOURCE, CustomDialogTransition, arrayToDropwdownOption, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';

const MaterialDialog = ({ onClose, subcontractAssemblyData, rowData, material, allFields, handleSaveData, loading }) => {
  const walkmeInstance = useGetWalkmeInstance();
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, [rowData]);

  const fetchData = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, true, false);
    let unitOptions: any = [];
    if (rowData?.[`${rowData.type}Detail`]?.unit) {
      unitOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`].unit);
    }
    data.forEach((element) => {
      if (element.fieldName === 'unit') {
        element.option = unitOptions;
      }
    });
    setInitialData({
      fields: data,
      values: getObjKeysWithValues(rowData, data)
    });

    if (walkmeInstance) {
      const steps = generateStepsFormfieldData(data);
      walkmeInstance.instance.insertAtCurrentIndex(steps);
      walkmeInstance.handleNext();
    }
  };

  const handleSubmit = async (values) => {
    const rows = await calculateRowsField(material, values, allFields, rowData, subcontractAssemblyData?.currency);
    handleSaveData(rows);
  };

  function validate(values) {
    const errors = {};
    if (rowData && rowData.hideSelection) {
      if (values.qty != rowData.qty) {
        errors['qty'] = 'The quantity can not change after received.';
      }
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
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
        <Formik
          validate={validate}
          initialValues={initialData.values}
          enableReinitialize={true}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm, setValues }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`Edit - ${rowData.index} (${rowData?.productName || ''})`}
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
                  id={'edit-subcontract-material-button'}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
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
};

export default MaterialDialog;
