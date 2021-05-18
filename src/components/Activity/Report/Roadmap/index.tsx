import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Typography, Box, Button, ButtonGroup } from "@material-ui/core";
import grey from "@material-ui/core/colors/grey";
import moment from "moment";

import { GetRoadmap } from "../../../../axios/activity";

import Calander from "./Calander";
import ActivityList from "./ActivityList";
import CalanderList from "./CalanderList";
import Loader from "../../../../components/Loader";

const useStyles = makeStyles((theme) => ({
  hover: {
    "&:hover": {
      backgroundColor: grey[100],
    },
  },
}));

export default function Roadmap({ type, filter, activityId }) {
  const scrollRef = React.useRef(null);
  const executeScroll = () => {
    var pageElement = document.getElementById("dayLiner");
    var LeftPos = pageElement.offsetLeft;
    document.getElementById("scrollDayLiner").scrollLeft = LeftPos - 200;
    // if (scrollRef.current) {
    //     scrollRef.current.scrollIntoView({ inline: "center" })
    // }
  };

  const [calendarType, setCalendarType] = useState("week");
  const [activity, setActivity] = useState(null);
  const [treeList, setTreeList] = useState(null);

  useEffect(() => {
    fetchRoadmap();
  }, [filter]);

  const fetchRoadmap = async () => {
    await GetRoadmap(type, JSON.stringify(filter))
      .then(({ data }) => {
        setActivity(data.activity);
        setTreeList(data.treeList);
        executeScroll();
      })
      .catch((err) => {});
  };

  let height = window.innerHeight - 250;
  let startDate = moment("2020-01-01");
  let endDate = moment("2022-12-31");
  let totalDay = endDate.diff(startDate, "days");

  var dayPixel = 0;
  if (calendarType === "month") {
    dayPixel = 8.5;
  } else if (calendarType === "week") {
    dayPixel = 35;
  } else {
    dayPixel = 3;
  }

  const handelChangeCalendarType = async (type) => {
    setCalendarType(type);
    setTimeout(() => executeScroll(), 500);
  };

  const taskScroolRef = React.useRef(null);
  const onscroll = (event) => {
    var target = event.nativeEvent.target;
    taskScroolRef.current.scrollTop = target.scrollTop;
  };

  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState([]);

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds);
  };

  const classes = useStyles();
  return activity ? (
    <Box bgcolor="white">
      <Box
        border={1}
        borderColor="grey.300"
        display="flex"
        height={height}
        style={{ position: "relative" }}
      >
        <Box
          display="flex"
          width="100%"
          height="100%"
          style={{ position: "absolute" }}
        >
          <Box
            minWidth={300}
            border={1}
            borderColor="grey.300"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <Box
              height={54}
              bgcolor="grey.200"
              display="flex"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <Box p={2}>
                <Typography variant="body2" display="block">
                  Roadmap
                </Typography>
              </Box>
            </Box>
            <div ref={taskScroolRef}>
              <Box
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                <ActivityList
                  activity={activity}
                  treeList={treeList}
                  expanded={expanded}
                  selected={selected}
                  handleToggle={handleToggle}
                  handleSelect={handleSelect}
                />
                <Box height={20}></Box>
              </Box>
            </div>
          </Box>
          <Box
            id="scrollDayLiner"
            onScroll={onscroll}
            border={1}
            borderColor="grey.300"
            style={{ position: "relative", overflow: "auto" }}
          >
            <Calander
              calendarType={calendarType}
              dayPixel={dayPixel}
              startDate={startDate}
              endDate={endDate}
            />

            <Box
              width="100%"
              height="100%"
              style={{ position: "absolute", zIndex: 1 }}
            >
              <Box style={{ position: "absolute", width: totalDay * dayPixel }}>
                <CalanderList
                  activity={activity}
                  expanded={expanded}
                  selected={selected}
                  handleSelect={handleSelect}
                  startDate={startDate}
                  endDate={endDate}
                  totalDay={totalDay}
                  calendarType={calendarType}
                />
              </Box>
            </Box>
            <Box
              width={totalDay * dayPixel}
              height={"100%"}
              style={{ position: "sticky", top: 0, bottom: 0 }}
            >
              <div ref={scrollRef}>
                <Box
                  id="dayLiner"
                  height={"100%"}
                  style={{
                    position: "absolute",
                    left:
                      (100 * moment().diff(startDate, "days")) / totalDay + "%",
                    width: dayPixel,
                  }}
                >
                  <Box
                    style={{ margin: "auto" }}
                    width={3}
                    border={3}
                    borderColor="primary.main"
                    height={"100%"}
                  ></Box>
                </Box>
              </div>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box display="flex" justifyContent="flex-end">
        <Box>
          <ButtonGroup disableElevation color="primary">
            <Button
              variant={calendarType === "week" ? "contained" : "outlined"}
              onClick={() => handelChangeCalendarType("week")}
            >
              Weeks
            </Button>
            <Button
              variant={calendarType === "month" ? "contained" : "outlined"}
              onClick={() => handelChangeCalendarType("month")}
            >
              Months
            </Button>
            <Button
              variant={calendarType === "quater" ? "contained" : "outlined"}
              onClick={() => handelChangeCalendarType("quater")}
            >
              Quaters
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
    </Box>
  ) : (
    <Loader text="" />
  );
}

Roadmap.propTypes = {
  type: PropTypes.any,
  filter: PropTypes.any,
  activityId: PropTypes.any,
};
