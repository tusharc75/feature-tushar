import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import { Button, Dialog, TextField, Grid, Box, CircularProgress, FormControl, InputLabel, Select, MenuItem, InputAdornment, FormHelperText } from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateUtils from '@date-io/date-fns';
import moment from 'moment'


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
  calculatePrice?: VoidFunction | any
}

const BulkEditInventoryDialog: FC<EditDialogProps> = ({ calculatePrice, onClose, isSaving, submitBulkEdit, currencySymbol, data }) => {
  const [pricing, setPricing] = useState(null);
  const [values, setValues] = useState(null)
  const [isDisabled, setDisabled] = useState(false);
  const [errors, setErrors] = useState(null);
  const [isPkgInProduct, setPkgInProduct] = useState(false)
  let timeoutPricing: ReturnType<typeof setTimeout> = null;

  useEffect(() => {
    if (data) {
      if (data.hasOwnProperty("packageId")) {
        setDisabled(true)
      }

      const newValues = {
        ...data,
        qty: data?.qty || 0,
        pricingMethod: data?.pricingMethod || '',
        startDate: data?.startDate || new Date(),
        endDate: data?.endDate || new Date(),
        UOM: data?.UOM || "",
        price: data?.price || 0,
        discount: data?.discount || 0,
        finalPrice: data?.finalPrice || 0
      }
      setValues(newValues)

      if (data.type === "productInPackage") {
        setPkgInProduct(true)
      }
    }

  }, [data])

  const handleChange = (name: string, value: any) => {
    setValues((prevState) => {
      const newValues = { ...prevState, [name]: value }
      getPricing(newValues);
      return newValues
    });

    let errs = { ...errors }
    if (Boolean(errs?.qty) && name === 'qty' && value) {
      delete errs.qty
    }
    if (Boolean(errs?.price) && name === 'price' && value) {
      delete errs.price
    }
    if (Boolean(errs?.pricingMethod) && name === 'pricingMethod' && value) {
      delete errs.pricingMethod
    }
    if (Boolean(errs?.UOM) && name === 'UOM' && value) {
      delete errs.UOM
    }

    if (Object.keys(errs).length === 0) {
      setErrors(null)
    } else {
      setErrors(errs)
    }
  };

  const getPricing = (values: any) => {
    if (timeoutPricing) {
      clearTimeout(timeoutPricing)
    }
    if (data) {
      if (values?.qty > 0 && values?.pricingMethod !== "" && values?.UOM !== "") {
        timeoutPricing = setTimeout(async () => {
          const priceData = await calculatePrice([values])
          if (priceData && priceData.length) {
            setPricing(priceData[0])
            let price = priceData[0].mrp
            let qty = priceData[0].qty

            handleChange("price", price)

            const startDate = moment(values?.startDate)
            const endDate = moment(values?.endDate)
            const diff = endDate.diff(startDate, "days");

            let finalPrice = qty && price
              ? values?.pricingMethod === "perDay" && diff !== 0
                ? qty * price * diff
                : qty * price
              : price;

            handleChange("finalPrice", finalPrice <= 0 ? 0 : finalPrice)
          }
        }, 1000)

      }
    }

  }



  /**
   * HANDLE CLOSE DIALOG
   */
  const handleClose = () => {
    if (isSaving === false) {
      onClose()
    }
  }

  /**
   * HANDLE SUBMIT FOR FORM
   */
  const handleSubmit = () => {
    const errs = handleErrors();

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
    } else {
      submitBulkEdit(values)
    }
  }


  /**
   * HANDLE ERRORS IN FORM
   * @returns Errors for not given value
   */
  const handleErrors = () => {
    let errs: any = {}


    if (!isPkgInProduct && !values.qty) {
      errs.qty = getErrorMsg("Qty.")
    }
    if (!values.price) {
      errs.price = getErrorMsg("Price")
    }
    if (!values.pricingMethod) {
      errs.pricingMethod = getErrorMsg("Pricing Method")
    }
    if (!values.UOM) {
      errs.UOM = getErrorMsg("UOM")
    }

    return errs

  }

  const getErrorMsg = (str: string) => `${str} is a required field`


  return (
    <Dialog open fullWidth maxWidth="md" onClose={handleClose}>
      <CustomDialogHeader title={data ? "Edit" : 'Bulk Edit'} onClose={handleClose} />
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
                  required={true}
                  error={!isDisabled && Boolean(errors?.qty)}
                  helperText={!isDisabled && Boolean(errors?.qty) && errors.qty}
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.qty || 0}
                  onChange={(e) => {
                    let qty = parseInt(e.target.value);
                    const startDate = moment(values?.startDate)
                    const endDate = moment(values?.endDate)
                    const diff = endDate.diff(startDate, "days");

                    let finalPrice = qty && values?.price
                      ? values?.pricingMethod === "perDay" && diff !== 0
                        ? diff * qty * values?.price : qty * values?.price : values?.price;

                    handleChange("finalPrice", finalPrice)
                    handleChange(e.target.name, qty <= 0 ? 0 : qty)
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl
                  // disabled={isDisabled}
                  size="small"
                  variant="outlined"
                  fullWidth
                  error={Boolean(errors?.pricingMethod)}
                  required={true}
                >
                  <InputLabel id="pricing-method-label">
                    Pricing Method
                  </InputLabel>
                  <Select
                    name="pricingMethod"
                    labelId="pricing-method-label"
                    label="Pricing Method"
                    value={values?.pricingMethod || ""}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                  >
                    <MenuItem value="perDay">Per Day</MenuItem>
                    <MenuItem value="perWeek">Per Week</MenuItem>
                    <MenuItem value="perMonth">Per Month</MenuItem>
                  </Select>
                  <FormHelperText id="pricing-method-label">{Boolean(errors?.pricingMethod) && errors.pricingMethod}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  disabled={true}
                  maxDate={values?.endDate || new Date()}
                  label="Start Date"
                  name="startDate"
                  fullWidth
                  size="small"
                  inputVariant="outlined"
                  variant='inline'
                  format={dateFormatForInputControl}
                  autoOk
                  value={values?.startDate || new Date()}
                  onChange={(date) => handleChange("startDate", date)}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  disabled={true}
                  label="End Date"
                  name="endDate"
                  fullWidth
                  size="small"
                  inputVariant="outlined"
                  variant='inline'
                  format={dateFormatForInputControl}
                  autoOk
                  value={values?.endDate || new Date()}
                  minDate={values?.startDate || new Date()}
                  onChange={(date) => handleChange("endDate", date)}
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
                  required
                  fullWidth
                  error={Boolean(errors?.UOM)}>
                  <InputLabel id="UOM-label">
                    UOM
                  </InputLabel>
                  <Select
                    name="UOM"
                    labelId="UOM-label"
                    label="UOM"
                    value={values?.UOM || ""}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                  >
                    <MenuItem value="pcs">Pcs</MenuItem>
                  </Select>
                  <FormHelperText id="UOM-label">{Boolean(errors?.UOM) && errors.UOM}</FormHelperText>

                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={`Price ${(startCase(values?.UOM)) || ""} ${startCase(values?.pricingMethod) || ""}`}
                  name="price"
                  required
                  error={Boolean(errors?.price)}
                  helperText={Boolean(errors?.price) && errors.price}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {currencySymbol ? currencySymbol : ""}
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.price || 0}
                  onChange={(e) => {
                    let price = parseInt(e.target.value);
                    const startDate = moment(values?.startDate)
                    const endDate = moment(values?.endDate)
                    const diff = endDate.diff(startDate, "days");

                    let finalPrice = values?.qty && price
                      ? values?.pricingMethod === "perDay" && diff !== 0
                        ? values?.qty * price * diff
                        : values?.qty * price
                      : price;

                    handleChange("finalPrice", finalPrice <= 0 ? 0 : finalPrice)
                    handleChange(e.target.name, price <= 0 ? 0 : price)
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Discount (%)"
                  name="discount"
                  fullWidth
                  InputProps={{
                    endAdornment: '%',
                    inputProps: { min: 0 },
                  }}
                  size="small"
                  type="number"
                  variant={"outlined"}
                  value={values?.discount || 0}
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
                    startAdornment: (
                      <InputAdornment position="start">
                        {currencySymbol ? currencySymbol : ""}
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  type="number"
                  variant={"outlined"}
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
