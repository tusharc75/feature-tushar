import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import FormTypes from "../Helpers/FormTypes";
import axiosInstance from '../../axios/axiosInstance'
import { sortBy, orderBy, uniq, map } from 'lodash';
import { getObjKeys, getObjKeysWithValues, simplifyValues, yupSchema } from '../../constants/helpers';
import CustomButton from '../Helpers/CustomButton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import IconButton from '@material-ui/core/IconButton';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { AddField } from '../FormBuilder/AddField';
import TextField from '@material-ui/core/TextField';
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import Tooltip from '@material-ui/core/Tooltip';
import { autoCalculateSpecificFields } from "../../constants/formulaUtility";

var levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];

const BulkEditDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productDataList, handleClose, handleSaveProduct, stage, loading } = props;
    const [productFields, setProductFields] = useState([]);
    const [initialData, setInitialData] = useState({ fields: [], values: { } });
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)

    const [isAddField, setIsAddField] = useState(false);
    const [fields, setFields] = useState([]);
    const [sectionName, setSectionName] = useState("");
    const ref = useRef(null);

    const [isShowProductTemplate, setIsShowProductTemplate] = useState(false);
    const [fieldChanges, setFieldChanges] = useState([]);


    useEffect(() => {

        const productData = productDataList[0]

        var _fields = [];
        productData.fields.forEach((_f) => {
            _f.required = false
            if (stage === "product") {
                if (_f.fieldName === "qty" || (_f.leval === "product-template" || _f.leval === "product-builder-custom")) {
                    _fields.push({ ..._f })
                }
            }
            else {
                if (_f.fieldName === "qty" || _f.leval === "product-template" || _f.leval === "price-template" || _f.leval === "product-builder-custom" || _f.leval === "price-builder-custom") {
                    _fields.push({ ..._f })
                }
            }
        })

        if (productData.fieldChanges) {
            setFieldChanges(productData.fieldChanges)
        }
        _fields = orderBy(_fields, 'order', 'asc');
        _fields = sortBy(_fields, function (item) {
            return levalOrderBy.indexOf(item.leval)
        });

        setFields(_fields.filter((_f) => _f.leval === "product-builder-custom" || _f.leval === "price-builder-custom"))
        let values = { ...productData }
        delete values.fields
        // setInitialData({
        //     fields: _fields,
        //     values: { ...getObjKeysWithValues(values, _fields) },
        // });
        _fields.forEach((_f) => {
            _f.isFormula = false
            _f.isMulitFormula = false
        })
        setInitialData({
            fields: _fields,
            values: { ...getObjKeys("", _fields) },
        });
        EvaluteproductFields(_fields)
    }, []);

    const handleSubmit = (values) => {
        for (const x in values) {
            if (values[x] === 0 || values[x] === "0" || values[x] === "") {
                delete values[x]
            }
        }
        const products = []
        productDataList.forEach(element => {
            const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, element.fields)
            products.push({ ...element, ...calValues })
        });
        products.forEach(element => {
            for (const [key, value] of Object.entries(element)) {
                if (typeof value === 'object' && value && value["optionValue"]) {
                    element[key] = value["optionValue"]
                }
                if (Array.isArray(value) && value.length && value[0].optionValue) {
                    const entity = []
                    value && value.forEach((ele) => {
                        entity.push(ele.optionValue)
                    })
                    element[key] = entity
                }
            }
            element.fields = fields;
            element.fieldChanges = fieldChanges;
            delete element.srno
        });
        handleSaveProduct(products)
    };

    const EvaluteproductFields = (fields) => {
        const sections = uniq(map(fields, 'sectionName'));
        const customData = sections.map((name) => {
            let sectionFields = fields.filter((field) => field.sectionName === name);
            return { name, sectionFields };
        });
        setProductFields(customData)
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
        field.leval = "price-builder-custom";
        if (initialData.fields.filter((_f) => _f.sectionName === sectionName).length) {
            if (initialData.fields.filter((_f) => _f.sectionName === sectionName)[0].leval !== "price-template") {
                field.leval = "product-builder-custom";
            }
        }
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

    const handleRemoveField = (field) => {
        let newField = initialData.fields.filter((_f) => _f._id !== field._id);
        setInitialData({
            fields: newField,
            values: { ...getObjKeys('', newField), ...ref.current.values },
        });
        setFields(fields.filter((_f) => _f._id !== field._id))
        EvaluteproductFields(newField)
    }

    const addDisplayType = (displayType, field, displayValue) => {
        let _fieldChanges = fieldChanges;
        if (_fieldChanges.filter((_f) => _f.fieldName === field.fieldName).length === 0) {
            if (displayType === "currency") {
                _fieldChanges.push({ fieldName: field.fieldName, displayCurrency: [displayValue] })
            }
            else if (displayType === "converter") {
                _fieldChanges.push({ fieldName: field.fieldName, displayUnits: [displayValue] })
            }
        }
        else {
            _fieldChanges.forEach(_f => {
                if (_f.fieldName === field.fieldName) {
                    if (displayType === "currency") {
                        if (_f.displayCurrency) {
                            _f.displayCurrency.push(displayValue);
                        }
                        else {
                            _f.displayCurrency = [displayValue];
                        }
                    }
                    else if (displayType === "converter") {
                        if (_f.displayUnits) {
                            _f.displayUnits.push(displayValue);
                        }
                        else {
                            _f.displayUnits = [displayValue];
                        }
                    }
                }
            })
        }
        let newField = initialData.fields
        newField.forEach((_e) => {
            if (_e.fieldName === field.fieldName) {
                _e.fieldChanges = _fieldChanges.filter((_f) => _f.fieldName === field.fieldName)[0]
            }
        })
        setInitialData({
            fields: newField,
            values: { ...getObjKeys('', newField), ...ref.current.values },
        });
        EvaluteproductFields(newField)
        setFieldChanges(_fieldChanges)
    }

    const removeDisplayType = (displayType, field, displayValue) => {
        let _fieldChanges = fieldChanges;
        _fieldChanges.forEach(_f => {
            if (_f.fieldName === field.fieldName) {
                if (displayType === "currency") {
                    _f.displayCurrency = _f.displayCurrency.filter(e => e !== displayValue)
                }
                else if (displayType === "converter") {
                    _f.displayUnits = _f.displayUnits.filter(e => e !== displayValue)
                }
            }
        })
        let newField = initialData.fields
        newField.forEach((_e) => {
            if (_e.fieldName === field.fieldName) {
                _e.fieldChanges = _fieldChanges.filter((_f) => _f.fieldName === field.fieldName)[0]
            }
        })
        setInitialData({
            fields: newField,
            values: { ...getObjKeys('', newField), ...ref.current.values },
        });
        EvaluteproductFields(newField)
        setFieldChanges(_fieldChanges)
    }

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
                        <CustomDialogHeader title={`Bulk Edit`} onClose={handleClose}></CustomDialogHeader>
                        <CustomDialogContent>
                            <Box>
                                <Form autoComplete="off" autoCorrect="off" noValidate >
                                    {productFields && productFields.map((section, i) => (
                                        <div key={i}>
                                            <h2 className="form-label-style">{section.name}
                                                <span style={{ float: "right", marginTop: "-10px" }}>
                                                    <IconButton color="primary" size="small" onClick={() => handleOpenAddField(section.name)} >
                                                        <ControlPointIcon />
                                                    </IconButton>
                                                </span>
                                            </h2>
                                            <Box marginY={2}>
                                                <Grid spacing={3} container>
                                                    {section.sectionFields && section.sectionFields.map((field) => (
                                                        field.fieldName === "priceTemplate" && !isShowProductTemplate ?
                                                            <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={isShowProductTemplate}
                                                                            onChange={() => setIsShowProductTemplate(true)}
                                                                            name="isShowProductTemplate"
                                                                            color="primary"
                                                                        />
                                                                    }
                                                                    label="Show Product Template"
                                                                />
                                                            </Grid> : field.type === "converter" || field.type === "currencyAmount" ?
                                                                <FormTypes
                                                                    fields={initialData.fields}
                                                                    fieldData={field}
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
                                                                    doNotShowInfoTooltip={true}
                                                                    decimalPlaces={field.decimalPlaces}
                                                                    isvlookupReverse={field.isvlookupReverse}
                                                                    size="small"
                                                                    addDisplayType={addDisplayType}
                                                                    removeDisplayType={removeDisplayType}
                                                                /> :
                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                    <Box display="flex" >
                                                                        <Box flexGrow={1}  >
                                                                            <FormTypes
                                                                                fields={initialData.fields}
                                                                                fieldData={field}
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
                                                                                size="small"
                                                                                disabled={['productCategory', 'priceTemplate'].includes(field.fieldName) ? true : false}
                                                                                imageOrFileUploadCompletePercentage={["imageUpload", "fileUpload"].some(s => s === field.type) ? (completePercentage) => {
                                                                                    setUploadingImageOrFileProgress(completePercentage);
                                                                                } : null}
                                                                            />
                                                                        </Box>
                                                                        {(field.leval === "product-builder-custom" || field.leval === "price-builder-custom") &&
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
                                disabled={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                            > Save</CustomButton>
                        </CustomDialogFooter>
                    </Fragment>
                )}
            </Formik> :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>}
        {isAddField && <AddField refrence="formAdd" fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={initialData.fields} />}
    </Dialog>
    );
}

export default BulkEditDialog;
