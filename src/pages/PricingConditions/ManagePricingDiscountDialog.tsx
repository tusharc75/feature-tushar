import { useContext, useRef, useState } from "react";
import {
    Box,
    Button,
    TextField,
    Grid,
    Container,
    DialogContent,
    IconButton,
    ButtonGroup,
    makeStyles,
    InputAdornment,
    Dialog
} from "@material-ui/core";
import { Formik, Form, Field, FieldArray, FormikProps } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, getUniqueCurrencies, pricingCondition, removeEmptyKeys } from "../../constants/helpers";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { isMobile, isTablet } from "react-device-detect";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup/ToggleButtonGroup";
import { ToggleButton } from "@material-ui/lab";

const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1.5, 1.5, 1.5, 2),
        // borderBottom: `1px solid #daf5ff`
    },
    currencyStyle: {
        width: 400,
    },
    dialogTitle: {
        fontSize: "1.2rem"
    },
    priceConditionUsersStyle: {
        padding: "0"
    },
    priceConditionBox: {
        background: "#eeeeee",
        borderBottom: "2px solid lightgrey",
        padding: "10px"
    },
    priceConditionHeader: {
        background: "#f3f3f3",
        padding: "8px 14px",
        fontWeight: "bold"
    },
    contentBox: {
        margin: "10px",
        border: "1px solid #ded8d8",
        borderRadius: "4px",
        padding: "4px !important"
    }
}));

