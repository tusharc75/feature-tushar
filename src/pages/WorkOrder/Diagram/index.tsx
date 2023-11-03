import { useContext, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Dialog, Grid, IconButton, Typography } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';
import { ATTACHMENT_TYPE, CustomDialogTransition } from 'src/constants/helpers';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import { isMobile, isTablet } from 'react-device-detect';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ViewImage from './ViewImage';
import { docIcon } from 'src/assets/file_icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

const Diagram = ({ resource, referenceId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [rowData, setRowData] = useState(null);
  const [expended, setExpended] = useState({});
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, id: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId]);

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
        setSelectedAttachment(data[0]?.file[0]);
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
    if (['jpg', 'png'].includes(memeType)) {
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

  const ShowPdf = ({ data }) => {
    const [url, seturl] = useState();
    useEffect(() => {
      axiosInstance()
        .get(`user/download?fileName=${data?.url}`, {
          responseType: 'blob'
        })
        .then(({ data }) => {
          const file = new Blob([data], { type: 'application/pdf' });
          const fileURL: any = URL.createObjectURL(file);
          seturl(fileURL);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }, [data]);
    return (
      <Box height={'calc(100vh - 150px)'}>
        <iframe title={data?.name} src={url} width="100%" height="100%" frameBorder="0" scrolling="auto"></iframe>
      </Box>
    );
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

  const ShowExcel = ({ data }) => {
    return (
      <div
        onClick={() => {
          downloadExcel(data);
        }}
        style={{ cursor: 'pointer' }}
      >
        <img width={200} src={docIcon} alt="attchment" />;
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
                Add Attachment
              </Button>
            </Box>
            <Box pt={2} pb={2}>
              <Box
                style={{
                  overflow: 'auto',
                  height: 'calc(100vh - 250px)'
                }}
              >
                {rowData &&
                  rowData?.map((file, index) => {
                    return (
                      <Accordion
                        expanded={expended[file?._id]}
                        className="omsAccordian"
                        onChange={() => {
                          setExpended((prev) => ({
                            ...prev,
                            [file?._id]: expended[file?._id] ? false : true
                          }));
                        }}
                      >
                        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                          <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center">
                              <IconButton size="small">{expended[file?._id] ? <ExpandMoreIcon /> : <KeyboardArrowRight />}</IconButton>
                              <Box ml={2}>
                                <Typography style={{ fontWeight: 600 }}>{file?.name}</Typography>
                              </Box>
                            </Box>
                            <Box display="flex">
                              <div style={{ flexBasis: 'max-content' }}>
                                <HtmlTooltip title="Edit" placement="top" arrow>
                                  <IconButton
                                    size="small"
                                    color="inherit"
                                    aria-label="edit"
                                    onClick={() => {
                                      setAttachemntDialog({ open: true, id: file?._id });
                                    }}
                                  >
                                    <EditIcon style={{ fontSize: '18px' }} />
                                  </IconButton>
                                </HtmlTooltip>
                              </div>
                              <div style={{ flexBasis: 'max-content' }}>
                                <HtmlTooltip title="Delete" placement="top" arrow>
                                  <IconButton
                                    size="small"
                                    color="inherit"
                                    style={{ color: 'red' }}
                                    aria-label="delete"
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setShowConfirmBox(true);
                                    }}
                                  >
                                    <DeleteOutlineIcon style={{ fontSize: '18px' }} />
                                  </IconButton>
                                </HtmlTooltip>
                              </div>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails style={{ display: 'flex', flexDirection: 'column' }}>
                          {expended[file?._id] &&
                            file?.file?.map((f) => {
                              return (
                                <Box
                                  p={1}
                                  onClick={() => {
                                    setSelectedAttachment(f);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    border:
                                      selectedAttachment?.url === f?.url
                                        ? '1px solid var(--dark-active-border-color,#298B88)'
                                        : '1px solid var(--dark-mode-border-color, rgb(224, 224, 224))'
                                  }}
                                >
                                  <Box>
                                    <Typography style={{ fontWeight: 600 }}>{f?.name}</Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={7} md={7} lg={8} xl={9}>
          <Box
            className="container-with-border"
            p={'20px'}
            style={{
              overflow: 'hidden',
              minHeight: '100%'
            }}
          >
            <Box>
              {selectedAttachment && (
                <>
                  {checkImageType(selectedAttachment?.url?.split('.')[1]) ? (
                    <ViewImage data={selectedAttachment} />
                  ) : checkpdfType(selectedAttachment?.url?.split('.')[1]) ? (
                    <ShowPdf data={selectedAttachment} />
                  ) : (
                    <ShowExcel data={selectedAttachment} />
                  )}
                </>
              )}
            </Box>
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
