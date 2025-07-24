import { Add, KeyboardArrowDown } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Collapse, Dialog, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material';
import { isEmpty } from 'lodash';
import mime from 'mime';
import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CiFileOn } from 'react-icons/ci';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { DownloadIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import AttachmentDeleteButton from 'src/components/Activity/Attachments/AttachmentDeleteButton';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ActionButtonWithMenu from 'src/components/PageHeaders/ActionButtonWithMenu';
import {
  ACTIVITY_RESOURCE,
  checkImageUrl,
  checkSuperAdminAccess,
  cn,
  CustomDialogTransition,
  sidebarResource,
  WORK_ORDER_TYPE,
  workOrder
} from 'src/constants/helpers';
import AccordionButtons from 'src/pages/WorkOrder/Diagram/AccordionButtons';
import RenderSingleFile from 'src/pages/WorkOrder/Diagram/RenderSingleFile';
import ImageEditor from './ImageEditor';
import PdfEditor from './ShowPdf/PdfEditor';
import { getFileIcon, getFileNameWithExtension } from './utils';

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
  fullHeight = true,
  height = ''
}) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();
  const [rowData, setRowData] = useState(null);
  const [expended, setExpended] = useState({});
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, file: null, isClone: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [serviceOption, setServiceOption] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [sendMail, setSendMail] = useState(false);
  const [emailAttachment, setEmailAttachment] = useState(null);
  const [isEmailAttachmentLoading, setIsEmailAttachmentLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);

  console.log(selectedAttachment, 'selectedAttachment');

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
        setRowData(data);
        setExpended((prev) => {
          const expend: any = {};
          data?.forEach((file, index) => {
            if (prev[file?._id] === true || prev[file._id] === false) {
              expend[file?._id] = prev[file?._id];
            } else {
              expend[file?._id] = index === 0 ? true : false;
            }
          });
          return expend;
        });
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
    let serviceId = selectedService ? selectedService?.uniqueId : uniqueId;
    let tempStepId = stepId
    const serviceName = selectedService ? selectedService?.optionLabel : referenceLabel;
    if (attachemntDialog?.isClone) {
      const cloneRelatedTo = attachemntDialog?.file?.relatedTo?.find((e) => e.type === ACTIVITY_RESOURCE.workOrder)
      if (cloneRelatedTo?.uniqueServiceId) {
        serviceId = cloneRelatedTo?.uniqueServiceId
      }
      if (cloneRelatedTo?.stepId) {
        tempStepId = cloneRelatedTo?.stepId
      }
    }
    const data: any = {
      name: request?.name,
      attachmentType: request?.attachmentType,
      file: request?.file,
      workOrderId: referenceId,
      serviceName: serviceName,
      ...(serviceId && { uniqueServiceId: serviceId }),
      ...(tempStepId && { stepId: tempStepId })
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

  const downloadZip = (_id, name) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `Downloading, Please wait...`
    });
    axiosInstance()
      .get(`attachment/zip/file/${_id}`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name ? `${name}.zip` : 'download.zip');
        document.body.appendChild(link);
        link.click();
        toastConfig.setToastConfig({
          message: 'Downloaded Successfully',
          open: true,
          type: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleMail = async (data) => {
    const attachments: any = [];
    setIsEmailAttachmentLoading(true);
    try {
      await Promise.all(
        data?.file.map(async (file) => {
          try {
            const response = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(file?.url)}`, { responseType: 'blob' });
            const data = response.data;

            let reader = new FileReader();
            reader.readAsDataURL(new Blob([data], { type: mime.getType(file.url.split('.')?.pop()) }));

            await new Promise<void>((resolve) => {
              reader.onloadend = function () {
                let base64data: any = reader.result;
                attachments.push({
                  base64: base64data.substring(base64data.indexOf(',') + 1),
                  contentType: base64data.split(';')[0].split(':')[1],
                  extension: `.${file.url.split('.')?.pop()}`,
                  name: file.name
                });
                resolve();
              };
            });
          } catch (err) {
            toastConfig.setToastConfig(err);
          }
        })
      );
      setEmailAttachment(attachments);
      setIsEmailAttachmentLoading(false);
    } catch (err) {
      toastConfig.setToastConfig(err);
      setIsEmailAttachmentLoading(false);
    }
  };

  const toggleAccordion = (file) => {
    setExpended((prev) => ({
      ...prev,
      [file?._id]: expended[file?._id] ? false : true
    }));
  };

  const toggleSelectAll = () => {
    setSelectedFiles((prev) => {
      if (prev.length === rowData?.length) {
        return [];
      }
      return rowData?.map((file) => file);
    });
  };

  const handleSelectFile = (file) => {
    setSelectedFiles((prev) => {
      const index = prev.findIndex((f) => f?._id === file?._id);
      if (index !== -1) {
        return prev.filter((_, i) => i !== index);
      }
      return [...prev, file];
    });
  };

  const isAllSelected = selectedFiles?.length === rowData?.length;
  const isFileSelected = (file) => selectedFiles?.some((f) => f?._id === file?._id);

  return (
    <Box>
      <Box className={cn(showContainer ? 'container-with-border p-[20px]' : '')}>
        {!disableEdit && (
          <div className={`flex flex-wrap items-center justify-between gap-2`}>
            {rowData?.length > 0 && (
              <FormControlLabel
                control={<Checkbox checked={isAllSelected} size="small" onChange={toggleSelectAll} />}
                label={<span className="font-semibold">Select All</span>}
                sx={{ ml: '16px' }}
              />
            )}
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
            <div className="ml-auto flex items-center gap-2">
              {rowData?.length > 0 && (
                <>
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
                  <ActionButtonWithMenu
                    disabled={
                      selectedFiles?.length === 0 ||
                      selectedFiles?.find((e) =>
                        !isEmpty(e?.deleteRequest) ||
                          (!checkSuperAdminAccess(user, sidebarResource.attachment) &&
                            !selectedFiles?.every((e) => e?.createdBy?.user?._id === user?.user?._id) &&
                            !selectedFiles?.every((e) => e?.createdBy?.user?._id !== user?.user?._id))
                          ? true
                          : false
                      )
                    }
                    actionMenuItems={
                      <>
                        <AttachmentDeleteButton
                          attachments={selectedFiles}
                          onSuccess={() => {
                            setSelectedFiles(null);
                            setSelectedFiles([]);
                            fetchData();
                          }}
                          element={MenuItem}
                        >
                          {!checkSuperAdminAccess(user, sidebarResource.attachment) &&
                            selectedFiles?.every((e) => e?.createdBy?.user?._id !== user?.user?._id)
                            ? `Delete Request`
                            : `Delete`}
                        </AttachmentDeleteButton>
                      </>
                    }
                  />
                </>
              )}
            </div>
          </div>
        )}
        <Box pt={2} pb={2}>
          <Box style={{ height }} className={cn('overflow-auto', fullHeight ? 'h-[calc(100vh-300px)] ' : '')}>
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
                        className={`head relative isolate flex w-full cursor-pointer items-center justify-between p-[8px_15px] ${expended[file?._id]
                          ? 'rounded-[4px_4px_0_0] bg-[var(--accordion-expanded-summary-bg,_#f1f5ff)]'
                          : 'rounded-[4px] bg-[var(--accordion-summary-bg,#fff)]'
                          }`}
                      >
                        <button
                          title={file?.name}
                          className="absolute inset-0 -z-[1] cursor-pointer rounded-md border-none bg-transparent focus:outline-none focus-visible:[box-shadow:inset_0px_0px_0px_2px_var(--new-theme-color)]"
                          onClick={() => {
                            toggleAccordion(file);
                          }}
                        />
                        <div className="pointer-events-none flex items-center">
                          <div className="pointer-events-auto">
                            <Checkbox size="small" checked={isFileSelected(file)} onChange={() => handleSelectFile(file)} />
                          </div>
                          <Typography style={{ fontWeight: 600 }} className="line-clamp-1 break-all" title={file?.name}>
                            {file?.name}
                          </Typography>
                        </div>

                        <div className="pointer-events-none flex items-center gap-1">
                          <AccordionButtons
                            disableEdit={disableEdit}
                            downloadZip={downloadZip}
                            fetchData={fetchData}
                            file={file}
                            handleMail={handleMail}
                            setAttachemntDialog={setAttachemntDialog}
                            setSelectedAttachment={setSelectedAttachment}
                            setSendMail={setSendMail}
                          />
                          <span className="pointer-events-none p-1">
                            <KeyboardArrowDown
                              className={cn('origin-center !transition-all duration-300', expended[file?._id] && '[transform:rotate(-180deg)]')}
                            />
                          </span>
                        </div>
                      </div>
                      <Collapse in={expended[file?._id]}>
                        <div className="border-t ">
                          {file?.file?.map((f, index) => {
                            return (
                              <RenderSingleFile
                                key={index}
                                f={f}
                                file={file}
                                handleMail={handleMail}
                                selectedAttachment={selectedAttachment}
                                setSelectedAttachment={setSelectedAttachment}
                                setSendMail={setSendMail}
                              />
                            );
                          })}
                        </div>
                      </Collapse>
                    </div>
                  );
                })}
              {rowData?.length === 0 && (
                <div className="mx-auto mt-4 h-full w-full rounded-md  border-2 border-dashed bg-transparent text-center">
                  <CiFileOn size={100} className="mx-auto mt-5 block select-none text-gray-400 dark:text-gray-500" />
                  <p className="mb-5 select-none text-sm text-gray-400 dark:text-gray-500">No files uploaded</p>
                  <span className="mx-auto block">
                    <ThemeButton
                      buttonType="theme"
                      startIcon={<Add />}
                      onClick={() => {
                        setAttachemntDialog({ open: true, file: null, isClone: false });
                      }}
                    >
                      Add
                    </ThemeButton>
                  </span>
                  <p className="mb-5 mt-2 text-center text-sm text-gray-500 dark:text-gray-300">Click Add to upload files</p>
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
          {!checkImageUrl(selectedAttachment?.url) && !checkpdfType(selectedAttachment?.url?.split('.')[1]) && (
            <CustomDialogHeader
              title={selectedAttachment?.name}
              showManimizeMaximize={false}
              showRequiredLabel={false}
              onClose={() => {
                setSelectedAttachment(null);
              }}
            />
          )}
          <CustomDialogContent
            isFooterPresent={false}
            shouldApplyHeight={!checkImageUrl(selectedAttachment?.url)}
            className={cn(!disableEdit ? 'px-0 py-0' : 'px-4 py-3')}
          >
            {checkImageUrl(selectedAttachment?.url) ? (
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
            customhandleAdd={resource === ACTIVITY_RESOURCE.workOrder && (attachemntDialog.isClone || !attachemntDialog.file) && !showMaterialFilter ? customhandleAdd : null}
          />
        </Dialog>
      )}
      {sendMail && (
        <Dialog
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          open={sendMail}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={() => {
            setSendMail(false);
            setFullScreen(false);
          }}
          disableEnforceFocus={true}
          fullWidth
        >
          <CreateEmail
            emailId={null}
            subject={referenceLabel}
            relatedTo={[
              {
                type: resource,
                referenceId: referenceId,
                access: true
              }
            ]}
            handleClose={() => {
              setSendMail(false);
              setFullScreen(false);
              setIsEmailAttachmentLoading(false);
            }}
            fetchData={() => {
              setSendMail(false);
              setFullScreen(false);
              setIsEmailAttachmentLoading(false);
            }}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            isMinimized={!fullScreen}
            showManimizeMaximize={true}
            qouteBuilderAttachments={emailAttachment}
            isQuoteBuilder={true}
            isAttachmentLoading={isEmailAttachmentLoading}
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
