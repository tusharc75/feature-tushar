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
import TextField from '@material-ui/core/TextField';
import Loader from "../../components/Loader";
import { camelCase } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import { Autocomplete } from "@material-ui/lab";
import { uniq, map } from 'lodash';
import { extractFields } from "../../constants/formulaUtility";

const PriceTemplateSchema = Yup.object().shape({
    name: Yup.string()
        .min(3, "Too Short!")
        .max(50, "Too Long")
        .required("name is required"),
    productTemplate: Yup.string()
        .required("product template is required"),
});


const PriceTemplate = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const { id } = useParams();

    const [isUpdating, setIsUpdating] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [section, setSection] = useState([]);
    const [deleteField, setDeleteField] = useState([]);
    const [productTemplate, setProductTemplate] = useState([]);
    const [templateField, setTemplateField] = useState([]);

    useEffect(() => {
        axiosInstance().get(`/product-template`).then(({ data }) => {
            setProductTemplate(data.data)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
        fetchOnePriceTemplate();
    }, [id]);

    const fetchOnePriceTemplate = () => {
        if (id === "0") {
            setInitialValues({ name: "", productTemplate: "" });
            axiosInstance().get(`/price-template/default-field`).then(({ data: { data } }) => {
                const _data = []
                const _section = uniq(map(data.fields, 'sectionName'));
                _section.forEach((element: any, index: number) => {
                    _data.push({
                        sectionId: index,
                        sectionName: element,
                        field: data.fields.filter((el: any) => el.sectionName === element),
                    });
                });
                setSection(_data);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().get(`/price-template/` + id).then(({ data: { data } }) => {
                setInitialValues(data);
                handleProductTemplateField(data.productTemplate)
                setSection(data.section);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
    };

    const handleSave = (values) => {
        let data: any = {}
        data.name = values.name;
        data.productTemplate = values.productTemplate;

        let fields: any = []
        let order = 0;
        section.forEach(_section => {
            _section.field.forEach(_field => {
                let _field_data = _field
                _field_data._id = _field_data._id.toString();
                _field_data.sectionName = _section.sectionName
                if (!isNaN(_field._id)) {
                    _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''))
                }
                _field_data.order = ++order
                fields.push(_field_data)
            })
        })
        data.fields = fields;
        setIsUpdating(true)
        if (id === "0") {
            axiosInstance().post("/price-template", data).then(({ data: { data } }) => {
                setIsUpdating(false)
                history.push({ pathname: routes.priceTemplate.path });
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
        else {
            data.templateId = id;
            data.deleteField = deleteField;
            axiosInstance().put("/price-template", data).then(({ data: { data } }) => {
                setIsUpdating(false)
                history.push({ pathname: routes.priceTemplate.path });
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
    }

    const handleExportFields = () => {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(section));
        var dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "template_field.json");
        dlAnchorElem.click();
    }

    const handleImportFields = (e) => {
        e.preventDefault();
        var files = e.target.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data: any = e.target.result;
            setSection(JSON.parse(data));
        };
        reader.readAsBinaryString(f)
    }

    const handleProductTemplateField = (productTemplate_id) => {
        if (productTemplate_id && productTemplate_id !== "") {
            axiosInstance().get(`/product-template/fields/` + productTemplate_id).then(({ data: { data } }) => {
                setTemplateField([{ fieldLabel: "Qty", fieldName: "qty" }, ...extractFields(data.fields)])
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        else {
            setTemplateField([])
        }
    }

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.priceTemplate.title, path: routes.priceTemplate.path }, { title: id === "0" ? "New" : initialValues && initialValues.name }]} />
            </Grid>
            <Grid container justify="flex-end" item md={8} sm={1} xs={2}>
                <label htmlFor="importField" style={{ color: "white" }} className="cursor-pointer mr-3">
                    Import Fields
                    <input
                        onClick={(e: any) => (e.target.value = null)}
                        id="importField"
                        name="importField"
                        onChange={handleImportFields}
                        style={{
                            opacity: "0",
                            position: "absolute",
                            zIndex: -1,
                        }}
                        type="file"
                    />
                </label>
                <label style={{ color: "white" }} className="cursor-pointer" onClick={handleExportFields}>
                    Export Fields
                </label>
                <a id="downloadAnchorElem" style={{ display: "none" }}></a>
            </Grid>
        </Grid>
        <div className="main-container">
            {initialValues ?
                <Formik initialValues={initialValues} validationSchema={PriceTemplateSchema} onSubmit={handleSave}>
                    {({ submitForm, touched, errors, setFieldValue, values }) => (
                        <Form>
                            <Box p={1} ml={1} bgcolor="white">
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
                                    <Grid item xs={12} sm={3}  >
                                        <Autocomplete
                                            options={productTemplate}
                                            getOptionLabel={(option: any) => (option ? option.name : "")}
                                            getOptionSelected={(option: any, val) => option._id === val}
                                            value={productTemplate.filter((data) => data._id === values["productTemplate"]).length
                                                ? productTemplate.filter((data) => data._id === values["productTemplate"])[0]
                                                : ""
                                            }
                                            onChange={(e, val) => { setFieldValue("productTemplate", val && val._id ? val._id : ""); handleProductTemplateField(val && val._id ? val._id : "") }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="productTemplate"
                                                    label="Product Template"
                                                    variant="outlined"
                                                    error={touched["productTemplate"] && Boolean(errors["productTemplate"])}
                                                    helperText={touched["productTemplate"] && errors["productTemplate"]}
                                                    required={true}
                                                    fullWidth
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} container justify="flex-end">
                                        <Box>
                                            <Button disabled={isUpdating} size="small" color="primary" onClick={submitForm} variant="contained" >
                                                Save{isUpdating && <CircularProgress size={24} />}
                                            </Button>
                                        </Box>
                                        <Box ml={1} >
                                            <Button color="primary" size="small" variant="contained" onClick={() => history.push({ pathname: routes.priceTemplate.path })} >Close</Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box>
                                <FormBuilder
                                    section={section}
                                    setSection={setSection}
                                    deleteField={deleteField}
                                    setDeleteField={setDeleteField}
                                    isCustomField={true}
                                    extraFields={templateField}
                                    module="price-template"
                                />
                            </Box>
                        </Form>)}
                </Formik>
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </div>
    </Layout>
    );
}

export default PriceTemplate;
