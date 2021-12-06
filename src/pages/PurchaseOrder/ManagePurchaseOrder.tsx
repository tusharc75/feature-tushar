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
import { CustomDialogTransition, purchaseOrder, setFieldsInAscendingOrder } from "../../constants/helpers";
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box, Grid } from '@material-ui/core';
import FormTypes from "../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { FaDiceOne } from "react-icons/fa";
import { useHistory } from "react-router-dom";

const ManagePurchaseOrder = ({ isClone = false, purchaseOrderId = null, onClose, onSuccess, productId = null, productCategory = null,
    productsToSave = [], isFromSerializedAssetStepFromRental = false, currency = null, rentalManagementId = null }) => {
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext)
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    useEffect(() => {
        axiosInstance().get("/field?resource=Purchase Order").then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate)
                .map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            if (purchaseOrderId) {
                axiosInstance().get(`${purchaseOrder.api}/` + purchaseOrderId).then(({ data: { data } }) => {
                    if (isClone) {
                        const { _id, createdBy, updatedBy, serialNumber, ...rest } = data

                        setInitialData({
                            fields: fieldsDataForCreate,
                            values: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setLoading(false)
                    } else {
                        setInitialData({
                            fields: fieldsDataForUpdate,
                            values: getObjKeysWithValues(data, fieldsDataForUpdate),
                        });
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
                if (rentalManagementId) {
                    createValues["rentalJob"] = rentalManagementId
                }
                if (currency) {
                    createValues["currency"] = currency
                }
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: createValues
                });
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [purchaseOrderId]);

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }, [initialData.fields]);

    const handleSubmit = (values) => {
        setLoading(true)
        if (purchaseOrderId && isClone === false) {
            values._id = purchaseOrderId
            axiosInstance().put(`${purchaseOrder.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            if (isFromSerializedAssetStepFromRental) {
                axiosInstance().post(`${purchaseOrder.api}/create-po-with-asset`, { purchaseOrder: values, products: productsToSave }).then(({ data: { data } }) => {
                    onSuccess();
                    setLoading(false);
                }).catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
            } else {
                axiosInstance().post(`${purchaseOrder.api}`, values).then(({ data: { data } }) => {
                    setLoading(false);
                    // onSuccess(data)
                    history.push(`${purchaseOrder.api}/detail/${data._id}`);
                }).catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
            }
        }
    };


    const isFieldNotTouched = (initialData, values) => {
        return Object.values(
            simplifyValues(initialData.values, formsData[0]?.sectionFields || [])
        ).toString() ===
            Object.values(
                simplifyValues(values, formsData[0]?.sectionFields || [])
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
        {formsData && formsData.length ?
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
                        <CustomDialogHeader title={purchaseOrderId ? (isClone ? "Clone" : "Update " + routes.purchaseOrder.title) : "Create " + routes.purchaseOrder.title}
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
                                {formsData.length > 0 &&
                                    formsData.map((form, i) => (
                                        <div key={i}>
                                            <div className={"detail-box-content"}>
                                                <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                                            </div>

                                            <Box marginY={2}>
                                                <Grid spacing={3} container>
                                                    {form.sectionFields.map((field, index2) => (
                                                        <Grid key={index2} item xs={12} sm={6} md={6}>
                                                            {field.fieldName === "rentalJob" ? <FormTypes
                                                                isNew={Boolean(purchaseOrderId)}
                                                                {...field}
                                                                disabled={(Boolean(purchaseOrderId) && field.disableOnEdit && !isClone) || rentalManagementId}
                                                                values={values}
                                                                errors={errors}
                                                                touched={touched}
                                                                label={field.fieldLabel}
                                                                name={field.fieldName}
                                                                type={field.type}
                                                                options={field.option}
                                                                setFieldValue={(name, value) => {
                                                                    setFieldValue(name, value)
                                                                }}
                                                                required={field.required}
                                                                fullWidth
                                                                isTooltip={field?.isTooltip || false}
                                                                tooltipMessage={field?.tooltipMessage}
                                                                size="small"
                                                            /> :
                                                                field.fieldName === "supplierContact" ? <FormTypes
                                                                    isNew={Boolean(purchaseOrderId)}
                                                                    {...field}
                                                                    values={values}
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    label={field.fieldLabel}
                                                                    name={field.fieldName}
                                                                    type={field.type}
                                                                    options={field.option.filter(d => d.parentAccount === values["supplier"])}
                                                                    setFieldValue={(name, value) => {
                                                                        setFieldValue(name, value)
                                                                    }}
                                                                    required={field.required}
                                                                    fullWidth
                                                                    isTooltip={field?.isTooltip || false}
                                                                    tooltipMessage={field?.tooltipMessage}
                                                                    size="small"
                                                                /> : <FormTypes
                                                                    isNew={Boolean(purchaseOrderId)}
                                                                    {...field}
                                                                    disabled={Boolean(purchaseOrderId) && field.disableOnEdit && !isClone}
                                                                    values={values}
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    label={field.fieldLabel}
                                                                    name={field.fieldName}
                                                                    type={field.type}
                                                                    options={field.option}
                                                                    setFieldValue={(name, value) => {
                                                                        // handleValuesChange({ [name]: value })
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
                                disabled={
                                    loading ||
                                    isFieldNotTouched(initialData, values)
                                }
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

export default ManagePurchaseOrder;
