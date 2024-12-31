import { useEffect, useState } from 'react';
import { Dialog, Box, Grid, CircularProgress, useTheme, useMediaQuery, InputAdornment } from '@mui/material';
import { Formik, Form } from 'formik';
import { CustomDialogTransition, getObjKeysWithValues, getUniqueCurrencies, yupSchema } from '../../constants/helpers';
import FormTypes from '../Helpers/FormTypes';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import { ThemeButton } from '../Helpers/Buttons';

const UpdateDetailsDialog = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const { openDialog, onClose, fields, data, isUpdating, handleUpdate, title, isProjectSales = false } = props;
  const [initialVals, setValues] = useState(null);
  const [formsData, setFormsData] = useState([]);
  const [fieldsData, setFieldsData] = useState([]);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState(null);

  useEffect(() => {
    sortArray();
    const fieldData = fields?.map((f) => f.fieldData);
    const vals = getObjKeysWithValues(data, fieldData);
    setFieldsData(fieldData);
    setValues(vals);

    return () => setValues(null);
    // eslint-disable-next-line
  }, []);

  const sortArray = () => {
    const sections = [];
    const allFields = fields.sort((a, b) => a.fieldData.order - b.fieldData.order);

    allFields.forEach((field) => {
      if (!sections.includes(field.fieldData.sectionName)) {
        sections.push(field.fieldData.sectionName);
      }
    });

    const customData = sections.map((name) => {
      let fieldsData = allFields.filter((field) => field.fieldData.sectionName === name);

      const sectionFields = fieldsData.map((formData) => formData);
      return { name, sectionFields };
    });
    setFormsData(customData);
  };

  const handleSubmit = (values) => {
    handleUpdate(values);
  };

  const validateEmail = initialVals && initialVals.email ? false : true;

  const fromProjectSales = (fieldName: string) => isProjectSales && fieldName === 'projectManager';

  return (
    <Dialog TransitionComponent={CustomDialogTransition} open={openDialog} onClose={onClose} fullWidth fullScreen={isMobile} maxWidth="md">
      <CustomDialogHeader title={title} onClose={onClose} />

      <Formik initialValues={initialVals} validationSchema={yupSchema(fieldsData, validateEmail)} onSubmit={handleSubmit}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <>
            <CustomDialogContent>
              <Form>
                {formsData.map((form, i) => (
                  <div key={i}>
                    <h2 className="form-label-style">{form.name}</h2>
                    <Box marginY={2}>
                      <Grid spacing={3} container>
                        {form.sectionFields.map((field) => (
                          <Grid key={field.fieldData.fieldName} item xs={12} sm={6} md={6}>
                            {field.fieldData.fieldName === 'parent' ? (
                              <FormTypes
                                {...field}
                                disabled={field.fieldData.disableOnEdit}
                                values={values}
                                errors={errors}
                                touched={touched}
                                label={field.fieldData.fieldLabel}
                                name={field.fieldData.fieldName}
                                type={field.fieldData.type}
                                options={field.fieldData.option.filter((d) => d.optionLabel !== values?.entityName)}
                                setFieldValue={setFieldValue}
                                required={field.fieldData.required}
                                fullWidth
                                isTooltip={field.fieldData?.isTooltip || false}
                                tooltipMessage={field.fieldData?.tooltipMessage}
                                size="small"
                              />
                            ) : (
                              <FormTypes
                                size="small"
                                fullWidth
                                disabled={
                                  field.fieldData.type === 'email' ||
                                  !field.isUpdate ||
                                  fromProjectSales(field.fieldData.fieldName) ||
                                  field.fieldData.disableOnEdit
                                }
                                startAdornment={
                                  <InputAdornment position="start">
                                    {currencySymbol || getUniqueCurrencies().find((val) => initialVals.currency === val.currencyCode)?.symbolNative}
                                  </InputAdornment>
                                }
                                values={values}
                                errors={errors}
                                touched={touched}
                                label={field.fieldData.fieldLabel}
                                name={field.fieldData.fieldName}
                                type={field.fieldData.type}
                                options={field.fieldData.option}
                                setFieldValue={setFieldValue}
                                required={field.fieldData.required}
                                isTooltip={field.fieldData.isTooltip}
                                tooltipMessage={field.fieldData.tooltipMessage}
                                imageOrFileUploadCompletePercentage={
                                  ['imageUpload', 'fileUpload'].some((s) => s === field.fieldData.type)
                                    ? (completePercentage) => {
                                        setUploadingImageOrFileProgress(completePercentage);
                                      }
                                    : null
                                }
                                onChange={
                                  field.fieldData.fieldName === 'currency'
                                    ? (e, val) => {
                                        if (val && val.currencyCode) {
                                          setFieldValue(field.fieldData.fieldName, val.currencyCode);
                                          setCurrencySymbol(val.symbolNative);
                                        } else {
                                          setFieldValue(field.fieldData.fieldName, '');
                                          setCurrencySymbol(null);
                                        }
                                      }
                                    : field.fieldData.type === 'dropDown'
                                      ? (e, val) => {
                                          setFieldValue(field.fieldData.fieldName, val && val.optionValue ? val.optionValue : '');
                                        }
                                      : null
                                }
                              />
                            )}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </div>
                ))}
              </Form>
            </CustomDialogContent>

            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" disabled={isUpdating} onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton buttonType="theme" onClick={submitForm} disabled={isUpdating || uploadingImageOrFileProgress > 0}>
                {isUpdating ? <CircularProgress size={20} /> : 'Save'}
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default UpdateDetailsDialog;
