import { useCallback, useEffect, useState, Fragment } from "react";
import { Box, Chip, Grid, Paper, Typography } from "@material-ui/core";
import moment from "moment";

import axiosInstance from "../../axios/axiosInstance";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Layout from "../../components/Layout";
import { ListRelatedTo } from "../../components/Activity/Helpers/ListRelatedTo";
import ActivityModelHandler from "../../components/Activity/ActivityModelHandler";
import { MdDateRange } from 'react-icons/md';
import routes from "../../components/Helpers/Routes";

const Reminder = () => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchTasks = useCallback(() => {
    setLoadingTasks(true);
    axiosInstance()
      .get("/task/my")
      .then(({ data: { data } }) => {
        setLoadingTasks(false);
        setTasks(data);
      })
      .catch((err) => {
        setLoadingTasks(false);
      });
  }, []);

  const fetchEvents = useCallback(() => {
    setLoadingEvents(true);
    axiosInstance()
      .get("/event/my")
      .then(({ data: { data } }) => {
        setLoadingEvents(false);
        setEvents(data);
      })
      .catch((err) => {
        setLoadingEvents(false);
      });
  }, []);

  const fetchCases = useCallback(() => {
    setLoadingCases(true);
    axiosInstance()
      .get("/case/my")
      .then(({ data: { data } }) => {
        setLoadingCases(false);
        setCases(data);
      })
      .catch((err) => {
        setLoadingCases(false);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchCases();
  }, []);

  const dynamicChip = (data: string, type: string = null) => (
    <Chip
      size="small"
      icon={
        <MdDateRange size={10}
          style={{
            color:
              new Date(data).getFullYear() < new Date().getFullYear() ||
              new Date(data).getMonth() < new Date().getMonth() ||
              new Date(data).getDate() < new Date().getDate()
                ? "#dc3545"
                : new Date(data).getDate() === new Date().getDate() &&
                  new Date(data).getMonth() === new Date().getMonth() &&
                  new Date(data).getFullYear() === new Date().getFullYear()
                ? "#28a745"
                : "#838485",
          }}
          
        />
      }
      label={
        type
          ? moment(data).format("MMM, DD HH:MM")
          : moment(data).format("MMM, DD YYYY")
      }
      style={{
        background: "#dfdfdf",
        color:
          new Date(data).getFullYear() < new Date().getFullYear() ||
          new Date(data).getMonth() < new Date().getMonth() ||
          new Date(data).getDate() < new Date().getDate()
            ? "#dc3545"
            : new Date(data).getDate() === new Date().getDate() &&
              new Date(data).getMonth() === new Date().getMonth() &&
              new Date(data).getFullYear() === new Date().getFullYear()
            ? "#28a745"
            : "#838485",
      }}
    />
  );

  return (
    <>
      {selectedActivity && (
        <ActivityModelHandler
          activityId={selectedActivity.id}
          setActivityData={setSelectedActivity}
          activityType={selectedActivity.type}
          fetchBoard={() => {}}
        />
      )}
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[{ title: routes.reminder.title }]} />
        </Grid>
        <div className="detail-container">
          <Paper>
            <Box boxShadow={1} height="calc(100vh - 120px)" p={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4} lg={3}>
                  <Box bgcolor="lightgrey" p={1} borderRadius={4} mb={2}>
                    <Typography variant="body1">Events</Typography>
                  </Box>
                  <Box height="calc(100vh - 190px)" overflow="auto">
                    {events.map((event) => (
                      <Box
                        key={event._id}
                        p={1}
                        mb={1}
                        bgcolor="#f5f5f5"
                        borderRadius={2}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setSelectedActivity({ id: event._id, type: "event" })
                        }
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 500 }}
                            className="text-truncate"
                          >
                            {event.name}
                          </Typography>
                          {dynamicChip(event?.startDate, "event")}
                        </Box>

                        <Typography variant="body2" color="textSecondary">
                          {event.description}
                        </Typography>
                        <Box mt={2}>
                          <ListRelatedTo
                            relatedTo={event?.relatedTo}
                            originRelatedTo={[]}
                          />
                        </Box>
                      </Box>
                    ))}
                    <Box textAlign="center">
                      <Typography>
                        {loadingEvents
                          ? "Loading..."
                          : !events.length
                          ? "No Events"
                          : null}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4} lg={3}>
                  <Box bgcolor="lightgrey" p={1} borderRadius={4} mb={2}>
                    <Typography variant="body1">Tasks</Typography>
                  </Box>
                  <Box height="calc(100vh - 190px)" overflow="auto">
                    {tasks.map((task) => (
                      <Box
                        key={task._id}
                        p={1}
                        mb={1}
                        bgcolor="#f5f5f5"
                        borderRadius={2}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setSelectedActivity({ id: task._id, type: "task" })
                        }
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 500 }}
                            className="text-truncate"
                          >
                            {task.name}
                          </Typography>
                          {dynamicChip(task?.dueDate)}
                        </Box>

                        <Typography variant="caption" color="textSecondary">
                          {task.status}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {task.description}
                        </Typography>
                        <Box mt={2}>
                          <ListRelatedTo
                            relatedTo={task?.relatedTo}
                            originRelatedTo={[]}
                          />
                        </Box>
                      </Box>
                    ))}
                    <Box textAlign="center">
                      <Typography>
                        {loadingTasks
                          ? "Loading..."
                          : !tasks.length
                          ? "No Tasks"
                          : null}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4} lg={3}>
                  <Box bgcolor="lightgrey" p={1} borderRadius={4} mb={2}>
                    <Typography variant="body1">Cases</Typography>
                  </Box>
                  <Box height="calc(100vh - 190px)" overflow="auto">
                    {cases.map((cas) => (
                      <Box
                        key={cas._id}
                        p={1}
                        mb={1}
                        bgcolor="#f5f5f5"
                        borderRadius={2}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setSelectedActivity({ id: cas._id, type: "case" })
                        }
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 500 }}
                            className="text-truncate"
                          >
                            {cas.name}
                          </Typography>

                          {dynamicChip(cas?.dueDate)}
                        </Box>

                        <Typography variant="caption" color="textSecondary">
                          {cas.status}
                        </Typography>

                        <Typography variant="body2" color="textSecondary">
                          {cas.description}
                        </Typography>
                        <Box mt={2}>
                          <ListRelatedTo
                            relatedTo={cas?.relatedTo}
                            originRelatedTo={[]}
                          />
                        </Box>
                      </Box>
                    ))}
                    <Box textAlign="center">
                      <Typography>
                        {loadingCases
                          ? "Loading..."
                          : !cases.length
                          ? "No Cases"
                          : null}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </div>
      </Fragment>
    </>
  );
};

export default Reminder;
