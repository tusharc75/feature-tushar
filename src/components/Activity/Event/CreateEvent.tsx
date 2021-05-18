import { useState, useEffect, Fragment, useContext } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  Button,
  TextField,
  Typography,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  FormHelperText,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  useMediaQuery,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { ArrowRightAlt } from "@material-ui/icons";
import { TextField as TextFieldFormik } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import {
  KeyboardDatePicker,
  KeyboardTimePicker,
  TimePicker,
} from "formik-material-ui-pickers";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import * as Yup from "yup";
import moment from "moment";
import { camelCase, isEmpty, kebabCase } from "lodash";

import {
  GetEventDetail,
  CreateNewEvent,
  UpdateEvent,
  DeleteEvent,
} from "../../../axios/activity";
import { UserDropdown } from "../Helpers/userDropdown";
import { RelatedToDispay } from "../Helpers/RelatedToDispay";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import getAzureAcessToken from "../../Azure/getAzureAccessToken";
import { AuthenticatedTemplate, useAccount, useMsal } from "@azure/msal-react";
import axiosInstance from "../../../axios/axiosInstance";
import { useData } from "../../../StateProvider/Provider";

const EventSchema = Yup.object().shape({
  name: Yup.string().required("Please enter event name"),
});

const TimeList = () => {
  var quarterHours = ["00", "15", "30", "45"];
  var times = [];
  for (var i = 0; i < 12; i++) {
    for (var j = 0; j < 4; j++) {
      times.push((i === 0 ? 12 : i) + ":" + quarterHours[j] + " AM");
    }
  }
  for (var i = 0; i < 12; i++) {
    for (var j = 0; j < 4; j++) {
      times.push((i === 0 ? 12 : i) + ":" + quarterHours[j] + " PM");
    }
  }
  return times;
};

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
    },
  },
};

