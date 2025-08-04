import { Box, Collapse, Dialog, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineFile } from "react-icons/ai";
import axiosInstance from "src/axios/axiosInstance";
import { sortFileStructure, TNestedTree, unflattenNew } from "src/components/Activity/Attachments/helper";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import ActivityLoader from "src/components/Helpers/ActivityLoader";
import { CustomDialogTransition, displayDateTime } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { isMobile, isTablet } from "react-device-detect";
import ManageFile from "src/components/Activity/AttachmentsNew/ManageFile";
import ManageFolder from "src/components/Activity/AttachmentsNew/ManageFolder";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useData } from "src/StateProvider/Provider";
import { FiEdit2 } from "react-icons/fi";

const AttachmentsNew = ({ relatedTo, onSetCount }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [treeStructure, setTreeStructure] = useState<TNestedTree[] | null>(null);
  const [open, setOpen] = useState({ open: false, type: '', data: null, isUpdate: false })
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [anchorElFolder, setAnchorElFolder] = useState({ anchor: null, data: null });
  const [anchorElFile, setAnchorElFile] = useState({ anchor: null, data: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let api = `/attachment-new?relatedTo=${JSON.stringify(relatedTo)}`;
    axiosInstance().get(api).then(({ data: { data: { data, count } } }) => {
      setTreeStructure(unflattenNew(data?.length > 0 ? data : []))
      setLoading(false);
      onSetCount('Attachment', count || 0);
    }).catch((error) => {
      setLoading(false);
      toastConfig.setToastConfig(error);
    });
  };

  const handleFolderMenu = (event, attachment) => {
    setAnchorElFolder({ anchor: event.currentTarget, data: attachment });
  };

  const handleFolderMenuClose = () => {
    setAnchorElFolder({ anchor: null, data: null });
  };

  const handleFileMenu = (event, attachment) => {
    setAnchorElFile({ anchor: event.currentTarget, data: attachment });
  };

  const handleFileMenuClose = () => {
    setAnchorElFile({ anchor: null, data: null });
  };

  const handleDelete = (ids) => {
    axiosInstance()
      .put('/attachment-new/remove', { ids: ids })
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
              setOpen({ open: true, type: 'file', data: attachment, isUpdate: false });
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
              setOpen({ open: true, type: 'folder', data: attachment, isUpdate: false });
            }}
          >
            <CreateNewFolderIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#2A3042)' }} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={'Options'}>
          <IconButton
            size="small"
            color="primary"
            aria-label="delete"
            onClick={(event) => {
              event.stopPropagation();
              handleFolderMenu(event, attachment);
            }}
          >
            <MoreHorizIcon />
          </IconButton>
        </HtmlTooltip>
      </div>
    );
  };

  const fileIconButtons = (attachment) => {
    return permissions['attachment']?.isDelete ? (
      <div className="flex items-center gap-2">
        <IconButton
          size="small"
          color="primary"
          aria-label="delete"
          onClick={(event) => {
            event.stopPropagation();
            handleFileMenu(event, attachment);
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </div>
    ) : null;
  };

  const RenderFolderMenu = () => {
    return Boolean(anchorElFolder.anchor) ? (
      <Menu
        id="folder-edit-menu"
        anchorEl={anchorElFolder?.anchor}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorElFolder.anchor)}
        onClose={handleFolderMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
      >
        {permissions['attachment']?.isUpdate && (
          <MenuItem
            onClick={() => {
              setOpen({
                open: true,
                type: 'folder',
                data: anchorElFolder?.data,
                isUpdate: true
              });
              handleFolderMenuClose();
            }}
          >
            <ListItemIcon style={{ minWidth: '30px' }}>
              <FiEdit2 />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}
        {permissions['attachment']?.isDelete && (
          <MenuItem
            onClick={() => {
              handleDelete([anchorElFolder?.data?._id])
              handleFolderMenuClose();
            }}
          >
            <ListItemIcon style={{ minWidth: '30px' }}>
              <AiOutlineDelete />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    ) : (
      <></>
    );
  };

  const RenderFileMenu = () => {
    return Boolean(anchorElFile.anchor) ? (
      <Menu
        id="folder-edit-menu"
        anchorEl={anchorElFile?.anchor}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorElFile.anchor)}
        onClose={handleFileMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
      >
        <MenuItem
          onClick={() => {
            handleDelete([anchorElFile?.data?._id])
            handleFileMenuClose();
          }}
        >
          <ListItemIcon style={{ minWidth: '30px' }}>
            <AiOutlineDelete />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    ) : (
      <></>
    );
  };

  return (
    <Box className="activityDetailBox  attachment">
      {
        loading ? (
          <ActivityLoader />
        ) : (
          <>
            {treeStructure && treeStructure?.length > 0 ? (
              <>
                <RenderTree
                  tree={treeStructure}
                  folderButtons={(data) => folderIconButtons(data)}
                  fileButtons={(data) => fileIconButtons(data)}
                />
              </>
            ) : (
              <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
                <Typography variant="subtitle2">No Past Attachment</Typography>
              </Box>
            )}
            <RenderFolderMenu />
            <RenderFileMenu />
          </>
        )
      }
      <Dialog
        open={open.open}
        aria-labelledby="customized-dialog-title"
        maxWidth={open?.type === 'file' ? 'md' : 'xs'}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {

          }
        }}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        {open?.type === 'file' && (
          <ManageFile
            onClose={() => {
              setOpen({ open: false, type: '', data: null, isUpdate: false });
              setFullScreen(false);
            }}
            onSuccess={() => {
              fetchData()
              setOpen({ open: false, type: '', data: null, isUpdate: false });
              setFullScreen(false);
            }}
            relatedTo={relatedTo}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            parentId={open.data?._id}
          />
        )}
        {open?.type === 'folder' && (
          <ManageFolder
            onClose={() => {
              setOpen({ open: false, type: '', data: null, isUpdate: false });
              setFullScreen(false);
            }}
            onSuccess={() => {
              fetchData()
              setOpen({ open: false, type: '', data: null, isUpdate: false });
              setFullScreen(false);
            }}
            relatedTo={relatedTo}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            folderData={open.data}
            isRename={open?.isUpdate}
          />
        )}
      </Dialog>
    </Box >
  )

}