const discountTypeArray = [
    {
        key: "Flat Discount",
        value: 1,
    },
    {
        key: "Price Discount",
        value: 2,
    }
];
const ManagePricingDiscountDialog = ({ currency, discountType = null, pricingConditionsData, open, onClose, onSuccess }) => {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [currencySymbol, setCurrencySymbol] = useState(
        getUniqueCurrencies().some((data) => data?.currencyCode === currency)
            ? getUniqueCurrencies().find(
                (data) => data?.currencyCode === currency
            ).symbolNative
            : null);
    const { pricingConditionApi } = pricingCondition;
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState(discountType ? discountTypeArray.find((d) => d.key === discountType).key : "Flat Discount");
    const [selectedType, setSelectedType] = useState(discountType ? discountTypeArray.find((d) => d.key === discountType).value : discountTypeArray.find((d) => d.key === "Flat Discount").value);
    const formikRef = useRef<FormikProps<{ discounts: any[]; }>>();



    const handleSubmit = async (values) => {
        setLoading(true);
        axiosInstance().post(`${pricingConditionApi}/discount`, { "_id": pricingConditionsData._id, "type": discountTypeArray.find((d) => d.value === selectedType).key, "discount": values }).then(({ data }) => {
            toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
            });

            setLoading(false);
            onSuccess()
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        });
    }


    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
            setSelectedType(discountTypeArray.find((d) => d.key === newFilter).value);
            formikRef.current?.resetForm()

        }
    };

    return (
        <>
            {
                <Dialog
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile || isTablet}
                    TransitionComponent={CustomDialogTransition}
                    aria-labelledby="customized-dialog-title"
                    open={open}
                    onClose={onClose}
                >
                    <CustomDialogHeader title={"Add Pricing Condition"} />
                    <Grid container className={classes.priceConditionBox}>
                        <Grid item xs={6} md={6} sm={6}>
                            <ToggleButtonGroup size="small"
                                value={filter}
                                exclusive
                                onChange={handleFilter}>
                                {discountTypeArray.map((k, index) => {
                                    return (
                                        <ToggleButton value={k.key} key={index}>{k.key}
                                        </ToggleButton>
                                    );
                                })}
                            </ToggleButtonGroup>
                        </Grid>
                    </Grid>
                    <Formik
                        initialValues={{ discounts: pricingConditionsData?.discount }}
                        enableReinitialize={true}
                        onSubmit={() => { }}>
                        {({ values }) => (
                            <>
                                <CustomDialogContent >
                                    <Form>
                                        <Container className="p-0">
                                            <Grid
                                                container
                                                direction="row"
                                                justify="space-evenly"
                                                alignItems="center"
                                            >
                                                <Grid item md={12}>
                                                    {values?.discounts && values?.discounts.length > 0 && (

                                                        <Box className={classes.priceConditionHeader}>
                                                            <Grid
                                                                container
                                                                spacing={2}
                                                                direction="row"
                                                                justify="flex-start"
                                                                alignItems="center"
                                                            >
                                                                <Grid item md={1}> # </Grid>
                                                                <Grid item md={5}> Quantity </Grid>
                                                                <Grid item md={4}> {selectedType === 1 ? `Discount` : `Amount`} </Grid>
                                                                <Grid item md={2}></Grid>

                                                            </Grid>
                                                        </Box>
                                                    )}
                                                    <Box className="p-1">
                                                        <FieldArray
                                                            name="discounts"
                                                            render={arrayHelpers => (
                                                                <div>
                                                                    {values?.discounts && values?.discounts.length > 0 ? (
                                                                        values?.discounts.map((discountVal, index) => (
                                                                            <Grid
                                                                                container
                                                                                spacing={2}
                                                                                direction="row"
                                                                                justify="flex-start"
                                                                                alignItems="center"
                                                                                key={index}
                                                                            >
                                                                                <Grid item md={1}>{index + 1}</Grid>
                                                                                <Grid item md={5}>

                                                                                    <Field
                                                                                        fullWidth
                                                                                        variant="outlined"
                                                                                        type="text"
                                                                                        size="small"
                                                                                        component={TextField}
                                                                                        name="quantity"
                                                                                        placeholder="Enter Quantity"
                                                                                        value={discountVal?.quantity}
                                                                                        onChange={(e) => {
                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values?.discounts[index],
                                                                                                ["quantity"]: e.target.value.replace(/[^0-9]/g, '')
                                                                                            })
                                                                                        }}
                                                                                        required
                                                                                    />
                                                                                </Grid>

                                                                                <Grid item md={4}>
                                                                                    <Field
                                                                                        fullWidth
                                                                                        InputProps={{
                                                                                            startAdornment: (
                                                                                                <InputAdornment position="start">
                                                                                                    {selectedType === 1 ? `%` : currencySymbol ? currencySymbol : ""}
                                                                                                </InputAdornment>
                                                                                            ),
                                                                                        }}
                                                                                        startAdornment={currencySymbol ? <InputAdornment position="start">{selectedType === 1 ? `%` : currencySymbol ? currencySymbol : ""}</InputAdornment> : ""}
                                                                                        variant="outlined"
                                                                                        type="text"
                                                                                        size="small"
                                                                                        component={TextField}
                                                                                        name="amount"
                                                                                        placeholder="Enter Amount"
                                                                                        value={discountVal.amount}
                                                                                        onChange={(e) => {
                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values?.discounts[index],
                                                                                                ["amount"]: e.target.value.replace(/[^0-9]/g, '')
                                                                                            })
                                                                                        }}
                                                                                        required
                                                                                    />

                                                                                </Grid>

                                                                                <Grid item md={2}>
                                                                                    <ButtonGroup size="small" aria-label="small outlined button group">
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            aria-label="add"
                                                                                            onClick={() => {
                                                                                                arrayHelpers.push({ "quantity": 0, "amount": 0 })
                                                                                            }
                                                                                            } >
                                                                                            <Add />
                                                                                        </IconButton>
                                                                                        <IconButton size="small" aria-label="delete" style={{ color: "#f44336" }} onClick={() => arrayHelpers.remove(index)} >
                                                                                            <Delete />
                                                                                        </IconButton>
                                                                                    </ButtonGroup>
                                                                                </Grid>
                                                                            </Grid>
                                                                        ))
                                                                    ) : (
                                                                        <Grid item md={12} className="d-flex  align-items-center justify-content-center">
                                                                            <Button
                                                                                variant="contained"
                                                                                color="primary"
                                                                                size="large"
                                                                                onClick={() => {
                                                                                    arrayHelpers.push({ "quantity": 0, "amount": 0 })
                                                                                }}
                                                                            >
                                                                                Add Discount
                                                                            </Button>
                                                                        </Grid>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Container>
                                    </Form>

                                </CustomDialogContent>
                                <CustomDialogFooter>

                                    <Button
                                        size="small"
                                        onClick={onClose}
                                        variant="contained"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        size="small"
                                        onClick={() => {
                                            handleSubmit(values?.discounts)

                                        }}
                                    >Save
                                    </Button>
                                </CustomDialogFooter>
                            </>
                        )}
                    </Formik>
                </Dialog>
            }
        </>
    )
}

export default ManagePricingDiscountDialog;