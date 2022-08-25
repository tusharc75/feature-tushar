import React, { useCallback } from 'react';
import { Dialog, Button, Box, TextField, FormControlLabel, Checkbox, Grid } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Options from '../Option/option';
import { Autocomplete } from '@material-ui/lab';
import Chip from '@material-ui/core/Chip';

const ConfigureProperties = ({ close, field, setFields, steps }: any) => {

  const [values, setValues] = React.useState(field);
  const [stepOption, setStepOption] = React.useState([]);

  React.useEffect(() => {
    const option = []
    steps?.forEach((e) => {
      option.push({ optionLabel: e.stepName, optionValue: e._id })
    })
    setStepOption(option)
  }, []);

  const onSave = () => {
    setFields((prevState) =>
      prevState?.map((f) => {
        if (f._id === field._id) {
          return values;
        }
        return f;
      })
    );
    close();
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="md">
      <CustomDialogHeader title="Properties" onClose={close} />
      <CustomDialogContent>
        <Box mt={2}>
          <TextField
            fullWidth
            size="small"
            label="Field Label"
            variant="outlined"
            value={values.fieldLabel}
            onChange={(e) => setValues((prevState) => ({ ...prevState, fieldLabel: e.target.value }))}
          />
        </Box>
        {(field['type'] === 'dropDown' || field['type'] === 'multiSelect') &&
          <Options
            field={values}
            setFields={setValues}
          />}
        {field['type'] === 'number' &&
          <Box mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  name="rangeValidation"
                  checked={values?.rangeValidation}
                  onChange={(e) => {
                    setValues((prevState) => ({
                      ...prevState,
                      rangeValidation: e.target.checked
                    }));
                  }}
                  color="primary"
                />
              }
              label="Range Validation"
            />
            {values?.rangeValidation && <Box mt={2}>
              <Grid spacing={3} container>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Minimum Value"
                    variant="outlined"
                    value={values?.minValue}
                    onChange={(e) => setValues((prevState) => ({ ...prevState, minValue: e.target.value }))}
                    InputLabelProps={{
                      shrink: values?.minValue ? true : false
                    }}
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Maximum Value"
                    variant="outlined"
                    value={values?.maxValue}
                    onChange={(e) => setValues((prevState) => ({ ...prevState, maxValue: e.target.value }))}
                    InputLabelProps={{
                      shrink: values?.maxValue ? true : false
                    }}
                    type="number"
                  />
                </Grid>
              </Grid>
            </Box>}
          </Box>}
        <Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                name="required"
                checked={values?.required}
                onChange={(e) => {
                  setValues((prevState) => ({
                    ...prevState,
                    required: e.target.checked
                  }));
                }}
                color="primary"
              />
            }
            label="Required"
          />
        </Box>
        <Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                name="isJumpStep"
                checked={values?.isJumpStep}
                onChange={(e) => {
                  setValues((prevState) => ({
                    ...prevState,
                    isJumpStep: e.target.checked
                  }));
                }}
                color="primary"
              />
            }
            label="Jump Step (If value valid)"
          />
          {values?.isJumpStep && <Box mt={2}>
            <Autocomplete
              options={stepOption}
              fullWidth
              multiple
              size="small"
              value={values?.jumpSteps ? stepOption?.filter((data: any) => values?.jumpSteps?.includes(data.optionValue)) : []}
              getOptionLabel={(option) => option.optionLabel}
              getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
              onChange={(_, newVal: any) => {
                setValues((prevState) => ({ ...prevState, jumpSteps: newVal?.map((val) => val.optionValue) }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Jump Steps"
                  name="jumpSteps"
                  variant="outlined"
                />
              )}
            />
          </Box>}
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" size="small" color="primary" onClick={close}>
          Close
        </Button>
        <Button variant="contained" size="small" color="primary" onClick={onSave}>
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ConfigureProperties;
