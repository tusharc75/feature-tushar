import React, { useState, useEffect, useContext } from "react";
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  Tooltip,
  Avatar,
  IconButton,
  CircularProgress,
  Link as MuiLink,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { GetApp, InfoOutlined, InsertDriveFile } from "@material-ui/icons";
import { kebabCase } from "lodash";
import axios from "axios";
import { FcApproval } from "react-icons/fc";
import { camelCase, getObjKeysWithValues, sidebarResource } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "../../StateProvider/Provider";
import { Skeleton } from "@material-ui/lab";
import CopyToClipboard from "../Helpers/CopyToClipboard";
import { displayDate, getUniqueCurrencies } from "../../constants/helpers";

const useStyles = makeStyles((theme) => ({
  fieldText: {
    padding: theme.spacing(0.5, 0.5, 0.5, 1),
    borderRadius: 4,
    cursor: "normal",
    textOverflow: "ellipsis",
    overflow: "hidden",
    [theme.breakpoints.down("md")]: {
      whiteSpace: "nowrap",
      width: "250px"
    },
    [theme.breakpoints.down("xs")]: {
      whiteSpace: "nowrap",
      width: "250px"
    },
  },
  popoverText: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  dataValue: {
    fontWeight: 500,
    color: theme.palette.primary.main,
  },
  detailLabel: {
    fontSize: "0.8rem",
    fontWeight: "normal",
    color: "#656464",
  },
  approvalIcon: {
    position: "relative",
    marginLeft: "2px",
    top: "4px",
  },
}));

interface DetailProps {
  data: object;
  fields: any[];
}

