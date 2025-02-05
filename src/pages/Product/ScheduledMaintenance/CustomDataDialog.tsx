import { Autocomplete, Box, Dialog, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDatePicker from 'src/components/CustomDatePicker';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { date, object, string } from 'yup';

const Schema = object().shape({
  effectiveDate: date().required('please enter Effective Date'),
  duration: string().required('please select Duration')
});

const DURATION = ['Monthly', 'Quarterly', 'Yearly'];

const CustomDataDialog = ({ data = null, handleClose, handleSave, loading }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ effectiveDate: '', duration: '' });

  useEffect(() => {
    if (data) {
      setInitialData({
        effectiveDate: data?.effectiveDate,
        duration: data?.duration
      });
    }
  }, [data]);

  const handleSubmit = (values) => {
    handleSave(values);
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <Formik enableReinitialize={true} initialValues={initialData} validationSchema={Schema} validateOnMount onSubmit={handleSubmit}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <>
            <CustomDialogHeader
              title={'Custom Data'}
              onClose={handleClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box p={1}>
                  <CustomDatePicker
                    fullWidth
                    size="small"
                    name={'effectiveDate'}
                    label={'Effective Date'}
                    value={values['effectiveDate']}
                    required
                    disablePast
                    margin="dense"
                    onChange={(value: any) => {
                      setFieldValue('effectiveDate', value);
                    }}
                    error={touched['effectiveDate'] && Boolean(errors['effectiveDate'])}
                    helperText={touched['effectiveDate'] && errors['effectiveDate']}
                  />
                  <Box mt={1}></Box>
                  <Autocomplete
                    id="duration"
                    options={DURATION}
                    size="small"
                    value={values['duration']}
                    onChange={(event: any, newValue: any) => {
                      setFieldValue('duration', newValue || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="duration"
                        size="small"
                        margin="dense"
                        label="Duration"
                        variant="outlined"
                        required
                        error={touched['duration'] && Boolean(errors['duration'])}
                        helperText={touched['duration'] && errors['duration']}
                      />
                    )}
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={loading} buttonType="theme" onClick={submitForm}>
                {' '}
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default CustomDataDialog;
