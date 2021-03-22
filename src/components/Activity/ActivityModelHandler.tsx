import React, { useState, useEffect, Fragment } from "react";
import { CreateTask } from "./Task/CreateTask";
import { CreateEvent } from "./Event/CreateEvent";
import { CreateCase } from "./Case/CreateCase";
import { CreateNote } from "./Note/CreateNote";
import { CreateEmail } from "./Email/CreateEmail";
import Dialog from '@material-ui/core/Dialog';
import { useHistory } from "react-router-dom";

const ActivityModelHandler = (props) => {

    const { activityType, activityId } = props;
    const history = useHistory();

    const handleClose = () => {
        history.push({
            pathname: '/activity/' + activityType,
        })
    }

    return (
        <Dialog
            open={true}
            aria-labelledby="customized-dialog-title"
            maxWidth={"md"}
            onClose={handleClose}
            fullWidth
        >
            {activityType === "task" ? <CreateTask taskId={activityId} handleClose={handleClose} /> : null}
            {activityType === "event" ? <CreateEvent eventId={activityId} handleClose={handleClose} /> : null}
            {activityType === "case" ? <CreateCase caseId={activityId} handleClose={handleClose} /> : null}
            {activityType === "note" ? <CreateNote noteId={activityId} handleClose={handleClose} /> : null}
            {activityType === "email" ? <CreateEmail emailId={activityId} handleClose={handleClose} /> : null}
        </Dialog>
    );
}

export default ActivityModelHandler;
