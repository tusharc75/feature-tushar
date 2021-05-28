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
import CustomContainer from "../../components/CustomContainer";
import routes from "../../components/Helpers/Routes";
import ProductBuilder from "../../components/productBuilder";
import ImportExportLinks from "../../components/Product/ImportExportLinks";

const ProductBuilderSchema = Yup.object().shape({
    name: Yup.string()
        .min(3, "Too Short!")
        .max(50, "Too Long")
        .required("name is required"),
});


const CreateProductBuilder = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const { id } = useParams();

    const [isUpdating, setIsUpdating] = useState(false);
    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        fetchOneProductBuilder();
    }, [id]);

    const fetchOneProductBuilder = () => {
        axiosInstance().get(`/productbuilder/` + id).then(({ data: { data } }) => {
            setIsUpdating(true)
            setInitialValues(data);
            setIsUpdating(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleSave = (values) => {    
    }

    return (<Layout>
        <Grid container direction="row">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.productBuilder.title, path: routes.productBuilder.path },
                { title: id === "0" ? "New" : initialValues && initialValues.name }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    module="product(s)"
                    api={"productbuilder"}
                    refrenceId={id}
                    onSuccessfulImport={(isImportedSuccessfully) => {
                        if (isImportedSuccessfully) {
                            fetchOneProductBuilder();
                        }
                    }}
                />
            </Grid>
        </Grid>
        <CustomContainer>
            {initialValues ?
                <Formik initialValues={initialValues} validationSchema={ProductBuilderSchema} onSubmit={handleSave}>
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
                                    <Grid item xs={12} sm={3}>
                                    </Grid>
                                    <Grid item xs={12} sm={6} container justify="flex-end">
                                        {/* <Box>
                                            <Button disabled={isUpdating} color="primary" onClick={submitForm} variant="contained" >
                                                Save{isUpdating && <CircularProgress size={24} />}
                                            </Button>
                                        </Box> */}
                                        <Box ml={1} >
                                            <Button size="small" color="primary" variant="contained" onClick={() => history.push({ pathname: routes.productBuilder.path })} >Close</Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {!isUpdating &&
                                <ProductBuilder productBuilderId={id} />}
                        </Form>)}
                </Formik>
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </CustomContainer>
    </Layout>
    );
}

export default CreateProductBuilder;
