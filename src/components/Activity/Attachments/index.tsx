import React, { useState, useEffect, Fragment, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Dialog from '@material-ui/core/Dialog';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import ManageAttachment from './ManageAttachment';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { MdDelete } from 'react-icons/md';
import { Tooltip } from '@material-ui/core';

export default function Attachments({ relatedTo, handleActivityRefresh, onSetCount }) {
  const [open, setOpen] = useState({ open: false, type: 'file', parentFolder: null, purpose: 'add' });
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState(null);
  const [attachmentId, setAttachmentId] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [attachmentData, setAttachmentData] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchAttachment();
  }, []);

  const fetchAttachment = async () => {
    setLoading(true);
    let api = `/attachment?relatedTo=${JSON.stringify(relatedTo)}`;
    axiosInstance()
      .get(api)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          setLoading(false);
          onSetCount('Attachment', count);
          setAttachments(data);
        }
      )
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenMenu = (event, _id, data) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setAttachmentId(_id);
    if (data && data?._id) setAttachmentData(data);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setAttachmentId(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setOpen({ open: true, type: 'file', parentFolder: null, purpose: 'edit' });
  };

  const handleDelete = (event) => {
    if (attachmentId) {
      event.stopPropagation();
      axiosInstance()
        .put('attachment/deletemany ', { ids: [attachmentId] })
        .then(({ data }) => {
          setAnchorEl(null);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Deleted Successfully'
          });
          fetchAttachment();
          handleActivityRefresh();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleFolderDelete = (folderId) => {
    axiosInstance()
      .put('attachment/folder/deletemany ', { ids: [folderId] })
      .then(({ data }) => {
        setAnchorEl(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Deleted Successfully'
        });
        fetchAttachment();
        handleActivityRefresh();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClose = () => {
    fetchAttachment();
    setOpen({ open: false, type: 'file', parentFolder: null, purpose: '' });
    if (attachmentData && attachmentData?._id) setAttachmentData(null);
    handleActivityRefresh();
  };

  const handleDownload = () => {
    setAnchorEl(null);
    const file = attachmentData?.file;
    if (file?.length === 1) {
      axiosInstance()
        .get(`user/download?fileName=${file[0].url}`, {
          responseType: 'blob'
        })
        .then(({ data }) => {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = url;
          var fileExt = file[0].url?.split('.').pop();
          link.setAttribute('download', file[0].name + '.' + fileExt);
          document.body.appendChild(link);
          link.click();
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      const fileUrl = file.map((f) => f.url);
      axiosInstance()
        .put(
          `user/download`,
          {
            files: fileUrl
          },
          {
            responseType: 'blob'
          }
        )
        .then(({ data }) => {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', attachmentData?.name ? `${attachmentData?.name}.zip` : 'download.zip');
          document.body.appendChild(link);
          link.click();
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : (
        attachments && (
          <>
            {attachments.length ? (
              <Fragment>
                {attachments.slice(0, 5).map((_attachment, index) => (
                  <Box key={_attachment._id} className="activity">
                    <Box>
                      <Grid container>
                        <Grid item xs={9} className="d-flex align-items-center gap-1">
                          <Typography
                            variant="subtitle2"
                            className="cursor-pointer"
                            onClick={() => {
                              setAttachmentId(_attachment._id);
                              setOpen({
                                open: true,
                                type: _attachment.attachmentType === 'folder' ? 'folder' : 'file',
                                parentFolder: null,
                                purpose: 'edit'
                              });
                            }}
                          >
                            {_attachment?.name ?? ''}
                          </Typography>
                        </Grid>
                        {permissions['attachment']?.isUpdate || permissions['attachment']?.isDelete ? (
                          <Grid item xs={3} container justify="flex-end">
                            {_attachment.attachmentType !== 'folder' ? (
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="delete"
                                onClick={(event) => handleOpenMenu(event, _attachment._id, _attachment)}
                              >
                                <MoreHorizIcon />
                              </IconButton>
                            ) : (
                              <>
                                <Tooltip title={'Add Folder'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setOpen({ open: true, type: 'folder', parentFolder: _attachment._id, purpose: 'add' });
                                    }}
                                  >
                                    <CreateNewFolderIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={'Add File'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setOpen({ open: true, type: 'file', parentFolder: _attachment._id, purpose: 'add' });
                                    }}
                                  >
                                    <AddOutlinedIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={'Delete Folder'}>
                                  <IconButton size="small" onClick={() => handleFolderDelete(_attachment._id)}>
                                    <MdDelete color="error" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Grid>
                        ) : null}
                      </Grid>
                    </Box>
                    <Box pt={1}>
                      <Grid container>
                        <Grid item xs={12}>
                          <ListRelatedTo relatedTo={_attachment.relatedTo} originRelatedTo={relatedTo} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))}
                <ViewAll type="attachment" relatedTo={relatedTo} />
              </Fragment>
            ) : (
              <Box p={1} border={1} borderColor="grey.300" textAlign="center">
                <Typography variant="subtitle2">No Past Attachment</Typography>
              </Box>
            )}
            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              {permissions['attachment']?.isUpdate ? <MenuItem onClick={handleEdit}>Edit</MenuItem> : null}
              <MenuItem onClick={handleDownload}>Download</MenuItem>
              {permissions['attachment']?.isDelete ? <MenuItem onClick={handleDelete}>Delete</MenuItem> : null}
            </Menu>
            <Dialog
              open={open.open}
              aria-labelledby="customized-dialog-title"
              maxWidth="md"
              onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                  handleClose();
                  setFullScreen(false);
                }
              }}
              fullWidth
              fullScreen={fullScreen || isMobile || isTablet}
              TransitionComponent={CustomDialogTransition}
            >
              <ManageAttachment
                attachmentId={open.purpose === 'add' ? null : attachmentId}
                handleClose={() => {
                  handleClose();
                  setFullScreen(false);
                }}
                relatedTo={relatedTo}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                parentFolder={open.parentFolder}
                type={open.type}
              />

              {/* open.type === 'folder' ? (
              <ManageAttachmentFolder
                folderId={open.purpose === 'add' ? null : attachmentId}
                folderData={open.purpose === 'add' ? null : attachmentData}
                handleClose={() => {
                  handleClose();
                  setFullScreen(false);
                }}
                relatedTo={relatedTo}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                parentFolder={open.parentFolder}
              />
              ) : */}
            </Dialog>
          </>
        )
      )}
    </Box>
  );
}
