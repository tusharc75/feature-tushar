import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form, Field } from "formik";
import Autocomplete from '@material-ui/lab/Autocomplete';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { GetEmailDetail, CreateNewEmail, UpdateEmail } from "../../../axios/activity";
import moment from "moment";
import { RelatedToDispay } from '../Helpers/RelatedToDispay'
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';


const emailSchemaHelper = Yup.array().transform(function (value, originalValue) {
    if (this.isType(value) && value !== null) {
        return value;
    }
    return originalValue ? originalValue.split(/[\s,]+/) : [];
}).of(Yup.string().email(({ value }) => `${value} is not a valid email`));

const EmailSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter subject"),
    to: Yup.array().min(1)
        .transform(function (value, originalValue) {
            if (this.isType(value) && value !== null) {
                return value;
            }
            return originalValue ? originalValue.split(/[\s,]+/) : [];
        })
        .of(Yup.string().email(({ value }) => `${value} is not a valid email`)),
    // to: emailSchemaHelper.min(1),
    // cc: emailSchemaHelper,   //  Commented by punit

});


const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    }
}));

export const CreateEmail = ({ relatedTo, emailId, handleClose, options = [] }) => {

    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        fetchEmailDetail();
    }, []);

    const fetchEmailDetail = async () => {
        if (emailId) {
            await GetEmailDetail(emailId)
                .then(({ data }) => {
                    setInitialValues(data)
                })
                .catch((err) => {
                });
        }
        else {
            setInitialValues({ name: "", content: RichTextEditor.createEmptyValue(), to: [], cc: [] })
        }
    };

    const handleSave = (values) => {
        values.relatedTo = relatedTo;
        values.content = values.content.toString('html');
        if (emailId) {
            UpdateEmail(emailId, values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
        else {
            CreateNewEmail(values)
                .then(({ data }) => {
                    setInitialValues(null)
                    handleClose()
                })
                .catch((err) => {
                });
        }
    };

    const onKeyPress = (event) => {
        if (event.which === 13) {
            event.preventDefault();
        }
    }

    const handleToCcChange = (value) => {
        let val = []
        value.map(currentEmail => {
            let email = typeof currentEmail === 'object' ? currentEmail?.email : currentEmail
            if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
                val.push(email)
            }
        })
        return val
    }

    const classes = useStyles();

    return <>
        <CustomDialogHeader title={`${emailId ? "View" : "New"} Email`} onClose={handleClose}></CustomDialogHeader>
        {
            initialValues && <Formik
                initialValues={initialValues}
                validationSchema={EmailSchema}
                onSubmit={handleSave} onKeyPress={onKeyPress}>
                {({ submitForm, touched, errors, setFieldValue, values, setFieldTouched }) => (
                    <>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <CustomDialogContent>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <Box padding={1}>
                                        {emailId ?
                                            <Fragment>
                                                <Typography variant="subtitle1">Subject : {initialValues.name} </Typography>
                                                <Box mt={1} mb={1}>
                                                    <Typography variant="subtitle1">To : {initialValues.to.join()} </Typography>
                                                </Box>
                                                {initialValues.to.length && <Box mt={1} mb={1}>
                                                    <Typography variant="subtitle1">Cc : {initialValues.cc.join()} </Typography>
                                                </Box>}
                                                <Divider />
                                                <Box mt={2}>
                                                    <div dangerouslySetInnerHTML={{ __html: initialValues.content }} />
                                                </Box>
                                                <Box mt={2}>
                                                    <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                                </Box>
                                                <Box mt={1} color="text.secondary">
                                                    <Typography variant="body2">Sended {moment(initialValues.createdBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                                </Box>
                                            </Fragment> :
                                            <Grid container spacing={3} >
                                                <Grid item xs={12}>
                                                    <TextField
                                                        variant="outlined"
                                                        type="text"
                                                        label="Subject"
                                                        required={true}
                                                        name="name"
                                                        fullWidth
                                                        margin="dense"
                                                        value={values["name"]}
                                                        error={touched["name"] && Boolean(errors["name"])}
                                                        helperText={touched["name"] && errors["name"]}
                                                        onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                                    />
                                                    <Autocomplete
                                                        multiple
                                                        options={options}
                                                        getOptionLabel={option => option.email ?? ''}
                                                        freeSolo
                                                        renderTags={(value, getTagProps) =>
                                                            value.map((option, index) => (
                                                                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                                            ))
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                variant="outlined"
                                                                label="To"
                                                                margin="dense"
                                                                required={true}
                                                                error={touched["to"] && Boolean(errors["to"])}
                                                                helperText={touched["to"] && errors["to"]}
                                                                name="Email" />
                                                        )}
                                                        value={values["to"]}
                                                        // onBlur={(e: any) => {
                                                        //     if (e.target.value && e.target.value.trim() != "" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(e.target.value)) {
                                                        //         setFieldValue("to", [...values["to"], e.target.value])
                                                        //     }
                                                        // }}
                                                        onChange={(e, value) => setFieldValue("to", handleToCcChange(value))}
                                                    />
                                                    <Autocomplete
                                                        multiple
                                                        options={options}
                                                        getOptionLabel={option => option.email ?? ''}
                                                        freeSolo
                                                        renderTags={(value, getTagProps) =>
                                                            value.map((option, index) => (
                                                                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                                            ))
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                variant="outlined"
                                                                label="Cc"
                                                                margin="dense"
                                                                error={touched["cc"] && Boolean(errors["cc"])}
                                                                helperText={touched["cc"] && errors["cc"]}
                                                                name="Email" />
                                                        )}
                                                        value={values["cc"]}
                                                        // onBlur={(e: any) => {
                                                        //     if (e.target.value && e.target.value.trim() != "" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(e.target.value)) {
                                                        //         setFieldValue("cc", [...values["cc"], e.target.value])
                                                        //     }
                                                        // }}
                                                        onChange={(e, value) => setFieldValue("cc", handleToCcChange(value))}
                                                    />
                                                    <Box mt={2}>
                                                        <RichTextEditor
                                                            className={classes.textEditor}
                                                            value={values["content"]}
                                                            onChange={(value) => setFieldValue("content", value)}
                                                        />
                                                    </Box>
                                                </Grid>
                                            </Grid>}
                                    </Box>
                                </MuiPickersUtilsProvider>

                            </CustomDialogContent>
                            <CustomDialogFooter>
                                <Button color="primary" onClick={handleClose}>Cancel</Button>
                                {!emailId &&
                                    <Button color="primary" variant="contained"
                                        type="submit"
                                    >Send </Button>
                                }
                            </CustomDialogFooter>
                        </Form>
                    </>
                )}
            </Formik >
        }
    </>
}

CreateEmail.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any,
    options: PropTypes.any,
}