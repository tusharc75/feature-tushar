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
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { GetTaskDetail, CreateNewTask, UpdateTask } from "../../../axios/activity";
import moment from "moment";
import Divider from '@material-ui/core/Divider';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'
import TableChartIcon from '@material-ui/icons/TableChart';
import { SubTask } from './SubTask'
import PropTypes from 'prop-types'
import CustomDialogHeader from "../../CustomDialog/CustomDialogHeader";

const TaskSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter task name"),
    assignee: Yup.string()
        .required("please select assignee"),
    reporter: Yup.string()
        .required("please select reporter"),
});


export const CreateTask = ({ relatedTo, taskId, handleClose }) => {

    const [id, setId] = useState(taskId);
    const [initialValues, setInitialValues] = useState(null);
    const [openAddSub, setOpenAddSub] = React.useState(false);

    useEffect(() => {
        fetchTaskDetail();
    }, [id]);

    const fetchTaskDetail = async () => {
        if (id) {
            await GetTaskDetail(id)
                .then(({ data }) => {
                    setInitialValues(null)
                    setInitialValues(data)
                })
                .catch((err) => {
                });
        }
        else {
            setInitialValues({ name: "", description: "", status: "To Do", assignee: "", reporter: "", startDate: new Date(), dueDate: new Date() })
        }
    };

    const handleSave = (values) => {
        values.relatedTo = relatedTo;
        if (id) {
            UpdateTask(id, values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
        else {
            values.parentId = null
            CreateNewTask(values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
    };

    return (initialValues && <Formik initialValues={initialValues} validationSchema={TaskSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form>
                <DialogTitle title={`${id ? "Edit" : "New"} Task`} onClose={handleClose}></DialogTitle>

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
                                    {id && <Fragment>
                                        <Box mt={1}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                disableElevation
                                                onClick={() => setOpenAddSub(true)}
                                                startIcon={<TableChartIcon />}
                                            > Add a child Task</Button>
                                        </Box>
                                        <Box mt={2}>
                                            <SubTask
                                                openAddSub={openAddSub}
                                                setOpenAddSub={setOpenAddSub}
                                                data={initialValues}
                                                fetchTaskDetail={fetchTaskDetail}
                                                setId={setId}
                                            />
                                        </Box>
                                        <Box mt={2}>
                                            <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                        </Box>
                                        <Box mt={2} >
                                            <Divider />
                                            <Box mt={1} >
                                                <Comment referenceId={id} />
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
                                            name="assignee"
                                            label="Assignee"
                                            errors={errors}
                                            touched={touched}
                                            setFieldValue={setFieldValue}
                                            multiple={false}
                                            value={values["assignee"]}
                                        />
                                    </Box>
                                    <Box pt={1}>
                                        <UserDropdown
                                            name="reporter"
                                            label="Reporter"
                                            errors={errors}
                                            touched={touched}
                                            setFieldValue={setFieldValue}
                                            multiple={false}
                                            value={values["reporter"]}
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
                                            minDate={initialValues.parentData && initialValues.parentData.startDate}
                                            maxDate={initialValues.parentData && initialValues.parentData.dueDate}
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
                                            minDate={values.startDate}
                                            maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                                            format="yyyy/MM/DD"
                                        />
                                    </Box>
                                    {id && <Fragment>
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

CreateTask.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any
}