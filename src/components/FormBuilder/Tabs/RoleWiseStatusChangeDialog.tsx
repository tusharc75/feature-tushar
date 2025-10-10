import { Fragment, useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, Dialog, IconButton, TextField } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { FieldArray, Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { RemoveCircleOutline } from '@mui/icons-material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

export default function RoleWiseStatusChangeDialog({ onClose, onSuccess, resourceData }) {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ roleWiseStatusChange: [] });
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loadingStatusOptions, setLoadingStatusOptions] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    if (resourceData?.statusChangePermissions?.length) {
      setInitialValues({ roleWiseStatusChange: resourceData?.statusChangePermissions });
    }
  }, [resourceData]);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    axiosInstance().get(`/role`).then(({ data: { data } }) => {
      const roleOptions = data.map((role) => ({
        optionLabel: role.name,
        optionValue: role._id
      }));
      setRoles(roleOptions);
      setLoadingRoles(false);
    });
  };

  const fetchStatusOptions = async () => {
    setLoadingStatusOptions(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedAsset}&view=true`)
      .then(({ data: { data } }) => {
        const statusField = data?.find((f) => f?.fieldData?.fieldName === 'status')?.fieldData;
        if (statusField?.option) {
          setStatusOptions(statusField.option);
        }
        setLoadingStatusOptions(false);
      })
      .catch((error) => {
        setLoadingStatusOptions(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/status-change-permissions`, values?.roleWiseStatusChange)
      .then(({ data }) => {
        setSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  function validate(values) {
    const errors = {};
    if (values?.roleWiseStatusChange?.length > 0) {
      values?.roleWiseStatusChange?.forEach((item: any, index) => {
        if (!item?.from_status || (Array.isArray(item.from_status) && !item?.from_status?.length)) {
          errors[`roleWiseStatusChange.${index}.from_status`] = 'From Status is Required';
        }
        if (!item?.to_status || (Array.isArray(item.to_status) && !item?.to_status?.length)) {
          errors[`roleWiseStatusChange.${index}.to_status`] = 'To Status is Required';
        }
        if (!item?.roles || (Array.isArray(item.roles) && !item?.roles?.length)) {
          errors[`roleWiseStatusChange.${index}.roles`] = 'Roles are Required';
        }
      });
    }
    return errors;
  }

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
      {!loadingRoles && !loadingStatusOptions ? (
        <Formik initialValues={initialValues} validateOnMount validate={validate} onSubmit={handleSave}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={onClose}
                title="Status Change Permissions by Roles"
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
              />
              <CustomDialogContent className="pt-0">
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <FieldArray name="roleWiseStatusChange">
                    {({ push, remove }) => (
                      <>
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[var(--dark-primary,white)] py-3 pb-3">
                          <ThemeButton buttonType="theme" onClick={() => push({ from_status: [], to_status: [], roles: [] })}>
                            Add
                          </ThemeButton>
                        </div>
                        <ul className="list-none space-y-4">
                          {values?.roleWiseStatusChange?.map((item, index) => (
                            <RoleWiseStatusChangeCard
                              key={index}
                              values={values}
                              index={index}
                              parentRemove={remove}
                              setFieldValue={setFieldValue}
                              errors={errors}
                              touched={touched}
                              statusOptions={statusOptions}
                              roles={roles}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </FieldArray>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton disabled={submitting} buttonType="theme" onClick={submitForm} isLoading={submitting}>
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box height={'h-fit'} padding={2}>
          <CommonSkeleton lenArray={[...Array(6).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}

const RoleWiseStatusChangeCard = ({ values, index, parentRemove, setFieldValue, errors, touched, statusOptions, roles }) => {
  return (
    <li className="flex list-none items-center gap-2">
      <fieldset className="flex-grow space-y-2 rounded-md border px-3 pb-3">
        <legend className="text-right">
          <HtmlTooltip title={'Remove'}>
            <IconButton size="small" aria-label="close" onClick={() => parentRemove(index)}>
              <RemoveCircleOutline fontSize="small" color={'error'} />
            </IconButton>
          </HtmlTooltip>
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Autocomplete
            options={statusOptions}
            getOptionLabel={(option) => option?.optionLabel || ''}
            value={statusOptions?.filter((status) => values?.roleWiseStatusChange?.[index]?.from_status?.includes(status?.optionValue)) || []}
            fullWidth
            multiple
            onChange={(e, newValue) => {
              setFieldValue(`roleWiseStatusChange.${index}.from_status`, newValue?.map((v) => v?.optionValue) || []);
            }}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="From Status"
                margin="none"
                size="small"
                required
                error={touched?.roleWiseStatusChange?.[index]?.from_status && Boolean(errors[`roleWiseStatusChange.${index}.from_status`])}
                helperText={touched?.roleWiseStatusChange?.[index]?.from_status && errors[`roleWiseStatusChange.${index}.from_status`]}
                variant="outlined"
              />
            )}
          />
          <Autocomplete
            options={statusOptions}
            getOptionLabel={(option) => option?.optionLabel || ''}
            value={statusOptions?.filter((status) => values?.roleWiseStatusChange?.[index]?.to_status?.includes(status?.optionValue)) || []}
            fullWidth
            multiple
            onChange={(e, newValue) => {
              setFieldValue(`roleWiseStatusChange.${index}.to_status`, newValue?.map((v) => v?.optionValue) || []);
            }}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="To Status"
                margin="none"
                size="small"
                required
                error={touched?.roleWiseStatusChange?.[index]?.to_status && Boolean(errors[`roleWiseStatusChange.${index}.to_status`])}
                helperText={touched?.roleWiseStatusChange?.[index]?.to_status && errors[`roleWiseStatusChange.${index}.to_status`]}
                variant="outlined"
              />
            )}
          />
          <Autocomplete
            options={roles}
            getOptionLabel={(option) => option?.optionLabel || ''}
            value={roles?.filter((role) => values?.roleWiseStatusChange?.[index]?.roles?.includes(role?.optionValue)) || []}
            fullWidth
            multiple
            onChange={(e, newValue) => {
              setFieldValue(`roleWiseStatusChange.${index}.roles`, newValue?.map((v) => v?.optionValue) || []);
            }}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Roles"
                margin="none"
                size="small"
                required
                error={touched?.roleWiseStatusChange?.[index]?.roles && Boolean(errors[`roleWiseStatusChange.${index}.roles`])}
                helperText={touched?.roleWiseStatusChange?.[index]?.roles && errors[`roleWiseStatusChange.${index}.roles`]}
                variant="outlined"
              />
            )}
          />
        </div>
      </fieldset>
    </li>
  );
};
