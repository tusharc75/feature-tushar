import { useRef, useState, useEffect, Fragment, useContext } from "react";
import { useHistory } from "react-router-dom";
import { Box, Tooltip, Grid, Button, InputAdornment, Collapse } from '@material-ui/core';
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import FormTypes from "../Helpers/FormTypes";
import axiosInstance from '../../axios/axiosInstance'
import { uniq, map, orderBy, isEqual } from 'lodash';
import { getObjKeys, getUniqueCurrencies, yupSchema } from '../../constants/helpers';
import CustomButton from '../Helpers/CustomButton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import IconButton from '@material-ui/core/IconButton';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { AddField } from '../FormBuilder/AddField';
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import CreateProductCategory from "../../pages/ProductCategory/CreateProductCategory";
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { autoCalculateSpecificFields, handleAutoCalculation } from "../../constants/formulaUtility";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';

const ignoreField = ["priceTemplate"]

const CreateProduct = (props) => {

    const { state: { permissions, user, selectedEntity } }: any = useData();
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext)
    const { productId, handleClose, isClone, isAddInBuilder, addProductInBuilder, openFrom, isRedirectToDetailPage, fromQuote } = props;
    const [masterFields, setMasterFields] = useState([]);
    const [productFields, setProductFields] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });

    const [isAddField, setIsAddField] = useState(false);
    const [fields, setFields] = useState([]);
    const [sectionName, setSectionName] = useState("");
    const ref = useRef(null);
    const [productTemplate, setProductTemplate] = useState([]);
    const [priceTemplate, setPriceTemplate] = useState([]);

    const [showAddProductCategoryDialog, setShowAddProductCategoryDialog] = useState(false);
    const [productCategoryDataSource, setProductCategoryDataSource] = useState([]);
    const [newProductCategoryId, setNewProductCategoryId] = useState(null);
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [isProductTemplate, setIsProductTemplate] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const [expanded, setExpanded] = useState({});


    useEffect(() => {
        var _isProductTemplate = false;
        axiosInstance().get(`/field?resource=Product`).then(({ data: { data } }) => {
            const _productField: any = []
            const filteredData = data.filter((obj) => obj.isCreate);
            filteredData.forEach((_f) => {
                if (openFrom === "builder") {
                    _productField.push(_f.fieldData)
                }
                else {
                    if (!ignoreField.includes(_f.fieldData.fieldName)) {
                        _productField.push(_f.fieldData)
                    }
                }
                if (_f.fieldData.fieldName === "productTemplate") {
                    setIsProductTemplate(true);
                    _isProductTemplate = true;
                }
            })
            //setMasterFields(data.map((_f) => _f.fieldData))
            setMasterFields(_productField)
            const _fields = [];
            _productField.map((_f) => _fields.push(_f));
            if (productId) {
                const newField = _fields;
                axiosInstance().get(`/product/` + productId).then(({ data: { data } }) => {
                    data.fields?.map((_f) => newField.push(_f));
                    data.productData.fields?.map((_f) => newField.push(_f));
                    setFields(data.productData.fields)
                    if (isClone) {
                        data.productData.productName = ""
                    }
                    newField.map((_f) => {
                        if (_f.fieldName === "currency") {
                            setCurrencySymbol(
                                getUniqueCurrencies().find(
                                    (d) => d.currencyCode === data.productData["currency"]
                                )?.symbolNative
                            );
                        }
                    });
                    setInitialData({
                        fields: newField,
                        values: data.productData
                    });
                    EvaluteproductFields(newField)
                    if (_isProductTemplate) {
                        handleChangeCategory(data.productData.productCategory, "", false, null)
                    }
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                let values = getObjKeys('', _fields)
                _fields.some((_f) => {
                    if (_f.fieldName == "currency") {
                        setCurrencySymbol(
                            getUniqueCurrencies().find(
                                (d) => d.currencyCode === user?.user?.currency
                            )?.symbolNative
                        );
                        values["currency"] = user?.user?.currency
                        return true
                    }
                })
                if (selectedEntity && fromQuote) {
                    values["entity"] = [selectedEntity]
                }
                setInitialData({
                    fields: _fields,
                    values: values,
                });
                EvaluteproductFields(_fields)
            }
            if (_fields.length > 0) {
                const productCategoryDropdownData = _fields.find(
                    (d) => d.fieldName === "productCategory"
                );
                if (productCategoryDropdownData) {
                    if (!productId) {
                        setProductCategoryDataSource(productCategoryDropdownData.option);
                    } else {
                        let currentContactRemovedDataSource =
                            productCategoryDropdownData.option.filter(
                                (d) => d?.optionValue !== newProductCategoryId
                            );
                        setProductCategoryDataSource(currentContactRemovedDataSource);
                    }
                }
            }
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }, []);

    const handleSubmit = (values) => {
        setSubmitting(true);
        values.fields = fields;
        if (productId && !isClone) {
            values._id = productId;
            axiosInstance().put(`/product`, values).then(({ data: { data } }) => {
                setSubmitting(false);
                handleClose();
            }).catch((error) => {
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            delete values._id
            delete values.brand
            axiosInstance().post(`/product`, values).then(({ data: { data } }) => {
                const productId = data._id;
                setSubmitting(false);
                handleClose();
                if (isAddInBuilder) {
                    delete data.brand
                    delete data.createdBy
                    delete data.updatedBy
                    delete data.fields
                    data.productId = data._id
                    delete data._id
                    data.isEditable = true
                    addProductInBuilder([data])
                }
                if (isRedirectToDetailPage) {
                    history.push(`/product/detail/${productId}`)
                }
            }).catch((error) => {
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

    const EvaluteproductFields = (fields) => {
        const sections = uniq(map(fields, 'sectionName'));
        const customData = sections.map((name) => {
            let sectionFields = fields.filter((field) => field.sectionName === name);
            sectionFields = orderBy(sectionFields, 'order', 'asc');
            return { name, sectionFields };
        });
        setProductFields(customData)
        const _expanded = {}
        customData.forEach((ele: any, index) => {
            _expanded[index] = true;
        })
        setExpanded(_expanded)
    }

    const handleChangeCategory = (value, label, isChange, entity) => {
        if (value && value !== "") {
            if (!entity) {
                entity = ref.current.values.entity;
            }
            axiosInstance().post(`/product-template/template/` + value, { entity: entity }).then(({ data: { data } }) => {
                setProductTemplate(data.data)
                if (isChange) {
                    let defaultproductTemplate = ""
                    if (data.data.length === 1) {
                        defaultproductTemplate = data.data[0].optionValue
                        data.data.forEach((_f) => {
                            let re = new RegExp(_f.optionLabel);
                            if (label.match(re)) {
                                defaultproductTemplate = _f.optionValue
                                return
                            }
                        })
                    }
                    if (defaultproductTemplate !== "") {
                        axiosInstance().get(`/product-template/fields/` + defaultproductTemplate).then(({ data: { data } }) => {
                            let newField = [...masterFields, ...fields];
                            data.fields.forEach(_f => {
                                newField.push(_f)
                            })
                            axiosInstance().get(`/price-template/product-template/` + defaultproductTemplate).then(({ data: { data } }) => {
                                setPriceTemplate(data.data)
                                let defaultpriceTemplate = ""
                                if (data.data.length) {
                                    defaultpriceTemplate = data?.data[0]?.optionValue;
                                }
                                setInitialData({
                                    fields: newField,
                                    values: {
                                        ...getObjKeys('', newField), ...ref?.current?.values,
                                        productTemplate: defaultproductTemplate, priceTemplate: defaultpriceTemplate
                                    },
                                });
                                EvaluteproductFields(newField)
                            });
                        });
                    }
                    else {
                        setPriceTemplate([])
                        let newField = [...masterFields, ...fields];
                        setInitialData({
                            fields: newField,
                            values: { ...getObjKeys('', newField), ...ref?.current?.values, productTemplate: "", priceTemplate: "" },
                        });
                        EvaluteproductFields(newField)
                    }
                }
            });
        }
    }

    const handleChangeProductTemplate = (value) => {
        if (value && value !== "") {
            const result = productTemplate.filter((_f) => _f.optionValue === value)
            if (result.length) {
                axiosInstance().get(`/product-template/fields/` + result[0].optionValue).then(({ data: { data } }) => {
                    let newField = [...masterFields, ...fields];
                    data.fields.forEach(_f => {
                        newField.push(_f)
                    })
                    axiosInstance().get(`/price-template/product-template/` + value).then(({ data: { data } }) => {
                        setPriceTemplate(data.data)
                        let defaultpriceTemplate = ""
                        if (data.data.length) {
                            defaultpriceTemplate = data.data[0].optionValue;
                        }
                        setInitialData({
                            fields: newField,
                            values: { ...getObjKeys('', newField), ...ref.current.values, productTemplate: result[0].optionValue, priceTemplate: defaultpriceTemplate },
                        });
                        EvaluteproductFields(newField)
                    });
                });
            }
        }
    }

    const handleOpenAddField = (event, name) => {
        event.stopPropagation()
        setSectionName(name)
        setIsAddField(true)
    }

    const handleCloseAddField = () => {
        setSectionName("")
        setIsAddField(false)
    }

    const handleAddField = (field) => {
        field.sectionName = sectionName;
        field.leval = "product-custom";
        fields.push(field)
        setFields(fields)
        let newField = initialData.fields;
        newField.push(field)
        var extraCalculatedValue: any = {}
        if (field.type === "formula" || field.isFormula) {
            var inputValues = {};
            field.inputFields && field.inputFields.forEach((_f) => {
                inputValues[_f] = ref.current.values[_f] ? ref.current.values[_f] : 0
            })
            extraCalculatedValue = autoCalculateSpecificFields(inputValues, ref.current.values, newField)
        }
        setInitialData({
            fields: newField,
            values: { ...getObjKeys('', newField), ...ref.current.values, ...extraCalculatedValue },
        });
        EvaluteproductFields(newField)
        setSectionName("")
        setIsAddField(false)
    }

    const handleRemoveField = (field) => {
        let newField = initialData.fields.filter((_f) => _f._id !== field._id);
        setInitialData({
            fields: newField,
            values: { ...getObjKeys('', newField), ...ref.current.values },
        });
        setFields(fields.filter((_f) => _f._id !== field._id))
        EvaluteproductFields(newField)
    }

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

    const getEntityOptions = (options: any[]) => {
        if (selectedEntity && fromQuote) {
            return options?.filter(option => option.optionValue === selectedEntity)
        } else {
            return options
        }
    }

    const handleExpand = (index) => {
        const temp = { ...expanded };
        temp[index] = !temp[index]
        setExpanded(temp)
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
        {initialData && initialData.fields.length ?
            <Formik
                innerRef={ref}
                enableReinitialize={true}
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
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
                            title={`${(productId && !isClone) ? "Edit" : "New"} Product`}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                            onClose={() => {
                                if (!isEqual(ref.current.values, initialData.values)) {
                                    setShowConfirmDialog(true)
                                }
                                else {
                                    handleClose()
                                }
                            }} />
                        <CustomDialogContent>
                            <Box>
                                <Form autoComplete="off" autoCorrect="off" noValidate >
                                    <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                    {productFields && productFields.map((section, i) => (
                                        <div key={i}>
                                            <h2 className="form-label-style" onClick={() => handleExpand(i)}>
                                                <IconButton className="p-0" color="primary" style={{ marginTop: "-5px" }} size="small"  >
                                                    {expanded[i] ? <ExpandLess fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                </IconButton>
                                                {section.name}
                                                <IconButton style={{ float: "right", marginTop: "-10px" }} color="primary" size="small" onClick={(e) => handleOpenAddField(e, section.name)} >
                                                    <ControlPointIcon />
                                                </IconButton>
                                            </h2>
                                            <Box marginY={2}>
                                                <Collapse in={expanded[i]} timeout="auto" unmountOnExit>
                                                    <Grid spacing={3} container>
                                                        {section.sectionFields && section.sectionFields.map((field) => (
                                                            field.fieldName === "productCategory" ?
                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                    <Grid container spacing={1}>
                                                                        <Grid
                                                                            item
                                                                            xs={permissions.productCategory.isCreate ? 10 : 11}
                                                                            sm={permissions.productCategory.isCreate ? 10 : 11}
                                                                            md={permissions.productCategory.isCreate ? 10 : 11}
                                                                        >
                                                                            <FormTypes
                                                                                isNew={Boolean(productId)}
                                                                                disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                                fields={initialData.fields}
                                                                                fieldData={field}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                setFieldValue={(name, value) => {
                                                                                    setFieldValue(name, value)
                                                                                }}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={field.isTooltip}
                                                                                tooltipMessage={field.tooltipMessage}
                                                                                disableClearable
                                                                                onChange={(e, val) => {
                                                                                    setNewProductCategoryId(null);
                                                                                    const result = handleAutoCalculation(field, initialData.fields, values,
                                                                                        field.fieldName, '', '', val && val.optionValue ? val.optionValue : "");
                                                                                    if (Object.keys(result).length >= 1) {
                                                                                        for (var x in result) {
                                                                                            setFieldValue(x, result[x]);
                                                                                        }
                                                                                    }
                                                                                    if (isProductTemplate) {
                                                                                        handleChangeCategory(val && val.optionValue ? val.optionValue : "",
                                                                                            val && val.optionLabel ? val.optionLabel : "", true, null)
                                                                                    }
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
                                                                                            disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                                            size="small"
                                                                                        >
                                                                                            <AddIcon color={(Boolean(productId) && field.disableOnEdit) ? "disabled" : "primary"} />
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
                                                                </Grid> :
                                                                field.fieldName === "currency" ? (
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                        <FormTypes
                                                                            isNew={Boolean(productId)}
                                                                            disabled={(Boolean(productId) && field.disableOnEdit)}
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
                                                                    </Grid>
                                                                ) : field.fieldName === "mrp" ? (
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                        <FormTypes
                                                                            isNew={Boolean(productId)}
                                                                            disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                            // {...rest}
                                                                            selectedCurrencyCode={values["currency"]}
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
                                                                            setFieldValue={(name, value) => {
                                                                                setFieldValue(name, value)
                                                                            }}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                        />
                                                                    </Grid>
                                                                ) : field.fieldName === "entity" ?
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                        <FormTypes
                                                                            isNew={Boolean(productId)}
                                                                            disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                            {...field}
                                                                            multiple
                                                                            values={values}
                                                                            errors={errors}
                                                                            touched={touched}
                                                                            label={field.fieldLabel}
                                                                            name={field.fieldName}
                                                                            type={field.type}
                                                                            options={getEntityOptions(field.option)}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            onChange={(e, value) => {
                                                                                setFieldValue(
                                                                                    field.fieldName,
                                                                                    value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []
                                                                                );
                                                                                if (isProductTemplate) {
                                                                                    handleChangeCategory(values.productCategory, "", true,
                                                                                        value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : [])
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                    : field.fieldName === "productTemplate" ?
                                                                        <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                            <FormTypes
                                                                                isNew={Boolean(productId)}
                                                                                disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                                fields={initialData.fields}
                                                                                fieldData={field}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={productTemplate}
                                                                                setFieldValue={(name, value) => {
                                                                                    setFieldValue(name, value)
                                                                                }}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={field.isTooltip}
                                                                                tooltipMessage={field.tooltipMessage}
                                                                                disableClearable
                                                                                onChange={(e, val) => {
                                                                                    setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                    handleChangeProductTemplate(val && val.optionValue ? val.optionValue : "")
                                                                                }}
                                                                                size="small"
                                                                            />
                                                                        </Grid>
                                                                        : field.fieldName === "priceTemplate" ?
                                                                            <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                                <FormTypes
                                                                                    isNew={Boolean(productId)}
                                                                                    disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                                    fields={initialData.fields}
                                                                                    fieldData={field}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={priceTemplate}
                                                                                    setFieldValue={(name, value) => {
                                                                                        setFieldValue(name, value)
                                                                                    }}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field.isTooltip}
                                                                                    tooltipMessage={field.tooltipMessage}
                                                                                    disableClearable
                                                                                    onChange={(e, val) => {
                                                                                        setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                    }}
                                                                                    size="small"
                                                                                />
                                                                            </Grid> :
                                                                            (field.type === "converter" || field.type === "currencyAmount" || field.isConverter) ?
                                                                                <FormTypes
                                                                                    isNew={Boolean(productId)}
                                                                                    disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                                    fields={initialData.fields}
                                                                                    fieldData={field}
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
                                                                                    isTooltip={field.isTooltip}
                                                                                    tooltipMessage={field.tooltipMessage}
                                                                                    size="small"
                                                                                    handleRemoveField={handleRemoveField}
                                                                                /> :
                                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                                    <Box display="flex" >
                                                                                        <Box flexGrow={1}  >
                                                                                            <FormTypes
                                                                                                isNew={Boolean(productId)}
                                                                                                disabled={(Boolean(productId) && field.disableOnEdit)}
                                                                                                {...field}
                                                                                                productTemplateId={values?.productTemplate}
                                                                                                priceTemplateId={values?.priceTemplate}
                                                                                                fields={initialData.fields}
                                                                                                fieldData={field}
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
                                                                                                isTooltip={field.isTooltip}
                                                                                                tooltipMessage={field.tooltipMessage}
                                                                                                size="small"
                                                                                                imageOrFileUploadCompletePercentage={["imageUpload", "fileUpload"].some(s => s === field.type) ? (completePercentage) => {
                                                                                                    setUploadingImageOrFileProgress(completePercentage);
                                                                                                } : null}
                                                                                            />
                                                                                        </Box>
                                                                                        {field.leval === "product-custom" &&
                                                                                            <Box>
                                                                                                <Tooltip title="Remove" className="mt-1">
                                                                                                    <IconButton onClick={() => handleRemoveField(field)} color="primary" size="small"  >
                                                                                                        <HighlightOffIcon color="error" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            </Box>}
                                                                                    </Box>
                                                                                </Grid>

                                                        ))}
                                                    </Grid>
                                                </Collapse>
                                            </Box>
                                        </div>
                                    ))}
                                </Form>
                            </Box>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button disabled={uploadingImageOrFileProgress > 0 || submitting} size="small" color="primary" onClick={() => {
                                if (!isEqual(ref.current.values, initialData.values)) {
                                    setShowConfirmDialog(true)
                                }
                                else {
                                    handleClose()
                                }
                            }}>Cancel</Button>
                            <CustomButton
                                loading={submitting}
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={uploadingImageOrFileProgress > 0 || submitting}
                                // disabled={Object.values(simplifyValues(initialData.values, initialData.fields)).toString() ===
                                //     Object.values(simplifyValues(values, initialData.fields)).toString()}
                                onClick={submitForm}
                            > Save</CustomButton>
                        </CustomDialogFooter>
                        {
                            showConfirmDialog ?
                                <ConfirmCancelDialog
                                    open={showConfirmDialog}
                                    onSave={() => {
                                        setShowConfirmDialog(false)
                                        submitForm()
                                    }}
                                    onClose={() => {
                                        setShowConfirmDialog(false)
                                        handleClose()
                                    }}
                                /> : null
                        }
                    </Fragment>
                )}
            </Formik> :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
        {isAddField && <AddField refrence="formAdd" fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={initialData.fields} />}

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
                                    default: false,
                                },
                            ];
                        });
                        setNewProductCategoryId(data._id);
                        if (isProductTemplate) {
                            handleChangeCategory(data._id, data.name, true, null)
                        }
                    }
                    setShowAddProductCategoryDialog(false);
                    // fetchProductCategory();
                }}
            />
        }
    </Dialog >
    );
}

export default CreateProduct;
