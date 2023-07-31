import { useState, useEffect, Fragment, useContext } from 'react';
import { makeStyles, Dialog, Typography, IconButton, Grid, Box, Button } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { BiTask } from 'react-icons/bi';
import { VscCalendar } from 'react-icons/vsc';
import { BsBriefcase } from 'react-icons/bs';
import { GoNote } from 'react-icons/go';
import { HiOutlineMail } from 'react-icons/hi';
import BiMailSend from 'react-icons/bi';

import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import { AiOutlinePaperClip, AiOutlineHistory } from 'react-icons/ai';
import { Task } from './Task';
import { CreateTask } from './Task/CreateTask';
import { Event } from './Event';
import { CreateEvent } from './Event/CreateEvent';
import { Case } from './Case';
import { CreateCase } from './Case/CreateCase';
import { Note } from './Note';
import { CreateNote } from './Note/CreateNote';
import { Email } from './Email';
import { CreateEmail } from './Email/CreateEmail';
import Attachments from './Attachments/index';
import axiosInstance from './../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageAttachment from './Attachments/ManageAttachment';
import Chatter from './Chatter';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from './../../constants/helpers';
import HistoryDialog from './History/index';
import { useData } from './../../StateProvider/Provider';

import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import CloseIcon from '@material-ui/icons/Close';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import MailIcon from '@material-ui/icons/Mail';
import HtmlTooltip from '../CustomTooltipTitle';
import { camelCase, isEmpty } from 'lodash';
import routes from '../Helpers/Routes';

const useStyles = makeStyles(() => ({
  activityBox: {
    padding: '15px 30px 30px',
    background: 'var(--dark-secondary, #FFFFFF)'
  },
  activitySubBox: {
    display: 'flex',
    padding: '7px 8px',
    margin: '0px 0px 12px',
    cursor: 'pointer',
    background: 'var(--card-bg, #FFF)',
    border: '1px solid var(--dark-mode-border-color, #E7E7E7)',
    boxShadow: '0px 4px 40px rgba(0, 0, 0, 0.04)',
    borderRadius: '4px',
    minHeight: '46px',
    color: 'var(--dark-primary-text,#5B5B5B)',
    '& h6': {
      fontWeight: '500',
      fontSize: '14px',
      lineHeight: '17px',
      color: 'var(--dark-primary-text,#5B5B5B)'
    }
  },
  historyButton: {
    width: '100%',
    padding: '4px'
  },
  detailsHeader: {
    padding: '10px',
    background: 'var(--card-bg, #FFFFFF)',
    borderRadius: '7px 7px 0 0',
    position: 'sticky',
    top: '0px',
    zIndex: 5,
    boxShadow: '0px 4px 40px rgb(0 0 0 / 6%)'
  }
}));

const Activity = (props) => {
  const classes = useStyles();
  const { relatedTo, handleActivityRefresh, emails = [], restrictedAddActivities = [], resourceId = '', resourceLabel = '', resource = '', close = () => { } } = props;
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
  const [infoTitle, setInfoTitle] = useState({
    Task: 'The Tasks are visible to the Assignee and Reporter.',
    Event: 'The Event is visible to all participants.',
    Case: 'The Cases are visible to the Assignee and Reporter.',
    Note: 'The Note is visible to the owner',
    Email: 'The owner has access to the email.',
    Attachment: 'The Attachment is visible to the owner'
  });
  const [showHistory, setShowHistory] = useState(false);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const tabs = ['Task', 'Event', 'Case', 'Note', 'Email', 'Attachment'];

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

  const getIcon = (tab: string) => {
    switch (tab) {
      case 'Task':
        return <BiTask className="mr-2" size={16} />;

      case 'Event':
        return <VscCalendar className="mr-2" size={16} />;

      case 'Case':
        return <BsBriefcase className="mr-2" size={16} />;

      case 'Note':
        return <GoNote className="mr-2" size={16} />;

      case 'Email':
        return <HiOutlineMail className="mr-2" size={16} />;

      case 'Attachment':
        return <AiOutlinePaperClip className="mr-2" size={16} />;
    }
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
        <Box className={`${classes.detailsHeader} `}>
          <h2 className="listingHeader single">
            {`Collaborate - ${routes[resource]?.title || camelCase(resource)} - ${resourceLabel}`}
          </h2>
          <IconButton onClick={() => close()} className="close-icon-v1">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box className={` ${classes.activityBox}`}>
          <>
            {tabs.map((data, index) => (
              <Fragment key={index}>
                <Box className={classes.activitySubBox} onClick={(event) => handleChangeType(event, data)}>
                  <Grid container>
                    <Grid item xs={8}>
                      <Box display="flex" alignItems={'center'}>
                        <Box>
                          <IconButton size="small">{type === data ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                        </Box>
                        <Box ml={1}>
                          <Typography
                            variant="subtitle2"
                            className={`d-flex align-items-center `}
                            style={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px', color: 'var(--dark-primary-text,#5B5B5B)' }}
                          >
                            {getIcon(data)} {data} ({totalCount[data]})
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    {data === 'Event' || permissions[data?.toLowerCase()]?.isCreate ? (
                      restrictedAddActivities.indexOf(data) >= 0 ? null : (
                        <Grid item xs={4} container justify="flex-end" alignItems="center">
                          {data === 'Attachment' && (
                            <Box mr={1}>
                              <HtmlTooltip title={'Add Folder'}>
                                <IconButton size="small" onClick={(event) => handleCreateActivity(event, 'AttachmentFolder')}>
                                  <CreateNewFolderIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#5B5B5B)' }} />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                          )}
                          {data === 'Email' && user?.user?.brandPolicy?.inboundEmail && isEmpty(user?.user?.brandPolicy?.inboundEmail) && (
                            <Box mr={1}>
                              <HtmlTooltip
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
                                  <MailIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#5B5B5B)' }} />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                          )}
                          <Box mr={1}>
                            <HtmlTooltip title={infoTitle[data]}>
                              <InfoOutlinedIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#5B5B5B)' }} />
                            </HtmlTooltip>
                          </Box>
                          <IconButton size="small" onClick={(event) => handleCreateActivity(event, data)}>
                            <AddOutlinedIcon style={{ maxWidth: '18px', color: 'var(--dark-primary-text,#5B5B5B)' }} />
                          </IconButton>
                        </Grid>
                      )
                    ) : null}
                  </Grid>
                </Box>
                <Box>
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
                </Box>
              </Fragment>
            ))}
            {resourceId && resource ? (
              <Box className={classes.activitySubBox}>
                <Button className={classes.historyButton} style={{ width: '100%', padding: '2px' }} onClick={() => setShowHistory(true)}>
                  History
                </Button>
              </Box>
            ) : null}

            {relatedTo && relatedTo[0].referenceId ? <Chatter relatedTo={relatedTo} /> : null}
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
              relatedTo={relatedTo}
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
              relatedTo={relatedTo}
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
              relatedTo={relatedTo}
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
              relatedTo={relatedTo}
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
              relatedTo={relatedTo}
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
              relatedTo={relatedTo}
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
              relatedTo={relatedTo}
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
      {showHistory ? <HistoryDialog open={showHistory} resourceId={resourceId} resource={resource} onClose={() => setShowHistory(false)} /> : null}
    </>
  );
};

export default Activity;
