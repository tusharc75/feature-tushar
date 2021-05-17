import { useState, useEffect, useCallback } from "react";
import { Box, Button, Menu, MenuItem } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { lowerCase } from "lodash";
import moment from "moment";

import MyCalendar from "./MyCalendar";
import { GetBoard } from "../../../axios/activity";
import Layout from "../../../components/Layout";
import CustomContainer from "../../../components/CustomContainer";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";

import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const BigCalendar = () => {
  const [type, setType] = useState("Task");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filter, setFilter] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [activities, setActivities] = useState([
    {
      start: moment().toDate(),
      end: moment().add(1, "days").toDate(),
      title: "Some title",
    },
  ]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
              <Button
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleClick}
                variant="outlined"
                endIcon={<ExpandMore />}
              >
                {`${type}s`}
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
              <Box mx={1} />
              <SearchFilter
                handleChangeFilter={handleChangeFilter}
                filter={filter}
                chip={{ variant: "default", size: "small", color: "default" }}
              />
            </Box>

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
          </Box>
        </div>
      </CustomContainer>
    </Layout>
  );
};

export default BigCalendar;
