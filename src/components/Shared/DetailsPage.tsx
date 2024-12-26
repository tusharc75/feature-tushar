import { Avatar, Box, Dialog, GridSize, IconButton, ImageList, ImageListItem, Link as MuiLink, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Image, InfoOutlined, MoreHoriz } from '@mui/icons-material';
import { camelCase, isArray, kebabCase } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { FcApproval } from 'react-icons/fc';
import { Link } from 'react-router-dom';
import { PreviewFile } from 'src/components/PreviewFile';
import {
  cn,
  colSpans,
  columnSize,
  CustomDialogTransition,
  displayDate,
  displayDateTime,
  formatAmountWithCurrency,
  getFileIconSrc,
  getObjKeysWithValues,
  getUniqueCurrencies,
  HIDDEN_FIELD_TYPE
} from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import CarouselDialog from '../CarouselDialog';
import HtmlTooltip from '../CustomTooltipTitle';
import FollowUpsDialog from 'src/components/Activity/Task/FollowUpsDialog';
import axios, { CancelTokenSource } from 'axios';
import axiosInstance from 'src/axios/axiosInstance';
import { FaUserPlus } from 'react-icons/fa6';
import NumberCell from 'src/components/CustomReactTable/Cells/NumberCell';
import GroupSignatureCell from 'src/components/CustomReactTable/Cells/GroupSignatureCell';
import CopyToClipboardButton from 'src/components/CopyToClipboardButton';
import { isFieldVisible, isSectionVisible } from 'src/components/Helpers/FormTypes';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GoogleMaps from 'src/components/GoogleMap';
import { CreateTask } from 'src/components/Activity/Task/CreateTask';
import { isMobile, isTablet } from 'react-device-detect';
import FreeStyleMultiSelect from 'src/components/CustomReactTable/Cells/FreeStyleMultiSelect';

const useStyles = makeStyles((theme: Theme) => ({
  fieldText: {
    borderRadius: 4,
    cursor: 'normal',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      whiteSpace: 'pre-wrap',
      width: '250px'
    },
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'pre-wrap',
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
  },
  withMultichild: {
    display: 'flex',
    flexWrap: 'wrap',
    borderLeft: '1px solid var(--dark-mode-border-color, #e2e2e2)',
    marginLeft: '-1px'
  }
}));

interface DetailProps {
  data: object;
  fields: any[];
  gridSize?: GridSize;
  containerPadding?: string | number;
  fullHeight?: boolean;
  resource?: string;
  referenceId?: string;
}

