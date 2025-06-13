import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import axiosInstance from '../../../axios/axiosInstance';
import { Checkbox, FormControlLabel, Grid } from '@mui/material';

export const MinMax = ({ values, fieldData, setFieldValue, touched, errors }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Service Master`)
      .then(({ data: { data } }) => {
        setServices(data['Service Master']);
      });
  }, []);


  return (
    <Box>
      {fieldData.type === 'decimal' &&
        <>
          <FormControlLabel
            control={
              <Checkbox
                name="isMinMaxValue"
                checked={values['isMinMaxValue']}
                onChange={(e) => {
                  setFieldValue('isMinMaxValue', e.target.checked);
                }}
                color="primary"
              />
            }
            label="Min Max Value"
          />
          {values['isMinMaxValue'] && (
            <Grid spacing={2} container>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={'Min Value'}
                  name={'minValue'}
                  margin="dense"
                  size="small"
                  type="number"
                  value={values['minValue']}
                  error={touched['minValue'] && Boolean(errors['minValue'])}
                  helperText={touched['minValue'] && errors['minValue']}
                  onChange={(e) => {
                    setFieldValue('minValue', parseFloat(e.target.value.replace(/[^0-9\.]/g, '')));
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={'Max Value'}
                  name={'maxValue'}
                  margin="dense"
                  size="small"
                  type="number"
                  value={values['maxValue']}
                  error={touched['maxValue'] && Boolean(errors['maxValue'])}
                  helperText={touched['maxValue'] && errors['maxValue']}
                  onChange={(e) => {
                    setFieldValue('maxValue', parseFloat(e.target.value.replace(/[^0-9\.]/g, '')));
                  }}
                />
              </Grid>
              {services.length !== 0 && (
                <>
                  <Grid item xs={12} sm={6} md={6}>
                    <Autocomplete
                      options={services}
                      fullWidth
                      value={values?.minValueServiceAdd ? services?.find((data: any) => values?.minValueServiceAdd === data.optionValue) : []}
                      getOptionLabel={(option) => option.optionLabel || ''}
                      isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                      onChange={(_, newVal: any) => {
                        setFieldValue('minValueServiceAdd', newVal?.optionValue);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" size="small" label="Add Service, if value less than min." name="passAddon" variant="outlined" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <Autocomplete
                      options={services}
                      fullWidth
                      value={values?.maxValueServiceAdd ? services?.find((data: any) => values?.maxValueServiceAdd === data.optionValue) : []}
                      getOptionLabel={(option) => option.optionLabel || ''}
                      isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                      onChange={(_, newVal: any) => {
                        setFieldValue('maxValueServiceAdd', newVal?.optionValue);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" size="small" label="Add Service, if value more than max." name="passAddon" variant="outlined" />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </>}
      {fieldData.type === 'radio' &&
        <>
          <FormControlLabel
            control={
              <Checkbox
                name="enableServicesAddOnBasedOnValue"
                checked={values['enableServicesAddOnBasedOnValue']}
                onChange={(e) => {
                  setFieldValue('enableServicesAddOnBasedOnValue', e.target.checked);
                }}
                color="primary"
              />
            }
            label="Enable Services Add-On Based On Value"
          />
          {values['enableServicesAddOnBasedOnValue'] && (
            fieldData?.option?.map((option) => (
              <Autocomplete
                options={services}
                fullWidth
                value={values?.enableServicesAddOnBasedOnValue ?
                  services?.filter((data: any) => (values?.servicesAddOnBasedOnValue?.find((e) => e.value === option?.optionValue)?.services || [])?.includes(data.optionValue)) : []}
                getOptionLabel={(option) => option.optionLabel || ''}
                isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                onChange={(_, newVal: any) => {
                  const temp = values?.servicesAddOnBasedOnValue || []
                  if (temp?.find((e) => e.value === option?.optionValue)) {
                    temp?.forEach((e) => {
                      if (e.value === option?.optionValue) {
                        e.services = newVal.map((val) => val?.optionValue);
                      }
                    })
                  }
                  else {
                    temp.push({ value: option?.optionValue, services: newVal.map((val) => val?.optionValue) })
                  }
                  setFieldValue('servicesAddOnBasedOnValue', temp);
                }}
                multiple
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    size="small"
                    label={`Add Services, if value ${option?.optionLabel}`}
                    name="passAddon"
                    variant="outlined" />
                )}
              />
            ))
          )}
        </>}
    </Box >
  );
};
