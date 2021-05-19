import { useState, useEffect, useCallback } from "react";
import { Box, Button, Dialog } from "@material-ui/core";
import { Add } from "@material-ui/icons";
import moment from "moment";

import MyCalendar from "../Calendar/MyCalendar";
import { GetBoard } from "../../../axios/activity";
import Layout from "../../../components/Layout";
import CustomContainer from "../../../components/CustomContainer";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { CreateEvent } from "../../../components/Activity/Event/CreateEvent";

const Event = () => {
  const [filter, setFilter] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [events, setEvents] = useState([]);

  const fetchBoard = useCallback(() => {
    GetBoard("event", JSON.stringify(filter))
      .then(({ data }) => {
        const newData = data.map((d) => ({
          ...d,
          title: d.name,
          start: d.startDate ? new Date(d.startDate) : moment().toDate(),
          end: d.dueDate
            ? new Date(d.dueDate)
            : moment().add(20, "days").toDate(),
        }));

        setEvents(newData);
      })
      .catch((err) => {});
  }, [filter]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  const handleClose = () => {
    setActivityData(null);
    setOpenDialog(false);

    fetchBoard();
  };

  return (
    <Layout>
      <CustomBreadCrumbs
        routes={[{ title: "Activity", path: "/activity" }, { title: "Event" }]}
      />

      <CustomContainer>
        <div className="detailContainer">
          <Box p={1}>
            <Box mb={2} display="flex" alignItems="center">
              <Box mr={2} minWidth="150px" height="100%">
                <Button
                  fullWidth
                  startIcon={<Add />}
                  variant="outlined"
                  onClick={() => setOpenDialog(true)}
                >
                  Create Event
                </Button>
              </Box>
              <SearchFilter
                handleChangeFilter={handleChangeFilter}
                filter={filter}
                chip={{ variant: "default", size: "small", color: "default" }}
              />
            </Box>

            <MyCalendar
              activities={events}
              setActivityData={(event: any) => {
                setActivityData(event);
                setOpenDialog(true);
              }}
              type="event"
            />

            <Dialog open={openDialog} onClose={handleClose} maxWidth="md">
              <CreateEvent
                eventId={activityData ? activityData.id : null}
                handleClose={handleClose}
              />
            </Dialog>
          </Box>
        </div>
      </CustomContainer>
    </Layout>
  );
};

export default Event;
