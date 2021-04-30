import React, { useEffect, useState, useContext } from "react";
import { Box, Button, CircularProgress, Grid } from "@material-ui/core";
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
  supplierAccount,
  customerAccount,
  simplifyValues
} from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { useLocation, useHistory } from "react-router-dom";
import PropTypes from "prop-types";

const arr = [...Array(9).keys()];

export default function ManageOpportunityDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  isRedirectTodetailPage
}) {
  const { opportunityResource, opportunityApi } = opportunity
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity },
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
    getOpportunityFields();
  }, []);

  const getOpportunityFields = () => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const newFields = [];

        const filterData = isNew ? data.filter((d) => d.isCreate) : data.filter((d) => d.isUpdate);


        filterData
          .filter((d) => d.isCreate)
          .map((_f) => {
            //  If this dialog opens from account details screen, make that account preselected

            if (accountId && ["customerAccountName", "supplierAccountName"].some(d => d === _f.fieldData.fieldName)) {
              _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
            }

            newFields.push(_f.fieldData);
          });

        setEntityData({
          fields: newFields,
          initialValues: isNew ? getObjKeys("", newFields) : getObjKeysWithValues(dataToUpdate, newFields)
        });
      });
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
      isNew ? handleCreateOpportunity(values) : handleUpdateOpportunity(values);
    }
  };

  const handleCreateOpportunity = (values) => {
    // values.closeDate = "03/03/2021"
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
        if(isRedirectTodetailPage) history.push(`${opportunityApi}/detail/${newId}`);
        setLoading(false);
        onSuccess();
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
            ? "Create Opportunity"
            : `Editing ${dataToUpdate.opportunityName}`
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
                    formsData.map((form, i) => (
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
                                      onOwnerDropdownOpen(
                                        values["collaborator"]
                                      );
                                    }}
                                  />
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
                                ) : field.fieldName == "probability" ? (
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
                                      if (e.target.value && parseFloat(e.target.value) > 100) {
                                        setFieldValue("probability", "100")
                                      }
                                      else {
                                        setFieldValue("probability", e.target.value)
                                      }
                                    }}
                                  />
                                ) : (field.fieldName == "lostReason") ? (
                                  values["stage"] === "Closed Lost" ?
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
                                    /> : null
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
                                )
                                }
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
                    Object.values(simplifyValues(entityData.initialValues, entityData.fields)).toString() ===
                    Object.values(simplifyValues(values, entityData.fields)).toString()}
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

ManageOpportunityDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
};
