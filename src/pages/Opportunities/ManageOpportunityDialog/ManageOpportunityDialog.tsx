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
  opportunity,
  simplifyValues,
  customerAccount,
  setFieldsInAscendingOrder,
  getUniqueCurrencies,
  formFieldNames,
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
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";
import ManageMarketSegmentDialog from "../../MarketSegment/ManageMarketSegmentDialog";

const arr = [...Array(9).keys()];
export default function ManageOpportunityDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  isRedirectTodetailPage,
  userId = null,
  contactId = null,
  contactResource = null,
  disableOwnerAndAccount = false,

}) {
  const { opportunityApi } = opportunity;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    (!isNew && user.user._id !== dataToUpdate.owner.optionValue) ||
    disableOwnerAndAccount
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
  const [accountData, setAccountData] = useState([]);
  const [additionalFieldName, setAdditionalFieldName] = useState("")
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

  const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);
  const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
  const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
  const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
  const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
  const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);

  useEffect(() => {
    if (isNew) {
      const processSteps = entityData.fields.find(
        (d) => d.type.toLowerCase() === "process"
      );

      if (processSteps) {
        entityData.fields.map((d) => {
          if (d.sectionName === processSteps.additionalInfoSection) {
            setAdditionalFieldName(d.sectionName)
          }
        });
      }
    }
    if (!isNew) {
      const processSteps = entityData.fields.find(
        (d) => d.type.toLowerCase() === "process"
      );
      if (processSteps) {
        let len = processSteps.option.length;
        if (dataToUpdate.process !== processSteps.option[len - 1]["optionValue"]) {
          entityData.fields.map((d) => {
            if (
              d.sectionName === processSteps.additionalInfoSection) {

              setAdditionalFieldName(d.sectionName)
            }
          });
        }

      }
    }
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

    setFormsData(setFieldsInAscendingOrder(entityData.fields));

    return () => {
      setOwnerCollaboratorData([]);
      setOwnerData([]);
      setCollaboratorData([]);
      setAccountData([]);
    };
  }, [entityData.fields]);

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
    getOpportunityFields();

    return () => {
      setCurrencySymbol(null);
      setEntityData({
        fields: [],
        initialValues: {},
      });
    };
  }, []);

  const getOpportunityFields = () => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const newFields = [];

        const filterData = isNew
          ? data.filter((d) => d.isCreate)
          : data.filter((d) => d.isUpdate);

        //  Initialize market segment dropdown which have parentMarketSegment === "" or that record have child
        const marketSegmentDropdownData = filterData.map(m => m.fieldData).find(
          (d) => d.fieldName === formFieldNames.marketSegment
        );
        if (marketSegmentDropdownData) {
          setMainMarketSegmentDataSource(marketSegmentDropdownData.option);

          let initializeMarketSegmentDataSource = [];
          marketSegmentDropdownData.option.forEach(option => {
            if (option.parentMarketSegment === "" || marketSegmentDropdownData.option.some(s => s.parentMarketSegment === option.optionValue)) {
              initializeMarketSegmentDataSource.push(option);
            }
          })
          setMarketSegmentDataSource(initializeMarketSegmentDataSource);
        }

        filterData.map((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (
            accountId &&
            ["customerAccountName", "supplierAccountName"].some(
              (d) => d === _f.fieldData.fieldName
            )
          ) {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
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

        if (!isNew && marketSegmentDropdownData) {
          setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter(d => d.parentMarketSegment === dataToUpdate.marketSegment?.optionValue));
        }

        setEntityData({
          fields: newFields,
          initialValues: isNew
            ? getObjKeys("", newFields)
            : getObjKeysWithValues(dataToUpdate, newFields),
        });
      });
  };

  const onSubmit = (values) => {
    isNew ? handleCreateOpportunity(values) : handleUpdateOpportunity(values);
  };

  const initializeMarketSegmentDropdown = (values, marketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.marketSegment)) {
      const getNewAddedMarketSegment = marketSegmentSource.find(
        (d) => d.optionValue === newMarketSegmentId
      );
      if (getNewAddedMarketSegment) {
        values[formFieldNames.marketSegment] = getNewAddedMarketSegment.optionValue;
      }
      return values;
    }
    return values;
  };

  const initializeSubMarketSegmentDropdown = (values, subMarketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.subMarketSegment)) {
      const getNewAddedSubMarketSegment = subMarketSegmentSource.find(
        (d) => d.optionValue === newSubMarketSegmentId
      );
      if (getNewAddedSubMarketSegment) {
        values[formFieldNames.subMarketSegment] = getNewAddedSubMarketSegment.optionValue;
      }
      return values;
    }
    return values;
  };

  const marketSegmentChange = (marketSegmentId: string) => {
    setSubMarketSegmentDataSource(marketSegmentId ? mainMarketSegmentDataSource.filter(d => d.parentMarketSegment === marketSegmentId) : []);
  }

  const handleCreateOpportunity = (values) => {
    if (accountId) values["supplierAccountName"] = [accountId];
    if (contactId && contactResource)
      values.staticData = {
        [contactResource]: [contactId],
      };
    setLoading(true);
    axiosInstance()
      .post(`${opportunityApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectTodetailPage)
          history.push(`${opportunityApi}/detail/${newId}`);
        onSuccess(data);
        setTimeout(() => setLoading(false), 500);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleUpdateOpportunity = (values) => {
    values = { ...values, _id: dataToUpdate._id };
    setLoading(true);

    axiosInstance()
      .put(`${opportunityApi}?entity=${selectedEntity}`, values)
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

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}
        disableBackdropClick={true}
      >
        <CustomDialogHeader
          title={
            isNew
              ? "Create Opportunity"
              : `Editing ${dataToUpdate.opportunityName}`
          }
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
                      formsData.filter((item) => item.name !== additionalFieldName).map((form, index1) => {
                        return form.name ? (
                          <div key={index1}>
                            <h2 className="form-label-style">{form.name}</h2>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    {field.fieldName ==
                                      "customerAccountName" ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions.customerAccount.isCreate
                                              ? 10
                                              : 11
                                          }
                                          sm={
                                            permissions.customerAccount.isCreate
                                              ? 10
                                              : 11
                                          }
                                          md={
                                            permissions.customerAccount.isCreate
                                              ? 10
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            isNew={isNew}
                                            {...field}
                                            disabled={disableOwnerAndAccount || (!isNew && field.disableOnEdit)}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountData}
                                            setFieldValue={setFieldValue}
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
                                          />
                                        </Grid>
                                        {permissions.customerAccount.isCreate &&
                                          !accountId && (
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
                                                  disabled={disableOwnerAndAccount || (!isNew && field.disableOnEdit)}
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
                                        isNew={isNew}
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
                                                  d.optionValue ===
                                                  user?.user?._id
                                              );
                                            if (
                                              !checkOwnerAddedInCollaborator
                                            ) {
                                              setFieldValue("collaborator", [
                                                ...values["collaborator"],
                                                collaboratorData.find(
                                                  (d) =>
                                                    d.optionValue ===
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
                                        disabled={disableOwnerSelection || (!isNew && field.disableOnEdit)}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(
                                            values["collaborator"]
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "collaborator" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        disabled={!isNew && field.disableOnEdit}
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
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onOpen={() => {
                                          onCollabOwnerMultiselectOpen(
                                            values["owner"]
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "probability" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        // {...rest}
                                        disabled={!isNew && field.disableOnEdit}
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
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
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
                                          isNew={isNew}
                                          {...field}
                                          // {...rest}
                                          disabled={!isNew && field.disableOnEdit}
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
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      ) : null
                                    ) : field.fieldName === "currency" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        // {...rest}
                                        disabled={!isNew && field.disableOnEdit}
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
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
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
                                    ) : field.fieldName.trim() ===
                                      "estimatedAmount" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        // {...rest}
                                        disabled={!isNew && field.disableOnEdit}
                                        selectedCurrencyCode={values["currency"]}
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
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    ) : field.fieldName === formFieldNames.marketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions.marketSegment.isCreate ? 10
                                              : 11
                                          }
                                          sm={
                                            permissions.marketSegment.isCreate ? 10
                                              : 11
                                          }
                                          md={
                                            permissions.marketSegment.isCreate ? 10
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            isNew={isNew}
                                            {...field}
                                            disabled={!isNew && field.disableOnEdit}
                                            fields={entityData.fields}
                                            fieldData={field}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            setFieldValue={setFieldValue}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field.isTooltip}
                                            tooltipMessage={field.tooltipMessage}
                                            onChange={(e, val) => {
                                              setNewMarketSegmentId(null);
                                              setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                              setNewSubMarketSegmentId(null);
                                              setFieldValue(formFieldNames.subMarketSegment, "")
                                              marketSegmentChange(val && val.optionValue ? val.optionValue : "");
                                            }}
                                            size="small"
                                            values={
                                              newMarketSegmentId
                                                ? initializeMarketSegmentDropdown(
                                                  values,
                                                  marketSegmentDataSource
                                                )
                                                : values
                                            }
                                            options={marketSegmentDataSource}
                                            doNotShowInfoTooltip={true}
                                          />
                                        </Grid>
                                        {
                                          // permissions.productCategory
                                          //     .isCreate
                                          permissions.marketSegment.isCreate && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip
                                                title="Add Market Segment"
                                                className="mt-1"
                                              >
                                                <IconButton
                                                  onClick={() => { setShowAddMarketSegmentDialog(true); }}
                                                  disabled={!isNew && field.disableOnEdit}
                                                  size="small"
                                                >
                                                  <AddIcon color="primary" />
                                                </IconButton>
                                              </Tooltip>
                                            </Grid>
                                          )
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
                                    </Grid>
                                      : field.fieldName === formFieldNames.subMarketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                        <Grid container spacing={1}>
                                          <Grid
                                            item
                                            xs={
                                              permissions.marketSegment.isCreate ? 10
                                                : 11
                                            }
                                            sm={
                                              permissions.marketSegment.isCreate ? 10
                                                : 11
                                            }
                                            md={
                                              permissions.marketSegment.isCreate ? 10
                                                : 11
                                            }
                                          >
                                            <FormTypes
                                              isNew={isNew}
                                              {...field}
                                              disabled={!isNew && field.disableOnEdit}
                                              fields={entityData.fields}
                                              fieldData={field}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              setFieldValue={setFieldValue}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field.isTooltip}
                                              tooltipMessage={field.tooltipMessage}
                                              onChange={(e, val) => {
                                                setNewSubMarketSegmentId(null);
                                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                              }}
                                              size="small"
                                              values={
                                                newSubMarketSegmentId
                                                  ? initializeSubMarketSegmentDropdown(
                                                    values,
                                                    subMarketSegmentDataSource
                                                  )
                                                  : values
                                              }
                                              options={subMarketSegmentDataSource}
                                              doNotShowInfoTooltip={true}
                                            />
                                          </Grid>
                                          {
                                            permissions.marketSegment.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip
                                                  title="Add Sub Market Segment"
                                                  className="mt-1"
                                                >
                                                  <IconButton
                                                    onClick={() => {
                                                      setShowAddMarketSegmentDialog(true);
                                                    }}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color="primary" />
                                                  </IconButton>
                                                </Tooltip>
                                              </Grid>
                                            )
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
                                      </Grid> : (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          // {...rest}
                                          disabled={!isNew && field.disableOnEdit}
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
                        ) : (
                          form.sectionFields.map((field) => (
                            <FormTypes
                              isNew={isNew}
                              {...field}
                              // {...rest}
                              disabled={!isNew && field.disableOnEdit}
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
                              isTooltip={field?.isTooltip || false}
                              tooltipMessage={field?.tooltipMessage}
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
                        updateAccountDropdown(data);

                        setFieldValue("customerAccountName", data._id);
                      }}
                      isRedirectToDetailPage={false}
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

      {
        showAddMarketSegmentDialog && <ManageMarketSegmentDialog
          marketSegmentId={null}
          onClose={() => {
            setShowAddMarketSegmentDialog(false);
          }}
          onSuccess={(data) => {
            if (data?._id) {
              setMainMarketSegmentDataSource((prevState) => {
                return [
                  ...prevState,
                  {
                    optionValue: data._id,
                    optionLabel: data.name,
                    order: mainMarketSegmentDataSource.length,
                    default: false,
                    parentMarketSegment: data.parentMarketSegment
                  }
                ];
              });

              //  If no parent selected, consider that as parent and add it in Market Segment
              if (data.parentMarketSegment === "") {
                setMarketSegmentDataSource((prevState) => {
                  return [
                    ...prevState,
                    {
                      optionValue: data._id,
                      optionLabel: data.name,
                      order: marketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: data.parentMarketSegment
                    }
                  ];
                });
                setSubMarketSegmentDataSource([]);
                setNewMarketSegmentId(data._id);
                setNewSubMarketSegmentId(null);
              } else {
                //  If parent selected, consider that as a child
                if (marketSegmentDataSource.some(d => d.optionValue === data.parentMarketSegment)) {
                  setSubMarketSegmentDataSource([
                    ...mainMarketSegmentDataSource.filter(s => s.parentMarketSegment === data.parentMarketSegment),
                    {
                      optionValue: data._id,
                      optionLabel: data.name,
                      order: subMarketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: data.parentMarketSegment
                    }]
                  );
                } else {

                  let initializeMarketSegmentDataSource = [];
                  mainMarketSegmentDataSource.forEach(option => {
                    if (option.parentMarketSegment === "" || mainMarketSegmentDataSource.some(s => s.parentMarketSegment === option.optionValue)) {
                      initializeMarketSegmentDataSource.push(option);
                    }
                  })

                  if (!initializeMarketSegmentDataSource.some(s => s.optionValue === data.parentMarketSegment)) {
                    const getMarketSegment = mainMarketSegmentDataSource.find(d => d.optionValue === data.parentMarketSegment);

                    initializeMarketSegmentDataSource.push({
                      optionValue: getMarketSegment.optionValue,
                      optionLabel: getMarketSegment.optionLabel,
                      order: initializeMarketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: getMarketSegment.parentMarketSegment
                    })
                  }
                  setMarketSegmentDataSource(initializeMarketSegmentDataSource);

                  setSubMarketSegmentDataSource([
                    ...mainMarketSegmentDataSource.filter(s => s.parentMarketSegment === data.parentMarketSegment),
                    {
                      optionValue: data._id,
                      optionLabel: data.name,
                      order: subMarketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: data.parentMarketSegment
                    }]
                  );
                }
                setNewMarketSegmentId(data.parentMarketSegment);
                setNewSubMarketSegmentId(data._id);
              }
            }
            setShowAddMarketSegmentDialog(false);
          }}
        />
      }
    </>
  );
}

ManageOpportunityDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
};
