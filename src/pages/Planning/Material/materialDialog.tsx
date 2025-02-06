import React, { Fragment, useEffect, useState } from 'react';
import { Box, Dialog } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { arrayToDropwdownOption, CHILD_RESOURCE, CustomDialogTransition, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const MaterialDialog = ({ onClose, materialData, planningData, handleUpdate, loadingEdit, bulkEdit, showSaveAndNext, material }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [materialData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.planningMaterial, planningData?.currency, true);
    if (bulkEdit) {
      let unitArray: any = [];
      materialData?.forEach((element) => {
        if (element?.[`${element.type}Detail`]?.unit) {
          unitArray.push([...element?.[`${element.type}Detail`]?.unit]);
        }
      });
      let unit: any = unitArray?.shift()?.filter(function (v) {
        return unitArray.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      const unitOptions: any = arrayToDropwdownOption(unit);
      data.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: getObjKeys('', data)
      });
    } else {
      let unitOptions: any = [];
      if (materialData?.[`${materialData.type}Detail`]?.unit) {
        unitOptions = arrayToDropwdownOption(materialData?.[`${materialData.type}Detail`]?.unit);
      }
      data.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
      });
      setAllFields(JSON.parse(JSON.stringify(data)));
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(materialData, data)
      });
    }
  };

  const handleSubmit = async (values) => {
    let returnData = [];
    if (bulkEdit) {
      for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x];
        }
      }
      materialData.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        returnData.push({ _id: element._id, ...calValues });
      });
      handleUpdate(returnData);
    } else {
      if (materialData.parentId && !showConfirmationDialog) {
        setShowConfirmationDialog(true);
      }
      else {
        const rows = await calculateRowsField(material, values, allFields, materialData, planningData?.currency);
        handleUpdate(rows, saveAndNext);
        setShowConfirmationDialog(false);

      }
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
                title={bulkEdit ? 'Bulk Edit' : `Edit - ${materialData?.index} (${materialData?.detail || ''})`}
                onClose={() => {
                  onClose();
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
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    onClose();
                  }}
                >
                  {'Close'}
                </ThemeButton>
                {bulkEdit === false && showSaveAndNext && (
                  <ThemeButton
                    isLoading={loadingEdit}
                    disabled={loadingEdit}
                    buttonType="theme"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                  >
                    {' '}
                    Save & Next
                  </ThemeButton>
                )}
                <ThemeButton
                  isLoading={loadingEdit}
                  disabled={loadingEdit}
                  buttonType="theme"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmationDialog && (
                <ConfirmationDialog
                  open={showConfirmationDialog}
                  message="Would you prefer to override the parent-level price configuration?"
                  onOk={() => {
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmationDialog(false);
                  }}
                />
              )}
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

export default MaterialDialog;
