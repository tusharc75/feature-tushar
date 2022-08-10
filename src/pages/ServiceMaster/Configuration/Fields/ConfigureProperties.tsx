import React from 'react';
import { Dialog, Button, Box, TextField, FormControlLabel, Checkbox } from '@material-ui/core';

import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';

const ConfigureProperties = ({ close, field, setFields }: any) => {
  const [values, setValues] = React.useState(field);

  //   React.useEffect(() => {
  //     setValues(field);
  //   }, [field]);

  const onSave = () => {
    setFields((prevState) =>
      prevState.map((f) => {
        if (f.id === field.if) {
          return values;
        }

        return f;
      })
    );
    close()
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="md">
      <CustomDialogHeader title="Properties" onClose={close} />
      <CustomDialogContent>
        <TextField
          fullWidth
          size="small"
          label="Field Label"
          variant="outlined"
          value={values.fieldLabel}
          onChange={(e) => setValues((prevState) => ({ ...prevState, fieldLabel: e.target.value }))}
        />

        <Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                name="required"
                //disabled={values['required'] ? true : false}
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
        <Button variant="outlined" size="small" color="primary" onClick={onSave}>
          Save
        </Button>
        <Button variant="outlined" size="small" color="primary" onClick={close}>
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ConfigureProperties;
