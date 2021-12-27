import { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Button,
  TextField,
  Divider,
  MenuItem,
  InputLabel,
  FormControl,
  Breadcrumbs,
  Typography,
  CircularProgress
} from '@material-ui/core';
import TableChartIcon from '@material-ui/icons/TableChart';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import { Formik, Form, Field } from 'formik';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { object, string } from 'yup';
import moment from 'moment';
import { GetTaskDetail, CreateNewTask, UpdateTask } from '../../../axios/activity';
import { UserDropdown } from '../Helpers/userDropdown';
import statusList from '../Helpers/statusList';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import { SubTask } from './SubTask';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import Loader from '../../Loader';
import { dateFormat, dateFormatForInputControl } from '../../../constants/helpers';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';

const TaskSchema = object().shape({
  name: string().required('Please enter task name'),
  assignee: string().required('Please select assignee'),
  reporter: string().required(),
  startDate: string().required('Please enter start date'),
  dueDate: string().required('Please enter due date')
});

export const CreateTask = ({ relatedTo, taskId, handleClose, status, isMinimized, onMinimizeMaximize, showManimizeMaximize }) => {
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [id, setId] = useState(taskId);
  const [initialValues, setInitialValues] = useState(null);
  const [openAddSub, setOpenAddSub] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    fetchTaskDetail();
  }, [id]);

  const fetchTaskDetail = async () => {
    if (id) {
      await GetTaskDetail(id)
        .then(({ data }) => {
          setInitialValues(null);
          setInitialValues(data);
          setFormValues(data);
        })
        .catch((err) => {});
    } else {
      let initialData = {
        name: '',
        description: '',
        status: status || 'To Do',
        assignee: '',
        reporter: user._id,
        startDate: new Date(),
        dueDate: new Date()
      };
      setInitialValues(initialData);
      setFormValues(initialData);
    }
  };

  const handleSave = (values) => {
    setSubmitting(true);
    values.relatedTo = relatedTo;
    if (id) {
      UpdateTask(id, values)
        .then(({ data }) => {
          setSubmitting(false);
          handleClose();
        })
        .catch((err) => {
          setSubmitting(false);
        });
    } else {
      values.parentId = null;
      CreateNewTask(values)
        .then(({ data }) => {
          setSubmitting(false);
          handleClose();
        })
        .catch((err) => {
          setSubmitting(false);
        });
    }
  };

  function validate(values) {
    const errors = {};
    if (moment(values.startDate) > moment(values.dueDate)) {
      errors['dueDate'] = 'Due date must greater then start date';
    }
    return errors;
  }
  const isFieldNotTouched = (initialValues, values) => {
    return Object.values(initialValues).toString() === Object.values(values).toString();
  };
  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
  };

  return (
    <>
      <CustomDialogHeader
        title={`${id ? 'Edit' : 'New'} Task`}
        onClose={() => {
          if (isFieldNotTouched(initialValues, formValues)) handleClose();
          else setShowConfirmDialog(true);
        }}
        isMinimized={isMinimized}
        onMinimizeMaximize={onMinimizeMaximize}
        showManimizeMaximize={showManimizeMaximize}
      ></CustomDialogHeader>
      {initialValues ? (
        <Formik initialValues={initialValues} validationSchema={TaskSchema} onSubmit={handleSave} validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <h2 className="form-label-style" style={{ borderBottom: 'none' }}>
                    * Required Fields
                  </h2>
                  <Box padding={1}>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                      <Box mb={2}>
                        <Breadcrumbs separator="/" aria-label="breadcrumb">
                          {initialValues.parent &&
                            initialValues.parent.map((_p, index) => {
                              return (
                                <Button size="small" key={index} className="cursor-pointer" onClick={() => setId(_p._id)} color="primary">
                                  {_p.name}
                                </Button>
                              );
                            })}
                        </Breadcrumbs>
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={7} sm={6}>
                          <TextField
                            variant="outlined"
                            type="text"
                            label="Task Name"
                            required={true}
                            name="name"
                            fullWidth
                            margin="dense"
                            value={values['name']}
                            error={touched['name'] && Boolean(errors['name'])}
                            helperText={touched['name'] && errors['name']}
                            onChange={(e) => {
                              setFieldValue('name', e.target.value.trimStart());
                              handleValuesChange({ name: e.target.value.trimStart() });
                            }}
                          />
                          <Box pt={1}>
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
                              onChange={(e) => {
                                setFieldValue('description', e.target.value);
                                handleValuesChange({ description: e.target.value });
                              }}
                            />
                          </Box>
                          <Box pt={1}>
                            <FormControl variant="outlined" fullWidth>
                              <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                              <Field
                                component={Select}
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                margin="dense"
                                label="Status"
                                name="status"
                              >
                                {statusList.map((_status, index) => (
                                  <MenuItem key={index} value={_status.status}>
                                    {_status.status}
                                  </MenuItem>
                                ))}
                              </Field>
                            </FormControl>
                          </Box>
                          <Box pt={1}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sm={6} md={6}>
                                <UserDropdown
                                  name="assignee"
                                  label="Assignee"
                                  errors={errors}
                                  touched={touched}
                                  required={true}
                                  setFieldValue={(name, value) => {
                                    handleValuesChange({ [name]: value });
                                    setFieldValue(name, value);
                                  }}
                                  multiple={false}
                                  value={values['assignee']}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6} md={6}>
                                <UserDropdown
                                  name="reporter"
                                  label="Reporter"
                                  errors={errors}
                                  touched={touched}
                                  required={true}
                                  setFieldValue={(name, value) => {
                                    handleValuesChange({ [name]: value });
                                    setFieldValue(name, value);
                                  }}
                                  multiple={false}
                                  value={values['reporter']}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                          <Box pt={1}>
                            <Grid container spacing={1}>
                              <Grid item xs={12} sm={6} md={6}>
                                <Field
                                  component={KeyboardDatePicker}
                                  label="Start Date"
                                  name="startDate"
                                  autoOk
                                  variant="inline"
                                  inputVariant="outlined"
                                  fullWidth
                                  margin="dense"
                                  format={dateFormat}
                                  minDate={new Date()}
                                  maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6} md={6}>
                                <Field
                                  component={KeyboardDatePicker}
                                  label="Due Date"
                                  name="dueDate"
                                  autoOk
                                  variant="inline"
                                  inputVariant="outlined"
                                  fullWidth
                                  margin="dense"
                                  minDate={values.startDate}
                                  maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                                  format={dateFormat}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                          {id && (
                            <Fragment>
                              {initialValues.createdBy && initialValues.createdBy.date && (
                                <Box mt={1} color="text.secondary">
                                  <Typography variant="body2">Created {moment(initialValues.createdBy.date).format(dateFormat)}</Typography>
                                </Box>
                              )}
                              {initialValues.updatedBy && initialValues.updatedBy.date && (
                                <Box mt={1} color="text.secondary">
                                  <Typography variant="body2">Updated {moment(initialValues.updatedBy.date).format(dateFormat)}</Typography>
                                </Box>
                              )}
                            </Fragment>
                          )}
                        </Grid>
                        <Grid item xs={12} md={5} sm={6}>
                          {id && (
                            <Fragment>
                              <Box mt={1}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  disableElevation
                                  onClick={() => setOpenAddSub(true)}
                                  startIcon={<TableChartIcon />}
                                >
                                  Add a child Task
                                </Button>
                              </Box>
                              <Box mt={2}>
                                <SubTask
                                  openAddSub={openAddSub}
                                  setOpenAddSub={setOpenAddSub}
                                  data={initialValues}
                                  fetchTaskDetail={fetchTaskDetail}
                                  setId={setId}
                                />
                              </Box>
                            </Fragment>
                          )}
                        </Grid>
                      </Grid>
                      <Box mt={2}>
                        <RelatedToDispay relatedTo={initialValues.relatedTo} />
                      </Box>
                      {id && (
                        <Box mt={2}>
                          <Divider />
                          <Box mt={1}>
                            <Comment referenceId={id} />
                          </Box>
                        </Box>
                      )}
                    </MuiPickersUtilsProvider>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  disabled={isSubmitting}
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (isFieldNotTouched(initialValues, values)) handleClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={isSubmitting} type="button" color="primary" size="small" variant="contained" onClick={submitForm}>
                  {isSubmitting ? <CircularProgress size={22} /> : 'Save'}
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    handleClose();
                  }}
                />
              ) : null}
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

CreateTask.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  status: PropTypes.any,
  handleClose: PropTypes.any
};
