import React, { useRef, useEffect, useState, useContext, Fragment } from "react";
import {
    Box,
    Button,
    Grid,
    IconButton,
    Tooltip,
    InputAdornment,
} from "@material-ui/core";
import { Formik, Form } from "formik";
import Dialog from "@material-ui/core/Dialog";
import axiosInstance from "../../axios/axiosInstance";
import {
    getObjKeys,
    yupSchema,
    getObjKeysWithValues,
    simplifyValues,
    pricingCondition,
    setFieldsInAscendingOrder,
    getUniqueCurrencies,
    formFieldNames,
} from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import FormTypes from "../../components/Helpers/FormTypes";
import CustomButton from "../../components/Helpers/CustomButton";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import PropTypes from "prop-types";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, isFieldNotTouched } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { isEqual } from 'lodash';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import MultipleEntry from './MultipleEntry';

const arr = [...Array(10).keys()];

export default function ManagePricingConditionsDialog({
    open,
    onSuccess,
    onClose,
    pricingConditionId
}) {
    const { pricingConditionApi } = pricingCondition;
    const toastConfig = useContext(CustomToastContext);
    const [initialData, setInitialData] = useState({ fields: [], values: {}, });
    const { state: { permissions } }: any = useData();
    const [formsData, setFormsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [dayWiseRent, setDayWiseRent] = useState([]);
    const [groupQtyDiscount, setGroupQtyDiscount] = useState([]);

    const ref = useRef(null);

    useEffect(() => {
        getPricingConditionsFields();
    }, [])

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }, [initialData.fields]);

    const getPricingConditionsFields = () => {
        axiosInstance().get(`/field?resource=Pricing Condition`).then(({ data: { data } }) => {
            const filterData = pricingConditionId
                ? data.filter((d) => d.isUpdate)
                : data.filter((d) => d.isCreate);

            if (pricingConditionId) {
                let newFields = [];
                axiosInstance().get(`${pricingConditionApi}/${pricingConditionId}`).then(({ data: { data } }) => {
                    filterData.map((_f) => {
                        newFields.push(_f.fieldData);
                    });
                    setDayWiseRent(data.dayWiseRent ? data.dayWiseRent : [])
                    setGroupQtyDiscount(data.groupQtyDiscount ? data.groupQtyDiscount : [])
                    setInitialData({
                        fields: newFields,
                        values: data
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: filterData.map(m => m.fieldData),
                    values: getObjKeys("", filterData.map(m => m.fieldData)),
                });
            }
        });
    };

    const onSubmit = (values) => {
        setLoading(true);
        values.dayWiseRent = [];
        if (values.rentType === "Variable") {
            values.dayWiseRent = dayWiseRent;
        }
        values.groupQtyDiscount = [];
        if (values.amountType === "Group Flat" || values.amountType === "Group Percentage") {
            values.groupQtyDiscount = groupQtyDiscount;
        }
        if (pricingConditionId) {
            values._id = pricingConditionId;
            axiosInstance().put(pricingConditionApi, values).then(({ data }) => {
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
        else {
            axiosInstance().post(pricingConditionApi, values).then(({ data }) => {
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
    };

    const handleScroll = (errors) => {
        const err = Object.keys(errors);
        if (err.length) {
            const input = document.querySelector(
                `input[name=${err[0]}]`,
            );

            input.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'start',
            });
        }
    }


    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                open={open}
                onClose={(e) => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                        setShowConfirmDialog(true)
                    }
                    else {
                        onClose()
                    }
                }}
            >
                <CustomDialogHeader
                    title={pricingConditionId ? `Edit Pricing Conditions` : "Create Pricing Conditions"}
                    onClose={() => {
                        if (!isEqual(ref.current.values, initialData.values)) {
                            setShowConfirmDialog(true)
                        }
                        else {
                            onClose()
                        }
                    }}
                />
                {initialData.fields.length === 0 && (
                    <CustomDialogContent>
                        <CommonSkeleton lenArray={arr} />
                    </CustomDialogContent>
                )}
                {initialData.fields.length > 0 && (
                    <Formik
                        initialValues={initialData.values}
                        validationSchema={yupSchema(initialData.fields)}
                        validateOnMount
                        innerRef={ref}
                        onSubmit={onSubmit}
                    >
                        {({
                            submitForm,
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            setFieldTouched,
                            setErrors,
                            setValues,
                        }) => (
                            <>
                                <CustomDialogContent>
                                    <Form>
                                        <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                        {formsData && formsData.map((form, index) => {
                                            return <div key={index}>
                                                <h2 className="form-label-style">{form.name}</h2>
                                                <Box marginY={2}>
                                                    <Grid spacing={3} container>
                                                        {form.sectionFields.map((field, index2) => (
                                                            <Grid key={index2} item xs={12} sm={6} md={6}>
                                                                <FormTypes
                                                                    // {...rest}
                                                                    values={values}
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    label={field.fieldLabel}
                                                                    name={field.fieldName}
                                                                    type={field.type}
                                                                    options={field.option}
                                                                    setFieldValue={(name, value) => {
                                                                        setFieldValue(name, value)
                                                                    }}
                                                                    required={field.required}
                                                                    fullWidth
                                                                    isTooltip={field?.isTooltip || false}
                                                                    tooltipMessage={field?.tooltipMessage}
                                                                    size="small"
                                                                    imageOrFileUploadCompletePercentage={null}
                                                                />
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            </div>
                                        })}
                                        <Box>
                                            <Grid spacing={3} container>
                                                {values.conditionType === "Price" ?
                                                    <Grid item xs={12} sm={6} md={6}>
                                                        <TextField
                                                            id="mrp"
                                                            name="mrp"
                                                            variant="outlined"
                                                            margin="dense"
                                                            fullWidth
                                                            label="Rate"
                                                            type="number"
                                                            value={values['mrp']}
                                                            onChange={(e) => setFieldValue('mrp', e.target.value)}
                                                        />
                                                    </Grid>
                                                    :
                                                    values.conditionType === "Rent" ?
                                                        <Fragment>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                <FormControl fullWidth margin="dense" variant="outlined">
                                                                    <InputLabel id="demo-simple-select-outlined-label">Rent Type</InputLabel>
                                                                    <Select
                                                                        labelId="demo-simple-select-outlined-label"
                                                                        id="demo-simple-select-outlined"
                                                                        value={values['rentType']}
                                                                        onChange={(e) => {
                                                                            setFieldValue('rentType', e.target.value)
                                                                        }}
                                                                        name="rentType"
                                                                    >
                                                                        <MenuItem value="Fixed">Fixed</MenuItem>
                                                                        <MenuItem value="Variable">Variable</MenuItem>
                                                                    </Select>
                                                                </FormControl>
                                                            </Grid>
                                                            {values.rentType === "Fixed" ?
                                                                <Grid item xs={12} sm={6} md={6}>
                                                                    <TextField
                                                                        id="rentRate"
                                                                        name="rentRate"
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        fullWidth
                                                                        label="Rent Per Day"
                                                                        type="number"
                                                                        value={values['rentRate']}
                                                                        onChange={(e) => setFieldValue('rentRate', e.target.value)}
                                                                    />
                                                                </Grid>
                                                                : null
                                                            }
                                                        </Fragment> :
                                                        <Fragment>
                                                            {(values.conditionType === "Discount" || values.conditionType === "Charge" || values.conditionType === "Tax") &&
                                                                <Grid item xs={12} sm={6} md={6}>
                                                                    <FormControl fullWidth margin="dense" variant="outlined">
                                                                        <InputLabel id="demo-simple-select-outlined-label">{values.conditionType} Type</InputLabel>
                                                                        <Select
                                                                            labelId="demo-simple-select-outlined-label"
                                                                            id="demo-simple-select-outlined"
                                                                            value={values['amountType']}
                                                                            onChange={(e) => {
                                                                                setFieldValue('amountType', e.target.value)
                                                                            }}
                                                                            label="Type"
                                                                            name="amountType"
                                                                        >
                                                                            <MenuItem value="Flat">Flat</MenuItem>
                                                                            <MenuItem value="Percentage">Percentage</MenuItem>
                                                                            {values.conditionType === "Discount" &&
                                                                                <MenuItem value="Group Flat">Group Flat</MenuItem>
                                                                            }
                                                                            {values.conditionType === "Discount" &&
                                                                                <MenuItem value="Group Percentage">Group Percentage</MenuItem>
                                                                            }
                                                                        </Select>
                                                                    </FormControl>
                                                                </Grid>
                                                            }
                                                            {(values.amountType === "Flat" || values.amountType === "Percentage") &&
                                                                <Grid item xs={12} sm={6} md={6}>
                                                                    <TextField
                                                                        id="amount"
                                                                        name="amount"
                                                                        variant="outlined"
                                                                        margin="dense"
                                                                        fullWidth
                                                                        label={values.conditionType + (values.amountType === "Flat" ? " Amount" : " Percentage")}
                                                                        type="number"
                                                                        value={values['amount']}
                                                                        onChange={(e) => setFieldValue('amount', e.target.value)}
                                                                    />
                                                                </Grid>
                                                            }
                                                        </Fragment>
                                                }
                                                {(values.conditionType === "Discount" && (values.amountType === "Flat" || values.amountType === "Percentage")) &&
                                                    <Fragment>
                                                        <Grid item xs={12} sm={6} md={6}>
                                                            <TextField
                                                                id="minTransAmount"
                                                                name="minTransAmount"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label="Minimum Transaction Amount"
                                                                type="number"
                                                                value={values['minTransAmount']}
                                                                onChange={(e) => setFieldValue('minTransAmount', e.target.value)}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={6}>
                                                            <TextField
                                                                id="maxDiscount"
                                                                name="maxDiscount"
                                                                variant="outlined"
                                                                margin="dense"
                                                                fullWidth
                                                                label="Maximum Discount"
                                                                type="number"
                                                                value={values['maxDiscount']}
                                                                onChange={(e) => setFieldValue('maxDiscount', e.target.value)}
                                                            />
                                                        </Grid>
                                                    </Fragment>
                                                }
                                            </Grid>
                                            {(values.conditionType === "Rent" && values.rentType === "Variable") &&
                                                <MultipleEntry
                                                    list={dayWiseRent}
                                                    setList={setDayWiseRent}
                                                    fieldNames={["day", "rate"]}
                                                    fieldLabels={["Till Days", "Per Day Rate"]}
                                                    label="Day Wise Rent"
                                                />
                                            }
                                            {(values.conditionType === "Discount" && (values.amountType === "Group Flat" || values.amountType === "Group Percentage")) &&
                                                <MultipleEntry
                                                    list={dayWiseRent}
                                                    setList={setDayWiseRent}
                                                    fieldNames={["qty", "amount"]}
                                                    fieldLabels={values.amountType === "Group Flat" ? ["Quantity", "Discount Amount"]
                                                        : ["Quantity", "Discount Percentage"]}
                                                    label="Group Discount"
                                                />
                                            }
                                        </Box>
                                    </Form>
                                </CustomDialogContent>
                                <CustomDialogFooter>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            if (!isEqual(ref.current.values, initialData.values)) {
                                                setShowConfirmDialog(true)
                                            }
                                            else {
                                                onClose()
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <CustomButton
                                        loading={loading}
                                        variant="contained"
                                        color="primary"
                                        disabled={loading || isEqual(ref?.current?.values, initialData?.values)}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleScroll(errors)
                                            submitForm();
                                        }}
                                    >
                                        Save
                                    </CustomButton>
                                </CustomDialogFooter>
                                {
                                    showConfirmDialog ?
                                        <ConfirmCancelDialog
                                            open={showConfirmDialog}
                                            onSave={() => {
                                                setShowConfirmDialog(false)
                                                handleScroll(errors)
                                                submitForm();
                                            }}
                                            onClose={() => {
                                                setShowConfirmDialog(false)
                                                onClose()
                                            }}
                                        /> : null
                                }

                            </>
                        )}
                    </Formik>
                )
                }
            </Dialog >
        </>
    );
}


ManagePricingConditionsDialog.propTypes = {
    open: PropTypes.bool,
    onSuccess: PropTypes.func,
    onClose: PropTypes.any,
    pricingConditionsId: PropTypes.string
};
