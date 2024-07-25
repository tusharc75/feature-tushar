import React, { useEffect, useState } from 'react';
import { Grid, Box, InputAdornment, IconButton } from '@material-ui/core';
import FormTypes from './FormTypes';
import { gridSize, setFieldsInAscendingOrder } from '../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import FollowUpsDialog from 'src/components/Activity/Task/FollowUpsDialog';

const InputField = (props) => {
  const { fieldsData, errors, touched, values, setFieldValue, onImageUploadCompletePercentage, ...rest } = props;

  const [formsData, setFormsData] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [open, setOpen] = useState({ open: false, section: null });

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldsData));
  }, [fieldsData]);

  return (
    <React.Fragment>
      {formsData &&
        formsData.map((form, i) => (
          <div key={i}>
            <div className={'detail-box-new'}>
              <div className={'detail-box-content-new'}>
                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
              </div>
              <div>
                <IconButton
                  style={{ padding: '0px' }}
                  title="Follow-Ups"
                  size="small"
                  color="primary"
                  aria-label="delete"
                  onClick={() => {
                    setOpen({ open: true, section: form });
                  }}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
              </div>
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
                      sm={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                      md={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                      lg={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                      xl={field?.columnSize ? field?.columnSize : gridSize(field.type)}
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
                            : null
                        }
                        imageOrFileUploadCompletePercentage={
                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                            ? (completePercentage) => {
                                if (onImageUploadCompletePercentage) {
                                  onImageUploadCompletePercentage(completePercentage);
                                }
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
      {open?.open && (
        <FollowUpsDialog
          onClose={() => {
            setOpen({ open: false, section: null });
          }}
          section={open?.section}
        />
      )}
    </React.Fragment>
  );
};

export default InputField;
