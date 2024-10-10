import { Box, Button, Dialog, Grid, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { FieldArray, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, MATERIAL_TYPE } from 'src/constants/helpers';

const ManagedPackageDialog = ({ onClose, assemblyOrderId, onSuccess }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ managedPackages: [] });
  const [packageOptions, setPackageOptions] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`${routes.assemblyOrder.path}/material/${assemblyOrderId}`)
      .then(({ data: { data } }) => {
        setPackageOptions(
          data?.material
            ?.filter((m) => m?.type === MATERIAL_TYPE.package && !m?.parentId)
            ?.map((m) => ({ optionValue: m?.materialId, optionLabel: m?.packageDetail?.packageName }))
        );

        setInitialValues({
          managedPackages: data?.material
            ?.filter((m) => m?.type === MATERIAL_TYPE.package && !m?.parentId)
            ?.map((m) => ({ package: m?.materialId, managedPackageName: '' }))
        });
      })
      .catch((error) => {});
  }, [assemblyOrderId]);

  const validate = (values) => {
    const errors: any = {};
    if (values?.managedPackages?.length > 0) {
      values?.managedPackages?.forEach((d, i) => {
        if (!d.managedPackageName) {
          if (!errors?.managedPackageName) {
            errors['managedPackages'] = [];
          }
          errors.managedPackages[i] = { managedPackageName: 'Managed Package Name is required' };
        }
        if (!d.package) {
          if (!errors?.package) {
            errors['package'] = [];
          }
          errors.managedPackages[i] = { package: 'Package Name is required' };
        }
      });
    }
    return errors;
  };

  const handleSubmit = (values) => {
    axiosInstance()
      .post(`${routes.assemblyOrder.path}/managed-package`, { assemblyOrderId: assemblyOrderId, managedPackages: values?.managedPackages })
      .then((res) => {
        onSuccess();
      })
      .catch((error) => {});
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {initialValues?.managedPackages?.length > 0 ? (
        <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={onClose}
                title={'Managed Packages'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={true}
              />
              <CustomDialogContent>
                <Form>
                  <FieldArray
                    name="managedPackages"
                    render={(arrayHelpers) => (
                      <>
                        {values?.managedPackages?.map((data, index) => (
                          <Box mb={2} border={1} p={1} borderColor="var(--common-border-color)">
                            <Grid container spacing={2}>
                              <Grid item md={6} lg={6} sm={6} xs={12}>
                                <TextField
                                  fullWidth
                                  label="Managed Package Name"
                                  variant="outlined"
                                  type="text"
                                  size="small"
                                  name="managedPackageName"
                                  placeholder="Managed Package Name"
                                  margin="dense"
                                  value={data.message}
                                  required
                                  onChange={(e) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.managedPackages[index],
                                      ['managedPackageName']: e.target.value
                                    });
                                  }}
                                  error={
                                    touched?.managedPackages &&
                                    touched?.managedPackages[index]?.managedPackageName &&
                                    errors?.managedPackages &&
                                    Boolean(errors?.managedPackages[index]?.managedPackageName)
                                  }
                                  helperText={
                                    touched?.managedPackages &&
                                    touched?.managedPackages[index]?.managedPackageName &&
                                    errors?.managedPackages &&
                                    errors?.managedPackages[index]?.managedPackageName
                                  }
                                />
                              </Grid>
                              <Grid item md={6} lg={6} sm={6} xs={12}>
                                <Autocomplete
                                  id="package"
                                  options={packageOptions}
                                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                  getOptionSelected={(option: any, val) => option?.optionValue === val}
                                  value={
                                    packageOptions && packageOptions.filter((f) => f?.optionValue === data?.package).length
                                      ? packageOptions.filter((f) => f?.optionValue === data?.package)[0]
                                      : ''
                                  }
                                  onChange={(e, val) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.managedPackages[index],
                                      ['package']: val && val?.optionValue ? val?.optionValue : ''
                                    });
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      margin="dense"
                                      variant="outlined"
                                      label="Package"
                                      placeholder="Package"
                                      name="package"
                                      disabled
                                      required
                                      error={
                                        touched?.managedPackages &&
                                        touched?.managedPackages[index]?.package &&
                                        errors?.managedPackages &&
                                        Boolean(errors?.managedPackages[index]?.package)
                                      }
                                      helperText={
                                        touched?.managedPackages &&
                                        touched?.managedPackages[index]?.package &&
                                        errors?.managedPackages &&
                                        errors?.managedPackages[index]?.package
                                      }
                                    />
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </>
                    )}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" color="primary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  // disabled={submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  // endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  Save
                </Button>
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

export default ManagedPackageDialog;
