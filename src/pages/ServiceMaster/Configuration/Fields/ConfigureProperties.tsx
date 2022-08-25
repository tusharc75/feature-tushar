import React, { useCallback } from 'react';
import { Dialog, Button, Box, TextField, FormControlLabel, Checkbox, Grid } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Options from '../Option/option';
import { formatAmountWithCurrency } from 'src/constants/helpers';
import NumberFormat from 'react-number-format';

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CustomFormat = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, selectedCurrencyCode, ...other } = props;

  if (selectedCurrencyCode) {
    const { amountWithouCurrencyCode } = formatAmountWithCurrency(selectedCurrencyCode, 123456789);

    if (amountWithouCurrencyCode === '12,34,56,789') {
      return <NumberFormat {...other} getInputRef={inputRef} isNumericString thousandSeparator thousandsGroupStyle="lakh" />;
    } else if (amountWithouCurrencyCode === '1,2345,6789') {
      return <NumberFormat {...other} getInputRef={inputRef} isNumericString thousandSeparator thousandsGroupStyle="wan" />;
    } else {
      return <NumberFormat {...other} getInputRef={inputRef} isNumericString thousandSeparator thousandsGroupStyle="thousand" />;
    }
  } else {
    return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
  }
};

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
        {field['type'] === 'number' && values?.rangeValidation &&
          <>
            <Box mt={2}>
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
                    InputProps={{
                      inputComponent: CustomFormat as any,
                      inputProps: {
                        allowNegative: false,
                        onValueChange: (values) => {
                          setValues((prevState) => ({ ...prevState, minValue: values.value }));
                        },
                      },
                    }}
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
                    InputProps={{
                      inputComponent: CustomFormat as any,
                      inputProps: {
                        allowNegative: false,
                        onValueChange: (values) => {
                          setValues((prevState) => ({ ...prevState, maxValue: values.value }));
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </>}
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
          {field['type'] === 'number' &&
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
            />}
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
