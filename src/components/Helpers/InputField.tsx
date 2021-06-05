import React, { useEffect, useState } from "react";
import { Grid, Box, InputAdornment } from "@material-ui/core";

import FormTypes from "./FormTypes";
import { setFieldsInAscendingOrder } from "../../constants/helpers";

const InputField = (props) => {
  const { fieldsData, errors, touched, values, setFieldValue, onImageUploadCompletePercentage, ...rest } = props;
  const [formsData, setFormsData] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(fieldsData));
    // eslint-disable-next-line
  }, [fieldsData]);

  return (
    <React.Fragment>
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
                    sm={
                      field.type === "imageUpload" ||
                        field.type === "fileUpload"
                        ? 12
                        : 6
                    }
                    md={
                      field.type === "imageUpload" ||
                        field.type === "fileUpload"
                        ? 12
                        : 6
                    }
                  >
                    <FormTypes
                      {...rest}
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
                      isTooltip={field.isTooltip}
                      tooltipMessage={field.tooltipMessage}
                      onChange={
                        field.fieldName === "currency"
                          ? (e, val) => {
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
                          }
                          : null
                      }
                      imageOrFileUploadCompletePercentage={["imageUpload", "fileUpload"].some(s => s === field.type) ? (completePercentage) => {
                        onImageUploadCompletePercentage(completePercentage);
                      } : null}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </div>
        ))}
    </React.Fragment>
  );
};

export default InputField;
