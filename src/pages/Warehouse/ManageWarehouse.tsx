import { useState, useEffect, Fragment, useContext } from "react";
import { Box, Dialog, Button, CircularProgress } from '@material-ui/core';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../constants/helpers";
import InputField from "../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema, isFieldNotTouched, sidebarResource } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"

const ManageWarehouse = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { addressResource, close, onSuccess, isClone = false, open } = props;
    const [cloneHeading,setCloneHeading] = useState('')
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    

    useEffect(() => {
        axiosInstance().get("/field?resource=Warehouse").then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (addressResource) {
                axiosInstance().get(`/warehouse/` + addressResource?.id).then(({ data: { data } }) => {
                    let fields = fieldsDataForUpdate
                    let tempData = data
                    if (isClone) {
                        fields = fieldsDataForCreate
                        const { warehouseName, ...rest } = data
                        setCloneHeading(warehouseName);
                        tempData = { ...rest }
                    }
                    setInitialData({
                        fields: fields,
                        values: getObjKeysWithValues(tempData, fields),
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: getObjKeys("", fieldsDataForCreate),
                });
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [addressResource]);


    const handleSubmit = (values) => {
        setSubmitting(true)
        if (addressResource?.id && !isClone) {
            values._id = addressResource?.id
            axiosInstance().put(`/warehouse`, values).then(({ data }) => {
                setSubmitting(false);
                onSuccess()
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
            }).catch((error) => {
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`/warehouse`, values).then(({ data }) => {
                setSubmitting(false);
                onSuccess(data)
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
            }).catch((error) => {
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

    return (<Dialog
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={open}
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
                            title={isClone ? `Clone - [${cloneHeading}]` : addressResource?.id ? `Update ${initialData?.values["warehouseName"] ?? ""}` : "Create Plant"}
                            onClose={() => {
                                if (isFieldNotTouched({
                                    initialValues: initialData.values,
                                    fields: initialData.fields
                                }, values)) close()
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
                                disabled={submitting}
                                onClick={() => {
                                    if (isFieldNotTouched({
                                        initialValues: initialData.values,
                                        fields: initialData.fields
                                    }, values)) close()
                                    else setShowConfirmDialog(true)
                                }}
                            >Cancel</Button>
                            <Button
                                disabled={loading || submitting}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                                endIcon={submitting && <CircularProgress color='inherit' size={18} />}
                            > Save</Button>
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
                                        close()
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

export default ManageWarehouse;
