import { useState, useEffect, useContext, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useParams, useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { FormBuilder } from "../../components/FormBuilder";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { camelCase } from "../../constants/helpers";
import routes from "../../components/Helpers/Routes";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CustomContainer from "../../components/CustomContainer";
import { Autocomplete } from "@material-ui/lab";
import TextField from '@material-ui/core/TextField';
import { uniq, map } from 'lodash';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { checkFormulaLoop } from "../../constants/formulaUtility";
import { useData } from "../../StateProvider/Provider";
import HistoryDialog from "../../components/Activity/History"
import { productTemplate } from "../../constants/helpers"
import HistoryButton from "../../components/Helpers/HistoryButton";

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

    const [isClone] = useState(history.location.state?.isClone ? true : false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [section, setSection] = useState([]);
    const [deleteField, setDeleteField] = useState([]);
    const [productCategory, setProductCategory] = useState(null);
    const [showHistory, setShowHistory] = useState(false)
    //const [productUnit, setProductUnit] = useState(null);

    const {
        state: { permissions },
    }: any = useData();
    const [productTemplatePermissions, setProductTemplatePermissions] = useState({
        isCreate: false,
        isUpdate: false,
        isRead: false,
        isDelete: false,
    });

    useEffect(() => {
        fetchOneProductTemplate();
    }, [id, isClone]);

    useEffect(() => {
        if (permissions && permissions.productTemplate) {
            setProductTemplatePermissions(permissions.productTemplate);
        }
    }, [permissions]);

    const fetchOneProductTemplate = () => {
        if (id === "0") {
            setInitialValues({ name: "", productCategory: "", isStandard: false });
            axiosInstance().get(`/product-template/default-field`).then(({ data: { data } }) => {
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
        // axiosInstance().get(`/field?resource=Product`).then(({ data: { data } }) => {
        //     let field = data.map((_f) => _f.fieldData)
        //     if (field.filter((data) => data.fieldName === "unit").length) {
        //         let unit = field.filter((data) => data.fieldName === "unit")[0].option
        //         setProductUnit(unit);
        //     }
        // }).catch((error) => {
        //     toastConfig.setToastConfig(error);
        // });
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
                    _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''))
                }
                _field_data.sectionName = _section.sectionName
                _field_data.order = ++order
                fields.push(_field_data)
            })
        })
        data.fields = fields;
        const result = checkFormulaLoop(data.fields)
        if (result.error) {
            toastConfig.setToastConfig({ open: true, type: "error", message: result.message });
            return
        }
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
            // if (!values.unit || values.unit === "") {
            //     errors["unit"] = "Unit is required";
            // }
        }
        return errors;
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


    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.productTemplate.title, path: routes.productTemplate.path }, { title: id === "0" || isClone ? "New" : initialValues && initialValues.name }]} />
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
        <CustomContainer>
            {(initialValues && productCategory) ?
                <Formik initialValues={initialValues} validationSchema={ProductTemplateSchema} onSubmit={handleSave} validate={validate}>
                    {({ submitForm, touched, errors, setFieldValue, values }) => (
                        <Form>
                            <Box p={1} bgcolor="white">
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={3}  >
                                        <TextField
                                            variant="outlined"
                                            type="text"
                                            label="Product Template Name"
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
                                            onChange={(e, val) => {
                                                setFieldValue("productCategory", val && val._id ? val._id : "")
                                                if (val && val.name) {
                                                    setFieldValue("name", val.name);
                                                }
                                            }}
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
                                        {/* {!values["isStandard"] && <Autocomplete
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
                                        />} */}
                                    </Grid>
                                    <Grid item xs={12} sm={2} container justify="flex-end">
                                        <HistoryButton onClick={() => setShowHistory(true)} />
                                        <Box>
                                            {(productTemplatePermissions.isCreate || productTemplatePermissions.isUpdate) &&
                                                <Button disabled={isUpdating} color="primary" size="small" onClick={submitForm} variant="contained" >
                                                    Save{isUpdating && <CircularProgress size={24} />}
                                                </Button>
                                            }
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
                                    extraFields={[]}
                                    module="product-template"
                                />
                            </Box>
                        </Form>)}
                </Formik>
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
            {
                showHistory ? <HistoryDialog
                    open={showHistory}
                    resourceId={initialValues?._id}
                    resource={productTemplate.productTemplateRoute}
                    onClose={() => setShowHistory(false)}
                /> : null
            }
        </CustomContainer>
    </Fragment>
    );
}

export default ProductTemplate;
