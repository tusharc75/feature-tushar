import React, { useState, useEffect, useContext } from 'react';
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Link as MuiLink,
  ImageList,
  ImageListItem,
  GridSize
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import { GetApp, InfoOutlined, InsertDriveFile } from '@material-ui/icons';
import { kebabCase } from 'lodash';
import axios from 'axios';
import { FcApproval } from 'react-icons/fc';
import { FaDiceOne } from 'react-icons/fa';
import { getObjKeysWithValues, sidebarResource } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import CopyToClipboard from '../Helpers/CopyToClipboard';
import { displayDate, displayDateTime, getUniqueCurrencies } from '../../constants/helpers';
import HtmlTooltip from '../CustomTooltipTitle';
import CarouselDialog from '../CarouselDialog';
import { camelCase } from 'lodash';

const useStyles = makeStyles((theme) => ({
  fieldText: {
    borderRadius: 4,
    cursor: 'normal',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      whiteSpace: 'nowrap',
      width: '250px'
    },
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'nowrap',
      width: '250px'
    }
  },
  imageListContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper
  },
  imageListItem: {
    height: '50px !important',
    width: '33.33% !important'
  },
  imageList: {
    flexWrap: 'nowrap',
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: 'translateZ(0)'
  },
  popoverText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },

  approvalIcon: {
    position: 'relative',
    marginLeft: '2px',
    top: '4px'
  },
  '@media only screen and (max-width: 600px)': {
    fieldText: {
      fontSize: '0.8rem'
    }
  }
}));

interface DetailProps {
  data: object;
  fields: any[];
  gridSize?: GridSize;
  containerPadding?: string | number;
  fullHeight?: boolean;
}

