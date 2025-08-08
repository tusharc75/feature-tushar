import { Add, KeyboardArrowDown } from "@mui/icons-material";
import { Autocomplete, Box, Collapse, Dialog, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Popover, TextField } from "@mui/material";
import { camelCase, isEmpty } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { CiFileOn } from "react-icons/ci";
import axiosInstance from "src/axios/axiosInstance";
import { allAttachmentsAreFromUser, getTitle, sortFileStructure, TNestedTree, unflatten } from "src/components/Activity/AttachmentsNew/helper";
import ManageFile from "src/components/Activity/AttachmentsNew/ManageFile";
import ManageFolder from "src/components/Activity/AttachmentsNew/ManageFolder";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { ThemeButton } from "src/components/Helpers/Buttons";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { checkImageUrl, cn, CustomDialogTransition, sidebarResource, WORK_ORDER_TYPE, workOrder } from "src/constants/helpers";
import { getFileIcon, getFileNameWithExtension } from "src/pages/WorkOrder/Diagram/utils";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import GetAppIcon from '@mui/icons-material/GetApp';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import { CreateEmail } from "src/components/Activity/Email/CreateEmail";
import mime from 'mime';
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import ImageEditor from './ImageEditor/ImageEditorNew'
import PdfEditor from './ShowPdfNew/PdfEditor'
import { FolderIcon } from "src/assets/FolderIcon"
import AttachmentDelete from "src/components/Activity/AttachmentsNew/AttachmentDelete";
import DeleteRequest, { DeleteRequestIcon } from "src/components/Activity/AttachmentsNew/DeleteRequest";

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];

