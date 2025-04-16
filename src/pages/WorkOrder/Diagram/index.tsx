import { Autocomplete, Box, Collapse, Dialog, IconButton, TextField, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import ShowPdf from './ShowPdf';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DownloadIcon, FileCopyIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { ACTIVITY_RESOURCE, cn, CustomDialogTransition, WORK_ORDER_TYPE, workOrder } from 'src/constants/helpers';
import PdfPreview from './ShowPdf/PdfPreview';
import { getFileIcon, getFileNameWithExtension } from './utils';
import emptyIllustration from 'src/assets/emptyIllustration.webp';
import ImageEditor from './ImageEditor';

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

  const [rowData, setRowData] = useState(null);
  const [expended, setExpended] = useState({});
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, id: null, isClone: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [serviceOption, setServiceOption] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (resource === ACTIVITY_RESOURCE.workOrder) {
      fetchServices();
    }
  }, [resource, referenceId]);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId, currentVersion, selectedService]);

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
        setAttachemntDialog({ open: false, id: null, isClone: false });
        setFullScreen(false);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const isSelectedAttachmentImage = checkImageType(selectedAttachment?.url?.split('.')[1]);

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
            <Box className="mb-2 ml-2 flex flex-wrap items-center justify-between gap-2 min-[600px]:justify-end">
              <ThemeButton
                buttonType="theme"
                onClick={() => {
                  setAttachemntDialog({ open: true, id: null, isClone: false });
                }}
                iconForMobile={<Add />}
                mobileTooltip="Add"
              >
                <Add /> Add
              </ThemeButton>
            </Box>
          </div>
        )}
        <Box pt={2} pb={2}>
          <Box className={cn('overflow-auto', fullHeight ? 'h-[calc(100vh-300px)] ' : '')}>
            <div className="grid gap-3">
              {rowData && rowData.length > 0 ? (
                rowData?.map((file, index) => {
                  return (
                    <div key={file._id} className="rounded-md border shadow-[0px_17.7266px_35.4532px_rgba(0,_0,_0,_0.03)]">
                      <div
                        className={`head flex w-full cursor-pointer items-center justify-between p-[8px_15px] ${
                          expended[file?._id]
                            ? 'rounded-[4px_4px_0_0] bg-[var(--accordion-expanded-summary-bg,_#f1f5ff)]'
                            : 'rounded-[4px] bg-[var(--accordion-summary-bg,#fff)]'
                        }`}
                        onClick={() => {
                          setExpended((prev) => ({
                            ...prev,
                            [file?._id]: expended[file?._id] ? false : true
                          }));
                        }}
                      >
                        <div className="flex items-center">
                          <span className="p-1">{expended[file?._id] ? <ExpandMoreIcon /> : <KeyboardArrowRight />}</span>
                          <Box ml={2}>
                            <Typography style={{ fontWeight: 600 }} className=" break-all" title={file?.name}>
                              {file?.name}
                            </Typography>
                          </Box>
                        </div>
                        {!disableEdit && (
                          <div className="flex gap-2">
                            <HtmlTooltip title="Edit" placement="top" arrow>
                              <IconButton
                                size="small"
                                color="inherit"
                                aria-label="edit"
                                disabled={!file?.canEdit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAttachemntDialog({ open: true, id: file?._id, isClone: false });
                                }}
                              >
                                <EditIcon style={{ fontSize: '18px' }} />
                              </IconButton>
                            </HtmlTooltip>
                            <HtmlTooltip title="Clone" placement="top" arrow>
                              <IconButton
                                size="small"
                                color="inherit"
                                aria-label="clone"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAttachemntDialog({ open: true, id: file?._id, isClone: true });
                                }}
                              >
                                <FileCopyIcon style={{ fontSize: '18px' }} />
                              </IconButton>
                            </HtmlTooltip>
                            <HtmlTooltip title="Delete" placement="top" arrow>
                              <IconButton
                                size="small"
                                color="inherit"
                                style={{ color: 'red' }}
                                aria-label="delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(file);
                                  setShowConfirmBox(true);
                                }}
                              >
                                <Delete style={{ fontSize: '18px' }} />
                              </IconButton>
                            </HtmlTooltip>
                          </div>
                        )}
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
                })
              ) : (
                <>
                  <img src={emptyIllustration} alt="empty" className="mx-auto mb-2 w-[250px] opacity-60" loading="lazy" />
                </>
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
          {!isSelectedAttachmentImage && disableEdit && (
            <CustomDialogHeader
              title={selectedAttachment?.name}
              showManimizeMaximize={false}
              showRequiredLabel={false}
              onClose={() => {
                setSelectedAttachment(null);
              }}
            />
          )}
          <CustomDialogContent isFooterPresent={false} className={cn(isSelectedAttachmentImage && !disableEdit ? 'px-0 py-0' : 'px-4 py-3')}>
            {isSelectedAttachmentImage ? (
              disableEdit ? (
                <ShowPdf data={selectedAttachment} />
              ) : (
                <ImageEditor
                  fileName={selectedAttachment?.name}
                  data={selectedAttachment}
                  fetchData={fetchData}
                  setSelectedAttachment={setSelectedAttachment}
                  handleClose={() => setSelectedAttachment(null)}
                />
              )
            ) : checkpdfType(selectedAttachment?.url?.split('.')[1]) ? (
              disableEdit ? (
                <ShowPdf data={selectedAttachment} />
              ) : (
                <PdfPreview data={selectedAttachment} fetchData={fetchData} setSelectedAttachment={setSelectedAttachment} />
              )
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
              setAttachemntDialog({ open: false, id: null, isClone: false });
            }
            setFullScreen(false);
          }}
          fullWidth
        >
          <ManageAttachment
            attachmentId={attachemntDialog.id}
            isClone={attachemntDialog.isClone}
            handleClose={() => {
              setAttachemntDialog({ open: false, id: null, isClone: false });
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
            customhandleAdd={resource === ACTIVITY_RESOURCE.workOrder && !attachemntDialog.id && !showMaterialFilter ? customhandleAdd : null}
          />
        </Dialog>
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedFile?.name}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={() => {
            handleDeleteFile([selectedFile._id]);
            setShowConfirmBox(false);
          }}
        />
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
