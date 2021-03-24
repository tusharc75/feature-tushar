import React, { useState, useEffect } from "react";
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  IconButton,
} from "@material-ui/core";
import { Check } from "@material-ui/icons";
import { Formik, Form } from "formik";

import { getObjKeysWithValues } from "../../constants/helpers";
import FormTypes from "../Helpers/FormTypes";

const useStyles = makeStyles(() => ({
  fieldText: {
    width: "100%",
    padding: 10,
    borderRadius: 4,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#ededed",
    },
  },
}));

const Details = (props) => {
  const classes = useStyles();
  const { entity, fields, initialVals, setValues } = props;
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    const vals = getObjKeysWithValues(entity, fields);
    setValues(vals);

    return () => setValues(null);
    // eslint-disable-next-line
  }, []);

  const handleSave = (values) => {
    setValues(values);
    setEdit(null);
  };

  return (
    <>
      {initialVals && (
        <Formik initialValues={initialVals} onSubmit={() => { }}>
          {({ values, errors, touched, setFieldValue }) => (
            <Form>
              <Grid container spacing={2}>
                {fields.map((field, i) => (
                  <Grid key={i} item xs={12} sm={6} md={6}>
                    <h4>{field.fieldLabel}</h4>
                    <Box display="flex" alignItems="center">
                      {edit === field.fieldName ? (
                        <FormTypes
                          size="small"
                          fullWidth
                          values={values}
                          errors={errors}
                          touched={touched}
                          name={field.fieldName}
                          options={field.option}
                          type={field.type}
                          placeholder={`Enter ${field.fieldLabel}`}
                          setFieldValue={setFieldValue}
                        />
                      ) : field.type === "switch" ? (
                        <Box marginLeft={1}>
                          <FormTypes
                            size="small"
                            fullWidth
                            values={values}
                            errors={errors}
                            touched={touched}
                            name={field.fieldName}
                            options={field.option}
                            type={field.type}
                            setFieldValue={setFieldValue}
                          />
                        </Box>
                      ) : (
                        <Typography
                          className={classes.fieldText}
                          onClick={() => setEdit(field.fieldName)}
                          variant="body2"
                        >
                          {values[field.fieldName]
                            ? values[field.fieldName]
                            : "None"}
                        </Typography>
                      )}
                      {edit === field.fieldName ? (
                        <IconButton onClick={() => handleSave(values)}>
                          <Check />
                        </IconButton>
                      ) : (
                        ""
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Form>
          )}
        </Formik>
      )}
    </>
  );
};

export default Details;
