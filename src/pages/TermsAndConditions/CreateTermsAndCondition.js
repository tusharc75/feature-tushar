// import React, { useState, useEffect, Fragment } from "react";
// import Box from '@material-ui/core/Box';
// import Grid from '@material-ui/core/Grid';
// import Button from '@material-ui/core/Button';
// import { Dialog } from '@material-ui/core'
// import Typography from '@material-ui/core/Typography';
// import { TextField as TextFieldFormik, Select } from "formik-material-ui";
// import { Formik, Form, Field } from "formik";
// import { MuiPickersUtilsProvider } from '@material-ui/pickers';
// import MomentUtils from '@date-io/moment';
// import TextField from '@material-ui/core/TextField';
// import * as Yup from "yup";
// import moment from "moment";
// import RichTextEditor from 'react-rte';
// import { makeStyles } from '@material-ui/core/styles';
// import PropTypes from 'prop-types'
// import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
// import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
// import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
// import CustomButton from '../../components/Helpers/Button'
// import axiosInstance from "../../axios/axiosInstance";

// const useStyles = makeStyles((theme) => ({
//     textEditor: {
//         fontFamily: "inherit",
//         minHeight: 250
//     }
// }));

// const TermsAndConditionSchema = Yup.object().shape({
//     TACName: Yup.string()
//         .required("please enter terms and condition name"),
// });

// const CreateTermsAndConditions = ({ open, onClose, termsAndCondition, onMessage }) => {

//     const classes = useStyles();
//     const [initialValues, setInitialValues] = useState({ TACName: "", description: RichTextEditor.createEmptyValue() })
//     const [loading, setLoading] = useState(false)

//     const handleSubmit = values => {
//         const description = values.description.toString('html');
//         values.description = description
//         setLoading(true);

//         try {
//             axiosInstance()
//                 .post(termsAndCondition.Api, values)
//                 .then(({ data }) => {
//                     console.log("🚀 ~ file: CreateTermsAndCondition.js ~ line 52 ~ .then ~ data", data)
//                     // onMessage({
//                     //     open: true,
//                     //     type: "success",
//                     //     message: data.message,
//                     // });
//                     // setLoading(false);
//                     onClose({ fetchData: true })
//                 })
//                 .catch((error) => {
//                     console.log("🚀 ~ file: CreateTermsAndCondition.js ~ line 61 ~ CreateTermsAndConditions ~ error", error)
//                     // onMessage(error);
//                     // setLoading(false);
//                 });
//         }
//         catch (error) {
//             console.log('error', error)
//         }

//     };
//     return <Dialog
//         maxWidth="md"
//         aria-labelledby="customized-dialog-title"
//         onClose={onClose}
//         open={open}
//         disableBackdropClick={true}
//     >
//         <CustomDialogHeader
//             title="New Terms and Condition"
//             onClose={onClose}
//         />
//         {
//             (initialValues && <Formik
//                 initialValues={initialValues}
//                 onSubmit={handleSubmit}
//                 validationSchema={TermsAndConditionSchema}
//             >
//                 {({ submitForm, touched, errors, setFieldValue, values }) => (
//                     <Form>
//                         <CustomDialogContent>
//                             <MuiPickersUtilsProvider utils={MomentUtils}>
//                                 <Box padding={1}>
//                                     <Grid container spacing={3}>
//                                         <Grid item xs={12}>
//                                             <Field
//                                                 component={TextFieldFormik}
//                                                 fullWidth
//                                                 margin="dense"
//                                                 type="text"
//                                                 label="Terms and Condition Name"
//                                                 name="TACName"
//                                                 variant="outlined"
//                                             />
//                                             <Box mt={2}>
//                                                 <RichTextEditor
//                                                     className={classes.textEditor}
//                                                     value={values["description"]}
//                                                     onChange={(value) => setFieldValue("description", value)}
//                                                 />
//                                             </Box>
//                                         </Grid>
//                                     </Grid>
//                                 </Box>
//                             </MuiPickersUtilsProvider>
//                         </CustomDialogContent>
//                         <CustomDialogFooter>
//                             <Button color="primary" onClick={onClose}>Cancel</Button>
//                             <CustomButton
//                                 variant="contained"
//                                 color="primary"
//                                 type="submit"
//                                 loading={loading}
//                                 onClick={() => handleSubmit(values)}
//                                 disabled={loading || Object.keys(errors).length > 0 ? true : false}
//                             >
//                                 Save
//                     </CustomButton>
//                         </CustomDialogFooter>
//                     </Form>)}
//             </Formik>)
//         }
//     </Dialog>
// }

// export default CreateTermsAndConditions



import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { GetNote, CreateNewNote, UpdateNote, GetNoteDetail } from "../../axios/activity";
import moment from "moment";
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types'
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from "../../axios/axiosInstance";


const NoteSchema = Yup.object().shape({
    TACName: Yup.string()
        .required("please enter note title"),
});


const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    }
}));

const Temp = ({ noteId, handleClose, open, termsAndCondition }) => {

    const [initialValues, setInitialValues] = useState({ TACName: "", description: RichTextEditor.createEmptyValue() });

    const handleSave = (values) => {
        const description = values.description.toString('html');
        values.description = description;
        console.log("🚀 ~ file: CreateTermsAndCondition.js ~ line 180 ~ handleSave ~ values", values)

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
            axiosInstance()
                .post(termsAndCondition.Api, values)
                .then(() => {
                    // onMessage({
                    //     open: true,
                    //     type: "success",
                    //     message: data.message,
                    // });
                    // setLoading(false);
                    // onClose({ fetchData: true })
                    handleClose()
                })
                .catch((error) => {
                    console.log("🚀 ~ file: CreateTermsAndCondition.js ~ line 61 ~ CreateTermsAndConditions ~ error", error)
                    // onMessage(error);
                    // setLoading(false);
                });
            handleClose()
        }
    };

    const classes = useStyles();
    return <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={handleClose}
        fullWidth
    >
        {
            (initialValues && <Formik initialValues={initialValues} validationSchema={NoteSchema} onSubmit={handleSave}>
                {({ submitForm, touched, errors, setFieldValue, values }) => (
                    <Form>
                        <CustomDialogHeader onClose={handleClose} ></CustomDialogHeader>
                        <CustomDialogContent>
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
                                                name="TACName"
                                                variant="outlined"
                                            />
                                            <Box mt={2}>
                                                <RichTextEditor
                                                    className={classes.textEditor}
                                                    value={values["description"]}
                                                    onChange={(value) => setFieldValue("description", value)}
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </MuiPickersUtilsProvider>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button color="primary" onClick={handleClose}>Cancel</Button>
                            <Button type="submit" color="primary" variant="contained">Save </Button>
                        </CustomDialogFooter>
                    </Form>)}
            </Formik>
            )
        }
    </Dialog>
}

export default Temp
// CreateNote.propTypes = {
//     handleClose: PropTypes.any
// }

