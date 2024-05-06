import { Box, Button, Grid, TextField, Typography } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { getObjKeys } from 'src/constants/helpers';
import FormTypes from '../../FormTypes';

const Counter = ({ label, values, name, setFieldValue, fieldData }) => {
  const handleAddRemove = (type = 'add') => {
    let data = values[name] || [];
    if (type === 'add') {
      data.splice(values[name]?.length, 0, getObjKeys('', fieldData?.subFields || []));
    } else {
      data.splice(values[name]?.length - 1, 1);
    }
    setFieldValue(name, data);
  };

  return (
    <Box border={1} borderColor="var(--common-border-color)" p={0.5}>
      <Typography style={{ color: '#656565', marginBottom: '12px', fontWeight: '500', textAlign: 'center' }}>{label}</Typography>
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
                      errors={{}}
                      touched={{}}
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
  );
};

export default Counter;