const DiagramNew = ({
  resource,
  referenceId,
  resourceLabel,
  referenceLabel = '',
  resourceData = null,
  uniqueId = null,
  stepId = null,
  currentVersion = null,
  disableEdit = false,
  attachmentType = null,
  showMaterialFilter = false,
  defaultSelectedUniqueId = null,
  showContainer = true,
  fullHeight = true,
  height = ''
}) => {

  const toastConfig = useContext(CustomToastContext);

  const [treeStructure, setTreeStructure] = useState<TNestedTree[] | null>(null);
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, type: '', data: null, isUpdate: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [serviceOption, setServiceOption] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sendMail, setSendMail] = useState(false);
  const [emailAttachment, setEmailAttachment] = useState(null);
  const [isEmailAttachmentLoading, setIsEmailAttachmentLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDelete, setOpenDelete] = useState({ open: false, request: false, attachment: null })
  const [openDeleteRequest, setOpenDeleteRequest] = useState({ ancherEl: null, attachment: null })

  useEffect(() => {
    if (resource === sidebarResource.workOrder) {
      fetchServices();
    }
  }, [resource, referenceId]);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId, currentVersion, selectedService, uniqueId]);

  const fetchData = async () => {
    let query = `/attachment-new/?resource=${resource}&referenceId=${referenceId}`;
    if (attachmentType) {
      query = `${query}&attachmentType=${attachmentType}`;
    }
    const serviceId = uniqueId ? uniqueId : selectedService ? selectedService?.uniqueId : null;
    if (serviceId) {
      query = `${query}&uniqueId=${serviceId}`;
    }
    if (stepId) {
      query = `${query}&stepId=${stepId}`;
    }
    if (currentVersion) {
      query = `${query}&version=${currentVersion}`;
    }
    axiosInstance()
      .get(query)
      .then(({ data: { data: { data } } }) => {
        setTreeStructure(data?.length > 0 ? unflatten(data) : [])
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setTreeStructure([])
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

  const getRelatedTo = () => {
    const relatedTo: any = [
      {
        resource: resource,
        referenceId: referenceId,
        label: resourceLabel,
        ...(uniqueId ? { uniqueId: uniqueId } : {}),
        ...(stepId ? { stepId: stepId } : {}),
        ...(currentVersion ? { version: parseInt(currentVersion) } : {}),
      }
    ];

    if (resource === sidebarResource.workOrder && resourceData) {
      relatedTo.push({
        resource:
          resourceData?.type === WORK_ORDER_TYPE.repairOrder
            ? sidebarResource.repairOrder
            : resourceData?.type === WORK_ORDER_TYPE.productionOrder
              ? sidebarResource.productionOrder
              : sidebarResource.assemblyOrder,
        referenceId:
          resourceData?.type === WORK_ORDER_TYPE.repairOrder
            ? resourceData?.repairOrder?.optionValue || resourceData?.repairOrder
            : resourceData?.type === WORK_ORDER_TYPE.productionOrder
              ? resourceData?.productionOrder?.optionValue || resourceData?.productionOrder
              : resourceData?.assemblyOrder?.optionValue || resourceData?.assemblyOrder,
        label:
          resourceData?.type === WORK_ORDER_TYPE.repairOrder
            ? resourceData?.repairOrder?.optionLabel || ''
            : resourceData?.type === WORK_ORDER_TYPE.productionOrder
              ? resourceData?.productionOrder?.optionLabel || ''
              : resourceData?.assemblyOrder?.optionLabel || '',
      });
    }

    return relatedTo;
  };

  const handleMail = async (files) => {
    setEmailAttachment(null)
    const attachments: any = [];
    setIsEmailAttachmentLoading(true);
    try {
      await Promise.all(
        files?.map(async (file) => {
          try {
            const response = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(file?.fileName)}`, { responseType: 'blob' });
            const data = response.data;

            let reader = new FileReader();
            reader.readAsDataURL(new Blob([data], { type: mime.getType(file.fileName.split('.')?.pop()) }));

            await new Promise<void>((resolve) => {
              reader.onloadend = function () {
                let base64data: any = reader.result;
                attachments.push({
                  base64: base64data.substring(base64data.indexOf(',') + 1),
                  contentType: base64data.split(';')[0].split(':')[1],
                  extension: `.${file.fileName.split('.')?.pop()}`,
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

  const downloadExcel = (file) => {
    axiosInstance()
      .get(`user/download?fileName=${encodeURIComponent(file?.fileName)}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file?.fileName);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleClickNew = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseNew = () => {
    setAnchorEl(null);
  };

  const checkpdfType = (memeType) => {
    if (['pdf'].includes(memeType)) {
      return true;
    }
    return false;
  };

  const ShowOtherFiles = ({ data }) => {
    const FileIcon = getFileIcon(data?.fileName);
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
            endIcon={<GetAppIcon />}
          >
            Download
          </ThemeButton>
        </div>
      </div>
    );
  };

  return (
    <Box>
      <Box className={cn(showContainer ? 'container-with-border p-[20px]' : '')}>
        {!disableEdit && (
          <div className={`flex flex-wrap items-center justify-between gap-2`}>
            {resource === sidebarResource.workOrder && showMaterialFilter && (
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
              {treeStructure?.length > 0 && (
                <>
                  <ThemeButton
                    buttonType="theme"
                    onClick={handleClickNew}
                    iconForMobile={<Add />}
                    mobileTooltip="New"
                  >
                    <Add /> New
                  </ThemeButton>
                  <Menu
                    id="new-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseNew}
                    MenuListProps={{
                      'aria-labelledby': 'new-button'
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        setAttachemntDialog({ open: true, type: 'folder', data: null, isUpdate: false });
                        handleCloseNew();
                      }}
                    >
                      <ListItemIcon>
                        <CreateNewFolderIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>New Folder</ListItemText>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setAttachemntDialog({ open: true, type: 'file', data: null, isUpdate: false });
                        handleCloseNew();
                      }}
                    >
                      <ListItemIcon>
                        <UploadFileIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>File Upload</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </div>
          </div>
        )}
        <Box pt={2} pb={2}>
          <Box style={{ height }} className={cn('overflow-auto', fullHeight ? 'h-[calc(100vh-300px)] ' : '')}>
            <div className="">
              {!treeStructure && (
                <div className="flex h-full items-center justify-center">
                  <CommonSkeleton />
                </div>
              )}
              {treeStructure?.length > 0 && (
                <RenderTree
                  tree={treeStructure}
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  setAttachemntDialog={setAttachemntDialog}
                  disableEdit={disableEdit}
                  setSendMail={setSendMail}
                  handleMail={handleMail}
                  setOpenDelete={setOpenDelete}
                  setOpenDeleteRequest={setOpenDeleteRequest}
                />
              )}
              {treeStructure?.length === 0 && (
                <div className="mx-auto mt-4 h-full w-full rounded-md  border-2 border-dashed bg-transparent text-center">
                  <CiFileOn size={100} className="mx-auto mt-5 block select-none text-gray-400 dark:text-gray-500" />
                  <p className="mb-5 select-none text-sm text-gray-400 dark:text-gray-500">No files uploaded</p>
                  <span className="mx-auto block">
                    <ThemeButton
                      buttonType="theme"
                      startIcon={<Add />}
                      onClick={() => {
                        setAttachemntDialog({ open: true, type: 'file', data: null, isUpdate: false });
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
      {attachemntDialog.open && (
        <Dialog
          open={true}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={attachemntDialog?.type === 'file' ? 'md' : 'xs'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setAttachemntDialog({ open: false, type: '', data: null, isUpdate: false });
            }
            setFullScreen(false);
          }}
          fullWidth
        >
          {attachemntDialog?.type === 'file' && (
            <ManageFile
              onClose={() => {
                setAttachemntDialog({ open: false, type: '', data: null, isUpdate: false });
                setFullScreen(false);
              }}
              onSuccess={() => {
                fetchData()
                setAttachemntDialog({ open: false, type: '', data: null, isUpdate: false });
                setFullScreen(false);
              }}
              relatedTo={getRelatedTo()}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              parentId={attachemntDialog?.data?._id}
              attachmentType={attachmentType}
            />
          )}
          {attachemntDialog?.type === 'folder' && (
            <ManageFolder
              onClose={() => {
                setAttachemntDialog({ open: false, type: '', data: null, isUpdate: false });
                setFullScreen(false);
              }}
              onSuccess={() => {
                fetchData()
                setAttachemntDialog({ open: false, type: '', data: null, isUpdate: false });
                setFullScreen(false);
              }}
              relatedTo={getRelatedTo()}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              folderData={attachemntDialog?.data}
              isRename={attachemntDialog?.isUpdate}
            />
          )}
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
                type: camelCase(resource),
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
      {selectedFile && (
        <Dialog
          open={true}
          fullScreen={true}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setSelectedFile(null);
            }
          }}
          fullWidth
          disableEnforceFocus={true}
        >
          {!checkImageUrl(selectedFile?.fileName) && !checkpdfType(selectedFile?.fileName?.split('.')[1]) && (
            <CustomDialogHeader
              title={selectedFile?.name}
              showManimizeMaximize={false}
              showRequiredLabel={false}
              onClose={() => {
                setSelectedFile(null);
              }}
            />
          )}
          <CustomDialogContent
            isFooterPresent={false}
            shouldApplyHeight={!checkImageUrl(selectedFile?.fileName)}
            className={cn(!disableEdit ? 'px-0 py-0' : 'px-4 py-3')}
          >
            {checkImageUrl(selectedFile?.fileName) ? (
              <ImageEditor
                data={selectedFile}
                fetchData={fetchData}
                setSelectedFile={setSelectedFile}
                handleClose={() => setSelectedFile(null)}
              />
            ) : checkpdfType(selectedFile?.fileName?.split('.')[1]) ? (
              <PdfEditor
                data={selectedFile}
                fetchData={fetchData}
                setSelectedFile={setSelectedFile}
                handleClose={() => setSelectedFile(null)}
              />
            ) : (
              <ShowOtherFiles data={selectedFile} key={selectedFile?.fileName} />
            )}
          </CustomDialogContent>
        </Dialog>
      )}
      {openDelete.open && (
        <AttachmentDelete
          deleteRequest={openDelete.request}
          attachments={[openDelete?.attachment]}
          onClose={() => {
            setOpenDelete({ open: false, request: false, attachment: null })
          }}
          onSuccess={() => {
            setOpenDelete({ open: false, request: false, attachment: null })
            fetchData()
          }}
        />
      )}
      <Popover
        open={Boolean(openDeleteRequest.ancherEl)}
        onClose={() => setOpenDeleteRequest({ ancherEl: null, attachment: null })}
        anchorEl={openDeleteRequest.ancherEl}
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
          <DeleteRequest
            attachment={openDeleteRequest.attachment}
            onSuccess={() => {
              setOpenDeleteRequest({ ancherEl: null, attachment: null })
              fetchData()
            }}
          />
        </div>
      </Popover>
    </Box>
  );
}

export default DiagramNew;

const RenderTree = ({ tree, selectedFile, setSelectedFile, setAttachemntDialog, disableEdit, setSendMail, handleMail, setOpenDelete, setOpenDeleteRequest }) => {
  return (
    <>
      {tree.sort(sortFileStructure).map((node) => {
        if (node.type === 'folder') {
          return (
            <RenderFolder
              key={node._id}
              node={node}
              setAttachemntDialog={setAttachemntDialog}
              disableEdit={disableEdit}
              setOpenDelete={setOpenDelete}
              setOpenDeleteRequest={setOpenDeleteRequest}
              childNodes={<RenderTree {...{ tree: node.children, selectedFile, setSelectedFile, setAttachemntDialog, disableEdit, setSendMail, handleMail, setOpenDelete, setOpenDeleteRequest }} />}
            />
          );
        }
        if (node.type === 'file' || !node.type) {
          return <RenderFiles key={node._id} node={node} selectedFile={selectedFile} setSelectedFile={setSelectedFile} disableEdit={disableEdit} setSendMail={setSendMail} handleMail={handleMail} setOpenDelete={setOpenDelete} setOpenDeleteRequest={setOpenDeleteRequest} />;
        }
        return null;
      })}
    </>
  );
};

const RenderFolder = ({ node, setAttachemntDialog, disableEdit, setOpenDelete, setOpenDeleteRequest, childNodes }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [open, setOpen] = useState(false);

  const downloadZip = (folder) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `Downloading, Please wait...`
    });
    axiosInstance()
      .get(`/attachment-new/download/zip/${folder?._id}`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', folder?.name ? `${folder?.name}.zip` : 'download.zip');
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

  return (
    <div
      key={node?._id}
      className='cursor-pointer px-[18px] py-[8px] mt-[15px] rounded-md  border border-solid'
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-[20px]">
            <FolderIcon size={20} />
          </div>
          <HtmlTooltip title={node?.name}>
            <p className=" line-clamp-1 text-[14px] font-normal">{node?.name}</p>
          </HtmlTooltip>
        </div>
        <div className="flex items-center gap-1">
          <HtmlTooltip title={'Add Folder'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setAttachemntDialog({ open: true, type: 'folder', data: node, isUpdate: false })
              }}
            >
              <CreateNewFolderIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'File Upload'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setAttachemntDialog({ open: true, type: 'file', data: node, isUpdate: false })
              }}
            >
              <UploadFileIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'Rename'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setAttachemntDialog({ open: true, type: 'folder', data: node, isUpdate: true })
              }}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'Download'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                downloadZip(node);
              }}
            >
              <GetAppIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          {permissions['attachment']?.isDelete && !disableEdit && (
            <HtmlTooltip title={getTitle([node], user)}>
              <IconButton
                size="small"
                color="inherit"
                disabled={allAttachmentsAreFromUser([node], user) ? false : !isEmpty(node?.deleteRequest) ? true : false}
                onClick={(e) => {
                  e.stopPropagation();
                  if (allAttachmentsAreFromUser([node], user)) {
                    setOpenDelete({ open: true, request: false, attachment: node })
                  } else {
                    setOpenDelete({ open: true, request: true, attachment: node })
                  }
                }}
              >
                <DeleteIcon fontSize="small" color={allAttachmentsAreFromUser([node], user) || isEmpty(node?.deleteRequest) ? 'error' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
          )}
          {permissions['attachment']?.isDelete && !isEmpty(node?.deleteRequest) && node?.createdBy?.user?._id === user?.user?._id && !disableEdit && (
            <DeleteRequestIcon
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setOpenDeleteRequest({ ancherEl: e?.currentTarget, attachment: node })
              }}
            />
          )}
          <IconButton
            size="small"
            color="primary"
            sx={{ mr: '5px' }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
          >
            <KeyboardArrowDown className={cn('origin-center !transition-all duration-300', open && '[transform:rotate(-180deg)]')} />
          </IconButton>
        </div>
      </div>
      {childNodes ? (
        <Collapse in={open} unmountOnExit>
          <div className="mt-[15px]">{childNodes}</div>
        </Collapse>
      ) : null}
    </div>
  )
}

