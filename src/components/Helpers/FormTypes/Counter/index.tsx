import { useEffect, useState } from 'react';
import { Box, Button, Grid, Typography } from '@material-ui/core';
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
      <Box border={1} borderColor="var(--common-border-color)" p={0.5}>
        <Typography
          style={{ marginBottom: '12px', fontWeight: '500', textAlign: 'center' }}
          color={touched[name] && Boolean(errors[name]) ? 'error' : 'primary'}
        >
          {label}
        </Typography>
        <Box border={1} borderColor="var(--common-border-color)" p={0.5} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              handleAddRemove('remove');
            }}
          >
            -
          </Button>
          {values[name]?.length}
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              handleAddRemove();
            }}
          >
            +
          </Button>
        </Box>
        {values[name]?.map((value, index) => {
          return (
            <Box border={1} borderColor="var(--common-border-color)" p={0.5} mt={1}>
              <Grid container spacing={2}>
                {fieldData?.subFields?.map((field) => {
                  return (
                    <Grid item xs={12} sm={12} md={6} lg={6}>
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
            </Box>
          );
        })}
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
