import { useState, useEffect } from "react";
import { Box, Button, Grid, IconButton, Tooltip } from "@material-ui/core";
import { Formik, Form } from "formik";
import {
  CustomDialogTransition,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
  simplifyValues,
  yupSchema,
  setFieldsInAscendingOrder,
} from "../../../constants/helpers";
import FormTypes from "../../../components/Helpers/FormTypes";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import Dialog from "@material-ui/core/Dialog";
import { useData } from "../../../StateProvider/Provider";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import { makeStyles } from "@material-ui/core/styles";
import { isMobile, isTablet } from "react-device-detect";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog"
import { FaDiceOne } from "react-icons/fa";
import ManageContactDialog from "./index"

const arr = [...Array(9).keys()];

const useStyles = makeStyles(() => ({
  createAccountTooltip: {
    marginBottom: "6px",
  },
}));
export default function ManageContact(props) {
  const {
    contactData,
    handleSubmit,
    onClose,
    open,
    isNew,
    loading,
    collaborators,
    owners,
    fromProject,
    onCreateAccount,
    accountResource,
    reportsToSource,
    newAddedReportToId,
    contactResource,
    accountSource,
    contactId = null,
    accountId = null,
    formValues = {},
    handleValuesChange = null,
    isClone = false,
    isAccountFieldDisable = false,
    contactApi,
    account
  } = props;

  const classes = useStyles();
  const {
    state: { user, permissions },
  }: any = useData();

  const disableOwnerSelection =
    !isNew && user.user._id !== contactData.initialValues.owner;

  //  Owner, Collaborator Code - Start
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formsData, setFormsData] = useState([]);
  const [
    ownerCollaboratorCommonDataSource,
    setOwnerCollaboratorCommonDataSource,
  ] = useState([]);
  const [ownerDataSource, setOwnerDataSource] = useState([]);
  const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);
  const [reportsToMainDataSource, setReportsToMainDataSource] = useState([]);
  const [reportsToDataSource, setReportsToDataSource] = useState([]);
  const [additionalFieldName, setAdditionalFieldName] = useState("")
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showContactDialog, setShowContactDialog] = useState(false);

  useEffect(() => {

    if (contactData.fields.length > 0) {
      if (isNew) {
        const processSteps = contactData.fields.find(
          (d) => d.type.toLowerCase() === "process"
        );
        if (processSteps) {
          contactData.fields.map((d) => {
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
        const ownerCollaboratorDropdownData = contactData.fields.filter(
          (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
        );

        if (ownerCollaboratorDropdownData.length > 0) {
          setOwnerCollaboratorCommonDataSource(ownerCollaboratorDropdownData[0].option);
          setOwnerDataSource(ownerCollaboratorDropdownData[0].option);
          setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option);
        }
      }

      const reportsToDropdownData = contactData.fields.find(
        (d) => d.fieldName === "reportsTo"
      );
      if (reportsToDropdownData) {
        if (isNew) {
          setReportsToMainDataSource(reportsToDropdownData.option);
        } else {
          let currentContactRemovedDataSource =
            reportsToDropdownData.option.filter(
              (d) => d?.optionValue !== contactId
            );
          setReportsToMainDataSource(currentContactRemovedDataSource);
        }
      }
      setFormsData(setFieldsInAscendingOrder(contactData.fields));
    }
  }, [contactData.fields]);

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

  const onReportsToDropdownOpen = (selectedAccount) => {
    setReportsToDataSource(
      reportsToMainDataSource.filter((d) => d.parentAccount === selectedAccount)
    );
  };

  const handleGetAddedContact = (data, selectedAccount) => {
    console.log('data', data, 'selectedAccount', selectedAccount)
    if (data?._id) {
      let tempReportsToMainDataSource = [
        ...reportsToMainDataSource,
        {
          optionValue: data._id,
          optionLabel: `${data?.salutation ?? ''} ${data?.firstName ?? ''} ${data?.middleName ?? ''} ${data?.lastName ?? ''}`,
          parentAccount: data.accountName,
          email: data?.email,
          order: reportsToMainDataSource.length,
          default: false,
        }
      ]
      setReportsToMainDataSource([...tempReportsToMainDataSource])
      setReportsToDataSource(
        tempReportsToMainDataSource.filter((d) => d.parentAccount === selectedAccount)
      );
    }
  };
  const onSubmit = (values) => {
    handleSubmit(values, false);
  };

  const initializeAccountDropdown = (values, accountSource) => {
    if (values && values.hasOwnProperty("accountName")) {
      const getNewAddedAccount = accountSource.find(
        (d) => d?.optionValue === accountId
      );
      if (getNewAddedAccount) {
        values["accountName"] = getNewAddedAccount.optionValue;
        values["reportsTo"] = "";
      }
      return values;
    }
    return values;
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

  const isFieldNotTouched = (contactData, values) => {
    return Object.values(
      simplifyValues(
        contactData.initialValues,
        contactData.fields
      )
    ).toString() ===
      Object.values(
        simplifyValues(values, contactData.fields)
      ).toString()
  }

  return (
    <>
      <Dialog
        maxWidth="md"
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true)
          }
        }}
        open={open}
        fullWidth
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
      >
        <CustomDialogHeader
          onClose={() => {
            if (isFieldNotTouched(contactData, formValues)) {
              onClose()
            } else {
              setShowConfirmDialog(true)
            }
          }}
          title={
            isClone ? "Clone" :
              isNew
                ? "Add Contact"
                : `Editing ${contactData.initialValues?.firstName ?? ""} ${contactData.initialValues?.lastName ?? ""}`
          }
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />

        {contactData.fields.length > 0 ? (
          <>
            <Formik
              initialValues={contactData.initialValues}
              validationSchema={yupSchema(contactData.fields)}
              // validate={(values) => formValidation(values, contactData.fields)}
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
                                {form.sectionFields.map((field) => (
                                  <Grid
                                    key={field.fieldName}
                                    item
                                    xs={12}
                                    sm={6}
                                    md={6}
                                  >
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
                                        options={ownerDataSource}
                                        onChange={(e, val) => {
                                          handleValuesChange(field.fieldName, val && val.optionValue ? val.optionValue : "")
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

                                              handleValuesChange("collaborator", newCollaboratorDataSource.find(
                                                (d) =>
                                                  d?.optionValue ===
                                                  user?.user?._id
                                              ).optionValue)
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
                                        options={collaboratorDataSource}
                                        setFieldValue={(name, value) => {
                                          handleValuesChange(name, value)
                                          setFieldValue(name, value)
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
                                    ) : field.fieldName === "accountName" &&
                                      accountSource !== undefined ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 11
                                              : 11
                                          }
                                          sm={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 11
                                              : 11
                                          }
                                          md={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 11
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            isNew={isNew}
                                            {...field}
                                            values={
                                              accountId
                                                ? initializeAccountDropdown(
                                                  values,
                                                  accountSource
                                                )
                                                : values
                                            }
                                            disabled={fromProject || (!isNew && field.disableOnEdit) || (accountId && isAccountFieldDisable)}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountSource}
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
                                              handleValuesChange(field.fieldName, value && value.optionValue ? value.optionValue : "")
                                              setFieldValue(
                                                field.fieldName,
                                                value && value.optionValue
                                                  ? value.optionValue
                                                  : ""
                                              );
                                              handleValuesChange("reportsTo", "")
                                              setFieldValue("reportsTo", "");
                                            }}
                                          />
                                        </Grid>
                                        {permissions[accountResource]
                                          .isCreate && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip
                                                title="Create Account"
                                                className={`${classes.createAccountTooltip} mt-1`}
                                              >
                                                <IconButton
                                                  onClick={onCreateAccount}
                                                  size="small"
                                                  disabled={fromProject || (!isNew && field.disableOnEdit) || (accountId && isAccountFieldDisable)}
                                                >
                                                  <AddIcon color={(fromProject || (!isNew && field.disableOnEdit) || (accountId && isAccountFieldDisable)) ? "disabled" : "primary"} />
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
                                    ) : field.fieldName === "reportsTo" ?
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 11
                                              : 11
                                          }
                                          sm={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 11
                                              : 11
                                          }
                                          md={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 11
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
                                            options={reportsToDataSource}
                                            setFieldValue={(name, value) => {
                                              handleValuesChange(name, value)
                                              setFieldValue(name, value)
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onOpen={() =>
                                              onReportsToDropdownOpen(
                                                values.accountName
                                              )
                                            }
                                          />
                                        </Grid>
                                        {permissions[accountResource]
                                          .isCreate && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip
                                                title="Create Reports To"
                                                className={`${classes.createAccountTooltip} mt-1`}
                                              >
                                                <IconButton
                                                  onClick={() => setShowContactDialog(true)}
                                                  size="small"
                                                  disabled={(!isNew && field.disableOnEdit)}
                                                >
                                                  <AddIcon color={((!isNew && field.disableOnEdit)) ? "disabled" : "primary"} />
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
                                      </Grid> : field.fieldName === "entity" ? (
                                        <FormTypes
                                          multiple
                                          {...field}
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

                                            handleValuesChange(field.fieldName, value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : [])
                                            setFieldValue(
                                              field.fieldName,
                                              value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []
                                            );

                                            handleValuesChange("owner", "")
                                            handleValuesChange("collaborator", [])
                                            setFieldValue("owner", "");
                                            setFieldValue("collaborator", []);
                                          }}
                                        />
                                      ) : (
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
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            handleValuesChange(name, value)
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

                  </CustomDialogContent>
                  {
                    showContactDialog ?
                      <ManageContactDialog
                        open={showContactDialog}
                        onClose={() => setShowContactDialog(false)}
                        isGetContactData={true}
                        onGetAddedContact={(data) => {
                          if (values?.accountName && data?.accountName === values?.accountName) {
                            setFieldValue("reportsTo", data._id);
                          }
                          handleGetAddedContact(data, values?.accountName)
                        }}
                        contactResource={contactResource}
                        contactApi={contactApi}
                        account={account}
                        contactId={null}
                        isClone={false}
                      />
                      : null
                  }
                  <CustomDialogFooter>
                    <Button
                      onClick={() => {
                        if (isFieldNotTouched(contactData, values)) onClose()
                        else setShowConfirmDialog(true)
                      }}
                      variant="outlined"
                      color="primary"
                      size="small"
                    >
                      Cancel
                    </Button>

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={
                        loading ||
                        uploadingImageOrFileProgress > 0 ||
                        isFieldNotTouched(contactData, values)
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        handleScroll(errors)
                        submitForm();
                      }}
                    >
                      Save
                    </Button>
                  </CustomDialogFooter>
                  {
                    showConfirmDialog ?
                      <ConfirmCancelDialog
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

    </>
  );
}
