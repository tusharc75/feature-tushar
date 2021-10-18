import { useState, useEffect } from "react";
import { Box, Button, Grid } from "@material-ui/core";
import { Formik, Form } from "formik";
import {
  CustomDialogTransition,
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
    handleValuesChange = null
  } = props;

  const {
    state: { user },
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

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        fullScreen={isMobile || isTablet}
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
          onClose={() => {
            if (isFieldNotTouched(accountData, formValues)) {
              onClose({})
            } else {
              setShowConfirmDialog(true)
            }
          }}
          title={
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
                      <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                      {formsData &&
                        formsData.filter((item) => item.name !== additionalFieldName).map((form, i) => (
                          <div key={i}>
                            <h2 className="form-label-style">{form.name}</h2>
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
                                          handleValuesChange(field.fieldName, val && val.optionValue ? val.optionValue : "");
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
                                          handleValuesChange(field.fieldName, value);
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
                                          handleValuesChange(name, value)
                                          setFieldValue(name, value)
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onChange={(e) => {
                                          handleValuesChange(field.fieldName, e.target.checked)
                                          setFieldValue(
                                            field.fieldName,
                                            e.target.checked
                                          );
                                          if (
                                            e.target.checked &&
                                            values.billingAddress
                                          ) {
                                            handleValuesChange("shippingAddress", values.billingAddress)
                                            setFieldValue(
                                              "shippingAddress",
                                              values.billingAddress
                                            );
                                          }
                                        }}
                                      />
                                    ) : field.fieldName === "billingAddress" ? (
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
                                          handleValuesChange(field.fieldName, value)
                                          setFieldValue(name, value)
                                          if (
                                            values.isShippingAddressSameAsBillingAddress ===
                                            true
                                          ) {
                                            handleValuesChange("shippingAddress", value ?? "")
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
                                        onChange={(event, newValue) => {
                                          handleValuesChange(field.fieldName, newValue?.description ?? "")
                                          setFieldValue(
                                            field.fieldName,
                                            newValue?.description ?? ""
                                          );
                                          if (
                                            values.isShippingAddressSameAsBillingAddress ===
                                            true
                                          ) {
                                            handleValuesChange("shippingAddress", newValue?.description ?? "")
                                            setFieldValue(
                                              "shippingAddress",
                                              newValue?.description ?? ""
                                            );
                                          }
                                        }}
                                      />
                                    ) : field.fieldName ===
                                      "shippingAddress" ? (
                                      <FormTypes
                                        isNew={isNew}
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          handleValuesChange(name, value);
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
                                        onChange={(event, newValue) => {
                                          handleValuesChange(field.fieldName, newValue?.description ?? "");
                                          setFieldValue(
                                            field.fieldName,
                                            newValue?.description ?? ""
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "parentAccount" ? (
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
                                          handleValuesChange(name, value);
                                          setFieldValue(name, value)
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    ) : (
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
                                          handleValuesChange(name, value);
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
    </>
  );
}
