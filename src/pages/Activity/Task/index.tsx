import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { CreateTask } from './CreateTask';

const Task = () => {

    const [open, setOpen] = useState(false);


    const handleClose = () => {
        setOpen(false)
    }

    return (
        <Box p={3}>
            <Grid container>
                <Grid xs={12} container justify="flex-end">
                    <Button color="primary" variant="contained" onClick={() => setOpen(true)} >New Task</Button>
                </Grid>
            </Grid>
            <Dialog
                open={open}
                aria-labelledby="customized-dialog-title"
                maxWidth="md"
                onClose={handleClose}
                fullWidth
            >
                <CreateTask handleClose={handleClose} />
            </Dialog>
        </Box>
    );
}

export default Task;
