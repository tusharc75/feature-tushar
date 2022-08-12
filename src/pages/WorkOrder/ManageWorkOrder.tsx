import { useState, useEffect, useContext, useRef, Fragment } from "react";
import { Box, Dialog, Button, Grid, Tooltip, IconButton } from '@material-ui/core';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { isMobile, isTablet } from "react-device-detect";
import {
    getOwnerDropdownDataSource,
    getCollaboratorDropdownDataSource,
    CustomDialogTransition, setFieldsInAscendingOrder, generateUniqueIdOnly
} from "../../constants/helpers";
import {
    getObjKeysWithValues, getObjKeys, yupSchema, workOrder, sidebarResource
} from "../../constants/helpers";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import FormTypes from "../../components/Helpers/FormTypes";
import { FaDiceOne } from "react-icons/fa";
import moment from "moment";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { isEqual } from 'lodash';
import CustomButton from '../../components/Helpers/CustomButton'
import routes from "src/components/Helpers/Routes";
import { useHistory } from 'react-router-dom';

const ManageWorkOrder = ({ onClose, onSuccess, workOrderId = null, refrenceType = null, refrenceData = null,
    products = null }) => {

    const { state: { user } }: any = useData();
    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
    const [workOrderData, setWorkOrderData] = useState<any>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [isSubmitting, setSubmitting] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);

    const ref = useRef(null);

    useEffect(() => {
        const fields = initialData.fields
        if (fields.length > 0) {
            const ownerCollabOptions = fields.filter(
                (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
            );
            if (ownerCollabOptions.length > 0) {
                setOwnerCollaboratorData(ownerCollabOptions[0].option);
                setOwnerData(ownerCollabOptions[0].option);
                setCollaboratorData(ownerCollabOptions[0].option);
            }
            const modifiedData = setFieldsInAscendingOrder(fields)

            const newFilteredData = modifiedData.filter((formData) => {
                if (formData.name.includes("Fields")) {
                    return false
                }
                return true
            })
            setFormsData(newFilteredData);
        }
    }, [initialData.fields, refrenceData]);

    useEffect(() => {
        fetchFields()
    }, [workOrderId, refrenceData]);

    const fetchFields = async () => {
        try {
            let data;
            const response = await axiosInstance().get(`/field?resource=${sidebarResource["workOrder"]}`)
            data = response?.data?.data
            let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            if (workOrderId) {
                let data;
                const response = await axiosInstance().get(`${workOrder.api}/${workOrderId}`)
                data = response?.data?.data
                setWorkOrderData(data)
                setDisableOwnerSelection(workOrderId && user.user._id !== data?.owner?.optionValue);
                setInitialData({
                    fields: fieldsDataForUpdate,
                    values: getObjKeysWithValues(data, fieldsDataForUpdate),
                });
            }
            else {
                const tempInitialData = getObjKeys("", fieldsDataForCreate)
                if (products && refrenceType && refrenceData) {

                    tempInitialData["workOrderNumber"] = `${refrenceData?.workOrderNumber}_${generateUniqueIdOnly()}`
                    tempInitialData["type"] = refrenceType;
                    tempInitialData["products"] = []
                    products?.forEach((ele) => {
                        tempInitialData["products"].push({ product: ele._id, qty: ele.qty })
                    })

                    if (refrenceData.status) {
                        tempInitialData["status"] = refrenceData.status;
                    }

                }
                else {
                    tempInitialData["workOrderNumber"] = `WO_${generateUniqueIdOnly()}`
                }
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: tempInitialData,
                });
            }
        }
        catch (error) {
            toastConfig.setToastConfig(error);
        }
    }

    const onOwnerDropdownOpen = (selectedCollaborator) => {
        setOwnerData(
            getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData)
        );
    };

    const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
        setCollaboratorData(
            getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData)
        );
    };

    const handleSubmit = async (values) => {
        if (workOrderId) {
            setSubmitting(true);
            values._id = workOrderId
            axiosInstance().put(`${workOrder.api}`, values).then(({ data }) => {
                setLoading(false);
                onSuccess()
                setSubmitting(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });

            }).catch((error) => {
                setLoading(false);
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            setSubmitting(true);
            let updatedValues = { ...values }
            axiosInstance().post(`${workOrder.api}`, updatedValues).then(({ data }) => {
                setLoading(false);
                onSuccess(data?.data)
                history.push(`${routes.workOrderDetail.path}/${data._id}`);
                setSubmitting(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
            }).catch((error) => {
                setLoading(false);
                setSubmitting(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

    function validate(values) {
        const errors = {};
        let startDate = moment(values?.pickUpDate);
        let endDate = moment(values?.deliveryDate);
        if (endDate.diff(startDate, 'days') < 0) {
            errors['pickUpDate'] = 'Please enter valid pick-Up  date';
        }
        return errors;
    }

    const handleScroll = (errors) => {
        const err = Object.keys(errors);
        if (err.length) {
            const input = document.querySelector(
                `input[name=${err[0]}]`,
            );
            input.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'start',
            });
        }
    }

    return (<Dialog
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
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
        {initialData.fields.length ? (
            <Formik
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
                onSubmit={handleSubmit}
                validate={validate}
                innerRef={ref}
            >
                {({ values, errors, setFieldValue, touched, submitForm }) => (
                    <Fragment>
                        <CustomDialogHeader
                            onClose={() => {
                                if (!isEqual(ref.current.values, initialData.values)) {
                                    setShowConfirmDialog(true)
                                }
                                else {
                                    onClose()
                                }
                            }}
                            title={`${workOrderId ? `Update ${initialData.values?.workOrderNumber ? `(${initialData.values?.workOrderNumber})` : ""}`
                                : `Create Transaction Ticket`}`}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                        />
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate >
                                {formsData &&
                                    formsData.map((form, index1) => {
                                        return form.name ? (
                                            <div key={index1}>
                                                <div className="detail-box-content">
                                                    <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                    <h2 className="form-label-style form-label-quotes">{form.name}</h2>
                                                </div>
                                                <Box marginY={2}>
                                                    <Grid spacing={3} container>
                                                        {form.sectionFields.map((field, index2) => (
                                                            <Grid key={index2} item xs={12} sm={6} md={6}>
                                                                {field.fieldName === "owner" ? (
                                                                    <FormTypes
                                                                        fieldData={field}
                                                                        isNew={!workOrderId}
                                                                        {...field}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={ownerData}
                                                                        onChange={(e, val) => {
                                                                            setFieldValue(
                                                                                field.fieldName,
                                                                                val && val.optionValue
                                                                                    ? val.optionValue
                                                                                    : ""
                                                                            );

                                                                            if (
                                                                                val &&
                                                                                val.optionValue !== user?.user?._id
                                                                            ) {
                                                                                const checkOwnerAddedInCollaborator =
                                                                                    values["collaborator"].find(
                                                                                        (d) =>
                                                                                            d?.optionValue ===
                                                                                            user?.user?._id
                                                                                    );
                                                                                if (
                                                                                    !checkOwnerAddedInCollaborator
                                                                                ) {
                                                                                    setFieldValue("collaborator", [
                                                                                        ...values["collaborator"],
                                                                                        collaboratorData.find(
                                                                                            (d) =>
                                                                                                d?.optionValue ===
                                                                                                user?.user?._id
                                                                                        ).optionValue,
                                                                                    ]);
                                                                                }
                                                                            }
                                                                        }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        disabled={disableOwnerSelection || (workOrderId && field.disableOnEdit)}
                                                                        onOpen={() => {
                                                                            onOwnerDropdownOpen(
                                                                                values["collaborator"]
                                                                            );
                                                                        }}
                                                                    />
                                                                ) : field.fieldName === "collaborator" ? (
                                                                    <FormTypes
                                                                        fieldData={field}
                                                                        isNew={!workOrderId}
                                                                        {...field}
                                                                        disabled={workOrderId && field.disableOnEdit}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={collaboratorData}
                                                                        setFieldValue={(name, value) => {
                                                                            setFieldValue(name, value)
                                                                        }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        onOpen={() => {
                                                                            onCollabOwnerMultiselectOpen(
                                                                                values["owner"]
                                                                            );
                                                                        }}
                                                                    />
                                                                ) : <FormTypes
                                                                    {...field}
                                                                    fieldData={field}
                                                                    isNew={!Boolean(workOrderId)}
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
                                                                    imageOrFileUploadCompletePercentage={null}
                                                                />}
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            </div>
                                        ) : (
                                            form.sectionFields.map((field) => (
                                                <FormTypes
                                                    {...field}
                                                    fieldData={field}
                                                    disabled={Boolean(workOrderId) && field.disableOnEdit}
                                                    isNew={Boolean(workOrderId)}
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
                                                    style={{ visibility: "hidden" }}
                                                />
                                            ))
                                        );
                                    })}
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                disabled={isSubmitting || loading}
                                onClick={() => {
                                    if (!isEqual(ref.current.values, initialData.values)) {
                                        setShowConfirmDialog(true)
                                    }
                                    else {
                                        onClose()
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <CustomButton
                                disabled={isSubmitting || loading}
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleScroll(errors)
                                    submitForm();
                                }}
                            > Save</CustomButton>
                        </CustomDialogFooter>
                        {
                            showConfirmDialog ?
                                <ConfirmCancelDialog
                                    close={() => setShowConfirmDialog(false)}
                                    open={showConfirmDialog}
                                    onSave={() => {
                                        setShowConfirmDialog(false)
                                        handleScroll(errors)
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
        ) :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
    </Dialog>
    );
}

export default ManageWorkOrder;
