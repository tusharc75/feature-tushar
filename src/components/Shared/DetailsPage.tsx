import React, { useState, useEffect, useContext } from "react";
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  Tooltip,
  useTheme,
  Divider,
  Avatar,
  IconButton,
  CircularProgress,
  Link as MuiLink,
} from "@material-ui/core";
import { GetApp, InfoOutlined, InsertDriveFile } from "@material-ui/icons";
import { Link } from "react-router-dom";
import { kebabCase } from "lodash";

import { getObjKeysWithValues, yyyyMMDD } from "../../constants/helpers";
import currencies from "../../constants/currency_with_country.json";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
  fieldText: {
    width: "100%",
    padding: theme.spacing(1, 1, 1, 0.5),
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
  const { setToastConfig } = useContext(CustomToastContext);
  const classes = useStyles();
  const theme = useTheme();
  const { data, fields } = props;

  const [isDownloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const downloadFile = (fileName) => {
    setDownloading(true);
    axiosInstance()
      .get(`user/download?fileName=${fileName}`, {
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          setProgress(percentCompleted);
        },
      })
      .then(({ data }) => {
        console.log(data);
        setToastConfig({
          message: "File Downloaded",
          type: "success",
          open: true,
        });
        setDownloading(false);
        setProgress(0);
      })
      .catch((err) => {
        setToastConfig(err);
        setDownloading(false);
        setProgress(0);
        console.log(err);
      });
  };

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
      text = values[input.fieldName] == true ? "Yes" : "No";
    } else if (input.type === "date") {
      text = yyyyMMDD(values[input.fieldName]);
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

  const dynamicSize = (size, type) =>
    type === "imageUpload" || type === "fileUpload" ? 12 : size;

  const renderData = (val: any, fieldData: any) => {
    if (fieldData.hasOwnProperty("lookup") && fieldData.lookup) {
      const redirectLink = (link) =>
        val[fieldData.fieldName]
          ? `/${kebabCase(fieldData.lookupResource)}/detail/${link}`
          : "!#";

      if (fieldData.type === "multiSelect" || fieldData.type === "dropDown") {
        return (
          <Typography className={classes.fieldText} variant="body2">
            {Array.isArray(data[fieldData.fieldName]) ? (
              data[fieldData.fieldName].length ? (
                data[fieldData.fieldName].map((_val) => (
                  <>
                    <MuiLink
                      component={Link}
                      to={redirectLink(_val.optionValue)}
                    >
                      {_val.optionLabel}
                    </MuiLink>
                    <Box component="span" marginX={1} />
                  </>
                ))
              ) : (
                "_ _ _"
              )
            ) : data[fieldData.fieldName] ? (
              <MuiLink
                component={Link}
                to={redirectLink(data[fieldData.fieldName].optionValue)}
              >
                {data[fieldData.fieldName].optionLabel}
              </MuiLink>
            ) : (
              "_ _ _"
            )}
          </Typography>
        );
      }
    } else {
      return (
        <Typography
          title={
            normalizeValues(val, fieldData) === "_ _ _"
              ? ""
              : normalizeValues(val, fieldData)
          }
          className={classes.fieldText}
          variant="body2"
        >
          {normalizeValues(val, fieldData)}
        </Typography>
      );
    }
  };

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
              <Grid
                key={i}
                item
                xs={12}
                sm={dynamicSize(6, field.fieldData.type)}
                md={dynamicSize(6, field.fieldData.type)}
              >
                <Grid container alignItems="center">
                  <Grid
                    item
                    xs={dynamicSize(6, field.fieldData.type)}
                    sm={dynamicSize(5, field.fieldData.type)}
                    md={dynamicSize(5, field.fieldData.type)}
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
                    xs={dynamicSize(6, field.fieldData.type)}
                    sm={dynamicSize(7, field.fieldData.type)}
                    md={dynamicSize(7, field.fieldData.type)}
                  >
                    {field.fieldData.type === "imageUpload" ? (
                      <Box paddingLeft={1} marginTop={1}>
                        <Avatar src={initialVals[field.fieldData.fieldName]} />
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center">
                        {field.fieldData.type === "fileUpload" &&
                        initialVals[field.fieldData.fieldName] ? (
                          <InsertDriveFile />
                        ) : null}{" "}
                        {renderData(initialVals, field.fieldData)}
                        {field.fieldData.type === "fileUpload"
                          ? initialVals[field.fieldData.fieldName] && (
                              <IconButton
                                title={`Download ${
                                  initialVals[field.fieldData.fieldName]
                                }`}
                                disabled={isDownloading}
                                size="small"
                                onClick={() =>
                                  downloadFile(
                                    normalizeValues(
                                      initialVals,
                                      field.fieldData
                                    )
                                  )
                                }
                              >
                                {isDownloading ? (
                                  <Box
                                    position="relative"
                                    display="inline-flex"
                                  >
                                    <CircularProgress
                                      variant="determinate"
                                      value={progress}
                                      size={30}
                                      color="inherit"
                                    />
                                    <Box
                                      top={0}
                                      left={0}
                                      bottom={0}
                                      right={0}
                                      position="absolute"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <Typography
                                        variant="caption"
                                        component="div"
                                        color="textSecondary"
                                      >{`${Math.round(progress)}%`}</Typography>
                                    </Box>
                                  </Box>
                                ) : (
                                  <GetApp />
                                )}
                              </IconButton>
                            )
                          : null}{" "}
                      </Box>
                    )}
                  </Grid>
                </Grid>
                <Box marginY={1} />
                {field.fieldData.type !== "imageUpload" &&
                  field.fieldData.type !== "fileUpload" && (
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
