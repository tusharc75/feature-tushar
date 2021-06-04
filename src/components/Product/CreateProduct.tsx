import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import { Box, Tooltip, Grid, Button } from '@material-ui/core';
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import FormTypes from "../Helpers/FormTypes";
import axiosInstance from '../../axios/axiosInstance'
import _ from 'lodash';
import { getObjKeys, simplifyValues, yupSchema } from '../../constants/helpers';
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


const ignoreField = ["qty"]

const CreateProduct = (props) => {

    const { state: { permissions } }: any = useData();
    const toastConfig = useContext(CustomToastContext)
    const { productId, handleClose, isClone, isAddInBuilder, addProductInBuilder, openFrom } = props;
    const [masterFields, setMasterFields] = useState([]);
    const [productFields, setProductFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });

    const [isAddField, setIsAddField] = useState(false);
    const [fields, setFields] = useState([]);
    const [sectionName, setSectionName] = useState("");
    const ref = useRef(null);
    const [productTemplate, setProductTemplate] = useState([]);
    const [isStandardTemplate, setIsStandardTemplate] = useState(false);

    const [showAddProductCategoryDialog, setShowAddProductCategoryDialog] = useState(false);
    const [productCategoryDataSource, setProductCategoryDataSource] = useState([]);
    const [newProductCategoryId, setNewProductCategoryId] = useState(null);


    useEffect(() => {
        axiosInstance().get(`/field?resource=Product`).then(({ data: { data } }) => {
            const _productField: any = []
            data.forEach((_f) => {
                if (openFrom === "builder") {
                    _productField.push(_f.fieldData)
                }
                else {
                    if (!ignoreField.includes(_f.fieldData.fieldName)) {
                        _productField.push(_f.fieldData)
                    }
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
                    setInitialData({
                        fields: newField,
                        values: data.productData
                    });
                    EvaluteproductFields(newField)
                    handleChangeCategory(data.productData.productCategory, false)
                    setIsStandardTemplate(data.isStandard)
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: _fields,
                    values: getObjKeys('', _fields),
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
                                (d) => d.optionValue !== newProductCategoryId
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
        setLoading(true);
        values.fields = fields;
        if (productId && !isClone) {
            values._id = productId;
            axiosInstance().put(`/product`, values).then(({ data: { data } }) => {
                setLoading(false);
                handleClose()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            delete values._id
            delete values.brand
            axiosInstance().post(`/product`, values).then(({ data: { data } }) => {
                setLoading(false);
                handleClose()
                if (isAddInBuilder) {
                    delete data.brand
                    delete data.createdBy
                    delete data.updatedBy
                    delete data.fields
                    data.productId = data._id
                    delete data._id
                    addProductInBuilder([data])
                }
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

    const EvaluteproductFields = (fields) => {
        const sections = _.uniq(_.map(fields, 'sectionName'));
        const customData = sections.map((name) => {
            let sectionFields = fields.filter((field) => field.sectionName === name);
            sectionFields = _.orderBy(sectionFields, 'order', 'asc');
            return { name, sectionFields };
        });
        setProductFields(customData)
    }

    const handleChangeCategory = (value, isChange) => {
        if (value && value !== "") {
            axiosInstance().get(`/product-template/template/` + value).then(({ data: { data } }) => {
                setProductTemplate(data.data)
                if (isChange) {
                    let defaultproductTemplate = ""
                    if (data.data.length) {
                        defaultproductTemplate = data.data[0].optionValue
                    }
                    setInitialData({
                        fields: initialData.fields,
                        values: { ...ref.current.values, productTemplate: defaultproductTemplate },
                    });
                    if (defaultproductTemplate !== "") {
                        handleChangeTemplate(defaultproductTemplate)
                    }
                }
            });
        }
    }

    const handleChangeTemplate = (value) => {
        if (value && value !== "") {
            axiosInstance().get(`/product-template/fields/` + value).then(({ data: { data } }) => {
                let newField = [...masterFields];
                data.fields.filter((f) => f.sectionType !== "cost").forEach(_f => {
                    newField.push(_f)
                })
                setIsStandardTemplate(data.isStandard)
                setInitialData({
                    fields: newField,
                    values: { ...getObjKeys('', newField), ...ref.current.values, unit: data.unit },
                });
                EvaluteproductFields(newField)
            });
        }
    }

    const handleOpenAddField = (name) => {
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
        setInitialData({
            fields: newField,
            values: { ...getObjKeys('', newField), ...ref.current.values },
        });
        EvaluteproductFields(newField)
        setSectionName("")
        setIsAddField(false)
    }

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

    return (<Dialog
        maxWidth="md"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
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
                        <CustomDialogHeader title={`${(productId && !isClone) ? "Edit" : "New"} Product`} onClose={handleClose}></CustomDialogHeader>
                        <CustomDialogContent>
                            <Box>
                                <Form autoComplete="off" autoCorrect="off" noValidate >
                                    {productFields && productFields.map((section, i) => (
                                        <div key={i}>
                                            <h2 className="form-label-style">{section.name}
                                                <IconButton style={{ float: "right", marginTop: "-10px" }} color="primary" size="small" onClick={() => handleOpenAddField(section.name)} >
                                                    <ControlPointIcon />
                                                </IconButton>
                                            </h2>
                                            <Box marginY={2}>
                                                <Grid spacing={3} container>
                                                    {section.sectionFields && section.sectionFields.map((field) => (
                                                        field.fieldName === "productCategory" ?
                                                            <Grid key={field.fieldName} item xs={12} sm={6} md={6}>

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
                                                                            fields={initialData.fields}
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
                                                                            decimalPlaces={field.decimalPlaces}
                                                                            disableClearable
                                                                            onChange={(e, val) => {
                                                                                setNewProductCategoryId(null);
                                                                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                                handleChangeCategory(val && val.optionValue ? val.optionValue : "", true)
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


                                                                {/* <FormTypes
                                                                    fields={initialData.fields}
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
                                                                    isTooltip={field.isTooltip}
                                                                    tooltipMessage={field.tooltipMessage}
                                                                    decimalPlaces={field.decimalPlaces}
                                                                    disableClearable
                                                                    onChange={(e, val) => {
                                                                        setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                        handleChangeCategory(val && val.optionValue ? val.optionValue : "", true)
                                                                    }}
                                                                    size="small"
                                                                /> */}
                                                            </Grid> :
                                                            field.fieldName === "productTemplate" ?
                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                    <FormTypes
                                                                        fields={initialData.fields}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={productTemplate}
                                                                        setFieldValue={setFieldValue}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field.isTooltip}
                                                                        tooltipMessage={field.tooltipMessage}
                                                                        decimalPlaces={field.decimalPlaces}
                                                                        disableClearable
                                                                        onChange={(e, val) => {
                                                                            setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                                            handleChangeTemplate(val && val.optionValue ? val.optionValue : "")
                                                                        }}
                                                                        size="small"
                                                                    />  </Grid> :
                                                                field.type === "converter" || field.type === "currencyAmount" ?
                                                                    <FormTypes
                                                                        fields={initialData.fields}
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
                                                                        isTooltip={field.isTooltip}
                                                                        tooltipMessage={field.tooltipMessage}
                                                                        decimalPlaces={field.decimalPlaces}
                                                                        isvlookupReverse={field.isvlookupReverse}
                                                                        fieldData={field}
                                                                        size="small"
                                                                    /> :
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                        <FormTypes
                                                                            fields={initialData.fields}
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
                                                                            isTooltip={field.isTooltip}
                                                                            tooltipMessage={field.tooltipMessage}
                                                                            decimalPlaces={field.decimalPlaces}
                                                                            isvlookupReverse={field.isvlookupReverse}
                                                                            fieldData={field}
                                                                            size="small"
                                                                            disabled={field.fieldName === "unit" ? (isStandardTemplate ? false : true) : false}
                                                                        />
                                                                    </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        </div>
                                    ))}
                                </Form>
                            </Box>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button size="small" color="primary" onClick={handleClose}>Cancel</Button>
                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                // disabled={Object.values(simplifyValues(initialData.values, initialData.fields)).toString() ===
                                //     Object.values(simplifyValues(values, initialData.fields)).toString()}
                                onClick={submitForm}
                            > Save</CustomButton>
                        </CustomDialogFooter>
                    </Fragment>
                )}
            </Formik> :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>}
        {isAddField && <AddField fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={initialData.fields} />}

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
                        handleChangeCategory(data._id, true)
                    }
                    setShowAddProductCategoryDialog(false);
                    // fetchProductCategory();

                }}
            />
        }
    </Dialog>
    );
}

export default CreateProduct;
