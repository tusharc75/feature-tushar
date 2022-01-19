import * as React from 'react';
import { Typography, Grid, TextField, FormControlLabel, Checkbox, Box } from '@material-ui/core';
import { CreditCardOutlined } from '@material-ui/icons';
import NumberFormat, { NumberFormatValues, NumberFormatPropsBase } from 'react-number-format';

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CustomFormatCard = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, ...other } = props;
  return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
};

const CustomFormatCardCVV = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, ...other } = props;
  return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
};

const CustomFormatExpiryDate = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, ...other } = props;

  const limit = (val, max) => {
    if (val.length === 1 && val[0] > max[0]) {
      val = '0' + val;
    }
    if (val.length === 2) {
      if (Number(val) === 0) {
        val = '01';
        //this can happen when user paste number
      } else if (val > max) {
        val = max;
      }
    }
    return val;
  };

  const cardExpiry = (val) => {
    let month = limit(val.substring(0, 2), '12');
    let year = val.substring(2, 4);

    return month + (year.length ? '/' + year : '');
  };

  return <NumberFormat {...other} getInputRef={inputRef} format={cardExpiry} isNumericString />;
};

const PaymentForm = ({ form, setForm, error }) => {
  const cardNumberRef = React.useRef(null);
  const cardDateRef = React.useRef(null);

  const handleChange = (name: string, value: string) => {
    setForm((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        Payment details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            inputRef={cardNumberRef}
            id="cardNumber"
            label="Card number"
            fullWidth
            autoComplete="cc-number"
            variant="outlined"
            value={form.cardNumber}
            InputProps={{
              endAdornment: <CreditCardOutlined color="action" />,
              inputComponent: CustomFormatCard as any,
              inputProps: {
                allowNegative: false,
                decimalSeparator: '.',
                displayType: 'input',
                type: 'text',
                thousandSeparator: true,
                placeholder: '1111 2222 3333 4444',
                format: '#### #### #### ####',
                onValueChange: (values: NumberFormatValues) => {
                  handleChange('cardNumber', values.value);
                }
              } as NumberFormatPropsBase
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                id="expDate"
                label="Expiry date"
                fullWidth
                autoComplete="cc-exp"
                variant="outlined"
                value={form.expiryDate}
                InputProps={{
                  inputComponent: CustomFormatExpiryDate as any,
                  inputProps: {
                    allowNegative: false,
                    decimalSeparator: '.',
                    displayType: 'input',
                    type: 'text',
                    thousandSeparator: true,
                    placeholder: 'MM/YY',
                    mask: ['M', 'M', 'Y', 'Y'],
                    onValueChange: (values: NumberFormatValues) => {
                      handleChange('expiryDate', values.value);
                    }
                  } as NumberFormatPropsBase
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                id="cvv"
                label="CVV"
                fullWidth
                autoComplete="cc-csc"
                variant="outlined"
                value={form.cvv}
                InputProps={{
                  inputComponent: CustomFormatCardCVV as any,
                  inputProps: {
                    allowNegative: false,
                    decimalSeparator: '.',
                    displayType: 'input',
                    type: 'text',
                    thousandSeparator: true,
                    placeholder: '123',
                    format: '###',
                    onValueChange: (values: NumberFormatValues) => {
                      handleChange('cvv', values.value);
                    }
                  } as NumberFormatPropsBase
                }}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="cardName"
            label="Name on card"
            fullWidth
            placeholder="Jhon Doe"
            autoComplete="cc-name"
            variant="outlined"
            value={form.name}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val)) {
                handleChange('name', val.trimStart());
              }
            }}
          />
        </Grid>

        {error && (
          <Box textAlign={'center'} width={'100%'}>
            <Typography variant="subtitle1" component="div" color="error">
              {error}
            </Typography>
          </Box>
        )}

        <Grid item xs={12}>
          <FormControlLabel control={<Checkbox color="secondary" name="saveCard" value="yes" />} label="Remember card details for next time" />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default PaymentForm;
