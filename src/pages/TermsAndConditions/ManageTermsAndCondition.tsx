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
import { termsAndConditionDocumentUploadMaxSize } from "../../constants/helpers";
import TinyMce from "./../../components/TinyMCE"

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
  root: {
    flexGrow: 1,
  },
  errorText: {
    color: theme.palette.error.main,
  },
  buttonContainer: {
    display: 'flex',
    padding: '4px',
    paddingLeft: '5px',
    border: '1px solid lightgray',
    borderBottom: '0'
  }
}));

const TermsAndCondition = ({
  handleClose,
  open,
  termsAndCondition,
  fetchData,
  editRecord,
  displayTitle
}) => {

  const [loading, setLoading] = useState(false);
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({
    TACName: "",
    file: "",
    description: "",
  });
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
      setInitialValues({
        description: editRecord.description,
        TACName: editRecord.TACName,
        file: editRecord?.file ?? "",
      });
    }
  }, [editRecord]);

  const handleSubmit = (values) => {
    let request = {
      description: values.description,
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
        onClose={handleClose}
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
                          <Box mt={2}>
                            <TinyMce
                              onChange={(value) => {
                                setFieldValue("description", value)
                              }}
                              initialValue={initialValues?.description}
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
                  type="submit"
                  disabled={uploadingImageOrFileProgress > 0}
                  onClick={submitForm}
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

export default TermsAndCondition