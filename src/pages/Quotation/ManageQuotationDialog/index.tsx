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
    CustomDialogTransition, customerAccount, customerContact, getCollaboratorDropdownDataSource, getObjKeys,
    getObjKeysWithValues, getOwnerDropdownDataSource, quotation, setFieldsInAscendingOrder, yupSchema,
    generateUniqueIdOnly
} from "../../../constants/helpers";
import axiosInstance from '../../../axios/axiosInstance'
import Dialog from "@material-ui/core/Dialog";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog";
import { useHistory } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import { FaDiceOne } from "react-icons/fa";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../../Account/ManageAccount";
import ManageContactDialog from "../../Contact/ManageContact";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { isEqual } from "lodash";

const ManageQuotationDialog = ({ isClone, quotationId, quotationData = null, onClose, onSuccess, open }) => {

    const history = useHistory()
    const toastConfig = useContext(CustomToastContext);

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const {
        state: { user, permissions, selectedEntity },
    }: any = useData();
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

    const [salesDetails, setSalesDetails] = useState(null);
    const [cloneHeading, setCloneHeading] = useState('');
    const [countryBillToDropDown, setCountryBillToDropDown] = useState([]);
    const [countrySellToDropDown, setCountrySellToDropDown] = useState([]);
    const [countryBillToMainData, setCountryBillToMainData] = useState([]);
    const [countrySellToMainData, setCountrySellToMainData] = useState([]);

    const updateAccountDropdown = (data) => {
        const entityFields = initialData.fields;
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
                },
            ];
            setAccountData(entityFields[customerAccountNameFieldIndex].option);
        }
    };

    const updateContactDropdown = (data) => {
        const entityFields = initialData.fields;
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
        const ownerCollabOptions = initialData.fields.filter(
            (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
        );
        if (ownerCollabOptions.length > 0) {
            setOwnerCollaboratorData(ownerCollabOptions[0].option);
            setOwnerData(ownerCollabOptions[0].option);
            setCollaboratorData(ownerCollabOptions[0].option);
        }
        let customerAccountOptions = initialData.fields.find(
            (d) => d.fieldName === "customerAccount"
        );
        if (customerAccountOptions) {
            setAccountData(customerAccountOptions.option);
        }
        let customerContactOptions = initialData.fields.find(
            (d) => d.fieldName === "customerContact"
        );
        if (customerContactOptions) {
            setContactData(customerContactOptions.option);
        }
        const customerContactDropdownData = initialData.fields.find(
            (d) => d.fieldName === "customerContact"
        );
        const countryBillToDropdownData = initialData.fields.find(
            (d) => d.fieldName === "billingAddress"
        );
        if (countryBillToDropdownData) {
            setCountryBillToMainData(countryBillToDropdownData.option)
            setCountryBillToDropDown(countryBillToDropdownData.option)
        }
        const countrySellToDropdownData = initialData.fields.find(
            (d) => d.fieldName === "shippingAddress"
        );
        if (countryBillToDropdownData) {
            setCountrySellToMainData(countrySellToDropdownData.option)
            setCountrySellToDropDown(countrySellToDropdownData.option)
        }
        if (customerContactDropdownData) {
            setCustomerContactMainDataSource(customerContactDropdownData.option);
            if (quotationId) {
                setCustomerContactDataSource(
                    customerContactDropdownData.option.filter(
                        (d) =>
                            d.parentAccount === quotationData?.customerAccount.optionValue
                    )
                );
            }
        }
        if (initialData.values["type"]) {
            handleTypeChange(initialData.values["type"])
        }
        else {
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
    }, [quotationId]);

    const fetchFields = async () => {
        try {
            let fieldData;
            const response: any = await axiosInstance().get("/field?resource=Quotation");
            fieldData = response?.data?.data?.filter((obj) => !["rentalJob", "repairOrder", "salesOrder"]?.includes(obj?.fieldData?.fieldName));

            const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (quotationId) {
                try {
                    let data;
                    const response: any = await axiosInstance().get(`${quotation.api}/` + quotationId);
                    data = response?.data?.data;
                    if (isClone) {
                        const { _id, brand, createdBy, entity, history, products, status, quotationNumber, updatedBy, ...rest } = data
                        rest.status = "New"
                        rest.quotationNumber = `QN_${generateUniqueIdOnly()}`
                        setCloneHeading(quotationNumber)
                        setInitialData({
                            fields: fieldsDataForCreate,
                            values: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setLoading(false)
                    } else {
                        setSalesDetails(data)
                        setInitialData({
                            fields: fieldsDataForUpdate,
                            values: getObjKeysWithValues(data, fieldsDataForUpdate),
                        });
                        setLoading(false)
                    }
                } catch (error) {
                    toastConfig.setToastConfig(error);
                }
            }
            else {
                let initialData = { ...getObjKeys("", fieldsDataForCreate), currency: user.user?.brandCurrency || "", };
                initialData['quotationNumber'] = `QN_${generateUniqueIdOnly()}`
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: initialData,
                });
                setLoading(false)
            }

        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    }

    const handleSubmit = (values) => {
        setLoading(true);
        if (quotationId && isClone === false) {
            values._id = quotationId
            axiosInstance().put(`${quotation.api}`, values).then(({ data }) => {
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

        }
        else {
            axiosInstance().post(`${quotation.api}`, values).then(({ data: { data, message } }) => {
                history.push(`${routes.quotationDetail.path}/${data._id}`)
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

    const onCountrySellToDropDownOpen = (selectedAccount) => {
        let filterAddress = accountData.find(d => d.optionValue === selectedAccount)?.shippingAddress
        if (filterAddress) {
            setCountrySellToDropDown(
                countrySellToMainData.filter((d) => filterAddress?.some(u => u === d.optionValue))
            );
        }
        else {
            setCountrySellToDropDown([])
        }
    };

    const onCountryBillToDropDownOpen = (selectedAccount) => {
        let filterAddress = accountData.find(d => d.optionValue === selectedAccount)?.billingAddress
        if (filterAddress) {
            setCountryBillToDropDown(
                countryBillToMainData.filter((d) => filterAddress?.some(u => u === d.optionValue))
            );
        }
        else {
            setCountryBillToDropDown([])
        }
    };

    const handleTypeChange = (data) => {
        if (data === "Rental Job" || data === "Repair Order") {
            setFormsData(setFieldsInAscendingOrder(initialData.fields.filter(d => d.fieldName !== "expectedCustomerDeliveryDate" && d.fieldName !== "supplierSuggestedDeliveryDate")));
        }
        if (data === "Sales Order") {
            setFormsData(setFieldsInAscendingOrder(initialData.fields.filter(d => d.fieldName !== "estimateStartDate" && d.fieldName !== "estimateEndDate")));
        }
    }
    const validate = () => {

    }

    return (<Dialog
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
        {formsData && formsData.length ?
            <Formik
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
                validateOnMount
                validate={validate}
                onSubmit={handleSubmit}
            >
                {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues, submitForm }) => (
                    <>
                        <CustomDialogHeader
                            title={!quotationId ? `Create ${routes.quotation.title}` : `${isClone ? `Clone - ${cloneHeading}` : `Update ${quotationData?.quotationNumber}`}`}
                            onClose={(e, reason) => {
                                if (!isEqual(values, initialData.values)) {
                                    setShowConfirmDialog(true)
                                }
                                else {
                                    onClose()
                                }
                            }}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                        />
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate >
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
                                                                                isNew={!quotationId}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={accountData}
                                                                                disabled={!isClone ? (quotationId && field.disableOnEdit) : false}
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
                                                                                        disabled={!isClone ? (quotationId && field.disableOnEdit) : false}
                                                                                        size="small"
                                                                                    >
                                                                                        <AddIcon color={isClone ? "primary" : quotationId && field.disableOnEdit ? "disabled" : "primary"} />
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
                                                                                isNew={!quotationId}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={customerContactDataSource}
                                                                                doNotShowInfoTooltip={true}
                                                                                setFieldValue={(name, value) => {
                                                                                    setFieldValue(name, value)
                                                                                }}
                                                                                disabled={!isClone ? (quotationId && field.disableOnEdit) : false}
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
                                                                                        disabled={!isClone ? (quotationId && field.disableOnEdit) : false}
                                                                                        size="small"
                                                                                    >
                                                                                        <AddIcon color={isClone ? "primary" : (quotationId && field.disableOnEdit) ? "disabled" : "primary"} />
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
                                                                        quotationId={quotationId}
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
                                                                            if (val && val.optionValue !== user?.user?._id) {
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
                                                                        disabled={(!quotationId && field.disableOnEdit)}
                                                                        onOpen={() => {
                                                                            onOwnerDropdownOpen(
                                                                                values["collaborator"]
                                                                            );
                                                                        }}
                                                                    />
                                                                ) : field.fieldName === "collaborator" ? (
                                                                    <FormTypes
                                                                        quotationId={quotationId}
                                                                        {...field}
                                                                        disabled={!quotationId && field.disableOnEdit}
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
                                                                ) : field.fieldName === "billingAddress" ? (
                                                                    <FormTypes
                                                                        {...field}
                                                                        disabled={Boolean(quotationId) && field.disableOnEdit && !isClone}
                                                                        values={values}
                                                                        errors={errors}
                                                                        touched={touched}
                                                                        label={field.fieldLabel}
                                                                        name={field.fieldName}
                                                                        type={field.type}
                                                                        options={countryBillToDropDown}
                                                                        setFieldValue={(name, value) => {
                                                                            setFieldValue(name, value)
                                                                        }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        onOpen={() =>
                                                                            onCountryBillToDropDownOpen(values["customerAccount"])
                                                                        }
                                                                    />)
                                                                    :
                                                                    field.fieldName === "shippingAddress" ? (
                                                                        <FormTypes
                                                                            {...field}
                                                                            disabled={Boolean(quotationId) && field.disableOnEdit && !isClone}
                                                                            values={values}
                                                                            errors={errors}
                                                                            touched={touched}
                                                                            label={field.fieldLabel}
                                                                            name={field.fieldName}
                                                                            type={field.type}
                                                                            options={countrySellToDropDown}
                                                                            setFieldValue={(name, value) => {
                                                                                setFieldValue(name, value)
                                                                            }}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            onOpen={() =>
                                                                                onCountrySellToDropDownOpen(values["customerAccount"])
                                                                            }
                                                                        />)
                                                                        : (
                                                                            <FormTypes
                                                                                quotationId={quotationId}
                                                                                {...field}
                                                                                fieldData={field}
                                                                                disabled={
                                                                                    field.fieldName === "currency" ? (salesDetails && salesDetails?.material?.length ? true : false) :
                                                                                        field.fieldName === "warehouse" ? (salesDetails && salesDetails?.productInventory?.length ? true : false) :
                                                                                            (quotationId && field.disableOnEdit && !isClone)}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                options={field.option}
                                                                                setFieldValue={(name, value) => {
                                                                                    setFieldValue(name, value)
                                                                                    if (field.fieldName === "type") {
                                                                                        handleTypeChange(value)
                                                                                    }
                                                                                }}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={field?.isTooltip || false}
                                                                                tooltipMessage={field?.tooltipMessage}
                                                                                size="small"
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
                                    if (!isEqual(values, initialData.values)) {
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
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleScroll(errors)
                                    submitForm();
                                }}
                                disabled={loading}
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
                    </>
                )}
            </Formik>
            :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
    </Dialog>
    );

}

export default ManageQuotationDialog;

