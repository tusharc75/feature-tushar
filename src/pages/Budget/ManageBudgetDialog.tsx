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
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, isFieldNotTouched } from "../../constants/helpers";
import CreateProductCategory from "../ProductCategory/CreateProductCategory";
import ManageMarketSegmentDialog from "../MarketSegment/ManageMarketSegmentDialog";
import { useData } from "../../StateProvider/Provider";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { FaDiceOne } from "react-icons/fa";

const budgetMonths = ["januaryBudget", "februaryBudget", "marchBudget", "aprilBudget", "mayBudget", "juneBudget",
    "julyBudget", "augustBudget", "septemberBudget", "octoberBudget", "novemberBudget", "decemberBudget"]

const arr = [...Array(9).keys()];
export default function ManageBudgetDialog({
    open,
    onSuccess,
    onClose,
    budgetId,
    isClone
}) {
    const { budgetApi } = budget;
    const toastConfig = useContext(CustomToastContext);


    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const {
        state: { permissions, selectedEntity, user },
    }: any = useData();

    const [formsData, setFormsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [currency, setCurrency] = useState(null);

    const [showAddProductCategoryDialog, setShowAddProductCategoryDialog] = useState(false);
    const [productCategoryDataSource, setProductCategoryDataSource] = useState([]);
    const [newProductCategoryId, setNewProductCategoryId] = useState(null);

    const [salesRepDataSource, setSalesRepDataSource] = useState([])
    const [usersDataSource, setUsersDataSource] = useState([]);

    const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);

    const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
    const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
    const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
    const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
    const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formValues, setFormValues] = useState({})
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    useEffect(() => {
        getBudgetFields();
        setCurrency(user.entity.find(d => d._id === selectedEntity).currency);
        setCurrencySymbol(
            getUniqueCurrencies().find(
                (d) => d.currencyCode === user.entity.find(d => d._id === selectedEntity).currency
            )?.symbolNative
        );
    }, [])

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(entityData.fields));
        if (entityData.initialValues && entityData.initialValues["entity"]) {
            onSalesRepDropdownOpen(entityData.initialValues["entity"])
        }
    }, [entityData.fields]);

    const onSalesRepDropdownOpen = (selectedEntity) => {
        if (selectedEntity) {
            let newTempArray = [];

            [selectedEntity].forEach(d => {
                usersDataSource.forEach(item => {
                    if (item.entities?.find(s => s.entity === d)) {
                        if (!newTempArray.find(s => s.optionValue === item.optionValue)) {
                            newTempArray.push(item)
                        }
                    }
                })
            })
            setSalesRepDataSource(newTempArray)
        }
        else {
            setSalesRepDataSource(usersDataSource);
        }
    };

    const getBudgetFields = () => {
        axiosInstance()
            .get(`/field?resource=Budget`)
            .then(({ data: { data } }) => {

                const filterData = budgetId
                    ? data.filter((d) => d.isUpdate)
                    : data.filter((d) => d.isCreate);

                //  Initialize market segment dropdown which have parentMarketSegment === "" or that record have child
                const marketSegmentDropdownData = filterData.map(m => m.fieldData).find(
                    (d) => d.fieldName === formFieldNames.marketSegment
                );
                if (marketSegmentDropdownData) {
                    setMainMarketSegmentDataSource(marketSegmentDropdownData.option);

                    let initializeMarketSegmentDataSource = [];
                    marketSegmentDropdownData.option.forEach(option => {
                        if (option.parentMarketSegment === "" || marketSegmentDropdownData.option.some(s => s.parentMarketSegment === option.optionValue)) {
                            initializeMarketSegmentDataSource.push(option);
                        }
                    })
                    setMarketSegmentDataSource(initializeMarketSegmentDataSource);
                }

                //  Check sales rep field
                const salesRepDropdownData = filterData.map(m => m.fieldData).find(
                    (d) => d.fieldName === "salesRep"
                );
                if (salesRepDropdownData) {
                    setUsersDataSource(salesRepDropdownData.option);
                }

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

                        if (marketSegmentDropdownData) {
                            setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter(d => d.parentMarketSegment === data.marketSegment?.optionValue));
                        }

                        let clonedData = { ...data }

                        if (isClone) {
                            let { name, _id, ...rest } = clonedData
                            clonedData = { ...rest }
                        }
                        setEntityData({
                            fields: newFields,
                            initialValues: getObjKeysWithValues(clonedData, newFields)
                        });
                        setFormValues(getObjKeysWithValues(clonedData, newFields))
                    }).catch((error) => {
                        toastConfig.setToastConfig(error);
                    });
                }
                else {
                    setEntityData({
                        fields: filterData.map(m => m.fieldData),
                        initialValues: getObjKeys("", filterData.map(m => m.fieldData)),
                    });
                    setFormValues(getObjKeys("", filterData.map(m => m.fieldData)))
                }

                if (filterData.length > 0) {
                    const productCategoryDropdownData = filterData.map(m => m.fieldData).find(
                        (d) => d.fieldName === "productCategory"
                    );

                    if (productCategoryDropdownData) {
                        setProductCategoryDataSource(productCategoryDropdownData.option);
                    }
                }
            });
    };

    const marketSegmentChange = (marketSegmentId: string) => {
        setSubMarketSegmentDataSource(marketSegmentId ? mainMarketSegmentDataSource.filter(d => d.parentMarketSegment === marketSegmentId) : []);
    }

    const onSubmit = (values) => {
        setLoading(true);

        if (budgetId && !isClone) {
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
                (d) => d?.optionValue === newProductCategoryId
            );
            if (getNewAddedProductCategory) {
                values["productCategory"] = getNewAddedProductCategory.optionValue;
            }
            return values;
        }
        return values;
    };

    const initializeMarketSegmentDropdown = (values, marketSegmentSource) => {
        if (values && values.hasOwnProperty(formFieldNames.marketSegment)) {
            const getNewAddedMarketSegment = marketSegmentSource.find(
                (d) => d?.optionValue === newMarketSegmentId
            );
            if (getNewAddedMarketSegment) {
                values[formFieldNames.marketSegment] = getNewAddedMarketSegment.optionValue;
            }
            return values;
        }
        return values;
    };

    const initializeSubMarketSegmentDropdown = (values, subMarketSegmentSource) => {
        if (values && values.hasOwnProperty(formFieldNames.subMarketSegment)) {
            const getNewAddedSubMarketSegment = subMarketSegmentSource.find(
                (d) => d?.optionValue === newSubMarketSegmentId
            );
            if (getNewAddedSubMarketSegment) {
                values[formFieldNames.subMarketSegment] = getNewAddedSubMarketSegment.optionValue;
            }
            return values;
        }
        return values;
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
    const handleValuesChange = (data) => {
        setFormValues((prevState) => ({
            ...prevState,
            ...data
        }))
    }

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen || (isMobile || isTablet)}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                open={open}
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        setShowConfirmDialog(true)
                    }
                }}
            >
                <CustomDialogHeader
                    title={
                        isClone ? "Clone" :
                            budgetId
                                ? `Editing ${entityData.initialValues && entityData.initialValues["name"] ? entityData.initialValues["name"] : ""}`
                                : "Create Budget"
                    }
                    onClose={() => {
                        if (isFieldNotTouched(entityData, formValues)) onClose()
                        else setShowConfirmDialog(true)
                    }}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen(prevState => !prevState)
                    }}
                    showManimizeMaximize={true}
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
                                        {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}
                                        {formsData &&
                                            formsData.map((form, index1) => {
                                                return form.name ? (
                                                    <div key={index1}>
                                                        <div className={"detail-box-content"}>
                                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                                                        </div>
                                                        <Box marginY={2}>
                                                            <Grid spacing={3} container>
                                                                {form.sectionFields.map((field, index2) => (
                                                                    <Grid key={index2} item xs={12} sm={6} md={6}>
                                                                        {
                                                                            field.fieldName === "entity" ? (
                                                                                <FormTypes
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={field.option}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    required={field.required}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                    size="small"
                                                                                    onChange={(e, value) => {
                                                                                        setFieldValue(
                                                                                            field.fieldName,
                                                                                            value ? value.optionValue : ""
                                                                                        );
                                                                                        setFieldValue("salesRep", "");
                                                                                        handleValuesChange({
                                                                                            [field.fieldName]: value ? value.optionValue : "",
                                                                                            salesRep: ""
                                                                                        })
                                                                                    }}
                                                                                />
                                                                            ) : field.fieldName === "currency" ? (
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
                                                                                        handleValuesChange({ [name]: value })
                                                                                        setFieldValue(name, value)
                                                                                    }}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                    size="small"
                                                                                    onChange={(e, val) => {
                                                                                        if (val && val.currencyCode) {
                                                                                            setFieldValue(
                                                                                                field.fieldName,
                                                                                                val.currencyCode
                                                                                            );
                                                                                            handleValuesChange({ [field.fieldName]: val.currencyCode })
                                                                                            setCurrencySymbol(val.symbolNative);
                                                                                        } else {
                                                                                            setFieldValue(field.fieldName, "");
                                                                                            handleValuesChange({ [field.fieldName]: "" })
                                                                                            setCurrencySymbol(null);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            ) : budgetMonths.some(d => d === field.fieldName.trim()) ? (
                                                                                <FormTypes
                                                                                    // {...rest}
                                                                                    selectedCurrencyCode={values["currency"] || currency}
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
                                                                                    disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={field.option}
                                                                                    setFieldValue={(name, value) => {
                                                                                        handleValuesChange({ [name]: value })
                                                                                        setFieldValue(name, value)
                                                                                    }}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    size="small"
                                                                                />
                                                                            ) : field.fieldName === "productCategory" ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                                                <Grid container spacing={1}>
                                                                                    <Grid
                                                                                        item
                                                                                        xs={
                                                                                            //  TODO: Product category is not added in role, once implementation is done, please uncomment below lines
                                                                                            permissions.productCategory.isCreate ? 11
                                                                                                : 11
                                                                                        }
                                                                                        sm={
                                                                                            permissions.productCategory.isCreate ? 11
                                                                                                : 11
                                                                                        }
                                                                                        md={
                                                                                            permissions.productCategory.isCreate ? 11
                                                                                                : 11
                                                                                        }
                                                                                    >
                                                                                        <FormTypes
                                                                                            fields={entityData.fields}
                                                                                            fieldData={field}
                                                                                            disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                            errors={errors}
                                                                                            touched={touched}
                                                                                            label={field.fieldLabel}
                                                                                            name={field.fieldName}
                                                                                            type={field.type}
                                                                                            setFieldValue={(name, value) => {
                                                                                                handleValuesChange({ [name]: value })
                                                                                                setFieldValue(name, value)
                                                                                            }}
                                                                                            required={field.required}
                                                                                            fullWidth
                                                                                            isTooltip={field.isTooltip}
                                                                                            tooltipMessage={field.tooltipMessage}
                                                                                            onChange={(e, val) => {
                                                                                                setNewProductCategoryId(null);
                                                                                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                                handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })
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
                                                                                        permissions.productCategory.isCreate && (
                                                                                            <Grid item xs={1} sm={1} md={1}>
                                                                                                <Tooltip
                                                                                                    title="Add Product Category"
                                                                                                    className="mt-1"
                                                                                                >
                                                                                                    <IconButton
                                                                                                        onClick={() => { setShowAddProductCategoryDialog(true); }}
                                                                                                        disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                                        size="small"
                                                                                                    >
                                                                                                        <AddIcon color={(Boolean(budgetId) && field.disableOnEdit) ? "disabled" : "primary"} />
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
                                                                            </Grid>
                                                                                : field.fieldName === formFieldNames.marketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                                                    <Grid container spacing={1}>
                                                                                        <Grid
                                                                                            item
                                                                                            xs={
                                                                                                permissions.marketSegment.isCreate ? 11
                                                                                                    : 11
                                                                                            }
                                                                                            sm={
                                                                                                permissions.marketSegment.isCreate ? 11
                                                                                                    : 11
                                                                                            }
                                                                                            md={
                                                                                                permissions.marketSegment.isCreate ? 11
                                                                                                    : 11
                                                                                            }
                                                                                        >
                                                                                            <FormTypes
                                                                                                fields={entityData.fields}
                                                                                                fieldData={field}
                                                                                                disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                                errors={errors}
                                                                                                touched={touched}
                                                                                                label={field.fieldLabel}
                                                                                                name={field.fieldName}
                                                                                                type={field.type}
                                                                                                setFieldValue={(name, value) => {
                                                                                                    handleValuesChange({ [name]: value })
                                                                                                    setFieldValue(name, value)
                                                                                                }}
                                                                                                required={field.required}
                                                                                                fullWidth
                                                                                                isTooltip={field.isTooltip}
                                                                                                tooltipMessage={field.tooltipMessage}
                                                                                                onChange={(e, val) => {
                                                                                                    setNewMarketSegmentId(null);
                                                                                                    setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                                    setNewSubMarketSegmentId(null);
                                                                                                    setFieldValue(formFieldNames.subMarketSegment, "")
                                                                                                    handleValuesChange({
                                                                                                        [field.fieldName]: val && val.optionValue ? val.optionValue : "",
                                                                                                        [formFieldNames.subMarketSegment]: ""
                                                                                                    })
                                                                                                    marketSegmentChange(val && val.optionValue ? val.optionValue : "");
                                                                                                }}
                                                                                                size="small"
                                                                                                values={
                                                                                                    newMarketSegmentId
                                                                                                        ? initializeMarketSegmentDropdown(
                                                                                                            values,
                                                                                                            marketSegmentDataSource
                                                                                                        )
                                                                                                        : values
                                                                                                }
                                                                                                options={marketSegmentDataSource}
                                                                                                doNotShowInfoTooltip={true}
                                                                                            />
                                                                                        </Grid>
                                                                                        {
                                                                                            // permissions.productCategory
                                                                                            //     .isCreate
                                                                                            permissions.marketSegment.isCreate && (
                                                                                                <Grid item xs={1} sm={1} md={1}>
                                                                                                    <Tooltip
                                                                                                        title="Add Market Segment"
                                                                                                        className="mt-1"
                                                                                                    >
                                                                                                        <IconButton
                                                                                                            onClick={() => { setShowAddMarketSegmentDialog(true); }}
                                                                                                            disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                                            size="small"
                                                                                                        >
                                                                                                            <AddIcon color={(Boolean(budgetId) && field.disableOnEdit) ? "disabled" : "primary"} />
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
                                                                                </Grid> : field.fieldName === formFieldNames.subMarketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                                                    <Grid container spacing={1}>
                                                                                        <Grid
                                                                                            item
                                                                                            xs={
                                                                                                permissions.marketSegment.isCreate ? 11
                                                                                                    : 11
                                                                                            }
                                                                                            sm={
                                                                                                permissions.marketSegment.isCreate ? 11
                                                                                                    : 11
                                                                                            }
                                                                                            md={
                                                                                                permissions.marketSegment.isCreate ? 11
                                                                                                    : 11
                                                                                            }
                                                                                        >
                                                                                            <FormTypes
                                                                                                fields={entityData.fields}
                                                                                                fieldData={field}
                                                                                                disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                                errors={errors}
                                                                                                touched={touched}
                                                                                                label={field.fieldLabel}
                                                                                                name={field.fieldName}
                                                                                                type={field.type}
                                                                                                setFieldValue={(name, value) => {
                                                                                                    handleValuesChange({ [name]: value })
                                                                                                    setFieldValue(name, value)
                                                                                                }}
                                                                                                required={field.required}
                                                                                                fullWidth
                                                                                                isTooltip={field.isTooltip}
                                                                                                tooltipMessage={field.tooltipMessage}
                                                                                                onChange={(e, val) => {
                                                                                                    setNewSubMarketSegmentId(null);
                                                                                                    setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                                    handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })
                                                                                                }}
                                                                                                size="small"
                                                                                                values={
                                                                                                    newSubMarketSegmentId
                                                                                                        ? initializeSubMarketSegmentDropdown(
                                                                                                            values,
                                                                                                            subMarketSegmentDataSource
                                                                                                        )
                                                                                                        : values
                                                                                                }
                                                                                                options={subMarketSegmentDataSource}
                                                                                                doNotShowInfoTooltip={true}
                                                                                            />
                                                                                        </Grid>
                                                                                        {
                                                                                            permissions.marketSegment.isCreate && (
                                                                                                <Grid item xs={1} sm={1} md={1}>
                                                                                                    <Tooltip
                                                                                                        title="Add Sub Market Segment"
                                                                                                        className="mt-1"
                                                                                                    >
                                                                                                        <IconButton
                                                                                                            onClick={() => {
                                                                                                                setShowAddMarketSegmentDialog(true);
                                                                                                            }}
                                                                                                            disabled={(Boolean(budgetId) && field.disableOnEdit)}
                                                                                                            size="small"
                                                                                                        >
                                                                                                            <AddIcon color={(Boolean(budgetId) && field.disableOnEdit) ? "disabled" : "primary"} />
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
                                                                                </Grid> : field.fieldName === "salesRep" ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                                                    <Grid container spacing={1}>
                                                                                        <Grid
                                                                                            item
                                                                                            xs={11}
                                                                                            sm={11}
                                                                                            md={11}
                                                                                        >
                                                                                            <FormTypes
                                                                                                fields={entityData.fields}
                                                                                                fieldData={field}
                                                                                                errors={errors}
                                                                                                touched={touched}
                                                                                                label={field.fieldLabel}
                                                                                                name={field.fieldName}
                                                                                                type={field.type}
                                                                                                // setFieldValue={(name, value) => {
                                                                                                //     handleValuesChange({[name]: value })
                                                                                                // setFieldValue(name, value)
                                                                                                //             }}
                                                                                                required={field.required}
                                                                                                fullWidth
                                                                                                isTooltip={field.isTooltip}
                                                                                                tooltipMessage={field.tooltipMessage}
                                                                                                onChange={(e, val) => {
                                                                                                    setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                                    handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })
                                                                                                }}
                                                                                                size="small"
                                                                                                values={values}
                                                                                                options={salesRepDataSource}
                                                                                                doNotShowInfoTooltip={true}
                                                                                                onOpen={() => { onSalesRepDropdownOpen(values["entity"]) }}
                                                                                            />
                                                                                        </Grid>
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
                                                                                        setFieldValue={(name, value) => {
                                                                                            handleValuesChange({ [name]: value })
                                                                                            setFieldValue(name, value)
                                                                                        }}
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
                                                            setFieldValue={(name, value) => {
                                                                handleValuesChange({ [name]: value })
                                                                setFieldValue(name, value)
                                                            }}
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
                                        onClick={() => {
                                            if (isFieldNotTouched(entityData, values)) onClose()
                                            else setShowConfirmDialog(true)
                                        }}
                                    >
                                        Cancel
                                    </Button>

                                    <CustomButton
                                        loading={loading}
                                        variant="contained"
                                        color="primary"
                                        disabled={
                                            loading ||
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
                )}
            </Dialog>

            {
                showAddProductCategoryDialog && <CreateProductCategory
                    productCategoryId={null}
                    onClose={() => setShowAddProductCategoryDialog(false)}
                    onSuccess={(data) => {
                        if (data?._id) {
                            setProductCategoryDataSource((prevState) => {
                                return [
                                    ...prevState,
                                    {
                                        optionValue: data._id,
                                        optionLabel: data.name,
                                        order: productCategoryDataSource.length,
                                        default: false
                                    },
                                ];
                            });
                            setNewProductCategoryId(data._id);
                        }
                        setShowAddProductCategoryDialog(false);
                    }}
                />
            }
            {
                showAddMarketSegmentDialog && <ManageMarketSegmentDialog
                    marketSegmentId={null}
                    onClose={() => {
                        setShowAddMarketSegmentDialog(false);
                    }}
                    onSuccess={(data) => {
                        if (data?._id) {
                            setMainMarketSegmentDataSource((prevState) => {
                                return [
                                    ...prevState,
                                    {
                                        optionValue: data._id,
                                        optionLabel: data.name,
                                        order: mainMarketSegmentDataSource.length,
                                        default: false,
                                        parentMarketSegment: data.parentMarketSegment
                                    }
                                ];
                            });

                            //  If no parent selected, consider that as parent and add it in Market Segment
                            if (data.parentMarketSegment === "") {
                                setMarketSegmentDataSource((prevState) => {
                                    return [
                                        ...prevState,
                                        {
                                            optionValue: data._id,
                                            optionLabel: data.name,
                                            order: marketSegmentDataSource.length,
                                            default: false,
                                            parentMarketSegment: data.parentMarketSegment
                                        }
                                    ];
                                });
                                setSubMarketSegmentDataSource([]);
                                setNewMarketSegmentId(data._id);
                                setNewSubMarketSegmentId(null);
                            } else {
                                //  If parent selected, consider that as a child
                                if (marketSegmentDataSource.some(d => d?.optionValue === data.parentMarketSegment)) {
                                    setSubMarketSegmentDataSource([
                                        ...mainMarketSegmentDataSource.filter(s => s.parentMarketSegment === data.parentMarketSegment),
                                        {
                                            optionValue: data._id,
                                            optionLabel: data.name,
                                            order: subMarketSegmentDataSource.length,
                                            default: false,
                                            parentMarketSegment: data.parentMarketSegment
                                        }]
                                    );
                                } else {

                                    let initializeMarketSegmentDataSource = [];
                                    mainMarketSegmentDataSource.forEach(option => {
                                        if (option.parentMarketSegment === "" || mainMarketSegmentDataSource.some(s => s.parentMarketSegment === option.optionValue)) {
                                            initializeMarketSegmentDataSource.push(option);
                                        }
                                    })

                                    if (!initializeMarketSegmentDataSource.some(s => s.optionValue === data.parentMarketSegment)) {
                                        const getMarketSegment = mainMarketSegmentDataSource.find(d => d?.optionValue === data.parentMarketSegment);

                                        initializeMarketSegmentDataSource.push({
                                            optionValue: getMarketSegment.optionValue,
                                            optionLabel: getMarketSegment.optionLabel,
                                            order: initializeMarketSegmentDataSource.length,
                                            default: false,
                                            parentMarketSegment: getMarketSegment.parentMarketSegment
                                        })
                                    }
                                    setMarketSegmentDataSource(initializeMarketSegmentDataSource);

                                    setSubMarketSegmentDataSource([
                                        ...mainMarketSegmentDataSource.filter(s => s.parentMarketSegment === data.parentMarketSegment),
                                        {
                                            optionValue: data._id,
                                            optionLabel: data.name,
                                            order: subMarketSegmentDataSource.length,
                                            default: false,
                                            parentMarketSegment: data.parentMarketSegment
                                        }]
                                    );
                                }
                                setNewMarketSegmentId(data.parentMarketSegment);
                                setNewSubMarketSegmentId(data._id);
                            }
                        }
                        setShowAddMarketSegmentDialog(false);
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
