import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Formik, Form } from 'formik';
import { object, string, date, ref } from 'yup';
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
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';

const validationSchema = object().shape({
  title: string().required('Title is required'),
  startDate: date().required('Start Date is required'),
  endDate: date().required('End Date is required').min(ref('startDate'), 'End Date must be after Start Date'),
  reasons: string().required('Reasons are required')
});

function ManageUnavailability({ onClose, onSuccess, id, dataId }) {
  const toastConfig = useContext(CustomToastContext);
  const ref = useRef(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const initialValues = {
      title: '',
      startDate: null,
      endDate: null,
      reasons: ''
    };

    try {
      if (dataId) {
        const response = await axiosInstance().get(`${routes?.employeeMaster?.path}/unavailability/update/${dataId}`);
        const { data: fetchedData } = response.data;

        const editData = {
          title: fetchedData?.title || '',
          reasons: fetchedData?.reasons || '',
          startDate: fetchedData?.startDate ? new Date(fetchedData.startDate) : new Date(),
          endDate: fetchedData?.endDate ? new Date(fetchedData.endDate) : new Date()
        };

        setInitialData(editData);
      } else {
        setInitialData(initialValues);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSave = (values: any) => {
    if (dataId) {
      values._id = dataId;
      values.technician = id;
      axiosInstance()
        .put(`${routes?.employeeMaster?.path}/unavailability`, values)
        .then(({ data }) => {
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      values.technician = id;
      axiosInstance()
        .post(`${routes?.employeeMaster?.path}/unavailability`, values)
        .then(({ data }) => {
          onSuccess();
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData ? (
        <Formik innerRef={ref} initialValues={initialData} validateOnMount validationSchema={validationSchema} onSubmit={(values) => handleSave(values)}>
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, submitForm }) => (
            <Form>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title="Unavailability"
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
                      value={values?.title}
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
                      value={values?.startDate}
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
                      value={values?.endDate}
                      fullWidth
                      margin="dense"
                      size="small"
                      minDate={values?.startDate}
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
                      value={values?.reasons}
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
                <ThemeButton
                  buttonType="transparent"
                  id="dialog-cancel-button"
                  onClick={() => {
                    if (isEqual(initialData, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton buttonType="theme" id="dialog-save-button" onClick={submitForm}>
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Form>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}

export default ManageUnavailability;
