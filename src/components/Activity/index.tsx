import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { Task } from "./Task";
import { CreateTask } from "./Task/CreateTask";
import { Event } from "./Event";
import { CreateEvent } from "./Event/CreateEvent";
import { Case } from "./Case";
import { CreateCase } from "./Case/CreateCase";
import { Note } from "./Note";
import { CreateNote } from "./Note/CreateNote";
import { Email } from "./Email";
import { CreateEmail } from "./Email/CreateEmail";
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import Dialog from '@material-ui/core/Dialog';

const Activity = (props) => {

    const { relatedTo, handleActivityRefresh } = props;
    const [type, setType] = useState(null);
    const [open, setOpen] = useState(false);

    const tabs = ["Task", "Event", "Case", "Note", "Email"];

    const handleChangeType = (event, data) => {
        event.stopPropagation();
        if (data === type) {
            setType(null);
        }
        else {
            setType(data);
        }
    };

    const handleCreateActivity = (event, data) => {
        event.stopPropagation();
        setType(data)
        setOpen(true);
    };

    const handleClose = () => {
        let temptype = type;
        setType(null)
        setOpen(false)
        setType(temptype)
        handleActivityRefresh()
    }

    return (<Box border={1} p={1} bgcolor="white" borderColor="grey.300">
        <Box ml={1}>
            <Typography variant="h6">Activity</Typography>
        </Box>
        {tabs.map((data, index) => (
            <Fragment key={index}>
                <Box display="flex"  mt={1} p={1} bgcolor="grey.100" borderColor="grey.300" onClick={(event) => handleChangeType(event, data)} style={{ cursor: "pointer" }}>
                    <Grid container>
                        <Grid item xs={8} >
                            <Box display="flex">
                                <Box >
                                    <IconButton size="small">
                                        {type === data ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>
                                <Box ml={1} mt={0.5}>
                                    <Typography variant="subtitle2">{data}</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={4} container justify="flex-end" >
                            <IconButton color="primary" size="small" onClick={(event) => handleCreateActivity(event, data)}>
                                <ControlPointIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
                <Box mt={2}>
                    {type === "Task" && data === "Task" ? <Task relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Event" && data === "Event" ? <Event relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Case" && data === "Case" ? <Case relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Note" && data === "Note" ? <Note relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Email" && data === "Email" ? <Email relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                </Box>
            </Fragment>
        ))}
        <Dialog
            open={open}
            aria-labelledby="customized-dialog-title"
            maxWidth={"md"}
            onClose={handleClose}
            fullWidth
        >
            {type === "Task" ? <CreateTask taskId={null} handleClose={handleClose} relatedTo={relatedTo} /> : null}
            {type === "Event" ? <CreateEvent eventId={null} handleClose={handleClose} relatedTo={relatedTo} /> : null}
            {type === "Case" ? <CreateCase caseId={null} handleClose={handleClose} relatedTo={relatedTo} /> : null}
            {type === "Note" ? <CreateNote noteId={null} handleClose={handleClose} relatedTo={relatedTo} /> : null}
            {type === "Email" ? <CreateEmail emailId={null} handleClose={handleClose} relatedTo={relatedTo} /> : null}
        </Dialog>
    </Box>
    );
}

export default Activity;
