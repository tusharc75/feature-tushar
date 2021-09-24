import { useContext, useState } from "react";
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
import { Formik, Form, Field, FieldArray } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, getUniqueCurrencies, pricingCondition, removeEmptyKeys } from "../../constants/helpers";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { isMobile, isTablet } from "react-device-detect";

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
const ManagePricingDiscountDialog = ({ currency, pricingConditionsData, open, onClose, onSuccess }) => {
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



    const handleSubmit = async (values) => {
        setLoading(true);
        axiosInstance().post(`${pricingConditionApi}/discount`, { "_id": pricingConditionsData._id, "discount": values }).then(({ data }) => {
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
                    <>
                        <CustomDialogHeader title={"Add Pricing Condition"} />
                        <div className={classes.priceConditionUsersStyle}>
                            <Formik
                                initialValues={{ discounts: pricingConditionsData?.discount }}
                                enableReinitialize={true}
                                onSubmit={() => { }}>
                                {({ values }) => (
                                    <>
                                        <DialogContent className={classes.contentBox}>
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
                                                                        <Grid item md={5}> Discount </Grid>
                                                                        <Grid item md={4}> Amount </Grid>
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
                                                                                                name="discount"
                                                                                                placeholder="Enter Discount"
                                                                                                value={discountVal?.discount}
                                                                                                onChange={(e) => {
                                                                                                    arrayHelpers.replace(index, {
                                                                                                        ...values?.discounts[index],
                                                                                                        ["discount"]: e.target.value.replace(/[^0-9]/g, '')
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
                                                                                                            {currencySymbol ? currencySymbol : ""}
                                                                                                        </InputAdornment>
                                                                                                    ),
                                                                                                }}
                                                                                                startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ""}
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
                                                                                                        arrayHelpers.push({ "discount": 0, "amount": 0 })
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
                                                                                            arrayHelpers.push({ "discount": 0, "amount": 0 })
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

                                        </DialogContent>

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
                        </div>
                    </>
                </Dialog>
            }
        </>
    )
}

export default ManagePricingDiscountDialog;