import React, { useState, useEffect } from "react";
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
  } = props;

  const {
    state: { user },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    !isNew && user.user._id !== accountData.initialValues.owner
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
  const [additionalFieldName, setAdditionalFieldName] = useState("")

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

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

    let ownerCollaboratorDropdownData = accountData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollaboratorDropdownData.length > 0) {
      setOwnerCollaboratorCommonDataSource(
        ownerCollaboratorDropdownData[0].option
      );
      setOwnerDataSource(ownerCollaboratorDropdownData[0].option);
      setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option);
    }

    const parentAccountDropdownData = accountData.fields.find(
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

    setFormsData(setFieldsInAscendingOrder(accountData.fields));

    return () => {
      setOwnerCollaboratorCommonDataSource([]);
      setOwnerDataSource([]);
      setCollaboratorDataSource([]);
    };
  }, [accountData.fields]);

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerDataSource(
      getOwnerDropdownDataSource(
        selectedCollaborator,
        ownerCollaboratorCommonDataSource
      )
    );
  };

  const onCollaboratorOwnerMultiselectOpen = (selectedOwnerId, selectedEntity) => {
    setCollaboratorDataSource(
      getCollaboratorDropdownDataSource(
        selectedOwnerId,
        ownerCollaboratorCommonDataSource
      )
    );
  

    if(selectedEntity && collaboratorDataSource){
     
      let newTempArray = []
     
      selectedEntity.map(d=>{
        getCollaboratorDropdownDataSource(
          selectedOwnerId,
          ownerCollaboratorCommonDataSource
        ).map(item=>{
          if(item.entities[0]?.entity == d && item.optionValue!= selectedOwnerId){
            newTempArray.push(item)
          }
        })
        setCollaboratorDataSource(newTempArray)
        // setCollaboratorDataSource(
        //   getCollaboratorDropdownDataSource(
        //   selectedOwnerId,
        //   ownerCollaboratorCommonDataSource
        // ).filter(item => item.entities[0]?.entity == d && item.optionValue!= selectedOwnerId)) 
        
        
      })
    }
  };
  //  Owner, Collaborator Code - End

  const onSubmit = (values, setValues) => {
    handleSubmit(values, false);
  };

  return (
    <>
      <Dialog
        disableBackdropClick={true}
        fullWidth
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
                                        disabled={disableOwnerSelection || (!isNew && field.disableOnEdit)}
                                        onOpen={() =>
                                          !fromProject &&
                                          onOwnerDropdownOpen(
                                            values.collaborator
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
                                            values.owner, values.entity ? values.entity : "" 
                                          )
                                        }
                                      />
                                    ) 
                                    // : field.fieldName === "entity" ? (
                                    //   <FormTypes
                                    //     multiple
                                    //     values={values}
                                    //     errors={errors}
                                    //     touched={touched}
                                    //     label={field.fieldLabel}
                                    //     name={field.fieldName}
                                    //     type={field.type}
                                        
                                    //     setFieldValue={setFieldValue}
                                    //     options={field.option}
                                    //     fullWidth
                                    //     isTooltip={field?.isTooltip || false}
                                    //     tooltipMessage={field?.tooltipMessage}
                                    //     size="small"
                                    //     // onChange={(e, value) => {
                                    //     //   setFieldValue(
                                    //     //     field.fieldName,
                                    //     //     value && value.optionValue
                                    //     //       ? value.optionValue
                                    //     //       : ""
                                    //     //   );
                                    //     //   setFieldValue(
                                    //     //     "collaborator",
                                    //     //     []
                                    //     //   );
                                          
                                    //     // }}
                                    //   />
                                    // )
                                    : field.fieldName ===
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
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
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
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
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
                                        isNew={isNew}
                                        {...field}
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
                                        disabled={
                                          values.isShippingAddressSameAsBillingAddress ===
                                          true || (!isNew && field.disableOnEdit)
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
                                        setFieldValue={setFieldValue}
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
                    <CustomButton
                      variant="contained"
                      color="primary"
                      loading={loading}
                      disabled={
                        loading ||
                        uploadingImageOrFileProgress > 0 ||
                        Object.values(
                          simplifyValues(
                            accountData.initialValues,
                            accountData.fields
                          )
                        ).toString() ===
                        Object.values(
                          simplifyValues(values, accountData.fields)
                        ).toString()
                        // || Object.keys(errors).length > 0 ? true : false
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
