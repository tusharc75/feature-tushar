import React, { useEffect, useState } from 'react';
import { Grid, Box, InputAdornment } from '@material-ui/core';
import FormTypes from './FormTypes';
import { setFieldsInAscendingOrder } from '../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';

const InputField = (props) => {

  const { fieldsData, errors, touched, values, setFieldValue, onImageUploadCompletePercentage, ...rest } = props;

  const [formsData, setFormsData] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(null);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldsData));
  }, [fieldsData]);

  return (
    <React.Fragment>
      {formsData &&
        formsData.map((form, i) => (
          <div key={i}>
            <div className={'detail-box-content'}>
              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
            </div>
            <Box marginY={2}>
              <Grid spacing={3} container>
                {form.sectionFields.map((field) =>
                  field.type === 'converter' || field.type === 'currencyAmount' ? (
                    <FormTypes
                      {...rest}
                      {...field}
                      values={values}
                      errors={errors}
                      touched={touched}
                      label={field.fieldLabel}
                      name={field.fieldName}
                      type={field.type}
                      options={field.option}
                      setFieldValue={setFieldValue}
                      required={field.required}
                      isTooltip={field.isTooltip}
                      tooltipMessage={field.tooltipMessage}
                      fields={fieldsData}
                      fieldData={field}
                    />
                  ) : field.fieldName === 'day' ? (
                    values.recurrence === 'Monthly' && (
                      <Grid item xs={12} sm={6} md={6}>
                        <FormTypes
                          {...rest}
                          {...field}
                          values={values}
                          errors={errors}
                          touched={touched}
                          label={field.fieldLabel}
                          name={field.fieldName}
                          type={field.type}
                          options={field.option}
                          setFieldValue={setFieldValue}
                          required={field.required}
                          isTooltip={field.isTooltip}
                          tooltipMessage={field.tooltipMessage}
                          fields={fieldsData}
                          fieldData={field}
                        />
                      </Grid>
                    )
                  ) : field.fieldName === 'dayName' ? (
                    values.recurrence === 'Weekly' && (
                      <Grid item xs={12} sm={6} md={6}>
                        <FormTypes
                          {...rest}
                          {...field}
                          values={values}
                          errors={errors}
                          touched={touched}
                          label={field.fieldLabel}
                          name={field.fieldName}
                          type={field.type}
                          options={field.option}
                          setFieldValue={setFieldValue}
                          required={field.required}
                          isTooltip={field.isTooltip}
                          tooltipMessage={field.tooltipMessage}
                          fields={fieldsData}
                          fieldData={field}
                        />
                      </Grid>
                    )
                  ) : (
                    <Grid
                      key={field.fieldName}
                      item
                      xs={12}
                      sm={field.type === 'imageUpload' || field.type === 'fileUpload' ? 12 : 6}
                      md={field.type === 'imageUpload' || field.type === 'fileUpload' ? 12 : 6}
                    >
                      <FormTypes
                        {...rest}
                        {...field}
                        startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ''}
                        values={values}
                        errors={errors}
                        touched={touched}
                        label={field.fieldLabel}
                        name={field.fieldName}
                        type={field.type}
                        options={field.option}
                        setFieldValue={setFieldValue}
                        required={field.required}
                        isTooltip={field.isTooltip}
                        tooltipMessage={field.tooltipMessage}
                        onChange={
                          field.fieldName === 'currency'
                            ? (e, val) => {
                              if (val && val.currencyCode) {
                                setFieldValue(field.fieldName, val.currencyCode);
                                setCurrencySymbol(val.symbolNative);
                              } else {
                                setFieldValue(field.fieldName, '');
                                setCurrencySymbol(null);
                              }
                            }
                            : field.type === 'dropDown'
                              ? (e, val) => {
                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');
                              }
                              : null
                        }
                        imageOrFileUploadCompletePercentage={
                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                            ? (completePercentage) => {
                              onImageUploadCompletePercentage(completePercentage);
                            }
                            : null
                        }
                        fields={fieldsData}
                        fieldData={field}
                      />
                    </Grid>
                  )
                )}
              </Grid>
            </Box>
          </div>
        ))}
    </React.Fragment>
  );
};

export default InputField;
