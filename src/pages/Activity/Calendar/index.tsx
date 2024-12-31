import { Box, ClickAwayListener, Dialog, Grow, MenuItem, MenuList, Paper, Popper, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import axios, { CancelTokenSource } from 'axios';
import { lowerCase, startCase } from 'lodash';
import queryString from 'query-string';
import React, { useCallback, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiTask } from 'react-icons/bi';
import { BsBriefcase } from 'react-icons/bs';
import { VscCalendar } from 'react-icons/vsc';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import ActivityModelHandler from '../../../components/Activity/ActivityModelHandler';
import { CreateCase } from '../../../components/Activity/Case/CreateCase';
import { CreateEvent } from '../../../components/Activity/Event/CreateEvent';
import { CreateTask } from '../../../components/Activity/Task/CreateTask';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import routes from '../../../components/Helpers/Routes';
import { SearchFilter } from '../../../components/SearchFilter';
import { CustomDialogTransition } from '../../../constants/helpers';
import MyCalendar from './MyCalendar';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const useStyles = makeStyles((theme: Theme) => ({
  topbar: {
    backgroundColor: 'var(--dark-primary,#fff)'
  },

  indicators: {
    padding: '8px 5px',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '17px'
  }
}));

const BigCalendar = () => {
  const classes = useStyles();
  const {
    state: {
      user: { user },
      resources
    }
  } = useData();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId, type: actType } = parsed;
  const [type] = useState(actType ? startCase(actType.toLocaleString()) : '');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createType, setCreateType] = useState(null);
  const [filter, setFilter] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activities, setActivities] = useState({ activities: [], loading: true });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    if (referenceType) {
      axiosInstance()
        .get(`/activity/referenceName?referenceType=${referenceType}&referenceId=${referenceId}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {});
    } else {
      setFilter([]);
    }
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, referenceId]);

  const fetchBoard = useCallback(
    (cancelTokenSource?: CancelTokenSource) => {
      setActivities({ activities: [], loading: true });
      axiosInstance()
        .get(`/activity/board?type=${''}&filter=${JSON.stringify(filter)}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          const allActivities = [...data.event, ...data.task, ...data.case];
          const newData = allActivities.map((d) => ({
            ...d,
            title: d.name,
            start: d.startDate,
            end: d.dueDate,
            allDay: true,
            type: d.type
          }));
          setActivities({ activities: newData, loading: false });
        })
        .catch(() => {});
    },
    [type, filter]
  );

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchBoard(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [fetchBoard]);

  const activityOptions = [
    {
      title: 'Task',
      icon: <BiTask />
    },
    {
      title: 'Case',
      icon: <BsBriefcase />
    },
    {
      title: 'Event',
      icon: <VscCalendar />
    }
  ];

  const handleChangeFilter = (value) => {
    setFilter(value);
    history.replace({
      search: ''
    });
  };

  const closeDialog = () => {
    setCreateType(null);
    fetchBoard();
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.calendar?.titlePlural }]} />
      </div>
      <CustomContainer>
        {filter && (
          <>
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <ThemeButton aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} buttonType="theme">
                    Create Activity
                  </ThemeButton>
                  <div className="flex flex-wrap gap-2">
                    {['Event', 'Task', 'Case'].map((item) => (
                      <>
                        <Box
                          key={item}
                          className={`${classes.indicators} flex items-center gap-1 
                          ${item === 'Event' ? 'text-[rgba(236,_85,_0,_1))] ' : ''}
                          ${item === 'Task' ? 'text-[var(--task-color,_rgba(4,_50,_161,_1))] ' : ''}
                          ${item === 'Case' ? 'text-[rgba(165,_4,_43,_1)] ' : ''}
                          `}
                        >
                          <Box
                            className={`h-[12px] w-[12px] 
                            ${item === 'Event' ? 'bg-[rgba(236,_85,_0,_1)] ' : ''}
                            ${item === 'Task' ? 'bg-[var(--task-color,_rgba(4,_50,_161,_1))] ' : ''}
                            ${item === 'Case' ? 'bg-[rgba(165,_4,_43,_1)] ' : ''}
                            `}
                          />
                          {item}
                        </Box>
                      </>
                    ))}
                  </div>
                </div>
                <Popper
                  id="simple-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  role={undefined}
                  transition
                  disablePortal
                  style={{ zIndex: 10 }}
                >
                  {({ TransitionProps, placement }) => (
                    <Grow
                      {...TransitionProps}
                      style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
                      }}
                    >
                      <Paper>
                        <ClickAwayListener onClickAway={handleClose}>
                          <MenuList autoFocusItem={Boolean(anchorEl)}>
                            {activityOptions.map((item, i) => (
                              <MenuItem
                                key={i}
                                onClick={() => {
                                  setCreateType(lowerCase(item.title));
                                  handleClose();
                                }}
                              >
                                {item.icon}
                                <span className="ml-2"></span>
                                {item.title}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Grow>
                  )}
                </Popper>
              </div>
              <div className="ml-auto min-w-[250px] flex-grow md:flex-grow-0">
                <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} activityName="calendar" />
              </div>
            </div>
            <MyCalendar activities={activities.activities} setActivityData={setActivityData} loading={activities.loading} />
          </>
        )}
        {activityData && (
          <ActivityModelHandler
            fetchBoard={fetchBoard}
            setActivityData={setActivityData}
            activityType={activityData.type}
            activityId={activityData.id}
          />
        )}
        {createType && (
          <Dialog
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            open={true}
            fullWidth
            maxWidth="md"
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleClose();
                setFullScreen(false);
              }
            }}
          >
            {createType === 'task' && (
              <CreateTask
                taskId={null}
                relatedTo={[
                  {
                    type: 'user',
                    referenceId: user._id,
                    access: true
                  }
                ]}
                handleClose={() => {
                  closeDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            )}
            {createType === 'case' && (
              <CreateCase
                caseId={null}
                relatedTo={[{ type: 'user', referenceId: user._id, access: true }]}
                handleClose={() => {
                  closeDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            )}
            {createType === 'event' && (
              <CreateEvent
                eventId={null}
                relatedTo={[
                  {
                    type: 'user',
                    referenceId: user._id,
                    access: true
                  }
                ]}
                handleClose={() => {
                  closeDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            )}
          </Dialog>
        )}
      </CustomContainer>
    </section>
  );
};

export default BigCalendar;
