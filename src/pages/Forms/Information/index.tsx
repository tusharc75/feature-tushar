import { Box, Button, CircularProgress, Grid, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { camelCase, isEmpty, isEqual } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { object, string } from 'yup';

const informationSchema = object().shape({
  formName: string().required('Form Name is required !!'),
  formTitle: string().required('Form Title is required !!')
});

const Information = ({ id, fetchData, formsData, setFormsData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id === '0') {
      setInitialValues({
        formName: '',
        formTitle: '',
        formDescription: ''
      });
    } else {
      if (formsData) {
        setInitialValues({
          formName: formsData?.formName,
          formTitle: formsData?.formTitle,
          formDescription: formsData?.formDescription
        });
      }
    }
  }, [id, formsData]);

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    if (id === '0') {
      axiosInstance()
        .post(`${routes.forms?.path}`, values)
        .then(({ data }) => {
          setIsSubmitting(false);
          setFormsData(data?.data);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(`${routes.forms?.path}`, { ...values, _id: id })
        .then(({ data }) => {
          setIsSubmitting(false);
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const validate = (values) => {
    const error: any = {};

    if (!values?.formName) {
      error['formName'] = 'Form Name is required !!';
    }
    if (!values?.formTitle) {
      error['formTitle'] = 'Form Title is required !!';
    }

    return error;
  };

  return (
    <>
      {!isEmpty(initialValues) ? (
        <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={informationSchema} validate={validate}>
          {({ values, errors, touched, setFieldValue, submitForm, handleBlur }) => (
            <>
              <Box textAlign={'end'} pb={2}>
                <Button
                  disabled={isEqual(initialValues, values) || isSubmitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </Box>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <TextField
                      fullWidth
                      label="Form Name"
                      variant="outlined"
                      type="text"
                      size="small"
                      name="formName"
                      placeholder="Form Name"
                      onBlur={handleBlur}
                      value={values['formName']}
                      error={touched['formName'] && Boolean(errors['formName'])}
                      helperText={touched['formName'] && errors['formName']}
                      onChange={(e) => {
                        setFieldValue('formName', e.target.value);
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <TextField
                      fullWidth
                      label="Form Title"
                      variant="outlined"
                      type="text"
                      size="small"
                      name="formTitle"
                      placeholder="Form Title"
                      onBlur={handleBlur}
                      value={values['formTitle']}
                      error={touched['formTitle'] && Boolean(errors['formTitle'])}
                      helperText={touched['formTitle'] && errors['formTitle']}
                      onChange={(e) => {
                        setFieldValue('formTitle', e.target.value);
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <TextField
                      fullWidth
                      multiline
                      label="Form Description"
                      variant="outlined"
                      type="text"
                      size="small"
                      name="formDescription"
                      placeholder="Form Description"
                      value={values['formDescription']}
                      error={touched['formDescription'] && Boolean(errors['formDescription'])}
                      helperText={touched['formDescription'] && errors['formDescription']}
                      onChange={(e) => {
                        setFieldValue('formDescription', e.target.value);
                      }}
                      rows={4}
                    />
                  </Grid>
                </Grid>
              </Form>
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default Information;
