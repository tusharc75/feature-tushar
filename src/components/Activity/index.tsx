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
import { MdEventNote } from 'react-icons/md';
import { IoIosMail } from 'react-icons/io'
import { RiTaskFill } from 'react-icons/ri'
import { FaSuitcase } from 'react-icons/fa'
import { MdNoteAdd } from 'react-icons/md'
import { makeStyles } from "@material-ui/core";
import { BiTask } from 'react-icons/bi';
import { VscCalendar } from 'react-icons/vsc';
import { BsBriefcase } from 'react-icons/bs';
import { GoNote } from 'react-icons/go';
import { HiOutlineMail } from 'react-icons/hi';
import { FiPlusSquare } from 'react-icons/fi';

const useStyles = makeStyles((theme) => ({
    activityBox: {
        padding:"1px 1px 9px 1px",
        background:"#ddd"
    },
    activitySubBox: {
        display: "flex",
        padding: "8px",
        borderColor: "rgb(224, 224, 224)",
        borderBottom: "1px solid #f5f5f5",
        margin: "8px 8px 0 8px",
        borderRadius: "3px",
        cursor: "pointer",
        background: "#fff"
    }
}));

const Activity = (props) => {
    const classes = useStyles();
    const { relatedTo, handleActivityRefresh } = props;
    const [type, setType] = useState(null);
    const [open, setOpen] = useState(false);

    const tabs = ["Task", "Event", "Case", "Note", "Email"];

    const getIcon = (tab: string) => {
        switch (tab) {
            case "Task":
                return <BiTask size={20} />

            case "Event":
                return <VscCalendar size={20} />

            case "Case":
                return <BsBriefcase size={20} />

            case "Note":
                return <GoNote size={20} />

            case "Email":
                return <HiOutlineMail size={20} />
        }
    }

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

    return (<Box>
        <Box className="detailHeader">
            <h2 className="listingHeader single">Activity</h2>
        </Box>
        <Box className={classes.activityBox}>
        {tabs.map((data, index) => (
            <Fragment key={index} >
                <Box className={classes.activitySubBox} onClick={(event) => handleChangeType(event, data)}>
                    <Grid container>
                        <Grid item xs={8} >
                            <Box display="flex">
                                <Box >
                                    <IconButton size="small">
                                        {type === data ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>
                                <Box ml={1} mt={0.5}>
                                    <Typography variant="subtitle2" color="primary" className="d-flex align-items-center gap-2">{getIcon(data)} {data}</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={4} container justify="flex-end" >
                            <IconButton color="primary" size="small" onClick={(event) => handleCreateActivity(event, data)}>
                                <FiPlusSquare />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
                <Box>
                    {type === "Task" && data === "Task" ? <Task relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Event" && data === "Event" ? <Event relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Case" && data === "Case" ? <Case relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Note" && data === "Note" ? <Note relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                    {type === "Email" && data === "Email" ? <Email relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} /> : null}
                </Box>
            </Fragment>
        ))}
        </Box>
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
