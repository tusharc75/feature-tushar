import { Box, Button, Checkbox, Dialog, FormControlLabel, Radio, RadioGroup, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Form, Formik } from 'formik';
import { startCase } from 'lodash';
import { Fragment, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';
import { boolean, object, string } from 'yup';

const schema = object().shape({
  title: string().required('Please enter title'),
  default: boolean(),
  sorting: boolean(),
  sortBy: string().when('sorting', {
    is: true,
    then: string().required('Please select sort by'),
    otherwise: string().notRequired()
  }),
  orderBy: string()
    .oneOf(['asc', 'desc'], 'Please select order by')
    .when('sorting', {
      is: true,
      then: string().required('Please select sort by'),
      otherwise: string().notRequired()
    }),
  access: string().oneOf(['private', 'everyone']).required('Please select access option')
});

const orderByOptions = ['asc', 'desc'];

const ACCESS_OPTIONS = {
  private: 'private',
  everyone: 'everyone'
};

function SaveFilterDialog({ handleClose, handleSucess, resource, filterValue, filterData, columns }) {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const [initialValue] = useState({
    title: filterData?.title || '',
    default: filterData?.default || false,
    sorting: filterData?.sorting || false,
    sortBy: filterData?.sortBy || '',
    orderBy: filterData?.orderBy || '',
    access: filterData?.access || ''
  });

  const handleSubmit = (values) => {
    const updatedFilterValue = filterValue;
    const colNames = Object.keys(filterValue);
    for (const col of columns) {
      const fieldName = col.fieldName;
      if (colNames.includes(fieldName) && col.lookup) {
        if (updatedFilterValue[fieldName]?.length) {
          updatedFilterValue[fieldName] = filterValue[fieldName]?.map((e) => e.optionValue);
        } else {
          delete updatedFilterValue[fieldName];
        }
      }
    }
    const data = {
      title: values?.title,
      resource: resource,
      filterValue: updatedFilterValue,
      default: values.default,
      sorting: values.sorting || false,
      sortBy: values.sortBy,
      orderBy: values.orderBy,
      access: values.access
    };
    setLoading(true);
    if (filterData) {
      axiosInstance()
        .put(`/user-resource-filter`, { ...data, _id: filterData?._id })
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
        .post(`/user-resource-filter`, data)
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
                  size="small"
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
                <FormControlLabel
                  control={<Checkbox checked={values['default']} onChange={(e) => setFieldValue('default', e.target.checked)} name="default" />}
                  label="Set this as default"
                />
                {values['default'] && (
                  <Box>
                    <FormControlLabel
                      control={<Checkbox checked={values['sorting']} onChange={(e) => setFieldValue('sorting', e.target.checked)} name="sorting" />}
                      label="Default Sorting"
                    />
                  </Box>
                )}

                {values['sorting'] && columns?.length && (
                  <div className="my-2 flex flex-wrap gap-2">
                    <Autocomplete
                      id="sorting"
                      options={columns}
                      size="small"
                      value={columns.find((column) => column.fieldName === values['sortBy'])}
                      onChange={(event: any, newValue: any) => {
                        setFieldValue('sortBy', newValue?.fieldName || '');
                      }}
                      getOptionLabel={(option: any) => option.fieldLabel || ''}
                      style={{ flexGrow: 1, minWidth: 200 }}
                      renderInput={(params) => (
                        <TextField
                          helperText={errors.sortBy}
                          error={Boolean(touched.sortBy && errors.sortBy)}
                          name="sortBy"
                          size="small"
                          margin="none"
                          {...params}
                          label="Sort By"
                          variant="outlined"
                        />
                      )}
                    />
                    <Autocomplete
                      onChange={(event: any, newValue: string | null) => {
                        setFieldValue('orderBy', newValue || '');
                      }}
                      size="small"
                      value={values['orderBy']}
                      id="order-by"
                      options={orderByOptions}
                      getOptionLabel={(option: any) => startCase(option) || ''}
                      style={{ flexGrow: 1, minWidth: 200 }}
                      renderInput={(params) => (
                        <TextField
                          helperText={errors.orderBy}
                          error={Boolean(touched.orderBy && errors.orderBy)}
                          name="orderBy"
                          size="small"
                          margin="none"
                          {...params}
                          label="Sorting Order"
                          variant="outlined"
                        />
                      )}
                    />
                  </div>
                )}
                <Box>
                  <RadioGroup>
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
                  {errors.access && <div style={{ color: 'red' }}>{errors.access}</div>}
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
