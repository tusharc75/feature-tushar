import { Box, Dialog, IconButton } from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Fragment, useContext, useEffect, useState } from 'react';

import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from './../../StateProvider/Provider';
import axiosInstance from './../../axios/axiosInstance';
import { CustomDialogTransition } from './../../constants/helpers';
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

import CloseIcon from '@material-ui/icons/Close';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import MailIcon from '@material-ui/icons/Mail';
import { isEmpty } from 'lodash';
import { CollaborateIcon } from 'src/assets/svg/svgIcons';
import HtmlTooltip from '../CustomTooltipTitle';

import { AttachmentIcon, CaseIcon, EmailIcon, EventIcon, HistoryIcon, NoteIcon, TaskIcon } from 'src/assets/svg/collaboratorSidebar';

const IconEventMap = {
  Task: <TaskIcon />,
  Event: <EventIcon />,
  Case: <CaseIcon />,
  Note: <NoteIcon />,
  Email: <EmailIcon />,
  Attachment: <AttachmentIcon />
};

const Activity = (props) => {
  const {
    relatedTo,
    extraRelatedTo = null,
    handleActivityRefresh,
    emails = [],
    restrictedAddActivities = [],
    resourceId = '',
    resourceLabel = '',
    resource = '',
    close = () => {}
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

  useEffect(() => {
    const options: any = [];
    ['Task', 'Event', 'Case', 'Note', 'Email', 'Attachment']?.forEach((item) => {
      if (
        (item === 'Event' && permissions?.task?.isRead) ||
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
    if (Boolean(relatedTo[0]?.referenceId) && !countFetched) {
      fetchTotalCounts();
    }
  }, [relatedTo[0]?.referenceId]);

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
      .get(`/activity/resource/count?relatedTo=${JSON.stringify(relatedTo)}`)
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
              className="icon grid h-[34px] w-[37px] place-items-center rounded-[6px] bg-gradient-to-r from-[#FAC94B] to-[rgb(255,155,4)]"
              style={{ backgroundImage: 'linear-gradient(to right, #FAC94B, rgb(255,155,4))' }}
            >
              <CollaborateIcon />
            </div>
            <div>
              <span className=" text-[11px] text-[#8c8c8c] dark:text-[var(--dark-secondary-text)]">Collaborate</span>
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
                    className="flex cursor-pointer items-center gap-4 rounded-[10px] px-[20px] py-[9px] shadow-lg [border:1px_solid_var(--common-border-color)]"
                    onClick={(event) => handleChangeType(event, data)}
                  >
                    <div className="icon-container [&_svg]:block">{IconEventMap[data]}</div>
                    <div className="text-container flex flex-grow">
                      <div className="flex flex-grow flex-wrap items-center">
                        <h6 className={`flex w-full items-center text-[16px] font-semibold leading-[19px] text-[var(--dark-primary-text,#2A3042)]`}>
                          {data}
                          <span className="cursor-pointer">
                            {type === data ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </span>
                        </h6>
                        <p className="text-[14px] font-medium leading-[17px] text-[#767676]">
                          {totalCount[data]} {data}s
                        </p>
                      </div>
                      {data === 'Event' || permissions[data?.toLowerCase()]?.isCreate ? (
                        restrictedAddActivities.indexOf(data) >= 0 ? null : (
                          <div className="flex items-center">
                            {data === 'Attachment' && (
                              <Box mr={1}>
                                <HtmlTooltip title={'Add Folder'} enterTouchDelay={0}>
                                  <IconButton size="small" onClick={(event) => handleCreateActivity(event, 'AttachmentFolder')}>
                                    <CreateNewFolderIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#2A3042)' }} />
                                  </IconButton>
                                </HtmlTooltip>
                              </Box>
                            )}
                            {data === 'Email' && user?.user?.brandPolicy?.inboundEmail && isEmpty(user?.user?.brandPolicy?.inboundEmail) && (
                              <Box mr={1}>
                                <HtmlTooltip
                                  enterTouchDelay={0}
                                  title={`support+${relatedTo[0].type}_${relatedTo[0].referenceId}_${user?.user?.brand}${user?.user?.brandPolicy?.inboundEmail}`}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      emailCopy(
                                        e,
                                        `support+${relatedTo[0].type}_${relatedTo[0].referenceId}_${user?.user?.brand}${user?.user?.brandPolicy?.inboundEmail}`
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
                    <Task relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Event' && data === 'Event' ? (
                    <Event relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Case' && data === 'Case' ? (
                    <Case relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Note' && data === 'Note' ? (
                    <Note relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {type === 'Email' && data === 'Email' ? (
                    <Email relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                  {(type === 'Attachment' || type === 'AttachmentFolder') && data === 'Attachment' ? (
                    <Attachments relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} onSetCount={handleSetCount} />
                  ) : null}
                </Fragment>
              ))}

              {resourceId && resource ? (
                <button
                  className="flex w-full cursor-pointer items-center gap-[20px] rounded-[10px] bg-transparent px-[27px] py-[15px] text-left shadow-lg outline-transparent [border:1px_solid_var(--common-border-color)] focus-within:[outline:2px_solid_var(--new-theme-color)] focus:[outline:2px_solid_var(--new-theme-color)] active:outline-transparent"
                  onClick={() => setShowHistory(true)}
                >
                  <HistoryIcon />
                  <span className="text-[16px] font-semibold leading-[19px] text-[var(--dark-primary-text,#2A3042)]">History</span>
                </button>
              ) : null}

              {relatedTo && relatedTo[0].referenceId ? <Chatter relatedTo={relatedTo} /> : null}
            </div>
          </>
        </Box>
        <Dialog
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          open={open}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              handleClose();
            }
            setFullScreen(false);
          }}
          fullWidth
        >
          {type === 'Task' ? (
            <CreateTask
              taskId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
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
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
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
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
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
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
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
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
              options={emailUsersOptions}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'Attachment' ? (
            <ManageAttachment
              attachmentId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
          {type === 'AttachmentFolder' && (
            <ManageAttachment
              attachmentId={null}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              relatedTo={extraRelatedTo ? [...relatedTo, extraRelatedTo] : relatedTo}
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
