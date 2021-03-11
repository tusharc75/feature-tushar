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
import { GetCaseDetail, CreateNewCase, UpdateCase } from "../../../axios/activity";
import moment from "moment";
import Divider from '@material-ui/core/Divider';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'

const CaseSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter case name"),
    assignee: Yup.string()
        .required("please select assignee"),
    reporter: Yup.string()
        .required("please select reporter"),
});


export const CreateCase = ({ relatedTo, caseId, handleClose }) => {

    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        fetchCashDetail();
    }, []);

    const fetchCashDetail = async () => {
        if (caseId) {
            await GetCaseDetail(caseId)
                .then(({ data }) => {
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
        if (caseId) {
            UpdateCase(caseId, values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
        else {
            CreateNewCase(values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
    };

    return (initialValues && <Formik initialValues={initialValues} validationSchema={CaseSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form>
                <DialogTitle id="customized-dialog-title" onClose={handleClose}>{caseId ? "Edit" : "New"} Case</DialogTitle>
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
                                        label="Case Name"
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
                                    {caseId && <Fragment>
                                        <Box mt={2}>
                                            <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                        </Box>
                                        <Box mt={2} >
                                            <Divider />
                                            <Box mt={1} >
                                                <Comment referenceId={caseId} />
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
                                            required={true}
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
                                            required={true}
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
                                    {caseId && <Fragment>
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

