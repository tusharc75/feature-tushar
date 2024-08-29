import { Box, Button, Dialog, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { object, string } from 'yup';

const formSchema = object().shape({
  name: string().min(2, 'Name too short').max(50, 'Name too long!').required('Name is required')
});

const ViewDialog = ({ onClose, resource, extraData = null, selectedView = null, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValue, setInitialValue] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let view = { name: '', access: 'everyone' };
    if (selectedView) {
      view = { name: selectedView?.name, access: selectedView?.access };
    }
    setInitialValue(view);
  }, [selectedView]);

  const handleSubmit = (values) => {
    setLoading(true);
    const payload = {
      ...values,
      resource,
      ...(extraData && { ...extraData })
    };
    if (selectedView) {
      axiosInstance()
        .put('/excel-mapping', { ...payload, _id: selectedView?._id })
        .then((res) => {
          setLoading(false);
          onClose();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post('/excel-mapping', payload)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess(data);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      {initialValue ? (
        <Formik initialValues={initialValue} validationSchema={formSchema} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={selectedView ? 'Edit View' : 'Create View'}
                onClose={onClose}
                showRequiredLabel={true}
                showManimizeMaximize={true}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box mt={1}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={12} md={12} lg={12}>
                        <TextField
                          fullWidth
                          value={values['name']}
                          onChange={(e) => {
                            setFieldValue('name', e.target.value.trimStart());
                          }}
                          id="view-name"
                          name="name"
                          label="Name"
                          variant="outlined"
                          size="small"
                          required
                          autoComplete="off"
                          error={touched['name'] && Boolean(errors['name'])}
                          helperText={touched['name'] && errors['name']}
                        />
                      </Grid>
                      <Grid item xs={12} sm={12} md={12} lg={12}>
                        <FormControl size="small">
                          <FormLabel id="view-access-radio-button">Access</FormLabel>
                          <RadioGroup
                            row
                            aria-labelledby="view-access-radio-button"
                            value={values['access']}
                            onChange={(e) => {
                              setFieldValue('access', e.target.value.trimStart());
                            }}
                            name="access"
                          >
                            <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
                            <FormControlLabel value="private" control={<Radio size="small" />} label="Private" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ViewDialog;
