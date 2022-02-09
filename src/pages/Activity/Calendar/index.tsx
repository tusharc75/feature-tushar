import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box,
  Button,
  Dialog,
  Grid,
  MenuItem,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
} from "@material-ui/core";
import { lowerCase, startCase } from "lodash";
import { useHistory } from "react-router-dom";
import queryString from "query-string";
import { isMobile, isTablet } from "react-device-detect";
import MyCalendar from "./MyCalendar";
import { GetBoard } from "../../../axios/activity";
import CustomContainer from "../../../components/CustomContainer";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";
import { useData } from "../../../StateProvider/Provider";
import { CreateTask } from "../../../components/Activity/Task/CreateTask";
import { CreateCase } from "../../../components/Activity/Case/CreateCase";
import { CreateEvent } from "../../../components/Activity/Event/CreateEvent";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomDialogTransition } from "../../../constants/helpers";
import { BiTask } from "react-icons/bi";
import { BsBriefcase } from "react-icons/bs";
import { VscCalendar } from "react-icons/vsc";
import routes from "../../../components/Helpers/Routes";
import styles from "../../Leads/Header.module.scss";

const BigCalendar = () => {
  const {
    state: {
      user: {user},
    },
  } = useData();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId, type: actType } = parsed;
  const [type,] = useState(
    actType ? startCase(actType.toLocaleString()) : ""
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createType, setCreateType] = useState(null);
  const [filter, setFilter] = useState([]);
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
    if (referenceType && referenceId) {
      axiosInstance()
        .get(
          `/activity/referenceName?referenceType=${referenceType}&referenceId=${referenceId}`
        )
        .then(({ data: { data } }) => {
          setFilter([
            { _id: referenceId, type: referenceType, name: data.name },
          ]);
        })
        .catch((err) => { });
    }
  }, []);

  const joinTime = (date: any, time: any) => {
    const d = new Date(date).toISOString().split("T")[0];
    const t = new Date(time).toISOString().split("T")[1];

    return new Date(`${d}T${t}`);
  };

  const fetchBoard = useCallback(() => {
    GetBoard("", JSON.stringify(filter))
      .then(({ data }) => {
        const allActivities = [...data.event, ...data.task, ...data.case];

        const newData = allActivities.map((d) => ({
          ...d,
          title: d.name,
          start: d.hasOwnProperty("startTime")
            ? joinTime(d.startDate, d.startTime)
            : new Date(d.startDate),

          end: d.hasOwnProperty("endTime")
            ? joinTime(d.endDate, d.endTime)
            : new Date(d.dueDate),
        }));

        setActivities(newData);
      })
      .catch(() => { });
  }, [type, filter]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const activityOptions = [
    {
      title: "Task",
      icon: <BiTask />,
    },
    {
      title: "Case",
      icon: <BsBriefcase />,
    },
    {
      title: "Event",
      icon: <VscCalendar />,
    },
  ];

  const handleChangeFilter = (value) => {
    setFilter(value);
    history.replace({
      search: "",
    });
  };

  const closeDialog = () => {
    setCreateType(null);
    fetchBoard();
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[{ title: routes.calendar.title }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="bgLight">
          <Grid container className="greyBox">
            <Grid item xs={12} sm={5}>
              <Box display="flex" alignItems="center">
                <Button
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={handleClick}
                  size="small"
                  color="primary"
                  variant="contained"
                >
                  Create Activity
                </Button>
                <Box component="span" mx={1} />
                {["Event", "Task", "Case"].map((item) => (
                  <>
                    <Box display="flex">
                      {item} <Box component="span" ml={1} />
                      <Box
                        width={16}
                        height={16}
                        bgcolor={
                          item === "Event"
                            ? "#E65100"
                            : item === "Task"
                              ? "#3949AB"
                              : "#BF360C"
                        }
                        borderRadius={50}
                      />
                    </Box>
                    <Box component="span" ml={1} />
                  </>
                ))}
              </Box>
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
                      transformOrigin:
                        placement === "bottom" ? "center top" : "center bottom",
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
            </Grid>
            <Grid item xs={12} sm={7} className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} style={{ width: '100%' }}>
              <SearchFilter
                handleChangeFilter={handleChangeFilter}
                filter={filter}
                chip={{ size: "small" }}
                activityName="calendar"
              />
            </Grid>
          </Grid>
          <MyCalendar
            activities={activities}
            setActivityData={setActivityData}
          />
        </div>
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
            fullScreen={fullScreen || (isMobile || isTablet)}
            TransitionComponent={CustomDialogTransition}
            open={true}
            fullWidth
            maxWidth="md"
            onClose={() => {
              closeDialog()
              setFullScreen(false);
            }}
          >
            {createType === "task" && (
              <CreateTask
                taskId={null}
                relatedTo={[
                  {
                    type: "user",
                    referenceId: user._id,
                    access: true,
                  },
                ]}
                handleClose={() => {
                  closeDialog()
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
              />
            )}
            {createType === "case" && (
              <CreateCase
                caseId={null}
                relatedTo={[
                  { type: "user", referenceId: user._id, access: true },
                ]}
                handleClose={() => {
                  closeDialog()
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
              />
            )}
            {createType === "event" && (
              <CreateEvent
                eventId={null}
                relatedTo={[
                  {
                    type: "user",
                    referenceId: user._id,
                    access: true,
                  },
                ]}
                handleClose={() => {
                  closeDialog()
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
              />
            )}
          </Dialog>
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default BigCalendar;
