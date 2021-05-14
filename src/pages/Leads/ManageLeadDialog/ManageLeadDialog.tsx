import React, { useEffect, useState, useContext } from "react";
import { Box, Button, CircularProgress, Grid, IconButton, Tooltip } from "@material-ui/core";
import { Formik, Form } from "formik";
import { useHistory } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import axiosInstance from "../../../axios/axiosInstance";
import {
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  simplifyValues,
  initializeDropdownById
} from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import AddIcon from '@material-ui/icons/AddCircle'
import InfoIcon from "@material-ui/icons/Info";

const arr = [...Array(9).keys()];

export default function ManageLeadDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  leadApi,
  userId = null,
  isRedirectToDetailPage = true
}) {
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
  const [addOwner, setAddOwner] = useState(false);

  useEffect(() => {
    const ownerCollabOptions = entityData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }
    sortArray();
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

  useEffect(() => {
    if (entityData.fields.length === 0) {
      getLeadFields();
    }
  }, []);

  const getLeadFields = () => {
    if (selectedEntity) {
      axiosInstance()
        .get(`/field?resource=Lead&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          const newFields = [];

          if (isNew) {
            data
              .filter((d) => d.isCreate)
              .map((_f) => {

                if (isNew && userId && _f.fieldData.fieldName == "owner") {
                  _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
                }
                newFields.push(_f.fieldData)
              });

            setEntityData({
              fields: newFields,
              initialValues: getObjKeys("", newFields),
            });
          } else {
            data
              .filter((d) => d.isUpdate)
              .map((_f) => newFields.push(_f.fieldData));
            setEntityData({
              fields: newFields,
              initialValues: getObjKeysWithValues(dataToUpdate, newFields),
            });
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
      entityData.fields.forEach((input) => {
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
      aria-labelledby="customized-dialog-title"
      onClose={onClose}
      open={open}
      disableBackdropClick={true}
    >
      <CustomDialogHeader
        title={
          isNew
            ? "Create Lead"
            : `Editing ${dataToUpdate.firstName || ""} ${dataToUpdate.lastName}`
        }
        onClose={onClose}
      />

      {entityData.fields.length == 0 && (
        <CustomDialogContent>
          <CommonSkeleton lenArray={arr} />
        </CustomDialogContent>
      )}
      {entityData.fields.length > 0 && (
        <Formik
          initialValues={entityData.initialValues}
          validationSchema={yupSchema(entityData.fields)}
          validateOnMount
          onSubmit={() => { }}
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
                    formsData.map((form, i) => {
                      return form.name && <div key={i}>
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
                                {field.fieldName == "owner" ? (
                                  <FormTypes
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={ownerData}
                                    setFieldValue={setFieldValue}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={true}
                                    size="small"
                                    disabled={disableOwnerSelection}
                                    onOpen={() => {
                                      onOwnerDropdownOpen(values["collaborator"]);
                                    }}
                                  />
                                  //  <Grid container spacing={1}>
                                  //   <Grid item xs={11} sm={11} md={11}>

                                  //   </Grid>
                                  //   <Grid item xs={1} sm={1} md={1}>
                                  //     {
                                  //       permissions.user.isCreate && <Tooltip title="Create Account" className="mt-1">
                                  //         <IconButton onClick={() => { setAddOwner(true) }} size="small">
                                  //           <AddIcon color="primary" />
                                  //         </IconButton>
                                  //       </Tooltip>
                                  //     }
                                  //   </Grid>
                                  //   {
                                  //     field?.tooltipMessage ?
                                  //       <Grid item xs={1} sm={1} md={1}>
                                  //       <Tooltip title={field?.tooltipMessage ?? ""}>
                                  //           <InfoIcon color="disabled" />
                                  //         </Tooltip>
                                  //       </Grid> : null
                                  //   }
                                  // </Grid>
                                ) : field.fieldName == "collaborator" ? (
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
                    })}
                </Form>
              </CustomDialogContent>

              <CustomDialogFooter>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
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
                    Object.values(simplifyValues(entityData.initialValues, entityData.fields)).toString() ===
                    Object.values(simplifyValues(values, entityData.fields)).toString()
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
      )
      }
    </Dialog >
  );
}
