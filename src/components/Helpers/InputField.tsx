import React, { useEffect, useState } from "react";
import { Grid, Box } from "@material-ui/core";

import FormTypes from "./FormTypes";

const InputField = (props) => {
  const { fieldsData, errors, touched, values, setFieldValue, ...rest } = props;
  const [formsData, setFormsData] = useState([]);

  useEffect(() => {
    sortArray();
    // eslint-disable-next-line
  }, [fieldsData]);

  const sortArray = () => {
    const sections = [];
    fieldsData.forEach((field) => {
      if (!sections.includes(field.sectionName)) {
        sections.push(field.sectionName);
      }
    });

    const customData = sections.map((name) => {
      let fields = fieldsData.filter((field) => field.sectionName === name);

      const sectionFields = fields.map((formData) => formData);
      return { name, sectionFields };
    });

    setFormsData(customData);
  };

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
                    sm={field.type === "imageUpload" ? 12 : 6}
                    md={field.type === "imageUpload" ? 12 : 6}
                  >
                    <FormTypes
                      {...rest}
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
