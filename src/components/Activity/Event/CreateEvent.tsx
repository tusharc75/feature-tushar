import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { UserDropdown } from '../Helpers/userDropdown';
import statusList from '../Helpers/statusList';
import Typography from '@material-ui/core/Typography';
import { TextField as TextFieldFormik } from "formik-material-ui";
import TextField from '@material-ui/core/TextField';
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
import PropTypes from 'prop-types'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import Select from '@material-ui/core/Select';
import FormHelperText from '@material-ui/core/FormHelperText';
import { isEmpty } from "lodash";
import getAzureAcessToken from "../../Azure/getAzureAccessToken";
import { AuthenticatedTemplate, useAccount, useMsal } from "@azure/msal-react";
import { Checkbox, FormControlLabel } from "@material-ui/core";

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
    const toastConfig = useContext(CustomToastContext);
    const { instance, accounts, inProgress } = useMsal();
    const azureAccount = useAccount(accounts[0] || {});

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

    const handleSave = async (values) => {

        values.relatedTo = relatedTo;

        if (eventId) {
            UpdateEvent(eventId, values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
        else {


            if (!isEmpty(azureAccount)) {
                values.azureId = azureAccount.homeAccountId;
                values.graphToken = await getAzureAcessToken(instance);
            }
            CreateNewEvent(values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }

    };

    function validate(values) {
        const errors = {};
        if (moment(values.startDate) > moment(values.endDate)) {
            errors["dueDate"] = 'End date must greater then start date';
        }
        if (moment(values.startDate).format("YYYY-MM-DD") === moment(values.endDate).format("YYYY-MM-DD") && values.startTime === values.endTime) {
            errors["endTime"] = 'Start Time and End Time should be different';
        }
        return errors;
    };

    let times = TimeList()
    return (initialValues && <Formik initialValues={initialValues} validationSchema={EventSchema} onSubmit={handleSave} validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
                <CustomDialogHeader title={`${eventId ? "Edit" : "New"} Event`} onClose={handleClose}></CustomDialogHeader>
                <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate >
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Box padding={1}>
                                <Grid container spacing={3}>
                                    <Grid item xs={7}>
                                        <TextField
                                            variant="outlined"
                                            type="text"
                                            label="Event Name"
                                            required={true}
                                            name="name"
                                            fullWidth
                                            margin="dense"
                                            value={values["name"]}
                                            error={touched["name"] && Boolean(errors["name"])}
                                            helperText={touched["name"] && errors["name"]}
                                            onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
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
                                        <AuthenticatedTemplate>
                                            <FormControlLabel control={
                                                <Checkbox
                                                    name="meeting"
                                                    color="primary"
                                                    onChange={(e) => setFieldValue("meeting", e.target.checked)}
                                                />
                                            }
                                                label="meeting"
                                            />
                                        </AuthenticatedTemplate>

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
                                        <FormControl fullWidth margin="dense" variant="outlined">
                                            <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                                            <Select
                                                labelId="demo-simple-select-outlined-label"
                                                id="demo-simple-select-outlined"
                                                value={values["status"]}
                                                onChange={(e) => setFieldValue("status", e.target.value)}
                                                label="Status"
                                                name="status"
                                                error={touched["status"] && Boolean(errors["status"])}
                                                MenuProps={MenuProps}
                                            >
                                                {statusList.map((_status, index) => (
                                                    <MenuItem key={index} value={_status.status}>{_status.status}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Box pt={1}>
                                            <UserDropdown
                                                name="participant"
                                                label="Participant"
                                                errors={errors}
                                                touched={touched}
                                                required={false}
                                                setFieldValue={setFieldValue}
                                                multiple={true}
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
                                                    <Box>
                                                        <FormControl fullWidth margin="dense" variant="outlined">
                                                            <InputLabel id="demo-simple-select-outlined-label">Start Time</InputLabel>
                                                            <Select
                                                                labelId="demo-simple-select-outlined-label"
                                                                id="demo-simple-select-outlined"
                                                                value={values["startTime"]}
                                                                onChange={(e) => setFieldValue("startTime", e.target.value)}
                                                                label="Start Time"
                                                                name="startTime"
                                                                error={touched["startTime"] && Boolean(errors["startTime"])}
                                                                MenuProps={MenuProps}
                                                            >
                                                                {times.map((_time, index) => (
                                                                    <MenuItem key={index} value={_time}>{_time}</MenuItem>
                                                                ))}
                                                            </Select>
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
                                                        minDate={values["startDate"]}
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Box >
                                                        <FormControl fullWidth margin="dense" variant="outlined" error={touched["endTime"] && Boolean(errors["endTime"])}>
                                                            <InputLabel id="demo-simple-select-outlined-label">End Time</InputLabel>
                                                            <Select
                                                                labelId="demo-simple-select-outlined-label"
                                                                id="demo-simple-select-outlined"
                                                                value={values["endTime"]}
                                                                onChange={(e) => setFieldValue("endTime", e.target.value)}
                                                                label="End Time"
                                                                name="endTime"
                                                                error={touched["endTime"] && Boolean(errors["endTime"])}
                                                                MenuProps={MenuProps}
                                                            >
                                                                {times.map((_time, index) => (
                                                                    <MenuItem key={index} value={_time}>{_time}</MenuItem>
                                                                ))}

                                                            </Select>
                                                            <FormHelperText>{touched["endTime"] && errors["endTime"]}</FormHelperText>
                                                        </FormControl>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                        {eventId && <Fragment>
                                            {initialValues.createdBy && initialValues.createdBy.date && <Box mt={1} color="text.secondary">
                                                <Typography variant="body2">Created {moment(initialValues.createdBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                            </Box>}
                                            {initialValues.updatedBy && initialValues.updatedBy.date && <Box mt={1} color="text.secondary">
                                                <Typography variant="body2">Updated {moment(initialValues.updatedBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                            </Box>}
                                        </Fragment>}
                                    </Grid>
                                </Grid>
                            </Box>
                        </MuiPickersUtilsProvider>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button color="primary" onClick={handleClose}>Cancel</Button>
                    <Button type="button" color="primary" variant="contained" onClick={submitForm}>Save </Button>
                </CustomDialogFooter>
            </>
        )}
    </Formik>
    );
}

CreateEvent.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any
}
