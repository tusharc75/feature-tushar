import { Autocomplete, Box, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { Field, FieldArray } from 'formik';
import Grid from '@mui/material/Grid2';

const EntityResource = ({ values, setFieldValue, errors, touched, entities }) => {
  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            name="entityWiseResourceName"
            checked={values['entityWiseResourceName']}
            onChange={(e) => {
              const val = e.target.checked;
              setFieldValue('entityWiseResourceName', val);
              setFieldValue('entityResources', []);
            }}
            color="primary"
          />
        }
        label="Entity Wise Resoure Name"
      />
      {values.entityWiseResourceName && (
        <Box pt={1} pb={1}>
          <Autocomplete
            id="entities"
            multiple
            size="small"
            disableCloseOnSelect
            options={entities || []}
            getOptionLabel={(option: any) => (option ? option?.entityName : '')}
            isOptionEqualToValue={(option: any, val) => option?._id === val?._id}
            value={entities?.filter((e) => values?.entityResources?.map((v) => v?.entity)?.includes(e?._id))}
            onChange={(e, val) => {
              setFieldValue(
                'entityResources',
                val?.map((v) => {
                  const _data = values?.entityResources?.find((e) => e?.entity === v?._id);
                  return { entity: v?._id, resourceLabel: _data?.resourceLabel || '', homePageLabel: _data?.homePageLabel || '' };
                })
              );
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" size="small" variant="outlined" label="Entities" fullWidth name="entities" />
            )}
          />
          <FieldArray
            name="entityResources"
            render={(arrayHelpers) =>
              values?.entityResources?.map((data, index) => (
                <div className="mt-1">
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 4 }}>
                      <TextField
                        disabled
                        variant="outlined"
                        size="small"
                        value={entities.find((e) => e._id === data?.entity)?.entityName || ''}
                        label="Entity"
                        fullWidth
                        margin="dense"
                      />
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <TextField
                        size="small"
                        margin="dense"
                        variant="outlined"
                        fullWidth
                        required={true}
                        label={'Resource Label (Singular)'}
                        name={'resourceLabel'}
                        value={data?.resourceLabel}
                        onChange={(e) => {
                          arrayHelpers.replace(index, {
                            ...values?.entityResources[index],
                            ['resourceLabel']: e.target.value
                          });
                        }}
                        error={
                          touched &&
                          touched?.entityResources &&
                          touched?.entityResources?.[index]?.resourceLabel &&
                          Boolean(errors[`entityResources.${index}.resourceLabel`])
                        }
                        helperText={
                          touched &&
                          touched?.entityResources &&
                          touched?.entityResources?.[index]?.resourceLabel &&
                          errors[`entityResources.${index}.resourceLabel`]
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <TextField
                        size="small"
                        margin="dense"
                        variant="outlined"
                        fullWidth
                        required={true}
                        label={'Resource Label (Plural)'}
                        name={'homePageLabel'}
                        value={data?.homePageLabel}
                        onChange={(e) => {
                          arrayHelpers.replace(index, {
                            ...values?.entityResources[index],
                            ['homePageLabel']: e.target.value
                          });
                        }}
                        error={
                          touched &&
                          touched?.entityResources &&
                          touched?.entityResources?.[index]?.homePageLabel &&
                          Boolean(errors[`entityResources.${index}.homePageLabel`])
                        }
                        helperText={
                          touched &&
                          touched?.entityResources &&
                          touched?.entityResources?.[index]?.homePageLabel &&
                          errors[`entityResources.${index}.homePageLabel`]
                        }
                      />
                    </Grid>
                  </Grid>
                </div>
              ))
            }
          />
        </Box>
      )}
    </>
  );
};

export default EntityResource;
