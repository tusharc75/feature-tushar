import { useState } from 'react';
import { Grid } from '@material-ui/core';
import FormTypes from '../../../components/Helpers/FormTypes';

const ProductConfiguration = ({ data, handleChange }) => {
  const { values: initialValues, fields } = data;
  const [formData, setFormData] = useState({
    values: initialValues,
  })
  if (!data || data.fields.length === 0 || !data.hasOwnProperty('fields')) return null;


  const onChange = (name, value) => {
    setFormData(prevState => {
      const { values } = prevState
      let newValues = {
        ...values,
        [name]: value,
      }
      handleChange(newValues)
      return  {
        ...prevState,
        values: newValues
      }
    })
  }

  return ( <Grid container spacing={2}> {fields.map((field) => (
    <Grid item xs={6}>
      <FormTypes
        isNew={true}
        {...field}
        values={formData.values}
        errors={{}}
        touched={{}}
        label={field.fieldLabel}
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
  </Grid>)
};

export default ProductConfiguration;
