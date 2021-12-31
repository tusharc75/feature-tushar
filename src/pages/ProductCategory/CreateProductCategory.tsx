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
import { CustomDialogTransition, isFieldNotTouched } from "./../../constants/helpers";
import InputField from "../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box } from '@material-ui/core';
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"

const CreateProductCategory = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productCategoryId, onClose, onSuccess, isUpdateDisabled = false, isClone = false } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [formValues, setFormValues] = useState({})
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    useEffect(() => {
        axiosInstance().get("/field?resource=Product Category").then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (productCategoryId) {
                axiosInstance().get(`/product-category/` + productCategoryId).then(({ data: { data } }) => {
                    let tempOptionArray = fieldsDataForUpdate.find(d => d.fieldName === "parentCategory").option
                    fieldsDataForUpdate.find(d => d.fieldName === "parentCategory").option = tempOptionArray.filter(data => data.optionValue !== productCategoryId)
                    const { name, ...rest } = data
                    if (isClone) {
                        setInitialData({
                            fields: fieldsDataForCreate,
                            values: getObjKeysWithValues({ ...rest }, fieldsDataForCreate),
                        });
                        setFormValues(getObjKeysWithValues({ ...rest }, fieldsDataForCreate))
                    }
                    else {
                        setInitialData({
                            fields: fieldsDataForUpdate,
                            values: getObjKeysWithValues(data, fieldsDataForUpdate),
                        });
                        setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate))
                    }

                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: getObjKeys("", fieldsDataForCreate),
                });
                setFormValues(getObjKeys("", fieldsDataForCreate))
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [productCategoryId]);


    const handleSubmit = (values) => {
        if (productCategoryId && !isClone) {
            values._id = productCategoryId
            axiosInstance().put(`/product-category`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`/product-category`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess(data)
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: "Product Category Created Successfully",
                });
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

    const handleValuesChange = (data) => {
        setFormValues((prevState) => ({
            ...prevState,
            ...data
        }))
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
                enableReinitialize={true}
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
                validateOnMount
                onSubmit={handleSubmit}>
                {({ values,
                    errors,
                    touched,
                    setFieldValue,
                    submitForm,
                }) => (
                    <Fragment>
                        <CustomDialogHeader
                            title={isClone ? "Clone" : productCategoryId ? !isUpdateDisabled ? "Update " + routes.productCategory.title : values["name"] : "Create " + routes.productCategory.title}
                            onClose={() => {
                                if (isFieldNotTouched({
                                    initialValues: initialData.values,
                                    fields: initialData.fields
                                }, values)) onClose()
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
                                {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}

                                <InputField
                                    disabled={isUpdateDisabled}
                                    errors={errors}
                                    values={values}
                                    setFieldValue={(name, value) => {
                                        handleValuesChange({ [name]: value })
                                        setFieldValue(name, value)
                                    }}
                                    touched={touched}
                                    fieldsData={initialData.fields}
                                    size="small"
                                    fullWidth
                                />
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button size="small" color="primary"
                                onClick={() => {
                                    if (isFieldNotTouched({
                                        initialValues: initialData.values,
                                        fields: initialData.fields
                                    }, values)) onClose()
                                    else setShowConfirmDialog(true)
                                }}

                            >{isUpdateDisabled ? "Close" : "Cancel"}</Button>
                            {!isUpdateDisabled &&
                                <CustomButton
                                    loading={loading}
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    onClick={submitForm}
                                > Save
                                </CustomButton>
                            }
                        </CustomDialogFooter>
                        {
                            showConfirmDialog ?
                                <ConfirmCancelDialog
                                    close={() => setShowConfirmDialog(false)}
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
    </Dialog >
    );
}

export default CreateProductCategory;
