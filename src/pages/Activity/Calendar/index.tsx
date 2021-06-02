import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, Dialog, Grid, Menu, MenuItem } from "@material-ui/core";
import { Add, ExpandMore } from "@material-ui/icons";
import { lowerCase, startCase } from "lodash";
import { useHistory } from "react-router-dom";
import queryString from "query-string";
import { isMobile, isTablet } from "react-device-detect";

import MyCalendar from "./MyCalendar";
import { GetBoard } from "../../../axios/activity";
import Layout from "../../../components/Layout";
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

const BigCalendar = () => {
  const {
    state: {
      user: { user },
    },
  } = useData();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId, type: actType } = parsed;
  const [type, setType] = useState(
    actType ? startCase(actType.toLocaleString()) : "Task"
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createType, setCreateType] = useState(null);
  const [filter, setFilter] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [activities, setActivities] = useState([]);

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
        .catch((err) => {});
    }
  }, []);

  const joinTime = (date: any, time: any) => {
    const d = new Date(date).toISOString().split("T")[0];
    const t = new Date(time).toISOString().split("T")[1];

    return new Date(`${d}T${t}`);
  };

  const fetchBoard = useCallback(() => {
    GetBoard(lowerCase(type), JSON.stringify(filter))
      .then(({ data }) => {
        const newData = data.map((d) => ({
          ...d,
          title: d.name,
          start:
            type === "Event"
              ? joinTime(d.startDate, d.startTime)
              : new Date(d.startDate),

          end:
            type === "Event"
              ? joinTime(d.endDate, d.endTime)
              : new Date(d.dueDate),
        }));

        setActivities(newData);
      })
      .catch((err) => {});
  }, [type, filter]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const activityOptions = ["Task", "Case", "Event"];

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
    <Layout>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[{ title: "Calendar" }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="bgLight">
          <Grid container className="greyBox">
            <Grid item xs={12} sm={3}>
              <Button
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleClick}
                size="small"
                color="primary"
                variant="contained"
                endIcon={<ExpandMore />}
              >
                {`${type}s`}
              </Button>
              <Box mr={1} component="span" />
              <Button
                aria-controls="simple-menu"
                aria-haspopup="true"
                size="small"
                color="primary"
                variant="contained"
                onClick={() => setCreateType(lowerCase(type))}
                startIcon={<Add />}
              >
                {`Create ${type}`}
              </Button>
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {activityOptions.map((item, i) => (
                  <MenuItem
                    key={i}
                    selected={item === type}
                    onClick={() => {
                      setType(item);
                      handleClose();
                    }}
                  >
                    {item}s
                  </MenuItem>
                ))}
              </Menu>
            </Grid>
            <Grid item xs={12} sm={9}>
              <SearchFilter
                handleChangeFilter={handleChangeFilter}
                filter={filter}
                chip={{ size: "small" }}
              />
            </Grid>
          </Grid>
          <MyCalendar
            activities={activities}
            setActivityData={setActivityData}
            type={lowerCase(type)}
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
            fullScreen={isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            open={true}
            fullWidth
            maxWidth="md"
            onClose={closeDialog}
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
                handleClose={closeDialog}
              />
            )}
            {createType === "case" && (
              <CreateCase
                caseId={null}
                relatedTo={[
                  { type: "user", referenceId: user._id, access: true },
                ]}
                handleClose={closeDialog}
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
                handleClose={closeDialog}
              />
            )}
          </Dialog>
        )}
      </CustomContainer>
    </Layout>
  );
};

export default BigCalendar;
