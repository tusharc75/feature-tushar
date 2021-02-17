import React, { useEffect, useState } from "react";
import { Grid, Box } from "@material-ui/core";

import FormTypes from "./FormTypes";

const InputField = ({ fieldsData, ...rest }) => {
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
            <h2>{form.name}</h2>
            <Box marginY={2}>
              <Grid spacing={2} container>
                {form.sectionFields.map((field) => (
                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                    <FormTypes {...rest} fieldData={field} />
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
