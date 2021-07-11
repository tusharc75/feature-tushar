import { useEffect, useState, useContext } from "react";
import { Box, Button, Grid } from "@material-ui/core";
import { Formik, Form } from "formik";
import { useHistory } from "react-router-dom";
import Dialog from "@material-ui/core/Dialog";
import axiosInstance from "../../../axios/axiosInstance";
import {
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  simplifyValues,
  initializeDropdownById,
  setFieldsInAscendingOrder,
  processFieldName,
} from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";

const arr = [...Array(9).keys()];

export default function ManageLeadDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  leadApi,
  userId = null,
  isRedirectToDetailPage = true,
}) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    !isNew && user.user._id !== dataToUpdate.owner.optionValue
  );

  const [leadData, setLeadData] = useState({
    fields: [],
    initialValues: {},
  });
 
  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [additionalFieldName, setAdditionalFieldName] = useState("")
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

  useEffect(() => {
    if(isNew){
      const processSteps = leadData.fields.find(
        (d) => d.type.toLowerCase() === "process"
      );
    
      leadData.fields.map((d) => {
        if (
          d.sectionName ==processSteps?.additionalInfoSection ) {
         
          setAdditionalFieldName(d.sectionName)
        }
      });
    }
    if(!isNew){
      const processSteps = leadData.fields.find(
        (d) => d.type.toLowerCase() === "process"
      );
      if(processSteps){
        let len = processSteps.option.length;
        if(dataToUpdate.process !== processSteps.option[len-1]["optionValue"]){
          leadData.fields.map((d) => {
            if (
              d.sectionName ==processSteps.additionalInfoSection ) {
             
              setAdditionalFieldName(d.sectionName)
            }
          });
        }
        
      }
    }
   
    const ownerCollabOptions = leadData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }

    setFormsData(setFieldsInAscendingOrder(leadData.fields));
  }, [leadData.fields]);

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
    if (leadData.fields.length === 0) {
      getLeadFields();
    }
  }, []);

  const getLeadFields = () => {
    if (selectedEntity) {
      setLoadingData(true);
      axiosInstance()
        .get(`/field?resource=Lead&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          const newFields = [];

          if (isNew) {
            data
              .filter((d) => d.isCreate)
              .map((_f) => {
                if (isNew && userId && _f.fieldData.fieldName === "owner") {
                  _f = initializeDropdownById(
                    _f,
                    _f.fieldData.fieldName,
                    userId
                  );
                }
                newFields.push(_f.fieldData);
              });

            setLeadData({
              fields: newFields,
              initialValues: getObjKeys("", newFields),
            });
            setTimeout(() => setLoadingData(false), 500);
          } else {
            data
              .filter((d) => d.isUpdate)
              .map((_f) => newFields.push(_f.fieldData));
            setLeadData({
              fields: newFields,
              initialValues: getObjKeysWithValues(dataToUpdate, newFields),
            });
            setTimeout(() => setLoadingData(false), 500);
          }
        });
    }
  };

  const handleSubmit = async (
    errors,
    setTouched,
    values,
    setValues,
    setErrors
  ) => {
    if (Object.keys(errors).length) {
      leadData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      isNew ? handleCreateLead(values) : handleUpdateLead(values);
    }
  };

  const handleCreateLead = (values) => {
    setLoading(true);

    axiosInstance()
      .post(`${leadApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectToDetailPage) {
          history.push(`${leadApi}/detail/${newId}`);
        }
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleUpdateLead = (values) => {
    values = { ...values, _id: dataToUpdate._id };
    setLoading(true);

    axiosInstance()
      .put(`${leadApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setLoading(false);
        onSuccess();
        // fetchData()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  return (
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
            ? "Create Lead"
            : `Editing ${[dataToUpdate.firstName, dataToUpdate.lastName]
                .filter((f) => f)
                .join(" ")}`
        }
        onClose={onClose}
      />

      {loadingData && (
        <CustomDialogContent>
          <CommonSkeleton lenArray={arr} />
        </CustomDialogContent>
      )}
      {!loadingData && leadData.fields.length > 0 && (
        <Formik
          initialValues={leadData.initialValues}
          validationSchema={yupSchema(leadData.fields)}
          validateOnMount
          onSubmit={() => {}}
        >
          {({
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
                    formsData.filter((item)=>item.name!==additionalFieldName).map((form, i) => {
                      return (
                        form.name && (
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
                                        disabled={disableOwnerSelection}
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
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        onOpen={() => {
                                          onCollabOwnerMultiselectOpen(
                                            values["owner"]
                                          );
                                        }}
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
                        )
                      );
                    })}
                </Form>
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
                    // loading || Object.keys(errors).length > 0 ? true : false
                    uploadingImageOrFileProgress > 0 ||
                    Object.values(
                      simplifyValues(leadData.initialValues, leadData.fields)
                    ).toString() ===
                      Object.values(
                        simplifyValues(values, leadData.fields)
                      ).toString() ||
                    loading
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(
                      errors,
                      setFieldTouched,
                      values,
                      setValues,
                      setErrors
                    );
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
  );
}
