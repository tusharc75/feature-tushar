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
    contactResource,
    accountSource,
    contactId = null,
    accountId = null,
  } = props;

  const classes = useStyles();
  const {
    state: { user, permissions },
  }: any = useData();

  const disableOwnerSelection =
    !isNew && user.user._id !== contactData.initialValues.owner;

  //  Owner, Collaborator Code - Start
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
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

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
      const ownerCollaboratorDropdownData = contactData.fields.filter(
        (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
      );

      if (ownerCollaboratorDropdownData.length > 0) {
        setOwnerCollaboratorCommonDataSource(
          ownerCollaboratorDropdownData[0].option
        );
        setOwnerDataSource(
          fromProject ? owners : ownerCollaboratorDropdownData[0].option
        );
        setCollaboratorDataSource(
          fromProject ? owners : ownerCollaboratorDropdownData[0].option
        );
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
              (d) => d.optionValue !== contactId
            );
          setReportsToMainDataSource(currentContactRemovedDataSource);
        }
      }

      setFormsData(setFieldsInAscendingOrder(contactData.fields));
    }
  }, [contactData.fields]);

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerDataSource(
      getOwnerDropdownDataSource(
        selectedCollaborator,
        ownerCollaboratorCommonDataSource
      )
    );
  };

  const onCollaboratorOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorDataSource(
      getCollaboratorDropdownDataSource(
        selectedOwnerId,
        ownerCollaboratorCommonDataSource
      )
    );
  };
  //  Owner, Collaborator Code - End

  const onReportsToDropdownOpen = (selectedAccount) => {
    setReportsToDataSource(
      reportsToMainDataSource.filter((d) => d.parentAccount === selectedAccount)
    );
  };

  const onSubmit = (values) => {
    handleSubmit(values, false);
  };

  const initializeAccountDropdown = (values, accountSource) => {
    if (values && values.hasOwnProperty("accountName")) {
      const getNewAddedAccount = accountSource.find(
        (d) => d.optionValue === accountId
      );
      if (getNewAddedAccount) {
        values["accountName"] = getNewAddedAccount.optionValue;
        values["reportsTo"] = "";
      }
      return values;
    }
    return values;
  };

  return (
    <>
      <Dialog
        disableBackdropClick={true}
        maxWidth="md"
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}
        fullWidth
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CustomDialogHeader
          onClose={onClose}
          title={
            isNew
              ? "Add Contact"
              : `Editing ${contactData.initialValues.firstName}`
          }
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
                      {formsData &&
                        formsData.filter((item) => item.name !== additionalFieldName).map((form, i) => (
                          <div key={i}>
                            <h2 className="form-label-style">{form.name}</h2>
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
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={
                                          fromProject ? owners : ownerDataSource
                                        }
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
                                              const newCollaboratorDataSource =
                                                fromProject
                                                  ? collaborators.filter(
                                                    (c) =>
                                                      c.optionValue !==
                                                      values["owner"]
                                                  )
                                                  : collaboratorDataSource;

                                              setFieldValue("collaborator", [
                                                ...values["collaborator"],
                                                newCollaboratorDataSource.find(
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
                                        disabled={disableOwnerSelection}
                                        onOpen={() =>
                                          !fromProject &&
                                          onOwnerDropdownOpen(
                                            values.collaborator
                                          )
                                        }
                                      />
                                    ) : field.fieldName === "collaborator" ? (
                                      <FormTypes
                                        multiple
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={
                                          fromProject
                                            ? collaborators.filter(
                                              (c) =>
                                                c.optionValue !==
                                                values["owner"]
                                            )
                                            : collaboratorDataSource
                                        }
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onOpen={() =>
                                          !fromProject &&
                                          onCollaboratorOwnerMultiselectOpen(
                                            values.owner
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
                                              ? 10
                                              : 11
                                          }
                                          sm={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 10
                                              : 11
                                          }
                                          md={
                                            permissions[accountResource]
                                              .isCreate
                                              ? 10
                                              : 11
                                          }
                                        >
                                          <FormTypes
                                            values={
                                              accountId
                                                ? initializeAccountDropdown(
                                                  values,
                                                  accountSource
                                                )
                                                : values
                                            }
                                            disabled={fromProject}
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
                                              setFieldValue(
                                                field.fieldName,
                                                value && value.optionValue
                                                  ? value.optionValue
                                                  : ""
                                              );
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
                                                  disabled={fromProject}
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
                                    ) : field.fieldName === "reportsTo" ? (
                                      <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={reportsToDataSource}
                                        setFieldValue={setFieldValue}
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
                                    ) : (
                                      <FormTypes
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
                        ))}
                    </Form>
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <Button
                      onClick={onClose}
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
                        Object.values(
                          simplifyValues(
                            contactData.initialValues,
                            contactData.fields
                          )
                        ).toString() ===
                        Object.values(
                          simplifyValues(values, contactData.fields)
                        ).toString()
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        submitForm();
                      }}
                    >
                      Save
                    </Button>
                  </CustomDialogFooter>
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
