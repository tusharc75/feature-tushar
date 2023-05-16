import { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Breadcrumbs,
  Typography,
  Box,
  Grid,
  Button,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Divider,
  Link,
  CircularProgress,
  Select
} from '@material-ui/core';
import { UserDropdown } from '../Helpers/userDropdown';
import statusList from '../Helpers/statusList';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import moment from 'moment';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { GetCaseDetail, CreateNewCase, UpdateCase } from '../../../axios/activity';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import TableChartIcon from '@material-ui/icons/TableChart';
import { SubCase } from './SubCase';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { dateFormatForInputControl } from '../../../constants/helpers';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const CaseSchema = object().shape({
  name: string().required('Please enter case name'),
  // assignee: string().required('Please select assignee'),
  reporter: string().required(),
  startDate: string().required('Please enter start date'),
  dueDate: string().required('Please enter due date')
});

export const CreateCase = ({ relatedTo, caseId, handleClose, status, isMinimized, onMinimizeMaximize, showManimizeMaximize }) => {
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [id, setId] = useState(caseId);
  const [initialValues, setInitialValues] = useState(null);
  const [openAddSub, setOpenAddSub] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const fetchCaseDetail = async () => {
    if (id) {
      await GetCaseDetail(id)
        .then(({ data }) => {
          if (data?.assignee && data?.assignee !== "") {
            if (typeof data?.assignee === "string") {
              data['assignee'] = [{ userId: data?.assignee }];
            }
            else {
              data['assignee'] = data?.assignee?.map((assignee) => ({
                userId: assignee
              }));
            }
          }
          else {
            data['assignee'] = []
          }
          setInitialValues(null);
          setInitialValues(data);
        })
        .catch((err) => { });
    } else {
      let initialData = {
        name: '',
        description: '',
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
      UpdateCase(id, values)
        .then(({ data }) => {
          setSubmitting(false);
          handleClose();
        })
        .catch((err) => {
          setSubmitting(false);
        });
    } else {
      values.parentId = null;
      CreateNewCase(values)
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

  return (
    <>
      {initialValues ? (
        <Formik initialValues={initialValues} validationSchema={CaseSchema} onSubmit={handleSave} validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogHeader
                title={`${id ? 'Edit' : 'New'} Case`}
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
                  <MuiPickersUtilsProvider utils={DateUtils}>
                    <Box padding={1}>
                      <Box mb={2}>
                        <Breadcrumbs separator=">" aria-label="breadcrumb">
                          {initialValues.parent &&
                            initialValues.parent.map((_p, index) => {
                              return (
                                <Button variant="text" key={index} className="cursor-pointer uppercase" onClick={() => setId(_p._id)}>
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
                            label="Case Name"
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
                              variant="outlined"
                              onChange={(e) => {
                                setFieldValue('description', e.target.value);
                              }}
                            />
                          </Box>
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
                                  {' '}
                                  Add a child Case
                                </Button>
                              </Box>
                              <Box mt={2}>
                                <SubCase
                                  openAddSub={openAddSub}
                                  setOpenAddSub={setOpenAddSub}
                                  data={initialValues}
                                  fetchCaseDetail={fetchCaseDetail}
                                  setId={setId}
                                />
                              </Box>
                              {initialValues?.relatedTo && initialValues.relatedTo.length ? (
                                <Box mt={2}>
                                  <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                </Box>
                              ) : null}
                              <Box mt={2}>
                                <Divider />
                                <Box mt={1}>
                                  <Comment referenceId={id} />
                                </Box>
                              </Box>
                            </Fragment>
                          )}
                        </Grid>
                        <Grid item xs={12} md={5} sm={6}>
                          <Box pt={1}>
                            <FormControl variant="outlined" fullWidth>
                              <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                              <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                margin="dense"
                                label="Status"
                                value={values['status']}
                                name="status"
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
                          </Box>
                          <Box pt={1}>
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
                          </Box>
                          <Box pt={1}>
                            <KeyboardDatePicker
                              label="Start Date"
                              name="startDate"
                              autoOk
                              variant="inline"
                              inputVariant="outlined"
                              fullWidth
                              margin="dense"
                              value={values.startDate}
                              format={dateFormatForInputControl}
                              minDate={new Date()}
                              onChange={(value) => {
                                setFieldValue('startDate', value);
                                setFieldValue('dueDate', value);
                              }}
                              maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                            />
                          </Box>
                          <Box pt={1}>
                            <KeyboardDatePicker
                              label="Due Date"
                              name="dueDate"
                              autoOk
                              variant="inline"
                              value={values.dueDate}
                              inputVariant="outlined"
                              fullWidth
                              margin="dense"
                              format={dateFormatForInputControl}
                              minDate={values.startDate}
                              maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                              onChange={(value) => {
                                setFieldValue('dueDate', value);
                              }}
                            />
                          </Box>
                          {id && (
                            <Fragment>
                              {initialValues.createdBy && initialValues.createdBy.date && (
                                <Box mt={1} color="text.secondary">
                                  <Typography variant="body2">
                                    Created {moment(initialValues.createdBy.date).format('MMM DD YYYY hh:mm A')}
                                  </Typography>
                                </Box>
                              )}
                              {initialValues.updatedBy && initialValues.updatedBy.date && (
                                <Box mt={1} color="text.secondary">
                                  <Typography variant="body2">
                                    Updated {moment(initialValues.updatedBy.date).format('MMM DD YYYY hh:mm A')}
                                  </Typography>
                                </Box>
                              )}
                            </Fragment>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </MuiPickersUtilsProvider>
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
                <Button disabled={isSubmitting} type="button" size="small" color="primary" variant="contained" onClick={submitForm}>
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
        <CustomDialogContent>
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        </CustomDialogContent>
      )}
    </>
  );
};

CreateCase.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  status: PropTypes.any,
  handleClose: PropTypes.any
};
