import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@material-ui/core";
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
  quoteBuilder,
  simplifyValues,
  customerAccount,
} from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { useHistory } from "react-router-dom";
import PropTypes from "prop-types";
import currencies from "../../../constants/currency_with_country.json";
import AddIcon from '@material-ui/icons/AddCircle'
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../../Account/ManageAccount";

const arr = [...Array(9).keys()];
export default function ManageQuoteDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  contactId = null,
  opportunityId = null,
  accountResource = null,
  isRedirectTodetailPage,
  userId = null,
}) {
  const { qbApi } = quoteBuilder;
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
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [newAddedAccountId, setNewAddedAccountId] = useState(null)

  useEffect(() => {
    let ownerCollaboratorOptions = entityData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollaboratorOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollaboratorOptions[0].option);
      setOwnerData(ownerCollaboratorOptions[0].option);
      setCollaboratorData(ownerCollaboratorOptions[0].option);
    }

    let customerAccountOptions = entityData.fields.find((d) => d.fieldName === "customerAccountName");
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }

    sortArray();

    return () => {
      setOwnerCollaboratorData([])
      setOwnerData([])
      setCollaboratorData([])
      setAccountData([])
    }

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
    getQuoteFields();

    return () => {
      setCurrencySymbol(null)
      setEntityData({
        fields: [],
        initialValues: {},
      });
    }
  }, []);

  const getQuoteFields = () => {
    axiosInstance()
      .get(`/field?resource=Quote Builder&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const newFields = [];

        const filterData = isNew
          ? data.filter((d) => d.isCreate)
          : data.filter((d) => d.isUpdate);

        filterData.map((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (
            accountId && _f.fieldData.fieldName === "customerAccountName") {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
          }

          if ( contactId && _f.fieldData.fieldName === "customerContactName"){
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, contactId)
          }
            

          if (
            opportunityId && ["opportunity"].some(
              (d) => d === _f.fieldData.fieldName
            )
          ){
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, opportunityId)
          }


          if (!isNew && _f.fieldData.fieldName === "currency") {
            setCurrencySymbol(
              currencies.find((d) => d.currencyCode === dataToUpdate["currency"])
                ?.symbolNative
            );
          }
          if (isNew && userId && _f.fieldData.fieldName === "owner") {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
          }

          if (_f.fieldData.fieldName !== "supplierAccountName") {
            newFields.push(_f.fieldData);
          }
        });

        setEntityData({
          fields: newFields,
          initialValues: isNew
            ? getObjKeys("", newFields)
            : getObjKeysWithValues(dataToUpdate, newFields),
        });
      });
  };

  const onSubmit = (values) => {
    isNew ? handleCreateQuote(values) : handleUpdateQuote(values);
  }

  const handleCreateQuote = (values) => {
    // values.closeDate = "03/03/2021"
    if (accountId && accountResource !== customerAccount.accountResource) values["supplierAccountName"] = [accountId]
    setLoading(true);
    axiosInstance()
      .post(`${qbApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectTodetailPage)
          history.push(`${qbApi}/${newId}`);
        setLoading(false);
        onSuccess(newId);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleUpdateQuote = (values) => {
    values = { ...values, _id: dataToUpdate._id };
    setLoading(true);

    axiosInstance()
      .put(`${qbApi}?entity=${selectedEntity}`, values)
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

  const updateAccountDropdown = (data) => {
    const entityFields = entityData.fields;
    const customerAccountNameFieldIndex = entityFields.findIndex(d => d.fieldName === "customerAccountName")

    if (customerAccountNameFieldIndex > -1) {
      entityFields[customerAccountNameFieldIndex].option = [
        ...entityFields[customerAccountNameFieldIndex].option,
        {
          optionValue: data._id,
          optionLabel: data.accountName,
          order: entityFields[customerAccountNameFieldIndex].option.length,
          default: false
        }
      ]

      setAccountData(entityFields[customerAccountNameFieldIndex].option);
    }
  }


  return (
    <>
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
              ? "Create Quote Builder"
              : `Editing ${dataToUpdate.quoteName}`
          }
          onClose={onClose}
        />

        {entityData.fields.length === 0 && (
          <CustomDialogContent>
            <CommonSkeleton lenArray={arr} />
          </CustomDialogContent>
        )}
        {entityData.fields.length > 0 && (
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
              setFieldTouched,
              setErrors,
              setValues,
            }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    {formsData &&
                      formsData.map((form, index1) => {
                        return form.name ? (
                          <div key={index1}>
                            <h2 className="form-label-style">{form.name}</h2>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid
                                    key={index2}
                                    item
                                    xs={12}
                                    sm={6}
                                    md={6}
                                  >
                                    {
                                      field.fieldName == "customerAccountName" ? (
                                        <Grid container spacing={1}>
                                          <Grid item
                                            xs={permissions.customerAccount.isCreate ? 10 : 11}
                                            sm={permissions.customerAccount.isCreate ? 10 : 11}
                                            md={permissions.customerAccount.isCreate ? 10 : 11}
                                          >
                                            <FormTypes
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={accountData}
                                              setFieldValue={setFieldValue}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={true}
                                              size="small"
                                              doNotShowInfoTooltip={true}
                                            />
                                          </Grid>
                                          {
                                            permissions.customerAccount.isCreate && <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip title="Create Account" className="mt-1">
                                                <IconButton onClick={() => { setShowAddCustomerAccountDialog(true) }} size="small">
                                                  <AddIcon color="primary" />
                                                </IconButton>
                                              </Tooltip>
                                            </Grid>
                                          }
                                          {
                                            field?.tooltipMessage ?
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip title={field?.tooltipMessage ?? ""}>
                                                  <InfoIcon color="disabled" />
                                                </Tooltip>
                                              </Grid> : null
                                          }
                                        </Grid>
                                      ) : field.fieldName === "owner" ? (
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
                                          isTooltip={true}
                                          size="small"
                                          onOpen={() => {
                                            onCollabOwnerMultiselectOpen(
                                              values["owner"]
                                            );
                                          }}
                                        />
                                      ) : field.fieldName === "probability" ? (
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
                                      ) : field.fieldName === "lostReason" ? (
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
                                      ) : field.fieldName === "currency" ? (
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
                                      ) : field.fieldName === "amount" ? (
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

                  {
                    showAddCustomerAccountDialog && <ManageAccountDialog
                      open={showAddCustomerAccountDialog}
                      onClose={() => {
                        setShowAddCustomerAccountDialog(false)
                      }}
                      id={null}
                      accountResource={customerAccount.accountResource}
                      accountApi={customerAccount.accountApi}
                      isGetAccountData={true}
                      onGetAddedAccount={({ data }) => {
                        setNewAddedAccountId(data._id);
                        updateAccountDropdown(data);

                        setFieldValue("customerAccountName", data._id);
                      }}
                      isRedirectToDetailPage={false}
                    />
                  }

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
                      Object.values(simplifyValues(values, entityData.fields)).toString()
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
        )}
      </Dialog>

    </>
  );
}

ManageQuoteDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  contactId: PropTypes.string,
  accountResource: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
};
