import { useCallback, useEffect, useState } from "react";
import { Box, Chip, Grid, Paper, Typography } from "@material-ui/core";
import { CalendarToday } from "@material-ui/icons";
import moment from "moment";

import axiosInstance from "../../axios/axiosInstance";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Layout from "../../components/Layout";
import { ListRelatedTo } from "../../components/Activity/Helpers/ListRelatedTo";

const Reminder = () => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);

  const fetchTasks = useCallback(() => {
    axiosInstance()
      .get("/task/my")
      .then(({ data: { data } }) => {
        setTasks(data);
      })
      .catch((err) => {});
  }, []);

  const fetchEvents = useCallback(() => {
    axiosInstance()
      .get("/case/my")
      .then(({ data: { data } }) => {
        setEvents(data);
      })
      .catch((err) => {});
  }, []);

  const fetchCases = useCallback(() => {
    axiosInstance()
      .get("/event/my")
      .then(({ data: { data } }) => {
        setCases(data);
      })
      .catch((err) => {});
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchCases();
  }, []);

  const dynamicChip = (data: string) => (
    <Chip
      size="small"
      icon={
        <CalendarToday
          style={{
            color:
              new Date(data).getDate() < new Date().getDate()
                ? "#dc3545"
                : new Date(data).getDate() === new Date().getDate()
                ? "#28a745"
                : "#838485",
          }}
          fontSize="small"
        />
      }
      label={moment(data).format("MMM, DD HH:MM")}
      style={{
        background: "#eee",
        color:
          new Date(data).getDate() < new Date().getDate()
            ? "#dc3545"
            : new Date(data).getDate() === new Date().getDate()
            ? "#28a745"
            : "#838485",
      }}
    />
  );

  return (
    <>
      <Layout>
        <CustomBreadCrumbs routes={[{ title: "Reminder" }]} />

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
                        bgcolor="#fafafa"
                        boxShadow={1}
                        borderRadius={2}
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body1" className="text-truncate">
                            {event.name}
                          </Typography>
                          {dynamicChip(event?.dueDate)}
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
                        bgcolor="#fafafa"
                        boxShadow={1}
                        borderRadius={2}
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body1" className="text-truncate">
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
                        bgcolor="#fafafa"
                        boxShadow={1}
                        borderRadius={2}
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body1" className="text-truncate">
                            {cas.name}
                          </Typography>

                          {dynamicChip(cas?.endDate)}
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
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </div>
      </Layout>
    </>
  );
};

export default Reminder;
