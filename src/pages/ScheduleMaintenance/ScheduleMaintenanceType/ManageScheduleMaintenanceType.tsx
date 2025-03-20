import { Box, Dialog, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { object, string } from 'yup';

const Schema = object().shape({
  name: string().required('please enter Type Name')
});

const ManageScheduleMaintenanceType = ({ handleClose, data = null, handleSuccess }) => {

  const { setToastConfig } = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setInitialData({ name: data?.name });
    }
  }, [data]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (data) {
      axiosInstance().put('/scheduled-maintenance-type', { ...values, _id: data?._id }).then(({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setLoading(false);
        handleSuccess();
      })
        .catch((err) => {
          setLoading(false);
          setToastConfig(err);
        });
    } else {
      axiosInstance().post('/scheduled-maintenance-type', values).then(({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setLoading(false);
        handleSuccess(data?.data);
      }).catch((err) => {
        setLoading(false);
        setToastConfig(err);
      });
    }
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
              title={data ? 'Update' : `Create`}
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
                  <TextField
                    fullWidth
                    margin="dense"
                    size="small"
                    type="text"
                    label="Type Name"
                    name="name"
                    variant="outlined"
                    value={values['name']}
                    onChange={(e) => {
                      setFieldValue('name', e.target.value.trimStart());
                    }}
                    required
                    error={touched['name'] && Boolean(errors['name'])}
                    helperText={touched['name'] && errors['name']}
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={loading} disabled={isEqual(initialData, values)} buttonType="theme" onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageScheduleMaintenanceType;
