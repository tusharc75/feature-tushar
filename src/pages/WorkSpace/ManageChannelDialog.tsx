import { Box, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import DashboardModal from 'src/components/DashboardModal';
import { object, string } from 'yup';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { CustomDialogTransition } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ManageChannel = ({ onClose, onSuccess, _id }) => {
  const toastConfig = useContext(CustomToastContext);

  const validationSchema = object().shape({
    title: string().required('Please enter Channel name'),
    description: string(),
    access: string().required('Please select access type')
  });

  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    access: 'public'
  });

  useEffect(() => {
    if (_id) {
      axiosInstance()
        .get(`/work-space/channel/${_id}`)
        .then(({ data }) => {
          setInitialValues({
            title: data?.data?.title,
            description: data?.data?.description,
            access: data?.data?.access
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }

  }, [_id]);


  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    let updatedValues = { ...values };

    if (_id) {
      updatedValues = { ...values, _id };
    }

    await axiosInstance()
      .post('/work-space/channel', updatedValues)
      .then(({ data }) => {
        setLoading(false);
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
      })
      .catch((error) => {
        setLoading(false);
        setSubmitting(false);
        toastConfig.setToastConfig(error);
        onSuccess();
      });
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  return (
    <>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <DashboardModal
            handleClose={() => {
              if (!isEqual(values, initialValues)) {
                setShowConfirmDialog(true);
              } else {
                onClose();
              }
            }}
            open={true}
            dialogProps={{
              fullScreen: fullScreen || isMobile || isTablet,
              fullWidth: false,
              TransitionComponent: CustomDialogTransition,
              maxWidth: 'sm'
            }}
            modalHead={{
              title: `Create Channel`,
              fullScreenOption: true
            }}
            footer={
              <>
                <ThemeButton
                  buttonType="transparent"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (!isEqual(values, initialValues)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  disabled={isSubmitting || loading}
                  isLoading={loading}
                  buttonType="theme"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </ThemeButton>
              </>
            }
          >
            <Fragment>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Channel Name"
                        required={true}
                        name="title"
                        fullWidth
                        margin="dense"
                        size="small"
                        value={values['title']}
                        error={touched['title'] && Boolean(errors['title'])}
                        helperText={touched['title'] && errors['title']}
                        onChange={(e) => {
                          setFieldValue('title', e.target.value.trimStart());
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Channel Description"
                        name="description"
                        fullWidth
                        margin="dense"
                        size="small"
                        value={values['description']}
                        error={touched['description'] && Boolean(errors['description'])}
                        helperText={touched['description'] && errors['description']}
                        onChange={(e) => {
                          setFieldValue('description', e.target.value.trimStart());
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                      <FormLabel component="legend" required={true}>
                        Access
                      </FormLabel>
                      <RadioGroup row name="access" value={values.access} onChange={(e) => setFieldValue('access', e.target.value)}>
                        <FormControlLabel value="public" control={<Radio />} label="Public" />
                        <FormControlLabel value="private" control={<Radio />} label="Private" />
                      </RadioGroup>
                      {touched.access && errors.access && <div style={{ color: 'red', marginTop: 8 }}>{errors.access}</div>}
                    </Grid>
                  </Grid>
                </Box>
              </Form>
              <div className="flex items-center justify-end gap-2"></div>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Fragment>
          </DashboardModal>
        )}
      </Formik>
    </>
  );
};

export default ManageChannel;
