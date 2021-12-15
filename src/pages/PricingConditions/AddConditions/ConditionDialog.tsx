import { useState, useEffect, Fragment, useContext } from "react";
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../../components/Helpers/CustomButton'
import routes from "../../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, getUniqueCurrencies } from "./../../../constants/helpers";
import InputField from "../../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema, pricingCondition } from "../../../constants/helpers";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import { Box, Grid, TextField, InputAdornment, Chip, Badge, Select, FormControl, InputLabel, IconButton } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog"
import { result, find, startCase, isEqual, camelCase } from 'lodash';
import { FaDiceOne } from "react-icons/fa";
import MenuItem from '@material-ui/core/MenuItem';
import { Delete } from "@material-ui/icons";
import MultipleEntry from './MultipleEntry';

const ConditionDialog = ({ pricingConditionId, conditionData, handleClose, handleSuccess, detailData }) => {

    const toastConfig = useContext(CustomToastContext)
    const [loading, setLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);


    const [headerLabel, setHeaderLabel] = useState("");

    //["Price", "Rent", "Discount", "Charge", "Tax"]
    const [conditionType, setConditionType] = useState(["Rent"]);
    const [currency, setCurrency] = useState([detailData.currency]);
    const [unit, setUnits] = useState([]);
    const [pricingMethod, setPricingMethod] = useState([]);

    const [discount, setDiscount] = useState([]);
    const [tax, setTax] = useState([]);
    const [charge, setCharge] = useState([]);

    const [initialData, setInitialData] = useState(detailData);

    useEffect(() => {
        setInitialData(conditionData)
        let details: any = {}
        if (conditionData?.materialType === "product") {
            details = conditionData?.productDetail
        }
        else {
            details = conditionData?.packageDetail
        }
        if (details?.unit) {
            setUnits(details.unit)
        }
        if (details?.pricingMethod) {
            setPricingMethod(details.pricingMethod)
        }
        setHeaderLabel(startCase(conditionData?.materialType) + " - " + (conditionData?.materialType === "product" ? details?.productName : details?.packageDescription))
    }, [conditionData]);

    const handleSubmit = (values) => {
        setLoading(true);
        if (values.conditionType.includes("Discount")) {
            values.discount = discount;
        }
        else {
            delete values.discount;
        }
        if (values.conditionType.includes("Charge")) {
            values.charge = charge;
        }
        else {
            delete values.charge;
        }
        if (values.conditionType.includes("Tax")) {
            values.tax = tax;
        }
        else {
            delete values.tax;
        }
        delete values.productDetail;
        delete values.packageDetail;
        axiosInstance().put(`${pricingCondition.api}/condition/${pricingConditionId}`, { condition: [values] }).then(({ data }) => {
            toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
            });
            setLoading(false);
            handleSuccess()
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        });
    };

    const handleChangeValue = (index, fieldName, value) => {
        const _list = [...discount];
        _list[index][fieldName] = value;
        setDiscount(_list)
    }

    const handleChangeChargeValue = (index, fieldName, value) => {
        const _charge = [...charge];
        _charge[index][fieldName] = value;
        setCharge(_charge)
    }

    const handleChangeTaxValue = (index, fieldName, value) => {
        const _tax = [...tax];
        _tax[index][fieldName] = value;
        setTax(_tax)
    }

    return (<Dialog
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                setShowConfirmDialog(true)
            }
        }}
        fullWidth
    >
        {initialData ?
            <Formik
                enableReinitialize={true}
                initialValues={initialData}
                validateOnMount
                onSubmit={handleSubmit}>
                {({ values,
                    errors,
                    touched,
                    setFieldValue,
                    submitForm,
                }) => (
                    <Fragment>
                        <CustomDialogHeader
                            title={headerLabel}
                            onClose={() => {
                                handleClose()
                            }}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                        ></CustomDialogHeader>
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate >
                                <Fragment>
                                    <div className={"detail-box-content"}>
                                        <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                        <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>Condition</h2>
                                    </div>
                                    <Box marginTop={1} marginBottom={1}>
                                        <Grid spacing={3} container>
                                            <Grid item xs={12} sm={6} md={6}>
                                                <Autocomplete
                                                    multiple
                                                    freeSolo
                                                    disableCloseOnSelect={true}
                                                    id="conditionType"
                                                    options={conditionType}
                                                    value={values['conditionType'] ? values['conditionType'] : []}
                                                    renderTags={(value: string[], getTagProps) =>
                                                        value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                                                    }
                                                    onChange={(e, value) => setFieldValue("conditionType", value)}
                                                    renderInput={(params) =>
                                                        <TextField
                                                            {...params}
                                                            margin="dense"
                                                            name="conditionType"
                                                            variant="outlined"
                                                            label="Condition Type"
                                                            error={touched['conditionType'] && Boolean(errors['conditionType'])}
                                                            helperText={touched['conditionType'] && errors['conditionType']}
                                                        />}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={6}>
                                                <Autocomplete
                                                    multiple
                                                    freeSolo
                                                    disableCloseOnSelect={true}
                                                    id="autocompleteunits"
                                                    options={unit}
                                                    value={values['unit'] ? values['unit'] : []}
                                                    renderTags={(value: string[], getTagProps) =>
                                                        value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                                                    }
                                                    onChange={(e, value) => setFieldValue("unit", value)}
                                                    renderInput={(params) =>
                                                        <TextField
                                                            {...params}
                                                            margin="dense"
                                                            name="unit"
                                                            variant="outlined"
                                                            label="Unit"
                                                            error={touched['unit'] && Boolean(errors['unit'])}
                                                            helperText={touched['unit'] && errors['unit']}
                                                        />}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Fragment>

                                {values.conditionType?.includes("Price") &&
                                    <Fragment>
                                        <div className={"detail-box-content"}>
                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>Price</h2>
                                        </div>
                                        <Box marginTop={1} marginBottom={1}>
                                            <Grid spacing={3} container>
                                                {currency && currency.map((_currency, i) =>
                                                    values["unit"] && values["unit"].map((_unit, j) => (
                                                        <Grid item xs={12} sm={6} md={6}>
                                                            <TextField
                                                                id="mrp"
                                                                name="mrp"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label={"Rate " + _unit + " " + _currency}
                                                                type="number"
                                                                value={values['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())]}
                                                                onChange={(e) => setFieldValue('mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase()), parseFloat(e.target.value))}
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            {result(
                                                                                find(getUniqueCurrencies(), function (obj) {
                                                                                    return obj.currencyCode === _currency;
                                                                                }),
                                                                                'symbolNative'
                                                                            )}
                                                                        </InputAdornment>
                                                                    ),
                                                                    inputProps: { min: 0, max: 9999999999 },
                                                                }}
                                                            />
                                                        </Grid>
                                                    )))
                                                }
                                            </Grid>
                                        </Box>
                                    </Fragment>}

                                {values.conditionType?.includes("Rent") &&
                                    <Fragment>
                                        <div className={"detail-box-content"}>
                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>Rent</h2>
                                        </div>
                                        <Box marginTop={1} marginBottom={1}>
                                            <Grid spacing={3} container>
                                                <Grid item xs={12} sm={6} md={6}>
                                                    <Autocomplete
                                                        multiple
                                                        id="tags-filled"
                                                        disableCloseOnSelect={true}
                                                        options={pricingMethod}
                                                        getOptionLabel={(option: any) => option}
                                                        renderTags={(value: string[], getTagProps) =>
                                                            value.map((option: string, index: number) => (
                                                                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                                            ))
                                                        }
                                                        value={values["pricingMethod"]}
                                                        onChange={(e, value) => {
                                                            setFieldValue("pricingMethod", value)
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                margin="dense"
                                                                variant="outlined"
                                                                name="pricingMethod"
                                                                label="Pricing Method"
                                                                error={touched['pricingMethod'] && Boolean(errors['pricingMethod'])}
                                                                helperText={touched['pricingMethod'] && errors['pricingMethod']}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            </Grid>
                                            <Box marginTop={1} border={1} p={1} borderColor="grey.300" >
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th></th>
                                                            {currency && currency.map((_currency, i) =>
                                                                values['unit'] && values['unit'].map((_unit, j) => (
                                                                    <th key={j}  >
                                                                        {_unit + " " + _currency}
                                                                    </th>
                                                                )))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {values['pricingMethod'] && values['pricingMethod'].map((_pricingMethod, i) => (
                                                            <tr key={i}>
                                                                <th style={{ paddingRight: 10, minWidth: 50 }}>
                                                                    {startCase(_pricingMethod)}
                                                                </th>
                                                                {currency && currency.map((_currency, j) =>
                                                                    values['unit'] && values['unit'].map((_unit, k) => (
                                                                        <td key={j}>
                                                                            <TextField
                                                                                name={"rent_" + camelCase(_pricingMethod.toLowerCase()) + "_" + _currency.toLowerCase() + "_" + camelCase(_unit.toLowerCase())}
                                                                                variant="outlined"
                                                                                margin="dense"
                                                                                fullWidth
                                                                                type="number"
                                                                                style={{ margin: 0 }}
                                                                                value={values["rent_" + camelCase(_pricingMethod.toLowerCase()) + "_" + _currency.toLowerCase() + "_" + camelCase(_unit.toLowerCase())]}
                                                                                onChange={(e) => setFieldValue("rent_" + camelCase(_pricingMethod.toLowerCase()) + "_" + _currency.toLowerCase() + "_" + camelCase(_unit.toLowerCase()), parseFloat(e.target.value))}
                                                                            />
                                                                        </td>
                                                                    )))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        </Box>
                                    </Fragment>}

                                {values.conditionType?.includes("Discount") &&
                                    <Fragment>
                                        <div className={"detail-box-content"}>
                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>Discount</h2>
                                        </div>
                                        <Box marginTop={2} marginBottom={1}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => {
                                                    setDiscount([...discount, {
                                                        type: "Flat",
                                                        amount: 0,
                                                        minTransAmount: 0,
                                                        maxDiscount: 0,
                                                        group: []
                                                    }])
                                                }}
                                            >
                                                Add Discount
                                            </Button>
                                        </Box>
                                        {discount.map((val, index) => (
                                            <Box key={index} mb={2}>
                                                <Badge badgeContent={index + 1} color="primary">
                                                </Badge>
                                                <Box p={2} border={1} borderColor="grey.300">
                                                    <Grid spacing={3} container>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <FormControl fullWidth margin="dense" variant="outlined">
                                                                <InputLabel id="demo-simple-select-outlined-label">Discount Type</InputLabel>
                                                                <Select
                                                                    labelId="demo-simple-select-outlined-label"
                                                                    id="demo-simple-select-outlined"
                                                                    value={val.type}
                                                                    onChange={(e) => {
                                                                        handleChangeValue(index, 'type', e.target.value)
                                                                    }}
                                                                    label="Type"
                                                                    name={"type_" + index}
                                                                >
                                                                    <MenuItem value="Flat">Flat</MenuItem>
                                                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                                                    <MenuItem value="Group Flat">Group Flat</MenuItem>
                                                                    <MenuItem value="Group Percentage">Group Percentage</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        {(val.type === "Flat" || val.type === "Percentage") &&
                                                            <Fragment>
                                                                <Grid item xs={12} sm={2} md={2}>
                                                                    <TextField
                                                                        id="amount"
                                                                        name="amount"
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        fullWidth
                                                                        label={"Discount " + (val.type === "Flat" ? " Amount" : " Percentage")}
                                                                        type="number"
                                                                        value={val.amount}
                                                                        onChange={(e) => handleChangeValue(index, 'amount', parseFloat(e.target.value))}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={2} md={2}>
                                                                    <TextField
                                                                        id="minTransAmount"
                                                                        name="minTransAmount"
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        fullWidth
                                                                        label="Minimum Trans. Amount"
                                                                        type="number"
                                                                        value={val.minTransAmount}
                                                                        onChange={(e) => handleChangeValue(index, 'minTransAmount', parseFloat(e.target.value))}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={2} md={2}>
                                                                    <TextField
                                                                        id="maxDiscount"
                                                                        name="maxDiscount"
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        fullWidth
                                                                        label="Maximum Discount"
                                                                        type="number"
                                                                        value={val.maxDiscount}
                                                                        onChange={(e) => handleChangeValue(index, 'maxDiscount', parseFloat(e.target.value))}
                                                                    />
                                                                </Grid>
                                                            </Fragment>
                                                        }
                                                        <Grid container justify="flex-end"
                                                            item xs={12}
                                                            sm={val.type === "Flat" || val.type === "Percentage" ? 4 : 10}
                                                            md={val.type === "Flat" || val.type === "Percentage" ? 4 : 10} >
                                                            <IconButton size="small" aria-label="delete"
                                                                onClick={() => {
                                                                    const _list = [...discount];
                                                                    _list.splice(index, 1)
                                                                    setDiscount(_list)
                                                                }} >
                                                                <Delete color="error" />
                                                            </IconButton>
                                                        </Grid>
                                                    </Grid>
                                                    {(val.type === "Group Flat" || val.type === "Group Percentage") &&
                                                        <Grid container>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                <MultipleEntry
                                                                    discount={discount}
                                                                    index={index}
                                                                    setDiscount={setDiscount}
                                                                    fieldNames={["qty", "amount"]}
                                                                    fieldLabels={val.type === "Group Flat" ? ["Quantity", "Discount Amount"]
                                                                        : ["Quantity", "Discount Percentage"]}
                                                                    label="Group Discount"
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    }
                                                </Box>
                                            </Box>
                                        ))}
                                    </Fragment>
                                }

                                {values.conditionType?.includes("Charge") &&
                                    <Fragment>
                                        <div className={"detail-box-content"}>
                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>Charge</h2>
                                        </div>
                                        <Box marginTop={2} marginBottom={1}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => {
                                                    setCharge([...charge, {
                                                        type: "Flat",
                                                        label: "",
                                                        amount: 0,
                                                    }])
                                                }}
                                            >
                                                Add Charge
                                            </Button>
                                        </Box>
                                        {charge.map((val, index) => (
                                            <Box key={index} mb={2}>
                                                <Badge badgeContent={index + 1} color="primary">
                                                </Badge>
                                                <Box p={2} border={1} borderColor="grey.300">
                                                    <Grid spacing={3} container>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <TextField
                                                                id="label"
                                                                name="label"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label={"Charge Name"}
                                                                type="text"
                                                                value={val.label}
                                                                onChange={(e) => handleChangeChargeValue(index, 'label', e.target.value)}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <FormControl fullWidth margin="dense" variant="outlined">
                                                                <InputLabel id="demo-simple-select-outlined-label">Charge Type</InputLabel>
                                                                <Select
                                                                    labelId="demo-simple-select-outlined-label"
                                                                    id="demo-simple-select-outlined"
                                                                    value={val.type}
                                                                    onChange={(e) => {
                                                                        handleChangeChargeValue(index, 'type', e.target.value)
                                                                    }}
                                                                    label="Type"
                                                                    name={"type_" + index}
                                                                >
                                                                    <MenuItem value="Flat">Flat</MenuItem>
                                                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <TextField
                                                                id="amount"
                                                                name="amount"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label={"Charge " + (val.type === "Flat" ? " Amount" : " Percentage")}
                                                                type="number"
                                                                value={val.amount}
                                                                onChange={(e) => handleChangeChargeValue(index, 'amount', parseFloat(e.target.value))}
                                                            />
                                                        </Grid>
                                                        <Grid container justify="flex-end" item xs={12} sm={6} md={6} >
                                                            <IconButton size="small" aria-label="delete"
                                                                onClick={() => {
                                                                    const _charge = [...charge];
                                                                    _charge.splice(index, 1)
                                                                    setCharge(_charge)
                                                                }} >
                                                                <Delete color="error" />
                                                            </IconButton>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Fragment>
                                }

                                {values.conditionType?.includes("Tax") &&
                                    <Fragment>
                                        <div className={"detail-box-content"}>
                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>Tax</h2>
                                        </div>
                                        <Box marginTop={2} marginBottom={1}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => {
                                                    setTax([...tax, {
                                                        type: "Flat",
                                                        taxCode: "",
                                                        amount: 0,
                                                    }])
                                                }}
                                            >
                                                Add Tax
                                            </Button>
                                        </Box>
                                        {tax.map((val, index) => (
                                            <Box key={index} mb={2}>
                                                <Badge badgeContent={index + 1} color="primary">
                                                </Badge>
                                                <Box p={2} border={1} borderColor="grey.300">
                                                    <Grid spacing={3} container>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <TextField
                                                                id="taxCode"
                                                                name="taxCode"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label={"Tax Code"}
                                                                type="text"
                                                                value={val.taxCode}
                                                                onChange={(e) => handleChangeTaxValue(index, 'taxCode', e.target.value)}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <FormControl fullWidth margin="dense" variant="outlined">
                                                                <InputLabel id="demo-simple-select-outlined-label">Tax Type</InputLabel>
                                                                <Select
                                                                    labelId="demo-simple-select-outlined-label"
                                                                    id="demo-simple-select-outlined"
                                                                    value={val.type}
                                                                    onChange={(e) => {
                                                                        handleChangeTaxValue(index, 'type', e.target.value)
                                                                    }}
                                                                    label="Type"
                                                                    name={"type_" + index}
                                                                >
                                                                    <MenuItem value="Flat">Flat</MenuItem>
                                                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item xs={12} sm={2} md={2}>
                                                            <TextField
                                                                id="amount"
                                                                name="amount"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label={"Tax " + (val.type === "Flat" ? " Amount" : " Percentage")}
                                                                type="number"
                                                                value={val.amount}
                                                                onChange={(e) => handleChangeTaxValue(index, 'amount', parseFloat(e.target.value))}
                                                            />
                                                        </Grid>
                                                        <Grid container justify="flex-end" item xs={12} sm={6} md={6} >
                                                            <IconButton size="small" aria-label="delete"
                                                                onClick={() => {
                                                                    const _tax = [...tax];
                                                                    _tax.splice(index, 1)
                                                                    setTax(_tax)
                                                                }} >
                                                                <Delete color="error" />
                                                            </IconButton>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Fragment>
                                }
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button size="small" color="primary"
                                onClick={() => {
                                    handleClose()
                                }}

                            >{"Close"}</Button>
                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                            > Save
                            </CustomButton>
                        </CustomDialogFooter>
                        {
                            showConfirmDialog ?
                                <ConfirmCancelDialog
                                    open={showConfirmDialog}
                                    onSave={() => {
                                        setShowConfirmDialog(false)
                                        submitForm();
                                    }}
                                    onClose={() => {
                                        setShowConfirmDialog(false)
                                        handleClose()
                                    }}
                                /> : null
                        }
                    </Fragment>
                )}
            </Formik>
            : null}
    </Dialog >
    );
}

export default ConditionDialog;
