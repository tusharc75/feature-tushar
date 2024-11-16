import { ListItemIcon, ListItemText } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import SendIcon from '@material-ui/icons/Send';
import moment from 'moment';
import React, { Fragment, ReactNode, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiOutlineDelete, AiOutlineFile } from 'react-icons/ai';
import { FiDownload, FiEdit2 } from 'react-icons/fi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomDialogTransition, dateTimeFormat } from '../../../constants/helpers';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { CreateEmail } from '../Email/CreateEmail';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import ManageAttachment from './ManageAttachment';
import type { TNestedTree } from './helper';
import { sortFileStructure, unflatten } from './helper';
import mime from 'mime';
import { PreviewFile } from 'src/components/PreviewFile';

export default function Attachments({ relatedTo, handleActivityRefresh, onSetCount }) {
  const [open, setOpen] = useState({ open: false, type: 'file', parentFolder: null, purpose: 'add' });
  const [sendMail, setSendMail] = useState(false);
  const [emailAttachment, setEmailAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachmentId, setAttachmentId] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [attachmentData, setAttachmentData] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [treeStructure, setTreeStructure] = useState<TNestedTree[] | null>(null);

  // folderStates
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderAnchorEl, setFolderAnchorEl] = useState<{ anchor: any; position: { left: number; top: number } } | null>(null);
  const isFolderOptionsOpen = Boolean(folderAnchorEl);

  const handleFolderOptionsOpen = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, attachment) => {
    event.stopPropagation();
    setCurrentFolder(attachment);
    setFolderAnchorEl({ anchor: event.currentTarget, position: { left: event.clientX, top: event.clientY } });
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
    let api = `/attachment?graphLookup=1&relatedTo=${JSON.stringify(relatedTo)}`;
    axiosInstance()
      .get(api)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          setTreeStructure(unflatten(data));
          setLoading(false);
          onSetCount('Attachment', count);
        }
      )
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const folderIconButtons = (attachment) => {
    return (
      <div className="flex items-center gap-2">
        <HtmlTooltip title={'Create File'}>
          <IconButton
            size="small"
            color="primary"
            aria-label="create file"
            onClick={(e) => {
              e.stopPropagation();
              setOpen({ open: true, type: 'file', parentFolder: attachment._id, purpose: 'add' });
            }}
          >
            <AddOutlinedIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#2A3042)' }} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={'Create Folder'}>
          <IconButton
            size="small"
            color="primary"
            aria-label="Create Folder"
            onClick={(e) => {
              e.stopPropagation();
              setOpen({ open: true, type: 'folder', parentFolder: attachment._id, purpose: 'add' });
            }}
          >
            <CreateNewFolderIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#2A3042)' }} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={'Send Email'}>
          <IconButton
            size="small"
            color="primary"
            aria-label="send"
            onClick={(e) => {
              e.stopPropagation();
              handleMailForFolder(attachment);
            }}
          >
            <SendIcon color="primary" style={{ maxWidth: '18px' }} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={'Options'}>
          <IconButton
            size="small"
            color="primary"
            aria-label="delete"
            onClick={(event) => {
              event.stopPropagation();
              handleFolderOptionsOpen(event, attachment);
            }}
          >
            <MoreHorizIcon />
          </IconButton>
        </HtmlTooltip>
      </div>
    );
  };

  const fileIconButtons = (attachment) => {
    return permissions['attachment']?.isUpdate || permissions['attachment']?.isDelete ? (
      <div className="flex items-center gap-2">
        <HtmlTooltip title={'Send Email'}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleSendMail(event, attachment);
            }}
          >
            <SendIcon color="primary" style={{ maxWidth: '18px' }} />
          </IconButton>
        </HtmlTooltip>
        <IconButton
          size="small"
          color="primary"
          aria-label="delete"
          onClick={(event) => {
            event.stopPropagation();
            handleOpenMenu(event, attachment._id, attachment);
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </div>
    ) : null;
  };

  const onFileClick = (e: React.MouseEvent<HTMLElement>, attachment) => {
    e.stopPropagation();
    setAttachmentId(attachment._id);
    setOpen({
      open: true,
      type: attachment.type === 'folder' ? 'folder' : 'file',
      parentFolder: null,
      purpose: 'edit'
    });
  };

  const handleOpenMenu = (event, _id, data) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setAttachmentId(_id);
    if (data && data?._id) setAttachmentData(data);
  };
  const handleSendMail = (event, data) => {
    event.stopPropagation();
    handleMail(data);
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
        .put('attachment/deletemany', { ids: [attachmentId] })
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
      .put('attachment/folder/deletemany', { ids: [folderId] })
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

  const handleMail = (data) => {
    const attachments: any = [];
    Promise.all(
      data?.file.map(async (file) => {
        await axiosInstance()
          .get(`user/download?fileName=${encodeURIComponent(file?.url)}`, { responseType: 'blob' })
          .then(({ data }) => {
            let reader = new FileReader();
            reader.readAsDataURL(new Blob([data], { type: mime.getType(file.url.split('.')?.pop()) }));
            reader.onloadend = function () {
              let base64data: any = reader.result;
              attachments.push({
                base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
                contentType: base64data.split(';')[0].split(':')[1],
                extension: `.${file.url.split('.')?.pop()}`,
                name: file.name
              });
            };
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      })
    ).finally(() => {
      setEmailAttachment(attachments);
      setSendMail(true);
    });
  };

  const handleMailForFolder = (data) => {
    const folderId = data?._id;
    const folderName = data?.name;

    axiosInstance()
      .get(`attachment/zip/${folderId}`, { responseType: 'blob' })
      .then(({ data }) => {
        const zipfile = new Blob([data], { type: 'application/zip' });
        generateBase64forFile(zipfile, `${folderName}.zip`, '.zip');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, fileName, extension) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      const attachments = [
        {
          base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
          contentType: base64data.split(';')[0].split(':')[1],
          extension: extension,
          name: fileName
        }
      ];
      setEmailAttachment(attachments);
      setSendMail(true);
    };
  };

  const handleDownload = () => {
    setAnchorEl(null);
    const file = attachmentData?.file;
    if (file?.length === 1) {
      axiosInstance()
        .get(`user/download?fileName=${encodeURIComponent(file[0].url)}`, {
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
      const fileUrl = file.map((f) => encodeURIComponent(f.url));
      axiosInstance()
        .put(`user/download`, { files: fileUrl }, { responseType: 'blob' })
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

  const downloadFolder = (_id, name) => {
    axiosInstance()
      .get(`attachment/zip/${_id}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${name || 'folder'}.zip`);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const CreateMail = () => {
    return (
      <>
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
              relatedTo={relatedTo}
              handleClose={() => {
                setSendMail(false);
                setFullScreen(false);
              }}
              fetchData={() => {
                setSendMail(false);
                setFullScreen(false);
              }}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              isMinimized={!fullScreen}
              showManimizeMaximize={true}
              qouteBuilderAttachments={emailAttachment}
              isQuoteBuilder={true}
            />
          </Dialog>
        )}
      </>
    );
  };

  const RenderFolderEditMenu = () => {
    return isFolderOptionsOpen ? (
      <Menu
        id="folder-edit-menu"
        anchorEl={folderAnchorEl?.anchor}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isFolderOptionsOpen}
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
          </>
        ) : null}
        {permissions['attachment']?.isRead ? (
          <MenuItem
            onClick={() => {
              handleFolderOptionsClose();
              downloadFolder(currentFolder?._id, currentFolder?.name);
            }}
          >
            <ListItemIcon style={{ minWidth: '30px' }}>
              <FiDownload />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
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
        treeStructure && (
          <>
            {treeStructure.length ? (
              <Fragment>
                <RenderTree
                  tree={treeStructure}
                  folderButtons={(data) => folderIconButtons(data)}
                  fileIconButtons={(data) => fileIconButtons(data)}
                  onFileClick={onFileClick}
                  relatedTo={relatedTo}
                />
                <ViewAll type="attachment" relatedTo={relatedTo} />
              </Fragment>
            ) : (
              <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
                <Typography variant="subtitle2">No Past Attachment</Typography>
              </Box>
            )}
            <RenderFolderEditMenu />
            {sendMail && <CreateMail />}

            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              {permissions['attachment']?.isUpdate ? <MenuItem onClick={handleEdit}>Edit</MenuItem> : null}
              {attachmentData && (
                <span onClick={handleCloseMenu}>
                  <PreviewFile fileName={attachmentData?.file[0]?.url} component="MenuItem" />
                </span>
              )}
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

type TRenderTreeProps = {
  tree: TNestedTree[];
  folderButtons: (data: TNestedTree) => ReactNode;
  fileIconButtons: (data: TNestedTree) => ReactNode;
  onFileClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: TNestedTree) => void;
  relatedTo: any;
};

const RenderTree: React.FC<TRenderTreeProps> = ({ tree, folderButtons, fileIconButtons, onFileClick, relatedTo }) => {
  return (
    <Fragment>
      {tree.sort(sortFileStructure).map((node) => {
        if (node.type === 'folder') {
          return (
            <RenderFolder
              key={node._id}
              iconButtons={() => folderButtons(node)}
              node={node}
              childNodes={<RenderTree {...{ tree: node.children, folderButtons, fileIconButtons, onFileClick, relatedTo }} />}
            />
          );
        }
        if (node.type === 'file' || !node.type) {
          return <RenderFiles key={node._id} iconButtons={() => fileIconButtons(node)} node={node} onFileClick={onFileClick} relatedTo={relatedTo} />;
        }
        return null;
      })}
    </Fragment>
  );
};

const className = 'p-[9px_10px] rounded-[4px] shadow-[0px_3.47287px_34.72868px_0px_rgba(0,_0,_0,_0.08)] mb-[16px] dark:[border:1px_solid_#2c3151] ';

type TFolderFilePRops = {
  iconButtons: (data: TNestedTree) => ReactNode;
  node: TNestedTree;
};

type TFolderPRops = {
  childNodes: ReactNode | undefined;
} & TFolderFilePRops;

const RenderFolder: React.FC<TFolderPRops> = ({ iconButtons, node, childNodes }) => {
  const [open, setOpen] = useState(false);

  const toggleTree = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const childrenLength = node.children.length;
  return (
    <div
      className={`${childrenLength ? 'cursor-pointer' : 'cursor-auto'} ${className}`}
      style={{ borderLeft: '3.473px solid #0F9FA9' }}
      onClick={(e) => {
        if (childrenLength) toggleTree(e);
      }}
    >
      <div className="folder_top-section">
        <div className="flex items-center gap-2">
          {childrenLength ? (
            <>
              {open ? (
                <ExpandMoreIcon className={`transition-[opacity_!important] duration-[300ms_!important] ${open ? 'opacity-1' : 'opacity-0'}`} />
              ) : (
                <ChevronRightIcon className={`transition-[opacity_!important] duration-[300ms_!important] ${open ? 'opacity-0' : 'opacity-1'}`} />
              )}
            </>
          ) : null}
          <div className="icon">
            <FolderOpenIcon className="max-w-[18px] text-[ar(--dark-primary-text,#2A3042)]" />
          </div>
          <h6 className=" line-clamp-1 flex-grow text-[14px] font-medium leading-[17px] text-[var(--dark-primary-text,#2A3042)]">
            <span>{` ${node?.name} ${childrenLength ? `(${childrenLength})` : ''}`}</span>
          </h6>
          {iconButtons(node)}
        </div>
        <div className="ml-[27px]">
          <p
            className="mt-2 line-clamp-1 text-[0.8rem] text-[var(--dark-secondary-text,#7b898e)] "
            title={` Created: ${node?.createdBy?.user?.concatedName} ${moment(node?.createdBy?.date).format(dateTimeFormat)}`}
          >
            Created: {node?.createdBy?.user?.concatedName} {moment(node?.createdBy?.date).format(dateTimeFormat)}
          </p>
        </div>
      </div>
      {childNodes ? (
        <Collapse in={open} unmountOnExit>
          <div className="mt-[14px]">{childNodes}</div>
        </Collapse>
      ) : null}
    </div>
  );
};

type TFilePRops = {
  onFileClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: TNestedTree) => void;
  relatedTo: any;
} & TFolderFilePRops;

const RenderFiles: React.FC<TFilePRops> = ({ iconButtons, node, onFileClick, relatedTo }) => {
  return (
    <div
      className={`cursor-pointer ${className}`}
      style={{ borderLeft: '3.473px solid #FFC955' }}
      onClick={(e) => {
        onFileClick(e, node);
      }}
    >
      <div className="folder_top-section">
        <div className="flex items-center gap-2">
          <div className="icon">
            <AiOutlineFile size={18} />
          </div>
          <h6 className=" line-clamp-1 flex-grow text-[14px] font-medium leading-[17px] text-[var(--dark-primary-text,#2A3042)]">
            <span>{node?.name ?? ''}</span>
          </h6>
          {iconButtons(node)}
        </div>
        <div className="ml-[27px]">
          <p
            className="my-2 line-clamp-1 text-[0.8rem]  text-[var(--dark-secondary-text,#7b898e)]"
            title={`Created: ${node?.createdBy?.user?.concatedName} ${moment(node?.createdBy?.date).format(dateTimeFormat)}`}
          >
            Created: {node?.createdBy?.user?.concatedName} {moment(node?.createdBy?.date).format(dateTimeFormat)}
          </p>
          <ListRelatedTo relatedTo={node.relatedTo} originRelatedTo={relatedTo} />
        </div>
      </div>
    </div>
  );
};
