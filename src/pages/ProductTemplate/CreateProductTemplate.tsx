import { useState, useEffect, useContext, Fragment, useRef } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useParams, useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { FormBuilder } from "../../components/FormBuilder";
import { Formik, Form } from "formik";
import { object, string } from "yup";
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
import { extractFields, checkFormulaLoop } from "../../constants/formulaUtility";
import { useData } from "../../StateProvider/Provider";
import HistoryDialog from "../../components/Activity/History"
import { productTemplate } from "../../constants/helpers"
import HistoryButton from "../../components/Helpers/HistoryButton";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { isEqual } from "lodash";

const ProductTemplateSchema = object().shape({
    name: string()
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
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerCollaboratorDataConst, setOwnerCollaboratorDataConst] = useState([]);
    const [productField, setProductField] = useState([]);
    const [hasPermissionToUpdate, setHasPermissionToUpdate] = useState(true)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [isBreakCrumbPath, setIsBreakCrumbPath] = useState("")
    const ref = useRef(null);

    const {
        state: { user, permissions },
    }: any = useData();
    const [productTemplatePermissions, setProductTemplatePermissions] = useState({
        isCreate: false,
        isUpdate: false,
        isRead: false,
        isDelete: false,
    });

    const onBackButtonEvent = (e) => {
        if (hasPermissionToUpdate) {
            e.preventDefault();
            window.history.pushState(null, null, window.location.pathname);
            if (!isEqual(ref.current.values, initialValues) || !isEqual(initialValues.section, section)) {
                if (((id === "0" && productTemplatePermissions.isCreate) || (id !== "0" && productTemplatePermissions.isUpdate))) {
                    setShowConfirmDialog(true)
                }
                else {
                    history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.productTemplate.path })
                }
            }
            else {
                history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.productTemplate.path })
            }
        }
    }

    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', onBackButtonEvent);
        return () => {
            window.removeEventListener('popstate', onBackButtonEvent);
        };
    }, []);

    useEffect(() => {
        fetchOneProductTemplate();
        axiosInstance().get("/field?resource=Product").then(({ data: { data } }) => {
            const _productField: any = []
            data.forEach((_f) => {
                _productField.push(_f.fieldData)
            })
            setProductField([...extractFields(_productField)]);
        })
    }, [id, isClone]);

    useEffect(() => {
        if (permissions && permissions.productTemplate) {
            setProductTemplatePermissions(permissions.productTemplate);
        }
    }, [permissions]);

    const fetchOneProductTemplate = () => {
        if (id === "0") {
            let initialData = { name: "", productCategory: [], entity: [], owner: user.user._id, collaborator: [], isStandard: false }
            setInitialValues(initialData);
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
                if (!data.owner) {
                    data.owner = user.user._id
                }
                setInitialValues(data);
                setSection(JSON.parse(JSON.stringify(data.section)));
                if (data?.owner && data?.owner !== undefined && user.user._id !== data?.owner && !data?.collaborator.some(d => d === user.user._id)) {
                    setHasPermissionToUpdate(false)
                }
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        fetchProductCategory()
        fetchUser()
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
        axiosInstance().get(`/product-category?sortBy=name&orderBy=asc`).then(({ data: { data } }) => {
            setProductCategory(data);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const fetchUser = () => {
        axiosInstance().get(`/user`).then(({ data: { data } }) => {
            setOwnerCollaboratorDataConst(data);
            setOwnerCollaboratorData(data)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleSave = (values) => {
        let data: any = {}
        data.name = values.name;
        data.isStandard = values.isStandard;
        if (data.isStandard) {
            data.productCategory = [];
            data.unit = null;
            data.entity = values?.entity;
            data.owner = values?.owner;
            data.collaborator = values?.collaborator;
        }
        else {
            data.productCategory = values.productCategory;
            data.unit = values.unit;
            data.entity = values?.entity;
            data.owner = values?.owner;
            data.collaborator = values?.collaborator;
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
        const result = checkFormulaLoop([...productField, ...data.fields])
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
                history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.productTemplate.path });
                setIsBreakCrumbPath("")
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
    }

    function validate(values) {
        const errors = {};
        if (!values.isStandard) {
            if (!values.productCategory || values.productCategory.length === 0) {
                errors["productCategory"] = "Product category is required";
            }
            if (!values.owner || values.owner === "") {
                errors["owner"] = "Owner is required";
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
                <CustomBreadCrumbs
                    routes={[{ title: routes.productTemplate.title, path: routes.productTemplate.path }, { title: id === "0" || isClone ? "New" : initialValues && initialValues.name }]}
                    isConfirmBeforeClick={hasPermissionToUpdate}
                    onBreadCrumbClick={(path) => {
                        setIsBreakCrumbPath(path)
                        if (hasPermissionToUpdate && (!isEqual(ref.current.values, initialValues) ||
                            !isEqual(initialValues.section, section))) {
                            if ((id === "0" && productTemplatePermissions.isCreate) || (id !== "0" && productTemplatePermissions.isUpdate)) {
                                setShowConfirmDialog(true)
                            }
                            else history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.productTemplate.path })
                        }
                        else history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.productTemplate.path })
                    }}
                />
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
                <Formik innerRef={ref} initialValues={initialValues} validationSchema={ProductTemplateSchema} onSubmit={handleSave} validate={validate}>
                    {({ submitForm, touched, errors, setFieldValue, values }) => (
                        <Form>
                            <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                            <Box p={1} bgcolor="white">
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={3}  >
                                        <TextField
                                            disabled={!hasPermissionToUpdate}
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
                                            onChange={(e) => {
                                                setFieldValue("name", e.target.value.trimStart())
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1}>
                                        <Box mt={0.5}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        disabled={!hasPermissionToUpdate}
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
                                    <Grid item xs={12} sm={4}>
                                        {!values["isStandard"] && <Autocomplete
                                            disabled={!hasPermissionToUpdate}
                                            options={productCategory}
                                            multiple
                                            getOptionLabel={(option: any) => (option ? option.name : "")}
                                            getOptionSelected={(option: any, val) => option._id === val}
                                            value={productCategory.filter((data) => values["productCategory"]?.some(d => d === data._id)).length
                                                ? productCategory.filter((data) => values["productCategory"]?.some(d => d === data._id))
                                                : []}
                                            onChange={(e, val) => {
                                                setFieldValue("productCategory", val && val?.map(d => d._id))
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
                                    <Grid item xs={12} sm={4} container justify="flex-end">
                                        <HistoryButton onClick={() => setShowHistory(true)} />
                                        <Box>
                                            {
                                                ((id === "0" && productTemplatePermissions.isCreate) || (id !== "0" && productTemplatePermissions.isUpdate)) &&
                                                <Button disabled={isUpdating || !hasPermissionToUpdate} color="primary" size="small" onClick={submitForm} variant="contained" >
                                                    Save{isUpdating && <CircularProgress size={24} />}
                                                </Button>
                                            }
                                        </Box>
                                        <Box ml={1} >
                                            <Button color="primary" variant="contained" size="small"
                                                onClick={() => {
                                                    if (hasPermissionToUpdate && (!isEqual(ref.current.values, initialValues) ||
                                                        !isEqual(initialValues.section, section))) {
                                                        if (((id === "0" && productTemplatePermissions.isCreate) || (id !== "0" && productTemplatePermissions.isUpdate))) {
                                                            setShowConfirmDialog(true)
                                                        }
                                                        else {
                                                            history.push(routes.productTemplate.path)
                                                        }
                                                    }
                                                    else {
                                                        history.push(routes.productTemplate.path)
                                                    }
                                                }}
                                            >Close</Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={4}>
                                        {<Autocomplete
                                            disabled={!hasPermissionToUpdate}
                                            multiple
                                            options={user?.entity}
                                            getOptionLabel={(option: any) => (option ? option?.entityName : "")}
                                            value={user?.entity.filter((data) => values["entity"]?.some(d => d === data._id)).length
                                                ? user?.entity.filter((data) => values["entity"]?.some(d => d === data._id))
                                                : []}
                                            onChange={(e, val) => {
                                                setFieldValue("entity", val && val?.map(d => d._id))
                                                val && val.length !== 0 ?
                                                    setOwnerCollaboratorData(ownerCollaboratorDataConst.filter(data => val?.some(d => data.entities?.some(e => e.entity === d._id))))
                                                    : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="entity"
                                                    label="Entity"
                                                    variant="outlined"
                                                    error={touched["entity"] && Boolean(errors["entity"])}
                                                    helperText={touched["entity"] && errors["entity"]}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        {<Autocomplete
                                            disabled={!hasPermissionToUpdate}
                                            getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                                            value={ownerCollaboratorData.filter((data) => data._id === values["owner"]).length
                                                ? ownerCollaboratorData.filter((data) => data._id === values["owner"])[0]
                                                : ""}
                                            options={ownerCollaboratorData.filter(user => !values["collaborator"]?.some((d) => (user._id === d)))}
                                            onChange={(e, val) => {
                                                setFieldValue("owner", val && val._id ? val._id : "");
                                            }}
                                            onOpen={() =>
                                                values["entity"] && values["entity"].length !== 0 ?
                                                    setOwnerCollaboratorData(ownerCollaboratorDataConst.filter(data => values["entity"]?.some(d => data.entities?.some(e => e.entity === d))))
                                                    : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="owner"
                                                    label="Owner"
                                                    variant="outlined"
                                                    error={touched["owner"] && Boolean(errors["owner"])}
                                                    helperText={touched["owner"] && errors["owner"]}
                                                    required={true}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        {<Autocomplete
                                            disabled={!hasPermissionToUpdate}
                                            multiple
                                            options={ownerCollaboratorData.filter(d => d._id !== values["owner"])}
                                            getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                                            value={ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id)).length
                                                ? ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id))
                                                : []}
                                            onChange={(e, val) => {
                                                setFieldValue("collaborator", val && val?.map(d => d._id))
                                            }}

                                            onOpen={() =>
                                                values["entity"] && values["entity"].length !== 0 ?
                                                    setOwnerCollaboratorData(ownerCollaboratorDataConst.filter(data => values["entity"]?.some(d => data.entities?.some(e => e.entity === d))))
                                                    : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="collaborator"
                                                    label="Collaborator"
                                                    variant="outlined"
                                                    error={touched["collaborator"] && Boolean(errors["collaborator"])}
                                                    helperText={touched["collaborator"] && errors["collaborator"]}
                                                    fullWidth
                                                />
                                            )}
                                        />}
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
                                    extraFields={productField}
                                    module="product-template"
                                />
                            </Box>
                            {
                                showConfirmDialog ?
                                    <ConfirmCancelDialog
                                        open={showConfirmDialog}
                                        onSave={() => {
                                            setShowConfirmDialog(false)
                                            submitForm();
                                        }}
                                        onClose={() => {
                                            setShowConfirmDialog(false)
                                            history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : "/product-Template" })
                                            setIsBreakCrumbPath("")
                                        }}
                                    /> : null
                            }
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
    </Fragment >
    );
}

export default ProductTemplate;
