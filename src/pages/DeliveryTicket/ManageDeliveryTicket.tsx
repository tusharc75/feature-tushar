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
    const { deliveryTicketId = null, ticketType, refrenceType = null, refrenceData = null, productInventory = null, onClose, onSuccess,
        warehouseId = null, rentalData = null, transferData = null, repairJobData = null } = props;

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [isSubmitting, setSubmitting] = useState(false);
    const [formValues, setFormValues] = useState({})
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);

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
                if (refrenceType === "Transfer Asset") {
                    if (refrenceData?.transferType === "Internal") {
                        if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
                            return false
                        }
                    }
                    if (refrenceData?.transferType.includes("External Supplier")) {
                        if (formData.name.includes("Customer") || formData.name.includes("Plant")) {
                            return false
                        }
                    }
                    if (refrenceData?.transferType.includes("External Customer")) {
                        if (formData.name.includes("Supplier") || formData.name.includes("Plant")) {
                            return false
                        }
                    }
                }
                if (refrenceType === "Repair Job") {
                    if (ticketType === "Loading") {
                        if (repairJobData?.typeOfRepair === "Internal") {
                            if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
                                return false
                            }
                        }
                        if (repairJobData?.typeOfRepair === "External") {
                            if (formData.name.includes("Customer") || formData.name.includes("Receiving Plant")) {
                                return false
                            }
                        }
                    }
                    else if (ticketType === "Receiving") {
                        if (repairJobData?.typeOfRepair === "Internal") {
                            if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
                                return false
                            }
                        }
                        if (repairJobData?.typeOfRepair === "External") {
                            if (formData.name.includes("Customer") || formData.name.includes("Pickup Plant")) {
                                return false
                            }
                        }
                    }
                }
                if (refrenceType === "Rental Job") {
                    if (ticketType === "Loading") {
                        if (formData.name.includes("Supplier") || formData.name.includes("Receiving Plant")) {
                            return false
                        }
                    }
                    else if (ticketType === "Receiving") {
                        if (formData.name.includes("Supplier") || formData.name.includes("Pickup Plant")) {
                            return false
                        }
                    }
                }
                return true
            })
            setFormsData(newFilteredData);
        }
    }, [initialData.fields, refrenceData]);

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
                if (productInventory && refrenceType === "Rental Job" && refrenceData) {
                    console.log(refrenceData)
                    const tempInitialData = getObjKeys("", fieldsDataForCreate)
                    tempInitialData["ticketName"] = `${refrenceData?.rentalJobName}_${generateUniqueIdOnly()}`
                    tempInitialData["type"] = refrenceType;
                    tempInitialData["ticketType"] = ticketType;
                    tempInitialData["productInventory"] = productInventory?.map(d => d?._id)
                    tempInitialData["rentalJob"] = refrenceData?._id
                    if (ticketType === "Loading") {
                        tempInitialData["pickupPlant"] = refrenceData?.warehouse?.optionValue ? refrenceData?.warehouse?.optionValue : ""
                        fieldsDataForCreate?.forEach((e) => {
                            if (e.fieldName === "pickupPlant") {
                                const plantAddress = e?.option?.filter((e) => e.optionValue === refrenceData?.warehouse?.optionValue)
                                if (plantAddress.length) {
                                    tempInitialData["pickupPlantAddress"] = plantAddress[0].address
                                }
                            }
                        })
                    }
                    else if (ticketType === "Receiving") {
                        tempInitialData["receivingPlant"] = refrenceData?.warehouse?.optionValue ? refrenceData?.warehouse?.optionValue : ""
                        fieldsDataForCreate?.forEach((e) => {
                            if (e.fieldName === "pickupPlant") {
                                const plantAddress = e?.option?.filter((e) => e.optionValue === refrenceData?.warehouse?.optionValue)
                                if (plantAddress.length) {
                                    tempInitialData["receivingPlantAddress"] = plantAddress[0].address
                                }
                            }
                        })
                    }
                    tempInitialData["customerAccount"] = refrenceData.customerAccount?.optionValue
                    tempInitialData["customerShippingAddress"] = refrenceData.shippingAddress?.optionValue
                    tempInitialData["pick-UpDate"] = moment(refrenceData?.estimateStartDate).subtract(1, 'days');
                    tempInitialData["deliveryDate"] = moment(refrenceData?.estimateStartDate).subtract(1, 'days');
                    setInitialData({
                        fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "rental"),
                        values: tempInitialData,
                    });
                    setFormValues(tempInitialData)
                }
                else if (productInventory && refrenceType === "Repair Job" && refrenceData) {
                    const tempInitialData = getObjKeys("", fieldsDataForCreate)
                    tempInitialData["ticketName"] = `${refrenceData?.repairJobName}_${generateUniqueIdOnly()}`
                    tempInitialData["type"] = refrenceType;
                    tempInitialData["ticketType"] = ticketType;
                    tempInitialData["productInventory"] = productInventory?.map(d => d?._id)
                    tempInitialData["repairJob"] = refrenceData?._id
                    tempInitialData["deliveryDate"] = moment(new Date()).add(7, 'days');

                    tempInitialData["pickupPlant"] = refrenceData?.repairPlant?.optionValue;
                    tempInitialData["pickupPlantAddress"] = refrenceData?.plantShipTo?.optionValue;

                    if (ticketType === "Loading") {

                        if (refrenceData?.typeOfRepair === "Internal") {
                            tempInitialData["receivingPlant"] = refrenceData?.plant?.optionValue;

                            const receivingPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "receivingPlant")?.option;

                            if (receivingPlantAddresses && refrenceData["plant"]) {
                                const address = receivingPlantAddresses.find(f => f.optionValue === refrenceData["plant"]?.optionValue);
                                if (address) {
                                    tempInitialData["receivingPlantAddress"] = address.address;
                                }
                            }
                        }
                        if (refrenceData?.typeOfRepair === "External") {
                            tempInitialData["supplierAccount"] = refrenceData?.supplier?.optionValue;
                            tempInitialData["supplierShippingAddress"] = refrenceData?.supplierShipTo?.optionValue;
                        }

                        // tempInitialData["pickupPlant"] = refrenceData?.warehouse?.optionValue ? refrenceData?.warehouse?.optionValue : ""
                        // fieldsDataForCreate?.forEach((e) => {
                        //     if (e.fieldName === "pickupPlant") {
                        //         const plantAddress = e?.option?.filter((e) => e.optionValue === refrenceData?.warehouse?.optionValue)
                        //         if (plantAddress.length) {
                        //             tempInitialData["pickupPlantAddress"] = plantAddress[0].address
                        //         }
                        //     }
                        // })

                        // tempInitialData["warehouse"] = warehouseId?.optionValue ? warehouseId?.optionValue : ""
                        // const pickupPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "warehouse")?.option;
                        // if (pickupPlantAddresses && tempInitialData["warehouse"]) {
                        //     const address = pickupPlantAddresses.find(f => f.optionValue === tempInitialData["warehouse"]);
                        //     if (address) {
                        //         tempInitialData["pickupPlantAddress"] = address.address;
                        //     }
                        // }
                    }
                    else if (ticketType === "Receiving") {
                        // tempInitialData["warehouse"] = repairJobData?.plant?.optionValue ?? "";

                        if (repairJobData?.typeOfRepair === "Internal") {
                            // tempInitialData["pickupPlant"] = repairJobData?.repairPlant?.optionValue;
                            // tempInitialData["pickupPlantAddress"] = repairJobData?.plantShipTo?.optionValue;
                            tempInitialData["receivingPlant"] = refrenceData?.plant?.optionValue;

                            const receivingPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "receivingPlant")?.option;

                            if (receivingPlantAddresses && refrenceData["plant"]) {
                                const address = receivingPlantAddresses.find(f => f.optionValue === refrenceData["plant"]?.optionValue);
                                if (address) {
                                    tempInitialData["receivingPlantAddress"] = address.address;
                                }
                            }

                        }
                        if (repairJobData?.typeOfRepair === "External") {
                            tempInitialData["supplierAccount"] = refrenceData?.supplier?.optionValue;
                            tempInitialData["supplierShippingAddress"] = refrenceData?.supplierShipTo?.optionValue;
                        }


                        // tempInitialData["receivingPlant"] = refrenceData?.warehouse?.optionValue ? refrenceData?.warehouse?.optionValue : ""
                        // fieldsDataForCreate?.forEach((e) => {
                        //     if (e.fieldName === "pickupPlant") {
                        //         const plantAddress = e?.option?.filter((e) => e.optionValue === refrenceData?.warehouse?.optionValue)
                        //         if (plantAddress.length) {
                        //             tempInitialData["receivingPlantAddress"] = plantAddress[0].address
                        //         }
                        //     }
                        // })
                    }

                    setInitialData({
                        fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "repairJob"),
                        values: tempInitialData,
                    });
                    setFormValues(tempInitialData)
                }
                if (productInventory && refrenceType === "Transfer Asset" && refrenceData) {
                    const tempInitialData = getObjKeys("", fieldsDataForCreate)
                    tempInitialData["ticketName"] = `${refrenceData?.transferAssetNumber}_${generateUniqueIdOnly()}`
                    tempInitialData["type"] = refrenceType;
                    tempInitialData["ticketType"] = ticketType;
                    tempInitialData["productInventory"] = productInventory?.map(d => d?._id)
                    tempInitialData["pickupPlant"] = warehouseId;
                    tempInitialData["pickupPlantAddress"] = refrenceData?.transferFromPlant.address ?? "";
                    tempInitialData["transferAsset"] = refrenceData?._id;
                    tempInitialData["deliveryDate"] = moment(new Date()).add(7, 'days');
                    if (refrenceData?.transferType === "Internal") {
                        tempInitialData["receivingPlant"] = refrenceData?.transferToPlant?.optionValue;
                        tempInitialData["plantShipTo"] = refrenceData?.plantShipTo;
                    }
                    if (refrenceData?.transferType === "External Customer") {
                        tempInitialData["customerAccount"] = refrenceData?.transferToCustomer?.optionValue;
                        tempInitialData["customerShippingAddress"] = refrenceData?.customerShipTo;
                    }
                    if (refrenceData?.transferType === "External Supplier") {
                        tempInitialData["supplierAccount"] = refrenceData?.transferToSupplier?.optionValue;
                        tempInitialData["supplierShippingAddress"] = refrenceData?.supplierShipTo;
                    }
                    setInitialData({
                        fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "transferAsset"),
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
    }, [deliveryTicketId, refrenceData]);


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
            let updatedValues = { ...values }
            updatedValues["status"] = "New";
            axiosInstance().post(`${deliveryTicketApi}`, updatedValues).then(({ data }) => {
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

    function validate(values) {
        const errors = {};
        let startDate = moment(values?.["pick-UpDate"]);
        let endDate = moment(values?.deliveryDate);
        if (endDate.diff(startDate, 'days') < 0) {
            errors['pick-UpDate'] = 'Please enter valid pick-Up  date';
        }
        return errors;
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
            title={`${deliveryTicketId ? `Update ${initialData.values?.ticketName ? `(${initialData.values?.ticketName})` : ""}` : "Create Delivery Ticket"}`}
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
                validate={validate}
            >
                {({ values, errors, setFieldValue, touched, submitForm }) => (
                    <>
                        <CustomDialogContent>
                            <Form noValidate>
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
                                                            field.fieldName === "repairJob" && Boolean(repairJobData) ? null :
                                                                field.fieldName === "transferAsset" && Boolean(transferData) ? null :
                                                                    field.fieldName === "rentalJob" && Boolean(rentalData) ? null :
                                                                        <Grid key={index2} item xs={12} sm={6} md={6}>
                                                                            {(field.fieldName === "rentalJob" && field.fieldName === "customerAccount") || field.fieldName === "deliveryType" ||
                                                                                field.fieldName === "status" || field.fieldName === "actualDeliveredDate" || field.fieldName === "actualDispatchedDate" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    fieldData={field}
                                                                                    disabled={transferData && false || rentalData && true || repairJobData && true || Boolean(deliveryTicketId) && field.disableOnEdit}
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
                                                                            ) : field.fieldName === "supplierAccount" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    fieldData={field}
                                                                                    disabled={(repairJobData && repairJobData["typeOfRepair"] === "External") || Boolean(deliveryTicketId) && field.disableOnEdit}
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
                                                                            ) : field.fieldName === "pick-UpDate" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    fieldData={field}
                                                                                    isNew={!Boolean(deliveryTicketId)}
                                                                                    disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
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
                                                                                    //maxDate={moment(values["deliveryDate"]).subtract(1, "day")}
                                                                                    maxDate={rentalData ? rentalData.estimateStartDate ? moment(rentalData?.estimateStartDate) : moment().add(1, 'years').calendar()
                                                                                        : transferData ? moment(values["deliveryDate"]) : moment().add(1, 'years').calendar()} // Please, whoever changing this ask Gagan before any change 
                                                                                />
                                                                            ) : field.fieldName === "deliveryDate" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    fieldData={field}
                                                                                    isNew={!Boolean(deliveryTicketId)}
                                                                                    disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
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
                                                                                    minDate={moment(values["pick-UpDate"])} // Please, whoever changing this ask Gagan before any change 
                                                                                    //maxDate={moment(values["deliveryDate"]).subtract(1, "day")}
                                                                                    maxDate={rentalData ? rentalData.estimateStartDate ? moment(rentalData?.estimateStartDate) : moment().add(1, 'years').calendar() :
                                                                                        transferData ? moment().add(1, 'years').calendar() : moment().add(1, 'years').calendar()}
                                                                                />
                                                                            ) : field.fieldName === "ticketName" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    fieldData={field}
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
                                                                                    fieldData={field}
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
                                                                                    fieldData={field}
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
                                                                            ) : field.fieldName === "warehouse" || field.fieldName === "plant" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    fieldData={field}
                                                                                    disabled={(deliveryTicketId && field.disableOnEdit) || (repairJobData && warehouseId) || (transferData && warehouseId) || (rentalData && warehouseId)}
                                                                                    isNew={!Boolean(deliveryTicketId)}
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
                                                                            ) : <FormTypes
                                                                                {...field}
                                                                                fieldData={field}
                                                                                isNew={!Boolean(deliveryTicketId)}
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
                                                                                disabled={(!deliveryTicketId && field.disableOnEdit) || ((field.fieldName === "type" || field.fieldName === "transferAsset") && Boolean(transferData))}
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
                                                    fieldData={field}
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
