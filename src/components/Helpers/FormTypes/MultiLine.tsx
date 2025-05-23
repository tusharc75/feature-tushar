
import { TextField } from '@mui/material';

function MultiLine({ value, label, required, onChange, name = '', rest = {}, error = false, touched = '', type = 'text' }) {

  return (
    <TextField
      {...rest}
      variant="outlined"
      type={type}
      multiline
      label={label}
      fullWidth
      name={name}
      required={required}
      rows={3}
      value={value}
      error={error}
      helperText={touched}
      onChange={onChange}
      sx={{
        '& .MuiInputBase-root textarea': {
          resize: 'vertical',
          overflow: 'auto',
        },
      }}
    />
  );
}

export default MultiLine;
