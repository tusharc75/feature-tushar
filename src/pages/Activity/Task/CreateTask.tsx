import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { DialogTitle, DialogContent, DialogActions } from '../Helpers/Dialog'
import { AutocompleteField } from '../Helpers/AutocompleteField';

import Typography from '@material-ui/core/Typography';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { Autocomplete } from 'formik-material-ui-lab';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import { GetUsers } from "../../../axios/activity";
import * as Yup from "yup";
import axiosInstance from "../../../axios/axiosInstance";


const TaskSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter task name"),
});


export const CreateTask = ({ handleClose }) => {

    const handleSave = (values) => {
        axiosInstance().post("/task", values).then(() => {
            handleClose();
        })
    };

    const [users, setUsers] = React.useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        await GetUsers()
            .then(({ data }) => {
                let userData = []
                for (var value of data) {
                    userData.push({ userId: value._id, name: value.firstName + " " + value.lastName })
                }
                setUsers(userData)
            })
            .catch((err) => {
            });
    };


    return (<Formik initialValues={{ name: "", description: "", status: "Open", startDate: new Date() }} validationSchema={TaskSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors }) => (
            <Form>
                <DialogTitle title="New Task" onClose={handleClose}></DialogTitle>
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
                                        label="Task Name"
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
                                                <MenuItem value="Open">Open</MenuItem>
                                                <MenuItem value="Completed">Completed</MenuItem>
                                            </Field>
                                        </FormControl>
                                    </Box>
                                    <Box pt={1}>
                                        <Field
                                            name="assignee"
                                            component={Autocomplete}
                                            options={users}
                                            getOptionLabel={(option) => option.name}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    helperText={errors['assignee']}
                                                    error={touched['assignee'] && !!errors['assignee']}
                                                    label="Assignee"
                                                    variant="outlined"
                                                    margin="dense"
                                                />
                                            )}
                                        />
                                    </Box>
                                    <Box pt={1}>
                                        <Field
                                            name="repoter"
                                            component={Autocomplete}
                                            options={users}
                                            getOptionLabel={(option) => option.name}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    helperText={errors['repoter']}
                                                    error={touched['repoter'] && !!errors['repoter']}
                                                    label="Repoter"
                                                    variant="outlined"
                                                    margin="dense"
                                                />
                                            )}
                                        />
                                    </Box>
                                    <Box pt={1}>
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
                                    </Box>
                                    <Box pt={1}>
                                        <Field
                                            component={KeyboardDatePicker}
                                            label="Due Date"
                                            name="dueDate"
                                            autoOk
                                            variant="inline"
                                            inputVariant="outlined"
                                            fullWidth
                                            margin="dense"
                                            format="yyyy/MM/DD"
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </MuiPickersUtilsProvider>
                </DialogContent>
                <DialogActions>
                    <Button color="primary" onClick={handleClose}> Cancel  </Button>
                    <Button type="submit" color="primary" variant="contained" onClick={submitForm}>Save </Button>
                </DialogActions>
            </Form>)}
    </Formik>
    );
}

