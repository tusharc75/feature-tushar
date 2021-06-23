import React from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography, Grid } from "@material-ui/core";
import PropTypes from "prop-types";
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const style = {
    cursor: "pointer",
    backgroundColor: 'white',
};


export const DragBox = ({ data, handleEdit, handleDelete, handleAddField }) => {

    const type = "field";
    const item = { data, type };

    const [{ isDragging }, drag] = useDrag({
        item,
        type: "field",
        end(item, monitor) {
            const dropResult = monitor.getDropResult();
            if (!dropResult) {

            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.4 : 1

    const [anchorEl, setAnchorEl] = React.useState(null);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCloneCustomField = (data) => {
        const sendData = data
        sendData.fieldLabel = sendData.fieldLabel + " Clone"
        delete sendData._id
        handleAddField(sendData)
    }

    const handleExportFields = (data) => {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const link = document.createElement('a');
        link.href = dataStr;
        link.download =  data.fieldLabel  + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (<>
        <Grid ref={drag} style={{ ...style, opacity }} item xs={6} >
            <Box border={1} p={1} borderColor="grey.300">
                <Grid container spacing={0}>
                    <Grid item xs={10} >
                        <Typography variant="body2">{data.fieldLabel}</Typography>
                    </Grid>
                    <Grid item xs={2} container justify="flex-end">
                        <IconButton size="small" aria-label="setting" onClick={handleClick} >
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={() => { handleEdit(data); handleClose() }} >Edit</MenuItem>
                            <MenuItem onClick={() => { handleCloneCustomField(data); handleClose() }} >Clone</MenuItem>
                            <MenuItem onClick={() => { handleExportFields(data); handleClose() }} >Export</MenuItem>
                            <MenuItem onClick={() => { handleDelete(data._id); handleClose() }} >Delete</MenuItem>
                        </Menu>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    </>
    );
};

DragBox.propTypes = {
    data: PropTypes.any,
    handleDelete: PropTypes.any
}
