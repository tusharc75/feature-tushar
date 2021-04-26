import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CreateTask } from './CreateTask';
import { GetTask, DeleteTask } from "../../../axios/activity";
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import moment from "moment";
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Dialog from '@material-ui/core/Dialog';
import { ListRelatedTo } from '../Helpers/ListRelatedTo'
import { ViewAll } from '../Helpers/ViewAll'

export const Task = ({ relatedTo, handleActivityRefresh }) => {

    const [open, setOpen] = useState(false);
    const [task, setTask] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        fetchTask();
    }, []);

    const fetchTask = async () => {
        await GetTask(JSON.stringify(relatedTo))
            .then(({ data }) => {
                setTask(data)
            })
            .catch((err) => {
            });
    };

    const handleOpenMenu = (event, _id) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setTaskId(_id);
    };

    const handleCloseMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        setTaskId(null);
    };


    const handleEdit = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        setOpen(true)
    };


    const handleDelete = (event) => {
        event.stopPropagation();
        DeleteTask(taskId)
            .then(({ data }) => {
                setAnchorEl(null);
                fetchTask()
                handleActivityRefresh()
            })
            .catch((err) => {
            });
    };


    const handleClose = () => {
        fetchTask()
        setOpen(false)
        handleActivityRefresh()
    }

    return (task &&
        <Box className="activityDetailBox">
            {task.length ?
                <Fragment>
                    {task.map((_task, index) => (
                        <Box className="activity" key={_task._id}>
                            <Box>
                                <Grid container>
                                    <Grid item xs={10}  className="d-flex align-items-center gap-1">
                                        <Typography variant="subtitle2">{_task.name} </Typography> <span className="badge-date"> Due On : {moment(_task.dueDate).format("MMM DD YYYY")}</span>
                                    </Grid>
                                    <Grid item xs={2} container justify="flex-end" >
                                        <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _task._id)} >
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box pt={1}>
                                <Grid container>
                                    <Grid item xs={12} >
                                        <ListRelatedTo relatedTo={_task.relatedTo} originRelatedTo={relatedTo} />
                                        {/* <Chip label={_task.status} size="small" color="primary" /> */}
                                    </Grid>
                                    <Grid item xs={12} container justify="flex-end">
                                        
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>))}
                    <ViewAll
                        type="task"
                        relatedTo={relatedTo}
                    />
                </Fragment>
                : <Box p={1}>
                    <Typography variant="subtitle2">No Past Task</Typography>
                </Box>
            }
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleEdit} >Edit</MenuItem>
                <MenuItem onClick={handleDelete} >Delete</MenuItem>
            </Menu>
            <Dialog
                open={open}
                aria-labelledby="customized-dialog-title"
                maxWidth="md"
                onClose={handleClose}
                fullWidth
            >
                <CreateTask taskId={taskId} handleClose={handleClose} relatedTo={relatedTo} />
            </Dialog>
        </Box>

    );
}
