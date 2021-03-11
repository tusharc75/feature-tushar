import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { DialogTitle, DialogContent, DialogActions } from '../Helpers/Dialog'
import { UserDropdown } from '../Helpers/userDropdown';
import statusList from '../Helpers/statusList';
import Typography from '@material-ui/core/Typography';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import * as Yup from "yup";
import { GetEventDetail, CreateNewEvent, UpdateEvent } from "../../../axios/activity";
import moment from "moment";
import Divider from '@material-ui/core/Divider';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'

const EventSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter event name"),
});


const TimeList = () => {
    var quarterHours = ["00", "15", "30", "45"];
    var times = [];
    for (var i = 0; i < 12; i++) {
        for (var j = 0; j < 4; j++) {
            times.push((i === 0 ? 12 : i) + ":" + quarterHours[j] + " AM");
        }
    }
    for (var i = 0; i < 12; i++) {
        for (var j = 0; j < 4; j++) {
            times.push((i === 0 ? 12 : i) + ":" + quarterHours[j] + " PM");
        }
    }
    return times
}


const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

export const CreateEvent = ({ relatedTo, eventId, handleClose }) => {

    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        fetchEventDetail();
    }, []);

    const fetchEventDetail = async () => {
        if (eventId) {
            await GetEventDetail(eventId)
                .then(({ data }) => {
                    setInitialValues(data)
                })
                .catch((err) => {
                });
        }
        else {
            setInitialValues({ name: "", description: "", location: "", status: "To Do", participant: [], startDate: new Date(), endDate: new Date(), startTime: "12:00 AM", endTime: "12:00 AM" })
        }
    };

    const handleSave = (values) => {
        values.relatedTo = relatedTo;
        if (eventId) {
            UpdateEvent(eventId, values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
        else {
            CreateNewEvent(values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
    };

    let times = TimeList()
    return (initialValues && <Formik initialValues={initialValues} validationSchema={EventSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form>
                <DialogTitle id="customized-dialog-title" onClose={handleClose}>{eventId ? "Edit" : "New"} Event</DialogTitle>
                <DialogContent>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Box padding={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={7}>
                                    <Field
                                        component={TextFieldFormik}
                                        fullWidth
                                        margin="dense"
                                        type="text"
                                        label="Event Name"
                                        name="name"
                                        variant="outlined"
                                    />
                                    <Box pt={1}>
                                        <Field
                                            component={TextFieldFormik}
                                            fullWidth
                                            margin="dense"
                                            type="text"
                                            multiline
                                            rows={3}
                                            label="Description"
                                            name="description"
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Field
                                        component={TextFieldFormik}
                                        fullWidth
                                        margin="dense"
                                        type="text"
                                        label="Location"
                                        name="location"
                                        variant="outlined"
                                    />
                                    {eventId && <Fragment>
                                        <Box mt={2}>
                                            <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                        </Box>
                                        <Box mt={2} >
                                            <Divider />
                                            <Box mt={1} >
                                                <Comment referenceId={eventId} />
                                            </Box>
                                        </Box>
                                    </Fragment>}
                                </Grid>
                                <Grid item xs={5}>
                                    <Box pt={1}>
                                        <FormControl variant="outlined" fullWidth >
                                            <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                                            <Field
                                                component={Select}
                                                labelId="demo-simple-select-outlined-label"
                                                id="demo-simple-select-outlined"
                                                margin="dense"
                                                label="Status"
                                                name="status"
                                            >
                                                {statusList.map((_status, index) => (
                                                    <MenuItem key={index} value={_status.status}>{_status.status}</MenuItem>
                                                ))}
                                            </Field>
                                        </FormControl>
                                    </Box>
                                    <Box pt={1}>
                                        <UserDropdown
                                            name="participant"
                                            label="Participant"
                                            errors={errors}
                                            touched={touched}
                                            setFieldValue={setFieldValue}
                                            multiple={true}
                                            required={true}
                                            value={values["participant"]}
                                        />
                                    </Box>
                                    <Box pt={1}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={6}>
                                                <Field
                                                    component={KeyboardDatePicker}
                                                    label="Start Date"
                                                    name="startDate"
                                                    autoOk
                                                    variant="inline"
                                                    inputVariant="outlined"
                                                    fullWidth
                                                    margin="dense"
                                                    format="yyyy/MM/DD"
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box mt={1}>
                                                    <FormControl variant="outlined" fullWidth >
                                                        <InputLabel id="demo-simple-select-outlined-label">Start Time</InputLabel>
                                                        <Field
                                                            component={Select}
                                                            labelId="demo-simple-select-outlined-label"
                                                            id="demo-simple-select-outlined"
                                                            margin="dense"
                                                            label="Start Time"
                                                            name="startTime"
                                                            MenuProps={MenuProps}
                                                        >
                                                            {times.map((_time, index) => (
                                                                <MenuItem key={index} value={_time}>{_time}</MenuItem>
                                                            ))}
                                                        </Field>
                                                    </FormControl>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                    <Box pt={1}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={6}>
                                                <Field
                                                    component={KeyboardDatePicker}
                                                    label="End Date"
                                                    name="endDate"
                                                    autoOk
                                                    variant="inline"
                                                    inputVariant="outlined"
                                                    fullWidth
                                                    margin="dense"
                                                    format="yyyy/MM/DD"
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box mt={1}>
                                                    <FormControl variant="outlined" fullWidth >
                                                        <InputLabel id="demo-simple-select-outlined-label">End Time</InputLabel>
                                                        <Field
                                                            component={Select}
                                                            labelId="demo-simple-select-outlined-label"
                                                            id="demo-simple-select-outlined"
                                                            margin="dense"
                                                            label="End Time"
                                                            name="endTime"
                                                            MenuProps={MenuProps}
                                                        >
                                                            {times.map((_time, index) => (
                                                                <MenuItem key={index} value={_time}>{_time}</MenuItem>
                                                            ))}
                                                        </Field>
                                                    </FormControl>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                    {eventId && <Fragment>
                                        <Box mt={1} color="text.secondary">
                                            <Typography variant="body2">Created {moment(initialValues.createdAt).format("MMM DD YYYY hh:mm A")}</Typography>
                                        </Box>
                                        <Box mt={1} color="text.secondary">
                                            <Typography variant="body2">Updated {moment(initialValues.updatedAt).format("MMM DD YYYY hh:mm A")}</Typography>
                                        </Box>
                                    </Fragment>}
                                </Grid>
                            </Grid>
                        </Box>
                    </MuiPickersUtilsProvider>
                </DialogContent>
                <DialogActions>
                    <Button color="primary" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" color="primary" variant="contained">Save </Button>
                </DialogActions>
            </Form>)}
    </Formik>
    );
}

