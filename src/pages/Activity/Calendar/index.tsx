import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { TextField, Box } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import moment from "moment";
import { lowerCase } from "lodash";

import { GetBoard } from "../../../axios/activity";
import Layout from "../../../components/Layout";
import CustomContainer from "../../../components/CustomContainer";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";

import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const BigCalendar = () => {
  const [type, setType] = useState("Task");
  const [filter, setFilter] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [activities, setActivities] = useState([
    {
      start: moment().toDate(),
      end: moment().add(1, "days").toDate(),
      title: "Some title",
    },
  ]);

  const fetchBoard = useCallback(() => {
    GetBoard(lowerCase(type), JSON.stringify(filter))
      .then(({ data }) => {
        const newData = data.map((d) => ({
          ...d,
          title: d.name,
          start: d.startDate ? new Date(d.startDate) : moment().toDate(),
          end: d.dueDate
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

  return (
    <Layout>
      <CustomBreadCrumbs routes={[{ title: "Calendar" }]} />

      <CustomContainer>
        <div className="detailContainer">
          <Box p={1}>
            <Box mb={2} display="flex" alignItems="center">
              <Autocomplete
                options={activityOptions}
                getOptionLabel={(option) => option}
                value={type}
                onChange={(e, val) => {
                  setType(val);
                }}
                size="small"
                style={{ width: 150 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Activitiy"
                    variant="outlined"
                  />
                )}
              />

              <Box mx={1} />
              <SearchFilter
                handleChangeFilter={handleChangeFilter}
                filter={filter}
                chip={{ variant: "default", size: "small", color: "default" }}
              />
            </Box>

            <Calendar
              defaultDate={moment().toDate()}
              defaultView="month"
              events={activities}
              localizer={localizer}
              style={{ height: "100vh" }}
              popup={true}
              onSelectEvent={(event: any) => {
                setActivityData({
                  type: lowerCase(type),
                  id: event._id,
                });
              }}
            />
            {activityData && (
              <ActivityModelHandler
                setActivityData={setActivityData}
                fromCalender={true}
                activityType={activityData.type}
                activityId={activityData.id}
              />
            )}
          </Box>
        </div>
      </CustomContainer>
    </Layout>
  );
};

export default BigCalendar;
