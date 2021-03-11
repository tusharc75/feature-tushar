import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { useDrag, useDrop } from 'react-dnd';
import Chip from '@material-ui/core/Chip';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { useHistory } from "react-router-dom";
import { ListRelatedTo } from '../../Helpers/ListRelatedTo'

const style = {
    cursor: 'move',
};

export const BoardBox = ({ type, data, id, index, moveCard, fetchBoard }) => {

    const history = useHistory();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const ref = React.useRef(null);

    const [{ }, drop] = useDrop({
        accept: ["move"],
        drop: () => {
        },
        hover(item, monitor) {
            if (!ref.current) {
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
    });

    const [{ isDragging }, drag] = useDrag({
        item: { type: "move", id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });


    const handleActivityOpen = (event) => {
        history.push({
            pathname: '/activity/' + type,
            search: '?activityType=' + type + '&activityId=' + data._id
        })
    }


    const handleOpenMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };

    const handleDelete = (event) => {
        // event.stopPropagation();
        // DeleteActivity(data._id)
        //     .then(({ data }) => {
        //         setAnchorEl(null);
        //         fetchBoard()
        //     })
        //     .catch((err) => {
        //     });
    };

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return <Box onClick={handleActivityOpen} ref={ref} p={2} bgcolor={"white"} m={1} style={{ ...style, opacity }}>
        <Box>
            <Grid container spacing={1}>
                <Grid item xs={10}>
                    <Typography variant="subtitle2" >{data.name}</Typography>
                </Grid>
                <Grid item xs={2}>
                    <IconButton size="small" aria-label="delete" onClick={handleOpenMenu} >
                        <MoreHorizIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </Box>
        <Box pt={2}>
            <ListRelatedTo relatedTo={data.relatedTo} />
        </Box>
        <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
        >
            <MenuItem onClick={handleDelete} >Delete</MenuItem>
        </Menu>
    </Box>
}