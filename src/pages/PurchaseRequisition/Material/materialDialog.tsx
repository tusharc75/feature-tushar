import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { arrayToDropwdownOption, CHILD_RESOURCE, CustomDialogTransition, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';

const MaterialDialog = ({ onClose, materialData, handleUpdate, loadingEdit, bulkEdit, showSaveAndNext, purchaseRequisitionData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, [materialData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    let data = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseRequisitionDetail, purchaseRequisitionData?.currency, true);
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

  const handleSubmit = (values) => {
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
      returnData = [{ _id: materialData._id, ...values }];
      handleUpdate(returnData, saveAndNext);
    }
  };

  return (
    <>
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
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    {'Close'}
                  </Button>
                  {bulkEdit === false && showSaveAndNext && (
                    <CustomButton
                      loading={loadingEdit}
                      disabled={loadingEdit}
                      variant="contained"
                      color="primary"
                      type="submit"
                      onClick={() => {
                        setSaveAndNext(true);
                        submitForm();
                      }}
                    >
                      {' '}
                      Save & Next
                    </CustomButton>
                  )}
                  <CustomButton
                    loading={loadingEdit}
                    disabled={loadingEdit}
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={() => {
                      setSaveAndNext(false);
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default MaterialDialog;
