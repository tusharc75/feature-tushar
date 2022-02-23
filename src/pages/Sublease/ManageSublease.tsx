import { useState, useEffect, Fragment, useContext, useRef } from "react";
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
import {
    CustomDialogTransition, generateUniqueIdOnly, getCollaboratorDropdownDataSource,
    getOwnerDropdownDataSource, sublease, setFieldsInAscendingOrder, supplierAccount, supplierContact
} from "../../constants/helpers";
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box, Grid, IconButton, Tooltip } from '@material-ui/core';
import FormTypes from "../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { FaDiceOne } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { useData } from "../../StateProvider/Provider";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../Account/ManageAccount";
import ManageContactDialog from "../Contact/ManageContact";
import { isEqual } from 'lodash';
import moment from "moment";

const ManageSublease = ({ isClone = false, subleaseId = null, onClose, onSuccess, currency = null,
    refrenceType = null, refrenceId = null, refrenceData = null }) => {

    const history = useHistory();
    const toastConfig = useContext(CustomToastContext)
    const { state: { user, selectedEntity, permissions } }: any = useData();
    const ref = useRef(null);

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [subleaseData, setSubleaseData] = useState(null);

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [accountData, setAccountData] = useState([]);
    const [contactData, setContactData] = useState([]);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);

    const [showAddSupplierAccountDialog, setShowAddSupplierAccountDialog] = useState(false);
    const [showAddSupplierContactDialog, setShowAddSupplierContactDialog] = useState(false);

    const [countryBillToDropDown, setCountryBillToDropDown] = useState([]);
    const [countrySellToDropDown, setCountrySellToDropDown] = useState([]);
    const [countryBillToMainData, setCountryBillToMainData] = useState([]);
    const [countrySellToMainData, setCountrySellToMainData] = useState([]);

    useEffect(() => {
        axiosInstance().get("/field?resource=Sublease").then(({ data: { data } }) => {
            let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            if (subleaseId) {
                axiosInstance().get(`${sublease.api}/` + subleaseId).then(({ data: { data } }) => {
                    setSubleaseData(data)
                    if (isClone) {
                        const { _id, createdBy, updatedBy, serialNumber, ...rest } = data
                        rest['subleaseName'] = `SL_${generateUniqueIdOnly()}`
                        rest["status"] = "New"
                        setInitialData({
                            fields: fieldsDataForCreate,
                            values: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setLoading(false)
                    } else {
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
                createValues["subleaseName"] = `SL_${generateUniqueIdOnly()}`
                if (currency) {
                    createValues["currency"] = currency
                }
                if (refrenceType === "rentalJob") {
                    createValues["rentalJob"] = refrenceId
                    createValues["estimateStartDate"] = refrenceData.estimateStartDate
                    createValues["actualStartDate"] = refrenceData.actualStartDate
                    createValues["estimateEndDate"] = refrenceData.estimateEndDate
                    createValues["actualEndDate"] = refrenceData.actualEndDate
                }
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: createValues
                });
            }
            let ownerCollaboratorOptions = fieldsDataForCreate.filter(
                (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
            );
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
            if (ownerCollaboratorOptions.length > 0) {
                setOwnerCollaboratorData(ownerCollaboratorOptions[0].option);
                setOwnerData(ownerCollaboratorOptions[0].option);
                setCollaboratorData(ownerCollaboratorOptions[0].option);
            }
            const countryBillToDropdownData = fieldsDataForCreate.find(
                (d) => d.fieldName === "billingAddress"
            );
            if (countryBillToDropdownData) {
                setCountryBillToMainData(countryBillToDropdownData.option)
                setCountryBillToDropDown(countryBillToDropdownData.option)
            }
            const countrySellToDropdownData = fieldsDataForCreate.find(
                (d) => d.fieldName === "shippingAddress"
            );
            if (countrySellToDropdownData) {
                setCountrySellToMainData(countrySellToDropdownData.option)
                setCountrySellToDropDown(countrySellToDropdownData.option)
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [subleaseId]);

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }, [initialData.fields]);


    const handleSubmit = (values) => {
        setLoading(true)
        if (subleaseId && isClone === false) {
            values._id = subleaseId
            axiosInstance().put(`${sublease.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`${sublease.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                if (refrenceType) {
                    const material: any = []
                    refrenceData.material.forEach(d => {
                        const element: any = {};
                        element.materialId = d._id;
                        element.type = "product";
                        element.unit = d.unit;
                        element.qty = d.assetsCount;
                        element.parentId = null;
                        element.estimateStartDate = refrenceData?.estimateStartDate;
                        element.estimateEndDate = refrenceData?.estimateEndDate;
                        element.actualStartDate = refrenceData?.actualStartDate;
                        element.actualEndDate = refrenceData?.actualEndDate;
                        material.push(element);
                    });
                    axiosInstance().post(`${sublease.api}/productpackage/${data._id}`, { material })
                        .then(() => {
                            onSuccess()
                        }).catch((error) => {
                            toastConfig.setToastConfig(error)
                        });
                }
                else {
                    history.push(`${sublease.api}/detail/${data._id}`);
                }
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

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
                innerRef={ref}
                initialValues={initialData.values}
                validationSchema={yupSchema(initialData.fields)}
                validateOnMount
                onSubmit={handleSubmit}
            >
                {({ values,
                    errors,
                    touched,
                    submitForm,
                    setFieldValue,
                }) => (
                    <Fragment>
                        <CustomDialogHeader title={subleaseId ? (isClone ? "Clone" : `Update ${subleaseData?.subleaseName}`) : "Create " + routes.sublease.title}
                            onClose={() => {
                                if (!isEqual(ref.current.values, initialData.values)) {
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
                                                            {field.fieldName == "supplierAccount" ? (
                                                                <Grid container spacing={1}>
                                                                    <Grid item xs={permissions.supplierAccount?.isCreate ? 11 : 11}
                                                                        sm={permissions.supplierAccount?.isCreate ? 11 : 11}
                                                                        md={permissions.supplierAccount?.isCreate ? 11 : 11}
                                                                    >
                                                                        <FormTypes
                                                                            {...field}
                                                                            fieldData={field}
                                                                            values={values}
                                                                            errors={errors}
                                                                            touched={touched}
                                                                            label={field.fieldLabel}
                                                                            name={field.fieldName}
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
                                                                                
                                                                                setFieldValue("shippingAddress", "");
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
                                                                        <Grid item
                                                                            xs={permissions.supplierContact?.isCreate ? 11 : 11}
                                                                            sm={permissions.supplierContact?.isCreate ? 11 : 11}
                                                                            md={permissions.supplierContact?.isCreate ? 11 : 11}
                                                                        >
                                                                            <FormTypes
                                                                                isNew={Boolean(subleaseId)}
                                                                                {...field}
                                                                                fieldData={field}
                                                                                values={values}
                                                                                errors={errors}
                                                                                touched={touched}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
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
                                                                ) : field.fieldName === "owner" ? (
                                                                    <FormTypes
                                                                        {...field}
                                                                        values={values}
                                                                        fieldData={field}
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
                                                                        fieldData={field}
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
                                                                ) : field.fieldName === "estimateStartDate" ? (
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
                                                                            setFieldValue(name, value)
                                                                            if (!subleaseId || isClone) {
                                                                                setFieldValue("actualStartDate", value)
                                                                            }
                                                                        }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        minDate={new Date()}
                                                                        maxDate={values["estimateEndDate"] ? moment(values["estimateEndDate"]).subtract(1, "day") : moment().add(5, "years")}
                                                                    />
                                                                ) : field.fieldName === "estimateEndDate" ? (
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
                                                                            setFieldValue(name, value)
                                                                            if (!subleaseId || isClone) {
                                                                                setFieldValue("actualEndDate", value)
                                                                            }
                                                                        }}
                                                                        required={field.required}
                                                                        fullWidth
                                                                        isTooltip={field?.isTooltip || false}
                                                                        tooltipMessage={field?.tooltipMessage}
                                                                        size="small"
                                                                        minDate={moment(values["estimateStartDate"]).add(1, "day")}
                                                                    />
                                                                ) : ["actualStartDate", "actualEndDate"].includes(field.fieldName) ? (
                                                                    <FormTypes
                                                                        {...field}
                                                                        fieldData={field}
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
                                                                    />
                                                                )
                                                                    : field.fieldName === "billingAddress" ? (
                                                                        <FormTypes
                                                                            {...field}
                                                                            disabled={Boolean(subleaseId) && field.disableOnEdit && !isClone}
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
                                                                                onCountryBillToDropDownOpen(values["supplierAccount"])
                                                                            }
                                                                        />)
                                                                        : field.fieldName === "shippingAddress" ? (
                                                                            <FormTypes
                                                                                {...field}
                                                                                disabled={Boolean(subleaseId) && field.disableOnEdit && !isClone}
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
                                                                                    onCountrySellToDropDownOpen(values["supplierAccount"])
                                                                                }
                                                                            />)
                                                                            : <FormTypes
                                                                                isNew={Boolean(subleaseId)}
                                                                                {...field}
                                                                                fieldData={field}
                                                                                disabled={(Boolean(subleaseId) && field.disableOnEdit && !isClone)}
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
                                    if (!isEqual(ref.current.values, initialData.values)) {
                                        setShowConfirmDialog(true)
                                    }
                                    else {
                                        onClose()
                                    }
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
                                    setFieldValue("shippingAddress", "");
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

export default ManageSublease;
