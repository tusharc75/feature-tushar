import { Grid, Typography, Box } from '@material-ui/core';
import React from 'react';
import FormTypes from '../../../components/Helpers/FormTypes';

const ProductConfiguration = ({ data, handleChange, initializeProductConfig }) => {
  const { values, fields, error } = data;

  const onChange = (name, value) => {
    let newValues = {
      ...values,
      [name]: value
    };
    handleChange(newValues);
  };

  React.useEffect(() => {
    if (fields) {
      initializeProductConfig()
    }
  }, [fields])

  if (!data || data.fields.length === 0 || !data.hasOwnProperty('fields')) return null;

  return (
    <>
      <div className="d-flex gap-2 my-2 flex-column">
        <h4>Product Configuration</h4>
        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}
      </div>
      <Grid container spacing={2}>
        {' '}
        {fields.map((field) => (
          <Grid item xs={12} key={field._id}>
            <Box pb={1}>
              <Typography variant="body1">{field.fieldLabel}</Typography>
            </Box>
            <FormTypes
              isNew={true}
              fieldData={field}
              values={values}
              errors={{}}
              touched={{}}
              label={""}
              name={field.fieldName}
              type={field.type}
              options={field.option}
              setFieldValue={onChange}
              required={field.required}
              fullWidth
              isTooltip={field?.isTooltip || false}
              tooltipMessage={field?.tooltipMessage}
              size="small"
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default ProductConfiguration;
