import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import statusList from "../../Helpers/statusList";
import { Box, Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { isMobile, isTablet } from "react-device-detect";
import { GetBoard } from "../../../../axios/activity";
import Loader from "../../../../components/Loader";
import { BoardList } from "./BoardList";
import axiosInstance from "../../../../axios/axiosInstance";

const useStyles = makeStyles((theme) => ({
  block: {
    background:"red"
  }
}));

const Board = ({ type, filter, activityId }) => {
  const [activities, setActivities] = useState(null);
  const classes = useStyles();
  useEffect(() => {
    fetchBoard();
  }, [filter, activityId]);

  const fetchBoard = async () => {
    await GetBoard(type, JSON.stringify(filter))
      .then(({ data }) => {
        setActivities(data);
      })
      .catch((err) => { });
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
      .put(`activity/field/${id}`, { status: updatedData.status })
      .then(({ data }) => {
        console.log(data);
      })
      .catch((err) => console.log(JSON.stringify(err)));
  };

  return activities ? (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>

      <Grid container spacing={1}>
        {statusList.map((data, index) => (
          <Grid item md={4} xs={12} sm={6} key={index}>
            <div className={classes.block}>
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
            </div>
          </Grid>
        ))}
      </Grid>
    </DndProvider>
  ) : (
    <Loader text="" />
  );
};

export default Board;
