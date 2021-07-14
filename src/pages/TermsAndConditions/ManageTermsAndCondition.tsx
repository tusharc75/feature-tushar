import React, { useState, useEffect, useContext } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { TextField as TextFieldFormik } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import * as Yup from "yup";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import FormTypes from "../../components/Helpers/FormTypes";
import CustomButton from "../../components/Helpers/CustomButton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import htmlToDraft from "html-to-draftjs";
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import { RichTextEditor } from "../../components/RichEditor/RichEditor";
import { termsAndConditionDocumentUploadMaxSize } from "../../constants/helpers";



const useStyles = makeStyles((theme) => ({
  textEditor: {
    fontFamily: "inherit",
    minHeight: 250,
  },
  termAndConditionDialog: {
    height: "100%",
  },
  fileUpload: {
    width: "50%",
  },
}));

const TermsAndCondition = ({
  handleClose,
  open,
  termsAndCondition,
  fetchData,
  editRecord,
  displayTitle
}) => {
  const [initialValues, setInitialValues] = useState({
    TACName: "",
    file: "",
    editorState: EditorState.createEmpty(),
  });
  const [loading, setLoading] = useState(false);
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

  const termsAndConditionSchema = Yup.object().shape({
    TACName: Yup.string().required(`please add ${displayTitle.toLowerCase()} name`),
  });

  const [additionalDataPosition, setAdditionalDataPosition] = useState(editRecord ? editRecord.topPosition?.toString() : "true");
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalDataPosition((event.target as HTMLInputElement).value);
  };

  useEffect(() => {
    if (editRecord && editRecord?._id) {
      let state = convertFromRaw(JSON.parse(editRecord.description));
      setInitialValues({
        editorState: EditorState.createWithContent(state),
        TACName: editRecord.TACName,
        file: editRecord?.file ?? "",
      });
    }
  }, [editRecord]);

  const handleSubmit = (values) => {
    const description = convertToRaw(values.editorState.getCurrentContent());
    let request = {
      description: JSON.stringify(description),
      TACName: values.TACName,
      file: values?.file ?? "",
    };

    if (displayTitle === "Additional Data") {
      request["topPosition"] = additionalDataPosition === "true" ? true : false
    }

    setLoading(true);
    if (editRecord?._id) {
      axiosInstance()
        .put(termsAndCondition.api, { ...request, _id: editRecord?._id })
        .then(({ data }) => {
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setLoading(false);
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    } else {
      axiosInstance()
        .post(termsAndCondition.api, request)
        .then(({ data }) => {
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setLoading(false);
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const appendData = (htmlData, setFieldValue) => {
    if (htmlData) {
      const blocksFromHtml = htmlToDraft(htmlData);
      const { contentBlocks, entityMap } = blocksFromHtml;
      const contentState = ContentState.createFromBlockArray(
        contentBlocks,
        entityMap
      );
      const editorState = EditorState.createWithContent(contentState);
      setFieldValue("editorState", editorState);
    }
  };

  return (
    <Dialog
      disableBackdropClick={true}
      open={open}
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      maxWidth="md"
      onClose={handleClose}
      fullWidth
      className={classes.termAndConditionDialog}
    >
      <CustomDialogHeader
        title={`${editRecord?._id
          ? `Edit ${editRecord?.TACName ?? ""}`
          : `Create ${displayTitle}`
          }`}
      ></CustomDialogHeader>
      {initialValues && (
        <Formik
          initialValues={initialValues}
          validationSchema={termsAndConditionSchema}
          onSubmit={handleSubmit}
        >
          {({
            submitForm,
            touched,
            errors,
            setFieldValue,
            values,
            handleBlur,
            setFieldTouched,
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
                            label={`${displayTitle} Name`}
                            name="TACName"
                            variant="outlined"
                            required={true}
                            value={values["TACName"]}
                            onChange={(e) =>
                              setFieldValue(
                                "TACName",
                                e.target.value.trimStart()
                              )
                            }
                          />
                          {(displayTitle === "Additional Data") &&
                            <Box mt={2} >
                              <FormControl component="fieldset">
                                <FormLabel component="legend">{`Position of ${displayTitle.toLowerCase()} with respect to product data`}</FormLabel>
                                <RadioGroup aria-label="postion" name="postion" value={additionalDataPosition} onChange={handleChange}>
                                  <FormControlLabel value="true" control={<Radio />} label="Above of product data" />
                                  <FormControlLabel value="false" control={<Radio />} label="Below of product data" />
                                </RadioGroup>
                              </FormControl>
                            </Box>
                          }
                          <Box mt={2} className={classes.fileUpload}>
                            <FormTypes
                              label="File"
                              name="file"
                              isTooltip={true}
                              required={false}
                              type="fileUpload"
                              accept=".docx"
                              uploadFileUrl="/doc-parser"
                              values={values}
                              errors={errors}
                              touched={touched}
                              size="small"
                              setFieldValue={(name, file) =>
                                setFieldValue("file", file)
                              }
                              onAppendData={(data) =>
                                appendData(data, setFieldValue)
                              }
                              doNotShowUploadedFile={true}
                              fileUploadMaxSize={
                                termsAndConditionDocumentUploadMaxSize
                              } //size in bytes
                              imageOrFileUploadCompletePercentage={(
                                completePercentage
                              ) => {
                                setUploadingImageOrFileProgress(
                                  completePercentage
                                );
                              }}
                            />
                          </Box>
                          <Box mt={2}>
                            <RichTextEditor
                              editorState={values.editorState}
                              onChange={setFieldValue}
                              onBlur={handleBlur}
                              placeholder={displayTitle}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </MuiPickersUtilsProvider>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" color="primary" onClick={handleClose}>
                  Cancel
                </Button>
                <CustomButton
                  variant="contained"
                  color="primary"
                  loading={loading}
                  disabled={uploadingImageOrFileProgress > 0}
                  onClick={() => {
                    if (Object.keys(errors).length) {
                      Object.keys(errors).forEach((key) => {
                        setFieldTouched(key, true);
                      });
                      return;
                    }
                    handleSubmit(values);
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default TermsAndCondition;
