import { useState, useEffect } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import statusList from "../../Helpers/statusList";
import { Typography } from "@material-ui/core";
import { isMobile, isTablet } from "react-device-detect";
import { GetBoard } from "../../../../axios/activity";
import Loader from "../../../../components/Loader";
import { BoardList } from "./BoardList";
import axiosInstance from "../../../../axios/axiosInstance";
import { getBordActionUrl } from "../../../../services/util";

const Board = ({ type, filter, activityId }) => {
  const [activities, setActivities] = useState(null);
  const {update:updateUrl} = getBordActionUrl(type);
  useEffect(() => {
    fetchBoard();
  }, [filter, activityId]);

  const fetchBoard = async () => {
    await GetBoard(type, JSON.stringify(filter))
      .then(({ data }) => {
        setActivities(data);
      })
      .catch((err) => {});
  };

  const handleChangeStatus = (activityId: string, status: string) => {
    const updatedState = activities.map((activity: any) => {
      if (activity._id === activityId) {
        return {
          ...activity,
          status,
        };
      }

      return activity;
    });
    setActivities(updatedState);
    const updatedActivity = updatedState.find((a) => a._id === activityId);
    if (updatedActivity) {
      updateStatus(activityId, updatedActivity);
    }
  };

  const updateStatus = (id: string, updatedData: any) => {
    axiosInstance()
      .put(`${updateUrl}${id}`, { status: updatedData.status })
      .then(({ data }) => {
        console.log(data);
      })
      .catch((err) => console.log(JSON.stringify(err)));
  };

  return activities ? (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
      <Grid container>
        {statusList.map((data, index) => (
          <Box
            key={index}
            width={300}
            height={window.innerHeight - 250}
            mr={2}
            style={{ overflow: "auto" }}
            display="block"
            border={1}
            borderColor="grey.300"
            bgcolor="grey.200"
          >
            <Box p={1}>
              <Typography variant="subtitle2">
                {data.status.toUpperCase()}
                {" (" +
                  activities.filter(function (o) {
                    return o.status === data.status;
                  }).length +
                  ")"}
              </Typography>
            </Box>
            <BoardList
              status={data.status}
              activity={activities.filter(function (o) {
                return o.status === data.status;
              })}
              fetchBoard={fetchBoard}
              type={type}
              handleChangeStatus={handleChangeStatus}
            />
          </Box>
        ))}
      </Grid>
    </DndProvider>
  ) : (
    <Loader text="" />
  );
};

export default Board;
