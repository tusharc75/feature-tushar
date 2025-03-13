import { Box, Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import { FieldArray, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useData } from 'src/StateProvider/Provider';

const SerializedPackageDialog = ({ onClose, assemblyOrderId, onSuccess, workOrderIds = null, isSubmitting }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ serializedPackages: [] });
  const [packageOptions, setPackageOptions] = useState([]);
  const [serializedPackagedLabel, setSerializedPackagedLabel] = useState(null);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchFieldLabel();
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`${routes.assemblyOrder.path}/material/${assemblyOrderId}`)
      .then(({ data: { data } }) => {
        let material = [];
        material = data?.material?.filter((m) => m?.type === MATERIAL_TYPE.package && !m?.serializedPackage);
        if (workOrderIds?.length) {
          material = material?.filter((m) => [...workOrderIds].includes(m?.workOrder?.optionValue));
        } else {
          material = material?.filter((m) => !m.parentId);
        }
        setPackageOptions(material?.map((m) => ({ optionValue: m?.materialId, optionLabel: m?.packageDetail?.packageName })));
        setInitialValues({
          serializedPackages: material?.map((m) => ({
            package: m?.materialId,
            serializedPackageNumber: '',
            uniqueId: m?._id,
          }))
        });
      })
      .catch((error) => { });
  }, [assemblyOrderId]);

  const fetchFieldLabel = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.serializedPackages,
          fieldNames: ['serializedPackageNumber']
        }
      ]
    });
    const serializedPackageField = data?.find((d) => d.resource === sidebarResource.serializedPackages)?.fieldNames || [];
    setSerializedPackagedLabel(serializedPackageField[0]?.fieldLabel);
  };

  const validate = (values) => {
    const errors: any = {};
    if (values?.serializedPackages?.length > 0) {
      values?.serializedPackages?.forEach((d, i) => {
        if (!d.serializedPackageNumber) {
          if (!errors?.serializedPackageNumber) {
            errors['serializedPackages'] = [];
          }
          errors.serializedPackages[i] = { serializedPackageNumber: 'Serialized Package Number is required' };
        }
        if (!d.package) {
          if (!errors?.package) {
            errors['package'] = [];
          }
          errors.serializedPackages[i] = { package: 'Package Name is required' };
        }
      });
    }
    return errors;
  };

  const handleSubmit = (values) => {
    onSuccess(values?.serializedPackages);
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
      {initialValues?.serializedPackages?.length > 0 ? (
        <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={onClose}
                title={`${resources?.serializedPackages?.titlePlural} Number`}
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
                    name="serializedPackages"
                    render={(arrayHelpers) => (
                      <>
                        {values?.serializedPackages?.map((data, index) => (
                          <Box mb={2} border={1} p={1} borderColor="var(--common-border-color)">
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                                <TextField
                                  fullWidth
                                  label={serializedPackagedLabel || 'Serialized Package Number'}
                                  variant="outlined"
                                  type="text"
                                  size="small"
                                  name="serializedPackageNumber"
                                  placeholder={serializedPackagedLabel || 'Serialized Package Number'}
                                  margin="dense"
                                  value={data.message}
                                  required
                                  onChange={(e) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.serializedPackages[index],
                                      ['serializedPackageNumber']: e.target.value
                                    });
                                  }}
                                  error={
                                    touched?.serializedPackages &&
                                    touched?.serializedPackages[index]?.serializedPackageNumber &&
                                    errors?.serializedPackages &&
                                    Boolean(errors?.serializedPackages[index]?.serializedPackageNumber)
                                  }
                                  helperText={
                                    touched?.serializedPackages &&
                                    touched?.serializedPackages[index]?.serializedPackageNumber &&
                                    errors?.serializedPackages &&
                                    errors?.serializedPackages[index]?.serializedPackageNumber
                                  }
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                                <Autocomplete
                                  id="package"
                                  disabled
                                  options={packageOptions}
                                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                  isOptionEqualToValue={(option: any, val) => option?.optionValue === val}
                                  value={
                                    packageOptions && packageOptions.filter((f) => f?.optionValue === data?.package).length
                                      ? packageOptions.filter((f) => f?.optionValue === data?.package)[0]
                                      : ''
                                  }
                                  onChange={(e, val) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.serializedPackages[index],
                                      ['package']: val && val?.optionValue ? val?.optionValue : ''
                                    });
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      margin="dense"
                                      size="small"
                                      variant="outlined"
                                      label="Package"
                                      placeholder="Package"
                                      name="package"
                                      disabled
                                      required
                                      error={
                                        touched?.serializedPackages &&
                                        touched?.serializedPackages[index]?.package &&
                                        errors?.serializedPackages &&
                                        Boolean(errors?.serializedPackages[index]?.package)
                                      }
                                      helperText={
                                        touched?.serializedPackages &&
                                        touched?.serializedPackages[index]?.package &&
                                        errors?.serializedPackages &&
                                        errors?.serializedPackages[index]?.package
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
                <ThemeButton buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={isSubmitting}
                  buttonType="theme"
                  disabled={isSubmitting}
                  onClick={submitForm}
                >
                  Save
                </ThemeButton>
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

export default SerializedPackageDialog;