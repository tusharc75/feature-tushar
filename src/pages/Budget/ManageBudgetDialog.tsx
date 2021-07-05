import React, { useEffect, useState, useContext } from "react";
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
    budget,
    setFieldsInAscendingOrder,
    getUniqueCurrencies
} from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import FormTypes from "../../components/Helpers/FormTypes";
import CustomButton from "../../components/Helpers/CustomButton";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import PropTypes from "prop-types";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../constants/helpers";

const budgetMonths = ["januaryBudget", "februaryBudget", "marchBudget", "aprilBudget", "mayBudget", "juneBudget",
    "julyBudget", "augustBudget", "septemberBudget", "octoberBudget", "novemberBudget", "decemberBudget"]

const arr = [...Array(9).keys()];
export default function ManageBudgetDialog({
    open,
    onSuccess,
    onClose,
    budgetId
}) {
    const { budgetApi } = budget;
    const toastConfig = useContext(CustomToastContext);

    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });

    const [formsData, setFormsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currencySymbol, setCurrencySymbol] = useState(null);

    useEffect(() => {
        getBudgetFields();
    }, [])

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(entityData.fields));
    }, [entityData.fields]);

    const getBudgetFields = () => {
        axiosInstance()
            .get(`/field?resource=Budget`)
            .then(({ data: { data } }) => {

                const filterData = budgetId
                    ? data.filter((d) => d.isUpdate)
                    : data.filter((d) => d.isCreate);

                if (budgetId) {
                    let newFields = [];

                    axiosInstance().get(`${budgetApi}/${budgetId}`).then(({ data: { data } }) => {
                        data.year = new Date(`${data.year}-01-01`);

                        filterData.map((_f) => {

                            if (_f.fieldData.fieldName === "currency") {
                                setCurrencySymbol(
                                    getUniqueCurrencies().find(
                                        (d) => d.currencyCode === data["currency"]
                                    )?.symbolNative
                                );
                            }

                            newFields.push(_f.fieldData);
                        });

                        setEntityData({
                            fields: newFields,
                            initialValues: getObjKeysWithValues(data, newFields)
                        });
                    }).catch((error) => {
                        toastConfig.setToastConfig(error);
                    });
                }
                else {
                    setEntityData({
                        fields: filterData.map(m => m.fieldData),
                        initialValues: getObjKeys("", filterData.map(m => m.fieldData)),
                    });
                }
            });
    };

    const onSubmit = (values) => {
        values.year = new Date(values.year).getFullYear();

        if (budgetId) {
            values._id = budgetId;
            axiosInstance().put(budgetApi, values).then(({ data }) => {
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
            axiosInstance().post(budgetApi, values).then(({ data }) => {
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

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={onClose}
                open={open}
                disableBackdropClick={true}
            >
                <CustomDialogHeader
                    title={
                        budgetId
                            ? `Editing ${entityData.initialValues && entityData.initialValues["name"] ? entityData.initialValues["name"] : ""}`
                            : "Create Budget"
                    }
                    onClose={onClose}
                />

                {entityData.fields.length === 0 && (
                    <CustomDialogContent>
                        <CommonSkeleton lenArray={arr} />
                    </CustomDialogContent>
                )}
                {entityData.fields.length > 0 && (
                    <Formik
                        initialValues={entityData.initialValues}
                        validationSchema={yupSchema(entityData.fields)}
                        validateOnMount
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
                                        {formsData &&
                                            formsData.map((form, index1) => {
                                                return form.name ? (
                                                    <div key={index1}>
                                                        <h2 className="form-label-style">{form.name}</h2>
                                                        <Box marginY={2}>
                                                            <Grid spacing={3} container>
                                                                {form.sectionFields.map((field, index2) => (
                                                                    <Grid key={index2} item xs={12} sm={6} md={6}>
                                                                        {
                                                                            field.fieldName === "currency" ? (
                                                                                <FormTypes
                                                                                    // {...rest}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={field.option}
                                                                                    setFieldValue={setFieldValue}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    size="small"
                                                                                    onChange={(e, val) => {
                                                                                        if (val && val.currencyCode) {
                                                                                            setFieldValue(
                                                                                                field.fieldName,
                                                                                                val.currencyCode
                                                                                            );
                                                                                            setCurrencySymbol(val.symbolNative);
                                                                                        } else {
                                                                                            setFieldValue(field.fieldName, "");
                                                                                            setCurrencySymbol(null);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            ) : budgetMonths.some(d => d === field.fieldName.trim()) ? (
                                                                                <FormTypes
                                                                                    // {...rest}
                                                                                    startAdornment={
                                                                                        currencySymbol ? (
                                                                                            <InputAdornment position="start">
                                                                                                {currencySymbol}
                                                                                            </InputAdornment>
                                                                                        ) : (
                                                                                            ""
                                                                                        )
                                                                                    }
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={field.option}
                                                                                    setFieldValue={setFieldValue}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    size="small"
                                                                                />
                                                                            ) : (
                                                                                <FormTypes
                                                                                    // {...rest}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={field.option}
                                                                                    setFieldValue={setFieldValue}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    size="small"
                                                                                    imageOrFileUploadCompletePercentage={null}
                                                                                />
                                                                            )}
                                                                    </Grid>
                                                                ))}
                                                            </Grid>
                                                        </Box>
                                                    </div>
                                                ) : (
                                                    form.sectionFields.map((field) => (
                                                        <FormTypes
                                                            // {...rest}
                                                            values={values}
                                                            errors={errors}
                                                            touched={touched}
                                                            label={field.fieldLabel}
                                                            name={field.fieldName}
                                                            type={field.type}
                                                            options={field.option}
                                                            setFieldValue={setFieldValue}
                                                            required={field.required}
                                                            fullWidth
                                                            isTooltip={field?.isTooltip || false}
                                                            tooltipMessage={field?.tooltipMessage}
                                                            size="small"
                                                            style={{ visibility: "hidden" }}
                                                        />
                                                    ))
                                                );
                                            })}
                                    </Form>

                                </CustomDialogContent>

                                <CustomDialogFooter>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </Button>

                                    <CustomButton
                                        loading={loading}
                                        variant="contained"
                                        color="primary"
                                        disabled={
                                            Object.values(
                                                simplifyValues(
                                                    entityData.initialValues,
                                                    entityData.fields
                                                )
                                            ).toString() ===
                                            Object.values(
                                                simplifyValues(values, entityData.fields)
                                            ).toString()
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            submitForm();
                                        }}
                                    >
                                        Save
                                    </CustomButton>
                                </CustomDialogFooter>
                            </>
                        )}
                    </Formik>
                )}
            </Dialog>


            {/* {showAddCustomerAccountDialog && (
                <ManageAccountDialog
                    open={showAddCustomerAccountDialog}
                    onClose={() => {
                        setShowAddCustomerAccountDialog(false);
                    }}
                    id={null}
                    accountResource={customerAccount.accountResource}
                    accountApi={customerAccount.accountApi}
                    isGetAccountData={true}
                    onGetAddedAccount={({ data }) => {
                        setNewAddedAccountId(data._id);
                        updateAccountDropdown(data);

                        setFieldValue("customerAccountName", data._id);
                    }}
                    isRedirectToDetailPage={false}
                />
            )} */}
        </>
    );
}


ManageBudgetDialog.propTypes = {
    open: PropTypes.bool,
    onSuccess: PropTypes.func,
    onClose: PropTypes.any,
    isNew: PropTypes.bool,
    dataToUpdate: PropTypes.any,
};
