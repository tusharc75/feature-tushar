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
import { dateFormatForInputControl } from '../../../constants/helpers';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { startCase } from 'lodash';
import axiosInstance from "../../../axios/axiosInstance";
import { groupBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

interface EditDialogProps {
  onClose: VoidFunction | any;
  isSaving: boolean;
  submitBulkEdit: VoidFunction | any;
  currencySymbol: string;
  data?: object | any;
  calculatePrice?: VoidFunction | any;
  endDate: any;
  startDate: any;
  selectedProducts: any[]
}

const BulkEditInventoryDialog: FC<EditDialogProps> = (
  {
    calculatePrice,
    onClose,
    isSaving,
    submitBulkEdit,
    currencySymbol,
    data,
    startDate,
    endDate,
    selectedProducts
  }) => {

  const [values, setValues] = useState(null);
  const [isDisabled, setDisabled] = useState(false);
  const [errors, setErrors] = useState(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [units, setUnits] = useState([
    ...["One", "Two", "Three", "Four", "Five", "Six"].map(m => { return { "optionLabel": `${m} Well Pad`, "optionValue": `${m} Well Pad` } }),
    { "optionLabel": "Piece", "optionValue": "Piece" },
  ]);

  useEffect(() => {
    if (data) {
      if (data.hasOwnProperty('packageId')) {
        setDisabled(true);
      }
      const newValues = {
        ...data,
        qty: data?.qty || 0,
        pricingMethod: data?.pricingMethod || 'perDay',
        startDate: new Date(data?.startDate) || new Date(),
        endDate: new Date(data?.endDate) || new Date(),
        tenure: data?.tenure || moment(data?.endDate).diff(moment(data?.startDate), 'days'),
        UOM: data?.UOM || '',
        price: data?.price || 0,
        discount: data?.discount || 0,
        finalPrice: data?.finalPrice || 0
      };
      newValues["amount"] = data?.amount || newValues.qty * newValues.tenure * newValues.price
      setValues(newValues);
    }
  }, [data]);

  const getTitle = () => {

    if (data) {
      let editTitle = `Edit - [${data.detail}]`;

      if (data.subRows && data.subRows?.length > 0) {
        editTitle = `Edit - [${data.detail} (${data.subRows.length})]`;
      }

      return editTitle;

    } else {
      let bulkEdit = "Bulk Edit -";

      const groupByProducts = groupBy(selectedProducts, "type");

      const edits = [];
      if (groupByProducts["Product"]) {
        edits.push(`${groupByProducts["Product"].length} - Products`)
      }

      if (groupByProducts["Package"]) {
        edits.push(`${groupByProducts["Package"].length} - Package`)
      }

      if (groupByProducts["productInPackage"]) {
        edits.push(`${groupByProducts["productInPackage"].length} - Product In Package`)
      }

      return `${bulkEdit} (${edits.join(", ")})`;
    }
  }

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
          let price: any = priceData[0].mrp;
          handleChange('price', price);
          handlePriceCalculation(price, 'price');
        }
      }
    }
  };


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
    if (data) {
      if (data.subRows && data.subRows?.length > 0) {
        setShowConfirmationDialog(true);
      } else {
        submitBulkEdit(values);
      }
    } else {

      if (selectedProducts.length > 0 && selectedProducts.some(s => s.subRows && s.subRows?.length > 0)) {
        setShowConfirmationDialog(true);
      }
      else {
        submitBulkEdit(values);
      }
    }
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

  // const finalPriceCalculation = (data: number, type: string) => {
  //   const startDate = moment(values?.startDate);
  //   const endDate = moment(values?.endDate);
  //   const diff = endDate.diff(startDate, 'days');
  //   let finalPrice = 0;
  //   let discountPrice = values?.finalPrice !== 0 && (values?.finalPrice / 100) * (type === "discount" ? data : values?.discount);
  //   let taxPrice = values?.finalPrice !== 0 && (values?.finalPrice / 100) * (type === "tax" ? data : values?.tax);


  //   if (type === 'qty') {
  //     finalPrice = data > 0 && values?.price > 0 ? values?.price * data : values?.price
  //   }
  //   if (type === 'price') {
  //     finalPrice = values?.qty > 0 && data > 0 ? values?.qty * data : values?.price;
  //   }
  //   if (type === 'discount') {
  //     finalPrice = values?.qty > 0 && values?.price > 0 ? values?.qty * values?.price : values?.price
  //   }
  //   if (type === 'tax') {
  //     finalPrice = values?.qty > 0 && values?.price > 0 ? values?.qty * values?.price : values?.price;
  //   }

  //   finalPrice = values?.pricingMethod === 'perDay' ? finalPrice * 1 : finalPrice;
  //   finalPrice = diff > 0 ? finalPrice * diff : finalPrice;
  //   finalPrice = discountPrice && discountPrice > 0 ? finalPrice - Math.round(discountPrice) : finalPrice;

  //   finalPrice = taxPrice && taxPrice > 0 ? finalPrice + Math.round(taxPrice) : finalPrice;

  //   handleChange('totalTax', taxPrice > 0 ? parseFloat(Math.round(taxPrice).toFixed(1)) : 0);
  //   handleChange('discountedPrice', discountPrice > 0 ? parseFloat(Math.round(discountPrice).toFixed(1)) : 0);
  //   handleChange('finalPrice', finalPrice > 0 ? parseFloat(Math.round(finalPrice).toFixed(1)) : 0);
  // };


  const handlePriceCalculation = (value: any, type: string) => {

    const pricingMethod = type === "pricingMethod" ? value : values?.pricingMethod;

    let tenureType: any = "days";
    if (pricingMethod === "perWeek") {
      tenureType = "weeks"
    }
    else if (pricingMethod === "perMonth") {
      tenureType = "months"
    }

    const startDate = moment(type === "startDate" ? value : values?.startDate);
    let endDate = moment(type === "endDate" ? value : values?.endDate);

    if (type === "tenure") {
      endDate = startDate.add(value, tenureType)
      handleChange('endDate', endDate);
    }

    const tenure = type === "tenure" ? value : endDate.diff(startDate, tenureType) > 0 ? endDate.diff(startDate, tenureType) : 1;
    handleChange('tenure', tenure);

    const qty = type === "qty" ? value : values?.qty ? values?.qty : 0
    const price = type === "price" ? value : values?.price ? values?.price : 0
    let amount = qty * price * tenure

    handleChange('amount', amount);

    let discount = type === "discount" ? value : values?.discount ? values?.discount : 0
    let discountedPrice = type === "discountedPrice" ? value : values?.discountedPrice ? values?.discountedPrice : 0
    if (type === "discountedPrice") {
      discount = parseFloat((100 * discountedPrice / amount).toFixed(2));
      handleChange('discount', discount);
    }
    discountedPrice = parseFloat((amount * discount / 100).toFixed(2));
    handleChange('discountedPrice', discountedPrice);
    amount = amount - discountedPrice;

    let tax = type === "tax" ? value : values?.tax ? values?.tax : 0
    let totalTax = type === "totalTax" ? value : values?.totalTax ? values?.totalTax : 0
    if (type === "totalTax") {
      tax = parseFloat((100 * totalTax / amount).toFixed(2));;
      handleChange('tax', tax);
    }
    totalTax = parseFloat((amount * tax / 100).toFixed(2));
    handleChange('totalTax', totalTax);
    amount = amount + totalTax;

    handleChange('finalPrice', parseFloat(amount.toFixed(2)));
  }


  useEffect(() => {
    axiosInstance().get(`/field?resource=Product`).then(({ data: { data } }) => {
      const unitField = data.filter((e) => e.fieldData.fieldName.toLowerCase().includes("unit") && e.fieldData.type === "dropDown");
      if (unitField.length) {
        setUnits(unitField[0].fieldData.option);
      }
    })
  }, []);

  return (
    <>
      <Dialog open fullWidth maxWidth="md" onClose={handleClose}>
        <CustomDialogHeader title={getTitle()} onClose={handleClose} />
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
                      let qty = parseFloat(e.target.value);
                      handlePriceCalculation(qty, 'qty');
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
                      onChange={(e) => {
                        handlePriceCalculation(e.target.value, 'pricingMethod');
                        handleChange(e.target.name, e.target.value)
                      }}
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
                    maxDate={endDate}
                    // minDate={new Date(startDate)}
                    label="Start Date"
                    name="startDate"
                    fullWidth
                    size="small"
                    inputVariant="outlined"
                    variant="inline"
                    format={dateFormatForInputControl}
                    autoOk
                    value={values?.startDate || new Date(startDate)}
                    onChange={(date) => {
                      handlePriceCalculation(date, 'startDate');
                      handleChange('startDate', date)
                    }}
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={"Expected No. of " + (values?.pricingMethod ? values.pricingMethod.replace("per", "") : "Tenure")}
                    name="tenure"
                    fullWidth
                    size="small"
                    type="number"
                    variant={'outlined'}
                    value={values?.tenure || 0}
                    onChange={(e) => {
                      let tenure = parseInt(e.target.value);
                      handlePriceCalculation(tenure, 'tenure');
                      handleChange(e.target.name, tenure <= 0 ? 0 : tenure);
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
                    minDate={startDate}
                    // maxDate={new Date(endDate)}
                    onChange={(date) => {
                      handlePriceCalculation(date, 'endDate');
                      handleChange('endDate', date)
                    }}
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
                      {units && units.map((_u: any) => {
                        return <MenuItem value={_u.optionValue}>{_u.optionLabel}</MenuItem>
                      })}
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
                      let price = parseFloat(e.target.value);
                      handlePriceCalculation(price, 'price');
                      handleChange(e.target.name, price <= 0 ? 0 : price);
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Total Price"
                    name="amount"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>,
                      readOnly: true
                    }}
                    size="small"
                    type="number"
                    variant={'outlined'}
                    value={values?.amount || 0}
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
                      let discount = parseFloat(e.target.value) && parseFloat(e.target.value) > 0 ? parseFloat(e.target.value) : 0;
                      handlePriceCalculation(discount, 'discount');
                      handleChange(e.target.name, discount);
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Discount"
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
                    onChange={(e) => {
                      let discountedPrice = parseFloat(e.target.value) <= 0 ? 0 : parseFloat(e.target.value);
                      handlePriceCalculation(discountedPrice, 'discountedPrice');
                      handleChange(e.target.name, discountedPrice)
                    }}
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
                      const tax = parseFloat(e.target.value) && parseFloat(e.target.value) > 0 ? parseFloat(e.target.value) : 0
                      handlePriceCalculation(tax, "tax")
                      handleChange(e.target.name, tax)
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tax"
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
                    onChange={(e) => {
                      const totalTax = parseFloat(e.target.value) <= 0 ? 0 : parseFloat(e.target.value)
                      handlePriceCalculation(totalTax, "totalTax")
                      handleChange(e.target.name, totalTax)
                    }}
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
                    onChange={(e) => handleChange(e.target.name, parseFloat(e.target.value) <= 0 ? 0 : parseFloat(e.target.value))}
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

      {
        showConfirmationDialog && <ConfirmationDialog
          open={showConfirmationDialog}
          message="Price configured at the product level will be override, would you like to override it ?"
          onOk={() => {
            setShowConfirmationDialog(false);
            submitBulkEdit(values);
          }}
          onClose={() => {
            setShowConfirmationDialog(false)
          }}
        />
      }

    </>
  );
};

export default BulkEditInventoryDialog;
