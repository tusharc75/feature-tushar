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
import _ from 'lodash';
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

var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const BulkEditDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productDataList, handleClose, handleSaveProduct, stage, loading } = props;
    const [productFields, setProductFields] = useState([]);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)

    const [isAddField, setIsAddField] = useState(false);
    const [fields, setFields] = useState([]);
    const [sectionName, setSectionName] = useState("");
    const ref = useRef(null);

    const [isShowProductTemplate, setIsShowProductTemplate] = useState(false);
    const [fieldChanges, setFieldChanges] = useState([]);


    useEffect(() => {

        const productData = productDataList[0]

        let _fields = [];
        productData.fields.forEach((_f) => {
            if (stage === "product") {
                if (_f.fieldName === "qty") {
                    _fields.push(_f)
                }
            }
            else {
                if (_f.leval === "template" || _f.fieldName === "qty") {
                    _fields.push(_f)
                }
            }
        })

        if (productData.fieldChanges) {
            setFieldChanges(productData.fieldChanges)
        }
        _fields = _.orderBy(_fields, 'order', 'asc');
        _fields = _.sortBy(_fields, function (item) {
            return levalOrderBy.indexOf(item.leval)
        });

        setFields(_fields.filter((_f) => _f.leval === "builder-custom"))

        let values = { ...productData }
        delete values.fields

        setInitialData({
            fields: _fields,
            values: { ...getObjKeysWithValues(values, _fields) },
        });
        EvaluteproductFields(_fields)
    }, []);

    const handleSubmit = (values) => {
        let products = [...productDataList];
        products.forEach((_product: any) => {
            _product = Object.assign(_product, values);
            _product.productCategory = _product.productCategory.optionValue
            _product.productTemplate = _product.productTemplate && _product.productTemplate.optionValue && _product.productTemplate.optionValue
            _product.fields = fields;
            _product.fieldChanges = fieldChanges;
            delete _product.srno
        })
        handleSaveProduct(products)
    };

    const EvaluteproductFields = (fields) => {
        const sections = _.uniq(_.map(fields, 'sectionName'));
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
        field.leval = "builder-custom";
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

    const addDisplayType = (displayType, field, displayValue) => {
        let _fieldChanges = fieldChanges;
        if (_fieldChanges.filter((_f) => _f.fieldName === field.fieldName).length === 0) {
            if (displayType === "currency") {
                _fieldChanges.push({ fieldName: field.fieldName, displayCurrency: field.displayCurrency })
            }
            else if (displayType === "converter") {
                _fieldChanges.push({ fieldName: field.fieldName, displayUnits: field.displayUnits })
            }
        }
        else {
            _fieldChanges.forEach(_f => {
                if (_f.fieldName === field.fieldName) {
                    if (displayType === "currency") {
                        _f.displayCurrency = field.displayCurrency;
                    }
                    else if (displayType === "converter") {
                        _f.displayUnits = field.displayUnits;
                    }
                }
            })
        }
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
                                                        field.fieldName === "productTemplate" && !isShowProductTemplate ?
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
                                                                /> :
                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
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
                                                                        disabled={['unit', 'productCategory', 'productTemplate'].includes(field.fieldName) ? true : false}
                                                                        imageOrFileUploadCompletePercentage={["imageUpload", "fileUpload"].some(s => s === field.type) ? (completePercentage) => {
                                                                            setUploadingImageOrFileProgress(completePercentage);
                                                                        } : null}
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
        {isAddField && <AddField fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={initialData.fields} />}
    </Dialog>
    );
}

export default BulkEditDialog;
