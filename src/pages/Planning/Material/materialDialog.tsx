import React, { Fragment, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { arrayToDropwdownOption, CHILD_RESOURCE, CustomDialogTransition, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import axiosInstance from 'src/axios/axiosInstance';
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { uniq, map, orderBy } from 'lodash';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const MaterialDialog = ({ onClose, materialData, planningData, handleUpdate, loadingEdit, bulkEdit, showSaveAndNext }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, [materialData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.planningMaterial}`);
    var data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, planningData?.currency);
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
    EvaluteproductFields(data);
  };

  const EvaluteproductFields = (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData);
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
                  {fields &&
                    fields.map((section, i) => (
                      <div key={i}>
                        <div className={'detail-box-content detail-product-box'}>
                          <div className={'product-form-layout'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-product'}`}>{section.name}</h2>
                          </div>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {section.sectionFields &&
                              section.sectionFields.map((field) =>
                                field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter ? (
                                  <FormTypes
                                    fields={initialData.fields}
                                    fieldData={{ ...field, hideConverter: true }}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field.isTooltip}
                                    tooltipMessage={field.tooltipMessage}
                                    size="small"
                                  />
                                ) : (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <Box display="flex">
                                      <Box flexGrow={1}>
                                        <FormTypes
                                          {...field}
                                          fields={initialData.fields}
                                          fieldData={field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field.isTooltip}
                                          tooltipMessage={field.tooltipMessage}
                                          size="small"
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                )
                              )}
                          </Grid>
                        </Box>
                      </div>
                    ))}
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
  );
};

export default MaterialDialog;
