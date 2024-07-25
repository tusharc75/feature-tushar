import DateUtils from '@date-io/date-fns';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@material-ui/core';
import TableChartIcon from '@material-ui/icons/TableChart';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import axios, { CancelTokenSource } from 'axios';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { object, string } from 'yup';
import { useData } from '../../../StateProvider/Provider';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { dateFormat, dateFormatForInputControl } from '../../../constants/helpers';
import Loader from '../../Loader';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import statusList from '../Helpers/statusList';
import { UserDropdown } from '../Helpers/userDropdown';
import { SubTask } from './SubTask';

const TaskSchema = object().shape({
  name: string().required('Please enter task name'),
  //assignee: string().required('Please select assignee'),
  reporter: string().required(),
  startDate: string().required('Please enter start date'),
  dueDate: string().required('Please enter due date')
});

export const CreateTask = ({
  relatedTo,
  taskId,
  handleClose,
  status,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  defaultName = '',
  defaultDescription = ''
}) => {
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

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchTaskDetail(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTaskDetail = async (cancelTokenSource?: CancelTokenSource) => {
    if (id) {
      axiosInstance()
        .get(`/task/${id}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          if (data?.assignee && data?.assignee !== '') {
            if (typeof data?.assignee === 'string') {
              data['assignee'] = [{ userId: data?.assignee }];
            } else {
              data['assignee'] = data?.assignee?.map((assignee) => ({
                userId: assignee
              }));
            }
          } else {
            data['assignee'] = [];
          }
          setInitialValues(null);
          setInitialValues(data);
        })
        .catch((err) => {});
    } else {
      let initialData = {
        name: defaultName,
        description: defaultDescription,
        status: status || 'To Do',
        assignee: [],
        reporter: user._id,
        startDate: new Date(),
        dueDate: new Date()
      };
      setInitialValues(initialData);
    }
  };

  const handleSave = (values) => {
    setSubmitting(true);
    values.relatedTo = relatedTo;
    if (id) {
      axiosInstance()
        .put(`/task/${id}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      values.parentId = null;
      axiosInstance()
        .post('/task', values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    }
  };

  function validate(values) {
    const errors = {};
    const dueDate = moment(values.dueDate, dateFormatForInputControl).startOf('day');
    const startDate = moment(values.startDate, dateFormatForInputControl).startOf('day');
    if (dueDate.isBefore(startDate) && !startDate.isSame(dueDate)) {
      errors['dueDate'] = 'Due date must greater then start date';
    }
    return errors;
  }

  return (
    <>
      {initialValues ? (
        <Formik initialValues={initialValues} validationSchema={TaskSchema} onSubmit={handleSave} validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogHeader
                title={`${id ? 'Edit' : 'New'} Task`}
                onClose={() => {
                  if (isEqual(initialValues, values)) handleClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={isMinimized}
                onMinimizeMaximize={onMinimizeMaximize}
                showManimizeMaximize={showManimizeMaximize}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box padding={1}>
                    <MuiPickersUtilsProvider utils={DateUtils}>
                      <Box mb={2}>
                        <Breadcrumbs separator="/" aria-label="breadcrumb">
                          {initialValues.parent &&
                            initialValues.parent.map((_p, index) => {
                              return (
                                <Button
                                  size="small"
                                  key={index}
                                  className="asdfasfdasdfas cursor-pointer"
                                  onClick={() => setId(_p._id)}
                                  color="primary"
                                >
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
                            }}
                          />
                          <Box pt={1}>
                            <TextField
                              fullWidth
                              margin="dense"
                              type="text"
                              multiline
                              rows={3}
                              label="Description"
                              name="description"
                              value={values['description']}
                              variant="outlined"
                              onChange={(e) => {
                                setFieldValue('description', e.target.value);
                              }}
                            />
                          </Box>
                          {id && (
                            <Box pt={1}>
                              <ThemeButton
                                tooltip="Add a child Task"
                                iconForMobile={<TableChartIcon />}
                                onClick={() => setOpenAddSub(true)}
                                startIcon={<TableChartIcon />}
                              >
                                Add a child Task
                              </ThemeButton>
                            </Box>
                          )}
                          <Box mt={2}>
                            <SubTask
                              openAddSub={openAddSub}
                              setOpenAddSub={setOpenAddSub}
                              data={initialValues}
                              fetchTaskDetail={fetchTaskDetail}
                              setId={setId}
                            />
                          </Box>
                          {id && (
                            <Box mt={2}>
                              <RelatedToDispay relatedTo={initialValues.relatedTo} />
                              {initialValues?.formRelatedTo?.fields?.length > 0 && (
                                <Box mt={1}>
                                  <Chip key={0} label={initialValues?.formRelatedTo?.fields?.map((f) => f?.fieldLabel)?.join(', ')} size="medium" />
                                </Box>
                              )}
                            </Box>
                          )}
                          {id && (
                            <Box mt={2}>
                              <Divider />
                              <Box mt={1}>
                                <Comment referenceId={id} />
                              </Box>
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12} md={5} sm={6}>
                          <Fragment>
                            <Box mt={1}>
                              <Box>
                                <FormControl variant="outlined" fullWidth>
                                  <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                                  <Select
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    margin="dense"
                                    label="Status"
                                    name="status"
                                    value={values['status']}
                                    onChange={(e) => {
                                      setFieldValue('status', e.target.value);
                                    }}
                                  >
                                    {statusList.map((_status, index) => (
                                      <MenuItem key={index} value={_status.status}>
                                        {_status.status}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                              <Box pt={1}>
                                <Grid container spacing={1}>
                                  <Grid item xs={12} sm={12} md={12}>
                                    <UserDropdown
                                      name="assignee"
                                      label="Assignee"
                                      errors={errors}
                                      touched={touched}
                                      required={false}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      multiple={true}
                                      value={values['assignee']}
                                      email={[]}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={12} md={12}>
                                    <UserDropdown
                                      name="reporter"
                                      label="Reporter"
                                      errors={errors}
                                      touched={touched}
                                      required={true}
                                      setFieldValue={(name, value) => {
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
                                  <Grid item xs={12} sm={12} md={12}>
                                    <KeyboardDatePicker
                                      label="Start Date"
                                      name="startDate"
                                      autoOk
                                      variant="inline"
                                      inputVariant="outlined"
                                      fullWidth
                                      margin="dense"
                                      format={dateFormatForInputControl}
                                      value={values.startDate}
                                      onChange={(value) => {
                                        setFieldValue('dueDate', value);
                                        setFieldValue('startDate', value);
                                      }}
                                      maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={12} md={12}>
                                    <KeyboardDatePicker
                                      label="Due Date"
                                      name="dueDate"
                                      autoOk
                                      variant="inline"
                                      inputVariant="outlined"
                                      fullWidth
                                      margin="dense"
                                      minDate={values.startDate}
                                      maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                                      value={values.dueDate}
                                      onChange={(value) => {
                                        setFieldValue('dueDate', value);
                                      }}
                                      format={dateFormatForInputControl}
                                    />
                                    {Boolean(errors['dueDate']) && <span className="text-[12px] text-red-500">{errors['dueDate']}</span>}
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
                                  </Grid>
                                </Grid>
                              </Box>
                            </Box>
                          </Fragment>
                        </Grid>
                      </Grid>
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
                    if (isEqual(initialValues, values)) handleClose();
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
                  close={() => setShowConfirmDialog(false)}
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
        <CustomDialogContent isFooterPresent={false}>
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
