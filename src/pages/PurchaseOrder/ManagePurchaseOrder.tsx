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
import { CustomDialogTransition, generateUniqueIdOnly, getCollaboratorDropdownDataSource, getOwnerDropdownDataSource, purchaseOrder, PURCHASE_ORDER_STATUS, setFieldsInAscendingOrder, supplierAccount, supplierContact } from "../../constants/helpers";
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box, Grid, IconButton, Tooltip } from '@material-ui/core';
import FormTypes from "../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { FaDiceOne } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import moment from "moment";
import { useData } from "../../StateProvider/Provider";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../Account/ManageAccount";
import ManageContactDialog from "../Contact/ManageContact";

const ManagePurchaseOrder = ({ isClone = false, purchaseOrderId = null, onClose, onSuccess, productId = null, productCategory = null,
    productsToSave = [], isFromSerializedAssetStepFromRental = false, currency = null, rentalManagementId = null, warehouseId = null, currencyDisable = false
    , deliveryDateMax = null, isFromSerializedAssetStepFromSalesOrder = false, salesOrderId = null, refrenceData = null }) => {
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext)
    const {
        state: { user, selectedEntity, permissions },
    }: any = useData();

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [purchaseOrderData, setPurchaseOrderData] = useState(null);
    const [cloneHeading, setCloneHeading] = useState('head')


    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [accountData, setAccountData] = useState([]);
    const [contactData, setContactData] = useState([]);

    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);

    const [showAddSupplierAccountDialog, setShowAddSupplierAccountDialog] = useState(false);
    const [showAddSupplierContactDialog, setShowAddSupplierContactDialog] = useState(false);

    useEffect(() => {
        axiosInstance().get("/field?resource=Purchase Order").then(({ data: { data } }) => {
            let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            fieldsDataForCreate = fieldsDataForCreate.filter(f => f.fieldName !== "rentalJob");
            fieldsDataForUpdate = fieldsDataForUpdate.filter(f => f.fieldName !== "rentalJob");
            if (purchaseOrderId) {
                axiosInstance().get(`${purchaseOrder.api}/` + purchaseOrderId).then(({ data: { data } }) => {
                    setPurchaseOrderData(data)
                    if (isClone) {
                        const { _id, createdBy, updatedBy, serialNumber, purchaseOrderNumber, ...rest } = data
                        //rest['purchaseOrderNumber'] = `PO_${generateUniqueIdOnly()}`
                        rest["status"] = "Open"
                        setInitialData({
                            fields: fieldsDataForCreate,
                            values: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setCloneHeading(purchaseOrderNumber);
                        setLoading(false)
                    } else {
                        if (data?.status === PURCHASE_ORDER_STATUS.received) {
                            fieldsDataForUpdate?.forEach((e) => {
                                if (e?.fieldName === 'warehouse') {
                                    e.disableOnEdit = true
                                }
                            })
                        }
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
                let createValues: any = getObjKeys("", fieldsDataForCreate)
                //createValues.purchaseOrderNumber = `PO_${generateUniqueIdOnly()}`
                if (productId && createValues) {
                    createValues["product"] = productId
                }
                if (productCategory && createValues) {
                    createValues["productCategory"] = productCategory
                }
                if (rentalManagementId) {
                    createValues["rentalJob"] = rentalManagementId
                }
                if (warehouseId) {
                    createValues["warehouse"] = warehouseId
                }
                if (currency) {
                    createValues["currency"] = currency
                }
                if (refrenceData) {
                    if (fieldsDataForCreate.some((e) => e.fieldName === "wellName")) {
                        createValues["wellName"] = refrenceData?.wellName
                    }
                    if (fieldsDataForCreate.some((e) => e.fieldName === "afeNumber")) {
                        createValues["afeNumber"] = refrenceData?.afeNumber
                    }
                }
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: createValues
                });
            }

            const supplierAccountOptions = fieldsDataForCreate.find(
                (d) => d.fieldName === "supplierAccount"
            );
            if (supplierAccountOptions) {
                setAccountData(supplierAccountOptions.option);
            }
            const supplierContactOptions = fieldsDataForCreate.find(
                (d) => d.fieldName === "supplierContact"
            );
            if (supplierAccountOptions) {
                setContactData(supplierContactOptions.option);
            }
            let ownerCollaboratorOptions = fieldsDataForCreate.filter(
                (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
            );
            if (ownerCollaboratorOptions.length > 0) {
                setOwnerCollaboratorData(ownerCollaboratorOptions[0].option);
                setOwnerData(ownerCollaboratorOptions[0].option);
                setCollaboratorData(ownerCollaboratorOptions[0].option);
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [purchaseOrderId]);

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }, [initialData.fields]);

    const handleSubmit = async (
        errors,
        setTouched,
        values,
        setValues,
        setErrors
    ) => {
        if (Object.keys(errors).length) {
            initialData.fields.forEach((input) => {
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
            setErrors({ ...errors });
        } else {
            handleUpdatePurchaseOrder(values)
        }
    };

    const handleUpdatePurchaseOrder = (values) => {
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
            if (isFromSerializedAssetStepFromRental || isFromSerializedAssetStepFromSalesOrder) {
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
                validateOnMount
                onSubmit={() => { }}
            >
                {({ values,
                    errors,
                    touched,
                    setFieldValue,
                    setFieldTouched,
                    setErrors,
                    setValues,
                }) => (
                    <Fragment>
                        <CustomDialogHeader title={purchaseOrderId ? (isClone ? `Clone - ${cloneHeading}` : `Update - ${purchaseOrderData?.purchaseOrderNumber || ""}`) : "Create " + routes.purchaseOrder.title}
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
                                                                fieldData={field}
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
                                                            />
                                                                : field.fieldName == "supplierAccount" ? (
                                                                    <Grid container spacing={1}>
                                                                        <Grid
                                                                            item
                                                                            xs={
                                                                                permissions.supplierAccount
                                                                                    ?.isCreate
                                                                                    ? 11
                                                                                    : 11
                                                                            }
                                                                            sm={
                                                                                permissions.supplierAccount
                                                                                    ?.isCreate
                                                                                    ? 11
                                                                                    : 11
                                                                            }
                                                                            md={
                                                                                permissions.supplierAccount
                                                                                    ?.isCreate
                                                                                    ? 11
                                                                                    : 11
                                                                            }
                                                                        >
                                                                            <FormTypes
                                                                                {...field}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                fieldData={field}
                                                                                type={field.type}
                                                                                options={accountData}

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
                                                                                    setFieldValue("supplierContact", "");
                                                                                }}
                                                                            />
                                                                        </Grid>
                                                                        {permissions.supplierAccount?.isCreate &&
                                                                            (
                                                                                <Grid item xs={1} sm={1} md={1}>
                                                                                    <Tooltip
                                                                                        title="Create Account"
                                                                                        className="mt-1"
                                                                                    >
                                                                                        <IconButton
                                                                                            onClick={() => {
                                                                                                setShowAddSupplierAccountDialog(true);
                                                                                            }}
                                                                                            disabled={!isClone ? field.disableOnEdit : false}
                                                                                            size="small"
                                                                                        >
                                                                                            <AddIcon color={isClone ? "primary" : field.disableOnEdit ? "disabled" : "primary"} />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                </Grid>
                                                                            )}
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
                                                                ) :
                                                                    field.fieldName === "supplierContact" ? (
                                                                        <Grid container spacing={1}>
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    permissions.supplierContact
                                                                                        ?.isCreate
                                                                                        ? 11
                                                                                        : 11
                                                                                }
                                                                                sm={
                                                                                    permissions.supplierContact
                                                                                        ?.isCreate
                                                                                        ? 11
                                                                                        : 11
                                                                                }
                                                                                md={
                                                                                    permissions.supplierContact
                                                                                        ?.isCreate
                                                                                        ? 11
                                                                                        : 11
                                                                                }
                                                                            >
                                                                                <FormTypes
                                                                                    isNew={Boolean(purchaseOrderId)}
                                                                                    {...field}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    fieldData={field}
                                                                                    type={field.type}
                                                                                    options={contactData.filter(d => d.parentAccount === values["supplierAccount"])}
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
                                                                            {permissions.supplierContact?.isCreate &&
                                                                                (
                                                                                    <Grid item xs={1} sm={1} md={1}>
                                                                                        <Tooltip
                                                                                            title="Create Contact"
                                                                                            className="mt-1"
                                                                                        >
                                                                                            <IconButton
                                                                                                onClick={() => {
                                                                                                    setShowAddSupplierContactDialog(true);
                                                                                                }}
                                                                                                disabled={!isClone ? field.disableOnEdit : false}
                                                                                                size="small"
                                                                                            >
                                                                                                <AddIcon color={isClone ? "primary" : field.disableOnEdit ? "disabled" : "primary"} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Grid>
                                                                                )}
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
                                                                    ) :
                                                                        field.fieldName === "deliveryDate" ?
                                                                            <FormTypes
                                                                                {...field}
                                                                                disabled={Boolean(purchaseOrderId) && field.disableOnEdit && !isClone}
                                                                                values={values}
                                                                                //maxDate={deliveryDateMax ? deliveryDateMax : undefined}
                                                                                //minDate={deliveryDateMax ? undefined : moment(new Date())}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                fieldData={field}
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
                                                                            /> : field.fieldName === "owner" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    fieldData={field}
                                                                                    type={field.type}
                                                                                    options={ownerData}
                                                                                    onChange={(e, val) => {
                                                                                        setFieldValue(
                                                                                            field.fieldName,
                                                                                            val && val.optionValue
                                                                                                ? val.optionValue
                                                                                                : ""
                                                                                        );
                                                                                        // handleValuesChange({
                                                                                        //     [field.fieldName]: val && val.optionValue ? val.optionValue : ""
                                                                                        // })

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
                                                                                    disabled={(field.disableOnEdit)}
                                                                                    onOpen={() => {
                                                                                        onOwnerDropdownOpen(
                                                                                            values["collaborator"]
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ) : field.fieldName === "collaborator" ? (
                                                                                <FormTypes
                                                                                    {...field}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    fieldData={field}
                                                                                    type={field.type}
                                                                                    options={collaboratorData}
                                                                                    setFieldValue={(name, value) => {
                                                                                        // handleValuesChange({ [name]: value })
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
                                                                            )
                                                                                : <FormTypes
                                                                                    isNew={Boolean(purchaseOrderId)}
                                                                                    {...field}
                                                                                    disabled={(Boolean(purchaseOrderId) && field.disableOnEdit && !isClone) || field.fieldName === "purchaseOrderNumber" || field.fieldName === "status" || (field.fieldName === "currency" && currencyDisable)}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    fieldData={field}
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
                                                                                />
                                                            }
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
                                disabled={
                                    loading
                                    // isFieldNotTouched(initialData, values)
                                }
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
                                        handleSubmit(
                                            errors,
                                            setFieldTouched,
                                            values,
                                            setValues,
                                            setErrors
                                        );
                                    }}
                                    onClose={() => {
                                        setShowConfirmDialog(false)
                                        onClose()
                                    }}
                                /> : null
                        }
                        {showAddSupplierAccountDialog && (
                            <ManageAccountDialog
                                open={showAddSupplierAccountDialog}
                                onClose={() => {
                                    setShowAddSupplierAccountDialog(false);
                                }}
                                id={null}
                                accountResource={supplierAccount.accountResource}
                                accountApi={supplierAccount.accountApi}
                                isGetAccountData={true}
                                onGetAddedAccount={({ data, addressDataSource }) => {
                                    setAccountData((prevState) => {
                                        return [
                                            ...prevState,
                                            {
                                                optionValue: data._id,
                                                optionLabel: data.accountName,
                                                order: accountData.length,
                                                default: false,
                                                billingAddress: data?.billingAddress,
                                                shippingAddress: data?.shippingAddress
                                            }
                                        ];
                                    });
                                    setFieldValue("supplierAccount", data._id);
                                    setFieldValue("supplierContact", "");
                                }}
                                isRedirectToDetailPage={false}
                            />
                        )}
                        {showAddSupplierContactDialog && (
                            <ManageContactDialog
                                open={showAddSupplierContactDialog}
                                onClose={() => setShowAddSupplierContactDialog(false)}
                                onSuccess={(obj) => {
                                    if (obj?.data?.data) {
                                        setContactData((prevState) => {
                                            return [
                                                ...prevState,
                                                {
                                                    optionValue: obj?.data?.data?._id,
                                                    optionLabel: `${obj?.data?.data?.firstName} ${obj?.data?.data?.lastName}`,
                                                    order: contactData.length,
                                                    default: false,
                                                    parentAccount: obj?.data?.data?.accountName
                                                }
                                            ];
                                        });
                                        setShowAddSupplierContactDialog(false);
                                        setFieldValue("supplierContact", obj?.data?.data?._id);
                                    }
                                }}
                                accountId={values["supplierAccount"]}
                                contactResource={supplierContact.contactResource}
                                contactApi={supplierContact.contactApi}
                                isRedirectToDetailPage={false}
                                collaborators={collaboratorData}
                                owner={ownerData}
                                account={supplierAccount}
                                isAccountFieldDisable={true}
                            />
                        )}
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
