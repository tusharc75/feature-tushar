import { Box, Grid, IconButton, InputAdornment } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { FaDiceOne } from 'react-icons/fa';
import { FaUserPlus } from 'react-icons/fa6';
import FollowUpsDialog from 'src/components/Activity/Task/FollowUpsDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { gridSize, setFieldsInAscendingOrder } from '../../constants/helpers';
import FormTypes, { isFieldVisible, isSectionVisible } from './FormTypes';

const InputField = (props) => {
  const {
    fieldsData,
    errors,
    touched,
    values,
    setFieldValue,
    onImageUploadCompletePercentage,
    resource = null,
    referenceId = null,
    collaborateTools = false,
    onChange=null,
    ...rest
  } = props;

  const [formsData, setFormsData] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [open, setOpen] = useState({ open: false, section: null });

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldsData));
  }, [fieldsData]);

  return (
    <React.Fragment>
      {formsData &&
        formsData.map((form, i) => {
          if (isSectionVisible(form, fieldsData, values)) {
            return (
              <div key={i}>
                <div className={'detail-box-new'}>
                  <div className={'detail-box-content-new'}>
                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                  </div>
                  {resource && referenceId && collaborateTools && (
                    <div>
                      <HtmlTooltip title="Follow-Ups">
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
                      field?.type === 'converter' || field?.type === 'currencyAmount' || field?.isConverter ? (
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
                          disabled={Boolean(referenceId) && field.disableOnEdit}
                        />
                      ) : isFieldVisible(field, fieldsData, values) ? (
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
                            onChange={(e, val) => {
                              if (onChange) {
                                onChange(field, e, val);
                              } else {
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
                                  : null;
                              }
                            }}
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
                            disabled={Boolean(referenceId) && field.disableOnEdit}
                          />
                        </Grid>
                      ) : null
                    )}
                  </Grid>
                </Box>
              </div>
            );
          } else return null;
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
