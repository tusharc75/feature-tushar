import { TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import { useState } from 'react';

const checkboxValuesOptions = [{ label: 'Yes', value: true }];

const CheckboxDropdown = ({ value, setFieldValue, touched, errors }) => {
  const [stateValue, setStateValue] = useState(value ? checkboxValuesOptions[0] : value);
  return (
    <div>
      <Autocomplete
        id="tags-filled"
        options={checkboxValuesOptions}
        getOptionLabel={(option: any) => option.label}
        value={stateValue}
        multiple={false}
        onChange={(e, val) => {
          setStateValue(val);
          setFieldValue('defaultValue', val.value);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            variant="outlined"
            label="Default Value"
            placeholder="Default Value"
            error={touched['defaultValue'] && Boolean(errors['defaultValue'])}
            helperText={touched['defaultValue'] && errors['defaultValue']}
          />
        )}
      />
    </div>
  );
};

export default CheckboxDropdown;
