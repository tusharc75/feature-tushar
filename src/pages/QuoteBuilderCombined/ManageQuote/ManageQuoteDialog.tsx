import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@material-ui/core";
import { Formik, Form } from "formik";
import Dialog from "@material-ui/core/Dialog";
import axiosInstance from "../../../axios/axiosInstance";
import {
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  initializeDropdownById,
  quoteBuilder,
  simplifyValues,
  customerAccount,
  customerContact,
  getUniqueCurrencies,
  opportunity,
} from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { useHistory } from "react-router-dom";
import PropTypes from "prop-types";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../../Account/ManageAccount";
import ManageOpportunityDialog from "../../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog";
import ManageContactDialog from "../../Contact/ManageContact";
import { isMobile, isTablet } from "react-device-detect";
import routes from "../../../components/Helpers/Routes";

const arr = [...Array(9).keys()];
export default function ManageQuoteDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  contactId = null,
  opportunityId = null,
  accountResource = null,
  isRedirectTodetailPage,
  userId = null,
  disableOwnerDropDown = false,
  isRenderedFromOpportunity = false,
  opportunityName = null,
  isRenderedFromCustomerAccount = false,
  contacts = null,
  disableCurrency = false,
  quoteApproved = false,
}) {
  const { qbApi } = quoteBuilder;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    !isNew && user.user._id !== dataToUpdate.owner.optionValue
  );

  const [entityData, setEntityData] = useState({
    fields: [],
    initialValues: {},
  });

  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] =
    useState(false);
  const [showAddCustomerContactDialog, setShowAddCustomerContactDialog] =
    useState(false);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [accountFieldDisable, setAccountFieldDisable] = useState(false);
  const [contactData, setContactData] = useState([]);
  const [newAddedAccountId, setNewAddedAccountId] = useState(null);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);
  const [customerContactMainDataSource, setCustomerContactMainDataSource] =
    useState([]);
  const [opportunityMainDataSource, setOpportunityMainDataSource] = useState(
    []
  );
  const [opportunityData, setOpportunityData] = useState([]);
  const [newAddedOpportuntiyId, setNewAddedOpportunityId] = useState(null);
  const [customerContactDataSource, setCustomerContactDataSource] = useState(
    []
  );
  const [opportunityDataSource, setOpportunityDataSource] = useState([]);
  useEffect(() => {
    let ownerCollaboratorOptions = entityData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollaboratorOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollaboratorOptions[0].option);
      setOwnerData(ownerCollaboratorOptions[0].option);
      setCollaboratorData(ownerCollaboratorOptions[0].option);
    }

    let customerAccountOptions = entityData.fields.find(
      (d) => d.fieldName === "customerAccountName"
    );
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }

    let customerContactOptions = entityData.fields.find(
      (d) => d.fieldName === "customerContactName"
    );
    if (customerContactOptions) {
      setContactData(customerContactOptions.option);
    }

    let opportunityOptions = entityData.fields.find(
      (d) => d.fieldName === "opportunity"
    );
    if (opportunityOptions) {
      setOpportunityData(opportunityOptions.option);
    }

    setAccountFieldDisable(
      isRenderedFromCustomerAccount || isRenderedFromOpportunity || contactId
    );

    sortArray();

    const customerContactDropdownData = entityData.fields.find(
      (d) => d.fieldName === "customerContactName"
    );
    if (customerContactDropdownData) {
      setCustomerContactMainDataSource(customerContactDropdownData.option);

      if (!isNew) {
        setCustomerContactDataSource(
          customerContactDropdownData.option.filter(
            (d) =>
              d.parentAccount === dataToUpdate.customerAccountName.optionValue
          )
        );
      }

      if (isNew && contactId) {
        setCustomerContactDataSource(
          customerContactDropdownData.option.filter(
            (d) =>
              d.parentAccount ===
              entityData.initialValues["customerAccountName"]
          )
        );
      }
<<<<<<< HEAD
=======


>>>>>>> 15dd417e469f35fb6f3ba2d5457123a93ac7aa2d
    }

    const opportunityDropDownData = entityData.fields.find(
      (field) => field.fieldName === "opportunity"
    );

    if (opportunityDropDownData) {
      setOpportunityMainDataSource(opportunityDropDownData.option);

      if (!isNew) {
<<<<<<< HEAD
        setOpportunityDataSource(
          opportunityDropDownData.option.filter(
            (d) =>
              d.customerAccountName ===
              dataToUpdate.customerAccountName.optionValue
          )
        );
      }

      if (isNew && opportunityId) {
        setOpportunityDataSource(
          opportunityDropDownData.option.filter(
            (d) =>
              d.customerAccountName ===
              entityData.initialValues["customerAccountName"]
          )
        );
=======
        setOpportunityDataSource(opportunityDropDownData.option.filter((d) => d.customerAccountName === dataToUpdate.customerAccountName.optionValue))
      }

      if (isNew && opportunityId) {
        setOpportunityDataSource(opportunityDropDownData.option.filter((d) => d.customerAccountName === entityData.initialValues["customerAccountName"]));
>>>>>>> 15dd417e469f35fb6f3ba2d5457123a93ac7aa2d
      }
    }

    return () => {
      setOwnerCollaboratorData([]);
      setOwnerData([]);
      setCollaboratorData([]);
      setAccountData([]);
      setOpportunityData([]);
      setContactData([]);
      setAccountFieldDisable(false);
    };
  }, [entityData.fields]);

  const sortArray = () => {
    const sections = [];
    entityData.fields.forEach((field) => {
      if (!sections.includes(field.sectionName)) {
        sections.push(field.sectionName);
      }
    });

    const customData = sections.map((name) => {
      let fields = entityData.fields.filter(
        (field) => field.sectionName === name
      );

      const sectionFields = fields.map((formData) => formData);
      return { name, sectionFields };
    });

    setFormsData(customData);
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

  const onCustomerContactDropdownOpen = (selectedAccount) => {
    setCustomerContactDataSource(
      customerContactMainDataSource.filter(
        (d) => d.parentAccount === selectedAccount
      )
    );
  };

  const onOpportunityDropDownOpen = (selectedAccount) => {
    setOpportunityDataSource(
      opportunityMainDataSource.filter(
        (opportunity) => opportunity.customerAccountName === selectedAccount
      )
    );
  };

  useEffect(() => {
    getQuoteFields();

    return () => {
      setCurrencySymbol(null);
      setEntityData({
        fields: [],
        initialValues: {},
      });
    };
  }, []);

  const getQuoteFields = () => {
    axiosInstance()
      .get(`/field?resource=Quotes&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        if (!quoteApproved) {
          data = data.filter(
            (_f) => _f.fieldData.sectionName !== "Invoice Information"
          );
        }

        const newFields = [];

        const filterData = isNew
          ? data.filter((d) => d.isCreate)
          : data.filter((d) => d.isUpdate);

        filterData.map((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (accountId && _f.fieldData.fieldName === "customerAccountName") {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
          }

          if (contactId && _f.fieldData.fieldName === "customerContactName") {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, contactId);
          }

<<<<<<< HEAD
          if (opportunityId && _f.fieldData.fieldName === "opportunity") {
=======
          if (
            opportunityId &&
            _f.fieldData.fieldName === "opportunity") {
>>>>>>> 15dd417e469f35fb6f3ba2d5457123a93ac7aa2d
            _f = initializeDropdownById(
              _f,
              _f.fieldData.fieldName,
              opportunityId
            );
          }

          if (!isNew && _f.fieldData.fieldName === "currency") {
            setCurrencySymbol(
              getUniqueCurrencies().find(
                (d) => d.currencyCode === dataToUpdate["currency"]
              )?.symbolNative
            );
          }
          if (isNew && userId && _f.fieldData.fieldName === "owner") {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
          }

          if (_f.fieldData.fieldName !== "supplierAccountName") {
            newFields.push(_f.fieldData);
          }
        });
        let initialData = getObjKeys("", newFields);
        if (isRenderedFromOpportunity) {
          initialData["quoteName"] = opportunityName;
        }
        setEntityData({
          fields: newFields,
          initialValues: isNew
            ? initialData
            : getObjKeysWithValues(dataToUpdate, newFields),
        });
      });
  };

  const onSubmit = (values) => {
    isNew ? handleCreateQuote(values) : handleUpdateQuote(values);
  };

  const handleCreateQuote = (values) => {
    // values.closeDate = "03/03/2021"
    if (
      accountId &&
      accountResource !== customerAccount.accountResource &&
      !isRenderedFromOpportunity
    )
      values["supplierAccountName"] = [accountId];
    setLoading(true);
    console.log(values);
    if (values.customerContactName === "") {
      values.customerContactName = [];
    }
    axiosInstance()
      .post(`${qbApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectTodetailPage)
          history.push(`${routes.quoteBuilder.path}/${newId}`);
        setLoading(false);
        onSuccess(newId);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleUpdateQuote = (values) => {
    values = { ...values, _id: dataToUpdate._id };
    setLoading(true);

    axiosInstance()
      .put(`${qbApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const updateAccountDropdown = (data) => {
    const entityFields = entityData.fields;
    const customerAccountNameFieldIndex = entityFields.findIndex(
      (d) => d.fieldName === "customerAccountName"
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

  const updateOpportunityDropdown = (data) => {
    const entityFields = entityData.fields;
    const opportunityFieldIndex = entityFields.findIndex(
      (d) => d.fieldName === "opportunity"
    );

    if (opportunityFieldIndex > -1) {
      let newOpportunity = {
        optionValue: data._id,
        optionLabel: data.opportunityName,
        order: entityFields[opportunityFieldIndex].option.length,
        default: false,
        customerAccountName: data.customerAccountName,
      };
      entityFields[opportunityFieldIndex].option = [
        ...entityFields[opportunityFieldIndex].option,
        newOpportunity,
      ];

      setOpportunityMainDataSource(entityFields[opportunityFieldIndex].option);

      setOpportunityDataSource((prevState) => [...prevState, newOpportunity]);
    }
  };

  const updateContactDropdown = (data) => {
    const entityFields = entityData.fields;
    const customerContactNameFieldIndex = entityFields.findIndex(
      (d) => d.fieldName === "customerContactName"
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

  return (
    <>
      <Dialog
        maxWidth="md"
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}
        disableBackdropClick={true}
        fullWidth
        fullScreen={isMobile || isTablet}
      >
        <CustomDialogHeader
          title={isNew ? "Create Quote" : `Editing ${dataToUpdate.quoteName}`}
          onClose={onClose}
        />

        {entityData.fields.length === 0 && (
          <CustomDialogContent>
            <CommonSkeleton lenArray={arr} />
          </CustomDialogContent>
        )}
        {entityData.fields.length > 0 && (
          <Formik
            initialValues={entityData.initialValues}
            validationSchema={yupSchema(entityData.fields)}
            validateOnMount
            onSubmit={onSubmit}
          >
            {({
              submitForm,
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
                    {formsData &&
                      formsData.map((form, index1) => {
                        return form.name ? (
                          <div key={index1}>
                            <h2 className="form-label-style">{form.name}</h2>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    {field.fieldName === "quoteName" ? (
                                      <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        disabled={isRenderedFromOpportunity}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                        // doNotShowInfoTooltip={true}
                                        // onChange={(e, value) => {
                                        //   setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");
                                        //   setFieldValue("customerContactName", [])
                                        // }}
                                      />
                                    ) : field.fieldName ==
                                      "customerAccountName" ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions.customerAccount
                                              .isCreate && !accountFieldDisable
                                              ? 10
                                              : 11
                                          }
                                          sm={
                                            permissions.customerAccount
                                              .isCreate && !accountFieldDisable
                                              ? 10
                                              : 11
                                          }
                                          md={
                                            permissions.customerAccount
                                              .isCreate && !accountFieldDisable
                                              ? 10
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountData}
                                            disabled={accountFieldDisable}
                                            // setFieldValue={setFieldValue}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={true}
                                            size="small"
                                            doNotShowInfoTooltip={true}
                                            onChange={(e, value) => {
                                              setFieldValue(
                                                field.fieldName,
                                                value && value.optionValue
                                                  ? value.optionValue
                                                  : ""
                                              );
                                              setFieldValue(
                                                "customerContactName",
                                                []
                                              );
                                              setFieldValue("opportunity", "");
                                            }}
                                          />
                                        </Grid>
                                        {permissions.customerAccount.isCreate &&
                                          !accountFieldDisable && (
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
                                                  size="small"
                                                >
                                                  <AddIcon color="primary" />
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
                                    ) : field.fieldName ===
                                      "customerContactName" ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions.customerContact.isCreate
                                              ? 10
                                              : 11
                                          }
                                          sm={
                                            permissions.customerContact.isCreate
                                              ? 10
                                              : 11
                                          }
                                          md={
                                            permissions.customerContact.isCreate
                                              ? 10
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={customerContactDataSource}
                                            doNotShowInfoTooltip={true}
                                            setFieldValue={setFieldValue}
                                            disabled={contactId ? true : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={false}
                                            size="small"
                                            onOpen={() =>
                                              onCustomerContactDropdownOpen(
                                                values.customerAccountName
                                              )
                                            }
                                            // onChange={(e, value) => {
                                            //   setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");

                                            // }}
                                          />
                                        </Grid>
                                        {permissions.customerContact.isCreate &&
                                          contactId === null && (
                                            <Grid item xs={1} sm={1} md={1}>
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
                                                  size="small"
                                                >
                                                  <AddIcon color="primary" />
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
                                    ) : field.fieldName === "opportunity" ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions.opportunity.isCreate &&
                                            !isRenderedFromOpportunity
                                              ? 10
                                              : 11
                                          }
                                          sm={
                                            permissions.opportunity.isCreate &&
                                            !isRenderedFromOpportunity
                                              ? 10
                                              : 11
                                          }
                                          md={
                                            permissions.opportunity.isCreate &&
                                            !isRenderedFromOpportunity
                                              ? 10
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={opportunityDataSource}
                                            disabled={isRenderedFromOpportunity}
                                            setFieldValue={setFieldValue}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={true}
                                            doNotShowInfoTooltip={true}
                                            size="small"
                                            onOpen={() =>
                                              onOpportunityDropDownOpen(
                                                values.customerAccountName
                                              )
                                            }
                                          // onChange={(e, value) => {
                                          //   setFieldValue(
                                          //     field.fieldName,
                                          //     value && value.optionValue
                                          //       ? value.optionValue
                                          //       : ""
                                          //   );
                                          // }}
                                          />
                                        </Grid>
                                        {permissions.opportunity.isCreate &&
                                          !isRenderedFromOpportunity && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip
                                                title="Create Opportunity"
                                                className="mt-1"
                                              >
                                                <IconButton
                                                  onClick={() => {
                                                    setShowCreateOpportunity(
                                                      true
                                                    );
                                                  }}
                                                  size="small"
                                                >
                                                  <AddIcon color="primary" />
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
                                            val && val.optionValue ? val.optionValue : ""
                                          );

                                          if (val && val.optionValue !== user?.user?._id) {
                                            const checkOwnerAddedInCollaborator = values["collaborator"].find(d => d.optionValue === user?.user?._id);
                                            if (!checkOwnerAddedInCollaborator) {
                                              setFieldValue("collaborator",
                                                [...values["collaborator"], collaboratorData.find(d => d.optionValue === user?.user?._id).optionValue])
                                            }
                                          }
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                        disabled={disableOwnerDropDown}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(
                                            values["collaborator"]
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "collaborator" ? (
                                      <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={collaboratorData}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                        onOpen={() => {
                                          onCollabOwnerMultiselectOpen(
                                            values["owner"]
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "probability" ? (
                                      <FormTypes
                                        // {...rest}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                        onChange={(e) => {
                                          if (
                                            e.target.value &&
                                            parseFloat(e.target.value) > 100
                                          ) {
                                            setFieldValue("probability", "100");
                                          } else {
                                            setFieldValue(
                                              "probability",
                                              e.target.value
                                            );
                                          }
                                        }}
                                      />
                                    ) : field.fieldName === "lostReason" ? (
                                      values["stage"] === "Closed Lost" ? (
                                        <FormTypes
                                          // {...rest}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={setFieldValue}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={true}
                                          size="small"
                                        />
                                      ) : null
                                    ) : field.fieldName === "currency" ? (
                                      <FormTypes
                                        disabled={disableCurrency}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                        onChange={(e, val) => {
                                          if (val && val.currencyCode) {
                                            setFieldValue(
                                              field.fieldName,
                                              val.currencyCode
                                            );
                                            setCurrencySymbol(val.symbolNative);
                                          } else {
                                            setFieldValue(field.fieldName, "");
                                            setCurrencySymbol(null);
                                          }
                                        }}
                                      />
                                    ) : field.fieldName === "estimatedAmount" ||
                                      field.fieldName === "invoiceAmount" ? (
                                      <FormTypes
                                        // {...rest}
                                        startAdornment={
                                          currencySymbol ? (
                                            <InputAdornment position="start">
                                              {currencySymbol}
                                            </InputAdornment>
                                          ) : (
                                            ""
                                          )
                                        }
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                      />
                                    ) : (
                                      <FormTypes
                                        // {...rest}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
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
                        ) : (
                          form.sectionFields.map((field) => (
                            <FormTypes
                              // {...rest}
                              values={values}
                              errors={errors}
                              touched={touched}
                              label={field.fieldLabel}
                              name={field.fieldName}
                              type={field.type}
                              options={field.option}
                              setFieldValue={setFieldValue}
                              required={field.required}
                              fullWidth
                              isTooltip={true}
                              size="small"
                              style={{ visibility: "hidden" }}
                            />
                          ))
                        );
                      })}
                  </Form>

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

                        setFieldValue("customerAccountName", data._id);
                        setFieldValue("customerContactName", "");
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

                          setFieldValue("customerContactName", [
                            ...values["customerContactName"],
                            obj.id,
                          ]);
                        }
                      }}
                      accountId={
                        values["customerAccountName"]
                          ? values["customerAccountName"]
                          : accountId
                      }
                      contactResource={customerContact.contactResource}
                      contactApi={customerContact.contactApi}
                      isRedirectToDetailPage={false}
                      collaborators={collaboratorData}
                      owner={ownerData}
                      account={customerAccount}
                    />
                  )}
                  {showCreateOpportunity && (
                    <ManageOpportunityDialog
                      isNew={true}
                      isRedirectTodetailPage={false}
                      open={showCreateOpportunity}
                      onClose={() => setShowCreateOpportunity(false)}
                      onSuccess={({ data }) => {
                        setShowCreateOpportunity(false);
                        setNewAddedOpportunityId(data._id);
                        updateOpportunityDropdown(data);
                        setFieldValue("opportunity", data._id);
<<<<<<< HEAD
=======

>>>>>>> 15dd417e469f35fb6f3ba2d5457123a93ac7aa2d
                      }}
                      accountId={
                        values["customerAccountName"]
                          ? values["customerAccountName"]
                          : accountId
                      }
                      resource={accountResource}
                      dataToUpdate={null}
                      disableOwnerAndAccount={
                        values["customerAccountName"] ? true : false
                      }
                    />
                  )}
                </CustomDialogContent>

                <CustomDialogFooter>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>

                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={
                      uploadingImageOrFileProgress > 0 ||
                      Object.values(
                        simplifyValues(
                          entityData.initialValues,
                          entityData.fields
                        )
                      ).toString() ===
                        Object.values(
                          simplifyValues(values, entityData.fields)
                        ).toString()
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        )}
      </Dialog>
    </>
  );
}

ManageQuoteDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  contactId: PropTypes.string,
  accountResource: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
  disableOwnerDropDown: PropTypes.bool,
  isRenderedFromOpportunity: PropTypes.bool,
  opportunityName: PropTypes.string,
  contacts: PropTypes.any,
};
