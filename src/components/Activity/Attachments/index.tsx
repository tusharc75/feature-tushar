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
import { CustomDialogTransition, dateTimeFormat } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import { MdDelete } from 'react-icons/md';
import { ListItemIcon, ListItemText } from '@material-ui/core';
import { TreeItem, TreeView } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { AiOutlineFileAdd, AiOutlineFolderAdd, AiOutlineDelete, AiOutlineFile } from 'react-icons/ai';
import { FiEdit2 } from 'react-icons/fi';
import moment from 'moment';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const order = ['file', 'folder'];

const sortFileStructure = (a, b) => {
  const aOrder = order.indexOf(a.type);
  const bOrder = order.indexOf(b.type);
  return aOrder - bOrder;
};

export default function Attachments({ relatedTo, handleActivityRefresh, onSetCount }) {
  const [open, setOpen] = useState({ open: false, type: 'file', parentFolder: null, purpose: 'add' });
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState(null);
  const [attachmentId, setAttachmentId] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [attachmentData, setAttachmentData] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  // folderStates
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderAnchorEl, setFolderAnchorEl] = useState(null);
  const isFolderOptionsOpen = Boolean(folderAnchorEl);

  const handleFolderOptionsOpen = (event, attachment) => {
    event.stopPropagation();
    setCurrentFolder(attachment);
    setFolderAnchorEl(event.currentTarget);
  };
  const handleFolderOptionsClose = () => {
    setFolderAnchorEl(null);
  };

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
          const folders = [];
          const files = [];
          data
            .sort(sortFileStructure)
            ?.filter((item) => !item.parentFolder)
            .forEach((_attachment, idx) => {
              if (_attachment?.type === 'folder') {
                const childTree = nestedSubTrees(data, _attachment._id);
                folders.push(
                  <>
                    <TreeItem
                      nodeId={_attachment._id}
                      style={{
                        background: 'var(--dark-secondary,#FFFFFF)',
                        borderLeft: '4px solid #298B88',
                        boxShadow: '0px 4px 40px rgba(0, 0, 0, 0.08)',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        padding: '14px 0 14px 9px'
                      }}
                      label={
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 10px'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}>
                            <FolderOpenIcon className="mr-2" style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#5B5B5B)' }} />
                            <Box>
                              <Typography
                                style={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px', color: 'var(--dark-primary-text,#5B5B5B)' }}
                              >
                                {` ${_attachment?.name} ${childTree?.length ? `(${childTree?.length})` : ''}`}
                              </Typography>
                              <Typography
                                variant="body2"
                                component={'p'}
                                style={{ fontSize: '0.8rem', paddingTop: '2px', color: 'var(--dark-secondary-text,#7b898e)' }}
                              >
                                Created: {moment(_attachment?.createdBy?.date).format(dateTimeFormat)}
                              </Typography>
                            </Box>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <HtmlTooltip title={'Options'}>
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="delete"
                                onClick={(event) => handleFolderOptionsOpen(event, _attachment)}
                              >
                                <MoreHorizIcon />
                              </IconButton>
                            </HtmlTooltip>
                          </div>
                        </div>
                      }
                    >
                      {childTree}
                    </TreeItem>
                  </>
                );
              } else {
                files.push(
                  <TreeItem
                    nodeId="2"
                    className={'attachment-files'}
                    label={
                      <Box key={_attachment._id} className="activity">
                        <Box>
                          <Grid container>
                            <Grid item xs={9} className="d-flex align-items-center gap-1">
                              <Box
                                className="cursor-pointer"
                                style={{ display: 'flex', alignItems: 'center' }}
                                onClick={() => {
                                  setAttachmentId(_attachment._id);
                                  setOpen({
                                    open: true,
                                    type: _attachment.type === 'folder' ? 'folder' : 'file',
                                    parentFolder: null,
                                    purpose: 'edit'
                                  });
                                }}
                              >
                                <AiOutlineFile style={{ marginRight: '8px' }} />
                                <Box>
                                  <Typography
                                    style={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px', color: 'var(--dark-primary-text,#5B5B5B)' }}
                                  >
                                    {_attachment?.name ?? ''}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    component={'span'}
                                    style={{ fontSize: '0.8rem', paddingTop: '2px', color: 'var(--dark-secondary-text,#7b898e)' }}
                                  >
                                    Created: {moment(_attachment?.createdBy?.date).format(dateTimeFormat)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            {permissions['attachment']?.isUpdate || permissions['attachment']?.isDelete ? (
                              <Grid item xs={3} container justify="flex-end" alignItems="center">
                                {_attachment.type !== 'folder' ? (
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
                                    <Box mr={1}>
                                      <HtmlTooltip title={'Add Folder'}>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setOpen({ open: true, type: 'folder', parentFolder: _attachment._id, purpose: 'add' });
                                          }}
                                        >
                                          <CreateNewFolderIcon style={{ maxWidth: '18px', color: '#5B5B5B' }} />
                                        </IconButton>
                                      </HtmlTooltip>
                                    </Box>
                                    <Box mr={1}>
                                      <HtmlTooltip title={'Add File'}>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setOpen({ open: true, type: 'file', parentFolder: _attachment._id, purpose: 'add' });
                                          }}
                                        >
                                          <AddOutlinedIcon style={{ maxWidth: '18px', color: '#5B5B5B' }} />
                                        </IconButton>
                                      </HtmlTooltip>
                                    </Box>
                                    <HtmlTooltip title={'Delete Folder'}>
                                      <IconButton size="small" onClick={() => handleFolderDelete(_attachment._id)}>
                                        <MdDelete color="error" style={{ maxWidth: '18px' }} />
                                      </IconButton>
                                    </HtmlTooltip>
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
                    }
                  />
                );
              }
            });
          setAttachments([...folders, ...files]);
        }
      )
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const nestedSubTrees = (data, parentId) => {
    return data
      ?.filter((item) => `${item.parentFolder}` === `${parentId}`)
      ?.map((_attachment, idx) => {
        if (_attachment?.type === 'folder') {
          const childTree = nestedSubTrees(data, _attachment._id);
          return (
            <TreeItem
              nodeId={_attachment._id}
              className="attachment"
              style={{ padding: '14px 0px 14px 9px' }}
              label={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 10px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}>
                    <FolderOpenIcon className="mr-2" style={{ maxWidth: '18px', color: '#5B5B5B' }} />
                    <Box>
                      <Typography style={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px', color: 'var(--dark-primary-text,#5B5B5B)' }}>
                        {` ${_attachment?.name} ${childTree?.length ? `(${childTree?.length})` : ''}`}
                      </Typography>
                      <Typography
                        variant="body2"
                        component={'span'}
                        style={{ fontSize: '0.8rem', paddingTop: '2px', color: 'var(--dark-secondary-text,#7b898e)' }}
                      >
                        Created: {moment(_attachment?.createdBy?.date).format(dateTimeFormat)}
                      </Typography>
                    </Box>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <HtmlTooltip title={'Options'}>
                      <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleFolderOptionsOpen(event, _attachment)}>
                        <MoreHorizIcon />
                      </IconButton>
                    </HtmlTooltip>
                  </div>
                </div>
              }
            >
              {childTree}
            </TreeItem>
          );
        }
        return (
          <TreeItem
            nodeId="2"
            label={
              <Box key={_attachment._id} className="activity">
                <Box>
                  <Grid container>
                    <Grid item xs={9} className="d-flex align-items-center gap-1">
                      <Box
                        className="cursor-pointer"
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => {
                          setAttachmentId(_attachment._id);
                          setOpen({
                            open: true,
                            type: _attachment.type === 'folder' ? 'folder' : 'file',
                            parentFolder: null,
                            purpose: 'edit'
                          });
                        }}
                      >
                        <AiOutlineFile style={{ marginRight: '8px' }} />
                        <Box>
                          <Typography style={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px', color: 'var(--dark-primary-text,#5B5B5B)' }}>
                            {_attachment?.name ?? ''}
                          </Typography>
                          <Typography
                            variant="body2"
                            component={'span'}
                            style={{ fontSize: '0.8rem', paddingTop: '2px', color: 'var(--dark-secondary-text,#7b898e)' }}
                          >
                            Created: {moment(_attachment?.createdBy?.date).format(dateTimeFormat)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    {permissions['attachment']?.isUpdate || permissions['attachment']?.isDelete ? (
                      <Grid item xs={3} container justify="flex-end" alignItems="center">
                        {_attachment.type !== 'folder' ? (
                          <Box mr={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="delete"
                              onClick={(event) => handleOpenMenu(event, _attachment._id, _attachment)}
                            >
                              <MoreHorizIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <>
                            <Box mr={1}>
                              <HtmlTooltip title={'Add Folder'}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setOpen({ open: true, type: 'folder', parentFolder: _attachment._id, purpose: 'add' });
                                  }}
                                >
                                  <CreateNewFolderIcon style={{ maxWidth: '18px', color: '#5B5B5B' }} />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                            <Box mr={1}>
                              <HtmlTooltip title={'Add File'}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setOpen({ open: true, type: 'file', parentFolder: _attachment._id, purpose: 'add' });
                                  }}
                                >
                                  <AddOutlinedIcon style={{ maxWidth: '18px', color: '#5B5B5B' }} />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                            <HtmlTooltip title={'Delete Folder'}>
                              <IconButton size="small" onClick={() => handleFolderDelete(_attachment._id)}>
                                <MdDelete color="error" />
                              </IconButton>
                            </HtmlTooltip>
                          </>
                        )}
                      </Grid>
                    ) : null}
                  </Grid>
                </Box>
                {/* <Box pt={1}>
                  <Grid container>
                    <Grid item xs={12}>
                      <ListRelatedTo relatedTo={_attachment.relatedTo} originRelatedTo={relatedTo} />
                    </Grid>
                  </Grid>
                </Box> */}
              </Box>
            }
          />
        );
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
    setAnchorEl(null);
    if (attachmentId) {
      event.stopPropagation();
      axiosInstance()
        .put('attachment/deletemany ', { ids: [attachmentId] })
        .then(({ data }) => {
          setAnchorEl(null);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
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
          message: data.message
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

  const RenderFolderEditMenu = () => {
    return isFolderOptionsOpen ? (
      <Menu
        id="folder-edit-menu"
        anchorEl={folderAnchorEl}
        open={true}
        onClose={handleFolderOptionsClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
      >
        {permissions['attachment']?.isUpdate ? (
          <>
            <MenuItem
              onClick={() => {
                setAttachmentId(currentFolder?._id);
                handleFolderOptionsClose();
                setOpen({
                  open: true,
                  type: currentFolder?.type === 'folder' ? 'folder' : 'file',
                  parentFolder: null,
                  purpose: 'edit'
                });
              }}
            >
              <ListItemIcon style={{ minWidth: '30px' }}>
                <FiEdit2 />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleFolderOptionsClose();
                setOpen({ open: true, type: 'file', parentFolder: currentFolder._id, purpose: 'add' });
              }}
            >
              <ListItemIcon style={{ minWidth: '30px' }}>
                <AiOutlineFileAdd />
              </ListItemIcon>
              <ListItemText>New File</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleFolderOptionsClose();
                setOpen({ open: true, type: 'folder', parentFolder: currentFolder._id, purpose: 'add' });
              }}
            >
              <ListItemIcon style={{ minWidth: '30px' }}>
                <AiOutlineFolderAdd />
              </ListItemIcon>
              <ListItemText>New Folder</ListItemText>
            </MenuItem>
          </>
        ) : null}
        {permissions['attachment']?.isDelete ? (
          <MenuItem
            onClick={() => {
              handleFolderOptionsClose();
              handleFolderDelete(currentFolder._id);
            }}
          >
            <ListItemIcon style={{ minWidth: '30px' }}>
              <AiOutlineDelete />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>
    ) : (
      <></>
    );
  };

  return (
    <Box className="activityDetailBox  attachment">
      {loading ? (
        <ActivityLoader />
      ) : (
        attachments && (
          <>
            {attachments.length ? (
              <Fragment>
                <TreeView defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />}>
                  {attachments}
                </TreeView>
                <ViewAll type="attachment" relatedTo={relatedTo} />
              </Fragment>
            ) : (
              <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
                <Typography variant="subtitle2">No Past Attachment</Typography>
              </Box>
            )}
            <RenderFolderEditMenu />

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
            </Dialog>
          </>
        )
      )}
    </Box>
  );
}
