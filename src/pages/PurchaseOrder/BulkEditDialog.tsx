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
    type: string;
    statusOptions: any;
}

const BulkEditDialog: FC<EditDialogProps> = ({ onClose, isSaving, submitBulkEdit, currencySymbol, data, type = null, statusOptions }) => {

    const [pricing, setPricing] = useState(null);
    const [values, setValues] = useState(null)
    const [isDisabled, setDisabled] = useState(false);
    const [errors, setErrors] = useState(null);
    const [isPkgInProduct, setPkgInProduct] = useState(false)
    let timeoutPricing: ReturnType<typeof setTimeout> = null;

    useEffect(() => {
        if (data) {
            const newValues = {
                ...data,
                qty: parseInt(data.quantity || data.qty) || 0,
                value: parseInt(data.value) || 0,
                expectedDelivery: data.expectedDelivery || "",
                uom: data.uom || "",
                price: data.price || 0,
                finalPrice: data.finalPrice || 0,
                actualReceived: data.actualReceived || 0,
                billed: data.billed || 0,
                taxSchedule: data.taxSchedule || "",
                tax: data.tax || 0,
                taxPerUnit: data.taxPerUnit || 0,
                totalTax: data.totalTax || 0,
            }
            setValues(newValues)
        }

    }, [data])

    const handleChange = (name: string, value: any) => {
        setValues((prevState) => {
            const newValues = { ...prevState, [name]: value }
            return newValues
        });
        let errs = { ...errors }
        if (Boolean(errs?.qty) && name === 'qty' && value) {
            delete errs.qty
        }
        if (Boolean(errs?.price) && name === 'price' && value) {
            delete errs.price
        }
        if (Boolean(errs?.baseUOM) && name === 'baseUOM' && value) {
            delete errs.baseUOM
        }
        if (Object.keys(errs).length === 0) {
            setErrors(null)
        } else {
            setErrors(errs)
        }
    };

    const getPricing = async (values: any) => {
        let finalPrice = 0
        handleChange("finalPrice", finalPrice <= 0 ? 0 : finalPrice)
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
        return errs

    }

    const getErrorMsg = (str: string) => `${str} is a required field`


    const handlePriceCalculation = (value: any, type: string) => {

        const qty = type === "qty" ? value : values?.qty ? values?.qty : 0
        const price = type === "price" ? value : values?.price ? values?.price : 0
        let amount = qty * price

        let tax = type === "tax" ? value : values?.tax ? values?.tax : 0
        let taxPerUnit = type === "taxPerUnit" ? value : values?.totalTax ? values?.totalTax : 0
        if (type === "taxPerUnit") {
            tax = parseFloat((100 * taxPerUnit / price).toFixed(2));;
            handleChange('tax', tax);
        }
        taxPerUnit = parseFloat((price * tax / 100).toFixed(2));

        handleChange('taxPerUnit', taxPerUnit);
        const totalTax = taxPerUnit * qty;
        handleChange('totalTax', totalTax);
        amount = amount + totalTax;

        handleChange('finalPrice', parseFloat(amount.toFixed(2)));
    }

    return (
        <Dialog open fullWidth maxWidth="md" onClose={handleClose}>
            <CustomDialogHeader title={data ? "Edit" : 'Bulk Edit'} onClose={handleClose} />
            <CustomDialogContent>
                <MuiPickersUtilsProvider utils={DateUtils}>
                    <Box p={2}>
                        <Grid container spacing={2}>
                            {type === "service" && <Grid item xs={12} sm={6}>
                                <TextField
                                    // disabled={isDisabled}
                                    label="Description"
                                    name="description"
                                    fullWidth
                                    required={true}
                                    error={!isDisabled && Boolean(errors?.description)}
                                    helperText={!isDisabled && Boolean(errors?.description) && errors.description}
                                    size="small"
                                    type="text"
                                    variant={"outlined"}
                                    value={values?.description}
                                    onChange={(e) => {
                                        handleChange(e.target.name, e.target.value)
                                    }}
                                />
                            </Grid>}
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
                                        handlePriceCalculation(parseFloat(e.target.value), e.target.name)
                                        handleChange(e.target.name, parseFloat(e.target.value))
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
                                        Base UOM
                                    </InputLabel>
                                    <Select
                                        name="baseUOM"
                                        labelId="baseUOM-method-label"
                                        label="Base UOM"
                                        value={values?.baseUOM || ""}
                                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                                    >
                                        <MenuItem value="Pcs">Pcs</MenuItem>
                                        <MenuItem value="Hour">Hour</MenuItem>
                                        <MenuItem value="Day">Day</MenuItem>
                                        <MenuItem value="Week">Week</MenuItem>
                                        <MenuItem value="Month">Month</MenuItem>
                                    </Select>
                                    <FormHelperText id="pricing-method-label">{Boolean(errors?.pricingMethod) && errors.pricingMethod}</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <KeyboardDatePicker
                                    maxDate={values?.endDate || new Date()}
                                    label="Expected Delivery"
                                    name="expectedDelivery"
                                    fullWidth
                                    size="small"
                                    inputVariant="outlined"
                                    variant='inline'
                                    format={dateFormatForInputControl}
                                    autoOk
                                    value={values?.startDate || new Date()}
                                    onChange={(date) => handleChange("expectedDelivery", date)}
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
                                    error={Boolean(errors?.taxSchedule)}>
                                    <InputLabel id="taxSchedule-label">
                                        Tax Schedule
                                    </InputLabel>
                                    <Select
                                        name="taxSchedule"
                                        labelId="taxSchedule-label"
                                        label="Tax Schedule"
                                        value={values?.taxSchedule || ""}
                                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                                    >
                                        <MenuItem value="Tax Schedule 1">Tax Schedule 1</MenuItem>
                                        <MenuItem value="Tax Schedule 2">Tax Schedule 2</MenuItem>
                                        <MenuItem value="Tax Schedule 3">Tax Schedule 3</MenuItem>
                                        <MenuItem value="Tax Schedule 4">Tax Schedule 4</MenuItem>
                                        <MenuItem value="Tax Schedule 5">Tax Schedule 5</MenuItem>
                                    </Select>
                                    <FormHelperText id="taxSchedule-label">{Boolean(errors?.taxSchedule) && errors.taxSchedule}</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={`Price`}
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
                                        handlePriceCalculation(parseFloat(e.target.value), e.target.name)
                                        handleChange(e.target.name, e.target.value)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Tax (%)"
                                    name="tax"
                                    fullWidth
                                    InputProps={{
                                        endAdornment: '%',
                                        inputProps: { min: 0 },
                                    }}
                                    size="small"
                                    type="number"
                                    variant={"outlined"}
                                    value={values?.tax || 0}
                                    onChange={(e) => {
                                        let tax = parseFloat(e.target.value) && parseFloat(e.target.value) > 0 ? parseFloat(e.target.value) : 0;
                                        handlePriceCalculation(tax, e.target.name);
                                        handleChange(e.target.name, tax)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Tax Per Unit"
                                    name="taxPerUnit"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    variant={"outlined"}
                                    value={values?.taxPerUnit || 0}
                                    onChange={(e) => {
                                        let taxPerUnit = parseFloat(e.target.value) && parseFloat(e.target.value) > 0 ? parseFloat(e.target.value) : 0;
                                        handlePriceCalculation(taxPerUnit, e.target.name);
                                        handleChange("taxPerUnit", taxPerUnit)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Total Tax"
                                    name="totalTax"
                                    fullWidth
                                    InputProps={{
                                        readOnly: true
                                      }}
                                    size="small"
                                    type="number"
                                    variant={"outlined"}
                                    value={values?.totalTax || 0}
                                   // onChange={(e) => handleChange("totalTax", parseInt(e.target.value) <= 0 ? 0 : parseInt(e.target.value))}
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

export default BulkEditDialog;