const RenderFiles = ({ node, selectedFile, setSelectedFile, disableEdit, setSendMail, handleMail, setOpenDelete, setOpenDeleteRequest }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [open, setOpen] = useState(false);

  const downloadFile = (file) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Downloading, Please wait...`
    });
    axiosInstance()
      .get(`user/download`, {
        params: {
          fileName: file?.fileName
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({ open: true, type: 'success', message: 'File downloaded successfully.' });
          }
        }
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const viewFile = (fileName) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Loading, Please wait...`
    });
    axiosInstance()
      .get(`user/download`, {
        params: {
          fileName: fileName
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Viewed Successfully',
              open: true,
              type: 'success'
            });
          }
        }
      })
      .then(({ data }) => {
        const ext = fileName?.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        if (pdfExtensions?.includes(ext)) {
          mimeType = 'application/pdf';
        } else if (imageExtensions?.includes(ext)) {
          mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        }
        const blob = new Blob([data], { type: mimeType });
        const fileURL = URL.createObjectURL(blob);
        const newWindow = window.open();
        newWindow.location.href = fileURL;
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const Icon = getFileIcon(node?.fileName);
  const extension = node?.fileName?.split('.').pop();

  return (
    <div
      className='cursor-pointer px-[18px] py-[8px] mt-[15px] rounded-md  border border-solid'
      onClick={(e) => {
        e.stopPropagation()
        if (imageExtensions.includes(extension)) {
          setOpen((prev) => !prev);
        } else {
          setSelectedFile(node)
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-[20px]">
            <Icon size={20} />
          </div>
          <HtmlTooltip title={node?.name}>
            <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(node)}</p>
          </HtmlTooltip>
        </div>
        <div className="flex items-center gap-1">
          <HtmlTooltip title={'Download'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(node);
              }}
            >
              <GetAppIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          {[...imageExtensions, ...pdfExtensions]?.includes(extension?.toLowerCase()) && (
            <HtmlTooltip title={'Preview'}>
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  viewFile(node?.fileName);
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Send Email'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setSendMail(true);
                handleMail([node]);
              }}
            >
              <SendIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          {permissions['attachment']?.isDelete && !disableEdit && (
            <HtmlTooltip title={getTitle([node], user)}>
              <IconButton
                size="small"
                color="inherit"
                disabled={allAttachmentsAreFromUser([node], user) ? false : !isEmpty(node?.deleteRequest) ? true : false}
                onClick={(e) => {
                  e.stopPropagation();
                  if (allAttachmentsAreFromUser([node], user)) {
                    setOpenDelete({ open: true, request: false, attachment: node })
                  } else {
                    setOpenDelete({ open: true, request: true, attachment: node })
                  }
                }}
              >
                <DeleteIcon fontSize="small" color={allAttachmentsAreFromUser([node], user) || isEmpty(node?.deleteRequest) ? 'error' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
          )}
          {permissions['attachment']?.isDelete && !isEmpty(node?.deleteRequest) && node?.createdBy?.user?._id === user?.user?._id && !disableEdit && (
            <DeleteRequestIcon
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setOpenDeleteRequest({ ancherEl: e?.currentTarget, attachment: node })
              }}
            />
          )}
          {imageExtensions.includes(extension) ? (
            <IconButton
              size="small"
              color="primary"
              sx={{ mr: '5px' }}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
            >
              <KeyboardArrowDown className={cn('origin-center !transition-all duration-300', open && '[transform:rotate(-180deg)]')} />
            </IconButton>
          ) : (
            <div className="w-[39px]" />
          )}
        </div>
      </div>
      <Collapse in={open} unmountOnExit>
        {imageExtensions.includes(extension) && (
          <ImagePreview name={node?.name} url={node?.fileName} onFileClick={() => setSelectedFile(node)} />
        )}
      </Collapse>
    </div >
  );
};

type ImagePreviewProps = {
  name: string;
  url: string;
  onFileClick: () => void;
};

const ImagePreview = ({ name, url, onFileClick }: ImagePreviewProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [src, setSrc] = useState(null);
  const [progress, setProgress] = useState(-1);

  useEffect(() => {
    const viewFile = async () => {
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
    };

    viewFile();
  }, [url, toastConfig]);

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFileClick();
      }}
      className="mb-[--py] flex h-[500px]  max-w-fit items-center justify-center overflow-hidden px-[--px]"
    >
      {src ? <img src={src} alt={name} className="mr-auto max-h-full max-w-full" /> : <p>Loading...{progress >= 0 ? progress : 0}%</p>}
    </div>
  );
};
