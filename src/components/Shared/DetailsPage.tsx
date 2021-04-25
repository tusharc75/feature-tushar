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
  Popover,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { GetApp, InfoOutlined, InsertDriveFile } from "@material-ui/icons";
import { kebabCase } from "lodash";
import axios from "axios";

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
  popoverText: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
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
  const [anchorPopoverEl, setAnchorPopoverEl] = useState(null);
  const [popoverData, setPopoverData] = useState(null);
  const [loadingPopoverData, setLoadingPopoverData] = useState(true);
  const [lookupResource, setLookupResource] = useState(null);
  const cancelTokenSource = axios.CancelToken.source();

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
      text = values[input.fieldName] === true ? "Yes" : "No";
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

  const handlePopoverOpen = (event) => {
    setAnchorPopoverEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    cancelTokenSource.cancel();
    setAnchorPopoverEl(null);
    setLookupResource(null);
    setPopoverData(null);
  };

  const getPopoverData = (e: React.MouseEvent, field: any, value: string) => {
    handlePopoverOpen(e);
    setLookupResource(kebabCase(field));
    setLoadingPopoverData(true);
    axiosInstance()
      .get(`/${kebabCase(field)}/${value}`, {
        cancelToken: cancelTokenSource.token,
      })
      .then(({ data }) => {
        setPopoverData(data.data);
        setLoadingPopoverData(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setLoadingPopoverData(false);
      });
  };

  /**
   * Render Link  or Typography component
   */
  const renderData = (val: any, fieldData: any) => {
    const value = normalizeValues(val, fieldData);

    if (fieldData.hasOwnProperty("lookup") && fieldData.lookup) {
      const redirectLink = (link: string) =>
        `/${kebabCase(fieldData.lookupResource)}/detail/${link}`;

      if (fieldData.type === "multiSelect" || fieldData.type === "dropDown") {
        return (
          <Typography
            className={classes.fieldText}
            variant="body2"
            component="div"
          >
            {Array.isArray(data[fieldData.fieldName]) ? (
              data[fieldData.fieldName].length ? (
                data[fieldData.fieldName].map((_val: any) => (
                  <React.Fragment key={_val.optionValue}>
                    <Box
                      style={{ cursor: "pointer" }}
                      component="span"
                      onMouseEnter={(e) =>
                        getPopoverData(
                          e,
                          fieldData.lookupResource,
                          _val.optionValue
                        )
                      }
                    >
                      {_val.optionLabel}
                    </Box>
                    <Box component="span" marginX={1} />
                  </React.Fragment>
                ))
              ) : (
                "_ _ _"
              )
            ) : data[fieldData.fieldName] ? (
              <Box
                style={{ cursor: "pointer" }}
                component="span"
                onMouseEnter={(e) =>
                  getPopoverData(
                    e,
                    fieldData.lookupResource,
                    val[fieldData.fieldName]
                  )
                }
              >
                {data[fieldData.fieldName].optionLabel}
              </Box>
            ) : (
              "_ _ _"
            )}
          </Typography>
        );
      }
    } else {
      return (
        <Typography
          title={value === "_ _ _" ? "" : value}
          className={classes.fieldText}
          variant="body2"
        >
          {fieldData.type === "url" ? (
            <MuiLink href={value} target="_blank">
              {value}
            </MuiLink>
          ) : (
            value
          )}
        </Typography>
      );
    }
  };

  const renderPopoverData = () => {
    const img =
      lookupResource === "user"
        ? popoverData?.avatar
        : lookupResource === "contact-account" ||
          lookupResource === "supplier-account"
        ? popoverData?.accountLogo
        : lookupResource === "contact-contact"
        ? popoverData?.contactLogo
        : "";
    const name =
      lookupResource === "user"
        ? `${popoverData?.firstName} ${popoverData?.lastName}`
        : lookupResource === "customer-account" ||
          lookupResource === "supplier-account"
        ? popoverData?.accountName
        : lookupResource === "customer-contact" ||
          lookupResource === "supplier-contact"
        ? `${popoverData?.firstName} ${popoverData?.middleName} ${popoverData?.lastName}`
        : "";

    const subInfo =
      lookupResource === "user"
        ? popoverData?.email
        : lookupResource === "customer-account" ||
          lookupResource === "supplier-account"
        ? popoverData?.description
        : lookupResource === "customer-contact" ||
          lookupResource === "supplier-contact"
        ? popoverData?.email
        : "";

    const subInfo1 =
      lookupResource === "user"
        ? popoverData?.mobileNo
        : lookupResource === "customer-account" ||
          lookupResource === "supplier-account"
        ? popoverData?.owner?.optionLabel
        : lookupResource === "customer-contact" ||
          lookupResource === "supplier-contact"
        ? popoverData?.phone
        : "";

    return (
      <Box width="250px">
        {loadingPopoverData || !popoverData ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress size={20} />
          </Box>
        ) : (
          <Box p={1} display="flex" alignItems="start">
            <Avatar style={{ width: 50, height: 50 }} src={img}>
              {name && name.charAt(0)}
            </Avatar>
            <Box
              marginLeft={2}
              display="flex"
              flexDirection="column"
              justifyContent="start"
            >
              <Typography className={classes.popoverText}>
                <MuiLink
                  component={Link}
                  to={`/${lookupResource}/detail/${popoverData?._id}`}
                >
                  {name}
                </MuiLink>
              </Typography>
              <Typography
                color="textSecondary"
                variant="body2"
                className={classes.popoverText}
              >
                {subInfo}
              </Typography>
              {/* <Typography
                color="textSecondary"
                variant="body2"
                className={classes.popoverText}
              >
                {subInfo1}
              </Typography> */}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <div>
      <Popover
        onClick={handlePopoverClose}
        open={Boolean(anchorPopoverEl)}
        anchorEl={anchorPopoverEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box
          id="#popover_container"
          padding={1}
          style={{ pointerEvents: "all", overflow: "hidden" }}
          onMouseLeave={handlePopoverClose}
        >
          {renderPopoverData()}
        </Box>
      </Popover>
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
    </div>
  );
};

export default Details;
