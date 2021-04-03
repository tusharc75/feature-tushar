import React, { useState, useEffect } from "react";
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  Tooltip,
  useTheme,
  Divider,
  Avatar,
} from "@material-ui/core";
import { InfoOutlined } from "@material-ui/icons";
import { getObjKeysWithValues } from "../../constants/helpers";
import currencies from "../../constants/currency_with_country.json";
import moment from "moment";

const useStyles = makeStyles((theme) => ({
  fieldText: {
    width: "100%",
    padding: 10,
    borderRadius: 4,
    cursor: "normal",
    textOverflow: "ellipsis",
    overflow: "hidden",
    [theme.breakpoints.up("md")]: {
      whiteSpace: "nowrap",
    },
  },
}));

interface DetailProps {
  data: object;
  fields: any[];
}

const Details = (props: DetailProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const { data, fields } = props;

  const [initialVals, setValues] = useState(null);
  const [formsData, setFormsData] = useState([]);

  useEffect(() => {
    sortArray();
    const fieldData = fields.map((f) => f.fieldData);
    const vals = getObjKeysWithValues(data, fieldData);
    setValues(vals);

    return () => setValues(null);
    // eslint-disable-next-line
  }, []);

  const normalizeValues = (values, input) => {
    let text = "";
    if (input.type === "multiSelect") {
      const filterOptions = input.option?.filter((opt) =>
        values[input.fieldName].includes(opt.optionValue)
      );
      const value = filterOptions.length
        ? filterOptions.map((d) => d.optionLabel).join(", ")
        : "";
      text = value ? value : "_ _ _";
    } else if (input.type === "dropDown") {
      const opt = input.option?.find(
        (o) => o.optionValue === values[input.fieldName]
      );
      const value = opt && Object.keys(opt).length ? opt.optionLabel : "";
      text = value ? value : "_ _ _";
    } else if (input.type === "currency") {
      const opt = currencies.find(
        (c) => c.currencyCode === values[input.fieldName]
      );
      text = opt ? `${opt.currencyCode} - ${opt.name}` : "_ _ _";
    } else if (input.type === "switch") {
      text = values[input.fieldName] ? "Inactive" : "Active";
    } else if (input.type === "checkBox") {
      text = values[input.fieldName] ? (values[input.fieldName] == true ? "Yes" : "No") : "_ _ _";
    } else if (input.type === "date") {
      let updatedDateFormat = moment(values[input.fieldName]).format("YYYY-MM-DD")
      text = updatedDateFormat ? updatedDateFormat : "_ _ _";
    } else {
      text = values[input.fieldName] ? values[input.fieldName] : "_ _ _";
    }
    return text;
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

  const dynamicSize = (size, name) =>
    name === "avatar" || name === "companyLogo" ? 12 : size;

  return (
    <>
      {formsData?.map((form) => (
        <React.Fragment key={form.name}>
          <h3 className="form-label-style" title={form.name}>
            {form.name}
          </h3>
          <Box marginY={2} />
          <Grid container spacing={2}>
            {form.sectionFields.map((field, i) => (
              <Grid key={i} item xs={12} sm={6} md={6}>
                <Grid container alignItems="center">
                  <Grid
                    item
                    xs={dynamicSize(6, field.fieldData.fieldName)}
                    sm={dynamicSize(5, field.fieldData.fieldName)}
                    md={dynamicSize(5, field.fieldData.fieldName)}
                  >
                    <Box height="100%" display="flex" alignItems="center">
                      {field.fieldData.isTooltip && (
                        <Tooltip title={field.fieldData.tooltipMessage}>
                          <InfoOutlined
                            style={{ width: 18, height: 18 }}
                            color="disabled"
                          />
                        </Tooltip>
                      )}
                      <Box marginX="2px" />
                      <h4
                        title={field.fieldData.fieldLabel}
                        style={{
                          color: theme.palette.text.secondary,
                          fontWeight: "normal",
                        }}
                      >
                        {field.fieldData.fieldLabel}
                      </h4>
                    </Box>
                  </Grid>
                  <Grid
                    item
                    xs={dynamicSize(6, field.fieldData.fieldName)}
                    sm={dynamicSize(7, field.fieldData.fieldName)}
                    md={dynamicSize(7, field.fieldData.fieldName)}
                  >
                    {field.fieldData.fieldName === "avatar" ||
                      field.fieldData.fieldName === "companyLogo" ? (
                      <Box paddingLeft={2}>
                        <Avatar src={initialVals[field.fieldData.fieldName]} />
                      </Box>
                    ) : (
                      <Typography
                        title={normalizeValues(initialVals, field.fieldData)}
                        className={classes.fieldText}
                        variant="body2"
                      >
                        {normalizeValues(initialVals, field.fieldData)}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                <Box marginY={1} />
                {field.fieldData.fieldName !== "companyLogo" &&
                  field.fieldData.fieldName !== "avatar" && (
                    <Divider
                      style={{ color: "gray" }}
                      orientation="horizontal"
                    />
                  )}
              </Grid>
            ))}
          </Grid>
          <Box marginY={4} />
        </React.Fragment>
      ))}
    </>
  );
};

export default Details;
