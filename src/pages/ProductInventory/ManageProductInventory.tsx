import { useState, useEffect, Fragment, useContext } from "react";
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, productInventory, setFieldsInAscendingOrder } from "../../constants/helpers";
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box, Grid } from '@material-ui/core';
import FormTypes from "../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"

const ManageProductInventory = ({ isClone = false, productInventoryId = null, onClose, onSuccess, productId = null, productCategory = null }) => {

    const toastConfig = useContext(CustomToastContext)
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [productCategoryOptions, setProductCategoryOptions] = useState([])
    const [formValues, setFormValues] = useState({})
    // const desc = {
    //     productCategory: "",
    //     product: "",
    //     serialNumber: ""
    // }
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    useEffect(() => {
        axiosInstance().get("/field?resource=Product Inventory").then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate)
                .map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            const categoryOptions = data.find(obj => obj?.fieldData.fieldName === "productCategory")?.fieldData.option

            setProductCategoryOptions(categoryOptions)

            if (productInventoryId) {
                axiosInstance().get(`${productInventory.api}/` + productInventoryId).then(({ data: { data } }) => {
                    if (isClone) {
                        const { _id, createdBy, updatedBy, serialNumber, ...rest } = data

                        setInitialData({
                            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                            values: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate))

                        setLoading(false)
                    } else {
                        setInitialData({
                            fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                            values: getObjKeysWithValues(data, fieldsDataForUpdate),
                        });
                        setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate))
                    }
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                let createValues = getObjKeys("", fieldsDataForCreate)
                if (productId && createValues) {
                    createValues["product"] = productId
                }
                if (productCategory && createValues) {
                    createValues["productCategory"] = productCategory
                }
                setInitialData({
                    fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                    values: createValues
                });
                setFormValues(createValues)
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [productInventoryId]);

    const handleSubmit = (values) => {
        setLoading(true)
        if (productInventoryId && isClone === false) {
            values._id = productInventoryId
            axiosInstance().put(`${productInventory.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`${productInventory.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess(data)
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
    };


    // const setDescription = (setValue) => {
    //     const value = Object.values(desc).join(" - ")
    //     setValue("description", value);
    // }
    const handleValuesChange = (data) => {
        setFormValues((prevState) => ({
            ...prevState,
            ...data
        }))
    }

    const isFieldNotTouched = (initialData, values) => {
        return Object.values(
            simplifyValues(initialData.values, initialData?.fields[0]?.sectionFields || [])
        ).toString() ===
            Object.values(
                simplifyValues(values, initialData?.fields[0]?.sectionFields || [])
            ).toString()
    }

    return (<Dialog
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                setShowConfirmDialog(true)
            }
        }}
        fullWidth
    >
        {initialData && initialData.fields.length ?
            <Formik
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
                onSubmit={handleSubmit}
            >
                {({ values,
                    errors,
                    touched,
                    setFieldValue,
                    submitForm,
                }) => (
                    <Fragment>
                        <CustomDialogHeader title={productInventoryId ? (isClone ? "Clone" : "Update " + routes.productInventory.title) : "Create " + routes.productInventory.title}
                            onClose={() => {
                                if (isFieldNotTouched(initialData, values)) onClose()
                                else setShowConfirmDialog(true)
                            }}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                        ></CustomDialogHeader>
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate >
                                <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                {initialData.fields.length > 0 &&
                                    initialData.fields.map((form, i) => (
                                        <div key={i}>
                                            <h2 className="form-label-style">{form.name}</h2>
                                            <Box marginY={2}>
                                                <Grid spacing={3} container>
                                                    {form.sectionFields.map((field, index2) => (
                                                        <Grid key={index2} item xs={12} sm={6} md={6}>
                                                            {field.fieldName === "product" ?
                                                                <FormTypes
                                                                    isNew={Boolean(productInventoryId)}
                                                                    {...field}
                                                                    disabled={productId ? true : Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                                                    values={values}
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    label={field.fieldLabel}
                                                                    name={field.fieldName}
                                                                    type={field.type}
                                                                    options={
                                                                        values?.productCategory
                                                                            ? field?.option.filter((opt) => opt?.productCategory === values?.productCategory)
                                                                            : field?.option
                                                                    }
                                                                    setFieldValue={(name, value) => {
                                                                        handleValuesChange({ [name]: value })
                                                                        setFieldValue(name, value)
                                                                    }}
                                                                    required={field.required}
                                                                    fullWidth
                                                                    isTooltip={field?.isTooltip || false}
                                                                    tooltipMessage={field?.tooltipMessage}
                                                                    size="small"
                                                                    onChange={(_, val) => {
                                                                        const value = val && val.optionValue ? val.optionValue : ''
                                                                        const label = val && val.optionLabel ? val.optionLabel : ''
                                                                        const productCategory = val && val?.productCategory ? val?.productCategory : ''
                                                                        setFieldValue(field.fieldName, value);
                                                                        setFieldValue("productCategory", productCategory);
                                                                        handleValuesChange({
                                                                            [field.fieldName]: value,
                                                                            productCategory: productCategory
                                                                        })
                                                                        const productLabel = productCategory ? productCategoryOptions.find(obj => obj.optionValue === productCategory).optionLabel : ""
                                                                        // desc.product = label
                                                                        // desc.productCategory = productLabel
                                                                        // setDescription(setFieldValue)

                                                                    }}
                                                                />
                                                                : field.fieldName === "productCategory" ?
                                                                    <FormTypes
                                                                        isNew={Boolean(productInventoryId)}
                                                                        {...field}
                                                                        disabled={productCategory ? true : Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={field.option}
                                                                        // setFieldValue={(name, value) => {
                                                                        //             handleValuesChange({[name]: value })
                                                                        // setFieldValue(name, value)
                                                                        // }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        onChange={(_, val) => {
                                                                            const value = val && val.optionValue ? val.optionValue : ''
                                                                            const label = val && val.optionLabel ? val.optionLabel : ''
                                                                            // desc.productCategory = label
                                                                            setFieldValue(field.fieldName, value);
                                                                            handleValuesChange({ [field.fieldName]: value })
                                                                            // setDescription(setFieldValue)
                                                                        }}
                                                                    />
                                                                    : field.fieldName === "serialNumber" ?
                                                                        <FormTypes
                                                                            isNew={Boolean(productInventoryId)}
                                                                            {...field}
                                                                            disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                                                            values={values}
                                                                            errors={errors}
                                                                            touched={touched}
                                                                            label={field.fieldLabel}
                                                                            name={field.fieldName}
                                                                            type={field.type}
                                                                            options={field.option}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            onChange={(e) => {
                                                                                const val = (e.target.value.trim())
                                                                                setFieldValue(field.fieldName, val)
                                                                                handleValuesChange({ [field.fieldName]: val })
                                                                                // desc.serialNumber = val
                                                                                // setDescription(setFieldValue)
                                                                            }}
                                                                        />
                                                                        : field.fieldName === "description" ?
                                                                            <FormTypes
                                                                                isNew={Boolean(productInventoryId)}
                                                                                {...field}
                                                                                disabled={true}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={field.option}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={field?.isTooltip || false}
                                                                                tooltipMessage={field?.tooltipMessage}
                                                                                size="small"
                                                                            />
                                                                            : <FormTypes
                                                                                isNew={Boolean(productInventoryId)}
                                                                                {...field}
                                                                                disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={field.option}
                                                                                setFieldValue={(name, value) => {
                                                                                    handleValuesChange({ [name]: value })
                                                                                    setFieldValue(name, value)
                                                                                }}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={field?.isTooltip || false}
                                                                                tooltipMessage={field?.tooltipMessage}
                                                                                size="small"

                                                                            />}
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        </div>
                                    ))}
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button size="small" color="primary"
                                onClick={() => {
                                    if (isFieldNotTouched(initialData, values)) onClose()
                                    else setShowConfirmDialog(true)
                                }}
                            >Cancel</Button>
                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                            > Save</CustomButton>
                        </CustomDialogFooter>

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
                                        onClose()
                                    }}
                                /> : null
                        }
                    </Fragment>
                )}
            </Formik>
            :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>}
    </Dialog>
    );
}

export default ManageProductInventory;
