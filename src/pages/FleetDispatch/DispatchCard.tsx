import React from 'react';
import { makeStyles, Typography, Box, Grid } from '@material-ui/core';

import { useDrag, useDrop } from 'react-dnd';
import { AiFillPropertySafety } from 'react-icons/ai';

const useStyles = makeStyles(() => ({
    activitybox: {
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: '0px 6px 14px',
        borderRadius: '4px',
        border: '1px solid #ebebeb',
        // boxShadow: 'rgb(23 43 77 / 20%) 0px 1px 1px, rgb(23 43 77 / 20%) 0px 0px 1px',
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(23, 43, 77)',
        padding: '14px 15px',
        transition: 'transform .2s, background .3s',
        '&:hover': {
            transform: 'scale(1.02)',
            zIndex: '1'
            // backgroundColor: 'var(--hover_bg)'
        }
    }
}));

const FleetDispatchBox = ({ data, id, index, moveCard, type, handleDispatch }) => {

    const classes = useStyles();
    const ref = React.useRef(null);

    const [{ handlerId }, drop] = useDrop({
        accept: 'move',
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId()
            };
        },
        hover: (item: any, monitor) => {
            if (!ref.current) {
                return;
            }
            if (item.type !== type) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            moveCard(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
        drop: (item: any) => {
            handleDispatch(item, data)
        }
    });

    const [{ isDragging }, drag] = useDrag({
        type: 'move',
        item: () => {
            return { id, index, type };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div ref={ref} data-handler-id={handlerId}  >
            <Box className={` ${classes.activitybox}`} style={{ opacity }}  >
                <Grid container>
                    <Grid item xs={11}>
                        <Box display="flex" mr="10px">
                            <Typography
                                style={{
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    marginRight: '5px'
                                }}
                                variant="subtitle2"
                            >
                                {data?.name} - {type}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
};

export default FleetDispatchBox;
