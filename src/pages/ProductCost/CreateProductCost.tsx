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
import { TextField } from "formik-material-ui";
import Loader from "../../components/Loader";
import { camelCase } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";

const ProductCostSchema = Yup.object().shape({
    name: Yup.string()
        .min(3, "Too Short!")
        .max(50, "Too Long")
        .required("name is required"),
    incoTermsFrom: Yup.string()
        .required("inco terms from is required"),
    incoTermsTo: Yup.string()
        .required("inco terms to is required"),
});


const ProductCost = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const { id } = useParams();

    const [isUpdating, setIsUpdating] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [section, setSection] = useState([]);
    const [deleteField, setDeleteField] = useState([]);

    useEffect(() => {
        fetchOneProductCost();
    }, [id]);

    const fetchOneProductCost = () => {
        if (id === "0") {
            setInitialValues({ name: "", incoTermsFrom: "", incoTermsTo: "" });
        }
        else {
            axiosInstance().get(`/productcost/` + id).then(({ data: { data } }) => {
                setInitialValues(data);
                setSection(data.section);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
    };

    const handleSave = (values) => {
        let data: any = {}
        data.name = values.name;
        data.incoTermsFrom = values.incoTermsFrom;
        data.incoTermsTo = values.incoTermsTo;

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
            axiosInstance().post("/productcost", data).then(({ data: { data } }) => {
                setIsUpdating(false)
                history.push({ pathname: routes.productCost.path });
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
        else {
            data.costId = id;
            data.deleteField = deleteField;
            axiosInstance().put("/productcost", data).then(({ data: { data } }) => {
                setIsUpdating(false)
                history.push({ pathname: routes.productCost.path });
            }).catch((error) => {
                setIsUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
    }

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: routes.productCost.title, path: routes.productCost.path }, { title: id === "0" ? "New" : initialValues && initialValues.name }]} />
            </Grid>
        </Grid>
        <div className="main-container">
            {initialValues ?
                <Formik initialValues={initialValues} validationSchema={ProductCostSchema} onSubmit={handleSave}>
                    {({ submitForm }) => (
                        <Form>
                            <Box p={1} bgcolor="white">
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={3}  >
                                        <Field
                                            component={TextField}
                                            fullWidth
                                            margin="dense"
                                            type="text"
                                            label="Name"
                                            name="name"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}  >
                                        <Field
                                            component={TextField}
                                            fullWidth
                                            margin="dense"
                                            type="text"
                                            label="Inco Terms From"
                                            name="incoTermsFrom"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}  >
                                        <Field
                                            component={TextField}
                                            fullWidth
                                            margin="dense"
                                            type="text"
                                            label="Inco Terms To"
                                            name="incoTermsTo"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3} container justify="flex-end">
                                        <Box>
                                            <Button disabled={isUpdating} size="small" color="primary" onClick={submitForm} variant="contained" >
                                                Save{isUpdating && <CircularProgress size={24} />}
                                            </Button>
                                        </Box>
                                        <Box ml={1} >
                                            <Button color="primary" size="small" variant="contained" onClick={() => history.push({ pathname: routes.productCost.path })} >Close</Button>
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

export default ProductCost;
