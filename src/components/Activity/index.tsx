import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MailIcon from '@mui/icons-material/Mail';
import { Box, Dialog, IconButton } from '@mui/material';
import { isEmpty, isObject } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { HistoryIcon, getCollaborateIconBasedOnName } from 'src/assets/svg/CollaborateSidebar';
import { CollaborateIcon } from 'src/assets/svg/svgIcons';
import Collaborate from 'src/components/Activity/Collaborate';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../CustomTooltipTitle';
import { useData } from './../../StateProvider/Provider';
import axiosInstance from './../../axios/axiosInstance';
import { ACTIVITY_RESOURCE, CustomDialogTransition } from './../../constants/helpers';
import ManageAttachment from './Attachments/ManageAttachment';
import Attachments from './Attachments/index';
import { Case } from './Case';
import { CreateCase } from './Case/CreateCase';
import Chatter from './Chatter';
import { Email } from './Email';
import { CreateEmail } from './Email/CreateEmail';
import { Event } from './Event';
import { CreateEvent } from './Event/CreateEvent';
import HistoryDialog from './History/index';
import { Note } from './Note';
import { CreateNote } from './Note/CreateNote';
import { Task } from './Task';
import { CreateTask } from './Task/CreateTask';
import ManageFile from 'src/components/Activity/AttachmentsNew/ManageFile';
import AttachmentsNew from 'src/components/Activity/AttachmentsNew';
import ManageFolder from 'src/components/Activity/AttachmentsNew/ManageFolder';

