import React, { useCallback } from 'react';
import { Dialog, Button, Box, TextField, FormControlLabel, Checkbox, Grid } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Options from '../AddField/option';

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
        {field['type'] === 'dropDown' &&
          <Options
            field={values}
            setFields={setValues}
          />}
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
