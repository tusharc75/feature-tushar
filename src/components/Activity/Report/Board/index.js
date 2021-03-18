import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import statusList from '../../Helpers/statusList';
import { Typography } from '@material-ui/core';
import { isMobile, isTablet } from "react-device-detect";
import { GetBoard } from "../../../../axios/activity";
import Loader from "../../../../components/Loader";
import { BoardList } from "./BoardList";


const Board = ({ type, filter, activityId }) => {


    const [activity, setActivity] = useState(null);

    useEffect(() => {
        fetchBoard();
    }, [filter, activityId]);

    const fetchBoard = async () => {
        await GetBoard(type, JSON.stringify(filter))
            .then(({ data }) => {
                setActivity(data);
            })
            .catch((err) => {
            });
    };


    const handleChangeStatus = () => {

    }

    return (activity ? <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
        <Grid container>
            {statusList.map((data, index) => (
                <Box key={index} width={300} height={window.innerHeight - 250} mr={2} style={{ overflow: "auto" }} display="block" border={1} borderColor="grey.300" bgcolor="grey.200">
                    <Box p={2}>
                        <Typography variant="subtitle2" >{data.status.toUpperCase()}
                            {" (" + activity.filter(function (o) { return o.status === data.status }).length + ")"}
                        </Typography>
                    </Box>
                    <BoardList
                        status={data.status}
                        activity={activity.filter(function (o) { return o.status === data.status })}
                        fetchBoard={fetchBoard}
                        type={type}
                        handleChangeStatus={handleChangeStatus}
                    />
                </Box>
            ))}
        </Grid>
    </DndProvider> : <Loader />
    );
}

export default Board;
