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
import { getObjKeys, simplifyValues, yupSchema } from '../../constants/helpers';
import CustomButton from '../Helpers/CustomButton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import IconButton from '@material-ui/core/IconButton';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { AddField } from '../FormBuilder/AddField';
import TextField from '@material-ui/core/TextField';
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";

var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const CreateProduct = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productData, handleClose, handleSaveProduct, stage } = props;
    const [masterFields, setMasterFields] = useState([]);
    const [productFields, setProductFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)

    const [isAddField, setIsAddField] = useState(false);
    const [fields, setFields] = useState([]);
    const [sectionName, setSectionName] = useState("");
    const ref = useRef(null);


    useEffect(() => {
        let _fields = [];
        productData.fields.forEach((_f) => {
            if (stage === "product") {
                if (_f.leval === "product" || _f.leval === "product-custom") {
                    _fields.push(_f)
                }
            }
            else {
                _fields.push(_f)
            }
        })

        _fields = _.orderBy(_fields, 'order', 'asc');
        _fields = _.sortBy(_fields, function (item) {
            return levalOrderBy.indexOf(item.leval)
        });

        setMasterFields(_fields.filter((_f) => _f.leval !== "cost"))
        setFields(_fields.filter((_f) => _f.leval === "builder-custom"))

        let values = { ...productData }
        values.productCategory = values.productCategory.optionValue
        values.productTemplate = values.productTemplate && values.productTemplate.optionValue && values.productTemplate.optionValue
        delete values.fields

        setInitialData({
            fields: _fields,
            values: { ...getObjKeys('', _fields), ...values },
        });
        EvaluteproductFields(_fields)
        // axiosInstance().get(`/field?resource=Product Builder`).then(({ data: { data } }) => {
        //     const _fields = [];
        //     productData.fields.map((_f) => _fields.push(_f));
        //     console.log(productData)
        //     let values = { ...productData }
        //     values.productCategory = values.productCategory._id
        //     delete values.fields
        //     data.map((_f) => _fields.push(_f.fieldData));
        //     setMasterFields(_fields)
        //     setInitialData({
        //         fields: _fields,
        //         values: values,
        //     });
        //     EvaluteproductFields(_fields)
        // }).catch((error) => {
        //     toastConfig.setToastConfig(error);
        // });
    }, []);

    const handleSubmit = (values) => {
        values.fields = fields;
        handleSaveProduct(values)
    };

    const EvaluteproductFields = (fields) => {
        const sections = _.uniq(_.map(fields, 'sectionName'));
        const customData = sections.map((name) => {
            let sectionFields = fields.filter((field) => field.sectionName === name);
            return { name, sectionFields };
        });
        setProductFields(customData)
    }

    const handleChangeProductCost = (value) => {
        if (value && value !== "") {
            axiosInstance().get(`/productcost/fields/` + value).then(({ data: { data } }) => {
                let newField = [...masterFields];
                data.forEach(_f => {
                    newField.push(_f)
                })
                setInitialData({
                    fields: newField,
                    values: { ...getObjKeys('', newField), ...ref.current.values },
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
                        <CustomDialogHeader title={`Edit Product`} onClose={handleClose}></CustomDialogHeader>
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
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                                disabled={uploadingImageOrFileProgress > 0}
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

export default CreateProduct;
