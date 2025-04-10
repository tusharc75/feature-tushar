import { Box, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useCallback, useEffect, useState } from 'react';
import { getObjKeys, gridSize, setFieldsInAscendingOrder } from 'src/constants/helpers';
import FormTypes from '../../FormTypes';
import { handleAutoCalculation } from 'src/constants/formulaUtility';
import { isArray } from 'lodash';

let timeout: NodeJS.Timeout;

const Counter = ({ label, values, name, setFieldValue, fieldData, touched, errors, defaultValue, fields, ...rest }) => {
  const [error, setError] = useState({});
  const [touch, setTouch] = useState({});
  const [formsData, setFormsData] = useState([]);
  const [count, setCount] = useState('0');

  const handelSetDefault = useCallback(() => {
    const tempData = [];
    for (let i = 0; i < (+defaultValue) - length; i++) {
      tempData.push(getObjKeys('', fieldData?.subFields || []));
    }
    setCount(`${defaultValue}`)
    setFieldValue(name, [...tempData]);
  }, []);

  useEffect(() => {
    if (defaultValue && !isNaN(+defaultValue)) {
      if ((isArray(values[name]) && values[name]?.length == 0) || !values[name]) {
        handelSetDefault()
      }
    }
  }, [setFieldValue, name]);

  const handleAddRemoveMulti = useCallback(
    (count: number) => {
      let newData: any[] = isArray(values[name]) && values[name]?.length ? [...values[name]] : [];
      const length = newData?.length;
      if (length < count && fieldData?.subFields?.length > 0) {
        const tempData = [];
        for (let i = 0; i < count - length; i++) {
          tempData.push(getObjKeys('', fieldData?.subFields || []));
        }
        newData = [...newData, ...tempData];
      }
      if (length > count) {
        newData = [...newData].splice(0, count);
      }
      setFieldValue(name, newData);
      // for updating fields which are dependent on counter sub fields for their values
      const result = handleAutoCalculation(
        fieldData,
        fields,
        { ...values, [name]: newData },
        name,
        '',
        '',
        newData,
      );
      for (var x in result) {
        setFieldValue(x, result[x]);
      }
    },
    [fieldData?.subFields, name, setFieldValue, values]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(timeout);
      const value = e.target.value.trim();
      if (value === '') {
        setCount('');
        return;
      }
      if (!isNaN(+value) && +value >= 0) {
        setCount(value);
        timeout = setTimeout(() => {
          handleAddRemoveMulti(+value);
        }, 500);
      }
    },
    [handleAddRemoveMulti]
  );

  const handleButton = useCallback(
    (count: number) => {
      if (count >= 0) {
        handleAddRemoveMulti(count);
        setCount(`${count}`);
      }
    },
    [handleAddRemoveMulti]
  );

  const handleCounterSubFieldChange = (index, fieldName, value) => {

    const result = handleAutoCalculation(fieldData?.subFields?.find(f => f.fieldName === fieldName), fieldData.subFields, values[name][index], fieldName, '', '', value);

    const updatedValues = values[name]?.map((_v, i) => {
      if (index === i) {
        return {
          ..._v,
          ...result
        };
      }
      return _v;
    }) || [];

    setFieldValue(name, updatedValues);

    const result2 = handleAutoCalculation(
      fieldData,
      fields,
      { ...values, [name]: updatedValues },
      name,
      '',
      '',
      updatedValues,
    );

    for (var x in result2) {
      setFieldValue(x, result2[x]);
    }
  };

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldData?.subFields));
  }, [fieldData?.subFields]);

  useEffect(() => {
    if (touched[name] && Boolean(errors[name])) {
      validate();
    }
  }, [values[name], errors, touched]);

  const validate = () => {
    const err: any = {};
    const tch: any = {};
    (values[name] || [])?.forEach((v, i) => {
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
            className="line-clamp-2 flex-grow "
            title={label}
            variant="body2"
            style={{ fontWeight: '500' }}
            color={touched[name] && Boolean(errors[name]) ? 'error' : 'primary'}
          >
            {label}
          </Typography>
          <div className="flex w-[130px] flex-shrink-0 items-center overflow-hidden">
            <IconButton
              color="secondary"
              className="!rounded-r-none !bg-[var(--new-theme-color)] hover:!opacity-80"
              style={{ maxHeight: 30, color: 'white' }}
              onClick={() => {
                handleButton(values[name]?.length - 1);
              }}
            >
              -
            </IconButton>
            <input
              className="focus: h-[30px] min-w-0 flex-grow rounded-none border p-1 text-center outline-transparent focus:outline-[--new-theme-color] focus:ring-[--new-theme-color]"
              value={count}
              onChange={handleInput}
            />
            <IconButton
              className=" !rounded-l-none !bg-[var(--new-theme-color)] hover:!opacity-80"
              style={{ maxHeight: 30, color: 'white' }}
              onClick={() => {
                handleButton(values[name]?.length + 1);
              }}
            >
              +
            </IconButton>
          </div>
        </div>
        {values[name]?.length > 0 && (
          <div className="mt-3 space-y-3">
            {values[name]?.map((value, index) => {
              return (
                <div className={`${values[name]?.length - 1 === index ? '' : 'pb-3 [border-bottom:2px_dashed_var(--common-border-color)]'} `}>
                  <Grid container spacing={1}>
                    {formsData?.length > 0 &&
                      formsData?.map((form, index1) => {
                        return form?.name ? (
                          <Grid key={index1} size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                            <Typography variant="body2">{form.name}</Typography>
                            <Box marginY={2}>
                              <Grid container spacing={1}>
                                {form?.sectionFields?.map((field, index2) => (
                                  <Grid
                                    key={index2}
                                    size={{
                                      xs: 12,
                                      sm: field?.columnSize ? field?.columnSize : gridSize(field.type),
                                      md: field?.columnSize ? field?.columnSize : gridSize(field.type),
                                      lg: field?.columnSize ? field?.columnSize : gridSize(field.type),
                                      xl: field?.columnSize ? field?.columnSize : gridSize(field.type)
                                    }}
                                  >
                                    <FormTypes
                                      {...field}
                                      fieldData={{ ...field, isCounterSubField: true }}
                                      values={value}
                                      errors={error[`${index}`] || {}}
                                      touched={touch[`${index}`] || {}}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(n, v) => {
                                        handleCounterSubFieldChange(index, n, v);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      fields={fieldData.subFields}
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </Grid>
                        ) : null;
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
