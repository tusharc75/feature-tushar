import React, { useCallback } from 'react';
import { Dialog, Button, Box, TextField, FormControlLabel, Checkbox, Grid } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Options from '../Option/option';

const ConfigureProperties = ({ close, field, setFields }: any) => {

  const [values, setValues] = React.useState(field);

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
