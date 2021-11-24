import { useState, useEffect, useContext } from "react";
import { Box, Dialog, Button, Grid, CircularProgress } from '@material-ui/core';
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
} from "./../../constants/helpers";
import { getObjKeysWithValues, getObjKeys, yupSchema, deliveryTicket, isFieldNotTouched, sidebarResource } from "../../constants/helpers";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import Skeleton from "@material-ui/lab/Skeleton/Skeleton";
import FormTypes from "../../components/Helpers/FormTypes";
import { FaDiceOne } from "react-icons/fa";
import moment from "moment";
import { useData } from "../../StateProvider/Provider";

const ManageDeliveryTicket = (props) => {

    const {
        state: { user },
    }: any = useData();

    const toastConfig = useContext(CustomToastContext)
    const { deliveryTicketApi } = deliveryTicket;
    const { deliveryTicketId, onClose, onSuccess, warehouseId = null, productInventoryForDeliveryTicket = null, rentalData = null } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [isSubmitting, setSubmitting] = useState(false);
    const [formValues, setFormValues] = useState({})
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const [
        ownerCollaboratorCommonDataSource,
        setOwnerCollaboratorCommonDataSource,
    ] = useState([]);
    const [ownerDataSource, setOwnerDataSource] = useState([]);
    const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);
    const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);

    useEffect(() => {
        if (initialData.fields.length > 0) {

            const ownerCollabOptions = initialData.fields.filter(
                (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
            );
            if (ownerCollabOptions.length > 0) {
                setOwnerCollaboratorData(ownerCollabOptions[0].option);
                setOwnerData(ownerCollabOptions[0].option);
                setCollaboratorData(ownerCollabOptions[0].option);
            }

            setFormsData(setFieldsInAscendingOrder(initialData.fields));
        }
    }, [initialData.fields]);

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

    useEffect(() => {
        axiosInstance().get(`/field?resource=${sidebarResource["deliveryTicket"]}`).then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (deliveryTicketId) {
                axiosInstance().get(`${deliveryTicketApi}/` + deliveryTicketId).then(({ data: { data } }) => {
                    setDisableOwnerSelection(deliveryTicketId && user.user._id !== data?.owner?.optionValue);

                    setInitialData({
                        fields: fieldsDataForUpdate,
                        values: getObjKeysWithValues(data, fieldsDataForUpdate),
                    });
                    setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate))
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                if (productInventoryForDeliveryTicket && rentalData) {
                    const tempInitialData = getObjKeys("", fieldsDataForCreate)
                    tempInitialData["productInventory"] = productInventoryForDeliveryTicket?.map(d => d?._id)
                    tempInitialData["warehouse"] = warehouseId?.optionValue ? warehouseId?.optionValue : ""
                    tempInitialData["rental"] = rentalData?._id
                    tempInitialData["customerAccount"] = rentalData.customerAccount.optionValue
                    tempInitialData["shippingAddress"] = rentalData.shippingAddress
                    tempInitialData["deliveryJobName"] = `${rentalData?.rentalJobName}_${generateUniqueIdOnly()}`
                    tempInitialData["deliveryDate"] = "";
                    setInitialData({
                        fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "warehouse" && d.fieldName !== "rental"),
                        values: tempInitialData,
                    });
                    setFormValues(tempInitialData)
                }
                else {
                    setInitialData({
                        fields: fieldsDataForCreate,
                        values: getObjKeys("", fieldsDataForCreate),
                    });
                    setFormValues(getObjKeys("", fieldsDataForCreate))
                }
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [deliveryTicketId]);


    const handleSubmit = (values) => {
        if (deliveryTicketId) {
            setSubmitting(true);
            values._id = deliveryTicketId
            axiosInstance().put(`${deliveryTicketApi}`, values).then(({ data }) => {
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
            axiosInstance().post(`${deliveryTicketApi}`, values).then(({ data }) => {
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
        fullWidth
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                setShowConfirmDialog(true)
            }
        }}
    >
        <CustomDialogHeader
            onClose={() => {
                if (isFieldNotTouched({
                    initialValues: initialData.values,
                    fields: initialData.fields
                }, formValues)) onClose()
                else setShowConfirmDialog(true)
            }}
            title={`${deliveryTicketId ? `Update  ` : "Create Loading Ticket"}`}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        />

        {loading || !initialData.fields.length ? (
            <>
                <CustomDialogContent>
                    <Skeleton width="100%" height="70px" />
                    <Grid container spacing={2}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                            <Grid key={i} item xs={12} sm={6} md={6}>
                                <Skeleton width="100%" height="60px" />
                            </Grid>
                        ))}
                    </Grid>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button variant="outlined" size="small" color="primary" disabled
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" size="small" color="primary" disabled>
                        Submit
                    </Button>
                </CustomDialogFooter>
            </>
        ) : (
            <Formik
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
                onSubmit={handleSubmit}
            >
                {({ values, errors, setFieldValue, touched, submitForm }) => (
                    <>
                        <CustomDialogContent>
                            <Form noValidate>
                                {/* <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2> */}
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
                                                                {field.fieldName === "customerAccount" || field.fieldName === "deliveryType" ||
                                                                    field.fieldName === "status" || field.fieldName === "actualDeliveredDate" || field.fieldName === "actualDispatchedDate" ? (
                                                                    <FormTypes
                                                                        {...field}
                                                                        disabled={true}
                                                                        isNew={Boolean(deliveryTicketId)}
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
                                                                        imageOrFileUploadCompletePercentage={null}
                                                                    />
                                                                ) : field.fieldName === "pick-UpDate" ? (
                                                                    <FormTypes
                                                                        {...field}
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
                                                                        minDate={new Date()}
                                                                        maxDate={moment(values["deliveryDate"]).subtract(1, "day")}
                                                                    />
                                                                ) : field.fieldName === "deliveryDate" ? (
                                                                    <FormTypes
                                                                        {...field}
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
                                                                        minDate={moment(values["pick-UpDate"])}
                                                                    />
                                                                ) : field.fieldName === "deliveryJobName" ? (
                                                                    <FormTypes
                                                                        {...field}
                                                                        disabled={true}
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
                                                                    />
                                                                ) : field.fieldName === "owner" ? (
                                                                    <FormTypes
                                                                        isNew={!deliveryTicketId}
                                                                        {...field}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={ownerData}
                                                                        onChange={(e, val) => {
                                                                            handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })
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
                                                                                    handleValuesChange({
                                                                                        "collaborator": collaboratorData.find(
                                                                                            (d) =>
                                                                                                d?.optionValue ===
                                                                                                user?.user?._id
                                                                                        ).optionValue
                                                                                    })
                                                                                }
                                                                            }
                                                                        }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        disabled={disableOwnerSelection || (deliveryTicketId && field.disableOnEdit)}
                                                                        onOpen={() => {
                                                                            onOwnerDropdownOpen(
                                                                                values["collaborator"]
                                                                            );
                                                                        }}
                                                                    />
                                                                ) : field.fieldName === "collaborator" ? (
                                                                    <FormTypes
                                                                        isNew={!deliveryTicketId}
                                                                        {...field}
                                                                        disabled={deliveryTicketId && field.disableOnEdit}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={collaboratorData}
                                                                        setFieldValue={(name, value) => {
                                                                            handleValuesChange({ [name]: value });
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
                                                                    isNew={Boolean(deliveryTicketId)}
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
                                                                    imageOrFileUploadCompletePercentage={null}
                                                                    disabled={(!deliveryTicketId && field.disableOnEdit)}
                                                                />
                                                                }
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            </div>
                                        ) : (
                                            form.sectionFields.map((field) => (
                                                <FormTypes
                                                    {...field}
                                                    disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
                                                    isNew={Boolean(deliveryTicketId)}
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
                                    if (isFieldNotTouched({
                                        initialValues: initialData.values,
                                        fields: initialData.fields
                                    }, values)) onClose()
                                    else setShowConfirmDialog(true)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={submitForm}
                                disabled={isSubmitting || loading}
                            >
                                {isSubmitting ? <CircularProgress size={22} /> : "Submit"}
                            </Button>
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
                    </>
                )}
            </Formik>
        )}
    </Dialog>
    );
}

export default ManageDeliveryTicket;
