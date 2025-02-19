import { Box, Grid, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getObjKeys, gridSize, setFieldsInAscendingOrder } from 'src/constants/helpers';
import FormTypes from '../../FormTypes';

const Counter = ({ label, values, name, setFieldValue, fieldData, touched, errors, defaultValue, ...rest }) => {
  const [error, setError] = useState({});
  const [touch, setTouch] = useState({});
  const [formsData, setFormsData] = useState([]);
  const [count, setCount] = useState(() => (isNaN(+defaultValue) || !defaultValue ? '0' : defaultValue));

  const handleAddRemove = useCallback(
    (type, data = []) => {
      if (type === 'add') {
        if (fieldData?.subFields?.length > 0) {
          data.splice(values[name]?.length, 0, getObjKeys('', fieldData?.subFields || []));
        }
      } else {
        data.splice(values[name]?.length - 1, 1);
      }
      return data;
    },
    [fieldData?.subFields, name, values]
  );

  const handleAddRemoveMulti = useCallback(
    (count: number) => {
      let data = values[name] || [];
      const length = values[name]?.length || 0;
      if (length < count) {
        for (let i = 0; i < count - length; i++) {
          data = handleAddRemove('add', data);
        }
      }
      if (length > count) {
        for (let i = 0; i < length - count; i++) {
          data = handleAddRemove('remove', data);
        }
      }
      setFieldValue(name, data);
    },
    [handleAddRemove, name, setFieldValue, values]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      if (value === '') {
        setCount('');
        return;
      }
      if (!isNaN(+value) && +value >= 0) {
        setCount(value);
        handleAddRemoveMulti(+value);
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

  useEffect(() => {
    if (defaultValue && !isNaN(+defaultValue)) {
      handleAddRemoveMulti(+defaultValue);
    }
  }, [defaultValue]);

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
        {values[name].length > 0 && (
          <div className="mt-3 space-y-3">
            {values[name]?.map((value, index) => {
              return (
                <div className={`${values[name].length - 1 === index ? '' : 'pb-3 [border-bottom:2px_dashed_var(--common-border-color)]'} `}>
                  <Grid container spacing={1}>
                    {formsData.length > 0 &&
                      formsData?.map((form, index1) => {
                        return form?.name ? (
                          <Grid key={index1} item xs={12} sm={12} md={12} lg={12} xl={12}>
                            <Typography variant="body2">{form.name}</Typography>
                            <Box marginY={2}>
                              <Grid container spacing={1}>
                                {form?.sectionFields?.map((field, index2) => (
                                  <Grid
                                    key={index2}
                                    item
                                    xs={12}
                                    sm={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                                    md={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                                    lg={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                                    xl={field?.columnSize ? field?.columnSize : gridSize(field.type)}
                                  >
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
