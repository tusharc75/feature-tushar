import React, { useState, useEffect } from "react";
import { Box, Button, Grid } from "@material-ui/core";
import { Formik, Form } from "formik";
import {
  CustomDialogTransition,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
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

const arr = [...Array(9).keys()];

export default function ManageAccount(props) {
  const {
    entityData,
    handleSubmit,
    onClose,
    open,
    isNew,
    loading,
    owners,
    collaborators,
    fromProject,
    accountId = null,
  } = props;

  const {
    state: { user },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    !isNew && user.user._id !== entityData.initialValues.owner
  );

  //  Owner, Collaborator Code - Start
  const [formsData, setFormsData] = useState([]);
  const [
    ownerCollaboratorCommonDataSource,
    setOwnerCollaboratorCommonDataSource,
  ] = useState([]);
  const [ownerDataSource, setOwnerDataSource] = useState([]);
  const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);
  const [parentAccountDataSource, setParentAccountDataSource] = useState([]);

  useEffect(() => {
    let ownerCollaboratorDropdownData = entityData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollaboratorDropdownData.length > 0) {
      setOwnerCollaboratorCommonDataSource(
        ownerCollaboratorDropdownData[0].option
      );
      setOwnerDataSource(ownerCollaboratorDropdownData[0].option);
      setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option);
    }

    const parentAccountDropdownData = entityData.fields.find(
      (d) => d.fieldName === "parentAccount"
    );
    if (parentAccountDropdownData) {
      setParentAccountDataSource(
        isNew
          ? parentAccountDropdownData.option
          : parentAccountDropdownData.option.filter(
              (d) => d.optionValue !== accountId
            )
      );
    }

    sortArray();

    return () => {
      setOwnerCollaboratorCommonDataSource([]);
      setOwnerDataSource([]);
      setCollaboratorDataSource([]);
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

  const onSubmit = (values, setValues) => {
    handleSubmit(values, false);
  };

  return (
    <>
      <Dialog
        disableBackdropClick={true}
        maxWidth="md"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}
      >
        <CustomDialogHeader
          onClose={onClose}
          title={
            isNew
              ? "Add Account"
              : `Editing ${entityData.initialValues.accountName}`
          }
        />
        {entityData.fields.length > 0 ? (
          <>
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
              }) => (
                <>
                  <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      {formsData &&
                        formsData.map((form, i) => (
                          <div key={i}>
                            <h2 className="form-label-style">{form.name}</h2>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
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
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
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
                                        isTooltip={true}
                                        size="small"
                                        onOpen={() =>
                                          !fromProject &&
                                          onCollaboratorOwnerMultiselectOpen(
                                            values.owner
                                          )
                                        }
                                      />
                                    ) : field.fieldName ===
                                      "isShippingAddressSameAsBillingAddress" ? (
                                      <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={true}
                                        size="small"
                                        onChange={(e) => {
                                          setFieldValue(
                                            field.fieldName,
                                            e.target.checked
                                          );
                                          if (
                                            e.target.checked &&
                                            values.billingAddress
                                          ) {
                                            setFieldValue(
                                              "shippingAddress",
                                              values.billingAddress
                                            );
                                          }
                                        }}
                                      />
                                    ) : field.fieldName === "billingAddress" ? (
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
                                        isTooltip={true}
                                        size="small"
                                        onChange={(event, newValue) => {
                                          setFieldValue(
                                            field.fieldName,
                                            newValue?.description ?? ""
                                          );
                                          if (
                                            values.isShippingAddressSameAsBillingAddress ===
                                            true
                                          ) {
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
                                        disabled={
                                          values.isShippingAddressSameAsBillingAddress ===
                                          true
                                        }
                                        onChange={(event, newValue) => {
                                          setFieldValue(
                                            field.fieldName,
                                            newValue?.description ?? ""
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "parentAccount" ? (
                                      <FormTypes
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={parentAccountDataSource}
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
                    >
                      Cancel
                    </Button>
                    <CustomButton
                      variant="contained"
                      color="primary"
                      loading={loading}
                      disabled={
                        loading ||
                        Object.values(
                          simplifyValues(
                            entityData.initialValues,
                            entityData.fields
                          )
                        ).toString() ===
                          Object.values(
                            simplifyValues(values, entityData.fields)
                          ).toString()
                        // || Object.keys(errors).length > 0 ? true : false
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
