import { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { Box, Button, Dialog, Grid, InputAdornment } from "@material-ui/core";
import { Formik, Form } from "formik";
import { useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";

import {
  getObjKeys,
  yupSchema,
  initializeDropdownById,
  opportunity,
  simplifyValues,
  setFieldsInAscendingOrder,
} from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import FormTypes from "../../components/Helpers/FormTypes";
import CustomButton from "../../components/Helpers/CustomButton";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";

const arr = [...Array(9).keys()];

export default function NewOpportunityProjectSales({
  open,
  onSuccess,
  onClose,
  accountId,
  isRedirectTodetailPage,
  collaborators,
  users,
}) {
  const { opportunityApi } = opportunity;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { selectedEntity },
  }: any = useData();

  const [opportunityData, setOpportunityData] = useState({
    fields: [],
    initialValues: {},
  });

  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(opportunityData.fields));
  }, [opportunityData.fields]);

  useEffect(() => {
    getOpportunityFields();
  }, []);

  const getOpportunityFields = () => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const newFields = [];
        const filterData = data.filter((d) => d.isCreate);

        filterData.forEach((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (
            accountId &&
            ["customerAccountName", "supplierAccountName"].some(
              (d) => d === _f.fieldData.fieldName
            )
          ) {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
          }

          if (!(_f.fieldData.fieldName === "supplierAccountName")) {
            newFields.push(_f.fieldData);
          }
        });

        setOpportunityData({
          fields: newFields,
          initialValues: getObjKeys("", newFields),
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
      handleCreateOpportunity(values);
    }
  };

  const handleCreateOpportunity = (values) => {
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
      <CustomDialogHeader title="Create Opportunity" onClose={onClose} />

      {opportunityData.fields.length === 0 && (
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
                                  {field.fieldName === "owner" ? (
                                    <FormTypes
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={users}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  ) : field.fieldName === "collaborator" ? (
                                    <FormTypes
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={collaborators.filter(
                                        (u) => values["owner"] !== u.optionValue
                                      )}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
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
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
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
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
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
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
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
                                      selectedCurrencyCode={values["currency"]}
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
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  ) : (
                                    <FormTypes
                                      // {...rest}
                                      disabled={
                                        field.fieldName ===
                                        "customerAccountName"
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
                            isTooltip={field?.isTooltip || false}
                            tooltipMessage={field?.tooltipMessage}
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
                    uploadingImageOrFileProgress > 0 ||
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