const Details = (props: DetailProps) => {
  const classes = useStyles();
  const {
    state: { permissions, user }
  }: any = useData();
  const { data, fields, gridSize, containerPadding, fullHeight = false, resource = null, referenceId = null } = props;

  const [initialVals, setValues] = useState(null);
  const [formsData, setFormsData] = useState([]);
  const [formDataWithFollowUps, setFormDataWithFollowUps] = useState([]);
  const [dialogData, setDialogData] = useState<any>(null);
  const [open, setOpen] = useState({ open: false, section: null });
  const [taskData, setTaskdata] = useState(null);
  const fieldsData = useMemo(() => fields?.filter((f) => !HIDDEN_FIELD_TYPE.includes(f?.fieldData?.type))?.map((f) => f.fieldData), [fields]);
  const [viewMap, setViewMap] = useState({ open: false, locationName: null, longitude: null, latitude: null });
  const [openTask, setOpenTask] = useState({ open: false, _id: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    sortArray();
    // const fieldData = fields?.filter((f) => !HIDDEN_FIELD_TYPE.includes(f?.fieldData?.type))?.map((f) => f.fieldData);
    const vals = getObjKeysWithValues(data, fieldsData);
    fieldsData?.forEach((e) => {
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
   * NORMAILIZE ALL THE VALUES AS A SIMPLE TEXT FROM OBJECTS AND ID's
   * @param values
   * @param input
   * @returns text
   */
  const normalizeValues = (values, input): string | any[] => {
    let text = '';
    if ((input.type === 'multiSelect' || input.type === 'dropDown') && input?.dataList) {
      if (input.type === 'multiSelect') {
        const value = values[`${input?.fieldName}_dataList`]?.length
          ? values[`${input?.fieldName}_dataList`]?.map((d) => d.optionLabel).join(', ')
          : '';
        text = value ? value : '-';
      } else {
        const value = values[`${input?.fieldName}_dataList`]?.optionLabel;
        text = value ? value : '-';
      }
    } else if (input.type === 'multiSelect') {
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
    } else if (input.type === 'currencyNumber') {
      const currency = user?.user?.brandCurrency || 'USD';
      const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative;
      text = `${currencySymbol}${formatAmountWithCurrency(currency, values[input.fieldName] || 0)?.amountWithouCurrencyCode ?? (values[input.fieldName] || 0)}`;
    } else if (input.type === 'currencyAmount') {
      const currency = user?.user?.brandCurrency || 'USD';
      const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative;
      text = `${currencySymbol}${formatAmountWithCurrency(currency, values[`${input.fieldName}_${currency?.toLowerCase()}`] || 0)?.amountWithouCurrencyCode ?? (values[input.fieldName] || 0)}`;
    } else if (input.type === 'switch') {
      text = values[input.fieldName] ? 'Yes' : 'No';
    } else if (input.type === 'checkBox') {
      text = values[input.fieldName] === true ? 'Yes' : 'No';
    } else if (input.type === 'date') {
      text = values[input.fieldName] ? displayDate(values[input.fieldName]) : '-';
    } else if (input.type === 'dateTime') {
      text = values[input.fieldName] ? displayDateTime(values[input.fieldName]) : '-';
    } else if (input.type === 'lookUpDisplay') {
      text = isArray(values[input.fieldName])
        ? values[input.fieldName]?.map((e) => e?.optionLabel)?.toString()
        : values[input.fieldName]
          ? values[input.fieldName]?.optionLabel
          : '-';
    } else if (input.type === 'location') {
      text = values[input.fieldName];
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
    const allFields = fields
      ?.filter((f) => !HIDDEN_FIELD_TYPE.includes(f?.fieldData?.type))
      ?.sort((a, b) => {
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

  const isTypeFile = (type: string) => ['imageUpload', 'fileUpload', 'multiFileUpload', 'multiImageUpload'].includes(type);

  const renderData = (val: any, fieldData: any) => {
    const value: any = normalizeValues(val, fieldData);
    if (fieldData?.hasOwnProperty('lookup') && fieldData?.lookup && permissions && permissions[camelCase(fieldData?.lookupResource)]?.isRead) {
      if (fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') {
        return (
          <Typography className={`${classes.fieldText} ${classes.withMultichild} w-full`} variant="body2">
            {Array.isArray(data[fieldData.fieldName]) ? (
              data[fieldData.fieldName].length ? (
                data[fieldData.fieldName].map((_val: any, i) => (
                  <React.Fragment key={_val.optionValue}>
                    <Link
                      to={`/${kebabCase(fieldData.lookupResource)}/detail/${_val.optionValue}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link block w-full"
                      title={_val.optionLabel}
                    >
                      <span className={`link block md:truncate md:text-ellipsis`}>
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
                to={`/${kebabCase(fieldData.lookupResource)}/detail/${val[fieldData.fieldName]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link block w-full"
                title={data[fieldData.fieldName].optionLabel || value}
              >
                <span className={`link block md:truncate md:text-ellipsis`}>
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
      if (fieldData.type === 'multiImageUpload' && val[fieldData.fieldName]) {
        const files = Array.isArray(value) ? value : [];
        if (files.length === 0) return '-';
        return (
          <div className={cn(classes.imageListContainer, 'p-[8.6px_10px] pt-0')}>
            <ImageList className={classes.imageList} cols={2.5}>
              {val[fieldData.fieldName].map((item, i) => (
                <ImageListItem className={classes.imageListItem} key={item}>
                  <img
                    className="cursor-pointer"
                    onClick={() => {
                      setDialogData({ index: i, open: true, title: fieldData.fieldLabel, images: val[fieldData.fieldName] });
                    }}
                    src={item}
                    alt={item}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </div>
        );
      }
      if (fieldData.type === 'fileUpload') {
        const Icon = getFileIconSrc(value || '');
        if (value === '-' || Array.isArray(value)) return value;
        return (
          <div className="flex w-full min-w-0 items-center p-[8.6px_10px] pt-0">
            <Icon className="flex-shrink-0" />
            <Typography title={value === '-' || Array.isArray(value) ? '' : value} className={`${classes.fieldText} flex-grow`} variant="body2">
              <span className={`text-truncate block text-gray-500 dark:text-gray-400`}>{value}</span>
            </Typography>
            <PreviewFile fileName={value} showDownload />
          </div>
        );
      }
      if (fieldData.type === 'multiFileUpload') {
        const files = Array.isArray(value) ? value : [];
        if (files.length > 0) {
          return (
            <div className="w-full min-w-0 space-y-2 p-[8.6px_10px] pt-0">
              {files.map((d) => {
                const Icon = getFileIconSrc(d.fileName || '');
                return (
                  <div className="flex min-w-0 items-center" key={d.fileName}>
                    <Icon className="flex-shrink-0" />
                    <Typography className={`${classes.fieldText} flex-grow`} variant="body2">
                      <span className={`text-truncate block text-gray-500 dark:text-gray-400`}>{d.fileName}</span>
                    </Typography>
                    <PreviewFile fileName={d.fileName} showDownload />
                  </div>
                );
              })}
            </div>
          );
        }
        return (
          <Typography className={classes.fieldText} variant="body2" component={'span'}>
            -
          </Typography>
        );
      }
      if (fieldData.type === 'colorPicker') {
        return (
          <Box display="flex" alignItems="center">
            <Box width={16} height={16} borderRadius={'50%'} bgcolor={value} />
            <Typography variant="body2" className={classes.fieldText}>
              {value}
            </Typography>
          </Box>
        );
      }
      if (fieldData.type === 'signature') {
        return (
          <Box display="flex" alignItems="center">
            <Box
              position="relative"
              sx={{
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
                <img
                  src={value}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const newItem = document.createElement('p');
                    newItem.innerHTML = '--';
                    target.parentNode.replaceChild(newItem, target);
                  }}
                  className="block h-auto max-h-[50px] w-full max-w-[50px] "
                  alt="Signature"
                />
              ) : (
                '-'
              )}
            </Box>
          </Box>
        );
      }
      if (fieldData.type === 'counter') {
        return <NumberCell field={fieldData} rowData={val} enableDilaog={false} />;
      }
      if (fieldData.type === 'groupSignature') {
        return <GroupSignatureCell field={fieldData} original={val} enableDilaog={false} />;
      }
      if (fieldData.type === 'mobileNumber') {
        return (
          <span className="flex items-center">
            {value}
            {value !== '-' ? (
              <span className="!p-0 [&_span.html-custom-tooltip]:!p-0">
                <CopyToClipboardButton text={value} style={{ padding: '1px' }} smallIcon />
              </span>
            ) : null}
          </span>
        );
      }
      if (fieldData.type === 'gpsLocation') {
        return (
          <>
            {value?.locationName ? (
              <Box display="flex" alignItems="center">
                <Typography title={value?.locationName || value} className={cn(classes.fieldText, ' flex items-center')} variant="body2">
                  <span className={`block md:truncate`}>{value?.locationName || value}</span>
                </Typography>
                {value?.longitude && value?.latitude ? (
                  <Box>
                    <HtmlTooltip title="View in Map">
                      <IconButton
                        size="small"
                        aria-label="view-in-map"
                        onClick={() => {
                          setViewMap({
                            open: true,
                            locationName: value?.locationName,
                            longitude: value.longitude,
                            latitude: value.latitude
                          });
                        }}
                      >
                        <LocationOnIcon fontSize="small" color="primary" />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                ) : null}
              </Box>
            ) : (
              <Typography component={'span'} style={{ padding: '7px 10px' }}>
                -
              </Typography>
            )}
          </>
        );
      }
      if (fieldData.type === 'freeStyleMultiSelect') {
        return (
          <div className={cn(classes.fieldText, ' flex !w-full items-center')}>
            <FreeStyleMultiSelect value={value} mode="details" />
          </div>
        );
      }
      return (
        <Typography
          title={value === '-' || Array.isArray(value) ? '' : value}
          className={cn(classes.fieldText, ' flex items-center')}
          variant="body2"
        >
          {fieldData.type === 'url' || fieldData.type === 'email' ? (
            <>
              <MuiLink
                href={fieldData.type === 'email' ? `mailto:${value}` : `https://${value}`}
                target="_blank"
                className="line-clamp-1"
                rel="noopener noreferrer"
              >
                <span className={`text-truncate block`}> {value} </span>
              </MuiLink>
              {fieldData.type === 'email' && value !== '-' ? <CopyToClipboardButton text={value} style={{ padding: '3px' }} smallIcon /> : null}
            </>
          ) : (
            <span className={` block md:truncate`}>{value}</span>
          )}
        </Typography>
      );
    }
  };

  useEffect(() => {
    if (resource && referenceId) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchTaskData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [resource, referenceId]);

  const fetchTaskData = async (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/task?relatedTo=${JSON.stringify([{ type: resource, referenceId: referenceId, access: true }])}`, {
        cancelToken: cancelTokenSource?.token
      })
      .then(({ data: { data } }) => {
        setTaskdata(data);
      });
  };

  useEffect(() => {
    const generateFormDataWithFollowUps = () => {
      if (formsData.length === 0) return [];
      const newFormData = [...formsData];
      if (!taskData || taskData?.length === 0) return newFormData;
      formsData?.forEach((ele) => {
        ele.followUpData = [];
        ele?.sectionFields?.forEach((e) => {
          e.followUpData = [];
        });
      });
      taskData?.forEach((task, i) => {
        const taskName = task.formRelatedTo?.fields?.[0]?.fieldLabel;
        const sectionIndex = newFormData.findIndex((section) => section.name === task.formRelatedTo.section);
        if (sectionIndex !== -1) {
          const fieldIndex = newFormData[sectionIndex].sectionFields.findIndex((field) => field.fieldData.fieldLabel === taskName);
          if (fieldIndex !== -1 && sectionIndex > -1) {
            if (newFormData[sectionIndex].sectionFields[fieldIndex].followUpData) {
              newFormData[sectionIndex].sectionFields[fieldIndex].followUpData.push(taskData[i]);
            } else {
              newFormData[sectionIndex].sectionFields[fieldIndex].followUpData = [taskData[i]];
            }
          }
        }
      });
      return newFormData;
    };
    setFormDataWithFollowUps(generateFormDataWithFollowUps());
    return () => setFormDataWithFollowUps([]);
  }, [formsData, taskData]);

  return (
    <>
      <div className="form-v1">
        {formDataWithFollowUps?.map((form) => {
          if (!isSectionVisible(form, fieldsData, initialVals, true)) return null;
          return (
            form.name && (
              <React.Fragment key={form.name}>
                <div
                  className={`single-form-v1 ${fullHeight && 'full-height-details-from'}`}
                  style={containerPadding ? { padding: containerPadding } : {}}
                >
                  <div className={'form-head-v1'}>
                    <h3 className="form-label-style-v1" title={form.name}>
                      {form.name}
                    </h3>
                    {resource && referenceId && (
                      <HtmlTooltip title="Follow-Ups">
                        <IconButton
                          style={{ padding: '0px' }}
                          size="small"
                          color="primary"
                          aria-label="follow-ups"
                          onClick={() => {
                            setOpen({ open: true, section: { name: form?.name, sectionFields: form?.sectionFields?.map((f) => f?.fieldData) } });
                          }}
                        >
                          <FaUserPlus />
                        </IconButton>
                      </HtmlTooltip>
                    )}
                  </div>
                  <div className="formdata-v1 grid grid-cols-12">
                    {form.sectionFields.map((field, i) => {
                      if (!isFieldVisible(field?.fieldData, fieldsData, initialVals)) return null;
                      return (
                        <div
                          className={cn(
                            `md:${field.fieldData.columnSize ? colSpans[+field.fieldData.columnSize - 1] || 'col-span-6' : columnSize(field.fieldData.type)}`,
                            'col-span-12'
                          )}
                          key={i}
                        >
                          <div
                            className={cn(
                              isTypeFile(field.fieldData.type) && 'flex-wrap',
                              'flex  [border:1px_solid_var(--dark-mode-border-color,_#EDEDED)]'
                            )}
                          >
                            <div className="w-1/2 md:w-[150px] lg:w-[180px] ">
                              <div
                                className={cn('d-flex formdata-title-v1 min-h-full items-center', isTypeFile(field.fieldData.type) && '!border-r-0')}
                              >
                                <h4 title={field.fieldData.fieldLabel} className={`text-truncate ${field.fieldData.isTooltip ? 'pr-1' : ''}`}>
                                  {field.fieldData.fieldLabel}
                                </h4>
                                {field.fieldData.isTooltip && (
                                  <HtmlTooltip title={field.fieldData.tooltipMessage} className="pr-2">
                                    <InfoOutlined style={{ width: 18, height: 18 }} color="disabled" />
                                  </HtmlTooltip>
                                )}
                              </div>
                            </div>

                            <div className={`${isTypeFile(field.fieldData.type) ? 'w-full' : 'md:flex-grow'} w-1/2`}>
                              {field.fieldData.type === 'imageUpload' ? (
                                <Box marginTop={1} marginBottom={4} marginLeft={1.5}>
                                  <span
                                    className={initialVals[field.fieldData.fieldName] ? 'cursor-pointer' : ''}
                                    onClick={() => {
                                      if (initialVals[field.fieldData.fieldName]) {
                                        setDialogData({
                                          index: 0,
                                          title: field.fieldData.fieldLabel,
                                          open: true,
                                          images: [initialVals[field.fieldData.fieldName]]
                                        });
                                      }
                                    }}
                                  >
                                    <Avatar src={initialVals[field.fieldData.fieldName]} style={{ width: 56, height: 56 }}>
                                      <Image style={{ fontSize: 30 }} />
                                    </Avatar>
                                  </span>
                                </Box>
                              ) : (
                                <Box display="flex" alignItems="center" className="formdata-text-v1">
                                  {renderData(initialVals, field.fieldData) === '-' ? (
                                    <span>{renderData(initialVals, field.fieldData)}</span>
                                  ) : (
                                    renderData(initialVals, field.fieldData)
                                  )}
                                </Box>
                              )}
                              {field.followUpData?.length > 0 && (
                                <RenderFollowUP
                                  data={field.followUpData}
                                  columnSize={isTypeFile(field.fieldData.type) ? 12 : field.fieldData.columnSize}
                                  setOpenTask={setOpenTask}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            )
          );
        })}
        {dialogData && dialogData.open && (
          <CarouselDialog index={dialogData.index} {...dialogData} close={() => setDialogData(null)} images={dialogData.images} />
        )}
        {open?.open && (
          <FollowUpsDialog
            onClose={() => {
              setOpen({ open: false, section: null });
            }}
            onSuccess={() => {
              fetchTaskData();
              setOpen({ open: false, section: null });
            }}
            section={open?.section}
            resource={resource}
            referenceId={referenceId}
          />
        )}

        {openTask?.open && (
          <Dialog
            open={true}
            fullScreen={fullScreen}
            TransitionComponent={CustomDialogTransition}
            fullWidth
            maxWidth="md"
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                setOpenTask({ open: false, _id: null });
                setFullScreen(false);
              }
            }}
          >
            <CreateTask
              taskId={openTask?._id}
              relatedTo={[{ type: resource, referenceId: referenceId, access: true }]}
              handleClose={() => {
                setOpenTask({ open: false, _id: null });
                setFullScreen(false);
              }}
              isMinimized={true}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          </Dialog>
        )}
      </div>
      {viewMap?.open && (
        <GoogleMaps
          onClose={() => {
            setViewMap({ open: false, locationName: null, longitude: null, latitude: null });
          }}
          longitude={viewMap.longitude}
          latitude={viewMap.latitude}
          locationName={viewMap.locationName}
        />
      )}
    </>
  );
};

export default Details;

export type FollowUP = {
  _id: string;
  brand: string;
  name: string;
  description: string;
  status: string;
  parentId: null;
  assignee: string[];
  reporter: string;
  startDate: Date;
  dueDate: Date | null;
  relatedTo: RelatedTo[];
  createdBy: CreatedBy;
  position: number;
  formRelatedTo: FormRelatedTo;
};

export type CreatedBy = {
  user: string;
  date: Date;
};

export type FormRelatedTo = {
  section: string;
  fields: Field[];
};

export type Field = {
  fieldLabel: string;
  fieldName: string;
};

export type RelatedTo = {
  type: string;
  referenceId: string;
  name: string;
};

const RenderFollowUP = ({
  data,
  columnSize,
  setOpenTask
}: {
  data: FollowUP[];
  columnSize: 6 | 12;
  setOpenTask: React.Dispatch<React.SetStateAction<any>>;
}) => {
  return (
    <div className="my-2">
      <p className="mx-[10px] pb-1 text-[12px] font-semibold text-gray-500">FOLLOW-UPS</p>
      {data.map((d) => (
        <div
          className={cn(
            `relative mx-[10px] my-2  rounded-md p-2 [border:1px_solid_var(--common-border-color)]`,
            columnSize === 12 ? 'md:w-[calc(50%-20px)]' : ''
          )}
        >
          <div
            className={cn(
              'flex items-start justify-between gap-2 [flex-wrap:wrap] md:flex-nowrap',
              d.description && 'mb-1 pb-1 [border-bottom:1px_solid_var(--common-border-color)]'
            )}
          >
            <p
              className={cn('cursor-pointer text-[14px] font-semibold')}
              onClick={() => {
                setOpenTask({ open: true, _id: d?._id });
              }}
            >
              {d.name}
            </p>
            <span className="block flex-shrink-0 rounded-md bg-[var(--new-theme-color)] px-2 py-1 text-white">{d.status}</span>
          </div>
          {d.description && <p className="py-2 text-gray-600 dark:text-gray-400">{d.description}</p>}
          <span className="block text-[12px] font-bold text-gray-500 dark:text-gray-600">
            Start date: {displayDate(d.startDate)}
            {d.dueDate && <>, Due date: {displayDate(d.dueDate)}</>}
          </span>
        </div>
      ))}
    </div>
  );
};
