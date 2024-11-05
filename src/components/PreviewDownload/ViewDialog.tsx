import { Box, Button, Checkbox, Dialog, FormControlLabel, Radio, RadioGroup, TextField } from '@material-ui/core';
import CustomButton from '../Helpers/CustomButton';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { object, string } from 'yup';
import { Form, Formik } from 'formik';
import { CustomDialogTransition } from 'src/constants/helpers';

const schema = object().shape({
  name: string().required('Please enter name'),
  access: string().oneOf(['private', 'everyone']).required('Please select access option')
});

const ACCESS_OPTIONS = {
  private: 'private',
  everyone: 'everyone'
};

export const ViewDialog = ({ columns, resource, handleSucess, handleClose, viewData, sortBy = null, orderBy = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValue] = useState({
    name: viewData?.name || '',
    access: viewData?.access || ACCESS_OPTIONS.private
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (values) => {
    const data = {
      name: values?.name,
      access: values?.access,
      columns: columns?.map((c: any) => ({ name: c.fieldName, width: c.width, customLabel: c.customLabel })) || [],
      ...(sortBy && orderBy ? { sortBy: sortBy?.fieldName, orderBy } : { sortBy: '', orderBy: '' })
    };

    setLoading(true);
    if (viewData?._id) {
      axiosInstance()
        .put(`/pdf/view?resource=${resource}`, { ...data, _id: viewData?._id })
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
        .post(`/pdf/view?resource=${resource}`, { ...data })
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
      TransitionComponent={CustomDialogTransition}
      maxWidth={'sm'}
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-describedby="View Dialog"
    >
      <CustomDialogHeader
        title="PDF View Name"
        onClose={() => {
          handleClose();
        }}
        showRequiredLabel={true}
      />
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
                  label="Name"
                  name="name"
                  variant="outlined"
                  value={values['name']}
                  onChange={(e) => {
                    setFieldValue('name', e.target.value);
                  }}
                  error={touched['name'] && Boolean(errors['name'])}
                  helperText={touched['name'] && errors['name']}
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
};
