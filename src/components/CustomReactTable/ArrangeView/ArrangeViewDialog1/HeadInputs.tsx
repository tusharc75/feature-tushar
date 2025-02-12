import { Checkbox, FormControlLabel, Radio, RadioGroup, TextField } from '@mui/material';
import { memo } from 'react';
import { HeadInputProps } from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog1/types';

const HeadInputs = memo(({ state, setFieldValue, values, touched, errors }: HeadInputProps) => {
  return (
    <div className="flex flex-wrap justify-between py-2">
      <div className="mr-2 flex-grow max-md:w-full md:max-w-[--sidebar-width]">
        <TextField
          fullWidth
          value={values['name']}
          onChange={(e) => {
            setFieldValue('name', e.target.value.trimStart());
          }}
          id="view-name"
          name="name"
          label="Name"
          variant="outlined"
          size="small"
          required
          autoComplete="off"
          error={touched['name'] && Boolean(errors['name'])}
          helperText={touched['name'] && errors['name']}
        />
      </div>
      <RadioGroup
        row
        aria-labelledby="view-access-radio-button"
        value={values['access']}
        onChange={(e) => {
          setFieldValue('access', e.target.value.trimStart());
        }}
        name="access"
      >
        <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
        <FormControlLabel value="private" control={<Radio size="small" />} label="Private" />
      </RadioGroup>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={values['default']}
            onChange={(e) => {
              setFieldValue('default', e.target.checked);
            }}
            name="default"
          />
        }
        label="Set as default"
      />
    </div>
  );
});

export default HeadInputs;
