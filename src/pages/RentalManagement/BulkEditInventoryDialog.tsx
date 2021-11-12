import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  TextField,
  Grid,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText
} from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateUtils from '@date-io/date-fns';
import moment from 'moment';

import { dateFormatForInputControl } from '../../constants/helpers';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { startCase } from 'lodash';

interface EditDialogProps {
  onClose: VoidFunction | any;
  isSaving: boolean;
  submitBulkEdit: VoidFunction | any;
  currencySymbol: string;
  data?: object | any;
  calculatePrice?: VoidFunction | any;
  endDate: any;
  startDate: any;
}

const BulkEditInventoryDialog: FC<EditDialogProps> = ({ calculatePrice, onClose, isSaving, submitBulkEdit, currencySymbol, data, startDate, endDate }) => {
  const [values, setValues] = useState(null);
  const [isDisabled, setDisabled] = useState(false);
  const [errors, setErrors] = useState(null);


  useEffect(() => {
    if (data) {
      if (data.hasOwnProperty('packageId')) {
        setDisabled(true);
      }

      const newValues = {
        ...data,
        qty: data?.qty || 0,
        pricingMethod: data?.pricingMethod || 'perDay',
        startDate: data?.startDate || new Date(),
        endDate: data?.endDate || new Date(),
        UOM: data?.UOM || '',
        price: data?.price || 0,
        discount: data?.discount || 0,
        finalPrice: data?.finalPrice || 0
      };
      setValues(newValues);
    }
  }, [data]);

  useEffect(() => {
    getPricing(values);
  }, [values?.qty, values?.UOM, values?.pricingMethod]);

  const handleChange = (name: string, value: any) => {
    setValues((prevState) => {
      const newValues = { ...prevState, [name]: value };

      return newValues;
    });

    let errs = { ...errors };
    if (Boolean(errs?.qty) && name === 'qty' && value) {
      delete errs.qty;
    }
    if (Boolean(errs?.price) && name === 'price' && value) {
      delete errs.price;
    }
    if (Boolean(errs?.pricingMethod) && name === 'pricingMethod' && value) {
      delete errs.pricingMethod;
    }
    if (Boolean(errs?.UOM) && name === 'UOM' && value) {
      delete errs.UOM;
    }

    if (Object.keys(errs).length === 0) {
      setErrors(null);
    } else {
      setErrors(errs);
    }
  };

  const getPricing = async (values: any) => {
    if (data) {
      if (values?.qty > 0 && values?.pricingMethod !== '' && values?.UOM !== '') {
        const priceData = await calculatePrice([values]);
        if (priceData && priceData.length) {
          let price = priceData[0].mrp;
          let qty = priceData[0].qty;

          handleChange('price', price);

          const startDate = moment(values?.startDate);
          const endDate = moment(values?.endDate);
          const diff = endDate.diff(startDate, 'days');

          let finalPrice = qty && price ? (values?.pricingMethod === 'perDay' && diff !== 0 ? qty * price * diff : qty * price) : price;

          handleChange('finalPrice', finalPrice <= 0 ? 0 : finalPrice);
        }
      }
    }
  };

  /**
   * HANDLE CLOSE DIALOG
   */
  const handleClose = () => {
    if (isSaving === false) {
      onClose();
    }
  };

  /**
   * HANDLE SUBMIT FOR FORM
   */
  const handleSubmit = () => {
    // const errs = handleErrors();

    // if (Object.keys(errs).length > 0) {
    //   setErrors(errs);
    // } else {
    //   submitBulkEdit(values);
    // }

    submitBulkEdit(values);
  };

  /**
   * HANDLE ERRORS IN FORM
   * @returns Errors for not given value
   */
  // const handleErrors = () => {
  //   let errs: any = {};

  //   if (!isPkgInProduct && !values.qty) {
  //     errs.qty = getErrorMsg('Qty.');
  //   }
  //   if (!values.price) {
  //     errs.price = getErrorMsg('Price');
  //   }
  //   if (!values.pricingMethod) {
  //     errs.pricingMethod = getErrorMsg('Pricing Method');
  //   }
  //   if (!values.UOM) {
  //     errs.UOM = getErrorMsg('UOM');
  //   }

  //   return errs;
  // };

  // const getErrorMsg = (str: string) => `${str} is a required field`;

  const finalPriceCalculation = (data: number, type: string) => {
    const startDate = moment(values?.startDate);
    const endDate = moment(values?.endDate);
    const diff = endDate.diff(startDate, 'days');
    let finalPrice = 0;
    let discountPrice = values?.finalPrice !== 0 && (values?.finalPrice / 100) * (type === "discount" ? data : values?.discount);
    let taxPrice = values?.finalPrice !== 0 && (values?.finalPrice / 100) * (type === "tax" ? data : values?.tax);


    if (type === 'qty') {
      finalPrice = data > 0 && values?.price > 0 ? values?.price * data : values?.price
    }
    if (type === 'price') {
      finalPrice = values?.qty > 0 && data > 0 ? values?.qty * data : values?.price;
    }
    if (type === 'discount') {
      finalPrice = values?.qty > 0 && values?.price > 0 ? values?.qty * values?.price : values?.price
    }
    if (type === 'tax') {
      finalPrice = values?.qty > 0 && values?.price > 0 ? values?.qty * values?.price : values?.price;
    }

    finalPrice = values?.pricingMethod === 'perDay' ? finalPrice * 1 : finalPrice;
    finalPrice = diff > 0 ? finalPrice * diff : finalPrice;
    finalPrice = discountPrice && discountPrice > 0 ? finalPrice - Math.round(discountPrice) : finalPrice;

    finalPrice = taxPrice && taxPrice > 0 ? finalPrice + Math.round(taxPrice) : finalPrice;

    handleChange('totalTax', taxPrice > 0 ? parseInt(Math.round(taxPrice).toFixed(1)) : 0);
    handleChange('discountedPrice', discountPrice > 0 ? parseInt(Math.round(discountPrice).toFixed(1)) : 0);
    handleChange('finalPrice', finalPrice > 0 ? parseInt(Math.round(finalPrice).toFixed(1)) : 0);
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={handleClose}>
      <CustomDialogHeader title={data ? 'Edit' : 'Bulk Edit'} onClose={handleClose} />
      <CustomDialogContent>
        <MuiPickersUtilsProvider utils={DateUtils}>
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  // disabled={isDisabled}
                  label="Qty"
                  name="qty"
                  fullWidth
                  // error={!isDisabled && Boolean(errors?.qty)}
                  // helperText={!isDisabled && Boolean(errors?.qty) && errors.qty}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.qty || 0}
                  onChange={(e) => {
                    let qty = parseInt(e.target.value);
                    finalPriceCalculation(qty, 'qty');
                    handleChange(e.target.name, qty <= 0 ? 1 : qty);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl
                  // disabled={isDisabled}
                  size="small"
                  variant="outlined"
                  fullWidth
                // error={Boolean(errors?.pricingMethod)}
                >
                  <InputLabel id="pricing-method-label">Pricing Method</InputLabel>
                  <Select
                    name="pricingMethod"
                    labelId="pricing-method-label"
                    label="Pricing Method"
                    value={values?.pricingMethod || ''}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                  >
                    <MenuItem value="perDay">Per Day</MenuItem>
                    <MenuItem value="perWeek">Per Week</MenuItem>
                    <MenuItem value="perMonth">Per Month</MenuItem>
                  </Select>
                  {/* <FormHelperText id="pricing-method-label">{Boolean(errors?.pricingMethod) && errors.pricingMethod}</FormHelperText> */}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  maxDate={new Date(endDate)}
                  minDate={new Date(startDate)}
                  label="Start Date"
                  name="startDate"
                  fullWidth
                  size="small"
                  inputVariant="outlined"
                  variant="inline"
                  format={dateFormatForInputControl}
                  autoOk
                  value={values?.startDate || new Date(startDate)}
                  onChange={(date) => handleChange('startDate', date)}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  label="End Date"
                  name="endDate"
                  fullWidth
                  size="small"
                  inputVariant="outlined"
                  variant="inline"
                  format={dateFormatForInputControl}
                  autoOk
                  value={values?.endDate || new Date(endDate)}
                  minDate={new Date(startDate)}
                  maxDate={new Date(endDate)}
                  onChange={(date) => handleChange('endDate', date)}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl
                  // disabled={isDisabled}
                  size="small"
                  variant="outlined"
                  fullWidth
                // error={Boolean(errors?.UOM)}
                >
                  <InputLabel id="UOM-label">UOM</InputLabel>
                  <Select
                    name="UOM"
                    labelId="UOM-label"
                    label="UOM"
                    value={values?.UOM || ''}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                  >
                    <MenuItem value="pcs">Pcs</MenuItem>
                  </Select>
                  {/* <FormHelperText id="UOM-label">{Boolean(errors?.UOM) && errors.UOM}</FormHelperText> */}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={`Price ${startCase(values?.UOM) || ''} ${startCase(values?.pricingMethod) || ''}`}
                  name="price"
                  // error={Boolean(errors?.price)}
                  // helperText={Boolean(errors?.price) && errors.price}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                  }}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.price || 0}
                  onChange={(e) => {
                    let price = parseInt(e.target.value);
                    finalPriceCalculation(price, 'price');
                    handleChange(e.target.name, price <= 0 ? 0 : price);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Discount (%)"
                  name="discount"
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.discount || 0}
                  onChange={(e) => {
                    let discount = parseInt(e.target.value) && parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 0;
                    finalPriceCalculation(discount, 'discount');
                    handleChange(e.target.name, discount);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Discounted Price"
                  name="discountedPrice"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.discountedPrice || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value) <= 0 ? 0 : parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tax (%)"
                  name="tax"
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.tax || 0}
                  onChange={(e) => {
                    const tax = parseInt(e.target.value) && parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 0
                    finalPriceCalculation(tax, "tax")
                    handleChange(e.target.name, tax)
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Total Tax"
                  name="totalTax"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.totalTax || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value) <= 0 ? 0 : parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  disabled={isDisabled}
                  label="Final Price"
                  name="finalPrice"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                  }}
                  size="small"
                  type="number"
                  variant={'outlined'}
                  value={values?.finalPrice || 0}
                  onChange={(e) => handleChange(e.target.name, parseInt(e.target.value) <= 0 ? 0 : parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>
        </MuiPickersUtilsProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" disabled={isSaving} size="small" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={isSaving || !Boolean(values)}
          size="small"
          onClick={handleSubmit}
          endIcon={isSaving && <CircularProgress size={20} />}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default BulkEditInventoryDialog;
