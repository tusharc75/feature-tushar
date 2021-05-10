import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { GetNote, CreateNewNote, UpdateNote, GetNoteDetail } from "../../../axios/activity";
import moment from "moment";
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'
import PropTypes from 'prop-types'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';


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
            <>
                <CustomDialogHeader onClose={handleClose} title={`${noteId ? "Edit" : "New"} Note`}></CustomDialogHeader>
                <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate >
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Box padding={1}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            variant="outlined"
                                            type="text"
                                            label="Note Title"
                                            required={true}
                                            name="name"
                                            fullWidth
                                            margin="dense"
                                            value={values["name"]}
                                            error={touched["name"] && Boolean(errors["name"])}
                                            helperText={touched["name"] && errors["name"]}
                                            onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
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

CreateNote.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any
}