import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useParams, useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { FormBuilder } from "../../components/FormBuilder";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Loader from "../../components/Loader";
import { camelCase } from "../../constants/helpers";
import routes from "../../components/Helpers/Routes";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CustomContainer from "../../components/CustomContainer";
import DefaultFields from './defaultFields';
import { Autocomplete } from "@material-ui/lab";
import TextField from '@material-ui/core/TextField';
import queryString from "query-string";
import _ from 'lodash';
import { useLocation } from 'react-router-dom';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

const ProductTemplateSchema = Yup.object().shape({
    name: Yup.string()
        .min(3, "Too Short!")
        .max(50, "Too Long")
        .required("Template name is required"),
});


const ProductTemplate = () => {

    const history = useHistory();
    const { id } = useParams();
    const toastConfig = useContext(CustomToastContext)

    const [isClone, setisClone] = useState(history.location.state?.isClone ? true : false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [section, setSection] = useState([]);
    const [deleteField, setDeleteField] = useState([]);
    const [productCategory, setProductCategory] = useState(null);
    const [productUnit, setProductUnit] = useState(null);

    useEffect(() => {
        fetchOneProductTemplate();
    }, [id, isClone]);

    const fetchOneProductTemplate = () => {
        if (id === "0") {
            setInitialValues({ name: "", productCategory: "", unit: "", isStandard: false });
            const _data = []
            const _section = _.uniq(_.map(DefaultFields, 'sectionName'));
            _section.forEach((element: any, index: number) => {
                _data.push({
                    sectionId: index,
                    sectionName: element,
                    sectionType: "cost",
                    field: DefaultFields.filter((el: any) => el.sectionName === element),
                });
            });
            setSection(_data);
        }
        else {
            axiosInstance().get(`/product-template/` + id).then(({ data: { data } }) => {
                if (isClone) {
                    data.name = ""
                }
                setInitialValues(data);
                setSection(data.section);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        fetchProductCategory()
        axiosInstance().get(`/field?resource=Product`).then(({ data: { data } }) => {
            let field = data.map((_f) => _f.fieldData)
            if (field.filter((data) => data.fieldName === "unit").length) {
                let unit = field.filter((data) => data.fieldName === "unit")[0].option
                setProductUnit(unit);
            }
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const fetchProductCategory = () => {
        axiosInstance().get(`/product-category`).then(({ data: { data } }) => {
            setProductCategory(data);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleSave = (values) => {
        let data: any = {}
        data.name = values.name; 
        data.isStandard = values.isStandard;
        if (data.isStandard) {
            data.productCategory = null;
            data.unit = null;
        }
        else {
            data.productCategory = values.productCategory;
            data.unit = values.unit;
        }
        let fields: any = []
        let order = 0;
        section.forEach(_section => {
            _section.field.forEach(_field => {
                let _field_data = _field
                _field_data._id = _field_data._id.toString();
                if (!isNaN(_field._id)) {
                    _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''))
                }
                _field_data.sectionName = _section.sectionName
                _field_data.sectionType = _section.sectionType
                _field_data.order = ++order
                fields.push(_field_data)
            })
        })
        data.fields = fields;
        setIsUpdating(true)
        if (id === "0" || isClone) {
            axiosInstance().post("/product-template", data).then(({ data: { data } }) => {
                setIsUpdating(false)
                history.push({ pathname: routes.productTemplate.path });
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
        else {
            data.templateId = id;
            data.deleteField = deleteField;
            axiosInstance().put("/product-template", data).then(({ data: { data } }) => {
                setIsUpdating(false)
                history.push({ pathname: routes.productTemplate.path });
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
    }

    function validate(values) {
        const errors = {};
        if (!values.isStandard) {
            if (!values.productCategory || values.productCategory === "") {
                errors["productCategory"] = "Product category is required";
            }
            if (!values.unit || values.unit === "") {
                errors["unit"] = "Unit is required";
            }
        }
        return errors;
    }

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: routes.productTemplate.title, path: routes.productTemplate.path }, { title: id === "0" || isClone ? "New" : initialValues && initialValues.name }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            {(initialValues && productCategory && productUnit) ?
                <Formik initialValues={initialValues} validationSchema={ProductTemplateSchema} onSubmit={handleSave} validate={validate}>
                    {({ submitForm, touched, errors, setFieldValue, values }) => (
                        <Form>
                            <Box p={1} bgcolor="white">
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={3}  >
                                        <TextField
                                            variant="outlined"
                                            type="text"
                                            label="Template Name"
                                            required={true}
                                            name="name"
                                            fullWidth
                                            margin="dense"
                                            value={values["name"]}
                                            error={touched["name"] && Boolean(errors["name"])}
                                            helperText={touched["name"] && errors["name"]}
                                            onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1}>
                                        <Box mt={0.5}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        name="isStandard"
                                                        checked={values["isStandard"]}
                                                        onChange={(e) => {
                                                            setFieldValue("isStandard", e.target.checked)
                                                        }}
                                                        color="primary"
                                                    />
                                                }
                                                label="Standard"
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        {!values["isStandard"] && <Autocomplete
                                            options={productCategory}
                                            getOptionLabel={(option: any) => (option ? option.name : "")}
                                            getOptionSelected={(option: any, val) => option._id === val}
                                            value={productCategory.filter((data) => data._id === values["productCategory"]).length
                                                ? productCategory.filter((data) => data._id === values["productCategory"])[0]
                                                : ""
                                            }
                                            onChange={(e, val) => setFieldValue("productCategory", val && val._id ? val._id : "")}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="productCategory"
                                                    label="Product Category"
                                                    variant="outlined"
                                                    error={touched["productCategory"] && Boolean(errors["productCategory"])}
                                                    helperText={touched["productCategory"] && errors["productCategory"]}
                                                    required={true}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        {!values["isStandard"] && <Autocomplete
                                            options={productUnit}
                                            getOptionLabel={(option: any) => (option ? option.optionLabel : "")}
                                            getOptionSelected={(option: any, val) => option.optionLabel === val}
                                            value={productUnit.filter((data) => data.optionLabel === values["unit"]).length
                                                ? productUnit.filter((data) => data.optionLabel === values["unit"])[0]
                                                : ""
                                            }
                                            onChange={(e, val) => setFieldValue("unit", val && val.optionLabel ? val.optionLabel : "")}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="unit"
                                                    label="Unit"
                                                    variant="outlined"
                                                    error={touched["unit"] && Boolean(errors["unit"])}
                                                    helperText={touched["unit"] && errors["unit"]}
                                                    required={true}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                    <Grid item xs={12} sm={2} container justify="flex-end">
                                        <Box>
                                            <Button disabled={isUpdating} color="primary" size="small" onClick={submitForm} variant="contained" >
                                                Save{isUpdating && <CircularProgress size={24} />}
                                            </Button>
                                        </Box>
                                        <Box ml={1} >
                                            <Button color="primary" variant="contained" size="small" onClick={() => history.push({ pathname: "/product-Template" })} >Close</Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box >
                                <FormBuilder
                                    section={section}
                                    setSection={setSection}
                                    deleteField={deleteField}
                                    setDeleteField={setDeleteField}
                                    isCustomField={true}
                                />
                            </Box>
                        </Form>)}
                </Formik>
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </CustomContainer>
    </Layout>
    );
}

export default ProductTemplate;
