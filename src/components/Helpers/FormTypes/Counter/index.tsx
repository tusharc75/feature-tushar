import { useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { getObjKeys } from 'src/constants/helpers';
import FormTypes from '../../FormTypes';

const Counter = ({ label, values, name, setFieldValue, fieldData, touched, errors }) => {
  const [error, setError] = useState({});
  const [touch, setTouch] = useState({});

  const handleAddRemove = (type = 'add') => {
    let data = values[name] || [];
    if (type === 'add') {
      if (fieldData?.subFields?.length > 0) {
        data.splice(values[name]?.length, 0, getObjKeys('', fieldData?.subFields || []));
      }
    } else {
      data.splice(values[name]?.length - 1, 1);
    }
    setFieldValue(name, data);
  };

  useEffect(() => {
    validate();
  }, values[name]);

  useEffect(() => {
    if (touched[name] && Boolean(errors[name])) {
      validate();
    }
  }, [values[name], errors, touched]);

  const validate = () => {
    const err: any = {};
    const tch: any = {};

    values[name]?.forEach((v, i) => {
      fieldData?.subFields?.forEach((field) => {
        if (field?.required) {
          if (!v[field?.fieldName]) {
            err[`${i}`] = { ...err[`${i}`], [field.fieldName]: `${field?.fieldLabel} is required` };
            tch[`${i}`] = { ...tch[`${i}`], [field.fieldName]: true };
          }
        }
      });
    });

    setError(err);
    setTouch(tch);
  };

  return (
    <Box>
      <Box border={1} borderColor="var(--common-border-color)" className="rounded-md  p-2">
        <div className="flex items-center justify-between gap-2">
          <Typography
            className=" line-clamp-2 flex-grow "
            title={label}
            variant="body2"
            style={{ fontWeight: '500' }}
            color={touched[name] && Boolean(errors[name]) ? 'error' : 'primary'}
          >
            {label}
          </Typography>
          <div className="flex w-[130px] flex-shrink-0 items-center gap-2 overflow-hidden rounded-md [border:1px_solid_var(--common-border-color)] md:w-[156px]">
            <IconButton
              color="secondary"
              className=" !rounded-r-none !bg-[var(--new-theme-color)] hover:!opacity-80"
              style={{ maxHeight: 40, color: 'white' }}
              onClick={() => {
                handleAddRemove('remove');
              }}
            >
              -
            </IconButton>
            <TextField disabled value={values[name]?.length} size="small" />
            <IconButton
              className=" !rounded-l-none !bg-[var(--new-theme-color)] hover:!opacity-80"
              style={{ maxHeight: 40, color: 'white' }}
              onClick={() => {
                handleAddRemove();
              }}
            >
              +
            </IconButton>
          </div>
        </div>
        {values[name].length > 0 && (
          <div className="mt-3 space-y-3">
            {values[name]?.map((value, index) => {
              return (
                <div className={` ${values[name].length - 1 === index ? '' : 'pb-3 [border-bottom:2px_dashed_var(--common-border-color)]'} `}>
                  <Grid container spacing={1}>
                    {fieldData?.subFields?.map((field) => {
                      return (
                        <Grid item xs={12} md={6}>
                          <FormTypes
                            {...field}
                            fieldData={field}
                            values={value}
                            errors={error[`${index}`] || {}}
                            touched={touch[`${index}`] || {}}
                            label={field.fieldLabel}
                            name={field.fieldName}
                            type={field.type}
                            options={field.option}
                            setFieldValue={(n, v) => {
                              setFieldValue(
                                name,
                                values[name]?.map((_v, i) => {
                                  if (index === i) {
                                    return {
                                      ..._v,
                                      [n]: v
                                    };
                                  }
                                  return _v;
                                })
                              );
                            }}
                            required={field.required}
                            fullWidth
                            isTooltip={field?.isTooltip || false}
                            tooltipMessage={field?.tooltipMessage}
                            size="small"
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </div>
              );
            })}
          </div>
        )}
      </Box>
      <Box pl={1} pt={0.5}>
        {touched[name] && Boolean(errors[name]) && (
          <Typography color="error" style={{ fontSize: '13px' }}>
            {errors[name]}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Counter;
