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
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { termsAndConditionDocumentUploadMaxSize } from "../../constants/helpers";
import TinyMce from "./../../components/TinyMCE"
import { Autocomplete } from "@material-ui/lab";
import TextField from "@material-ui/core/TextField";
import { useData } from "../../StateProvider/Provider";

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
  const {
    state: { user },
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({
    TACName: "",
    file: "",
    description: "",
    entity: [],
    owner: user.user._id,
    collaborator: []
  });

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

  const termsAndConditionSchema = Yup.object().shape({
    TACName: Yup.string().required(`please add ${displayTitle.toLowerCase()} name`),
    owner: Yup.string().required(`Owner is required`),
  });
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);

  const [additionalDataPosition, setAdditionalDataPosition] = useState(editRecord ? editRecord.topPosition?.toString() : "true");
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalDataPosition((event.target as HTMLInputElement).value);
  };
  const [disableSaveButton, setDisableSaveButton] = useState(false)

  useEffect(() => {
    if (editRecord && editRecord?._id) {
      setInitialValues({
        description: editRecord.description,
        TACName: editRecord.TACName,
        file: editRecord?.file ?? "",
        entity: editRecord?.entity ? editRecord?.entity : [],
        owner: editRecord?.owner ? editRecord?.owner : user.user._id,
        collaborator: editRecord?.collaborator ? editRecord?.collaborator : []
      });
      if (user.user._id !== editRecord?.owner && !editRecord?.collaborator?.some(d => d === user.user._id)) {
        setDisableSaveButton(true)
      }
    }
  }, [editRecord]);

  useEffect(() => {
    fetchUser();
  }, [open]);


  const fetchUser = () => {
    axiosInstance().get(`/user`).then(({ data: { data } }) => {
      setOwnerCollaboratorData(data);
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const handleSubmit = (values) => {
    let request = {
      description: values.description,
      TACName: values.TACName,
      file: values?.file ?? "",
      entity: values?.entity,
      owner: values?.owner,
      collaborator: values?.collaborator
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
                          <Grid container spacing={1}>
                            <Grid item xs={12} sm={3}>
                              {<Autocomplete
                                multiple
                                options={user?.entity}
                                getOptionLabel={(option: any) => (option ? option?.entityName : "")}
                                value={user?.entity.filter((data) => values["entity"]?.some(d => d === data._id)).length
                                  ? user?.entity.filter((data) => values["entity"]?.some(d => d === data._id))
                                  : []}
                                onChange={(e, val) => {
                                  setFieldValue("entity", val && val?.map(d => d._id))
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    margin="dense"
                                    name="entity"
                                    label="Entity"
                                    variant="outlined"
                                    error={touched["entity"] && Boolean(errors["entity"])}
                                    helperText={touched["entity"] && errors["entity"]}
                                    fullWidth
                                  />
                                )}
                              />}
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              {<Autocomplete
                                getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                                value={ownerCollaboratorData.filter((data) => data._id === values["owner"]).length
                                  ? ownerCollaboratorData.filter((data) => data._id === values["owner"])[0]
                                  : ""}
                                options={ownerCollaboratorData.filter(user => !values["collaborator"]?.some((d) => (user._id === d)))}
                                onChange={(e, val) => {
                                  setFieldValue("owner", val && val._id ? val._id : "");
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    margin="dense"
                                    name="owner"
                                    label="Owner"
                                    variant="outlined"
                                    error={touched["owner"] && Boolean(errors["owner"])}
                                    helperText={touched["owner"] && errors["owner"]}
                                    required={true}
                                    fullWidth
                                  />
                                )}
                              />}
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              {<Autocomplete
                                multiple
                                options={ownerCollaboratorData.filter(d => d._id !== values["owner"])}
                                getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                                value={ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id)).length
                                  ? ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id))
                                  : []}
                                onChange={(e, val) => {
                                  setFieldValue("collaborator", val && val?.map(d => d._id))
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    margin="dense"
                                    name="collaborator"
                                    label="Collaborator"
                                    variant="outlined"
                                    error={touched["collaborator"] && Boolean(errors["collaborator"])}
                                    helperText={touched["collaborator"] && errors["collaborator"]}
                                    fullWidth
                                  />
                                )}
                              />}
                            </Grid>
                          </Grid>

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
                  disabled={uploadingImageOrFileProgress > 0 || disableSaveButton}
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