const unlinkFields = [
  sidebarResource.marketSegment,
  sidebarResource.budget,
  sidebarResource.productCategory,
  sidebarResource.productTemplate,
  sidebarResource.priceTemplate,
  sidebarResource.termsAndConditions
];
const Details = (props: DetailProps) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { permissions }
  }: any = useData();
  const { data, fields, gridSize, containerPadding, fullHeight = false } = props;
  const [isDownloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [initialVals, setValues] = useState(null);
  const [formsData, setFormsData] = useState([]);
  const [dialogData, setDialogData] = useState<any>(null);

  useEffect(() => {
    sortArray();
    const fieldData = fields.map((f) => f.fieldData);
    const vals = getObjKeysWithValues(data, fieldData);
    fieldData?.forEach((e) => {
      if (e.type === 'lookUpDisplay') {
        vals[e.fieldName] = data[e.fieldName];
      }
    });
    setValues(vals);

    return () => {
      setValues(null);
      setFormsData([]);
    };
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
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(percentCompleted);

          if (percentCompleted === 100) {
            setToastConfig({
              message: 'File Downloaded Successfully',
              open: true,
              type: 'success'
            });
            setTimeout(() => {
              setDownloadProgress(0);
              setDownloading(false);
            }, 2000);
          }
        }
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
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
    let text = '';
    if (input.type === 'multiSelect') {
      const filterOptions = input.option?.filter((opt) => values[input.fieldName].includes(opt.optionValue));
      const value =
        typeof values[input.fieldName] === 'string'
          ? values[input.fieldName]
          : filterOptions.length
            ? filterOptions.map((d) => d.optionLabel).join(', ')
            : '';
      text = value ? value : '-';
    } else if (input.type === 'freeStyleMultiSelect') {
      const value =
        values[input.fieldName].length && Array.isArray(values[input.fieldName])
          ? values[input.fieldName].map((d) => d).join(', ')
          : typeof values[input.fieldName] === 'string'
            ? values[input.fieldName]
            : '';

      text = value ? value : '-';
    } else if (input.type === 'dropDown') {
      const opt = input.option?.find((o) => o.optionValue === values[input.fieldName]);
      const value = opt && Object.keys(opt).length ? opt.optionLabel : '';
      text = value ? value : '-';
    } else if (input.type === 'currency') {
      const opt = getUniqueCurrencies().find((c) => c.currencyCode === values[input.fieldName]);
      text = opt ? `${opt.currencyCode} - ${opt.currencyName}` : '-';
    } else if (input.type === 'switch') {
      text = values[input.fieldName] ? 'Inactive' : 'Active';
    } else if (input.type === 'checkBox') {
      text = values[input.fieldName] === true ? 'Yes' : 'No';
    } else if (input.type === 'date') {
      text = values[input.fieldName] ? displayDate(values[input.fieldName]) : '-';
    } else if (input.type === 'dateTime') {
      text = values[input.fieldName] ? displayDateTime(values[input.fieldName]) : '-';
    } else if (input.type === 'lookUpDisplay') {
      text = values[input.fieldName] ? values[input.fieldName]?.optionLabel : '-';
    } else {
      text = values[input.fieldName] ? values[input.fieldName] : '-';
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
      let fieldsData = allFields.filter((field) => field.fieldData.sectionName === name);

      const sectionFields = fieldsData.map((formData) => formData);
      return { name, sectionFields };
    });
    setFormsData(customData);
  };

  // DYNAMIC GRID COLUMN SIZE
  const dynamicSize = (size, type) => (type === 'imageUpload' || type === 'fileUpload' ? 12 : size);

  /**
   * Render Link  or Typography component
   */
  const renderData = (val: any, fieldData: any) => {
    const value = normalizeValues(val, fieldData);
    if (
      fieldData?.hasOwnProperty('lookup') &&
      fieldData?.lookup &&
      permissions &&
      (fieldData?.fieldName === "termsConditions" ? permissions["termsAndConditions"]?.isRead : permissions[camelCase(fieldData?.lookupResource)]?.isRead)
      // && !unlinkFields.includes(fieldData?.lookupResource)
    ) {
      if (fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') {
        return (
          <Typography className={classes.fieldText} variant="body2">
            {Array.isArray(data[fieldData.fieldName]) ? (
              data[fieldData.fieldName].length ? (
                data[fieldData.fieldName].map((_val: any, i) => (
                  <React.Fragment key={_val.optionValue}>
                    <Link
                      to={`/${kebabCase(fieldData.lookupResource)}/detail/${_val.optionValue}`}
                    // onMouseEnter={(e) =>
                    //   getPopoverData(
                    //     e,
                    //     fieldData.lookupResource,
                    //     _val.optionValue
                    //   )
                    // }
                    >
                      <span className={`text-truncate link`}>
                        {_val.optionLabel}
                        {i < data[fieldData.fieldName].length - 1 ? ',' : ''}
                      </span>
                    </Link>
                  </React.Fragment>
                ))
              ) : (
                <Typography component={'span'} style={{ padding: '7px 10px' }}>
                  -
                </Typography>
              )
            ) : data[fieldData.fieldName] ? (
              <Link
                to={unlinkFields.includes(fieldData?.lookupResource) ? `/${kebabCase(fieldData.lookupResource)}?id=${val[fieldData.fieldName]}` : `/${kebabCase(fieldData.lookupResource)}/detail/${val[fieldData.fieldName]}`}
              // onMouseEnter={(e) =>
              //   getPopoverData(
              //     e,
              //     fieldData.lookupResource,
              //     val[fieldData.fieldName]
              //   )
              // }
              >
                <span className={`text-truncate link`}>
                  {data[fieldData.fieldName].optionLabel || value}
                  {data[fieldData.fieldName]?.staticData?.approved && data[fieldData.fieldName]?.staticData?.approved === true ? (
                    <FcApproval className={classes.approvalIcon} title="Approved" size={20} />
                  ) : null}
                </span>
              </Link>
            ) : (
              <Typography component={'span'} style={{ padding: '7px 10px' }}>
                -
              </Typography>
            )}
          </Typography>
        );
      }
    } else {
      return fieldData.type === 'multiImageUpload' ? (
        val[fieldData.fieldName] && (
          <div className={classes.imageListContainer}>
            <ImageList className={classes.imageList} cols={2.5}>
              {val[fieldData.fieldName].map((item, i) => (
                <ImageListItem className={classes.imageListItem} key={item}>
                  <img
                    className="cursor-pointer"
                    onClick={() => {
                      setDialogData({ index: i, open: true, images: val[fieldData.fieldName] });
                    }}
                    src={item}
                    alt={item}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </div>
        )
      ) : fieldData.type === 'colorPicker' ? (
        <Box display="flex" alignItems="center">
          <Box width={16} height={16} borderRadius={'50%'} bgcolor={value} />
          <Typography variant="body2" className={classes.fieldText}>
            {value}
          </Typography>
        </Box>
      ) : fieldData.type === 'signature' ? (
        <Box display="flex" alignItems="center">
          <Box position="relative" sx={{
            width: 50,
            height: 50,
            borderRadius: '8px',
            marginRight: '10px',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          >
            {value ? (
              <img src={value} style={{ maxWidth: 50, maxHeight: 50, width: '100%', height: 'auto' }} alt="Signature" />
            ) : (
              '-'
            )}
          </Box>
        </Box>
      ) : (
        <Typography title={value === '-' ? '' : value} className={classes.fieldText} variant="body2">
          {fieldData.type === 'url' || fieldData.type === 'email' ? (
            <>
              <MuiLink href={fieldData.type === 'email' ? `mailto:${value}` : `https://${value}`} target="_blank">
                <span className={`text-truncate `}> {value} </span>
              </MuiLink>
              {fieldData.type === 'email' && value !== '-' ? <CopyToClipboard textToCopy={value} /> : null}
            </>
          ) : (
            <span className={`text-truncate `}>{value}</span>
          )}
          {fieldData.type === 'mobileNumber' && value !== '-' ? <CopyToClipboard textToCopy={value} /> : null}
        </Typography>
      );
    }
  };

  return (
    <div className="form-v1">
      {formsData?.map((form) => {
        return (
          form.name && (
            <React.Fragment key={form.name}>
              <div
                className={`single-form-v1 ${fullHeight && 'full-height-details-from'}`}
                style={containerPadding ? { padding: containerPadding } : {}}
              >
                <div className={'form-head-v1'}>
                  {/* <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} /> */}
                  <h3 className="form-label-style-v1" title={form.name}>
                    {form.name}
                  </h3>
                </div>
                <Grid container className="formdata-v1">
                  {form.sectionFields.map((field, i) => (
                    <Grid
                      key={i}
                      item
                      xs={12}
                      sm={gridSize ?? dynamicSize(6, field.fieldData.type)}
                      xl={gridSize ?? dynamicSize(4, field.fieldData.type)}
                    >
                      <Grid container alignItems="center" style={{ border: field.fieldData.type === 'imageUpload' ? 0 : '1px solid #EDEDED' }}>
                        <Grid item xs={dynamicSize(6, field.fieldData.type)} sm={dynamicSize(5, field.fieldData.type)}>
                          <div
                            className="d-flex align-items-center formdata-title-v1"
                            style={{ borderRight: field.fieldData.type === 'imageUpload' && 0 }}
                          >
                            <h4
                              title={field.fieldData.fieldLabel}
                              style={{ paddingLeft: field.fieldData.type === 'imageUpload' && 0 }}
                              className={`text-truncate `}
                            >
                              {field.fieldData.fieldLabel}
                            </h4>
                            {field.fieldData.isTooltip && (
                              <HtmlTooltip title={field.fieldData.tooltipMessage}>
                                <InfoOutlined style={{ width: 18, height: 18 }} color="disabled" />
                              </HtmlTooltip>
                            )}
                          </div>
                        </Grid>

                        <Grid item xs={dynamicSize(6, field.fieldData.type)} sm={dynamicSize(7, field.fieldData.type)}>
                          {field.fieldData.type === 'imageUpload' ? (
                            <Box marginTop={1} marginBottom={4}>
                              <Avatar src={initialVals[field.fieldData.fieldName]} style={{ width: 56, height: 56 }} />
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center" className="formdata-text-v1">
                              {field.fieldData.type === 'fileUpload' && initialVals[field.fieldData.fieldName] ? <InsertDriveFile /> : null}{' '}
                              {renderData(initialVals, field.fieldData)}
                              {field.fieldData.type === 'fileUpload'
                                ? initialVals[field.fieldData.fieldName] &&
                                (isDownloading ? (
                                  <Box display="flex" alignItems="center">
                                    {downloadProgress === 100 ? 'Downloaded' : 'Downloading'}

                                    <Box marginLeft={1} position="relative" display="inline-flex">
                                      <CircularProgress size={30} variant="determinate" value={downloadProgress} />
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
                                        <Typography variant="caption" component="div" color="textSecondary">{`${downloadProgress}%`}</Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                ) : (
                                  <IconButton
                                    title={`Download ${initialVals[field.fieldData.fieldName]}`}
                                    disabled={isDownloading}
                                    size="small"
                                    onClick={() => downloadFile(normalizeValues(initialVals, field.fieldData))}
                                  >
                                    <GetApp />
                                  </IconButton>
                                ))
                                : null}{' '}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                      {field.fieldData.type !== 'imageUpload' && field.fieldData.type !== 'fileUpload'}
                    </Grid>
                  ))}
                </Grid>
              </div>
            </React.Fragment>
          )
        );
      })}
      {dialogData && dialogData.open && <CarouselDialog index={dialogData.index} close={() => setDialogData(null)} images={dialogData.images} />}
    </div>
  );
};

export default Details;
