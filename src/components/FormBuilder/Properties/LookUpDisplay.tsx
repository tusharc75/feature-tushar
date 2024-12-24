import { Box, CircularProgress, Grid, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import React from 'react';
import { getResourceField } from '../helper';

function LookUpDisplay({ fields, values, fieldSet }) {
  const [resourceFields, setResourceFields] = React.useState([]);
  const [resourceFieldsLoading, setResourceFieldsLoading] = React.useState(false);

  React.useEffect(() => {
    if (values['lookUpField']) {
      getFields();
    }
  }, [values['lookUpField']]);

  const getFields = async () => {
    setResourceFieldsLoading(true);
    const resource = fields.filter((data) => data.fieldName === values['lookUpField'])[0];
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
            isOptionEqualToValue={(option: any, val) => option.fieldName === val}
            value={
              fields && fields.filter((data) => data.fieldName === values['lookUpField']).length
                ? fields && fields.filter((data) => data.fieldName === values['lookUpField'])[0]
                : ''
            }
            onChange={(e, val) => {
              fieldSet('lookUpField', val && val.fieldName ? val.fieldName : '');
            }}
            renderInput={(params) => <TextField {...params} margin="dense" variant="outlined" label="Look Up Field" placeholder="Look Up Field" />}
          />
        </Grid>
        {values['lookUpField'] && (
          <Grid item xs={6} sm={6} md={6}>
            <Autocomplete
              id="lookup-dependent-on-field"
              options={resourceFields}
              disabled={resourceFieldsLoading}
              getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
              isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
              value={
                resourceFields && resourceFields.filter((data) => data?.fieldName === values['lookUpFieldDisplay']).length
                  ? resourceFields && resourceFields.filter((data) => data?.fieldName === values['lookUpFieldDisplay'])[0]
                  : ''
              }
              onChange={(e, val) => {
                fieldSet('lookUpFieldDisplay', val && val?.fieldName ? val?.fieldName : '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  label="Look Up Field Display"
                  placeholder="Look Up Field Display"
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

export default LookUpDisplay;
