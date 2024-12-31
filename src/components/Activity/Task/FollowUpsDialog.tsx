import { CircularProgress, Dialog, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { UserDropdown } from 'src/components/Activity/Helpers/userDropdown';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import CustomDatePicker from 'src/components/CustomDatePicker';

const FollowUpsDialog = ({ onClose, section, resource, referenceId, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState(null);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    state: {
      user: { user }
    }
  } = useData();

  useEffect(() => {
    if (section && section?.sectionFields?.length > 0) {
      setFieldOptions(section?.sectionFields?.map((s) => ({ fieldLabel: s?.fieldLabel, fieldName: s?.fieldName })));
    }
    setInitialValues({
      startDate: new Date(),
      dueDate: null,
      assignee: [],
      name: '',
      description: '',
      status: 'To Do',
      reporter: user._id,
      parentId: null,
      relatedTo: [
        {
          type: camelCase(resource),
          referenceId: referenceId,
          access: true
        }
      ],
      formRelatedTo: {
        section: section ? section?.name : '',
        fields: []
      }
    });
  }, [section]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .post('/task', values)
      .then(({ data }) => {
        setSubmitting(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.name) {
      errors['name'] = 'Please enter subject';
    }
    if (!values?.assignee?.length) {
      errors['assignee'] = 'Please select assignee';
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <Formik initialValues={initialValues} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
        {({ values, setFieldValue, submitForm, touched, errors }) => (
          <>
            <CustomDialogHeader
              onClose={onClose}
              title={'Follow-Ups'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form>
                <Grid container spacing={2}>
                  <Grid size={{ md: 12, lg: 12, xs: 12, sm: 12 }}>
                    <TextField
                      fullWidth
                      label="Subject"
                      variant="outlined"
                      type="text"
                      size="small"
                      name="name"
                      autoComplete="off"
                      value={values?.name}
                      required
                      onChange={(e) => {
                        setFieldValue('name', e?.target?.value);
                      }}
                      error={touched['name'] && Boolean(errors['name'])}
                      helperText={touched['name'] && errors['name']}
                    />
                  </Grid>
                  <Grid size={{ md: 12, lg: 12, xs: 12, sm: 12 }}>
                    <TextField
                      fullWidth
                      label="Description"
                      variant="outlined"
                      type="text"
                      size="small"
                      name="description"
                      multiline
                      rows={4}
                      value={values?.description}
                      onChange={(e) => {
                        setFieldValue('description', e?.target?.value);
                      }}
                    />
                  </Grid>
                  <Grid size={{ md: 12, lg: 12, xs: 12, sm: 12 }}>
                    <UserDropdown
                      name="assignee"
                      label="Assignee"
                      errors={errors}
                      touched={touched}
                      required={true}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                      }}
                      multiple={true}
                      value={values['assignee']}
                      email={[]}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 12, md: 6, lg: 6 }}>
                    <CustomDatePicker
                      label="Due Date"
                      name="dueDate"
                      fullWidth
                      margin="dense"
                      minDate={values.startDate}
                      value={values.dueDate}
                      onChange={(value) => {
                        setFieldValue('dueDate', value);
                      }}
                    />
                  </Grid>
                  <Grid size={{ md: 12, lg: 12, xs: 12, sm: 12 }}>
                    <Autocomplete
                      id="field"
                      multiple
                      disableCloseOnSelect
                      options={fieldOptions}
                      limitTags={4}
                      getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                      isOptionEqualToValue={(option: any, val) => option?.fieldName === val?.fieldName}
                      value={values?.formRelatedTo?.fields}
                      onChange={(e, val) => {
                        setFieldValue('formRelatedTo', { section: values?.formRelatedTo?.section, fields: val ? val : [] });
                      }}
                      renderInput={(params) => <TextField {...params} margin="dense" variant="outlined" label="Field" name="field" size="small" />}
                    />
                  </Grid>
                </Grid>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" disabled={submitting} onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton
                disabled={submitting}
                buttonType="theme"
                onClick={submitForm}
                endIcon={submitting && <CircularProgress color="inherit" size={18} />}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default FollowUpsDialog;
