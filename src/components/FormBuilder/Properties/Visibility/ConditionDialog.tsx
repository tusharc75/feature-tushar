import { Box, Button, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { getLookupOption } from '../../helper';
import { isEmpty, map } from 'lodash';

const ConditionDialog = ({ onClose, data, values, setFieldValue, fields, fieldData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [condition, setCondition] = useState({ fieldName: '', value: null });
  const [options, setOptions] = useState([]);
  const [error, setErrors] = useState(null);

  useEffect(() => {
    setCondition({ fieldName: data?.fieldName, value: data?.value });
  }, [data]);

  useEffect(() => {
    if (
      condition?.fieldName &&
      (fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'dropDown' ||
        fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'multiSelect') &&
      fields?.find((f) => f?.fieldName === condition?.fieldName)?.lookup
    ) {
      getData();
    }
  }, [condition?.fieldName]);

  const getData = async () => {
    var data = await getLookupOption('', fields?.find((f) => f?.fieldName === condition?.fieldName)?.lookupResource);
    if (fields?.find((f) => f?.fieldName === condition?.fieldName)?.lookupResource === sidebarResource.user) {
      data = [{ optionLabel: 'Current User', optionValue: 'Current User' }, ...data];
    }
    setOptions(data);
  };

  const validate = (values: any) => {
    const errors: any = {};
    if (!values?.fieldName) {
      errors['fieldName'] = 'Required Field';
    }
    if (!values?.value) {
      errors['value'] = 'Required Field';
    }
    setErrors(errors);
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      className="properties_dialog_height"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader
        title={'Condition'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
      ></CustomDialogHeader>
      <CustomDialogContent>
        <Box>
          <Autocomplete
            id="fieldList"
            options={
              fields?.filter((f) => f?.fieldName !== fieldData?.fieldName)?.length > 0
                ? fields
                    ?.filter((f) => f?.fieldName !== fieldData?.fieldName)
                    ?.map((_f) => ({ optionLabel: _f?.fieldLabel, optionValue: _f?.fieldName }))
                : []
            }
            getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
            getOptionSelected={(option: any, val) => option.optionValue === val}
            value={
              fields
                ?.filter((f) => f?.fieldName === condition?.fieldName)
                ?.map((_f) => ({ optionLabel: _f?.fieldLabel, optionValue: _f?.fieldName }))[0]
            }
            onChange={(e: any, value) => {
              setCondition({ fieldName: value && value?.optionValue ? value.optionValue : '', value: null });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                variant="outlined"
                label="Field List"
                placeholder="Field List"
                name="fieldName"
                required
                error={error && Boolean(error?.fieldName)}
                helperText={error && error?.fieldName}
              />
            )}
          />
          {condition?.fieldName &&
            (fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'dropDown' ||
            fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'multiSelect' ? (
              fields?.find((f) => f?.fieldName === condition?.fieldName)?.lookup ? (
                <Autocomplete
                  id="tags-filled"
                  options={options}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  value={
                    condition?.value && fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'multiSelect'
                      ? options?.filter((data) =>
                          map(condition?.value, (optionValue) => {
                            return optionValue;
                          })?.includes(data?.optionValue)
                        )
                      : options?.filter((data) => data?.optionValue === condition?.value)?.length > 0
                      ? options?.filter((data) => data?.optionValue === condition?.value)[0]
                      : fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'multiSelect'
                      ? []
                      : ''
                  }
                  multiple={fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'multiSelect' ? true : false}
                  onChange={(e, val) => {
                    if (fields?.find((f) => f?.fieldName === condition?.fieldName)?.type === 'multiSelect') {
                      const res = [];
                      val?.forEach((e) => {
                        res.push(e.optionValue ? e.optionValue : e);
                      });
                      setCondition({ ...condition, value: val });
                    } else {
                      setCondition({ ...condition, value: val && val?.optionValue ? val?.optionValue : '' });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      variant="outlined"
                      label="Value"
                      name="value"
                      placeholder="Value"
                      // error={touched['defaultValue'] && Boolean(errors['defaultValue'])}
                      // helperText={touched['defaultValue'] && errors['defaultValue']}
                    />
                  )}
                />
              ) : (
                <>aaa</>
              )
            ) : (
              <TextField
                variant="outlined"
                type="text"
                label="Value"
                name="value"
                rows={4}
                fullWidth
                margin="dense"
                value={condition?.value}
                error={error && Boolean(error?.value)}
                helperText={error && error?.value}
                onChange={(e) => {
                  setCondition({ ...condition, value: e.target.value.trimStart() });
                }}
              />
            ))}
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          size="small"
          type="submit"
          color="primary"
          variant="contained"
          onClick={() => {
            if (isEmpty(validate(condition))) {
              let visibilityCondition = values?.visibilityCondition || [];
              if (visibilityCondition?.some((c) => c?.fieldName === condition?.fieldName)) {
                visibilityCondition = visibilityCondition?.map((item) => {
                  if (item.fieldName === condition?.fieldName) {
                    return { ...item, value: condition?.value };
                  }
                  return item;
                });
              } else {
                visibilityCondition = [...visibilityCondition, condition];
              }
              setFieldValue('visibilityCondition', visibilityCondition);
              onClose();
            }
          }}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ConditionDialog;
