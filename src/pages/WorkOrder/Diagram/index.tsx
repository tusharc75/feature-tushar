import { Box, Button, Collapse, Dialog, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { useContext, useEffect, useState } from 'react';
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
import { ACTIVITY_RESOURCE, ATTACHMENT_TYPE, CustomDialogTransition, WORK_ORDER_TYPE } from 'src/constants/helpers';
import PdfPreview from './ShowPdf/PdfPreview';
import ViewImage from './ViewImage';
import { getFileIcon, getFileNameWithExtension } from './utils';

const Diagram = ({ resource, referenceId, currentVersion, workOrderData, fromVersions = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const [rowData, setRowData] = useState(null);
  const [expended, setExpended] = useState({});
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, id: null, isClone: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId, currentVersion]);

  const fetchData = async () => {
    axiosInstance()
      .get(
        `/attachment/resource-attachment-type?resource=${resource}&referenceId=${referenceId}&attachmentType=${ATTACHMENT_TYPE.drawing}&version=${currentVersion}`
      )
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
          <Button
            onClick={() => {
              downloadExcel(data);
            }}
            variant="contained"
            className="no-shadow dark:[background:var(--dark-secondary)_!important]"
            color="inherit"
            endIcon={<DownloadIcon />}
          >
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Box>
      <Box className="container-with-border" p={'20px'}>
        {!fromVersions && (
          <Box className="mb-2 flex flex-wrap items-center justify-between gap-2 min-[600px]:justify-end">
            <h6 className="text-[16px] font-semibold min-[600px]:hidden">Attachments</h6>
            <ThemeButton
              onClick={() => {
                setAttachemntDialog({ open: true, id: null, isClone: false });
              }}
              iconForMobile={<Add />}
              mobileTooltip="Add"
            >
              <Add /> Add
            </ThemeButton>
          </Box>
        )}
        <Box pt={2} pb={2}>
          <Box className="h-[calc(100vh-250px)] overflow-auto">
            <div className="grid gap-3">
              {rowData &&
                rowData?.map((file, index) => {
                  return (
                    <div key={file._id} className="shadow-[0px_17.7266px_35.4532px_rgba(0,_0,_0,_0.03)]">
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
                        {!fromVersions && (
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
                        <div className="border border-[var(--common-border-color)]">
                          {file?.file?.map((f) => {
                            const Icon = getFileIcon(f.url);
                            return (
                              <Box
                                key={f.url}
                                onClick={() => {
                                  setSelectedAttachment({ ...f, attachmentId: file?._id });
                                }}
                                className="cursor-pointer px-[18px] py-[8px]"
                                style={{
                                  border:
                                    selectedAttachment?.url === f?.url
                                      ? '1px solid var(--dark-active-border-color,#0F9FA9 )'
                                      : '1px solid transparent',
                                  borderBottomColor:
                                    selectedAttachment?.url === f?.url ? 'var(--dark-active-border-color,#0F9FA9 )' : 'var(--common-border-color)'
                                }}
                              >
                                <HtmlTooltip title={f.name}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-[20px]">
                                      <Icon size={20} />
                                    </div>
                                    <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(f)}</p>
                                  </div>
                                </HtmlTooltip>
                              </Box>
                            );
                          })}
                        </div>
                      </Collapse>
                    </div>
                  );
                })}
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
        >
          <CustomDialogHeader
            title={'Show Drawing'}
            showManimizeMaximize={false}
            showRequiredLabel={false}
            onClose={() => {
              setSelectedAttachment(null);
            }}
          />
          <CustomDialogContent isFooterPresent={false}>
            {checkImageType(selectedAttachment?.url?.split('.')[1]) ? (
              fromVersions ? (
                <ShowPdf data={selectedAttachment} />
              ) : (
                <ViewImage data={selectedAttachment} fetchData={fetchData} setSelectedAttachment={setSelectedAttachment} />
              )
            ) : checkpdfType(selectedAttachment?.url?.split('.')[1]) ? (
              fromVersions ? (
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
            relatedTo={[
              { type: resource, referenceId: referenceId, version: currentVersion, access: true },
              {
                type: workOrderData?.type === WORK_ORDER_TYPE.repairOrder ? ACTIVITY_RESOURCE.repairOrder : ACTIVITY_RESOURCE.productionOrder,
                referenceId:
                  workOrderData?.type === WORK_ORDER_TYPE.repairOrder
                    ? workOrderData?.repairOrder?.optionValue || workOrderData?.repairOrder
                    : workOrderData?.productionOrder?.optionValue || workOrderData?.productionOrder,
                access: true
              }
            ]}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            fetchData={fetchData}
            defaultAttachmentType={ATTACHMENT_TYPE.drawing}
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
