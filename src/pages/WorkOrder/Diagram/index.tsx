import { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid, IconButton, Typography } from '@material-ui/core';
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

const Diagram = ({ resource, referenceId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [rowData, setRowData] = useState(null);
  const [attachemntDialog, setAttachemntDialog] = useState({ open: false, id: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId]);

  const fetchData = async () => {
    const { data: { data } } = await axiosInstance().get(`/attachment/resource-attachment-type?resource=${resource}&referenceId=${referenceId}&attachmentType=${ATTACHMENT_TYPE.diagram}`
    );
    const files: any = [];
    data?.forEach((d) => {
      if (d?.file?.length > 1) {
        const child: any = [];
        d?.file?.forEach((file, i) => {
          child.push({
            _id: `${d?._id + i}`,
            attachment: file?.name,
            date: file?.date,
            url: file?.url,
            parent: d?._id
          });
        });
        files.push({
          _id: d?._id,
          file: d?.name,
          child: child
        });
      } else {
        files.push({
          _id: d?._id,
          file: d?.name,
          attachment: d?.file[0]?.name,
          date: d?.file[0]?.date,
          url: d?.file[0]?.url
        });
      }
    });
    setRowData(files);
    setSelectedFile(files[0]);
    setSelectedAttachment(files[0]?.child ? files[0].child[0] : null);
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

  const FileShow = ({ data, index, child = false }) => {
    return (
      <Box
        p={2}
        onClick={() => {
          if (child) {
            setSelectedAttachment(data);
            setSelectedFile(rowData.find((r) => r?._id === data?.parent));
          } else {
            setSelectedAttachment(data?.child ? data?.child[0] : null);
            setSelectedFile(data);
          }
        }}
        style={{
          border:
            selectedFile?._id === data?._id || selectedAttachment?._id === data?._id
              ? '1px solid var(--dark-active-border-color,#298B88)'
              : '1px solid var(--dark-mode-border-color, rgb(224, 224, 224))',
          // borderTopWidth: index === 1 ? 1 : 0,
          cursor: 'pointer'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Box
              style={{
                backgroundColor: 'var(--dark-primary, var(--primary))',
                color: 'white',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                lineHeight: '20px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0,
                top: '4px',
                left: 0
              }}
            >
              <span>{index}</span>
            </Box>
            <Box ml={'10px'}>
              <Typography style={{ fontWeight: 600 }}>{child ? data?.attachment : data?.file}</Typography>
            </Box>
          </Box>
          {!child && (
            <Box display="flex">
              <div style={{ flexBasis: 'max-content' }}>
                <HtmlTooltip title="Edit" placement="top" arrow>
                  <IconButton
                    size="small"
                    color="inherit"
                    aria-label="edit"
                    onClick={() => {
                      setAttachemntDialog({ open: true, id: data?._id });
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
                      setShowConfirmBox(true);
                    }}
                  >
                    <DeleteOutlineIcon style={{ fontSize: '18px' }} />
                  </IconButton>
                </HtmlTooltip>
              </div>
            </Box>
          )}
        </Box>
      </Box>
    );
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
        <iframe title={data?.attachment} src={url} width="100%" height="100%" frameBorder="0" scrolling="auto"></iframe>
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
            <Box>
              {rowData && rowData?.map((data, index) => {
                return data?.child ? (
                  <>
                    <FileShow data={data} index={index + 1} />
                    {data?.child?.map((c, i) => {
                      return <FileShow data={c} index={`${index + 1}.${i + 1}`} child={true} />;
                    })}
                  </>
                ) : (
                  <FileShow data={data} index={index + 1} />
                );
              })}
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
              {selectedFile &&
                (selectedAttachment ? (
                  <>
                    {checkImageType(selectedAttachment?.url?.split('.')[1]) ? (
                      <ViewImage data={selectedAttachment} />
                    ) : checkpdfType(selectedAttachment?.url?.split('.')[1]) ? (
                      <ShowPdf data={selectedAttachment} />
                    ) : (
                      <ShowExcel data={selectedAttachment} />
                    )}
                  </>
                ) : (
                  <>
                    {checkImageType(selectedFile?.url?.split('.')[1]) ? (
                      <ViewImage data={selectedFile} />
                    ) : checkpdfType(selectedFile?.url?.split('.')[1]) ? (
                      <ShowPdf data={selectedFile} />
                    ) : (
                      <ShowExcel data={selectedFile} />
                    )}
                  </>
                ))}
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
          message={`Are you sure you want to delete ${selectedFile?.file}?`}
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
