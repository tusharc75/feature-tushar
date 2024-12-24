import { Box, CircularProgress, Grid, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import { getResourceField } from '../helper';

function FieldDependent({ fields, values, fieldSet }) {
  const [resourceFields, setResourceFields] = React.useState([]);
  const [resourceFieldsLoading, setResourceFieldsLoading] = React.useState(false);

  React.useEffect(() => {
    if (values['lookupDependentOn']) {
      getFields();
    }
  }, [values['lookupDependentOn']]);

  const getFields = async () => {
    setResourceFieldsLoading(true);
    const resource = fields.filter((data) => data.fieldName === values['lookupDependentOn'])[0];
    try {
      const data: any = await getResourceField(resource.lookupResource);
      setResourceFields(data);
      setResourceFieldsLoading(false);
    } catch (e) {
      setResourceFieldsLoading(false);
    }
  };

  return (
    <Box pt={1} pb={1}>
      <Grid container spacing={1}>
        <Grid item xs={6} sm={6} md={6}>
          <Autocomplete
            id="lookup-dependent-on"
            options={fields && fields.filter((_f) => _f._id !== values['_id'] && _f.type === 'dropDown' && _f?.lookup)}
            getOptionLabel={(option: any) => (option ? option.fieldLabel : '')}
            getOptionSelected={(option: any, val) => option.fieldName === val}
            value={
              fields && fields.filter((data) => data.fieldName === values['lookupDependentOn']).length
                ? fields && fields.filter((data) => data.fieldName === values['lookupDependentOn'])[0]
                : ''
            }
            onChange={(e, val) => {
              fieldSet('lookupDependentOn', val && val.fieldName ? val.fieldName : '');
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" variant="outlined" label="Lookup Dependent On" placeholder="Lookup Dependent On" />
            )}
          />
        </Grid>
        {values['lookupDependentOn'] && (
          <Grid item xs={6} sm={6} md={6}>
            <Autocomplete
              id="lookup-dependent-on-field"
              options={resourceFields}
              disabled={resourceFieldsLoading}
              getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
              getOptionSelected={(option: any, val) => option?.fieldName === val}
              value={
                resourceFields && resourceFields.filter((data) => data?.fieldName === values['lookupDependentOnField']).length
                  ? resourceFields && resourceFields.filter((data) => data?.fieldName === values['lookupDependentOnField'])[0]
                  : ''
              }
              onChange={(e, val) => {
                fieldSet('lookupDependentOnField', val && val?.fieldName ? val?.fieldName : '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  label="Lookup Dependent On Field"
                  placeholder="Lookup Dependent On Field"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {resourceFieldsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    )
                  }}
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default FieldDependent;
