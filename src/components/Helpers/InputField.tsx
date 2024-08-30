import React, { useEffect, useState } from 'react';
import { Grid, Box, InputAdornment, IconButton } from '@material-ui/core';
import FormTypes from './FormTypes';
import { gridSize, setFieldsInAscendingOrder } from '../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import FollowUpsDialog from 'src/components/Activity/Task/FollowUpsDialog';
import { FaUserPlus } from 'react-icons/fa6';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { checkCondition } from './FormTypes';
import { LOGIC } from 'src/components/FormBuilder/helper';

const InputField = (props) => {
  const { fieldsData, errors, touched, values, setFieldValue, onImageUploadCompletePercentage, resource = null, referenceId = null, collaborateTools = false, ...rest } = props;

  const [formsData, setFormsData] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [open, setOpen] = useState({ open: false, section: null });

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldsData));
  }, [fieldsData]);

  const isSectionVisible = (section) => {
    const fieldData = section?.sectionFields?.find((field) => field?.sectionProperties?.visibilityCondition?.length > 0);
    if (fieldData) {
      let visible = false;
      let show = true;
      fieldData?.sectionProperties?.visibilityCondition?.forEach((condition, i) => {
        if (condition?.logic === LOGIC.AND) {
          condition?.fields?.forEach((field) => {
            if (field?.fieldName && field?.value) {
              if (!checkCondition(fieldsData, field?.fieldName, field?.value, values)) {
                show = false;
                return;
              }
            }
          });
        } else if (condition?.logic === LOGIC.OR) {
          let count = 0;
          condition?.fields?.forEach((field) => {
            if (field?.fieldName && field?.value) {
              if (checkCondition(fieldsData, field?.fieldName, field?.value, values)) {
                return;
              } else {
                count = count + 1;
              }
            }
          });

          if (count === condition?.fields?.length) {
            show = false;
          }
        }
        if (!show) {
          visible = false;
          return;
        }
        if (i === fieldData?.sectionProperties?.visibilityCondition?.length - 1) {
          visible = show;
        }
      });
      return visible;
    }
    return true;
  };

  return (
    <React.Fragment>
      {formsData &&
        formsData.map((form, i) => {
          if (isSectionVisible(form)) {
            return (
              <div key={i}>
                <div className={'detail-box-new'}>
                  <div className={'detail-box-content-new'}>
                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                  </div>
                  {resource && referenceId && collaborateTools && (
                    <div>
                      <HtmlTooltip title='Follow-Ups'>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setOpen({ open: true, section: form });
                          }}
                        >
                          <FaUserPlus />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  )}
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
                          disabled={(Boolean(referenceId) && field.disableOnEdit)}
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
                              disabled={(Boolean(referenceId) && field.disableOnEdit)}
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
                              disabled={(Boolean(referenceId) && field.disableOnEdit)}
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
                            disabled={(Boolean(referenceId) && field.disableOnEdit)}
                          />
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>
              </div>
            );
          }
        })}
      {open?.open && (
        <FollowUpsDialog
          onClose={() => {
            setOpen({ open: false, section: null });
          }}
          onSuccess={() => {
            setOpen({ open: false, section: null });
          }}
          section={open?.section}
          resource={resource}
          referenceId={referenceId}
        />
      )}
    </React.Fragment>
  );
};

export default InputField;
