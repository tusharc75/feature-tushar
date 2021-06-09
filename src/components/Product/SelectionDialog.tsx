import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import routes from "../../components/Helpers/Routes";
import FormTypes from "../Helpers/FormTypes";
import { downloadExcel } from "../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";


const ProductBuilderSchema = Yup.object().shape({
    productCategory: Yup.string()
        .required("please select product category"),
    productTemplate: Yup.string()
        .required("please select product template"),
});


const SelectionDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, api, refrenceId } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ productCategory: "", productTemplate: "" });
    const [productCategory, setProductCategory] = useState([]);
    const [productTemplate, setProductTemplate] = useState([]);

    useEffect(() => {
        axiosInstance().get(`/product-category`).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                optionValue: u._id,
                optionLabel: u.name,
            }));
            setProductCategory(data.data)
        });
    }, []);

    const handleChangeCategory = (value) => {
        if (value && value !== "") {
            axiosInstance().get(`/product-template/template/` + value).then(({ data: { data } }) => {
                setProductTemplate(data.data)
                if (data.data.length) {
                    setInitialData({ productCategory: value, productTemplate: data.data[0].optionValue })
                }
            });
        }
    }

    const handleSubmit = (values) => {
        axiosInstance().get(`${api}/template?productCategory=` + values.productCategory + "&productTemplate=" + values.productTemplate
            + "&refrenceId=" + refrenceId,
            { responseType: "arraybuffer" }).then((response) => {
                const fileName = response.headers["content-disposition"].split("filename=")[1];
                downloadExcel(response.data, fileName);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    return (<Dialog
        maxWidth="xs"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <Formik
            enableReinitialize={true}
            initialValues={initialData}
            validationSchema={ProductBuilderSchema}
            validateOnMount
            onSubmit={handleSubmit}>
            {({ values,
                errors,
                touched,
                setFieldValue,
                submitForm,
            }) => (
                <Fragment>
                    <CustomDialogHeader title="Select Category & Template" onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <Box p={1}>
                                <FormTypes
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={"Product Category"}
                                    name={"productCategory"}
                                    type={"dropDown"}
                                    options={productCategory}
                                    setFieldValue={setFieldValue}
                                    required={true}
                                    fullWidth
                                    onChange={(e, val) => {
                                        setFieldValue("productCategory", val && val.optionValue ? val.optionValue : "")
                                        handleChangeCategory(val && val.optionValue ? val.optionValue : "")
                                        setFieldValue("productTemplate", productTemplate.length ? productTemplate[0].optionValue : "")
                                    }}
                                    size="small"
                                />
                                <Box mt={1}>
                                    <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={"Product Template"}
                                        name={"productTemplate"}
                                        type={"dropDown"}
                                        options={productTemplate}
                                        setFieldValue={setFieldValue}
                                        required={true}
                                        fullWidth
                                        onChange={(e, val) => {
                                            setFieldValue("productTemplate", val && val.optionValue ? val.optionValue : "")
                                        }}
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button size="small" color="primary" onClick={handleClose}>Cancel</Button>
                        <CustomButton
                            loading={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={submitForm}
                        > Download</CustomButton>
                    </CustomDialogFooter>
                </Fragment>
            )}
        </Formik>
    </Dialog>
    );
}

export default SelectionDialog;
