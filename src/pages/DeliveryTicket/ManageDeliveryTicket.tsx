import { useState, useEffect, useContext, useRef, Fragment } from "react";
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
import { getObjKeysWithValues, getObjKeys, yupSchema, deliveryTicket, sidebarResource } from "../../constants/helpers";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import FormTypes from "../../components/Helpers/FormTypes";
import { FaDiceOne } from "react-icons/fa";
import moment from "moment";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { isEqual } from 'lodash';
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne, findAll, insertUpdate } from '../../constants/indexdbhelper';
import { createDeliveryTicketOffline } from './deliveryTicketOfflineHelper';

const ManageDeliveryTicket = (props) => {

    const { state: { user } }: any = useData();
    const toastConfig = useContext(CustomToastContext)
    const { deliveryTicketApi } = deliveryTicket;
    const { deliveryTicketId = null, ticketType, refrenceType = null, refrenceData = null, productInventory = null, onClose, onSuccess,
        warehouseId = null } = props;

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
    const [deliveryTicketData, setDeliveryTicketData] = useState<any>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [isSubmitting, setSubmitting] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);
    const { isOffline } = useContext(CustomOfflineContext);

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

            let type = deliveryTicketData ? deliveryTicketData?.type : refrenceType
            let ticket_type = deliveryTicketData ? deliveryTicketData?.ticketType : ticketType
            let transferType = deliveryTicketData ? deliveryTicketData?.typeDetails?.transferType : refrenceData.transferType
            let typeOfRepair = deliveryTicketData ? deliveryTicketData?.typeDetails?.typeOfRepair : refrenceData.typeOfRepair

            const newFilteredData = modifiedData.filter((formData) => {
                if (type === "Transfer Asset") {
                    if (transferType === "Internal") {
                        if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
                            return false
                        }
                    }
                    if (transferType.includes("External Supplier")) {
                        if (formData.name.includes("Customer") || formData.name.includes(ticket_type === "Loading" ? "Receiving Plant" : "Pickup Plant")) {
                            return false
                        }
                    }
                    if (transferType.includes("External Customer")) {
                        if (formData.name.includes("Supplier") || formData.name.includes(ticket_type === "Loading" ? "Receiving Plant" : "Pickup Plant")) {
                            return false
                        }
                    }
                }
                if (type === "Repair Job") {
                    if (ticket_type === "Loading") {
                        if (typeOfRepair === "Internal") {
                            if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
                                return false
                            }
                        }
                        if (typeOfRepair === "External") {
                            if (formData.name.includes("Customer") || formData.name.includes("Receiving Plant")) {
                                return false
                            }
                        }
                    }
                    else if (ticket_type === "Receiving") {
                        if (typeOfRepair === "Internal") {
                            if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
                                return false
                            }
                        }
                        if (typeOfRepair === "External") {
                            if (formData.name.includes("Customer") || formData.name.includes("Pickup Plant")) {
                                return false
                            }
                        }
                    }
                }
                if (type === "Rental Job") {
                    if (ticket_type === "Loading") {
                        if (formData.name.includes("Supplier") || formData.name.includes("Receiving Plant")) {
                            return false
                        }
                    }
                    else if (ticket_type === "Receiving") {
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

    const updateFieldProperty = (fields, _type, _ticketType, _transferType, _typeOfRepair) => {
        fields.forEach((element: any) => {
            if (_type === "Rental Job") {
                if (_ticketType === "Loading" && (element.sectionName?.includes("Pickup Plant") || element.sectionName?.includes("Customer"))) {
                    element.required = true;
                }
                else if (_ticketType === "Receiving" && (element.sectionName?.includes("Receiving Plant") || element.sectionName?.includes("Customer"))) {
                    element.required = true;
                }
            }
            else if (_type === "Repair Job") {
                if (_typeOfRepair === "External") {
                    if (_ticketType === "Loading" && (element.sectionName?.includes("Pickup Plant") || element.sectionName?.includes("Supplier"))) {
                        element.required = true;
                    }
                    else if (_ticketType === "Receiving" && (element.sectionName?.includes("Receiving Plant") || element.sectionName?.includes("Supplier"))) {
                        element.required = true;
                    }
                }
            }
            else if (_type === "Transfer Asset") {
                if (_transferType === "Internal") {
                    if (element.sectionName?.includes("Pickup Plant") || element.sectionName?.includes("Receiving Plant")) {
                        element.required = true;
                    }
                }
                else if (_transferType?.includes("External Supplier")) {
                    if (element.sectionName?.includes("Supplier") || element.sectionName?.includes(_ticketType === "Loading" ? "Pickup Plant" : "Receiving Plant")) {
                        element.required = true;
                    }
                }
                else if (_transferType?.includes("External Customer")) {
                    if (element.sectionName?.includes("Customer") || element.sectionName?.includes(_ticketType === "Loading" ? "Pickup Plant" : "Receiving Plant")) {
                        element.required = true;
                    }
                }
            }
        });
        return fields;
    }

    useEffect(() => {
        fetchFields()
    }, [deliveryTicketId, refrenceData]);

    const fetchFields = async () => {
        try {
            let data;
            if (isOffline) {
                data = await findOne(objectStore.resource, objectStore.deliveryTicket)
            }
            else {
                const response = await axiosInstance().get(`/field?resource=${sidebarResource["deliveryTicket"]}`)
                data = response?.data?.data
            }
            let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            if (deliveryTicketId) {
                let data;
                if (isOffline) {
                    data = await findOne(objectStore.deliveryTicket, deliveryTicketId)
                }
                else {
                    const response = await axiosInstance().get(`${deliveryTicketApi}/${deliveryTicketId}`)
                    data = response?.data?.data
                }
                setDeliveryTicketData(data)
                setDisableOwnerSelection(deliveryTicketId && user.user._id !== data?.owner?.optionValue);
                fieldsDataForUpdate = updateFieldProperty(fieldsDataForUpdate, data?.type, data?.ticketType, data?.typeDetails?.transferType, data?.typeDetails?.typeOfRepair);
                setInitialData({
                    fields: fieldsDataForUpdate,
                    values: getObjKeysWithValues(data, fieldsDataForUpdate),
                });
            }
            else {
                fieldsDataForCreate = updateFieldProperty(fieldsDataForCreate, refrenceType, ticketType, refrenceData?.transferType, refrenceData?.typeOfRepair);
                const tempInitialData = getObjKeys("", fieldsDataForCreate)
                if (productInventory && refrenceType === "Rental Job" && refrenceData) {
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
                }
                else if (productInventory && refrenceType === "Repair Job" && refrenceData) {
                    tempInitialData["ticketName"] = `${refrenceData?.repairJobName}_${generateUniqueIdOnly()}`
                    tempInitialData["type"] = refrenceType;
                    tempInitialData["ticketType"] = ticketType;
                    tempInitialData["productInventory"] = productInventory?.map(d => d?._id)
                    tempInitialData["repairJob"] = refrenceData?._id
                    tempInitialData["deliveryDate"] = moment(new Date()).add(7, 'days');

                    const plant = refrenceData["plant"] ?? refrenceData["warehouse"];

                    if (refrenceData?.typeOfRepair === "Internal") {

                        if (ticketType === "Loading") {
                            tempInitialData["pickupPlant"] = warehouseId;

                            const pickupPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "pickupPlant")?.option;
                            if (pickupPlantAddresses && plant) {
                                const address = pickupPlantAddresses.find(f => f.optionValue === plant?.optionValue);
                                if (address) {
                                    tempInitialData["pickupPlantAddress"] = address.address;
                                }
                            }

                            tempInitialData["receivingPlant"] = refrenceData?.repairPlant?.optionValue;
                            tempInitialData["receivingPlantAddress"] = refrenceData?.plantShipTo?.optionValue;

                        } else {
                            tempInitialData["receivingPlant"] = warehouseId;

                            const receivingPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "receivingPlant")?.option;
                            if (receivingPlantAddresses && plant) {
                                const address = receivingPlantAddresses.find(f => f.optionValue === plant?.optionValue);
                                if (address) {
                                    tempInitialData["receivingPlantAddress"] = address.address;
                                }
                            }

                            tempInitialData["pickupPlant"] = refrenceData?.repairPlant?.optionValue;
                            tempInitialData["pickupPlantAddress"] = refrenceData?.plantShipTo?.optionValue;
                        }

                    } else if (refrenceData?.typeOfRepair === "External") {

                        if (ticketType === "Loading") {
                            tempInitialData["pickupPlant"] = warehouseId;

                            const pickupPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "pickupPlant")?.option;
                            if (pickupPlantAddresses && plant) {
                                const address = pickupPlantAddresses.find(f => f.optionValue === plant?.optionValue);
                                if (address) {
                                    tempInitialData["pickupPlantAddress"] = address.address;
                                }
                            }

                        } else {
                            tempInitialData["receivingPlant"] = warehouseId;

                            const receivingPlantAddresses = fieldsDataForCreate.find(d => d.fieldName === "receivingPlant")?.option;
                            if (receivingPlantAddresses && plant) {
                                const address = receivingPlantAddresses.find(f => f.optionValue === plant?.optionValue);
                                if (address) {
                                    tempInitialData["receivingPlantAddress"] = address.address;
                                }
                            }
                        }

                        tempInitialData["supplierAccount"] = refrenceData?.supplier?.optionValue;
                        tempInitialData["supplierShippingAddress"] = refrenceData?.supplierShipTo?.optionValue;
                    }
                }
                else if (productInventory && refrenceType === "Transfer Asset" && refrenceData) {
                    tempInitialData["ticketName"] = `${refrenceData?.transferAssetNumber}_${generateUniqueIdOnly()}`
                    tempInitialData["type"] = refrenceType;
                    tempInitialData["ticketType"] = ticketType;
                    tempInitialData["productInventory"] = productInventory?.map(d => d?._id)
                    tempInitialData["transferAsset"] = refrenceData?._id;
                    tempInitialData["deliveryDate"] = moment(new Date()).add(7, 'days');
                    if (ticketType === "Loading") {
                        tempInitialData["pickupPlant"] = warehouseId;
                        tempInitialData["pickupPlantAddress"] = refrenceData?.transferFromPlant.address ?? "";
                        if (refrenceData?.transferType === "Internal") {
                            tempInitialData["receivingPlant"] = refrenceData?.transfertoPlant?.optionValue;
                            tempInitialData["receivingPlantAddress"] = refrenceData?.plantShipTo?.optionValue;
                        }

                    } else {
                        tempInitialData["receivingPlant"] = warehouseId;
                        tempInitialData["receivingPlantAddress"] = refrenceData?.transferFromPlant.address
                    }

                    if (refrenceData?.transferType === "External Customer") {
                        tempInitialData["customerAccount"] = refrenceData?.transfertoCustomer?.optionValue;
                        tempInitialData["customerShippingAddress"] = refrenceData?.customerShipTo?.optionValue;
                    }
                    if (refrenceData?.transferType === "External Supplier") {
                        tempInitialData["supplierAccount"] = refrenceData?.transfertoSupplier?.optionValue;
                        tempInitialData["supplierShippingAddress"] = refrenceData?.supplierShipTo?.optionValue;
                    }

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

    const restoreObjKeysWithValues = (dataObj: object, fields: any[]) => {
        const obj = { ...dataObj };
        fields.forEach(field => {
            if (field.type === "dropDown" && field.lookup) {
                let filter: any = field?.option?.filter((e) => e.optionValue === dataObj[field.fieldName]);
                if (filter.length) {
                    obj[field.fieldName] = {
                        optionLabel: filter[0].optionLabel,
                        optionValue: filter[0].optionValue
                    }
                }
            }
            else if (field.type === "multiSelect") {
                if (dataObj[field.fieldName] && dataObj[field.fieldName].length) {
                    let option = []
                    dataObj[field.fieldName].forEach((e: any) => {
                        option.push({
                            optionLabel: e,
                            optionValue: e
                        })
                    })
                    obj[field.fieldName] = option;
                }
            }
            else if (field.type === "date") {
                obj[field.fieldName] = moment(dataObj[field.fieldName]).format("YYYY-MM-DD")
            }
            else {
                obj[field.fieldName] = dataObj[field.fieldName]
            }
        })
        return obj;
    };

    const handleSubmit = async (values) => {
        if (isOffline) {
            setSubmitting(true);
            const data: any = restoreObjKeysWithValues(values, initialData.fields)
            const oridata = JSON.parse(JSON.stringify(values));
            await createDeliveryTicketOffline(data, oridata)
            onSuccess()
            setSubmitting(false);
        }
        else {
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
        }
    };

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
                            title={`${deliveryTicketId ? `Update ${initialData.values?.ticketName ? `(${initialData.values?.ticketName})` : ""}` 
                            : `Create ${initialData.values?.ticketType} Ticket`}`}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                        />
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
                                                            ["repairJob", "transferAsset", "rentalJob", "type", "productInventory"].includes(field.fieldName) ? null :
                                                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                                                    {field.fieldName === "pick-UpDate" ? (
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
                                                                                setFieldValue(name, value)
                                                                            }}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            minDate={new Date()}
                                                                            //maxDate={moment(values["deliveryDate"]).subtract(1, "day")}
                                                                            maxDate={
                                                                                refrenceType === "Rental Job" ? refrenceData.estimateStartDate ? moment(refrenceData?.estimateStartDate) : moment().add(1, 'years').calendar()
                                                                                    : refrenceType === "Transfer Asset" ? moment(values["deliveryDate"]) : moment().add(1, 'years').calendar()}
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
                                                                                setFieldValue(name, value)
                                                                            }}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            minDate={moment(values["pick-UpDate"])} // Please, whoever changing this ask Gagan before any change 
                                                                            //maxDate={moment(values["deliveryDate"]).subtract(1, "day")}
                                                                            maxDate={refrenceType === "Rental Job" ? refrenceData.estimateStartDate ? moment(refrenceData?.estimateStartDate) : moment().add(1, 'years').calendar() :
                                                                                refrenceType === "Transfer Asset" ? moment().add(1, 'years').calendar() : moment().add(1, 'years').calendar()}
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
                                                                        isNew={!Boolean(deliveryTicketId)}
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
        ) :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
    </Dialog>
    );
}

export default ManageDeliveryTicket;
