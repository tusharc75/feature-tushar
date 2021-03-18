import React, { useState, useEffect, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { CreateNewCase } from "../../../axios/activity";
import * as Yup from "yup";
import { TextField } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';
import { useHistory } from "react-router-dom";


const useStyles = makeStyles((theme) => ({
    marginLeft: {
        marginLeft: 10
    },
    boldFont: {
        fontWeight: 500
    },

}));

const ActivitySchema = Yup.object().shape({
    name: Yup.string()
        .min(3, "Too Short!")
        .max(50, "Too Long")
        .required("case name is required"),
});


export const SubCase = ({ setId, openAddSub, setOpenAddSub, fetchCaseDetail, data }) => {

    const history = useHistory();

    const handleSave = (values) => {
        values.parentId = data._id
        values.description = ""
        values.status = data.status
        values.assignee = data.assignee
        values.reporter = data.reporter
        values.startDate = data.startDate
        values.dueDate = data.dueDate
        values.relatedTo = data.relatedTo
        CreateNewCase(values)
            .then(({ data }) => {
                setOpenAddSub(false)
                fetchCaseDetail()
            })
            .catch((err) => {
            });
    };

    const handleOpenActivity = (id) => {

        setId(id)
        // history.push({
        //     pathname: '/project/board',
        //     search: '?projectId=' + projectId + '&activityId=' + id
        // })
    }

    const classes = useStyles();

    return <Box mt={3} mb={3}>
        {(data.childCase && data.childCase.length > 0 || openAddSub === true) &&
            <Box mb={1}>
                <Typography variant="body2" className={classes.boldFont}>Child Case</Typography>
            </Box>}
        {data.childCase && data.childCase.map((element, index) => (
            <Box key={index} border={1} onClick={() => handleOpenActivity(element._id)} borderColor="grey.300" p={1.5} mb={1} boxShadow={1}>
                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Typography variant="body2">{element.name}</Typography>
                    </Grid>
                    <Grid item xs={6} container justify="flex-end">
                        <Chip size="small" label={element.status} color="primary" />
                    </Grid>
                </Grid>
            </Box>
        ))}
        {openAddSub && <Box>
            <Formik initialValues={{ name: "" }} validationSchema={ActivitySchema} onSubmit={handleSave}>
                {({ submitForm }) => (
                    <Form>
                        <Field
                            component={TextField}
                            fullWidth
                            margin="dense"
                            type="text"
                            label={"Case Name"}
                            name="name"
                            variant="outlined"
                        />
                        <Box mt={1}>
                            <Button color="primary" size="small" variant="contained" onClick={submitForm}>Create</Button>
                            <Button
                                variant="contained"
                                size="small"
                                className={classes.marginLeft}
                                disableElevation
                                onClick={() => setOpenAddSub(false)}
                            > Cancel</Button>
                        </Box>
                    </Form>)}
            </Formik>
        </Box>}
    </Box>
}