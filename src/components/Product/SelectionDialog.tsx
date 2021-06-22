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
    priceTemplate: Yup.string()
        .required("please select price template"),
});

const SelectionDialog = (props) => {

    const { state: { permissions } }: any = useData();
    const toastConfig = useContext(CustomToastContext)
    const { handleClose, api, refrenceId, isUpload, uploadData } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ productCategory: "", priceTemplate: "" });
    const [productCategory, setProductCategory] = useState([]);
    const [priceTemplate, setPriceTemplate] = useState([]);
    const [fileError, setFileError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null)
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
        axiosInstance().get(`/price-template/template/standard`).then(({ data: { data } }) => {
            setPriceTemplate(data.data)
            if (data.data.length) {
                setInitialData({ ...initialData, priceTemplate: data.data[0].optionValue })
            }
        });
    }, []);


    const handleChangeCategory = (value, label) => {
        if (value && value !== "") {
            axiosInstance().get(`/price-template/template/` + value).then(({ data: { data } }) => {
                setPriceTemplate(data.data)
                if (data.data.length) {
                    var defaultpriceTemplate = data.data[0].optionValue
                    data.data.forEach((_f) => {
                        let re = new RegExp(_f.optionLabel);
                        if (label.match(re)) {
                            defaultpriceTemplate = _f.optionValue
                            return
                        }
                    })
                    setInitialData({ productCategory: value, priceTemplate: defaultpriceTemplate })
                }
            });
        } else {
            axiosInstance().get(`/price-template/template/standard`).then(({ data: { data } }) => {
                setPriceTemplate(data.data)
                if (data.data.length) {
                    setInitialData({ ...initialData, priceTemplate: data.data[0].optionValue })
                }
            });
        }
    }

    const handleSubmit = (values) => {
        if (isUpload) {
            if (!selectedFile) setFileError("Please Select File")
            else uploadData(selectedFile, { productCategory: values.productCategory, priceTemplate: values.priceTemplate });
        }

        else axiosInstance().get(`${api}/template?productCategory=` + values.productCategory + "&priceTemplate=" + values.priceTemplate
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
                                                handleChangeCategory(val && val.optionValue ? val.optionValue : "", val && val.optionLabel ? val.optionLabel : "")
                                                setFieldValue("priceTemplate", "")
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
                                <Box mt={1}>
                                    <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={"Price Template"}
                                        name={"priceTemplate"}
                                        type={"dropDown"}
                                        options={priceTemplate}
                                        setFieldValue={setFieldValue}
                                        required={true}
                                        fullWidth
                                        onChange={(e, val) => {
                                            setFieldValue("priceTemplate", val && val.optionValue ? val.optionValue : "")
                                        }}
                                        size="small"
                                    />
                                </Box>
                                {isUpload &&
                                    <Box mt={1}>
                                        <label htmlFor="btn-upload">
                                            <input
                                                id="btn-upload"
                                                name="btn-upload"
                                                style={{ display: 'none' }}
                                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                                type="file"
                                                onChange={(e) => {
                                                    setFileError(null)
                                                    setSelectedFile(e)
                                                }}
                                            />
                                            <Button
                                                className={`btn-choose`}
                                                variant="outlined"
                                                component="span">
                                                Choose Files
                                            </Button>
                                            {fileError && <p className="MuiFormHelperText-root Mui-error MuiFormHelperText-contained">{fileError}</p>}
                                            <span style={{ marginLeft: '5px' }}>{selectedFile && selectedFile.target.files.length > 0 ? selectedFile.target.files[0].name : null}</span>
                                        </label>
                                    </Box>
                                }
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
                        > {isUpload ? "Upload" : "Download"} </CustomButton>
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
                        handleChangeCategory(data._id, data.name)
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
