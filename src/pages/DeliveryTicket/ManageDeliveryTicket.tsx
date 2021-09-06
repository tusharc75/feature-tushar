import { useState, useEffect, Fragment, useContext } from "react";
import { Box, Dialog, Button } from '@material-ui/core';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import InputField from "../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema, deliveryTicket, isFieldNotTouched, sidebarResource } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"

const ManageDeliveryTicket = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { deliveryTicketApi } = deliveryTicket;
    const { deliveryTicketId, onClose, onSuccess, warehouseId = null, productInventoryForDeliveryTicket = null } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    useEffect(() => {
        axiosInstance().get(`/field?resource=${sidebarResource["deliveryTicket"]}`).then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (deliveryTicketId) {
                axiosInstance().get(`${deliveryTicketApi}/` + deliveryTicketId).then(({ data: { data } }) => {
                    setInitialData({
                        fields: fieldsDataForUpdate,
                        values: getObjKeysWithValues(data, fieldsDataForUpdate),
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: fieldsDataForCreate.filter(d => d.fieldLabel !== "Product Inventory" && d.fieldLabel !== "Warehouse"),
                    values: getObjKeys("", fieldsDataForCreate),
                });
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [deliveryTicketId]);


    const handleSubmit = (values) => {
        if (deliveryTicketId) {
            values._id = deliveryTicketId
            axiosInstance().put(`${deliveryTicketApi}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {

            if (productInventoryForDeliveryTicket && warehouseId) {
                values.productInventory = productInventoryForDeliveryTicket.map(d => d.inventory._id)
                values.warehouse = warehouseId.optionValue
            }
            axiosInstance().post(`${deliveryTicketApi}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
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
        fullWidth
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                setShowConfirmDialog(true)
            }
        }}
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
                            title={deliveryTicketId ? "Update " + routes.deliveryTicket.title : "Create " + routes.deliveryTicket.title}
                            onClose={() => setShowConfirmDialog(true)}></CustomDialogHeader>
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate >
                                <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                <InputField
                                    errors={errors}
                                    values={values}
                                    setFieldValue={setFieldValue}
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

export default ManageDeliveryTicket;
