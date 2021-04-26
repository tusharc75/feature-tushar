
import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import * as Yup from "yup";
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from "../../axios/axiosInstance";
import FormTypes from '../../components/Helpers/FormTypes'
import CustomButton from "../../components/Helpers/CustomButton";
import {
    CompositeDecorator,
    ContentBlock,
    ContentState,
    Editor,
    EditorState,
    convertFromHTML,
    convertToRaw,
} from 'draft-js'

import { RichEditorExample } from './RichEditor';
import "./RichEditorCss.css"

const termsAndConditionSchema = Yup.object().shape({
    TACName: Yup.string()
        .required("please enter terms and condition title"),
});


const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    },
    termAndConditionDialog: {
        height: "100%"
    },
    fileUpload: {
        width: '50%'
    },
    link: {

    }
}));

const TermsAndCondition = ({ handleClose, open, termsAndCondition, fetchData, editRecord }) => {

    const [initialValues, setInitialValues] = useState({ TACName: "", editorState: EditorState.createEmpty() });
    const classes = useStyles();

    function findLinkEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges(
            (character) => {
                const entityKey = character.getEntity();
                return (
                    entityKey !== null &&
                    contentState.getEntity(entityKey).getType() === 'LINK'
                );
            },
            callback
        );
    }

    const Link = (props) => {
        const { url } = props.contentState.getEntity(props.entityKey).getData();
        return (
            <a href={url} className={classes.link}>
                {props.children}
            </a>
        );
    };

    function findImageEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges(
            (character) => {
                const entityKey = character.getEntity();
                return (
                    entityKey !== null &&
                    contentState.getEntity(entityKey).getType() === 'IMAGE'
                );
            },
            callback
        );
    }
    const Image = (props) => {
        const {
            height,
            src,
            width,
        } = props.contentState.getEntity(props.entityKey).getData();

        return (
            <img src={src} height={height} width={width} />
        );
    };
    const decorator = new CompositeDecorator([
        {
            strategy: findLinkEntities,
            component: Link,
        },
        {
            strategy: findImageEntities,
            component: Image,
        },
    ]);
    // useEffect(() => {
    //     const sampleMarkup =
    //         '<b>Bold text</b>, <i>Italic text</i><br/ ><br />' +
    //         '<a href="https://www.facebook.com">Example link</a><br /><br/ >' +
    //         '<img src="https://raw.githubusercontent.com/facebook/draft-js/master/examples/draft-0-10-0/convertFromHTML/image.png" height="112" width="200" />';

    //     const blocksFromHTML = convertFromHTML(sampleMarkup);
    //     const state = ContentState.createFromBlockArray(
    //         blocksFromHTML.contentBlocks,
    //         blocksFromHTML.entityMap,
    //     );
    //     setInitialValues({
    //         TACName: "", file: "", editorState: EditorState.createWithContent(state, decorator)
    //     })
    // }, [])


    useEffect(() => {
        if (editRecord && editRecord?._id) {
            const blocksFromHTML = convertFromHTML(editRecord.description);
            const state = ContentState.createFromBlockArray(
                blocksFromHTML.contentBlocks,
                blocksFromHTML.entityMap,
            );
            setInitialValues({
                editorState: EditorState.createWithContent(state, decorator),
                TACName: editRecord.TACName
            })
        }
    }, [])
    const handleSave = (values) => {
        console.log("line 147 ~ handleSave ~ values", values)
        let request = {
            description: values.editorState.toString('html'),
            TACName: values.TACName
        }
        if (editRecord?._id) {
            axiosInstance()
                .put(termsAndCondition.api, { ...request, _id: editRecord?._id })
                .then(({ data }) => {
                    handleClose()
                    fetchData()
                })
        }
        else {
            axiosInstance()
                .post(termsAndCondition.api, request)
                .then(({ data }) => {
                    handleClose()
                    fetchData()
                })
        }
    };


    return <Dialog
        disableBackdropClick={true}
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="lg"
        onClose={handleClose}
        fullWidth
        className={classes.termAndConditionDialog}
    >
        <CustomDialogHeader onClose={handleClose}
            title={`${editRecord?._id ? "Edit" : "Create"} Terms and Condition`} ></CustomDialogHeader>
        {
            (initialValues && <Formik initialValues={initialValues}
                validationSchema={termsAndConditionSchema}
                onSubmit={handleSave}>
                {({ submitForm, touched, errors, setFieldValue, values
                    , handleBlur
                }) => (
                    <>
                        <CustomDialogContent>
                            <Form noValidate>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <Box padding={1}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <Field
                                                    component={TextFieldFormik}
                                                    fullWidth
                                                    margin="dense"
                                                    type="text"
                                                    label="Terms and Condition Name"
                                                    name="TACName"
                                                    variant="outlined"
                                                    required={true}
                                                    value={values["TACName"]}
                                                    onChange={(e) => setFieldValue("TACName", e.target.value.trimStart())}
                                                />
                                                {/* <Box mt={2} className={classes.fileUpload}>
                                                    <FormTypes
                                                        label="File"
                                                        name="file"
                                                        isTooltip={true}
                                                        required={false}
                                                        type="fileUpload"
                                                        values={values}
                                                        errors={errors}
                                                        size="small"

                                                    />
                                                </Box> */}
                                                <Box mt={2}>
                                                    <RichEditorExample
                                                        editorState={values.editorState}
                                                        onChange={setFieldValue}
                                                        onBlur={handleBlur}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </MuiPickersUtilsProvider>
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button color="primary" onClick={handleClose}>Cancel</Button>
                            <CustomButton
                                variant="contained"
                                color="primary"
                                onClick={() => handleSave(values)} >
                                Save
                            </CustomButton>
                        </CustomDialogFooter>
                    </>
                )}
            </Formik>
            )
        }
    </Dialog >
}

export default TermsAndCondition

