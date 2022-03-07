import { useState, useEffect, useContext } from "react";
import { Formik, Form } from "formik";
import { Box, Button, Grid, IconButton, Tooltip } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import {
    CustomDialogTransition, customerAccount, customerContact, getCollaboratorDropdownDataSource, getObjKeys, getObjKeysWithValues,
    getOwnerDropdownDataSource, isFieldNotTouched, rentalManagement, setFieldsInAscendingOrder, yupSchema, generateUniqueIdOnly, RENTAL_STATUS
} from "../../../constants/helpers";
import axiosInstance from '../../../axios/axiosInstance'
import Dialog from "@material-ui/core/Dialog";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog";
import Skeleton from "@material-ui/lab/Skeleton/Skeleton";
import { useHistory } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { FaDiceOne } from "react-icons/fa";
import moment from "moment";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../../Account/ManageAccount";
import ManageContactDialog from "../../Contact/ManageContact";
import ManageWarehouse from '../../Warehouse/ManageWarehouse';
import ManageAddressDialog from "src/components/Address/ManageAddressDialog";

const ManageRentalManagementDialog = ({ isClone, rentalManagementId, rentalManagementData = null, onClose, onSuccess, open }) => {

    const history = useHistory()
    const toastConfig = useContext(CustomToastContext);
    const { isOffline, offlineFieldsData, offlineGridData } = useContext(CustomOfflineContext);

    const [loading, setLoading] = useState(false);
    const [rentalData, setRentalData] = useState({ fields: [], initialValues: {} });
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const {
        state: { user, permissions, selectedEntity },
    }: any = useData();
    const [formValues, setFormValues] = useState({})
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const [contactData, setContactData] = useState([]);
    const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] =
        useState(false);
    const [showAddCustomerContactDialog, setShowAddCustomerContactDialog] =
        useState(false);

    const [accountData, setAccountData] = useState([]);
    const [customerContactMainDataSource, setCustomerContactMainDataSource] = useState([]);
    const [customerContactDataSource, setCustomerContactDataSource] = useState([]);
    const [newAddedAccountId, setNewAddedAccountId] = useState(null);

    const [rentalDetails, setRentalDetails] = useState(null);

    const [addressData, setAddressData] = useState([])
    const [billingAddress, setBillingAddress] = useState([]);
    const [shippingAddress, setShippingAddress] = useState([]);
    // const [countryBillToMainData, setCountryBillToMainData] = useState([]);
    // const [countrySellToMainData, setCountrySellToMainData] = useState([]);
    const [cloneHeading, setCloneHeading] = useState('');

    const [showAddWarehouseDialog, setShowAddWarehouseDialog] = useState(false);
    const [optionsPlantsEntity, setOptionsPlantsEntity] = useState([]);

    const [showAddressDialog, setShowAddressDialog] = useState(false);
    const [addressType, setAddressType] = useState('');

    const updateAccountDropdown = (data) => {
        const entityFields = rentalData.fields;
        const customerAccountNameFieldIndex = entityFields.findIndex(
            (d) => d.fieldName === "customerAccount"
        );
        if (customerAccountNameFieldIndex > -1) {
            entityFields[customerAccountNameFieldIndex].option = [
                ...entityFields[customerAccountNameFieldIndex].option,
                {
                    optionValue: data._id,
                    optionLabel: data.accountName,
                    order: entityFields[customerAccountNameFieldIndex].option.length,
                    default: false,
                    billingAddress: data.billingAddress,
                    shippingAddress: data.shippingAddress,
                },
            ];
            setAccountData(entityFields[customerAccountNameFieldIndex].option);
        }
    };

    const updateContactDropdown = (data) => {
        const entityFields = rentalData.fields;
        const customerContactNameFieldIndex = entityFields.findIndex(
            (d) => d.fieldName === "customerContact"
        );
        if (customerContactNameFieldIndex > -1) {
            const newCustomer = {
                optionValue: data._id,
                optionLabel: `${data.firstName} ${data.lastName}`,
                order: entityFields[customerContactNameFieldIndex].option.length,
                default: false,
                parentAccount: data.accountName,
            };
            entityFields[customerContactNameFieldIndex].option = [
                ...entityFields[customerContactNameFieldIndex].option,
                newCustomer,
            ];
            setCustomerContactMainDataSource(
                entityFields[customerContactNameFieldIndex].option
            );
            setCustomerContactDataSource((prevState) => [...prevState, newCustomer]);
        }
    };

    useEffect(() => {
        const ownerCollabOptions = rentalData.fields.filter(
            (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
        );
        if (ownerCollabOptions.length > 0) {
            setOwnerCollaboratorData(ownerCollabOptions[0].option);
            setOwnerData(ownerCollabOptions[0].option);
            setCollaboratorData(ownerCollabOptions[0].option);
        }
        let customerAccountOptions = rentalData.fields.find(
            (d) => d.fieldName === "customerAccount"
        );
        if (customerAccountOptions) {
            setAccountData(customerAccountOptions.option);
        }
        let customerContactOptions = rentalData.fields.find(
            (d) => d.fieldName === "customerContact"
        );
        if (customerContactOptions) {
            setContactData(customerContactOptions.option);
        }
        const customerContactDropdownData = rentalData.fields.find(
            (d) => d.fieldName === "customerContact"
        );
        const billingAddressDropdownData = rentalData.fields.find(
            (d) => d.fieldName === "billingAddress"
        );
        if (billingAddressDropdownData) {
            setAddressData(billingAddressDropdownData.option)
            // setCountryBillToMainData(billingAddressDropdownData.option)
            setBillingAddress(billingAddressDropdownData.option)
            setShippingAddress(billingAddressDropdownData.option)
        }
        // const countrySellToDropdownData = rentalData.fields.find(
        //     (d) => d.fieldName === "shippingAddress"
        // );
        // if (billingAddressDropdownData) {
        //     // setCountrySellToMainData(countrySellToDropdownData.option)
        //     setShippingAddress(countrySellToDropdownData.option)
        // }
        if (customerContactDropdownData) {
            setCustomerContactMainDataSource(customerContactDropdownData.option);
            if (rentalManagementId) {
                setCustomerContactDataSource(
                    customerContactDropdownData?.option.filter(
                        (d) =>
                            d.parentAccount === rentalManagementData?.customerAccount.optionValue
                    )
                );
            }
        }
        setFormsData(setFieldsInAscendingOrder(rentalData.fields));
    }, [rentalData.fields]);

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

    const onCustomerContactDropdownOpen = (selectedAccount) => {
        setCustomerContactDataSource(
            customerContactMainDataSource.filter(
                (d) => d.parentAccount === selectedAccount
            )
        );
    };

    useEffect(() => {
        setLoading(true);
        fetchFields();
    }, [rentalManagementId]);

    const fetchFields = async () => {
        try {
            let fieldData;
            if (navigator.onLine) {
                const response: any = await axiosInstance().get("/field?resource=Rental Management");
                fieldData = response?.data?.data;
            }
            else {
                fieldData = offlineFieldsData?.rentalManagement || [];
            }
            var statusOptions = []
            fieldData?.forEach((e: any) => {
                if (e?.fieldData?.fieldName === "warehouse" && e?.fieldData?.option) {
                    setOptionsPlantsEntity(e?.fieldData?.option?.filter((a) => a.entity?.includes(selectedEntity)));
                    e.fieldData.option = e?.fieldData?.option?.filter((a) => a.entity?.includes(selectedEntity));
                }
                if (e?.fieldData?.fieldName === 'status') {
                    statusOptions = e.fieldData.option;
                }
            })

            var fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            var fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (rentalManagementId) {
                try {
                    let data;
                    if (!isOffline) {
                        const response: any = await axiosInstance().get(`${rentalManagement.api}/` + rentalManagementId);
                        data = response?.data?.data;
                    } else {
                        data = offlineGridData?.rentalManagement?.find(d => d._id === rentalManagementId)
                    }
                    if (isClone) {
                        const { _id, brand, createdBy, entity, history, products, status, rentalJobName, updatedBy, ...rest } = data
                        rest['status'] = "New"
                        rest['rentalJobName'] = `RJ_${generateUniqueIdOnly()}`
                        rest['estimateStartDate'] = new Date();
                        rest['estimateEndDate'] = "";
                        rest['actualStartDate'] = "";
                        rest['actualEndDate'] = "";
                        fieldsDataForCreate = fieldsDataForCreate?.filter((obj) => !["actualStartDate", "actualEndDate"].includes(obj.fieldName));
                        setCloneHeading(rentalJobName);
                        setRentalData({
                            fields: fieldsDataForCreate,
                            initialValues: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate))
                        setLoading(false)
                    } else {
                        setRentalDetails(data)
                        if (data?.actualStartDate === "") {
                            fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !["actualStartDate"].includes(obj.fieldName));
                        }
                        if (data?.actualEndDate === "") {
                            fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !["actualEndDate"].includes(obj.fieldName));
                        }
                        setRentalData({
                            fields: fieldsDataForUpdate,
                            initialValues: getObjKeysWithValues(data, fieldsDataForUpdate),
                        });
                        setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate))
                        setLoading(false)
                    }

                } catch (error) {
                    toastConfig.setToastConfig(error);
                }
            }
            else {
                fieldsDataForCreate = fieldsDataForCreate?.filter((obj) => !["actualStartDate", "actualEndDate"].includes(obj.fieldName));
                let initialData = {
                    ...getObjKeys("", fieldsDataForCreate),
                    estimateEndDate: "", actualStartDate: "", actualEndDate: "", currency: user.user?.brandCurrency || "", rentalJobName: `RJ_${generateUniqueIdOnly()}`
                };
                setRentalData({
                    fields: fieldsDataForCreate,
                    initialValues: initialData,
                });
                setFormValues(initialData)
                setLoading(false)
            }
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    }

    const handleSubmit = async (
        errors,
        setTouched,
        values,
        setValues,
        setErrors
    ) => {
        if (Object.keys(errors).length) {
            rentalData.fields.forEach((input) => {
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
            setErrors({ ...errors });
        } else {
            handleUpdateRentalManagement(values)
        }
    };

    const handleUpdateRentalManagement = (values) => {
        setLoading(true);
        if (rentalManagementId && isClone === false) {
            values._id = rentalManagementId
            if (!isOffline) {
                axiosInstance().put(`${rentalManagement.api}`, values).then(({ data }) => {
                    setLoading(false);
                    onSuccess()
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                }).catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
            } else {
                let storedData = {};
                if (localStorage.getItem("offlineDataToSave")) {
                    storedData = JSON.parse(localStorage.getItem("offlineDataToSave"));
                }
                const dataToSave = {
                    api: rentalManagement.api,
                    method: "put",
                    values: values
                };
                if (!storedData["rentalManagement"]) {
                    storedData["rentalManagement"] = [];
                }
                storedData["rentalManagement"].push(dataToSave)
                localStorage.setItem("offlineDataToSave", JSON.stringify(storedData));
                setLoading(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: "info",
                    message: "Updates are in offline state, it will be affected once you will be in network",
                });
                onSuccess();
            }
        }
        else {
            if (!isOffline) {
                axiosInstance().post(`${rentalManagement.api}`, values).then(({ data: { data, message } }) => {
                    history.push(`${routes.rentalManagementDetail.path}/${data}`)
                    setLoading(false);
                    onSuccess(data)
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: message,
                    });
                }).catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                let storedData = {};
                if (localStorage.getItem("offlineDataToSave")) {
                    storedData = JSON.parse(localStorage.getItem("offlineDataToSave"));
                }
                const dataToSave = {
                    api: rentalManagement.api,
                    method: "post",
                    values: values
                };
                if (!storedData["rentalManagement"]) {
                    storedData["rentalManagement"] = [];
                }
                storedData["rentalManagement"].push(dataToSave)
                localStorage.setItem("offlineDataToSave", JSON.stringify(storedData));
                onSuccess();
            }
        }
    };

    // const onCountrySellToDropDownOpen = (selectedAccount) => {
    //     let filterAddress = accountData.find(d => d.optionValue === selectedAccount)?.shippingAddress
    //     if (filterAddress) {
    //         setShippingAddress(
    //             countrySellToMainData.filter((d) => filterAddress?.some(u => u === d.optionValue))
    //         );
    //     }
    //     else {
    //         setShippingAddress([])
    //     }
    // };

    // const onCountryBillToDropDownOpen = (selectedAccount) => {
    //     let filterAddress = accountData.find(d => d.optionValue === selectedAccount)?.billingAddress
    //     if (filterAddress) {
    //         setBillingAddress(
    //             countryBillToMainData.filter((d) => filterAddress?.some(u => u === d.optionValue))
    //         );
    //     }
    //     else {
    //         setBillingAddress([])
    //     }
    // };

    const handleValuesChange = (data) => {
        setFormValues((prevState) => ({
            ...prevState,
            ...data
        }))
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

    function validate(values) {
        const errors = {};
        let estimateStartDate = moment(values?.estimateStartDate);
        let estimateEndDate = moment(values?.estimateEndDate);
        if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
            errors['estimateEndDate'] = 'Please enter valid estimate end date';
        }
        let actualStartDate = moment(values?.actualStartDate);
        let actualEndDate = moment(values?.actualEndDate);
        if (actualStartDate.format("YYYY-MM-DD") !== actualEndDate.format("YYYY-MM-DD")) {
            if (actualEndDate.diff(actualStartDate, 'days') <= 0) {
                errors['actualEndDate'] = 'Please enter valid actual end date';
            }
        }
        return errors;
    }

    const onShippingAddressOpen = (customerAccount, shippingAddress) => {
        let filterAddress = accountData.find(d => d.optionValue === customerAccount)?.shippingAddress
        if (filterAddress || shippingAddress) {
            setShippingAddress(addressData.filter((d) => filterAddress?.some(u => u === d.optionValue) || d.optionValue === shippingAddress));
        }
        else {
            setShippingAddress([])
        }
    };

    const onBillingAddressOpen = (customerAccount, billingAddress) => {
        let filterAddress = accountData.find(d => d.optionValue === customerAccount)?.billingAddress
        if (filterAddress || billingAddress) {
            setBillingAddress(addressData.filter((d) => filterAddress?.some(u => u === d.optionValue) || d.optionValue === billingAddress));
        }
        else {
            setBillingAddress([])
        }
    };

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen || (isMobile || isTablet)}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        setShowConfirmDialog(true)
                    }
                }}
                open={open}
            >
                <CustomDialogHeader
                    title={
                        !rentalManagementId
                            ? `Create ${routes.rentalManagement.title}`
                            : `${isClone ? `Clone - ${cloneHeading}` : `Update ${rentalManagementData?.rentalJobName}`}`
                    }
                    onClose={(e, reason) => {
                        if (isFieldNotTouched(rentalData, formValues)) onClose()
                        else setShowConfirmDialog(true)
                    }}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen(prevState => !prevState)
                    }}
                    showManimizeMaximize={true}
                />
                {!rentalData.fields.length ? (
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
                        initialValues={rentalData.initialValues}
                        validationSchema={yupSchema(rentalData.fields)}
                        validateOnMount
                        validate={validate}
                        onSubmit={() => { }}
                    >
                        {({
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            setFieldTouched,
                            setErrors,
                            setValues,
                        }) => (
                            <>
                                <CustomDialogContent>
                                    <Form>
                                        {formsData && formsData.map((form, i) => {
                                            return (
                                                form.name && (
                                                    <div key={i}>
                                                        <div className={"detail-box-content"}>
                                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                                                        </div>
                                                        <Box marginY={2}>
                                                            <Grid spacing={3} container>
                                                                {form.sectionFields.map((field) => (
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}   >
                                                                        {field.fieldName == "customerAccount" ? (
                                                                            <Grid container spacing={1}>
                                                                                <Grid item xs={permissions.customerAccount?.isCreate ? 11 : 11}
                                                                                    sm={permissions.customerAccount?.isCreate ? 11 : 11}
                                                                                    md={permissions.customerAccount?.isCreate ? 11 : 11}
                                                                                >
                                                                                    <FormTypes
                                                                                        {...field}
                                                                                        isNew={!rentalManagementId}
                                                                                        values={values}
                                                                                        errors={errors}
                                                                                        fieldData={field}
                                                                                        touched={touched}
                                                                                        label={field.fieldLabel}
                                                                                        name={field.fieldName}
                                                                                        type={field.type}
                                                                                        options={accountData}
                                                                                        disabled={!isClone ? (rentalManagementId && field.disableOnEdit) : false}
                                                                                        required={field.required}
                                                                                        fullWidth
                                                                                        isTooltip={
                                                                                            field?.isTooltip || false
                                                                                        }
                                                                                        tooltipMessage={
                                                                                            field?.tooltipMessage
                                                                                        }
                                                                                        size="small"
                                                                                        doNotShowInfoTooltip={true}
                                                                                        onChange={(e, value) => {
                                                                                            setFieldValue(
                                                                                                field.fieldName,
                                                                                                value && value.optionValue
                                                                                                    ? value.optionValue
                                                                                                    : ""
                                                                                            );
                                                                                            setFieldValue("customerContact", "");
                                                                                            setFieldValue("billingAddress", "");
                                                                                            setFieldValue("shippingAddress", "");
                                                                                            handleValuesChange({
                                                                                                [field.fieldName]: value && value.optionValue ? value.optionValue : "",
                                                                                                "customerContact": "",
                                                                                            })
                                                                                        }}
                                                                                    />
                                                                                </Grid>
                                                                                {permissions.customerAccount?.isCreate &&
                                                                                    <Grid item xs={1} sm={1} md={1}>
                                                                                        <Tooltip
                                                                                            title="Create Account"
                                                                                            className="mt-1"
                                                                                        >
                                                                                            <IconButton
                                                                                                onClick={() => {
                                                                                                    setShowAddCustomerAccountDialog(
                                                                                                        true
                                                                                                    );
                                                                                                }}
                                                                                                disabled={!isClone ? (rentalManagementId && field.disableOnEdit) : false}
                                                                                                size="small"
                                                                                            >
                                                                                                <AddIcon color={isClone ? "primary" : rentalManagementId && field.disableOnEdit ? "disabled" : "primary"} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Grid>
                                                                                }
                                                                                {field?.tooltipMessage ? (
                                                                                    <Grid item xs={1} sm={1} md={1}>
                                                                                        <Tooltip
                                                                                            title={
                                                                                                field?.tooltipMessage ?? ""
                                                                                            }
                                                                                        >
                                                                                            <InfoIcon color="disabled" />
                                                                                        </Tooltip>
                                                                                    </Grid>
                                                                                ) : null}
                                                                            </Grid>
                                                                        ) : field.fieldName === "customerContact" ? (
                                                                            <Grid container spacing={1}>
                                                                                <Grid item xs={permissions.customerContact?.isCreate ? 11 : 11}
                                                                                    sm={permissions.customerContact?.isCreate ? 11 : 11}
                                                                                    md={permissions.customerContact?.isCreate ? 11 : 11}
                                                                                >
                                                                                    <FormTypes
                                                                                        {...field}
                                                                                        isNew={!rentalManagementId}
                                                                                        values={values}
                                                                                        fieldData={field}
                                                                                        errors={errors}
                                                                                        touched={touched}
                                                                                        label={field.fieldLabel}
                                                                                        name={field.fieldName}
                                                                                        type={field.type}
                                                                                        options={customerContactDataSource}
                                                                                        doNotShowInfoTooltip={true}
                                                                                        setFieldValue={(name, value) => {
                                                                                            handleValuesChange({ [name]: value })
                                                                                            setFieldValue(name, value)
                                                                                        }}
                                                                                        disabled={!isClone ? (rentalManagementId && field.disableOnEdit) : false}
                                                                                        required={field.required}
                                                                                        fullWidth
                                                                                        isTooltip={false}
                                                                                        size="small"
                                                                                        onOpen={() =>
                                                                                            onCustomerContactDropdownOpen(
                                                                                                values["customerAccount"]
                                                                                            )
                                                                                        }
                                                                                    // onChange={(e, value) => {
                                                                                    //   setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");

                                                                                    // }}
                                                                                    />
                                                                                </Grid>
                                                                                {permissions.customerContact?.isCreate &&
                                                                                    <Grid item xs={1} sm={1} md={1} >
                                                                                        <Tooltip
                                                                                            title="Create Contact"
                                                                                            className="mt-1"
                                                                                        >
                                                                                            <IconButton
                                                                                                onClick={() => {
                                                                                                    setShowAddCustomerContactDialog(
                                                                                                        true
                                                                                                    );
                                                                                                }}
                                                                                                disabled={!isClone ? (rentalManagementId && field.disableOnEdit) : false}
                                                                                                size="small"
                                                                                            >
                                                                                                <AddIcon color={isClone ? "primary" : (rentalManagementId && field.disableOnEdit) ? "disabled" : "primary"} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Grid>
                                                                                }
                                                                                {field?.tooltipMessage ? (
                                                                                    <Grid item xs={1} sm={1} md={1}>
                                                                                        <Tooltip
                                                                                            className="mt-2"
                                                                                            title={
                                                                                                field?.tooltipMessage ?? ""
                                                                                            }
                                                                                        >
                                                                                            <InfoIcon color="disabled" />
                                                                                        </Tooltip>
                                                                                    </Grid>
                                                                                ) : null}
                                                                            </Grid>
                                                                        ) : field.fieldName === "owner" ? (
                                                                            <FormTypes
                                                                                rentalManagementId={rentalManagementId}
                                                                                {...field}
                                                                                values={values}
                                                                                errors={errors}
                                                                                fieldData={field}
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
                                                                                    handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })

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
                                                                                                collaborator: collaboratorData.find(
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
                                                                                disabled={(!rentalManagementId && field.disableOnEdit)}
                                                                                onOpen={() => {
                                                                                    onOwnerDropdownOpen(
                                                                                        values["collaborator"]
                                                                                    );
                                                                                }}
                                                                            />
                                                                        ) : field.fieldName === "collaborator" ? (
                                                                            <FormTypes
                                                                                rentalManagementId={rentalManagementId}
                                                                                {...field}
                                                                                disabled={!rentalManagementId && field.disableOnEdit}
                                                                                values={values}
                                                                                errors={errors}
                                                                                fieldData={field}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={collaboratorData}
                                                                                setFieldValue={(name, value) => {
                                                                                    handleValuesChange({ [name]: value })
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
                                                                        ) : field.fieldName === "estimateStartDate" ? (
                                                                            <FormTypes
                                                                                {...field}
                                                                                values={values}
                                                                                errors={errors}
                                                                                fieldData={field}
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
                                                                        ) : field.fieldName === "estimateEndDate" ? (
                                                                            <FormTypes
                                                                                {...field}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                fieldData={field}
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
                                                                        ) : field.fieldName === "actualStartDate" ? (
                                                                            <FormTypes
                                                                                {...field}
                                                                                disabled={values["status"] === RENTAL_STATUS.readyToInvoice ? false : true}
                                                                                fieldData={field}
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
                                                                        ) : field.fieldName === "actualEndDate" ? (

                                                                            <FormTypes
                                                                                {...field}
                                                                                disabled={values["status"] === RENTAL_STATUS.readyToInvoice ? false : true}
                                                                                fieldData={field}
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
                                                                        )
                                                                            : field.fieldName === "billingAddress" ? (
                                                                                // <FormTypes
                                                                                //     {...field}
                                                                                //     disabled={Boolean(rentalManagementId) && field.disableOnEdit && !isClone}
                                                                                //     values={values}
                                                                                //     errors={errors}
                                                                                //     touched={touched}
                                                                                //     label={field.fieldLabel}
                                                                                //     name={field.fieldName}
                                                                                //     type={field.type}
                                                                                //     options={billingAddress}
                                                                                //     setFieldValue={(name, value) => {
                                                                                //         setFieldValue(name, value)
                                                                                //     }}
                                                                                //     required={field.required}
                                                                                //     fullWidth
                                                                                //     isTooltip={field?.isTooltip || false}
                                                                                //     tooltipMessage={field?.tooltipMessage}
                                                                                //     size="small"
                                                                                //     onOpen={() =>
                                                                                //         onCountryBillToDropDownOpen(values["customerAccount"])
                                                                                //     }
                                                                                // />

                                                                                <Box display="flex">
                                                                                    <Box flexGrow={1}>
                                                                                        <FormTypes
                                                                                            {...field}
                                                                                            disabled={Boolean(rentalManagementId) && field.disableOnEdit && !isClone}
                                                                                            fieldData={field}
                                                                                            values={values}
                                                                                            errors={errors}
                                                                                            touched={touched}
                                                                                            label={field.fieldLabel}
                                                                                            name={field.fieldName}
                                                                                            type={field.type}
                                                                                            options={billingAddress}
                                                                                            setFieldValue={(name, value) => {
                                                                                                setFieldValue(name, value)
                                                                                            }}
                                                                                            required={field.required}
                                                                                            fullWidth
                                                                                            isTooltip={field?.isTooltip || false}
                                                                                            tooltipMessage={field?.tooltipMessage}
                                                                                            size="small"
                                                                                            onOpen={() =>
                                                                                                onBillingAddressOpen(values["customerAccount"], values["billingAddress"])
                                                                                            }
                                                                                        />
                                                                                    </Box>
                                                                                    <Box>
                                                                                        <Tooltip title={`Add ${field.fieldLabel}`} className="mt-1">
                                                                                            <IconButton
                                                                                                onClick={() => {
                                                                                                    setShowAddressDialog(true);
                                                                                                    setAddressType('billingAddress');
                                                                                                }}
                                                                                                disabled={field.disableOnEdit}
                                                                                                size="small"
                                                                                            >
                                                                                                <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Box>
                                                                                </Box>
                                                                            )
                                                                                :
                                                                                field.fieldName === "shippingAddress" ? (
                                                                                    <Box display="flex">
                                                                                    <Box flexGrow={1}>
                                                                                        <FormTypes
                                                                                            {...field}
                                                                                            disabled={Boolean(rentalManagementId) && field.disableOnEdit && !isClone}
                                                                                            fieldData={field}
                                                                                            values={values}
                                                                                            errors={errors}
                                                                                            touched={touched}
                                                                                            label={field.fieldLabel}
                                                                                            name={field.fieldName}
                                                                                            type={field.type}
                                                                                            options={shippingAddress}
                                                                                            setFieldValue={(name, value) => {
                                                                                                setFieldValue(name, value)
                                                                                            }}
                                                                                            required={field.required}
                                                                                            fullWidth
                                                                                            isTooltip={field?.isTooltip || false}
                                                                                            tooltipMessage={field?.tooltipMessage}
                                                                                            size="small"
                                                                                            onOpen={() =>
                                                                                                onShippingAddressOpen(values["customerAccount"], values["shippingAddress"])
                                                                                            }
                                                                                        />
                                                                                    </Box>
                                                                                    <Box>
                                                                                        <Tooltip title={`Add ${field.fieldLabel}`} className="mt-1">
                                                                                            <IconButton
                                                                                                onClick={() => {
                                                                                                    setShowAddressDialog(true);
                                                                                                    setAddressType('shippingAddress');
                                                                                                }}
                                                                                                disabled={field.disableOnEdit}
                                                                                                size="small"
                                                                                            >
                                                                                                <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Box>
                                                                                </Box>

                                                                                    // <FormTypes
                                                                                    //     {...field}
                                                                                    //     disabled={Boolean(rentalManagementId) && field.disableOnEdit && !isClone}
                                                                                    //     values={values}
                                                                                    //     errors={errors}
                                                                                    //     touched={touched}
                                                                                    //     label={field.fieldLabel}
                                                                                    //     name={field.fieldName}
                                                                                    //     type={field.type}
                                                                                    //     options={shippingAddress}
                                                                                    //     setFieldValue={(name, value) => {
                                                                                    //         setFieldValue(name, value)
                                                                                    //     }}
                                                                                    //     required={field.required}
                                                                                    //     fullWidth
                                                                                    //     isTooltip={field?.isTooltip || false}
                                                                                    //     tooltipMessage={field?.tooltipMessage}
                                                                                    //     size="small"
                                                                                    //     onOpen={() =>
                                                                                    //         onShippingAddressOpen(values["customerAccount"], values["shippingAddress"])
                                                                                    //     }
                                                                                    // />
                                                                                )
                                                                                    : (field.fieldName === "plant" || field.fieldName === "warehouse") ? (
                                                                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                                                            <Grid container spacing={1}>
                                                                                                <Grid item xs={permissions?.warehouse?.isCreate ? 11 : 11}
                                                                                                    sm={permissions?.warehouse?.isCreate ? 11 : 11}
                                                                                                    md={permissions?.warehouse?.isCreate ? 11 : 11}
                                                                                                >
                                                                                                    <FormTypes
                                                                                                        {...field}
                                                                                                        disabled={rentalDetails && rentalDetails?.productInventory?.length ? true : false}
                                                                                                        values={values}
                                                                                                        fieldData={field}
                                                                                                        errors={errors}
                                                                                                        touched={touched}
                                                                                                        label={field.fieldLabel}
                                                                                                        name={field.fieldName}
                                                                                                        type={field.type}
                                                                                                        options={optionsPlantsEntity}
                                                                                                        setFieldValue={(name, value) => {
                                                                                                            setFieldValue(name, value)
                                                                                                        }}
                                                                                                        required={field.required}
                                                                                                        fullWidth
                                                                                                        isTooltip={field?.isTooltip || false}
                                                                                                        tooltipMessage={field?.tooltipMessage}
                                                                                                        size="small"
                                                                                                    />
                                                                                                </Grid>
                                                                                                {permissions?.warehouse?.isCreate && (
                                                                                                    <Grid item xs={1} sm={1} md={1} >
                                                                                                        <Tooltip
                                                                                                            title="Create Plant"
                                                                                                            className="mt-1"
                                                                                                        >
                                                                                                            <IconButton
                                                                                                                onClick={() => {
                                                                                                                    setShowAddWarehouseDialog(true);
                                                                                                                }}
                                                                                                                disabled={rentalDetails && rentalDetails?.productInventory?.length}
                                                                                                                size="small"
                                                                                                            >
                                                                                                                <AddIcon color={rentalDetails && rentalDetails?.productInventory?.length ? "disabled" : "primary"} />
                                                                                                            </IconButton>
                                                                                                        </Tooltip>
                                                                                                    </Grid>
                                                                                                )}
                                                                                                {field?.tooltipMessage ? (
                                                                                                    <Grid item xs={1} sm={1} md={1}>
                                                                                                        <Tooltip
                                                                                                            className="mt-2"
                                                                                                            title={
                                                                                                                field?.tooltipMessage ?? ""
                                                                                                            }
                                                                                                        >
                                                                                                            <InfoIcon color="disabled" />
                                                                                                        </Tooltip>
                                                                                                    </Grid>
                                                                                                ) : null}
                                                                                            </Grid>
                                                                                        </Grid>
                                                                                    )
                                                                                        : (
                                                                                            <FormTypes
                                                                                                rentalManagementId={rentalManagementId}
                                                                                                {...field}
                                                                                                fieldData={field}
                                                                                                disabled={
                                                                                                    field.fieldName === "currency" ? rentalDetails && rentalDetails?.material?.length ? true : false :
                                                                                                        field.fieldName === "warehouse" ? rentalDetails && rentalDetails?.productInventory?.length ? true : false :
                                                                                                            (rentalManagementId && field.disableOnEdit && !isClone)}
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
                                                                                                imageOrFileUploadCompletePercentage={
                                                                                                    ["imageUpload", "fileUpload"].some(
                                                                                                        (s) => s === field.type
                                                                                                    )
                                                                                                        ? (completePercentage) => {
                                                                                                            setUploadingImageOrFileProgress(
                                                                                                                completePercentage
                                                                                                            );
                                                                                                        }
                                                                                                        : null
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                    </Grid>
                                                                ))}
                                                            </Grid>
                                                        </Box>
                                                    </div>
                                                )
                                            );
                                        })}
                                    </Form>
                                </CustomDialogContent>
                                <CustomDialogFooter>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            if (isFieldNotTouched(rentalData, values)) onClose()
                                            else setShowConfirmDialog(true)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <CustomButton
                                        loading={loading}
                                        variant="contained"
                                        color="primary"
                                        disabled={
                                            // loading || Object.keys(errors).length > 0 ? true : false
                                            uploadingImageOrFileProgress > 0 ||
                                            // isFieldNotTouched(rentalData, values) ||
                                            loading
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleScroll(errors)
                                            handleSubmit(
                                                errors,
                                                setFieldTouched,
                                                values,
                                                setValues,
                                                setErrors
                                            );
                                        }}
                                    >
                                        Save
                                    </CustomButton>
                                </CustomDialogFooter>
                                {
                                    showConfirmDialog ?
                                        <ConfirmCancelDialog
                                            open={showConfirmDialog}
                                            onSave={() => {
                                                setShowConfirmDialog(false)
                                                handleScroll(errors)

                                                handleSubmit(
                                                    errors,
                                                    setFieldTouched,
                                                    values,
                                                    setValues,
                                                    setErrors
                                                );
                                            }}
                                            close={() => setShowConfirmDialog(false)}
                                            onClose={() => {
                                                setShowConfirmDialog(false)
                                                onClose()
                                            }}
                                        /> : null
                                }
                                {showAddCustomerAccountDialog && (
                                    <ManageAccountDialog
                                        open={showAddCustomerAccountDialog}
                                        onClose={() => {
                                            setShowAddCustomerAccountDialog(false);
                                        }}
                                        id={null}
                                        accountResource={customerAccount.accountResource}
                                        accountApi={customerAccount.accountApi}
                                        isGetAccountData={true}
                                        onGetAddedAccount={({ data }) => {
                                            setNewAddedAccountId(data._id);
                                            updateAccountDropdown(data);

                                            setFieldValue("customerAccount", data._id);
                                            setFieldValue("customerContact", "");
                                            setFieldValue("billingAddress", "");
                                            setFieldValue("shippingAddress", "");
                                        }}
                                        isRedirectToDetailPage={false}
                                    />
                                )}
                                {showAddCustomerContactDialog && (
                                    <ManageContactDialog
                                        open={showAddCustomerContactDialog}
                                        onClose={() => setShowAddCustomerContactDialog(false)}
                                        onSuccess={(obj) => {
                                            if (obj) {
                                                setShowAddCustomerContactDialog(false);
                                                updateContactDropdown(obj.data.data);
                                                setFieldValue("customerContact", obj.id);
                                            }
                                        }}
                                        accountId={values["customerAccount"]}
                                        contactResource={customerContact.contactResource}
                                        contactApi={customerContact.contactApi}
                                        isRedirectToDetailPage={false}
                                        collaborators={collaboratorData}
                                        owner={ownerData}
                                        account={customerAccount}
                                        isAccountFieldDisable={true}
                                    />
                                )}
                                {showAddWarehouseDialog &&
                                    <ManageWarehouse
                                        open={showAddWarehouseDialog}
                                        close={() => setShowAddWarehouseDialog(false)}
                                        isClone={false}
                                        onSuccess={({ data }) => {
                                            if (data._id) {
                                                setShowAddWarehouseDialog(false)
                                                setOptionsPlantsEntity((prevState) => {
                                                    return [
                                                        ...prevState,
                                                        {
                                                            optionValue: data._id,
                                                            optionLabel: data.warehouseName,
                                                            order: optionsPlantsEntity.length,
                                                            default: false
                                                        },
                                                    ];
                                                });
                                                setFieldValue("warehouse", data._id);
                                            }
                                        }}
                                    />}

                                {showAddressDialog &&
                                    <ManageAddressDialog
                                        onClose={() => {
                                            setShowAddressDialog(false);
                                        }}
                                        onSuccess={(obj) => {
                                            if (obj) {
                                                setShowAddressDialog(false);
                                                if (obj?.isAlreadyExist === true) {
                                                    let tempAddress = addressType === 'shippingAddress' ? addressData.find(d => d?.optionLabel === obj?.fullAddress) : addressData.find(d => d?.optionLabel === obj?.fullAddress)
                                                    if (addressType === 'shippingAddress') {
                                                        onShippingAddressOpen(values.customerAccount, tempAddress?.optionValue)
                                                    }
                                                    else {
                                                        onBillingAddressOpen(values.customerAccount, tempAddress?.optionValue)
                                                    }
                                                    setFieldValue(addressType, tempAddress?.optionValue);
                                                }
                                                else {
                                                    setAddressData((prevState) => [...prevState,
                                                    {
                                                        default: false,
                                                        optionLabel: obj?.fullAddress,
                                                        optionValue: obj._id,
                                                        order: addressData.length + 1,
                                                    }])
                                                    if (addressType === 'shippingAddress') {
                                                        setShippingAddress((prevState) => [...prevState,
                                                        {
                                                            default: false,
                                                            optionLabel: obj?.fullAddress,
                                                            optionValue: obj._id,
                                                            order: shippingAddress.length + 1,
                                                        }])
                                                    } else {
                                                        setBillingAddress((prevState) => [...prevState,
                                                        {
                                                            default: false,
                                                            optionLabel: obj?.fullAddress,
                                                            optionValue: obj._id,
                                                            order: billingAddress.length + 1,
                                                        }])
                                                    }
                                                    setFieldValue(addressType, obj._id);
                                                }
                                            }
                                        }}
                                    />
                                }
                            </>
                        )}
                    </Formik>
                )}
            </Dialog>
        </>
    );

}

export default ManageRentalManagementDialog;

