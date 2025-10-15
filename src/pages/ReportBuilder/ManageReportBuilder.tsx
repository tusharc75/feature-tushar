import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, UnCamelCase } from '../../constants/helpers';
import { sidebarResource } from '../../constants/helpers';
import { TextField, Autocomplete } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isEmpty, isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { object, string } from 'yup';
import { reportBuilderTypeOptions } from 'src/pages/ReportBuilder/utils';

const schema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('Report name  is required'),
  resource: string().required('Resource is required'),
  type: string().required('Type is required')
});

const ManageReportBuilder = ({ onClose, onSuccess, reportData = null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const ref = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [resourceOptions, setresourceOptions] = useState(null);

  const fetchData = async () => {
    const initialValues: any = {
      name: '',
      resource: '',
      type: 'report'
    };
    if (!isEmpty(reportData)) {
      try {
        setInitialData({ ...reportData });
      } catch (e) {
        toastConfig.setToastConfig(e);
      }
    } else {
      setInitialData({ ...initialValues });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const options = [];
    for (const [key] of Object.entries(permissions)) {
      const title = resources?.[key] ? resources?.[key]?.titleSingular : UnCamelCase(key);
      options.push({ title: title, value: sidebarResource[key] || title });
    }
    setresourceOptions(options);
  }, [permissions, resources]);

  const handleSubmit = (values) => {
    setLoading(true);
    const submitData: any = {
      name: values.name.trim(),
      resource: values?.resource,
      type: values?.type
    };
    if (reportData?._id) {
      submitData._id = reportData?._id;
      axiosInstance()
        .put(`/report-builder`, submitData)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`/report-builder`, submitData)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          history.push(`${routes.reportBuilderDetail.path}/${data?.data?._id}`);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      <Formik
        innerRef={ref}
        initialValues={initialData || {}}
        validationSchema={schema}
        validateOnMount
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, submitForm, setFieldValue }) => (
          <Fragment>
            <CustomDialogHeader
              title={!isEmpty(reportData) ? `Edit Report - ${reportData?.name}` : `Create Report`}
              onClose={() => {
                if (!isEqual(ref.current?.values, initialData)) {
                  setShowConfirmDialog(true);
                } else {
                  onClose();
                }
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Report Name"
                      required={true}
                      name="name"
                      fullWidth
                      margin="none"
                      size="small"
                      value={values['name']}
                      error={touched['name'] && Boolean(errors['name'])}
                      helperText={touched['name'] && errors['name']}
                      onChange={(e) => setFieldValue('name', e.target.value.trimStart())}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                    <Autocomplete
                      disabled={!isEmpty(reportData)}
                      getOptionLabel={(option) => option.title}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={
                        resourceOptions?.find((data) => data.value === values['resource'])
                          ? resourceOptions?.find((data) => data.value === values['resource'])
                          : null
                      }
                      options={resourceOptions}
                      onChange={(e, val: any) => {
                        setFieldValue('resource', val ? val.value : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required={true}
                          margin="none"
                          size="small"
                          name="resource"
                          label="Resource"
                          variant="outlined"
                          error={touched['resource'] && Boolean(errors['resource'])}
                          helperText={touched['resource'] && errors['resource']}
                          fullWidth
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                    <Autocomplete
                      disableClearable={true}
                      getOptionLabel={(option) => option.optionLabel}
                      isOptionEqualToValue={(option, value) => option.optionValue === value.optionValue}
                      value={
                        reportBuilderTypeOptions?.find((data) => data.optionValue === values['type'])
                          ? reportBuilderTypeOptions?.find((data) => data.optionValue === values['type'])
                          : null
                      }
                      options={reportBuilderTypeOptions}
                      onChange={(e, val: any) => {
                        setFieldValue('type', val ? val.optionValue : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required={true}
                          margin="none"
                          size="small"
                          name="type"
                          label="Type"
                          variant="outlined"
                          error={touched['type'] && Boolean(errors['type'])}
                          helperText={touched['type'] && errors['type']}
                          fullWidth
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton
                buttonType="transparent"
                onClick={() => {
                  if (!isEqual(ref.current?.values, initialData)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
              >
                Cancel
              </ThemeButton>
              <ThemeButton
                isLoading={loading}
                buttonType="theme"
                onClick={(e) => {
                  e.preventDefault();
                  submitForm();
                }}
                disabled={loading}
              >
                {' '}
                Save
              </ThemeButton>
            </CustomDialogFooter>
            {showConfirmDialog ? (
              <ConfirmCancelDialog
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false);
                  submitForm();
                }}
                onClose={() => {
                  setShowConfirmDialog(false);
                  onClose();
                }}
              />
            ) : null}
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageReportBuilder;
