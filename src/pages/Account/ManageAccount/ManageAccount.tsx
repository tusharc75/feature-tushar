import { useState, useEffect } from "react";
import { Box, Button, Grid, IconButton, Tooltip } from "@material-ui/core";
import { Formik, Form } from "formik";
import {
  CustomDialogTransition,
  formFieldNames,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
  setFieldsInAscendingOrder,
  simplifyValues,
  yupSchema,
} from "../../../constants/helpers";
import FormTypes from "../../../components/Helpers/FormTypes";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import Dialog from "@material-ui/core/Dialog";
import { useData } from "../../../StateProvider/Provider";
import CustomButton from "../../../components/Helpers/CustomButton";
import { isMobile, isTablet } from "react-device-detect";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog"
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageMarketSegmentDialog from "../../MarketSegment/ManageMarketSegmentDialog";
import { FaDiceOne } from "react-icons/fa";
import ManageAccountDialog from "./index";
import ManageAddressDialog from "../../../components/Address/ManageAddressDialog";

const arr = [...Array(9).keys()];

export default function ManageAccount(props) {
  const {
    accountData,
    handleSubmit,
    onClose,
    open,
    isNew,
    loading,
    owners,
    collaborators,
    fromProject,
    accountId = null,
    formValues = {},
    handleValuesChange = null,
    marketSegmentId = null,
    isClone,
    accountNameForClone,
    accountResource,
    accountApi
  } = props;

  const {
    state: { user, permissions },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    !isNew && user.user._id !== accountData.initialValues.owner
  );

  //  Owner, Collaborator Code - Start
  const [formsData, setFormsData] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [
    ownerCollaboratorCommonDataSource,
    setOwnerCollaboratorCommonDataSource,
  ] = useState([]);
  const [ownerDataSource, setOwnerDataSource] = useState([]);
  const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);
  const [parentAccountDataSource, setParentAccountDataSource] = useState([]);
  const [additionalFieldName, setAdditionalFieldName] = useState("")

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);

  const [showAddAddresstDialog, setShowAddAddresstDialog] = useState(false);
  const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);
  const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
  const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
  const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
  const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
  const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isAccDialogVisible, setIsAccDialogVisible] = useState(false)
  const [addressDataSource, setAddressDataSource] = useState([]);
  const [addressType, setAddressType] = useState(null);
  useEffect(() => {
    if (isNew) {
      const processSteps = accountData.fields.find(
        (d) => d.type.toLowerCase() === "process"
      );

      if (processSteps) {
        accountData.fields.map((d) => {
          if (d.sectionName == processSteps?.additionalInfoSection) {
            setAdditionalFieldName(d.sectionName)
          }
        });
      }
    }

    if (fromProject) {
      setOwnerCollaboratorCommonDataSource(owners);
      setOwnerDataSource(owners);
      setCollaboratorDataSource(collaborators);
    } else {
      let ownerCollaboratorDropdownData = accountData.fields.filter(
        (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
      );
      if (ownerCollaboratorDropdownData.length > 0) {
        setOwnerCollaboratorCommonDataSource(ownerCollaboratorDropdownData[0].option);
        setOwnerDataSource(ownerCollaboratorDropdownData[0].option);
        setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option);
      }
    }

    const parentAccountDropdownData = accountData.fields.find(
      (d) => d.fieldName === "parentAccount"
    );
    if (parentAccountDropdownData) {
      setParentAccountDataSource(
        isNew
          ? parentAccountDropdownData.option
          : parentAccountDropdownData.option.filter(
            (d) => d?.optionValue !== accountId
          )
      );
    }


    setFormsData(setFieldsInAscendingOrder(accountData.fields));

    //  Initialize market segment dropdown which have parentMarketSegment === "" or that record have child
    const marketSegmentDropdownData = accountData.fields.find(
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


    if (!isNew && marketSegmentDropdownData) {
      setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter(d => d.parentMarketSegment === accountData.initialValues.marketSegment));
    }

    if (accountData?.initialValues?.marketSegment && marketSegmentDropdownData) {
      setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter(d => d.parentMarketSegment === accountData?.initialValues?.marketSegment));
    }

    if (marketSegmentId && marketSegmentDropdownData) {
      setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter(d => d.parentMarketSegment === marketSegmentId));
    }

    const addressDataDropdown = accountData.fields.find(
      (d) => d.fieldName === "billingAddress"
    );
    if (accountId && addressDataDropdown) {
      setAddressDataSource(addressDataDropdown.option.filter(d => accountData?.initialValues?.billingAddress?.includes(d.optionValue) || accountData?.initialValues?.shippingAddress?.includes(d.optionValue)))
    }

    return () => {
      setOwnerCollaboratorCommonDataSource([]);
      setOwnerDataSource([]);
      setCollaboratorDataSource([]);
    };
  }, [accountData.fields]);

  const onOwnerDropdownOpen = (selectedCollaborator, selectedEntity) => {
    if (selectedEntity?.length > 0) {

      let newTempArray = []

      const ownerCollaboratorData = getOwnerDropdownDataSource(
        selectedCollaborator,
        ownerCollaboratorCommonDataSource
      );

      selectedEntity.forEach(d => {
        ownerCollaboratorData.forEach(item => {
          if (item.entities?.find(s => s.entity === d && item.optionValue !== selectedCollaborator)) {
            if (!newTempArray.find(s => s.optionValue === item.optionValue)) {
              newTempArray.push(item)
            }
          }
        })
      })
      setOwnerDataSource(newTempArray)
    }
    else {
      setOwnerDataSource(
        getOwnerDropdownDataSource(
          selectedCollaborator,
          ownerCollaboratorCommonDataSource
        )
      );
    }
  };

  const onCollaboratorOwnerMultiselectOpen = (selectedOwnerId, selectedEntity) => {
    if (selectedEntity?.length > 0) {

      let newTempArray = []

      const ownerCollaboratorData = getCollaboratorDropdownDataSource(
        selectedOwnerId,
        ownerCollaboratorCommonDataSource
      );

      selectedEntity.forEach(d => {
        ownerCollaboratorData.forEach(item => {
          if (item.entities?.find(s => s.entity === d && item.optionValue !== selectedOwnerId)) {
            if (!newTempArray.find(s => s.optionValue === item.optionValue)) {
              newTempArray.push(item)
            }
          }
        })
      })

      setCollaboratorDataSource(newTempArray)
    }
    else {
      setCollaboratorDataSource(
        getCollaboratorDropdownDataSource(
          selectedOwnerId,
          ownerCollaboratorCommonDataSource
        )
      );
    }
  }
  //  Owner, Collaborator Code - End

  const onSubmit = (values, setValues) => {
    handleSubmit(values, false);
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

  const isFieldNotTouched = (accountData, values) => {
    return Object.values(
      simplifyValues(
        accountData.initialValues,
        accountData.fields
      )
    ).toString() ===
      Object.values(
        simplifyValues(values, accountData.fields)
      ).toString()
  }

  const initializeMarketSegmentDropdown = (values, marketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.marketSegment)) {
      const getNewAddedMarketSegment = marketSegmentSource.find(
        (d) => d?.optionValue === newMarketSegmentId
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
        (d) => d?.optionValue === newSubMarketSegmentId
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

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
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
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
          onClose={() => {
            if (isFieldNotTouched(accountData, formValues)) {
              onClose({})
            } else {
              setShowConfirmDialog(true)
            }
          }}
          title={
            isClone
              ?
              `Clone ${accountNameForClone}`
              :
              isNew
                ? "Add Account"
                : `Editing ${accountData.initialValues.accountName
                  ? accountData.initialValues.accountName
                  : ""
                }`
          }
        />
        {accountData.fields.length > 0 ? (
          <>
            <Formik
              initialValues={accountData.initialValues}
              validationSchema={yupSchema(accountData.fields)}
              validateOnMount

              onSubmit={onSubmit}
            >
              {({
                submitForm,
                values,
                errors,
                touched,
                setFieldValue,
              }) => (
                <>
                  <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}

                      {formsData &&
                        formsData.filter((item) => item.name !== additionalFieldName).map((form, i) => (
                          <div key={i}>
                            <div className={"detail-box-content"}>
                              <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                              <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    {field.fieldName === "owner" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={
                                          // fromProject ? owners : ownerDataSource
                                          ownerDataSource
                                        }
                                        onChange={(e, val) => {
                                          // handleValuesChange(field.fieldName, val && val.optionValue ? val.optionValue : "");
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
                                              const newCollaboratorDataSource =
                                                fromProject
                                                  ? collaborators.filter(
                                                    (c) =>
                                                      c.optionValue !==
                                                      values["owner"]
                                                  )
                                                  : collaboratorDataSource;

                                              // handleValuesChange("collaborator", newCollaboratorDataSource.find(
                                              //   (d) =>
                                              //     d?.optionValue ===
                                              //     user?.user?._id
                                              // ).optionValue)

                                              setFieldValue("collaborator", [
                                                ...values["collaborator"],
                                                newCollaboratorDataSource.find(
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
                                        disabled={disableOwnerSelection || (!isNew && field.disableOnEdit)}
                                        onOpen={() =>
                                          // !fromProject &&
                                          onOwnerDropdownOpen(
                                            values.collaborator, values.entity ? values.entity : []
                                          )
                                        }
                                      />
                                    ) : field.fieldName === "collaborator" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        multiple
                                        disabled={!isNew && field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={
                                          // fromProject
                                          //   ? collaborators.filter(
                                          //     (c) =>
                                          //       c.optionValue !==
                                          //       values["owner"]
                                          //   )
                                          //   : collaboratorDataSource
                                          collaboratorDataSource
                                        }
                                        setFieldValue={(name, value) => {
                                          // handleValuesChange(field.fieldName, value);
                                          setFieldValue(field.fieldName, value)
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onOpen={() =>
                                          // !fromProject &&
                                          onCollaboratorOwnerMultiselectOpen(
                                            values.owner, values.entity ? values.entity : []
                                          )
                                        }
                                      />
                                    ) : field.fieldName === "entity" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        disabled={!isNew && field.disableOnEdit}
                                        multiple
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onChange={(e, value) => {

                                          // handleValuesChange(field.fieldName, value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : [])
                                          setFieldValue(
                                            field.fieldName,
                                            value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []
                                          );
                                          // handleValuesChange("owner", "")
                                          // handleValuesChange("collaborator", [])
                                          setFieldValue("owner", "");
                                          setFieldValue("collaborator", []);
                                        }}
                                      />
                                    ) : field.fieldName ===
                                      "isShippingAddressSameAsBillingAddress" ? (
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
                                        setFieldValue={(name, value) => {
                                          // handleValuesChange(name, value)
                                          setFieldValue(name, value)
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onChange={(e) => {
                                          // handleValuesChange(field.fieldName, e.target.checked)
                                          setFieldValue(
                                            field.fieldName,
                                            e.target.checked
                                          );
                                          if (
                                            e.target.checked &&
                                            values.billingAddress
                                          ) {
                                            // handleValuesChange("shippingAddress", values.billingAddress)
                                            setFieldValue(
                                              "shippingAddress",
                                              values.billingAddress
                                            );
                                          }
                                        }}
                                      />
                                    ) : field.fieldName === "billingAddress" ?
                                      <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                        <Grid container spacing={1}>
                                          <Grid
                                            item
                                            xs={
                                              permissions[accountResource]?.isCreate ? 10
                                                : 11
                                            }
                                            sm={
                                              permissions[accountResource]?.isCreate ? 10
                                                : 11
                                            }
                                            md={
                                              permissions[accountResource]?.isCreate ? 10
                                                : 11
                                            }
                                          >
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
                                              options={addressDataSource}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value)
                                                handleValuesChange({ [name]: value })
                                                if (
                                                  values.isShippingAddressSameAsBillingAddress ===
                                                  true
                                                ) {
                                                  setFieldValue(
                                                    "shippingAddress",
                                                    value ?? ""
                                                  );
                                                }
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                            // onChange={(event, newValue) => {
                                            //   // handleValuesChange(field.fieldName, newValue?.description ?? "")
                                            //   setFieldValue(
                                            //     field.fieldName,
                                            //     newValue?.description ?? ""
                                            //   );
                                            //   if (
                                            //     values.isShippingAddressSameAsBillingAddress ===
                                            //     true
                                            //   ) {
                                            //     // handleValuesChange("shippingAddress", newValue?.description ?? "")
                                            //     setFieldValue(
                                            //       "shippingAddress",
                                            //       newValue?.description ?? ""
                                            //     );
                                            //   }
                                            // }}
                                            />
                                          </Grid>
                                          {(
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip
                                                title="Add Address"
                                                className="mt-1"
                                              >
                                                <IconButton
                                                  onClick={() => {
                                                    setShowAddAddresstDialog(true);
                                                    setAddressType({ account: accountResource, address: "billingAddress" })
                                                  }}
                                                  disabled={field.disableOnEdit}
                                                  size="small"
                                                >
                                                  <AddIcon color={field.disableOnEdit ? "disabled" : "primary"} />
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
                                      : field.fieldName === "shippingAddress" ?
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid
                                              item
                                              xs={
                                                permissions[accountResource]?.isCreate ? 10
                                                  : 11
                                              }
                                              sm={
                                                permissions[accountResource]?.isCreate ? 10
                                                  : 11
                                              }
                                              md={
                                                permissions[accountResource]?.isCreate ? 10
                                                  : 11
                                              }
                                            >
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={addressDataSource}
                                                setFieldValue={(name, value) => {
                                                  handleValuesChange({ [name]: value })
                                                  setFieldValue(name, value)
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                                disabled={
                                                  values.isShippingAddressSameAsBillingAddress ===
                                                  true || (!isNew && field.disableOnEdit)
                                                }
                                              />
                                            </Grid>
                                            {(
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip
                                                  title="Add Address"
                                                  className="mt-1"
                                                >
                                                  <IconButton
                                                    onClick={() => {
                                                      setShowAddAddresstDialog(true);
                                                      setAddressType({ account: accountResource, address: "shippingAddress" })

                                                    }}
                                                    disabled={field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={field.disableOnEdit ? "disabled" : "primary"} />
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
                                        : field.fieldName === "parentAccount" ?
                                          <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                            <Grid container spacing={1}>
                                              <Grid
                                                item
                                                xs={permissions[accountResource]?.isCreate ? 10 : 11}
                                                sm={permissions[accountResource]?.isCreate ? 10 : 11}
                                                md={permissions[accountResource]?.isCreate ? 10 : 11}
                                              >
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
                                                  options={parentAccountDataSource}
                                                  setFieldValue={(name, value) => {
                                                    // handleValuesChange(name, value);
                                                    setFieldValue(name, value)

                                                  }}
                                                  required={field.required}
                                                  fullWidth
                                                  isTooltip={field?.isTooltip || false}
                                                  tooltipMessage={field?.tooltipMessage}
                                                  size="small"
                                                />
                                              </Grid>
                                              {
                                                permissions[accountResource]?.isCreate && (
                                                  <Grid item xs={1} sm={1} md={1}>
                                                    <Tooltip
                                                      title="Add Parent Account"
                                                      className="mt-1"
                                                    >
                                                      <IconButton
                                                        onClick={() => {
                                                          setIsAccDialogVisible(true)
                                                        }}
                                                        disabled={!isNew && field.disableOnEdit}
                                                        size="small"
                                                      >
                                                        <AddIcon color={!isNew && field.disableOnEdit ? "disabled" : "primary"} />
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
                                          </Grid> :
                                          field.fieldName === formFieldNames.marketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                            <Grid container spacing={1}>
                                              <Grid
                                                item
                                                xs={
                                                  permissions.marketSegment?.isCreate ? 10
                                                    : 11
                                                }
                                                sm={
                                                  permissions.marketSegment?.isCreate ? 10
                                                    : 11
                                                }
                                                md={
                                                  permissions.marketSegment?.isCreate ? 10
                                                    : 11
                                                }
                                              >
                                                <FormTypes
                                                  {...field}
                                                  isNew={isNew}
                                                  disabled={!isNew && field.disableOnEdit}
                                                  fieldData={field}
                                                  errors={errors}
                                                  touched={touched}
                                                  label={field.fieldLabel}
                                                  name={field.fieldName}
                                                  type={field.type}
                                                  setFieldValue={(name, value) => {
                                                    // handleValuesChange({ [name]: value })
                                                    setFieldValue(name, value)
                                                  }}
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
                                                permissions.marketSegment?.isCreate && (
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
                                                        <AddIcon color={!isNew && field.disableOnEdit ? "disabled" : "primary"} />
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
                                                    permissions.marketSegment?.isCreate ? 10
                                                      : 11
                                                  }
                                                  sm={
                                                    permissions.marketSegment?.isCreate ? 10
                                                      : 11
                                                  }
                                                  md={
                                                    permissions.marketSegment?.isCreate ? 10
                                                      : 11
                                                  }
                                                >
                                                  <FormTypes
                                                    {...field}
                                                    isNew={isNew}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    fieldData={field}
                                                    errors={errors}
                                                    touched={touched}
                                                    label={field.fieldLabel}
                                                    name={field.fieldName}
                                                    type={field.type}
                                                    setFieldValue={(name, value) => {
                                                      // handleValuesChange({ [name]: value })
                                                      setFieldValue(name, value)
                                                    }}
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
                                                  permissions.marketSegment?.isCreate && (
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
                                                          <AddIcon color={!isNew && field.disableOnEdit ? "disabled" : "primary"} />
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
                                                setFieldValue={(name, value) => {
                                                  // handleValuesChange(name, value);
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
                        ))}
                    </Form>
                    {
                      showAddAddresstDialog && <ManageAddressDialog
                        onClose={() => {
                          setShowAddAddresstDialog(false);
                        }}
                        onSuccess={(obj) => {
                          if (obj) {
                            setShowAddAddresstDialog(false);
                            setAddressDataSource((prevState) => [...prevState,
                            {
                              default: false,
                              optionLabel: obj?.fullAddress,
                              optionValue: obj._id,
                              order: addressDataSource.length + 1,
                            }]);
                            setFieldValue(addressType.address, [...values[`${addressType.address}`], obj._id]);
                          }
                        }}
                      />
                    }
                    {isAccDialogVisible ? (
                      <ManageAccountDialog
                        open={isAccDialogVisible}
                        onClose={() => {
                          setIsAccDialogVisible(false)
                        }}
                        id={null}
                        isRedirectToDetailPage={false}
                        isGetAccountData={true}
                        onGetAddedAccount={({ data }) => {
                          if (data?._id) {
                            setFieldValue("parentAccount", data?._id)
                            setParentAccountDataSource([...parentAccountDataSource, {
                              optionLabel: data?.accountName,
                              optionValue: data?._id
                            }])
                          }
                        }}
                        accountResource={accountResource}
                        accountApi={accountApi}
                        isClone={false}
                        accountNameForClone={''}
                      />
                    ) : null}
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <Button
                      onClick={() => {
                        if (isFieldNotTouched(accountData, values)) onClose({})
                        else setShowConfirmDialog(true)
                      }}
                      variant="outlined"
                      color="primary"
                      size="small"

                    >
                      Cancel
                    </Button>
                    <CustomButton
                      variant="contained"
                      color="primary"
                      loading={loading}
                      disabled={
                        loading ||
                        uploadingImageOrFileProgress > 0 ||
                        isFieldNotTouched(accountData, values)
                        // || Object.keys(errors).length > 0 ? true : false
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        handleScroll(errors)
                        submitForm();
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
                          // e.preventDefault();
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
                        onClose={() => {
                          setShowConfirmDialog(false)
                          onClose({})
                        }}
                      /> : null
                  }
                </>
              )}

            </Formik>
          </>
        ) : (
          <CustomDialogContent>
            <CommonSkeleton lenArray={arr} />
          </CustomDialogContent>
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
                if (marketSegmentDataSource.some(d => d?.optionValue === data.parentMarketSegment)) {
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
                    const getMarketSegment = mainMarketSegmentDataSource.find(d => d?.optionValue === data.parentMarketSegment);

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