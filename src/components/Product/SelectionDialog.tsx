import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import { Box, Grid, Button, Tooltip } from '@material-ui/core';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import * as Yup from "yup";
import FormTypes from "../Helpers/FormTypes";
import { downloadExcel } from "../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import CreateProductCategory from "../../pages/ProductCategory/CreateProductCategory";
import IconButton from '@material-ui/core/IconButton';
import AddIcon from "@material-ui/icons/AddCircle";

const ProductBuilderSchema = Yup.object().shape({
    // productCategory: Yup.string()
    //     .required("please select product category"),
    productTemplate: Yup.string()
        .required("please select product template"),
});

const SelectionDialog = (props) => {

    const { state: { permissions } }: any = useData();
    const toastConfig = useContext(CustomToastContext)
    const { handleClose, api, refrenceId } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ productCategory: "", productTemplate: "" });
    const [productCategory, setProductCategory] = useState([]);
    const [productTemplate, setProductTemplate] = useState([]);

    const [showAddProductCategoryDialog, setShowAddProductCategoryDialog] = useState(false);
    // const [productCategory, setProductCategory] = useState([]);
    const [newProductCategoryId, setNewProductCategoryId] = useState(null);

    useEffect(() => {
        axiosInstance().get(`/product-category`).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                optionValue: u._id,
                optionLabel: u.name,
            }));
            setProductCategory(data.data)
        });
        axiosInstance().get(`/product-template/template/standard`).then(({ data:{data} }) => {
            setProductTemplate(data.data)
            if (data.data.length) {
                setInitialData({...initialData, productTemplate: data.data[0].optionValue })
            }
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
        }else{
            axiosInstance().get(`/product-template/template/standard`).then(({ data:{data} }) => {
                setProductTemplate(data.data)
                if (data.data.length) {
                    setInitialData({...initialData, productTemplate: data.data[0].optionValue })
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

    const initializeProductCategoryDropdown = (values, productCategorySource) => {
        if (values && values.hasOwnProperty("productCategory")) {
            const getNewAddedProductCategory = productCategorySource.find(
                (d) => d.optionValue === newProductCategoryId
            );
            if (getNewAddedProductCategory) {
                values["productCategory"] = getNewAddedProductCategory.optionValue;
            }
            return values;
        }
        return values;
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
                                <Grid container spacing={1}>
                                    <Grid
                                        item
                                        xs={
                                            //  TODO: Product category is not added in role, once implementation is done, please uncomment below lines
                                            // permissions.productCategory
                                            //     .isCreate
                                            true ? 11
                                                : 12
                                        }
                                        sm={
                                            // permissions.productCategory
                                            //     .isCreate
                                            true ? 11
                                                : 12
                                        }
                                        md={
                                            // permissions.productCategory
                                            //     .isCreate
                                            true ? 11
                                                : 12
                                        }
                                    >
                                        <FormTypes
                                            errors={errors}
                                            touched={touched}
                                            label={"Product Category"}
                                            name={"productCategory"}
                                            type={"dropDown"}
                                            options={productCategory}
                                            setFieldValue={setFieldValue}
                                            required={false}
                                            doNotShowInfoTooltip={true}
                                            fullWidth
                                            onChange={(e, val) => {
                                                setFieldValue("productCategory", val && val.optionValue ? val.optionValue : "")
                                                handleChangeCategory(val && val.optionValue ? val.optionValue : "")
                                                setFieldValue("productTemplate", "")
                                            }}
                                            size="small"
                                            values={
                                                newProductCategoryId
                                                    ? initializeProductCategoryDropdown(
                                                        values,
                                                        productCategory
                                                    )
                                                    : values
                                            }
                                        />
                                    </Grid>
                                    {
                                        // permissions.productCategory
                                        //     .isCreate
                                        true && (
                                            <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip
                                                    title="Add Product Category"
                                                    className="mt-1"
                                                >
                                                    <IconButton
                                                        onClick={() => { setShowAddProductCategoryDialog(true); }}
                                                        size="small"
                                                    >
                                                        <AddIcon color="primary" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Grid>
                                        )
                                    }
                                </Grid>

                                {/* <FormTypes
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
                                            setFieldValue("productTemplate", "")
                                        }}
                                        size="small"
                                    /> */}

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

        {
            showAddProductCategoryDialog && <CreateProductCategory
                productCategoryId={null}
                handleClose={(data) => {

                    if (data?._id) {
                        setProductCategory((prevState) => {
                            return [
                                ...prevState,
                                {
                                    optionValue: data._id,
                                    optionLabel: data.name,
                                    order: productCategory.length,
                                    default: false,
                                },
                            ];
                        });
                        setNewProductCategoryId(data._id);
                        handleChangeCategory(data._id)
                    }
                    setShowAddProductCategoryDialog(false);
                    // fetchProductCategory();
                }}
            />
        }
    </Dialog >
    );
}

export default SelectionDialog;
