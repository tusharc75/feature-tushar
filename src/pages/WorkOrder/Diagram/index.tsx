import { Box, Button, Collapse, Dialog, Grid, IconButton, Tooltip, Typography } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import ShowPdf from './ShowPdf';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiDownload } from 'react-icons/bi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { ATTACHMENT_TYPE, CustomDialogTransition } from 'src/constants/helpers';
import ViewImage from './ViewImage';
import { getFileIcon, getFileNameWithExtension } from './utils';

const Diagram = ({ resource, referenceId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [rowData, setRowData] = useState(null);
  const [expended, setExpended] = useState({});
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, id: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId]);

  useEffect(() => {
    setLoading(true);
  }, [selectedAttachment]);

  const fetchData = async () => {
    axiosInstance()
      .get(`/attachment/resource-attachment-type?resource=${resource}&referenceId=${referenceId}&attachmentType=${ATTACHMENT_TYPE.diagram}`)
      .then(({ data: { data } }) => {
        const expend: any = {};
        data?.forEach((file) => {
          expend[file?._id] = true;
        });
        setExpended(expend);
        setRowData(data);
        setSelectedAttachment({...data[0]?.file[0], attachmentId: data[0]?._id});
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
      .get(`user/download?fileName=${file?.url}`, {
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
      <div className="flex justify-center items-center h-full absolute inset-0">
        <div className="flex flex-col gap-2 items-center">
          <FileIcon size={150} className="text-center" />
          <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(data)}</p>
          <Button
            onClick={() => {
              downloadExcel(data);
            }}
            variant="contained"
            className="no-shadow dark:[background:var(--dark-secondary)_!important]"
            color="inherit"
            endIcon={<BiDownload />}
          >
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5} md={5} lg={4} xl={3}>
          <Box className="container-with-border" p={'20px'} height={'calc(100vh - 150px)'}>
            <Box mb={1} display="flex" justifyContent="end" alignItems="center">
              <Button
                variant={'outlined'}
                color="primary"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setAttachemntDialog({ open: true, id: null });
                }}
                aria-controls="add-menu"
              >
                Add
              </Button>
            </Box>
            <Box pt={2} pb={2}>
              <Box className=" overflow-auto h-[calc(100vh-250px)]">
                <div className=" grid gap-3">
                  {rowData &&
                    rowData?.map((file, index) => {
                      return (
                        <div key={file._id} className="shadow-[0px_17.7266px_35.4532px_rgba(0,_0,_0,_0.03)]">
                          <div
                            className={`head flex items-center justify-between cursor-pointer w-full p-[8px_15px] ${
                              expended[file?._id]
                                ? 'bg-[var(--accordion-expanded-summary-bg,_#f1f5ff)] rounded-[4px_4px_0_0]'
                                : 'bg-[var(--accordion-summary-bg,#fff)] rounded-[4px]'
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
                                <Typography style={{ fontWeight: 600 }}>{file?.name}</Typography>
                              </Box>
                            </div>
                            <div className="flex gap-2">
                              <HtmlTooltip title="Edit" placement="top" arrow>
                                <IconButton
                                  size="small"
                                  color="inherit"
                                  aria-label="edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachemntDialog({ open: true, id: file?._id });
                                  }}
                                >
                                  <EditIcon style={{ fontSize: '18px' }} />
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
                                    className="px-[18px] py-[8px] cursor-pointer"
                                    style={{
                                      border:
                                        selectedAttachment?.url === f?.url
                                          ? '1px solid var(--dark-active-border-color,#0F9FA9 )'
                                          : '1px solid transparent',
                                      borderBottomColor:
                                        selectedAttachment?.url === f?.url ? 'var(--dark-active-border-color,#0F9FA9 )' : 'var(--common-border-color)'
                                    }}
                                  >
                                    <Tooltip enterTouchDelay={0} title={f.name} placement={'top'} arrow>
                                      <div className="flex gap-2 items-center">
                                        <div className="w-[20px]">
                                          <Icon size={20} />
                                        </div>
                                        <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(f)}</p>
                                      </div>
                                    </Tooltip>
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
        </Grid>
        <Grid item xs={12} sm={7} md={7} lg={8} xl={9}>
          <Box
            className="container-with-border relative"
            p={'20px'}
            style={{
              overflow: 'hidden',
              minHeight: '100%'
            }}
          >
            {selectedAttachment && (
              <>
                {checkImageType(selectedAttachment?.url?.split('.')[1]) ? (
                  <ViewImage data={selectedAttachment} key={selectedAttachment.url} fetchData={fetchData} loading={loading} setLoading={setLoading} />
                ) : checkpdfType(selectedAttachment?.url?.split('.')[1]) ? (
                  <ShowPdf data={selectedAttachment} key={selectedAttachment.url} loading={loading} setLoading={setLoading} />
                ) : (
                  <ShowOtherFiles data={selectedAttachment} key={selectedAttachment.url} />
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>
      {attachemntDialog.open && (
        <Dialog
          open={true}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setAttachemntDialog({ open: false, id: null });
            }
            setFullScreen(false);
          }}
          fullWidth
        >
          <ManageAttachment
            attachmentId={attachemntDialog.id}
            handleClose={() => {
              setAttachemntDialog({ open: false, id: null });
              setFullScreen(false);
            }}
            relatedTo={[{ type: resource, referenceId: referenceId, access: true }]}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            fetchData={fetchData}
            defaultAttachmentType={ATTACHMENT_TYPE.diagram}
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
