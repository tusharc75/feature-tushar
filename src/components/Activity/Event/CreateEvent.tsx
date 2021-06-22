import { useState, useEffect, Fragment, useContext } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  Button,
  TextField,
  Typography,
  CircularProgress,
  useMediaQuery,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { ArrowRightAlt } from "@material-ui/icons";
import { TextField as TextFieldFormik } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
  KeyboardTimePicker,
} from "@material-ui/pickers";
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
import { useAccount, useMsal } from "@azure/msal-react";
import axiosInstance from "../../../axios/axiosInstance";
import { useData } from "../../../StateProvider/Provider";
import Loader from "../../Loader";
import { dateFormat } from "../../../constants/helpers";

const EventSchema = Yup.object().shape({
  name: Yup.string().required("Please enter event name").min(3, "Too Short"),
  startTime: Yup.string().required("Please enter start time").nullable(),
  startDate: Yup.string().required("Please enter start date").nullable(),
  endTime: Yup.string().required("Please enter end time").nullable(),
  endDate: Yup.string().required("Please enter end date").nullable(),
});

export const CreateEvent = ({ relatedTo, eventId, handleClose, email }) => {
  const {
    state: {
      user: { user },
    },
  } = useData();
  const isMobile = useMediaQuery("(max-width:599px)");
  const [initialValues, setInitialValues] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const { instance, accounts } = useMsal();
  const azureAccount = useAccount(accounts[0] || {});
  const [isSubmitting, setSubmitting] = useState(false);
  const [resource, setResource] = useState("");
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);

  useEffect(() => {
    fetchEventDetail();
  }, [eventId]);

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
        participant: [{ userId: user._id }],
        startDate: new Date(),
        endDate: new Date(),
        startTime: getTime(new Date()),
        endTime: new Date(getTime(new Date()).getTime() + 30 * 60000),
      });
    }
  };

  const getTime = (date) => {
    let diff = 60 - new Date().getMinutes();
    const currentTime = date;

    if (diff > 30) {
      diff = diff - 30;
    }

    return new Date(currentTime.getTime() + diff * 60000);
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
    if (!isEmpty(azureAccount)) {
      values.azureId = azureAccount.homeAccountId;
      values.graphToken = await getAzureAcessToken(instance);
    }
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
      new Date(values.startTime).getTime() >= new Date(values.endTime).getTime()
    ) {
      errors["endTime"] = "End time should be different";
    }

    if (
      new Date(values.startDate).getTime() > new Date(values.endDate).getTime()
    ) {
      errors["endDate"] = "End date should be greater then start date";
    }

    if (new Date(values.startTime).toString() === "Invalid Date") {
      errors["startTime"] = "Invalid Time";
    }
    if (new Date(values.endTime).toString() === "Invalid Date") {
      errors["endTime"] = "Invalid Time";
    }

    return errors;
  }

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
    <>
      <CustomDialogHeader
        title={`${eventId ? "Edit" : "New"} Event`}
        onClose={handleClose}
      ></CustomDialogHeader>
      {initialValues ? (
        <Formik
          initialValues={initialValues}
          validationSchema={EventSchema}
          onSubmit={handleSave}
          validate={validate}
        >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
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
                          email={
                            email
                              ? email.map((e) => ({ userId: e, name: e }))
                              : []
                          }
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
                            <KeyboardDatePicker
                              autoOk
                              size="small"
                              disablePast
                              variant="inline"
                              inputVariant="outlined"
                              value={values.startDate}
                              name="startDate"
                              label="Start Date"
                              onChange={(date: any) => {
                                setFieldValue("startDate", date);
                                setFieldValue("startTime", getTime(date._d));
                              }}
                              format={dateFormat}
                              error={
                                Boolean(touched["startDate"]) &&
                                Boolean(errors["startDate"])
                              }
                              helperText={
                                Boolean(touched["startDate"]) &&
                                errors["startDate"]
                              }
                              InputLabelProps={{
                                shrink: true,
                              }}
                              margin="dense"
                            />
                          </Grid>

                          <Grid item xs={5}>
                            <KeyboardTimePicker
                              autoOk
                              ampm={false}
                              size="small"
                              variant="inline"
                              inputVariant="outlined"
                              label="Start Time"
                              name="startTime"
                              placeholder="08:00 AM"
                              mask="__:__ _M"
                              value={values.startTime}
                              invalidDateMessage="Invalid time format"
                              onChange={(date: any) => {
                                console.log(date._d);
                                setFieldValue("startTime", date);
                                setFieldValue(
                                  "endTime",
                                  new Date(
                                    new Date(date._d).getTime() + 30 * 60000
                                  )
                                );
                              }}
                              error={
                                Boolean(touched["startTime"]) &&
                                Boolean(errors["startTime"])
                              }
                              helperText={
                                Boolean(touched["startTime"]) &&
                                errors["startTime"]
                              }
                              InputLabelProps={{
                                shrink: true,
                              }}
                              margin="dense"
                            />
                          </Grid>
                        </Grid>

                        {!isMobile && (
                          <Box mt={2} px={1}>
                            <ArrowRightAlt color="disabled" />
                          </Box>
                        )}

                        <Grid container spacing={2}>
                          <Grid item xs={7}>
                            <KeyboardDatePicker
                              autoOk
                              size="small"
                              disablePast
                              variant="inline"
                              inputVariant="outlined"
                              minDate={values.startDate}
                              value={values.endDate}
                              name="endDate"
                              label="End Date"
                              onChange={(date: any) => {
                                setFieldValue("endDate", date);
                                setFieldValue(
                                  "endTime",
                                  new Date(
                                    getTime(date._d).getTime() + 30 * 60000
                                  )
                                );
                              }}
                              format={dateFormat}
                              error={
                                Boolean(touched["endDate"]) &&
                                Boolean(errors["endDate"])
                              }
                              helperText={
                                Boolean(touched["endDate"]) && errors["endDate"]
                              }
                              InputLabelProps={{
                                shrink: true,
                              }}
                              margin="dense"
                            />
                          </Grid>
                          <Grid item xs={5}>
                            <KeyboardTimePicker
                              autoOk
                              ampm={false}
                              size="small"
                              variant="inline"
                              inputVariant="outlined"
                              label="End Time"
                              name="endTime"
                              placeholder="08:00 AM"
                              mask="__:__ _M"
                              value={values.endTime}
                              onChange={(date) =>
                                setFieldValue("endTime", date)
                              }
                              error={
                                Boolean(touched["endTime"]) &&
                                Boolean(errors["endTime"])
                              }
                              helperText={
                                Boolean(touched["endTime"]) && errors["endTime"]
                              }
                              InputLabelProps={{
                                shrink: true,
                              }}
                              margin="dense"
                            />
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

                      {eventId &&
                      initialValues?.relatedTo &&
                      initialValues.relatedTo.length ? (
                        <Fragment>
                          <Box mt={2}>
                            <RelatedToDispay
                              relatedTo={initialValues.relatedTo}
                            />
                          </Box>
                        </Fragment>
                      ) : null}
                    </Box>
                  </MuiPickersUtilsProvider>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  disabled={isSubmitting}
                  color="primary"
                  size="small"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting}
                  type="button"
                  color="primary"
                  variant="contained"
                  size="small"
                  onClick={submitForm}
                >
                  {isSubmitting ? <CircularProgress size={22} /> : "Save"}
                </Button>
                {eventId && (
                  <Button
                    disabled={isSubmitting}
                    variant="outlined"
                    size="small"
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
      ) : (
        <CustomDialogContent>
          <Loader minHeight="500px" text="Loading..." />
        </CustomDialogContent>
      )}
    </>
  );
};

CreateEvent.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  handleClose: PropTypes.any,
  email: PropTypes.array,
};
