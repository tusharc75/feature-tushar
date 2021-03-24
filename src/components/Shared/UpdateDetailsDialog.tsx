import React, { useEffect, useState } from "react";
import {
  IconButton,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle as MuiDialogTitle,
  makeStyles,
  Button,
  Box,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { Formik, Form } from "formik";
import {
  getObjKeysWithValues,
  removeEmptyKeys,
  yupSchema,
} from "../../constants/helpers";
import FormTypes from "../Helpers/FormTypes";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";

const UpdateBrandDialog = (props) => {
  const {
    openDialog,
    onClose,
    fields,
    data,
    isUpdating,
    handleUpdate,
    title,
  } = props;
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

  const simplifyValues = (obj) => {
    const newObj = {};
    if (obj) {
      for (const { fieldData } of fields) {
        if (fieldData.type === "multiSelect") {
          if (Array.isArray(newObj[fieldData.fieldName])) {
            newObj[fieldData.fieldName] = obj[fieldData.fieldName].join(", ");
          } else {
            newObj[fieldData.fieldName] = "";
          }
        } else if (
          fieldData.type === "switch" ||
          fieldData.type === "checkBox"
        ) {
          newObj[fieldData.fieldName] = obj[fieldData.fieldName]
            ? "Active"
            : "Inactive";
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
    handleUpdate(values);
  };

  const validateEmail = initialVals && initialVals.email ? false : true;

  return (
    <Dialog open={openDialog} onClose={onClose} fullWidth maxWidth="md">
      <CustomDialogHeader title={title} onClose={onClose} />

      <Formik
        initialValues={initialVals}
        validationSchema={yupSchema(fieldsData, validateEmail)}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <>
            <CustomDialogContent>
              <Form>
                {formsData.map((form, i) => (
                  <div key={i}>
                    <h2 className="form-label-style">{form.name}</h2>
                    <Box marginY={2}>
                      <Grid spacing={3} container>
                        {form.sectionFields.map((field) => (
                          <Grid
                            key={field.fieldData.fieldName}
                            item
                            xs={12}
                            sm={6}
                            md={6}
                          >
                            <FormTypes
                              size="small"
                              fullWidth
                              disabled={
                                field.fieldData.type === "email" ||
                                !field.isUpdate
                              }
                              values={values}
                              errors={errors}
                              touched={touched}
                              label={field.fieldData.fieldLabel}
                              name={field.fieldData.fieldName}
                              type={field.fieldData.type}
                              options={field.fieldData.option}
                              setFieldValue={setFieldValue}
                              required={field.fieldData.required}
                              isTooltip={field.fieldData.isTooltip}
                              tooltipMessage={field.fieldData.tooltipMessage}
                            />
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
                variant="outlined"
                color="primary"
                disabled={isUpdating}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={submitForm}
                disabled={
                  Object.values(simplifyValues(initialVals)).toString() ===
                  Object.values(simplifyValues(values)).toString() ||
                  isUpdating
                }
              >
                {isUpdating ? <CircularProgress size={20} /> : "Save"}
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default UpdateBrandDialog;
