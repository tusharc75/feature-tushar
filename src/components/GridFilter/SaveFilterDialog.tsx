import React, { useState, useEffect, useRef, useContext, Fragment } from 'react';
import { Button, Checkbox, Dialog, FormControlLabel, TextField } from '@material-ui/core';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../Helpers/CustomButton';
import { Form, Formik } from 'formik';
import { object, string, boolean } from 'yup';
import { Autocomplete } from '@material-ui/lab';

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
    })
});

const orderByOptions = ['asc', 'desc'];

function SaveFilterDialog({ handleClose, handleSucess, resource, filterValue, filterData, columns }) {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const [initialValue] = useState({
    title: filterData?.title || '',
    default: filterData?.default || false,
    sorting: filterData?.sorting || false,
    sortBy: filterData?.sortBy || '',
    orderBy: filterData?.orderBy || ''
  });

  const handleSubmit = (values) => {
    const data = {
      title: values?.title,
      resource: resource,
      filterValue: filterValue,
      default: values.default,
      sorting: values.sorting || false,
      sortBy: values.sortBy,
      orderBy: values.orderBy
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
                <FormControlLabel
                  control={<Checkbox checked={values['default']} onChange={(e) => setFieldValue('default', e.target.checked)} name="default" />}
                  label="Set this filter as default"
                />
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
                />
                <FormControlLabel
                  control={<Checkbox checked={values['sorting']} onChange={(e) => setFieldValue('sorting', e.target.checked)} name="sorting" />}
                  label="Enable Sorting"
                />
                {values['sorting'] && columns.length && (
                  <div className="flex flex-wrap gap-2 my-2">
                    <Autocomplete
                      id="sorting"
                      options={columns}
                      size="small"
                      value={columns.find((column) => column.fieldName === values['sortBy'])}
                      onChange={(event: any, newValue: any) => {
                        setFieldValue('sortBy', newValue?.fieldName || '');
                      }}
                      getOptionLabel={(option: any) => option.fieldLabel}
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
