import { useState, useEffect, Fragment, useContext } from "react";
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../../components/Helpers/CustomButton'
import routes from "../../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, isFieldNotTouched } from "./../../../constants/helpers";
import InputField from "../../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema, pricingCondition } from "../../../constants/helpers";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import { Box } from '@material-ui/core';
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog"
import { startCase } from 'lodash';

const PricingConditionsDialog = ({ pricingConditionId, onClose, onSuccess, isUpdateDisabled = false, isClone = false }) => {

    const toastConfig = useContext(CustomToastContext)
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    useEffect(() => {
        axiosInstance().get(`/field?resource=${startCase(pricingCondition.resource)}`).then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            if (pricingConditionId) {
                axiosInstance().get(`${pricingCondition.api}/` + pricingConditionId).then(({ data: { data } }) => {
                    if (isClone) {
                        setInitialData({
                            fields: fieldsDataForCreate,
                            values: getObjKeysWithValues(data, fieldsDataForCreate),
                        });
                    }
                    else {
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
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: getObjKeys("", fieldsDataForCreate),
                });
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, []);

    const handleSubmit = (values) => {
        if (pricingConditionId && !isClone) {
            values._id = pricingConditionId
            axiosInstance().put(`${pricingCondition.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`${pricingCondition.api}`, values).then(({ data: { data } }) => {
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
                            title={isClone ? "Clone" : pricingConditionId ? !isUpdateDisabled ? "Update " + routes.pricingCondition.title : values["name"] : "Create " + routes.pricingCondition.title}
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
                                <InputField
                                    disabled={isUpdateDisabled}
                                    errors={errors}
                                    values={values}
                                    setFieldValue={(name, value) => {
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

                            >{"Close"}</Button>
                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                            > Save
                            </CustomButton>
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
    </Dialog >
    );
}

export default PricingConditionsDialog;
