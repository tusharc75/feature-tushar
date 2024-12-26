import { Box, Button, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import DashboardModal from 'src/components/DashboardModal';
import { object, string } from 'yup';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomButton from '../../components/Helpers/CustomButton';
import { CustomDialogTransition } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const ManageChannel = ({ onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const validationSchema = object().shape({
    title: string().required('Please enter Channel name'),
    description: string(),
    access: string().required('Please select access type')
  });

  const initialValues = {
    title: '',
    description: '',
    access: 'public'
  };

  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    let updatedValues = { ...values };

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
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
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
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
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
                </Button>
                <CustomButton
                  disabled={isSubmitting || loading}
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </CustomButton>
              </>
            }
          >
            <Fragment>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
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
                    <Grid item xs={12}>
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
                    <Grid item xs={12} md={6} sm={6}>
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
                  close={() => setShowConfirmDialog(false)}
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
