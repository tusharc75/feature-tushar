import React, { useState, useCallback, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import { BoardBox } from './BoardBox';
//import update from 'immutability-helper';
import { useDrag, useDrop } from 'react-dnd';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';

export const BoardList = ({ status, type, activity, fetchBoard, handleChangeStatus }) => {

    const ref = React.useRef(null);
    const [subActivity, setSubActivity] = useState([]);

    useEffect(() => {
        setSubActivity(activity);
    }, [activity])

    const moveCard = useCallback((dragIndex, hoverIndex) => {
        // const dragCard = subActivity[dragIndex];
        // setSubActivity(update(subActivity, {
        //     $splice: [
        //         [dragIndex, 1],
        //         [hoverIndex, 0, dragCard],
        //     ],
        // }));
    }, [subActivity]);

    const [{ }, drop] = useDrop({
        accept: ["move"],
        drop: (data) => {
            handleChangeStatus(data.id, status)
        },
    });
    (drop(ref));

    return (<Box ref={ref} >
        {subActivity.map((element, index) => (
            <BoardBox
                data={element}
                key={element._id}
                id={element._id}
                index={index}
                type={type}
                moveCard={moveCard}
                fetchBoard={fetchBoard} />
        ))}
    </Box>
    );
}