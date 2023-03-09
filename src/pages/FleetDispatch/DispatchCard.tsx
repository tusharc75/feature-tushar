import React from 'react';
import { makeStyles, Typography, Box } from '@material-ui/core';
import { useDrag, useDrop } from 'react-dnd';

const useStyles = makeStyles(() => ({
    fleetBox: {
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: '0px 6px 14px',
        borderRadius: '4px',
        border: '1px solid #ebebeb',
        padding: '15px',
        transition: 'transform .2s, background .3s',
        '&:hover': {
            transform: 'scale(1.02)',
            zIndex: '1'
        }
    },
    jobBox: {
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: '0px 6px 14px',
        borderRadius: '4px',
        border: '1px solid #ebebeb',
        padding: '15px',
        transition: 'transform .2s, background .3s',
        '&:hover': {
            transform: 'scale(1.02)',
            zIndex: '1'
        }
    }
}));

const FleetDispatchBox = ({ data, id, index, moveCard, cardType, handleDispatch }) => {

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
            if (item.type !== cardType) {
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
            return { id, index, cardType };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div ref={ref} key={index} >
            {cardType === "fleet" ?
                <Box className={classes.fleetBox} style={{ opacity }}  >
                    <Box mr="10px">
                        <Typography variant="subtitle2"  >
                            Fleet Number : {data?.fleetNumber}
                        </Typography>
                    </Box>
                </Box> :
                <Box className={classes.jobBox} style={{ opacity }}  >
                    <Box mr="10px">
                        <Typography variant="subtitle2"  >
                            Job Number : {data?.jobNumber}
                        </Typography>
                        <Typography variant="subtitle2"  >
                            Asset : {data?.asset?.assetNumber}
                        </Typography>
                    </Box>
                </Box>}
        </div >
    );
};

export default FleetDispatchBox;
