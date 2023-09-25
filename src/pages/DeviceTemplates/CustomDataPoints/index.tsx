import { useContext, useEffect, useState } from 'react';
import { TextField } from '@material-ui/core';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Form, Formik } from 'formik';
import { Autocomplete } from '@material-ui/lab';
import CustomButton from 'src/components/Helpers/CustomButton';

export default function CustomDataPoints({ deviceTemplate }) {
  const toastConfig = useContext(CustomToastContext);

  const [iotDataPoints, setIotDataPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    findIotDataoints();
  }, [deviceTemplate]);

  const findIotDataoints = () => {
    const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
    axiosInstance()
      .get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&filterType=and`)
      .then(
        ({
          data: {
            data: { data }
          }
        }) => {
          setIotDataPoints(data?.map((d) => ({ optionLabel: d?.fieldLabel, optionValue: d?._id })));
        }
      );
  };

  function validate(values) {
    const errors = {};
    if (values.fieldLabel === '') {
      errors['fieldLabel'] = 'Please enter FieldLabel';
    }
    if (!values.dataPoint) {
      errors['dataPoint'] = 'Please select Data Point';
    }
    if (values.formula === '') {
      errors['formula'] = 'Please enter Formula';
    }
    return errors;
  }

  const handleSubmit = (values, { resetForm }) => {
    setLoading(true);
    values.deviceTemplate = deviceTemplate;

    axiosInstance()
      .post(`${routes.deviceTemplates.path}/custom-data-point`, values)
      .then(({ data: { data, message } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
        setLoading(false);
        resetForm();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });

    setLoading(false);
  };

  return (
    <Formik initialValues={{ fieldLabel: '', dataPoint: null, formula: '' }} validateOnMount onSubmit={handleSubmit} validate={validate}>
      {({ values, errors, touched, setFieldValue, submitForm }) => (
        <Form>
          <div>
            <TextField
              margin="dense"
              type="text"
              label="Field Label"
              name="fieldLabel"
              variant="outlined"
              required
              fullWidth
              disabled={false}
              value={values['fieldLabel']}
              error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
              helperText={touched['fieldLabel'] && errors['fieldLabel']}
              onChange={(e) => setFieldValue('fieldLabel', e.target.value)}
            />
          </div>
          <div>
            <Autocomplete
              options={iotDataPoints}
              getOptionLabel={(option) => option?.optionLabel}
              value={iotDataPoints?.find((data) => data?.optionValue === values?.dataPoint) ?? ''}
              fullWidth
              onChange={(e, newValue) => setFieldValue('dataPoint', newValue?.optionValue)}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Data Points"
                  margin="none"
                  size="small"
                  variant="outlined"
                  error={touched?.dataPoint && Boolean(errors[`dataPoint`])}
                  helperText={touched?.dataPoint && errors[`dataPoint`]}
                />
              )}
            />
          </div>
          <div>
            <TextField
              margin="dense"
              type="text"
              label="Formula"
              name="formula"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={values['formula']}
              error={touched['formula'] && Boolean(errors['formula'])}
              helperText={touched['formula'] && errors['formula']}
              onChange={(e) => setFieldValue('formula', e.target.value)}
            />
          </div>
          <CustomButton
            loading={loading}
            variant="contained"
            color="primary"
            onClick={(e) => {
              submitForm();
            }}
          >
            Save
          </CustomButton>
        </Form>
      )}
    </Formik>
  );
}