const unlinkFields = [sidebarResource.marketSegment, sidebarResource.budget, sidebarResource.productCategory];
const Details = (props: DetailProps) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { permissions }
  }: any = useData();
  const { data, fields } = props;
  const [isDownloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [initialVals, setValues] = useState(null);
  const [formsData, setFormsData] = useState([]);
  const [popoverData, setPopoverData] = useState(null);
  const [loadingPopoverData, setLoadingPopoverData] = useState(true);
  const [lookupResource, setLookupResource] = useState(null);
  const cancelTokenSource = axios.CancelToken.source();

  useEffect(() => {
    sortArray();
    const fieldData = fields.map((f) => f.fieldData);
    const vals = getObjKeysWithValues(data, fieldData);
    setValues(vals);

    return () => {
      setValues(null);
      setFormsData([])
    }
    // eslint-disable-next-line
  }, [fields, data]);

  /**
   * DOWNLOAD FILE
   * @param fileName
   */
  const downloadFile = (fileName) => {
    setDownloadProgress(0);
    setDownloading(true);
    axiosInstance()
      .get(`user/download?fileName=${fileName}`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setDownloadProgress(percentCompleted);

          if (percentCompleted === 100) {
            setToastConfig({
              message: "File Downloaded Successfully",
              open: true,
              type: "success",
            });
            setTimeout(() => {
              setDownloadProgress(0);
              setDownloading(false);
            }, 2000);
          }
        },
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => setDownloading(false), 2000);
      })
      .catch((err) => {
        setToastConfig(err);
        setDownloading(false);
      });
  };

  /**
   * NORMAILIZE ALL THE VALUES AS A SIMPLE TEXT FROM OBJECTS AND ID's
   * @param values
   * @param input
   * @returns text
   */
  const normalizeValues = (values, input) => {
    let text = "";
    if (input.type === "multiSelect") {
      const filterOptions = input.option?.filter((opt) =>
        values[input.fieldName].includes(opt.optionValue)
      );
      const value = filterOptions.length
        ? filterOptions.map((d) => d.optionLabel).join(", ")
        : "";
      text = value ? value : "-";
    } else if (input.type === "dropDown") {
      const opt = input.option?.find(
        (o) => o.optionValue === values[input.fieldName]
      );
      const value = opt && Object.keys(opt).length ? opt.optionLabel : "";
      text = value ? value : "-";
    } else if (input.type === "currency") {
      const opt = getUniqueCurrencies().find(
        (c) => c.currencyCode === values[input.fieldName]
      );
      text = opt ? `${opt.currencyCode} - ${opt.currencyName}` : "-";
    } else if (input.type === "switch") {
      text = values[input.fieldName] ? "Inactive" : "Active";
    } else if (input.type === "checkBox") {
      text = values[input.fieldName] === true ? "Yes" : "No";
    } else if (input.type === "date") {
      text = values[input.fieldName]
        ? displayDate(values[input.fieldName])
        : "-";
    } else {
      text = values[input.fieldName] ? values[input.fieldName] : "-";
    }
    return text;
  };

  /**
   * SORT FIELDS ARRAY WITH SECTiONS
   */
  const sortArray = () => {
    const sections = [];

    const allFields = fields.sort((a, b) => {
      return a.fieldData.order - b.fieldData.order;
    });

    allFields.forEach((field) => {
      if (!sections.includes(field.fieldData.sectionName)) {
        sections.push(field.fieldData.sectionName);
      }
    });

    const customData = sections.map((name) => {
      let fieldsData = allFields.filter(
        (field) => field.fieldData.sectionName === name
      );

      const sectionFields = fieldsData.map((formData) => formData);
      return { name, sectionFields };
    });
    setFormsData(customData);
  };

  // DYNAMIC GRID COLUMN SIZE
  const dynamicSize = (size, type) =>
    type === "imageUpload" || type === "fileUpload" ? 12 : size;

  /**
   * Render Link  or Typography component
   */
  const renderData = (val: any, fieldData: any) => {

    const value = normalizeValues(val, fieldData);
    if (fieldData.hasOwnProperty("lookup") && fieldData.lookup && permissions[camelCase(fieldData.lookupResource)]?.isRead && !unlinkFields.includes(fieldData.lookupResource)) {
      if (fieldData.type === "multiSelect" || fieldData.type === "dropDown") {
        return (
          <Typography className={classes.fieldText} variant="body2">
            {Array.isArray(data[fieldData.fieldName]) ? (
              data[fieldData.fieldName].length ? (
                data[fieldData.fieldName].map((_val: any, i) => (
                  <React.Fragment key={_val.optionValue}>
                    <Link
                      to={`/${kebabCase(fieldData.lookupResource)}/detail/${_val.optionValue
                        }`}
                    // onMouseEnter={(e) =>
                    //   getPopoverData(
                    //     e,
                    //     fieldData.lookupResource,
                    //     _val.optionValue
                    //   )
                    // }
                    >
                      <span className={`text-truncate ${classes.dataValue}`}>
                        {_val.optionLabel}
                        {i < data[fieldData.fieldName].length - 1 ? "," : ""}
                      </span>
                    </Link>
                  </React.Fragment>
                ))
              ) : (
                "-"
              )
            ) : data[fieldData.fieldName] ? (
              <Link
                to={`/${kebabCase(fieldData.lookupResource)}/detail/${val[fieldData.fieldName]
                  }`}
              // onMouseEnter={(e) =>
              //   getPopoverData(
              //     e,
              //     fieldData.lookupResource,
              //     val[fieldData.fieldName]
              //   )
              // }
              >
                <span className={`text-truncate ${classes.dataValue}`}>
                  {data[fieldData.fieldName].optionLabel}
                  {data[fieldData.fieldName]?.staticData?.approved &&
                    data[fieldData.fieldName]?.staticData?.approved === true ? (
                    <FcApproval
                      className={classes.approvalIcon}
                      title="Approved"
                      size={20}
                    />
                  ) : null}
                </span>
              </Link>
            ) : (
              "-"
            )}
          </Typography>
        );
      }
    } else {
      return (
        <Typography
          title={value === "-" ? "" : value}
          className={classes.fieldText}
          variant="body2"
        >
          {fieldData.type === "url" || fieldData.type === "email" ? (
            <>
              <MuiLink
                href={
                  fieldData.type === "email"
                    ? `mailto:${value}`
                    : `https://${value}`
                }
                target="_blank"
              >
                <span className={`text-truncate ${classes.dataValue}`}> {value} </span>
              </MuiLink>
              {fieldData.type === "email" && value !== "-" ? (
                <CopyToClipboard textToCopy={value} />
              ) : null}
            </>
          ) : (
            <span className={`text-truncate ${classes.dataValue}`}> {value} </span>
          )}
          {fieldData.type === "mobileNumber" && value !== "-" ? (
            <CopyToClipboard textToCopy={value} />
          ) : null}
        </Typography>
      );
    }
  };

  return (
    <div>
      {formsData?.map((form) => {
        return (
          form.name && (
            <React.Fragment key={form.name}>
              <div className="detail-box">
                <h3 className="form-label-style" title={form.name}>
                  {form.name}
                </h3>
                <Grid container>
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
                            <h4
                              title={field.fieldData.fieldLabel}
                              className={classes.detailLabel}
                            >
                              {field.fieldData.fieldLabel}
                            </h4>
                            <Box marginX="2px" />
                            {field.fieldData.isTooltip && (
                              <Tooltip title={field.fieldData.tooltipMessage}>
                                <InfoOutlined
                                  style={{ width: 18, height: 18 }}
                                  color="disabled"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </Grid>
                        <Grid
                          item
                          xs={dynamicSize(6, field.fieldData.type)}
                          sm={dynamicSize(7, field.fieldData.type)}
                          md={dynamicSize(7, field.fieldData.type)}
                        >
                          {field.fieldData.type === "imageUpload" ? (
                            <Box paddingLeft={2} marginTop={1} marginBottom={4}>
                              <Avatar
                                src={initialVals[field.fieldData.fieldName]}
                              />
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center">
                              {field.fieldData.type === "fileUpload" &&
                                initialVals[field.fieldData.fieldName] ? (
                                <InsertDriveFile />
                              ) : null}{" "}
                              {renderData(initialVals, field.fieldData)}
                              {field.fieldData.type === "fileUpload"
                                ? initialVals[field.fieldData.fieldName] &&
                                (isDownloading ? (
                                  <Box display="flex" alignItems="center">
                                    {downloadProgress === 100
                                      ? "Downloaded"
                                      : "Downloading"}

                                    <Box
                                      marginLeft={1}
                                      position="relative"
                                      display="inline-flex"
                                    >
                                      <CircularProgress
                                        size={30}
                                        variant="determinate"
                                        value={downloadProgress}
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
                                        >{`${downloadProgress}%`}</Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                ) : (
                                  <IconButton
                                    title={`Download ${initialVals[field.fieldData.fieldName]
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
                                    <GetApp />
                                  </IconButton>
                                ))
                                : null}{" "}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                      {field.fieldData.type !== "imageUpload" &&
                        field.fieldData.type !== "fileUpload"}
                    </Grid>
                  ))}
                </Grid>
              </div>
            </React.Fragment>
          )
        );
      })}
    </div>
  );
};

export default Details;
