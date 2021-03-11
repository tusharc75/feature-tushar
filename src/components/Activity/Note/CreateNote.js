import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { DialogTitle, DialogContent, DialogActions } from '../Helpers/Dialog'
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
import { GetNote, CreateNewNote, UpdateNote, GetNoteDetail } from "../../../axios/activity";
import moment from "moment";
import Divider from '@material-ui/core/Divider';
import { Comment } from '../Comment';
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'

const NoteSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter note title"),
});


const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    }
}));

export const CreateNote = ({ relatedTo, noteId, handleClose }) => {

    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        fetchNoteDetail();
    }, []);

    const fetchNoteDetail = async () => {
        if (noteId) {
            await GetNoteDetail(noteId)
                .then(({ data }) => {
                    data.description = RichTextEditor.createValueFromString(data.description, 'html')
                    setInitialValues(data)
                })
                .catch((err) => {
                });
        }
        else {
            setInitialValues({ name: "", description: RichTextEditor.createEmptyValue() })
        }
    };

    const handleSave = (values) => {
        const description = values.description.toString('html');
        values.relatedTo = relatedTo;
        values.description = description;
        if (noteId) {
            UpdateNote(noteId, values)
                .then(({ data }) => {
                    setInitialValues(null)
                    handleClose()
                })
                .catch((err) => {
                });
        }
        else {
            CreateNewNote(values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
    };

    const classes = useStyles();
    return (initialValues && <Formik initialValues={initialValues} validationSchema={NoteSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form>
                <DialogTitle id="customized-dialog-title" onClose={handleClose}>{noteId ? "Edit" : "New"} Note</DialogTitle>
                <DialogContent>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Box padding={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Field
                                        component={TextFieldFormik}
                                        fullWidth
                                        margin="dense"
                                        type="text"
                                        label="Note Title"
                                        name="name"
                                        variant="outlined"
                                    />
                                    <Box mt={2}>
                                        <RichTextEditor
                                            className={classes.textEditor}
                                            value={values["description"]}
                                            onChange={(value) => setFieldValue("description", value)}
                                        />
                                    </Box>
                                    {noteId && <Fragment>
                                        <Box mt={2}>
                                            <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                        </Box>
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

