import { Box, Chip, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import { defaultStepper } from './stepHelper';

function Stepper({ steppers, setSteppers, resource }) {
  const stepperOptions = defaultStepper?.filter((item) => item?.resource === resource) || [];
  return (
    <Box textAlign={'center'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
      <Autocomplete
        multiple
        fullWidth
        options={stepperOptions}
        getOptionLabel={(option) => {
          return option?.name || '';
        }}
        onChange={(e, value, reason) => {
          const steppersData = value?.map((i: any) => i?.name);
          setSteppers(steppersData);
        }}
        value={stepperOptions?.filter((item) => steppers?.includes(item?.name)) || []}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => <Chip variant="outlined" label={option && option?.name} {...getTagProps({ index })} />)
        }
        renderInput={(params) => <TextField {...params} variant="outlined" label={'Steppers'} margin="dense" />}
      />
    </Box>
  );
}

export default Stepper;
