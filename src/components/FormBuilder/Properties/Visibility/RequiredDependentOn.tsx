import { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { Checkbox, FormControlLabel } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { checkBoxOptions, getResourceField } from 'src/components/FormBuilder/helper';
import React from 'react';
import { Box, CircularProgress, TextField } from '@mui/material';

const RequiredDependentOn = ({ values, setFieldValue, touched, errors, fields }) => {

  const [requiredDependentOnFields, setRequiredDependentOnFields] = useState([]);
  const [requiredDependentOnFieldsLoading, setRequiredDependentOnFieldsLoading] = useState(false);

  const getRequiredDependentOnFields = async () => {
    setRequiredDependentOnFieldsLoading(true);
    const resource = fields.filter((data) => data.fieldName === values['requiredDependentOn'])[0];
    try {
      let data: any = await getResourceField(resource.lookupResource);
      data = data.filter((data) => data.type === 'checkBox');
      setRequiredDependentOnFields(data);
      setRequiredDependentOnFieldsLoading(false);
    } catch (e) {
      setRequiredDependentOnFieldsLoading(false);
    }
  };

  useEffect(() => {
    if (values['requiredDependentOn']) {
      getRequiredDependentOnFields();
    }
  }, [values['requiredDependentOn']]);

  return (
    <Box>
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              name="enableRequiredDependentOn"
              checked={values['enableRequiredDependentOn']}
              onChange={(e) => {
                setFieldValue('enableRequiredDependentOn', e.target.checked);
                setFieldValue('requiredDependentOn', []);
              }}
              color="primary"
            />
          }
          label="Enable Required Dependent On"
        />
      </Box>
      <Box>
        {values['enableRequiredDependentOn'] && (
          <>
            <Autocomplete
              id="required-dependent-on"
              options={fields && fields.filter((_f) => _f._id !== values['_id'] && ['dropDown', 'multiSelect']?.includes(_f.type) && _f?.lookup)}
              getOptionLabel={(option: any) => (option ? option.fieldLabel || '' : '')}
              isOptionEqualToValue={(option: any, val) => option.fieldName === val}
              value={
                fields && fields.filter((data) => data.fieldName === values['requiredDependentOn']).length
                  ? fields && fields.filter((data) => data.fieldName === values['requiredDependentOn'])[0]
                  : ''
              }
              onChange={(e, val) => {
                setFieldValue('requiredDependentOn', val && val.fieldName ? val.fieldName : '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  label="Required Dependent On"
                  placeholder="Required Dependent On"
                  size="small"
                />
              )}
            />
            {values['requiredDependentOn'] && (
              <Grid container spacing={1}>
                <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                  <Autocomplete
                    id="required-dependent-on-field"
                    options={requiredDependentOnFields}
                    disabled={requiredDependentOnFieldsLoading}
                    getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                    isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
                    value={
                      requiredDependentOnFields &&
                      requiredDependentOnFields.filter((data) => data?.fieldName === values['requiredDependentOnField']).length
                        ? requiredDependentOnFields &&
                          requiredDependentOnFields.filter((data) => data?.fieldName === values['requiredDependentOnField'])[0]
                        : ''
                    }
                    onChange={(e, val) => {
                      setFieldValue('requiredDependentOnField', val && val?.fieldName ? val?.fieldName : '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="dense"
                        size="small"
                        variant="outlined"
                        label="Required Dependent On Field"
                        placeholder="Required Dependent On Field"
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {requiredDependentOnFieldsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            )
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                  <Autocomplete
                    id="requiredDependentOnFieldValue"
                    disabled={values['requiredDependentOnField'] ? false : true}
                    options={checkBoxOptions}
                    getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                    isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                    value={
                      checkBoxOptions?.filter((f) => f?.optionValue === values?.requiredDependentOnFieldValue)?.length > 0
                        ? checkBoxOptions?.filter((f) => f?.optionValue === values?.requiredDependentOnFieldValue)[0]
                        : ''
                    }
                    onChange={(e: any, value) => {
                      setFieldValue('requiredDependentOnFieldValue', value && value?.optionValue ? value.optionValue : '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="dense"
                        size="small"
                        variant="outlined"
                        label="Required Dependent On Field Value"
                        placeholder="Required Dependent On Field Value"
                        name="requiredDependentOnFieldValue"
                        required
                        error={touched['requiredDependentOnFieldValue'] && Boolean(errors['requiredDependentOnFieldValue'])}
                        helperText={touched['requiredDependentOnFieldValue'] && errors['requiredDependentOnFieldValue']}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default RequiredDependentOn;
