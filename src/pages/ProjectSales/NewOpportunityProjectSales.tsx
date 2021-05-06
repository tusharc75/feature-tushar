import { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { Box, Button, Dialog, Grid, InputAdornment } from "@material-ui/core";
import { Formik, Form } from "formik";
import { useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";

import {
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  initializeDropdownById,
  opportunity,
  simplifyValues,
} from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import FormTypes from "../../components/Helpers/FormTypes";
import CustomButton from "../../components/Helpers/CustomButton";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../StateProvider/Provider";
import currencies from "../../constants/currency_with_country.json";

const arr = [...Array(9).keys()];

export default function NewOpportunityProjectSales({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  isRedirectTodetailPage,
  userId = null,
  collaborators,
}) {
  const { opportunityApi } = opportunity;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity },
  }: any = useData();
  const [disableOwnerSelection] = useState(
    !isNew && user.user._id !== dataToUpdate.owner.optionValue
  );

  const [opportunityData, setOpportunityData] = useState({
    fields: [],
    initialValues: {},
  });

  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);

  useEffect(() => {
    const ownerCollabOptions = opportunityData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }
    sortArray();
  }, [opportunityData.fields]);

  const sortArray = () => {
    const sections = [];
    opportunityData.fields.forEach((field) => {
      if (!sections.includes(field.sectionName)) {
        sections.push(field.sectionName);
      }
    });

    const customData = sections.map((name) => {
      let fields = opportunityData.fields.filter(
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

  const onCollabOwnerMultiselectOpen = () => {
    setCollaboratorData(collaborators);
  };

  useEffect(() => {
    getOpportunityFields();
  }, []);

  const getOpportunityFields = () => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const newFields = [];
        console.log(data);
        const filterData = isNew
          ? data.filter((d) => d.isCreate)
          : data.filter((d) => d.isUpdate);

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

          if (!isNew && _f.fieldData.fieldName == "currency") {
            setCurrencySymbol(
              currencies.find((d) => d.currencyCode == dataToUpdate["currency"])
                ?.symbolNative
            );
          }
          if (isNew && userId && _f.fieldData.fieldName == "owner") {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
          }

          if (!isNew && _f.fieldData.fieldName == "currency") {
            setCurrencySymbol(
              currencies.find((d) => d.currencyCode == dataToUpdate["currency"])
                ?.symbolNative
            );
          }

          if (!(_f.fieldData.fieldName === "supplierAccountName")) {
            newFields.push(_f.fieldData);
          }
        });

        setOpportunityData({
          fields: newFields,
          initialValues: isNew
            ? getObjKeys("", newFields)
            : getObjKeysWithValues(dataToUpdate, newFields),
        });
      });
  };

  const handleSubmit = async (errors, setTouched, values, setErrors) => {
    if (Object.keys(errors).length) {
      opportunityData.fields.forEach((input) => {
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
    if (accountId) values["supplierAccountName"] = [accountId];
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
        setLoading(false);
        onSuccess(newId);
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

      {opportunityData.fields.length == 0 && (
        <CustomDialogContent>
          <CommonSkeleton lenArray={arr} />
        </CustomDialogContent>
      )}
      {opportunityData.fields.length > 0 && (
        <Formik
          initialValues={opportunityData.initialValues}
          validationSchema={yupSchema(opportunityData.fields)}
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
                    formsData.map((form, i) => {
                      return form.name ? (
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
                                      options={collaborators}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={true}
                                      size="small"
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
                                  ) : field.fieldName == "lostReason" ? (
                                    values["stage"] === "Closed Lost" ? (
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
                                    ) : null
                                  ) : field.fieldName == "currency" ? (
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
                                  ) : field.fieldName == "amount" ? (
                                    <FormTypes
                                      // {...rest}
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
                      ) : (
                        form.sectionFields.map((field) => (
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
                            style={{ visibility: "hidden" }}
                          />
                        ))
                      );
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
                    Object.values(
                      simplifyValues(
                        opportunityData.initialValues,
                        opportunityData.fields
                      )
                    ).toString() ===
                    Object.values(
                      simplifyValues(values, opportunityData.fields)
                    ).toString()
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(
                      errors,
                      setFieldTouched,
                      values,

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

NewOpportunityProjectSales.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
};
