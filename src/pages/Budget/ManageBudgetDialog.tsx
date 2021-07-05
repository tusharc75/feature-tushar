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
import CreateProductCategory from "../ProductCategory/CreateProductCategory";

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

    const [showAddProductCategoryDialog, setShowAddProductCategoryDialog] = useState(false);
    const [productCategoryDataSource, setProductCategoryDataSource] = useState([]);
    const [newProductCategoryId, setNewProductCategoryId] = useState(null);

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

                if (filterData.length > 0) {
                    const productCategoryDropdownData = filterData.find(
                        (d) => d.fieldName === "productCategory"
                    );

                    if (productCategoryDropdownData) {
                        if (!budgetId) {
                            setProductCategoryDataSource(productCategoryDropdownData.option);
                        } else {
                            let currentContactRemovedDataSource =
                                productCategoryDropdownData.option.filter(
                                    (d) => d.optionValue !== newProductCategoryId
                                );
                            setProductCategoryDataSource(currentContactRemovedDataSource);
                        }
                    }
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

    const initializeProductCategoryDropdown = (values, productCategorySource) => {
        if (values && values.hasOwnProperty("productCategory")) {
            const getNewAddedProductCategory = productCategorySource.find(
                (d) => d.optionValue === newProductCategoryId
            );
            if (getNewAddedProductCategory) {
                values["productCategory"] = getNewAddedProductCategory.optionValue;
            }
            return values;
        }
        return values;
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
                                                                            ) : field.fieldName === "productCategory" ? <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                                <Grid container spacing={1}>
                                                                                    <Grid
                                                                                        item
                                                                                        xs={
                                                                                            //  TODO: Product category is not added in role, once implementation is done, please uncomment below lines
                                                                                            // permissions.productCategory
                                                                                            //     .isCreate
                                                                                            true ? 10
                                                                                                : 11
                                                                                        }
                                                                                        sm={
                                                                                            // permissions.productCategory
                                                                                            //     .isCreate
                                                                                            true ? 10
                                                                                                : 11
                                                                                        }
                                                                                        md={
                                                                                            // permissions.productCategory
                                                                                            //     .isCreate
                                                                                            true ? 10
                                                                                                : 11
                                                                                        }
                                                                                    >
                                                                                        <FormTypes
                                                                                            fields={entityData.fields}
                                                                                            fieldData={field}
                                                                                            errors={errors}
                                                                                            touched={touched}
                                                                                            label={field.fieldLabel}
                                                                                            name={field.fieldName}
                                                                                            type={field.type}
                                                                                            setFieldValue={setFieldValue}
                                                                                            required={field.required}
                                                                                            fullWidth
                                                                                            isTooltip={field.isTooltip}
                                                                                            tooltipMessage={field.tooltipMessage}
                                                                                            disableClearable
                                                                                            onChange={(e, val) => {
                                                                                                setNewProductCategoryId(null);
                                                                                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                                // handleChangeCategory(val && val.optionValue ? val.optionValue : "",
                                                                                                //     val && val.optionLabel ? val.optionLabel : "", true)
                                                                                            }}
                                                                                            size="small"
                                                                                            values={
                                                                                                newProductCategoryId
                                                                                                    ? initializeProductCategoryDropdown(
                                                                                                        values,
                                                                                                        productCategoryDataSource
                                                                                                    )
                                                                                                    : values
                                                                                            }
                                                                                            options={productCategoryDataSource}
                                                                                            doNotShowInfoTooltip={true}
                                                                                        />
                                                                                    </Grid>
                                                                                    {
                                                                                        // permissions.productCategory
                                                                                        //     .isCreate
                                                                                        true && (
                                                                                            <Grid item xs={1} sm={1} md={1}>
                                                                                                <Tooltip
                                                                                                    title="Add Product Category"
                                                                                                    className="mt-1"
                                                                                                >
                                                                                                    <IconButton
                                                                                                        onClick={() => { setShowAddProductCategoryDialog(true); }}
                                                                                                        size="small"
                                                                                                    >
                                                                                                        <AddIcon color="primary" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            </Grid>
                                                                                        )
                                                                                    }
                                                                                    {field?.tooltipMessage ? (
                                                                                        <Grid item xs={1} sm={1} md={1}>
                                                                                            <Tooltip
                                                                                                title={
                                                                                                    field?.tooltipMessage ?? ""
                                                                                                }
                                                                                            >
                                                                                                <InfoIcon color="disabled" />
                                                                                            </Tooltip>
                                                                                        </Grid>
                                                                                    ) : null}
                                                                                </Grid>
                                                                            </Grid> : (
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

            {
                showAddProductCategoryDialog && <CreateProductCategory
                    productCategoryId={null}
                    handleClose={(data) => {

                        if (data?._id) {
                            setProductCategoryDataSource((prevState) => {
                                return [
                                    ...prevState,
                                    {
                                        optionValue: data._id,
                                        optionLabel: data.name,
                                        order: productCategoryDataSource.length,
                                        default: false,
                                    },
                                ];
                            });
                            setNewProductCategoryId(data._id);
                        }
                        setShowAddProductCategoryDialog(false);
                        // fetchProductCategory();

                    }}
                />
            }
        </>
    );
}


ManageBudgetDialog.propTypes = {
    open: PropTypes.bool,
    onSuccess: PropTypes.func,
    onClose: PropTypes.any,
    budgetId: PropTypes.string
};