const Activity = (props) => {
  const {
    relatedTo,
    extraRelatedTo = null,
    handleActivityRefresh,
    emails = [],
    restrictedAddActivities = [],
    resourceId = '',
    resourceLabel = '',
    resourceData = null,
    resource = '',
    close = () => { }
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [emailUsersOptions, setEmailUsersOptions] = useState([]);
  const [countFetched, setCountFetched] = useState(false);
  const [totalCount, setTotalCount] = useState({
    Task: 0,
    Event: 0,
    Case: 0,
    Note: 0,
    Email: 0,
    Attachment: 0
  });

  const [showHistory, setShowHistory] = useState(false);
  const {
    state: { permissions, user }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [tabs, setTabs] = useState([]);
  const [viewRelatedTo, setViewRelatedTo] = useState([]);
  const [addRelatedTo, setAddRelatedTo] = useState([]);

  useEffect(() => {
    let addTemprelated = [...relatedTo];
    let addViewrelated = [...relatedTo];
    if (extraRelatedTo && isObject(extraRelatedTo)) {
      addTemprelated = [...addTemprelated, extraRelatedTo];
    }
    if ([ACTIVITY_RESOURCE.fieldTicket]?.includes(resource)) {
      if (extraRelatedTo && isObject(extraRelatedTo)) {
        addViewrelated = [...addViewrelated, extraRelatedTo];
      }
    }
    setViewRelatedTo(addViewrelated);
    setAddRelatedTo(addTemprelated);
  }, [relatedTo]);

  useEffect(() => {
    const options: any = [];
    ['Task', 'Event', 'Case', 'Note', 'Email', 'Attachment', 'Collaborate']?.forEach((item) => {
      if (
        (item === 'Event' && permissions?.task?.isRead) ||
        (item === 'Collaborate' && permissions?.workSpace?.isRead) ||
        (permissions[item?.toLowerCase()] && permissions[item?.toLowerCase()]?.isRead === true)
      ) {
        options.push(item);
      }
    });
    setTabs(options);
  }, []);

  useEffect(() => {
    fetchUsersEmails();
  }, []);

  useEffect(() => {
    if (Boolean(viewRelatedTo[0]?.referenceId) && !countFetched) {
      fetchTotalCounts();
    }
  }, [viewRelatedTo[0]?.referenceId]);

  useEffect(() => {
    let data = [];
    if (emails && emails.length) {
      emails.forEach((curEmail) => {
        if (curEmail && emailUsersOptions.indexOf(curEmail) < 0) data.push(curEmail);
      });
      setEmailUsersOptions((prevState) => {
        return [...prevState, ...data];
      });
    }
  }, [emails]);

  const fetchTotalCounts = () => {
    axiosInstance()
      .get(`/activity/resource/count?relatedTo=${JSON.stringify(viewRelatedTo)}`)
      .then(({ data: { data } }) => {
        setTotalCount(data);
        setCountFetched(true);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleChangeType = (event, data) => {
    event.stopPropagation();
    if (data === type) {
      setType(null);
    } else {
      setType(data);
    }
  };

  const handleCreateActivity = (event, data) => {
    event.stopPropagation();
    setType(data);
    setOpen(true);
  };

  const handleClose = () => {
    let temptype = type;
    setType(null);
    setOpen(false);
    setType(temptype);
    handleActivityRefresh();
  };

  const fetchUsersEmails = () => {
    axiosInstance()
      .get('/user')
      .then(({ data: { data, count } }) => {
        data = data.reduce((emails, obj) => {
          if (obj?.email && emailUsersOptions.indexOf(obj.email) < 0) emails.push(obj.email);
          return emails;
        }, []);
        setEmailUsersOptions((prevState) => {
          return [...prevState, ...data];
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSetCount = (name, count) => {
    if (name) {
      setTotalCount((prevState) => ({ ...prevState, [name]: count }));
    }
  };

  const emailCopy = async (e, text) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    toastConfig.setToastConfig({
      type: 'success',
      open: true,
      message: 'Email copied to clipboard'
    });
  };

  return (
    <>
      <Box>
        <Box
          className={`sticky top-0 z-[5] rounded-[7px_7px_0_0] bg-[var(--card-bg,#FFFFFF)] p-[14px_20px_16px_20px] [border-bottom:1px_solid_var(--common-border-color)]`}
        >
          <div className="flex items-center gap-[14px]">
            <div
              className="icon grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-gradient-to-r from-[#FAC94B] to-[rgb(255,155,4)]"
              style={{ backgroundImage: 'linear-gradient(to right, #FAC94B, rgb(255,155,4))' }}
            >
              <CollaborateIcon />
            </div>
            <div>
              <span className=" text-[11px] text-[#8c8c8c] dark:text-[var(--dark-secondary-text)]">Workspace</span>
              <h2 className=" truncate text-sm text-[var(--dark-primary-text,#2A3042)] md:text-[15px]">{resourceLabel}</h2>
            </div>
          </div>
          <IconButton onClick={() => close()} className="close-icon-v1">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box className={` bg-[var(--dark-secondary,#FFFFFF)] p-[18px_20px_30px]`}>
          <>
            <div className="space-y-4">
              {tabs.map((data, index) => (
                <Fragment key={index}>
                  <div
                    className="flex cursor-pointer items-center gap-3 rounded-[10px] px-[20px] py-[9px] shadow-lg [border:1px_solid_var(--common-border-color)]"
                    onClick={(event) => handleChangeType(event, data)}
                  >
                    <div className="icon-container max-w-[25px] [&_svg]:block">{getCollaborateIconBasedOnName(data)}</div>
                    <div className="text-container flex flex-grow">
                      <h6 className={`flex w-full items-center text-[16px] font-semibold leading-[19px] text-[var(--dark-primary-text,#2A3042)]`}>
                        {data}
                        {data != 'Collaborate' && <span className="ml-[2px] text-[12px] text-gray-500">({totalCount[data]})</span>}
                        <span className="cursor-pointer">
                          {type === data ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </span>
                      </h6>

                      {data === 'Event' || permissions[data?.toLowerCase()]?.isCreate ? (
                        restrictedAddActivities.indexOf(data) >= 0 ? null : (
                          <div className="flex items-center">
                            {data === 'Attachment' && (
                              <Box mr={1}>
                                <HtmlTooltip title={'Add Folder'}>
                                  <IconButton size="small" onClick={(event) => handleCreateActivity(event, 'AttachmentFolder')}>
                                    <CreateNewFolderIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#2A3042)' }} />
                                  </IconButton>
                                </HtmlTooltip>
                              </Box>
                            )}
                            {data === 'Email' && user?.user?.brandPolicy?.inboundEmail && isEmpty(user?.user?.brandPolicy?.inboundEmail) && (
                              <Box mr={1}>
                                <HtmlTooltip
                                  title={`support+${viewRelatedTo[0].type}_${viewRelatedTo[0].referenceId}_${user?.user?.brand}${user?.user?.brandPolicy?.inboundEmail}`}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      emailCopy(
                                        e,
                                        `support+${viewRelatedTo[0].type}_${viewRelatedTo[0].referenceId}_${user?.user?.brand}${user?.user?.brandPolicy?.inboundEmail}`
                                      );
                                    }}
                                  >
                                    <MailIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#2A3042)' }} />
                                  </IconButton>
                                </HtmlTooltip>
                              </Box>
                            )}
                            <IconButton size="small" onClick={(event) => handleCreateActivity(event, data)}>
                              <AddOutlinedIcon style={{ maxWidth: '20px', color: 'var(--dark-primary-text,#2A3042)' }} />
                            </IconButton>
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>

                  {type === 'Task' && data === 'Task' ? (
                    <Task relatedTo={viewRelatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Event' && data === 'Event' ? (
                    <Event relatedTo={viewRelatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Case' && data === 'Case' ? (
                    <Case relatedTo={viewRelatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Note' && data === 'Note' ? (
                    <Note relatedTo={viewRelatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Email' && data === 'Email' ? (
                    <Email relatedTo={viewRelatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {(type === 'Attachment' || type === 'AttachmentFolder') && data === 'Attachment' && import.meta.env.VITE_APP_ATTACHMENT != 'new' ? (
                    <Attachments relatedTo={viewRelatedTo} resourceLabel={resourceLabel} resource={resource} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {(type === 'Attachment' || type === 'AttachmentFolder') && data === 'Attachment' && import.meta.env.VITE_APP_ATTACHMENT === 'new' ? (
                    <AttachmentsNew relatedTo={[{ resource: resource, referenceId: resourceId, label: resourceLabel, access: true }]} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Collaborate' && data === 'Collaborate' ? (
                    <Collaborate resource={resource} resourceLabel={resourceLabel} resourceData={resourceData} />
                  ) : null}
                </Fragment>
              ))}
              {relatedTo && relatedTo[0].referenceId ? <Chatter relatedTo={relatedTo} /> : null}
              {resourceId && resource ? (
                <button
                  className="flex w-full cursor-pointer items-center gap-[10px] rounded-[10px] bg-transparent px-[20px] py-[15px] text-left shadow-lg outline-transparent [border:1px_solid_var(--common-border-color)] focus-within:[outline:2px_solid_var(--new-theme-color)] focus:[outline:2px_solid_var(--new-theme-color)] active:outline-transparent"
                  onClick={() => setShowHistory(true)}
                >
                  <span className="max-h-[25px] max-w-[25px]">
                    <HistoryIcon />
                  </span>
                  <span className="text-[16px] font-semibold leading-[19px] text-[var(--dark-primary-text,#2A3042)]">History</span>
                </button>
              ) : null}
            </div>
          </>
        </Box>
        <Dialog
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          open={open}
          aria-labelledby="customized-dialog-title"
          maxWidth={type === 'AttachmentFolder' && import.meta.env.VITE_APP_ATTACHMENT === 'new' ? 'xs' : 'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              handleClose();
            }
            setFullScreen(false);
          }}
          fullWidth
          disableEnforceFocus={true}
        >
          {type === 'Task' ? (
            <CreateTask
              taskId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'Event' ? (
            <CreateEvent
              eventId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              email={emails}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'Case' ? (
            <CreateCase
              caseId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'Note' ? (
            <CreateNote
              noteId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              handleDialogClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'Email' ? (
            <CreateEmail
              emailId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'AttachmentFolder' && import.meta.env.VITE_APP_ATTACHMENT === 'new' && (
            <ManageFolder
              onClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              onSuccess={() => {
                handleClose()
                setFullScreen(false);
              }}
              relatedTo={[{ resource: resource, referenceId: resourceId, label: resourceLabel, access: true }]}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          )}
          {type === 'Attachment' && import.meta.env.VITE_APP_ATTACHMENT === 'new' && (
            <ManageFile
              onClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              onSuccess={() => {
                handleClose()
                setFullScreen(false);
              }}
              relatedTo={[{ resource: resource, referenceId: resourceId, label: resourceLabel, access: true }]}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          )}
          {type === 'Attachment' && import.meta.env.VITE_APP_ATTACHMENT != 'new' ? (
            <ManageAttachment
              attachmentId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'AttachmentFolder' && import.meta.env.VITE_APP_ATTACHMENT != 'new' && (
            <ManageAttachment
              attachmentId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={addRelatedTo}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              type="folder"
            />
          )}
        </Dialog>
      </Box>
      {showHistory ? (
        <HistoryDialog
          open={showHistory}
          resourceLabel={resourceLabel}
          resourceId={resourceId}
          resource={resource}
          onClose={() => setShowHistory(false)}
        />
      ) : null}
    </>
  );
};

export default Activity;
