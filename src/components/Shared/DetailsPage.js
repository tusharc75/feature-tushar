import React, { useState, useEffect } from "react";
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Button,
  Tooltip,
  useTheme,
} from "@material-ui/core";
import { Check, Info } from "@material-ui/icons";
import LockIcon from "@material-ui/icons/Lock";
import { Formik, Form } from "formik";
import {
  getObjKeysWithValues,
  removeEmptyKeys,
  yupSchema,
} from "../../constants/helpers";
import FormTypes from "../Helpers/FormTypes";

const bill_Ship_address = ["isShippingAddressSameAsBillingAddress", "billingAddress"]
const useStyles = makeStyles(() => ({
  fieldText: {
    width: "100%",
    padding: 10,
    borderRadius: 4,
    cursor: "pointer",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    "&:hover": {
      backgroundColor: "#ededed",
    },
  },
  nonEditable: {
    width: "100%",
    padding: 10,
    borderRadius: 4,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
}));

const Details = (props) => {
  const classes = useStyles();
  const theme = useTheme();
  const { data, fields, handleUpdate, isUpdating, canEdit } = props;
  const [edit, setEdit] = useState(null);
  const [initialVals, setValues] = useState(null);
  const [formsData, setFormsData] = useState([]);
  const [fieldsData, setFieldsData] = useState([]);


  useEffect(() => {
    sortArray();
    const fieldData = fields?.map((f) => f.fieldData);
    const vals = getObjKeysWithValues(data, fieldData);
    setFieldsData(fieldData);
    setValues(vals);

    return () => setValues(null);
    // eslint-disable-next-line
  }, []);

  const normalizeValues = (values, input) => {
    let text = "";
    if (input.type === "multiSelect") {
      if (Array.isArray(values[input.fieldName])) {
        const onlyValues = values[input.fieldName]?.map(
          (item) => item.optionLabel
        );
        text = onlyValues ? onlyValues.join(", ") : "_ _ _";
      } else {
        text = "_ _ _";
      }
    } else if (input.type === "dropDown") {
      text = Object.keys(values[input.fieldName]).length
        ? values[input.fieldName].optionLabel
        : "_ _ _";
    } else if (input.type === "currency") {
      const _val = `${values[input.fieldName].currencyCode} - ${values[input.fieldName].name
        }`;
      const isValid =
        _val.split(" ")[0] !== "undefined" ||
        _val.split(" ")[2] !== "undefined";
      text = isValid ? _val : "_ _ _";
    } else if (input.type === "checkBox" || input.type === "switch") {
      text = values[input.fieldName] ? "Inactive" : "Active";
    } else {
      text = values[input.fieldName] ? values[input.fieldName] : "_ _ _";
    }
    return text;
  };

  const simplifyValues = (obj) => {
    const newObj = {};

    if (obj) {
      for (const { fieldData } of fields) {
        if (fieldData.type === "multiSelect") {
          newObj[fieldData.fieldName] = obj[fieldData.fieldName].length
            ? obj[fieldData.fieldName].map((item) => item.fieldLabel).join(", ")
            : "";
        } else if (
          fieldData.type === "switch" ||
          fieldData.type === "checkBox"
        ) {
          newObj[fieldData.fieldName] = obj[fieldData.fieldName]
            ? "Active"
            : "Inactive";
        } else if (fieldData.type === "dropDown") {
          newObj[fieldData.fieldName] = obj[fieldData.fieldName]
            ? obj[fieldData.fieldName].fieldLabel
            : "";
        } else if (fieldData.type === "currency") {
          const _val = obj[fieldData.fieldName]
            ? `${obj[fieldData.fieldName].currencyCode} - ${obj[fieldData.fieldName].name
            }`
            : "";

          newObj[fieldData.fieldName] = _val ? _val : "";
        } else {
          newObj[fieldData.fieldName] = obj[fieldData.fieldName]
            ? obj[fieldData.fieldName]
            : "";
        }
      }
    }
    return newObj;
  };

  const sortArray = () => {
    const sections = [];
    fields.forEach((field) => {
      if (!sections.includes(field.fieldData.sectionName)) {
        sections.push(field.fieldData.sectionName);
      }
    });

    const customData = sections.map((name) => {
      let fieldsData = fields.filter(
        (field) => field.fieldData.sectionName === name
      );

      const sectionFields = fieldsData.map((formData) => formData);
      return { name, sectionFields };
    });
    setFormsData(customData);
  };

  const handleSubmit = (values) => {
    const emptyRemoved = removeEmptyKeys(values);
    handleUpdate(emptyRemoved);
    setEdit(null);
  };

  const getOptions = (opts, values, fieldName) => {
    // combine selected collaboratore and owner data 
    let tempData = []
    if (values.collaborator && values.collaborator.length) {
      tempData = [...values.collaborator]
    }
    if (values?.owner?.optionValue) {
      tempData = [...tempData, values.owner]
    }

    if (tempData && tempData.length) {
      let tempOpts = opts.filter(opt => {
        let isSelected = false
        tempData.some((obj, i) => {
          if (obj.optionValue === opt.optionValue) {
            isSelected = true
            return true
          }
        })
        return !isSelected
      })
      return tempOpts
    }
    return opts
  }
  const validateEmail = initialVals && initialVals.email ? false : true;
  const isDisable = initialVals && initialVals.isShippingAddressSameAsBillingAddress
  return (
    <>
      {initialVals && (
        <Formik
          initialValues={initialVals}
          validationSchema={yupSchema(fieldsData, validateEmail)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm, setFieldTouched, setTouched }) => (
            <Form>
              {formsData?.map((form) => (
                <React.Fragment key={form.name}>
                  <h3>{form.name}</h3>
                  <Box marginY={2} />
                  <Grid container spacing={2}>
                    {form.sectionFields.map((field, i) => (
                      <Grid key={i} item xs={12} sm={6} md={6}>
                        <Box display="flex" alignItems="center">
                          <h4 style={{ color: theme.palette.text.secondary }}>
                            {field.fieldData.fieldLabel}
                          </h4>
                          <Box marginX={1} />
                          {field.fieldData.isTooltip && (
                            <Tooltip title={field.fieldData.tooltipMessage}>
                              <Info
                                style={{ width: 20, height: 20 }}
                                color="disabled"
                              />
                            </Tooltip>
                          )}
                          {field.isUpdate ? (
                            canEdit ? (
                              ""
                            ) : (
                              <Tooltip title="You must be the owner or collaborator of this account to get update functionality">
                                <LockIcon color="disabled" />
                              </Tooltip>
                            )
                          ) : (
                            <Tooltip title="Not allowed to update">
                              <LockIcon color="disabled" />
                            </Tooltip>
                          )}
                        </Box>
                        <Box display="flex" alignItems="flex-start">
                          {edit === field.fieldData.fieldName ?
                            ["collaborator", "owner"].indexOf(field.fieldData.fieldName) != -1 ? (
                              <FormTypes
                                isTooltip={false}
                                disabled={!field.isUpdate}
                                size="small"
                                fullWidth
                                values={values}
                                errors={errors}
                                touched={touched}
                                name={field.fieldData.fieldName}
                                options={field.fieldData.option}
                                options={getOptions(field.fieldData.option, values, "owner")}
                                type={field.fieldData.type}
                                placeholder={`Enter ${field.fieldData.fieldLabel}`}
                                setFieldValue={setFieldValue}
                              />
                            ) : field.fieldData.fieldName === "isShippingAddressSameAsBillingAddress" ? (
                              <FormTypes
                                isTooltip={false}
                                disabled={!field.isUpdate}
                                size="small"
                                fullWidth
                                values={values}
                                errors={errors}
                                touched={touched}
                                name={field.fieldData.fieldName}
                                options={field.fieldData.option}
                                type={field.fieldData.type}
                                placeholder={`Enter ${field.fieldData.fieldLabel}`}
                                setFieldValue={setFieldValue}
                                onChange={(e, newValue) => {
                                  setFieldValue(field.fieldData.fieldName, e.target.checked)
                                  if (e.target.checked && values.billingAddress) {
                                    setFieldValue("shippingAddress", values.billingAddress)
                                    // setTouched("shippingAddress", true)
                                  }
                                }}
                              />
                            ) : field.fieldData.fieldName === "billingAddress" ? (
                              <FormTypes
                                isTooltip={false}
                                disabled={!field.isUpdate}
                                size="small"
                                fullWidth
                                values={values}
                                errors={errors}
                                touched={touched}
                                name={field.fieldData.fieldName}
                                options={field.fieldData.option}
                                type={field.fieldData.type}
                                placeholder={`Enter ${field.fieldData.fieldLabel}`}
                                setFieldValue={setFieldValue}
                                onChange={(event, newValue) => {
                                  setFieldValue(newValue);
                                  if (values.isShippingAddressSameAsBillingAddress == true) {
                                    setFieldValue("shippingAddress", newValue?.description ?? "")
                                    // setTouched("shippingAddress", true)
                                  }
                                }}
                              />
                            ) : field.fieldData.fieldName === "shippingAddress" ? (
                              <FormTypes
                                isTooltip={false}
                                size="small"
                                fullWidth
                                values={values}
                                errors={errors}
                                touched={touched}
                                name={field.fieldData.fieldName}
                                options={field.fieldData.option}
                                type={field.fieldData.type}
                                placeholder={`Enter ${field.fieldData.fieldLabel}`}
                                setFieldValue={setFieldValue}
                                disabled={!isUpdating || isDisable || values.isShippingAddressSameAsBillingAddress == true}
                              />
                            ) : (
                              <FormTypes
                                isTooltip={false}
                                disabled={
                                  field.fieldData.type === "email" ||
                                  !field.isUpdate
                                }
                                size="small"
                                fullWidth
                                values={values}
                                errors={errors}
                                touched={touched}
                                name={field.fieldData.fieldName}
                                options={field.fieldData.option}
                                type={field.fieldData.type}
                                placeholder={`Enter ${field.fieldData.fieldLabel}`}
                                setFieldValue={setFieldValue}
                              />
                            ) : field.fieldData.type === "switch" ||
                              field.fieldData.type === "checkBox" ||
                              field.fieldData.type === "imageUpload" ? (
                              <FormTypes
                                isTooltip={false}
                                disabled={!field.isUpdate}
                                size="small"
                                fullWidth
                                values={values}
                                errors={errors}
                                touched={touched}
                                name={field.fieldData.fieldName}
                                options={field.fieldData.option}
                                type={field.fieldData.type}
                                setFieldValue={setFieldValue}
                                onChange={(e) => {
                                  setFieldValue(
                                    field.fieldData.fieldName,
                                    e.target.checked
                                  );
                                }}
                              />
                            ) : (field.isUpdate ?
                              <Typography
                                className={classes.fieldText}
                                onClick={() => setEdit(field.fieldData.fieldName)}
                                variant="body2"
                                color={
                                  errors[field.fieldData.fieldName]
                                    ? "error"
                                    : "inherit"
                                }
                              >
                                {errors[field.fieldData.fieldName]
                                  ? errors[field.fieldData.fieldName]
                                  : normalizeValues(values, field.fieldData)}
                              </Typography> : <Typography className={classes.nonEditable}>
                                {normalizeValues(values, field.fieldData)}
                              </Typography>
                            )}
                          {edit === field.fieldData.fieldName ? (
                            <>
                              <IconButton onClick={() => setEdit(null)}>
                                <Check />
                              </IconButton>
                            </>
                          ) : (
                            ""
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box marginY={4} />
                </React.Fragment>
              ))}
              <Box marginTop={2} display="flex" justifyContent="flex-end">
                {canEdit ? (
                  <Button
                    disabled={
                      Object.values(simplifyValues(initialVals)).toString() ===
                      Object.values(simplifyValues(values)).toString() ||
                      isUpdating
                    }
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={submitForm}
                  >
                    {isUpdating ? <CircularProgress size={20} /> : "Save"}
                  </Button>
                ) : null}
              </Box>
            </Form>
          )}
        </Formik>
      )}
    </>
  );
};

export default Details;
