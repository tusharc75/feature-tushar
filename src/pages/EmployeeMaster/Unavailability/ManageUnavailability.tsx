import { useContext, useState } from 'react';
import { Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDatePicker from 'src/components/CustomDatePicker';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date().required('End Date is required').min(Yup.ref('startDate'), 'End Date must be after Start Date'),
  reasons: Yup.string().required('Reasons are required')
});

function ManageUnavailability({ onClose, onSuccess, id }) {
  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const initialValues = {
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    reasons: ''
  };

  const handleSave = (values) => {
    values.technician = id;
    console.log('Submitting data:', values);
    axiosInstance()
      .post(`${routes?.employeeMaster?.path}/unavailability`, values)
      .then(({ data }) => {
        onClose();
        onSuccess();
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
    >
      <Formik initialValues={initialValues} validateOnMount validationSchema={validationSchema} onSubmit={(values) => handleSave(values)}>
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, submitForm }) => (
          <Form>
            <CustomDialogHeader
              title="Unavailability"
              onClose={onClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => setFullScreen((prev) => !prev)}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Grid container spacing={2} sx={{ alignItems: 'center', marginBottom: 2 }}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Title"
                    name="title"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={touched.title && Boolean(errors.title)}
                    helperText={touched.title && errors.title}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <CustomDatePicker
                    label="Start Date"
                    name="startDate"
                    required
                    value={values.startDate}
                    fullWidth
                    margin="dense"
                    size="small"
                    onChange={(value) => setFieldValue('startDate', value)}
                    onBlur={handleBlur}
                    error={touched.startDate && Boolean(errors.startDate)}
                    helperText={touched.startDate && errors.startDate}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <CustomDatePicker
                    label="End Date"
                    name="endDate"
                    required
                    value={values.endDate}
                    fullWidth
                    margin="dense"
                    size="small"
                    onChange={(value) => setFieldValue('endDate', value)}
                    onBlur={handleBlur}
                    error={touched.endDate && Boolean(errors.endDate)}
                    helperText={touched.endDate && errors.endDate}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Reasons"
                    name="reasons"
                    multiline
                    rows={4}
                    value={values.reasons}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={touched.reasons && Boolean(errors.reasons)}
                    helperText={touched.reasons && errors.reasons}
                  />
                </Grid>
              </Grid>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" id="dialog-cancel-button" onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton buttonType="theme" id="dialog-save-button" onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default ManageUnavailability;
