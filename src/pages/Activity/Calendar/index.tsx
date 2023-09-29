import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Button, Dialog, Grid, MenuItem, Popper, Grow, Paper, ClickAwayListener, MenuList } from '@material-ui/core';
import { lowerCase, startCase } from 'lodash';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import MyCalendar from './MyCalendar';
import { GetBoard } from '../../../axios/activity';
import CustomContainer from '../../../components/CustomContainer';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import { SearchFilter } from '../../../components/Activity/Report/SearchFilter';
import ActivityModelHandler from '../../../components/Activity/ActivityModelHandler';
import { useData } from '../../../StateProvider/Provider';
import { CreateTask } from '../../../components/Activity/Task/CreateTask';
import { CreateCase } from '../../../components/Activity/Case/CreateCase';
import { CreateEvent } from '../../../components/Activity/Event/CreateEvent';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomDialogTransition } from '../../../constants/helpers';
import { BiTask } from 'react-icons/bi';
import { BsBriefcase } from 'react-icons/bs';
import { VscCalendar } from 'react-icons/vsc';
import routes from '../../../components/Helpers/Routes';
import styles from '../../Leads/Header.module.scss';
import { GetReferenceName } from '../../../axios/activity';

const useStyles = makeStyles((theme) => ({
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
      user: { user }
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
  const [activities, setActivities] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {});
    } else {
      setFilter([]);
    }
  }, [type, referenceId]);

  const fetchBoard = useCallback(() => {
    GetBoard('', JSON.stringify(filter))
      .then(({ data }) => {
        const allActivities = [...data.event, ...data.task, ...data.case];
        const newData = allActivities.map((d) => ({
          ...d,
          title: d.name,
          start: d.startDate,
          end: d.dueDate,
          allDay: true,
          type: d.type
        }));
        setActivities(newData);
      })
      .catch(() => {});
  }, [type, filter]);

  useEffect(() => {
    fetchBoard();
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

  // const get;

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.calendar.title }]} />
      </div>
      <CustomContainer>
        {filter && (
          <>
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} size="small" color="primary" variant="contained">
                    Create Activity
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {['Event', 'Task', 'Case'].map((item) => (
                      <>
                        <Box
                          key={item}
                          // bgcolor={
                          // item === 'Event'
                          //   ? 'var(--dark-primary,rgba(255, 232, 204, 1))'
                          //   : item === 'Task'
                          //   ? 'var(--dark-primary,rgba(234, 239, 254, 1))'
                          //   : 'var(--dark-primary,rgba(253, 220, 228, 1))'
                          // }
                          className={`${classes.indicators} flex items-center gap-1`}
                          style={{
                            color: `${
                              item === 'Event'
                                ? 'rgba(236, 85, 0, 1)'
                                : item === 'Task'
                                ? 'var(--dark-secondary-text,rgba(4, 50, 161, 1))'
                                : 'rgba(165, 4, 43, 1)'
                            }`
                          }}
                        >
                          <Box
                            className="w-[12px] h-[12px]"
                            bgcolor={
                              item === 'Event'
                                ? 'rgba(236, 85, 0, 1)'
                                : item === 'Task'
                                ? 'var(--dark-secondary-text,rgba(4, 50, 161, 1))'
                                : 'rgba(165, 4, 43, 1)'
                            }
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
              <div className="ml-auto min-w-[250px] md:flex-grow-0 flex-grow">
                <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} activityName="calendar" />
              </div>
            </div>
            <MyCalendar activities={activities} setActivityData={setActivityData} />
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
