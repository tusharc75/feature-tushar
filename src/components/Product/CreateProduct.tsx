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


const CreateProduct = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productId, handleClose, isClone, isAddInBuilder, addProductInBuilder } = props;
    const [masterFields, setMasterFields] = useState([]);
    const [productFields, setProductFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });

    const [isAddField, setIsAddField] = useState(false);
    const [fields, setFields] = useState([]);
    const [sectionName, setSectionName] = useState("");
    const ref = useRef(null);


    useEffect(() => {
        axiosInstance().get(`/field?resource=Product`).then(({ data: { data } }) => {
            setMasterFields(data.map((_f) => _f.fieldData))
            const _fields = [];
            data.map((_f) => _fields.push(_f.fieldData));
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

    const handleChangeTemplate = (value) => {
        if (value && value !== "") {
            axiosInstance().get(`/product-template/fields/` + value).then(({ data: { data } }) => {
                let newField = [...masterFields];
                data.fields.filter((f) => f.sectionType !== "cost").forEach(_f => {
                    newField.push(_f)
                })
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

    return (<Dialog
        maxWidth="md"
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
                                                                        disabled={field.fieldName === "unit" ? true : false}
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
                            <Button color="primary" onClick={handleClose}>Cancel</Button>
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
    </Dialog>
    );
}

export default CreateProduct;
