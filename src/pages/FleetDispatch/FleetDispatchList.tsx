import { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Button, Dialog } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import { Add } from "@material-ui/icons";
import { isMobile, isTablet } from "react-device-detect";
import { FleetDispatchBox } from './FleetDispatchBox';

export const FleetDispatchList = ({ status, activity, handleChangeStatus, loading }) => {
    const ref = useRef(null);
    const [subActivity, setSubActivity] = useState([]);

    useEffect(() => {
        setSubActivity(activity);
    }, [activity]);

    const moveCard = useCallback(
        (dragIndex, hoverIndex) => {
            const dragCard = subActivity[dragIndex];
            setSubActivity(
                update(subActivity, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, dragCard]
                    ]
                })
            );
        },
        [subActivity]
    );

    const [{ }, drop] = useDrop({
        accept: 'move',
        drop: (data: any) => {
            handleChangeStatus(data.id, status, data.index);
        }
    });

    drop(ref);


    return (
        <div ref={ref}>
            <Box
                minHeight={status === 2 ? '300px' : '100%'}
            >
                {!loading ? (
                    <>
                        {subActivity.map((element, index) => (
                            <FleetDispatchBox
                                data={element}
                                key={element?.id}
                                id={element?.id}
                                index={index}
                                moveCard={moveCard}
                            />
                        ))}
                    </>
                ) : (
                    <Box p={1}></Box>
                )}
            </Box>
        </div>
    );
};
