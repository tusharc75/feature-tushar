import { Box, Button, Checkbox, Dialog, FormControlLabel, Radio, RadioGroup, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { Fragment, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { boolean, object, string } from 'yup';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';

const schema = object().shape({
  title: string().required('Please enter title'),
  default: boolean(),
  access: string().oneOf(['private', 'everyone']).required('Please select access option')
});

const ACCESS_OPTIONS = {
  private: 'private',
  everyone: 'everyone'
};

function SaveFilterDialog({ handleClose, handleSucess, kpi, filterValue, filterData }) {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const [initialValue] = useState({
    title: filterData?.title || '',
    default: filterData?.default || false,
    access: filterData?.access || ACCESS_OPTIONS.private
  });

  const handleSubmit = (values) => {
    const data = {
      title: values?.title,
      kpi: kpi,
      filterValue: filterValue,
      default: values.default,
      access: values?.access
    };
    setLoading(true);
    if (filterData) {
      axiosInstance()
        .put(`/kpi/filters`, { ...data, _id: filterData?._id })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleSucess();
          setLoading(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setLoading(false);
        });
    } else {
      axiosInstance()
        .post(`/kpi/filters`, data)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleSucess();
          setLoading(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setLoading(false);
        });
    }
  };

  return (
    <Dialog
      maxWidth={'sm'}
      TransitionComponent={CustomDialogTransition}
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-describedby="Filter Dialog"
    >
      <CustomDialogHeader title="Filter" onClose={handleClose} showRequiredLabel={true} />
      <Formik initialValues={initialValue} validateOnMount validationSchema={schema} onSubmit={handleSubmit}>
        {({ submitForm, setFieldValue, values, touched, errors }) => (
          <Fragment>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <TextField
                  fullWidth
                  margin="dense"
                  type="text"
                  required
                  label="Title"
                  name="title"
                  variant="outlined"
                  value={values['title']}
                  onChange={(e) => {
                    setFieldValue('title', e.target.value);
                  }}
                  error={touched['title'] && Boolean(errors['title'])}
                  helperText={touched['title'] && errors['title']}
                />
                <Box pt={1}>
                  <RadioGroup row>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={values['access'] === ACCESS_OPTIONS.private}
                          onChange={() => setFieldValue('access', ACCESS_OPTIONS.private)}
                          name="private"
                        />
                      }
                      label="Private"
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          checked={values['access'] === ACCESS_OPTIONS.everyone}
                          onChange={() => setFieldValue('access', ACCESS_OPTIONS.everyone)}
                          name="everyone"
                        />
                      }
                      label="Everyone"
                    />
                  </RadioGroup>
                </Box>
                <Box pt={1}>
                  <FormControlLabel
                    control={<Checkbox checked={values['default']} onChange={(e) => setFieldValue('default', e.target.checked)} name="default" />}
                    label="Set this as default"
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" onClick={handleClose}>
                Cancel
              </Button>
              <CustomButton loading={loading} variant="contained" color="primary" type="submit" onClick={submitForm} disabled={loading}>
                Save
              </CustomButton>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
}

export default SaveFilterDialog;
