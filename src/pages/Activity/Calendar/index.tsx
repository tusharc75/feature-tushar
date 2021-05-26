import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, Dialog, Grid, Menu, MenuItem } from "@material-ui/core";
import { Add, ExpandMore } from "@material-ui/icons";
import { lowerCase } from "lodash";
import moment from "moment";

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

const BigCalendar = () => {
  const {
    state: {
      user: { user },
    },
  } = useData();
  const [type, setType] = useState("Task");
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

  const joinDateTime = (date, time) => {
    let d = date.split("T")[0];
    let t = time.split("T")[1];

    return date && time ? new Date(`${d}T${t}`) : "";
  };

  const fetchBoard = useCallback(() => {
    GetBoard(lowerCase(type), JSON.stringify(filter))
      .then(({ data }) => {
        const newData = data.map((d) => ({
          ...d,
          title: d.name,
          start:
            type === "Event"
              ? joinDateTime(d.startDate, d.startTime)
              : d.startDate
              ? new Date(d.startDate)
              : moment().toDate(),
          end:
            type === "Event"
              ? joinDateTime(d.endDate, d.endTime)
              : d.dueDate
              ? new Date(d.dueDate)
              : moment().add(20, "days").toDate(),
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
  };

  const closeDialog = () => {
    setCreateType(null);
    fetchBoard();
  };

  return (
    <Layout>
      <Grid container>
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[{ title: "Calendar" }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Grid container className="greyBox">
          <Grid item xs={12} sm={3}>
            <Button
              aria-controls="simple-menu"
              aria-haspopup="true"
              onClick={handleClick}
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
            >
              {`${type}s`}
            </Button>
            <Box mr={1} component="span" />
            <Button
              aria-controls="simple-menu"
              aria-haspopup="true"
              size="small"
              variant="outlined"
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
              chip={{ variant: "default", size: "small", color: "default" }}
            />
          </Grid>
        </Grid>
        <MyCalendar
          activities={activities}
          setActivityData={setActivityData}
          type={lowerCase(type)}
        />

        {activityData && (
          <ActivityModelHandler
            fetchBoard={fetchBoard}
            setActivityData={setActivityData}
            fromCalender={true}
            activityType={activityData.type}
            activityId={activityData.id}
          />
        )}

        {createType && (
          <Dialog open={true} fullWidth maxWidth="md" onClose={closeDialog}>
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
