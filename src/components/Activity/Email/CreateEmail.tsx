import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
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
import { CircularProgress, Tooltip } from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import { UnauthenticatedTemplate, useAccount, useMsal } from "@azure/msal-react";
import { AzureLogin } from "../../Azure/Azure";
import getAzureAcessToken from "../../Azure/getAzureAccessToken";
import { getAllJSDocTagsOfKind } from "typescript";

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

export const CreateEmail = ({ relatedTo, emailId, handleClose }) => {
    const { instance, accounts, inProgress } = useMsal();
    const azureAcoount = useAccount(accounts[0] || {});
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
    
    const [sending,setSending] = useState(false)
    const handleSave = async (values) => {
        setSending(true)
        try {
            // values.relatedTo = relatedTo;
            // values.content = values.content.toString('html');
            // values.grapToken = await getAzureAcessToken(instance);
            const payload = {
                relatedTo: relatedTo,
                message: values.content.toString('html'),
                graphToken: await getAzureAcessToken(instance),
                to: values.to,
                cc: values.cc,
                subject: values.name,
                mailbox:azureAcoount.username
            }

            if (emailId) {
                UpdateEmail(emailId, values)
                    .then(({ data }) => {
                        handleClose()
                    })
                    .catch((err) => {
                    });
            }
            else {
                CreateNewEmail(payload)
                    .then(({ data }) => {
                        setInitialValues(null)
                        handleClose()
                    })
                    .catch((err) => {
                        console.log(err);
                        setInitialValues(null)
                    });
            }
        } catch (e) {

        }
    setSending(false)
    };



    const onKeyPress = (event) => {
        if (event.which === 13) {
            event.preventDefault();
        }
    }

    const classes = useStyles();
    
    return <>
        {initialValues && <Formik initialValues={initialValues} validationSchema={EmailSchema} onSubmit={handleSave} onKeyPress={onKeyPress}>
            {({ submitForm, touched, errors, setFieldValue, values }) => (
                <Form autoComplete="off" autoCorrect="off" noValidate >
                    <CustomDialogHeader title={`${emailId ? "View" : "New"} Email`} onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Box padding={1}>
                                {emailId ?
                                    <Fragment>
                                        <Typography variant="subtitle1">Subject : {initialValues.name || initialValues.subject} </Typography>
                                        <Box mt={1} mb={1}>
                                            <Typography variant="subtitle1">To : {initialValues.to.join()} </Typography>
                                        </Box>
                                        {initialValues.to.length && <Box mt={1} mb={1}>
                                            <Typography variant="subtitle1">Cc : {initialValues.cc.join()} </Typography>
                                        </Box>}
                                        <Divider />
                                        <Box mt={2}>
                                            <div dangerouslySetInnerHTML={{ __html: initialValues.content || initialValues.message }} />
                                        </Box>
                                        <Box mt={2}>
                                            <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                        </Box>
                                        <Box mt={1} color="text.secondary">
                                            <Typography variant="body2">Sended {moment(initialValues.createdBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                        </Box>
                                    </Fragment> :
                                    <Grid container spacing={3}>
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
                                                options={["rajat@vebholic.com"]}
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
                                                        placeholder="Email" />
                                                )}
                                                value={values["to"]}
                                                // onBlur={(e: any) => {
                                                //     if (e.target.value && e.target.value.trim() != "" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(e.target.value)) {
                                                //         setFieldValue("to", [...values["to"], e.target.value])
                                                //     }
                                                // }}
                                                onChange={(e, value) => {
                                                    let val = []
                                                    for (var email of value) {
                                                        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
                                                            val.push(email)
                                                        }
                                                    }
                                                    setFieldValue("to", val)
                                                }}
                                            />
                                            <Autocomplete
                                                multiple
                                                options={[]}
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
                                                        placeholder="Email" />
                                                )}
                                                value={values["cc"]}
                                                // onBlur={(e: any) => {
                                                //     if (e.target.value && e.target.value.trim() != "" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(e.target.value)) {
                                                //         setFieldValue("cc", [...values["cc"], e.target.value])
                                                //     }
                                                // }}
                                                onChange={(e, value) => {
                                                    let val = []
                                                    for (var email of value) {
                                                        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
                                                            val.push(email)
                                                        }
                                                    }
                                                    setFieldValue("cc", val)
                                                }}
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
                        <Typography color="textSecondary"> {!emailId && <> Mail will sent from {azureAcoount?.username} </>}</Typography>
                        <Button color="primary" onClick={handleClose}>Cancel</Button>
                        {!emailId &&
                            <Button type="submit" color="primary" variant="contained" disabled={sending}>
                               {sending ? (<><CircularProgress color="inherit" size={14} style={{marginRight:"10px"}} />
                                Sending ... </>) : "send"} 
                             </Button>}
                    </CustomDialogFooter>
                </Form>)
            }
        </Formik >
        }
        {!emailId && <UnauthenticatedTemplate>
            <Box position="absolute" bgcolor="rgba(0,0,0,0.6)" style={{
                backdropFilter: "blur(2px)",
                color: "#F9FAFB",
            }} zIndex={10} top={0} left={0} height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
                <Box width="100%" textAlign="center">
                    <AzureLogin></AzureLogin>
                    <Box width="50%" marginX="auto" marginY={2} bgcolor="#F9FAFB" height="1px"></Box>
                    <Typography >To able to send Mail you need to Log  Into azure Account</Typography>
                </Box>
            </Box>
        </UnauthenticatedTemplate>}
        
    </>

}

CreateEmail.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any
}