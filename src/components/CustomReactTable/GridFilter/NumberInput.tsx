import { Chip, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';

const NumberInput = ({ errors, touched, value, fieldLabel, onChange, fieldName, required = false }) => {
  return (
    <div>
      <Autocomplete
        options={[]}
        value={value}
        onChange={(event, newValue) => {
          onChange(
            event,
            newValue.map((d) => Number(d))
          );
        }}
        freeSolo={true}
        multiple={true}
        renderTags={(value, props) => value.map((option, index) => <Chip label={`${option}`} {...props({ index })} />)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={fieldLabel}
            name={fieldName}
            required={required}
            error={touched && Boolean(errors[fieldName])}
            helperText={touched && errors[fieldName]}
            margin="none"
            size={'small'}
            variant="outlined"
          />
        )}
      />
    </div>
  );
};

export default NumberInput;
