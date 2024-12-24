import { ChangeEvent, FC, FormEvent, useEffect, useState, Fragment } from 'react';
import { Button, Dialog, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import InputField from 'src/components/Helpers/InputField';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';

const CostDialog = ({ onClose, purchaseRequisitionData, handleAddCost, handleUpdateCost, costData, bulkEdit, showSaveAndNext, loadingEdit }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [costData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    let data = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseRequisitionCost, purchaseRequisitionData?.currency, true);
    setAllFields(JSON.parse(JSON.stringify(data)));
    if (bulkEdit) {
      data.forEach((element) => {
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: { ...getObjKeys('', data) }
      });
    } else {
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
      costData.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        returnData.push({ _id: element._id, ...element, ...calValues });
      });
      handleUpdateCost(returnData);
    } else {
      if (!costData) {
        returnData = [{ ...values }];
        handleAddCost(returnData);
      } else {
        returnData = [{ ...values, _id: costData._id }];
        handleUpdateCost(returnData, saveAndNext);
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
                title={
                  bulkEdit ? 'Bulk Edit' : costData ? `Edit - ${costData?.index} (${costData?.description || 'Manual Entry'})` : `Add Manual Entry`
                }
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
                  {' '}
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
  );
};

export default CostDialog;
