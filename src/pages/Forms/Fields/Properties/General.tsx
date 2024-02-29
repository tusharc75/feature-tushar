import { Box, Checkbox, FormControlLabel, TextField } from '@material-ui/core';

export default function General({ values, touched, errors, setFieldValue }) {
  return (
    <Box p={1}>
      <TextField
        variant="outlined"
        type="text"
        label="Field Label"
        required={true}
        name="fieldLabel"
        fullWidth
        margin="dense"
        disabled={!values['editAble']}
        value={values['fieldLabel']}
        error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
        helperText={touched['fieldLabel'] && errors['fieldLabel']}
        onChange={(e) => {
          setFieldValue('fieldLabel', e.target.value.trimStart());
        }}
      />

      <Box pt={1}>
        <FormControlLabel
          control={
            <Checkbox
              name="required"
              checked={values['required']}
              onChange={(e) => {
                setFieldValue('required', e.target.checked);
              }}
              color="primary"
            />
          }
          label="Required"
        />
      </Box>
    </Box>
  );
}
