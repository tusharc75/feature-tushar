import { Box, Breadcrumbs, CircularProgress, Divider, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import TableChartIcon from '@mui/icons-material/TableChart';
import axios, { CancelTokenSource } from 'axios';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { object, string } from 'yup';
import { useData } from '../../../StateProvider/Provider';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { displayDateTime } from '../../../constants/helpers';
import { Comment } from '../Comment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import statusList from '../Helpers/statusList';
import { UserDropdown } from '../Helpers/userDropdown';
import { SubCase } from './SubCase';
import CustomDatePicker from 'src/components/CustomDatePicker';
import dayjs from 'dayjs';

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

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchCaseDetail(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCaseDetail = async (cancelTokenSource?: CancelTokenSource) => {
    if (id) {
      axiosInstance()
        .get(`/case/${id}`, { cancelToken: cancelTokenSource?.token })
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
      axiosInstance()
        .put(`/case/${id}`, values)
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
        .post('/case', values)
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
    if (dayjs(values.startDate).isAfter(dayjs(values.dueDate))) {
      errors['dueDate'] = 'Due date must be greater than the start date';
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
                  <Box padding={1}>
                    <Box mb={2}>
                      <Breadcrumbs separator=">" aria-label="breadcrumb">
                        {initialValues.parent &&
                          initialValues.parent.map((_p, index) => {
                            return (
                              <ThemeButton key={index} buttonType="transparent" onClick={() => setId(_p._id)}>
                                {_p.name}
                              </ThemeButton>
                            );
                          })}
                      </Breadcrumbs>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 7, sm: 6 }}>
                        <TextField
                          variant="outlined"
                          type="text"
                          label="Case Name"
                          required={true}
                          name="name"
                          fullWidth
                          margin="dense"
                          size="small"
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
                            size="small"
                            type="text"
                            multiline
                            rows={3}
                            label="Description"
                            value={values['description']}
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
                              <ThemeButton buttonType="theme" disableElevation onClick={() => setOpenAddSub(true)} startIcon={<TableChartIcon />}>
                                {' '}
                                Add a child Case
                              </ThemeButton>
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
                      <Grid size={{ xs: 12, md: 5, sm: 6 }}>
                        <Box pt={1}>
                          <FormControl variant="outlined" fullWidth>
                            <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                            <Select
                              labelId="demo-simple-select-outlined-label"
                              id="demo-simple-select-outlined"
                              margin="dense"
                              size="small"
                              label="Status"
                              value={values['status']}
                              name="status"
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
                          <CustomDatePicker
                            label="Start Date"
                            name="startDate"
                            fullWidth
                            margin="dense"
                            size="small"
                            value={values.startDate}
                            onChange={(value) => {
                              setFieldValue('startDate', value);
                              setFieldValue('dueDate', value);
                            }}
                            maxDate={initialValues.parentData && initialValues.parentData.dueDate}
                          />
                        </Box>
                        <Box pt={1}>
                          <CustomDatePicker
                            label="Due Date"
                            name="dueDate"
                            value={values.dueDate}
                            fullWidth
                            margin="dense"
                            size="small"
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
                                  Created {displayDateTime(initialValues.createdBy.date, 'MMM DD YYYY hh:mm A')}
                                </Typography>
                              </Box>
                            )}
                            {initialValues.updatedBy && initialValues.updatedBy.date && (
                              <Box mt={1} color="text.secondary">
                                <Typography variant="body2">
                                  Updated {displayDateTime(initialValues?.updatedBy?.date, 'MMM DD YYYY hh:mm A')}
                                </Typography>
                              </Box>
                            )}
                          </Fragment>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  disabled={isSubmitting}
                  buttonType="transparent"
                  onClick={() => {
                    if (isEqual(initialValues, values)) handleClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton disabled={isSubmitting} buttonType="theme" onClick={submitForm}>
                  {isSubmitting ? <CircularProgress size={22} /> : 'Save'}
                </ThemeButton>
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
        <CustomDialogContent isFooterPresent={false}>
          <Box p={2} height={500}>
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