export default AttachmentsNew;

const RenderTree = ({ tree, folderButtons, fileButtons }) => {
  return (
    <>
      {tree.sort(sortFileStructure).map((node) => {
        if (node.type === 'folder') {
          return (
            <RenderFolder
              key={node._id}
              node={node}
              iconButtons={() => folderButtons(node)}
              childNodes={<RenderTree {...{ tree: node.children, folderButtons, fileButtons }} />}
            />
          );
        }
        if (node.type === 'file' || !node.type) {
          return <RenderFiles key={node._id} node={node} iconButtons={() => fileButtons(node)} />;
        }
        return null;
      })}
    </>
  );
};

const className = 'p-[9px_10px] rounded-[4px] shadow-[0px_3.47287px_34.72868px_0px_rgba(0,_0,_0,_0.08)] mb-[16px] dark:[border:1px_solid_#2c3151] ';

const RenderFolder = ({ node, iconButtons, childNodes }) => {
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
            title={` Created: ${node?.createdBy?.user?.concatedName} ${displayDateTime(node?.createdBy?.date)}`}
          >
            Created: {node?.createdBy?.user?.concatedName} {displayDateTime(node?.createdBy?.date)}
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

const RenderFiles = ({ node, iconButtons }) => {
  return (
    <div
      className={`${className}`}
      style={{ borderLeft: '3.473px solid #FFC955' }}
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
            title={`Created: ${node?.createdBy?.user?.concatedName} ${displayDateTime(node?.createdBy?.date)}`}
          >
            Created: {node?.createdBy?.user?.concatedName} {displayDateTime(node?.createdBy?.date)}
          </p>
        </div>
      </div>
    </div>
  );
};
