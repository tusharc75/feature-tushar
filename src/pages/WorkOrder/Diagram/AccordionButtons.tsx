import { Delete, MoreVert } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import GetAppIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import { IconButton, ListItemIcon, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { FileCopyIcon } from 'src/assets/svg/svgIcons';
import AttachmentDeleteButton from 'src/components/Activity/Attachments/AttachmentDeleteButton';
import DeleteRequest from 'src/components/Activity/Attachments/DeleteRequest';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDate } from 'src/constants/helpers';

const AccordionButtons = ({ file, downloadZip, setSendMail, handleMail, disableEdit, setAttachemntDialog, setSelectedAttachment, fetchData }) => {
  const mobileMedia = useMediaQuery('(max-width:768px)');
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const buttonProps = [
    {
      tooltip: (
        <div className="flex flex-col p-2">
          <p>
            Uploaded By: <span>{file?.createdBy?.user?.concatedName}</span>
          </p>
          <p>
            Uploaded Date: <span>{displayDate(file?.createdBy?.date)}</span>
          </p>
        </div>
      ),
      label: 'Info',
      onClick: () => {},
      disable: false,
      visible: true,
      icon: InfoIcon
    },
    {
      tooltip: 'Download',
      label: 'Download',
      onClick: (e: any) => {
        e.stopPropagation();
        downloadZip(file?._id, file?.name);
      },
      disable: false,
      visible: true,
      icon: GetAppIcon
    },
    {
      tooltip: 'Send Email',
      label: 'Send Email',
      onClick: (e: any) => {
        e.stopPropagation();
        setSendMail(true);
        handleMail(file);
      },
      disable: false,
      visible: true,
      icon: SendIcon
    },
    {
      tooltip: 'Edit',
      label: 'Edit',
      onClick: (e: any) => {
        e.stopPropagation();
        setAttachemntDialog({ open: true, file: file, isClone: false });
      },
      disable: !file?.canEdit,
      visible: !disableEdit,
      icon: EditIcon
    },
    {
      tooltip: 'Clone',
      label: 'Clone',
      onClick: (e: any) => {
        e.stopPropagation();
        setAttachemntDialog({ open: true, file: file, isClone: true });
      },
      disable: false,
      visible: !disableEdit,
      icon: FileCopyIcon
    }
  ];

  if (mobileMedia) {
    return (
      <div className="pointer-events-auto flex gap-2">
        {!disableEdit && (
          <DeleteRequest
            file={file}
            handleSucess={() => {
              fetchData();
            }}
          />
        )}
        <IconButton size="small" color="primary" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVert fontSize="small" />
        </IconButton>
        <Menu
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
        >
          {buttonProps.map(({ visible, tooltip, icon: Icon, label, ...rest }) => {
            if (!visible) return null;
            return (
              <MenuItem {...rest}>
                <ListItemIcon>
                  <Icon fontSize="small" color="primary" className="text-[--primary]" />
                </ListItemIcon>
                {label}
              </MenuItem>
            );
          })}
          {!disableEdit && (
            <AttachmentDeleteButton
              attachments={[file]}
              onSuccess={() => {
                setSelectedAttachment(null);
                fetchData();
              }}
              element={MenuItem}
            >
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              Delete
            </AttachmentDeleteButton>
          )}
        </Menu>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex gap-2">
      {buttonProps.map(({ visible, tooltip, icon: Icon, ...rest }) => {
        if (!visible) return null;
        return (
          <HtmlTooltip title={tooltip}>
            <IconButton size="small" color="primary" {...rest}>
              <Icon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        );
      })}
      {!disableEdit && (
        <>
          <AttachmentDeleteButton
            attachments={[file]}
            onSuccess={() => {
              setSelectedAttachment(null);
              fetchData();
            }}
          />
          <DeleteRequest
            file={file}
            handleSucess={() => {
              fetchData();
            }}
          />
        </>
      )}
    </div>
  );
};

export default AccordionButtons;