export const CreateEvent = ({ relatedTo, eventId, handleClose }) => {
  const {
    state: {
      user: { user },
    },
  } = useData();
  const isMobile = useMediaQuery("(max-width:599px)");
  const [initialValues, setInitialValues] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const { instance, accounts, inProgress } = useMsal();
  const azureAccount = useAccount(accounts[0] || {});
  const [isSubmitting, setSubmitting] = useState(false);
  const [resource, setResource] = useState("");
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);

  useEffect(() => {
    fetchEventDetail();
  }, []);

  const fetchEventDetail = async () => {
    if (eventId) {
      await GetEventDetail(eventId)
        .then(({ data }) => {
          setInitialValues(data);
        })
        .catch((err) => {});
    } else {
      setInitialValues({
        name: "",
        description: "",
        location: "",
        participant: [],
        startDate: new Date(),
        endDate: new Date(),
        startTime: "12:00 AM",
        endTime: "12:00 AM",
      });
    }
  };

  // Data for Autocomplete
  useEffect(() => {
    if (!resource) return;
    setLoadingResources(true);
    axiosInstance()
      .get(`${kebabCase(resource)}?limit=100`)
      .then(({ data: { data } }) => {
        if (data.length) {
          const mappedData = data.map((_d) => getData(resource, _d));
          setResourceData(mappedData);
        }
        setLoadingResources(false);
      })
      .catch((error) => {
        setLoadingResources(false);
      });

    return () => {
      setSelectedResourceData(null);
      setResourceData(null);
    };
    // eslint-disable-next-line
  }, [resource]);

  const handleSave = async (values) => {
    setSubmitting(true);
    values.relatedTo = relatedTo;
    if (eventId) {
      UpdateEvent(eventId, values)
        .then(({ data }) => {
          setSubmitting(false);
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      if (!isEmpty(azureAccount)) {
        values.azureId = azureAccount.homeAccountId;
        values.graphToken = await getAzureAcessToken(instance);
      }
      if (relatedTo) {
        CreateNewEvent(values)
          .then(({ data }) => {
            setSubmitting(false);
            handleClose();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setSubmitting(false);
          });
      } else {
        if (resource && selectedResourceData) {
          values.relatedTo = [
            {
              type: camelCase(resource),
              referenceId: selectedResourceData.id,
              access: true,
            },
          ];
        } else {
          values.relatedTo = [
            {
              type: "user",
              referenceId: user._id,
              access: true,
            },
          ];
        }

        CreateNewEvent(values)
          .then(({ data }) => {
            handleClose();
            setSubmitting(false);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setSubmitting(false);
          });
      }
    }
  };

  function validate(values) {
    const errors = {};

    if (
      new Date(values.startDate).getTime() >= new Date(values.endDate).getTime()
    ) {
      errors["endDate"] = "Start and End Time and Date should be different";
    }
    return errors;
  }

  let times = TimeList();

  const resourceOptions = [
    "Customer Account",
    "Customer Contact",
    "Supplier Account",
    "Supplier Contact",
    "Lead",
    "Opportunity",
  ];

  const getData = (resource: string, data: any) => {
    switch (kebabCase(resource)) {
      case "lead":
        return {
          name: `${data.salutation} ${data.firstName} ${data.middleName} ${data.lastName}`,
          id: data._id,
        };
      case "opportunity":
        return {
          name: `${data.opportunityName}`,
          id: data._id,
        };
      case "customer-account":
        return {
          name: `${data.accountName}`,
          id: data._id,
        };
      case "supplier-account":
        return {
          name: `${data.accountName}`,
          id: data._id,
        };
      case "customer-contact":
        return {
          name: `${data.salutation} ${data.firstName} ${data.middleName} ${data.lastName}`,
          id: data._id,
        };
      case "supplier-contact":
        return {
          name: `${data.salutation} ${data.firstName} ${data.middleName} ${data.lastName}`,
          id: data._id,
        };
      default:
        break;
    }
  };

  return (
    initialValues && (
      <Formik
        initialValues={initialValues}
        validationSchema={EventSchema}
        onSubmit={handleSave}
        validate={validate}
      >
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`${eventId ? "Edit" : "New"} Event`}
              onClose={handleClose}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                  <Box padding={1}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Event Name"
                      required={true}
                      name="name"
                      fullWidth
                      margin="dense"
                      value={values["name"]}
                      error={touched["name"] && Boolean(errors["name"])}
                      helperText={touched["name"] && errors["name"]}
                      onChange={(e) =>
                        setFieldValue("name", e.target.value.trimStart())
                      }
                    />
                    <Box pt={1}>
                      <UserDropdown
                        name="participant"
                        label="Participant"
                        errors={errors}
                        touched={touched}
                        required={false}
                        setFieldValue={setFieldValue}
                        multiple={true}
                        value={values["participant"]}
                      />
                    </Box>
                    {!eventId && !relatedTo && (
                      <Box mt={2}>
                        <Autocomplete
                          options={resourceOptions}
                          getOptionLabel={(option) => option}
                          value={resource}
                          fullWidth
                          onChange={(event, newValue) => {
                            setResource(newValue);
                          }}
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Resource"
                              variant="outlined"
                            />
                          )}
                        />
                        <Box mt={2} />
                        {Boolean(resource) && resourceData && (
                          <Autocomplete
                            disabled={loadingResources}
                            options={resourceData}
                            getOptionLabel={(option: any) => option.name}
                            getOptionSelected={(option: any, value: any) =>
                              option.name === value.name
                            }
                            fullWidth
                            value={selectedResourceData}
                            onChange={(event, newValue) => {
                              setSelectedResourceData(newValue);
                            }}
                            size="small"
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={`Select ${resource}`}
                                variant="outlined"
                                required={Boolean(resource)}
                              />
                            )}
                          />
                        )}
                      </Box>
                    )}
                    <Box
                      pt={1}
                      display="flex"
                      flexDirection={isMobile ? "column" : "row"}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={7}>
                          <Field
                            component={KeyboardDatePicker}
                            label="Start Date"
                            name="startDate"
                            autoOk
                            variant="inline"
                            inputVariant="outlined"
                            fullWidth
                            margin="dense"
                            format="yyyy/MM/DD"
                          />
                        </Grid>

                        <Grid item xs={5}>
                          <Box>
                            {/* <FormControl
                              fullWidth
                              margin="dense"
                              variant="outlined"
                            >
                              <InputLabel id="demo-simple-select-outlined-label">
                                Start Time
                              </InputLabel>
                              <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={values["startTime"]}
                                onChange={(e) =>
                                  setFieldValue("startTime", e.target.value)
                                }
                                label="Start Time"
                                name="startTime"
                                error={
                                  touched["startTime"] &&
                                  Boolean(errors["startTime"])
                                }
                                MenuProps={MenuProps}
                              >
                                {times.map((_time, index) => (
                                  <MenuItem key={index} value={_time}>
                                    {_time}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl> */}
                            <Field
                              component={KeyboardTimePicker}
                              label="Start Time"
                              name="startDate"
                              autoOk
                              margin="dense"
                              variant="inline"
                              inputVariant="outlined"
                              fullWidth
                            />
                          </Box>
                        </Grid>
                      </Grid>

                      {!isMobile && (
                        <Box mt={2} px={1}>
                          <ArrowRightAlt color="disabled" />
                        </Box>
                      )}

                      <Grid container spacing={2}>
                        <Grid item xs={7}>
                          <Field
                            component={KeyboardDatePicker}
                            label="End Date"
                            name="endDate"
                            autoOk
                            variant="inline"
                            inputVariant="outlined"
                            fullWidth
                            margin="dense"
                            format="yyyy/MM/DD"
                            minDate={values["startDate"]}
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <Box>
                            {/* <FormControl
                              fullWidth
                              margin="dense"
                              variant="outlined"
                              error={
                                touched["endTime"] && Boolean(errors["endTime"])
                              }
                            >
                              <InputLabel id="demo-simple-select-outlined-label">
                                End Time
                              </InputLabel>
                              <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={values["endTime"]}
                                onChange={(e) =>
                                  setFieldValue("endTime", e.target.value)
                                }
                                label="End Time"
                                name="endTime"
                                error={
                                  touched["endTime"] &&
                                  Boolean(errors["endTime"])
                                }
                                MenuProps={MenuProps}
                              >
                                {times.map((_time, index) => (
                                  <MenuItem key={index} value={_time}>
                                    {_time}
                                  </MenuItem>
                                ))}
                              </Select>
                              <FormHelperText>
                                {touched["endTime"] && errors["endTime"]}
                              </FormHelperText>
                            </FormControl> */}
                            <Field
                              component={KeyboardTimePicker}
                              label="End Time"
                              name="endDate"
                              autoOk
                              margin="dense"
                              variant="inline"
                              inputVariant="outlined"
                              fullWidth
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Field
                      component={TextFieldFormik}
                      fullWidth
                      margin="dense"
                      type="text"
                      label="Location"
                      name="location"
                      variant="outlined"
                    />

                    <Field
                      component={TextFieldFormik}
                      fullWidth
                      margin="dense"
                      type="text"
                      multiline
                      rows={3}
                      label="Description"
                      name="description"
                      variant="outlined"
                    />

                    {eventId && (
                      <Fragment>
                        {initialValues.createdBy &&
                          initialValues.createdBy.date && (
                            <Box mt={1} color="text.secondary">
                              <Typography variant="body2">
                                Created{" "}
                                {moment(initialValues.createdBy.date).format(
                                  "MMM DD YYYY hh:mm A"
                                )}
                              </Typography>
                            </Box>
                          )}
                        {initialValues.updatedBy &&
                          initialValues.updatedBy.date && (
                            <Box mt={1} color="text.secondary">
                              <Typography variant="body2">
                                Updated{" "}
                                {moment(initialValues.updatedBy.date).format(
                                  "MMM DD YYYY hh:mm A"
                                )}
                              </Typography>
                            </Box>
                          )}
                      </Fragment>
                    )}
                    <AuthenticatedTemplate>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="meeting"
                            color="primary"
                            onChange={(e) =>
                              setFieldValue("meeting", e.target.checked)
                            }
                          />
                        }
                        label="meeting"
                      />
                    </AuthenticatedTemplate>

                    {eventId && (
                      <Fragment>
                        <Box mt={2}>
                          <RelatedToDispay
                            relatedTo={initialValues.relatedTo}
                          />
                        </Box>
                      </Fragment>
                    )}
                  </Box>
                </MuiPickersUtilsProvider>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                disabled={isSubmitting}
                color="primary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                type="button"
                color="primary"
                variant="contained"
                onClick={submitForm}
              >
                {isSubmitting ? <CircularProgress size={22} /> : "Save"}
              </Button>
              {eventId && (
                <Button
                  disabled={isSubmitting}
                  variant="outlined"
                  style={{ color: "red", borderColor: "red" }}
                  onClick={() =>
                    DeleteEvent(eventId)
                      .then(({ data }) => {
                        handleClose();
                      })
                      .catch((err) => {})
                  }
                >
                  Delete
                </Button>
              )}
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    )
  );
};

CreateEvent.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  handleClose: PropTypes.any,
};
