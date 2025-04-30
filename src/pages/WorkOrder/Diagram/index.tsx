import { Add, PriorityHigh } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Autocomplete, Box, Collapse, Dialog, IconButton, Popover, TextField, Typography } from '@mui/material';
import { isEmpty } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import emptyIllustration from 'src/assets/emptyIllustration.webp';
import { DownloadIcon, FileCopyIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import AttachmentDeleteButton from 'src/components/AttachmentDeleteButton';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ACTIVITY_RESOURCE, cn, CustomDialogTransition, displayDate, WORK_ORDER_TYPE, workOrder } from 'src/constants/helpers';
import ImageEditor from './ImageEditor';
import PdfEditor from './ShowPdf/PdfEditor';
import { getFileIcon, getFileNameWithExtension } from './utils';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import RippleButton from 'src/components/RippleButton';
import { MdOutlineFileUpload } from 'react-icons/md';

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];

const Diagram = ({
  resource,
  referenceId,
  uniqueId = null,
  stepId = null,
  currentVersion = null,
  resourceData = null,
  disableEdit = false,
  attachmentType = null,
  referenceLabel = '',
  showMaterialFilter = false,
  defaultSelectedUniqueId = null,
  showContainer = true,
  fullHeight = true
}) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: {
      user: { user }
    }
  }: any = useData();

  const [rowData, setRowData] = useState(null);
  const [expended, setExpended] = useState({});
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, file: null, isClone: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [serviceOption, setServiceOption] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteRequestAnchorEl, setDeleteRequestAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (resource === ACTIVITY_RESOURCE.workOrder) {
      fetchServices();
    }
  }, [resource, referenceId]);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId, currentVersion, selectedService, uniqueId]);

  const fetchData = async () => {
    let query = `/attachment/resource-attachment-type?resource=${resource}&referenceId=${referenceId}`;
    if (attachmentType) {
      query = `${query}&attachmentType=${attachmentType}`;
    }
    const serviceId = uniqueId ? uniqueId : selectedService ? selectedService?.uniqueId : null;
    if (serviceId) {
      if (resource === ACTIVITY_RESOURCE.workOrder) {
        query = `${query}&uniqueServiceId=${serviceId}`;
      } else {
        query = `${query}&uniqueId=${serviceId}`;
      }
    }
    if (stepId) {
      query = `${query}&stepId=${stepId}`;
    }
    if (currentVersion) {
      query = `${query}&version=${currentVersion}`;
    }
    axiosInstance()
      .get(query)
      .then(({ data: { data } }) => {
        const expend: any = {};
        setRowData(data);
        data?.forEach((file) => {
          expend[file?._id] = true;
        });
        setExpended(expend);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setRowData([]);
      });
  };

  const fetchServices = async () => {
    const {
      data: { data }
    }: any = await axiosInstance().get(`${workOrder.api}/service/service/${referenceId}`);
    if (data?.length) {
      const serviceData = data?.map((s) => ({
        optionLabel: s?.serviceDetail?.optionLabel,
        optionValue: s?.serviceDetail?.optionValue,
        uniqueId: s?._id
      }));
      setServiceOption(serviceData);
      if (defaultSelectedUniqueId && serviceData?.find((e) => e.uniqueId === defaultSelectedUniqueId)) {
        setSelectedService(serviceData?.find((e) => e.uniqueId === defaultSelectedUniqueId));
      }
    }
  };

  const handleDeleteFile = async (ids) => {
    if (ids?.length) {
      axiosInstance()
        .put('attachment/deletemany', { ids })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSelectedAttachment(null);
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const checkImageType = (memeType) => {
    if (['jpg', 'png', 'jpeg'].includes(memeType)) {
      return true;
    }
    return false;
  };

  const checkpdfType = (memeType) => {
    if (['pdf'].includes(memeType)) {
      return true;
    }
    return false;
  };

  const downloadExcel = (file) => {
    axiosInstance()
      .get(`user/download?fileName=${encodeURIComponent(file?.url)}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file?.url);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const ShowOtherFiles = ({ data }) => {
    const FileIcon = getFileIcon(data.url);
    return (
      <div className="inset-0 flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <FileIcon size={150} className="text-center" />
          <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(data)}</p>
          <ThemeButton
            buttonType="theme"
            onClick={() => {
              downloadExcel(data);
            }}
            endIcon={<DownloadIcon />}
          >
            Download
          </ThemeButton>
        </div>
      </div>
    );
  };

  const getRelatedTo = () => {
    const relatedTo: any = [
      {
        type: resource,
        referenceId: referenceId,
        ...(uniqueId ? { uniqueId: uniqueId } : {}),
        ...(currentVersion ? { version: currentVersion } : {}),
        access: true
      }
    ];

    if (resource === ACTIVITY_RESOURCE.workOrder && resourceData) {
      relatedTo.push({
        type:
          resourceData?.type === WORK_ORDER_TYPE.repairOrder
            ? ACTIVITY_RESOURCE.repairOrder
            : resourceData?.type === WORK_ORDER_TYPE.productionOrder
              ? ACTIVITY_RESOURCE.productionOrder
              : ACTIVITY_RESOURCE.assemblyOrder,
        referenceId:
          resourceData?.type === WORK_ORDER_TYPE.repairOrder
            ? resourceData?.repairOrder?.optionValue || resourceData?.repairOrder
            : resourceData?.type === WORK_ORDER_TYPE.productionOrder
              ? resourceData?.productionOrder?.optionValue || resourceData?.productionOrder
              : resourceData?.assemblyOrder?.optionValue || resourceData?.assemblyOrder,
        access: true
      });
    }

    return relatedTo;
  };

  const customhandleAdd = (request, setLoading) => {
    const serviceId = selectedService ? selectedService?.uniqueId : uniqueId;
    const serviceName = selectedService ? selectedService?.optionLabel : referenceLabel;
    const data: any = {
      name: request?.name,
      attachmentType: request?.attachmentType,
      file: request?.file,
      workOrderId: referenceId,
      serviceName: serviceName,
      ...(serviceId && { uniqueServiceId: serviceId }),
      ...(stepId && { stepId: stepId })
    };
    axiosInstance()
      .post(`${workOrder.api}/step/attachment`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setAttachemntDialog({ open: false, file: null, isClone: false });
        setFullScreen(false);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleRequestReject = (id) => {
    axiosInstance()
      .put('/attachment/delete-request', { _id: id, type: 'cancel' })
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box>
      <Box className={cn(showContainer ? 'container-with-border p-[20px]' : '')}>
        {!disableEdit && (
          <div className={`flex items-center ${resource === ACTIVITY_RESOURCE.workOrder && showMaterialFilter ? 'justify-between' : 'justify-end'}`}>
            {resource === ACTIVITY_RESOURCE.workOrder && showMaterialFilter && (
              <Autocomplete
                fullWidth
                className="max-w-[250px]"
                options={serviceOption}
                getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                isOptionEqualToValue={(option: any, val) => option.uniqueId === val}
                value={selectedService}
                onChange={(e, val) => {
                  setSelectedService(val);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    size="small"
                    name="service"
                    placeholder={'Service'}
                    label={'Service'}
                    variant="outlined"
                    fullWidth
                    className="m-0"
                  />
                )}
              />
            )}
            {!Array.isArray(rowData) && (
              <Box className="mb-2 ml-2 flex flex-wrap items-center justify-between gap-2 min-[600px]:justify-end">
                <ThemeButton
                  buttonType="theme"
                  onClick={() => {
                    setAttachemntDialog({ open: true, file: null, isClone: false });
                  }}
                  iconForMobile={<Add />}
                  mobileTooltip="Add"
                >
                  <Add /> Add
                </ThemeButton>
              </Box>
            )}
          </div>
        )}
        <Box pt={2} pb={2}>
          <Box className={cn('overflow-auto', fullHeight ? 'h-[calc(100vh-300px)] ' : '')}>
            <div className="grid gap-3">
              {!rowData && (
                <div className="flex h-full items-center justify-center">
                  <CommonSkeleton />
                </div>
              )}
              {rowData?.length > 0 &&
                rowData?.map((file, index) => {
                  return (
                    <div key={file._id} className="rounded-md border shadow-[0px_17.7266px_35.4532px_rgba(0,_0,_0,_0.03)]">
                      <div
                        className={`head relative isolate flex w-full cursor-pointer items-center justify-between p-[8px_15px] ${
                          expended[file?._id]
                            ? 'rounded-[4px_4px_0_0] bg-[var(--accordion-expanded-summary-bg,_#f1f5ff)]'
                            : 'rounded-[4px] bg-[var(--accordion-summary-bg,#fff)]'
                        }`}
                      >
                        <button
                          className="absolute inset-0 -z-[1] cursor-pointer rounded-md border-none bg-transparent focus:outline-none focus-visible:[box-shadow:inset_0px_0px_0px_2px_var(--new-theme-color)]"
                          onClick={() => {
                            setExpended((prev) => ({
                              ...prev,
                              [file?._id]: expended[file?._id] ? false : true
                            }));
                          }}
                        />

                        <div className="flex items-center">
                          <span className="p-1">
                            <KeyboardArrowRight
                              className={cn('origin-center !transition-all duration-300', expended[file?._id] && '[transform:rotate(90deg)]')}
                            />
                          </span>
                          <Box>
                            <Typography style={{ fontWeight: 600 }} className=" break-all" title={file?.name}>
                              {file?.name}
                            </Typography>
                          </Box>
                        </div>
                        <div className="flex gap-2">
                          <HtmlTooltip
                            title={
                              <div className="flex flex-col p-2">
                                <p>
                                  Uploaded By: <span>{file?.createdBy?.user?.concatedName}</span>
                                </p>
                                <p>
                                  Uploaded Date: <span>{displayDate(file?.createdBy?.date)}</span>
                                </p>
                              </div>
                            }
                          >
                            <IconButton size="small" color="inherit">
                              <InfoIcon fontSize="small" color="primary" />
                            </IconButton>
                          </HtmlTooltip>
                          {!disableEdit && (
                            <>
                              <HtmlTooltip title="Edit" placement="top" arrow>
                                <IconButton
                                  size="small"
                                  color="inherit"
                                  aria-label="edit"
                                  disabled={!file?.canEdit}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachemntDialog({ open: true, file: file, isClone: false });
                                  }}
                                >
                                  <EditIcon fontSize="small" color="primary" />
                                </IconButton>
                              </HtmlTooltip>
                              <HtmlTooltip title="Clone" placement="top" arrow>
                                <IconButton
                                  size="small"
                                  color="inherit"
                                  aria-label="clone"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachemntDialog({ open: true, file: file, isClone: true });
                                  }}
                                >
                                  <FileCopyIcon fontSize="small" color="primary" />
                                </IconButton>
                              </HtmlTooltip>
                              <AttachmentDeleteButton
                                attachment={file}
                                onSuccess={() => {
                                  setSelectedAttachment(null);
                                  fetchData();
                                }}
                              />
                              {!isEmpty(file?.deleteRequest) && file?.createdBy?.user?._id === user?._id && (
                                <div className="flex gap-2">
                                  <span className="relative">
                                    <span className="absolute right-[3px] top-[3px] flex size-[5px] items-center justify-center rounded-full bg-red-500">
                                      <span className="size-2 flex-shrink-0 animate-ping rounded-full bg-red-500/70"></span>
                                    </span>
                                    <HtmlTooltip title="Delete Request">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setDeleteRequestAnchorEl(e.currentTarget);
                                        }}
                                      >
                                        <PriorityHigh fontSize="small" />
                                      </IconButton>
                                    </HtmlTooltip>
                                  </span>
                                  <Popover
                                    open={!!deleteRequestAnchorEl}
                                    onClose={() => setDeleteRequestAnchorEl(null)}
                                    anchorEl={deleteRequestAnchorEl}
                                    anchorOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'right'
                                    }}
                                    transformOrigin={{
                                      vertical: 'top',
                                      horizontal: 'right'
                                    }}
                                  >
                                    <div className="w-[290px] p-3">
                                      <p className="mb-2 border-b pb-1 font-semibold">Delete Request</p>
                                      <p className="mb-2 text-xs">
                                        A deletion request was submitted by&nbsp;
                                        <span className="rounded-md bg-gray-100 px-1 py-[0px] font-semibold dark:bg-gray-600">
                                          {file?.deleteRequest?.user?.concatedName}
                                        </span>{' '}
                                        on&nbsp;
                                        {displayDate(file?.deleteRequest?.date)}
                                      </p>
                                      <p className="mb-1 max-w-[200px] text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        Reason: <span className="font-normal">{file?.deleteRequest?.comment}</span>
                                      </p>
                                      <div className="mt-2 flex  gap-2 border-t pt-2">
                                        <ThemeButton
                                          buttonType="theme"
                                          onClick={() => {
                                            handleDeleteFile([file._id]);
                                          }}
                                        >
                                          Approve
                                        </ThemeButton>
                                        <ThemeButton
                                          buttonType="red"
                                          onClick={() => {
                                            handleRequestReject(file._id);
                                          }}
                                        >
                                          Reject
                                        </ThemeButton>
                                      </div>
                                    </div>
                                  </Popover>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <Collapse in={expended[file?._id]}>
                        <div className="border-t ">
                          {file?.file?.map((f) => {
                            const Icon = getFileIcon(f.url);
                            const extension = f.url?.split('.').pop();
                            return (
                              <Box
                                key={f.url}
                                className={'cursor-pointer [--px:18px] [--py:8px]'}
                                onClick={() => {
                                  setSelectedAttachment({ ...f, attachmentId: file?._id });
                                }}
                                style={{
                                  border:
                                    selectedAttachment?.url === f?.url
                                      ? '1px solid var(--dark-active-border-color,#0F9FA9 )'
                                      : '1px solid transparent',
                                  borderBottomColor:
                                    selectedAttachment?.url === f?.url ? 'var(--dark-active-border-color,#0F9FA9 )' : 'var(--common-border-color)'
                                }}
                              >
                                <div className="flex max-w-fit cursor-pointer items-center gap-2 px-[--px] py-[--py]">
                                  <div className="w-[20px]">
                                    <Icon size={20} />
                                  </div>
                                  <HtmlTooltip title={f.name} className="max-w-fit">
                                    <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(f)}</p>
                                  </HtmlTooltip>
                                </div>

                                {imageExtensions.includes(extension) && <ImagePreview name={f.name} url={f.url} />}
                              </Box>
                            );
                          })}
                        </div>
                      </Collapse>
                    </div>
                  );
                })}
              {rowData?.length === 0 && (
                <div className="mx-auto mt-4 h-full w-full max-w-[450px] rounded-md  border-2 border-dashed bg-transparent text-center">
                  <img src={emptyIllustration} alt="empty" className="mx-auto mb-2 max-w-[250px] opacity-60" loading="lazy" />
                  {/* <MdOutlineFileUpload size={40} className="mx-auto my-5 block text-gray-500" /> */}
                  <span className="mx-auto block">
                    <ThemeButton
                      buttonType="theme"
                      iconForMobile={<Add />}
                      mobileTooltip="Add"
                      onClick={() => {
                        setAttachemntDialog({ open: true, file: null, isClone: false });
                      }}
                    >
                      <Add /> Add
                    </ThemeButton>
                  </span>
                  <p className="py-5 text-center text-gray-500">Click to Add to upload files</p>
                </div>
              )}
            </div>
          </Box>
        </Box>
      </Box>
      {selectedAttachment && (
        <Dialog
          open={true}
          fullScreen={true}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setSelectedAttachment(null);
            }
          }}
          fullWidth
          disableEnforceFocus={true}
        >
          {!checkImageType(selectedAttachment?.url?.split('.')[1]) && !checkpdfType(selectedAttachment?.url?.split('.')[1]) && (
            <CustomDialogHeader
              title={selectedAttachment?.name}
              showManimizeMaximize={false}
              showRequiredLabel={false}
              onClose={() => {
                setSelectedAttachment(null);
              }}
            />
          )}
          <CustomDialogContent isFooterPresent={false} className={cn(!disableEdit ? 'px-0 py-0' : 'px-4 py-3')}>
            {checkImageType(selectedAttachment?.url?.split('.')[1]) ? (
              <ImageEditor
                data={selectedAttachment}
                fetchData={fetchData}
                setSelectedAttachment={setSelectedAttachment}
                handleClose={() => setSelectedAttachment(null)}
              />
            ) : checkpdfType(selectedAttachment?.url?.split('.')[1]) ? (
              <PdfEditor
                data={selectedAttachment}
                fetchData={fetchData}
                setSelectedAttachment={setSelectedAttachment}
                handleClose={() => setSelectedAttachment(null)}
              />
            ) : (
              <ShowOtherFiles data={selectedAttachment} key={selectedAttachment.url} />
            )}
          </CustomDialogContent>
        </Dialog>
      )}
      {attachemntDialog.open && (
        <Dialog
          open={true}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setAttachemntDialog({ open: false, file: null, isClone: false });
            }
            setFullScreen(false);
          }}
          fullWidth
        >
          <ManageAttachment
            attachmentId={attachemntDialog.file?._id}
            isClone={attachemntDialog.isClone}
            handleClose={() => {
              setAttachemntDialog({ open: false, file: null, isClone: false });
              setFullScreen(false);
            }}
            relatedTo={getRelatedTo()}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            fetchData={fetchData}
            attachmentType={attachmentType}
            customhandleAdd={resource === ACTIVITY_RESOURCE.workOrder && !attachemntDialog.file && !showMaterialFilter ? customhandleAdd : null}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default Diagram;

type ImagePreviewProps = {
  name: string;
  url: string;
};

const ImagePreview = ({ name, url }: ImagePreviewProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [src, setSrc] = useState(null);
  const [progress, setProgress] = useState(-1);

  const viewFile = useCallback(async (): Promise<any> => {
    try {
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(url)}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
          if (percentCompleted === 100) {
            setTimeout(() => {
              setProgress(-1);
            }, 100);
          }
        }
      });
      setSrc(URL.createObjectURL(new Blob([data])));
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }, [toastConfig, url]);

  useEffect(() => {
    viewFile();
  }, [url]);

  return (
    <div className="mb-[--py] flex h-[500px]  max-w-fit items-center justify-center overflow-hidden px-[--px]">
      {src ? <img src={src} alt={name} className="mr-auto max-h-full max-w-full" /> : <p>Loading...{progress >= 0 ? progress : 0}%</p>}
    </div>
  );
};
