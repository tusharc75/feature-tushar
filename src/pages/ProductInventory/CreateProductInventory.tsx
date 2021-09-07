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
import { CustomDialogTransition, productInventory, setFieldsInAscendingOrder } from "./../../constants/helpers";
import InputField from "../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box, Grid } from '@material-ui/core';
import FormTypes from "../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"

const CreateProductInventory = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productInventoryId, onClose, onSuccess } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    useEffect(() => {
        axiosInstance().get("/field?resource=Product Inventory").then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (productInventoryId) {
                axiosInstance().get(`${productInventory.api}/` + productInventoryId).then(({ data: { data } }) => {
                    setInitialData({
                        fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                        values: getObjKeysWithValues(data, fieldsDataForUpdate),
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                    values: getObjKeys("", fieldsDataForCreate),
                });
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [productInventoryId]);


    const handleSubmit = (values) => {
        if (productInventoryId) {
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

    return (<Dialog
        maxWidth="md"
        fullScreen={isMobile || isTablet}
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
                        <CustomDialogHeader title={productInventoryId ? "Update " + routes.productInventory.title : "Create " + routes.productInventory.title}
                            onClose={() => {
                                setShowConfirmDialog(true)
                            }}
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
                                                                    disabled={!productInventoryId && field.disableOnEdit || !Boolean(values?.productCategory)}
                                                                    values={values}
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    label={field.fieldLabel}
                                                                    name={field.fieldName}
                                                                    type={field.type}
                                                                    options={values.productCategory ? field.option.filter(o => o.productCategory === values.productCategory) : []}
                                                                    setFieldValue={setFieldValue}
                                                                    required={field.required}
                                                                    fullWidth
                                                                    isTooltip={field?.isTooltip || false}
                                                                    tooltipMessage={field?.tooltipMessage}
                                                                    size="small"
                                                                    imageOrFileUploadCompletePercentage={null}
                                                                />

                                                                : <FormTypes
                                                                    isNew={Boolean(productInventoryId)}
                                                                    {...field}
                                                                    disabled={!productInventoryId && field.disableOnEdit}
                                                                    values={values}
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    label={field.fieldLabel}
                                                                    name={field.fieldName}
                                                                    type={field.type}
                                                                    options={field.option}
                                                                    setFieldValue={setFieldValue}
                                                                    required={field.required}
                                                                    fullWidth
                                                                    isTooltip={field?.isTooltip || false}
                                                                    tooltipMessage={field?.tooltipMessage}
                                                                    size="small"
                                                                    imageOrFileUploadCompletePercentage={null}
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
                                    setShowConfirmDialog(true)
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

export default CreateProductInventory;
