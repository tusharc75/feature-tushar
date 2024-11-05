import { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { camelCase, isEqual } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import routes from 'src/components/Helpers/Routes';

const NotifSendType = [
  {
    key: 'Users',
    value: 0
  },
  {
    key: 'Roles',
    value: 1
  }
];

const AddNotificationDialog = ({ data, type, onSuccess, onClose, id }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [userOptions, setUserOptions] = useState(null);
  const [roleOptions, setRoleOptions] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (data) {
      setInitialValues({
        type: data?.type,
        ids: data?.ids?.map((e) => e?.optionValue) ?? []
      });
    } else {
      setInitialValues({
        type: 'Roles',
        ids: []
      });
    }
  }, [data]);

  useEffect(() => {
    fetchOptionsData();
  }, []);

  const fetchOptionsData = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.user},${sidebarResource.role}`)
      .then(({ data: { data } }) => {
        setUserOptions(data[sidebarResource.user] || []);
        setRoleOptions(data[sidebarResource.role] || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`${routes.workflow.path}/${id}/notifications`, { ...values, typeOfNotification: camelCase(type) })
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

  // const validate = (values) => {
  //   const errors = {};
  //   if (!values?.ids || values?.ids?.length<=0) {
  //     errors['ids'] = `${values?.type==='Role' ? 'Please select roles' : 'Please select users'}`;
  //   }
  //   return errors;
  // };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validate={() => {}}>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isEqual(initialValues, values)) onClose();
                else setShowConfirmDialog(true);
              }}
              title={data ? `Edit - ${type}` : `Add - ${type}`}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Grid className="py-2">
                  <ToggleButtonGroup
                    size="small"
                    value={values?.type}
                    exclusive
                    onChange={(e, newFilter) => {
                      setFieldValue('type', newFilter);
                      if (data && newFilter === data?.type) {
                        setFieldValue('ids', data?.ids?.map((e) => e.optionValue) ?? []);
                      } else {
                        setFieldValue('ids', []);
                      }
                    }}
                  >
                    {NotifSendType.map((k, index) => {
                      return (
                        <ToggleButton style={{ width: 80 }} value={k.key} key={index}>
                          {k.key}
                        </ToggleButton>
                      );
                    })}
                  </ToggleButtonGroup>
                </Grid>
                {values['type'] === 'Roles' ? (
                  <>
                    <Box>
                      <Autocomplete
                        id="ids"
                        disableCloseOnSelect={true}
                        options={roleOptions ?? []}
                        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                        getOptionSelected={(option: any, val) => option.optionValue === val}
                        value={
                          roleOptions && roleOptions?.filter((data) => values['ids'].includes(data.optionValue))?.length
                            ? roleOptions?.filter((data) => values['ids'].includes(data.optionValue))
                            : []
                        }
                        multiple
                        onChange={(e: any, value) => {
                          setFieldValue('ids', value?.length > 0 ? value.map((ele) => ele.optionValue) : []);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Roles"
                            placeholder="Roles"
                            name="roles"
                            required
                            error={touched['ids'] && Boolean(errors['ids'])}
                            helperText={touched['ids'] && errors['ids']}
                          />
                        )}
                      />
                    </Box>
                  </>
                ) : (
                  <>
                    <Box>
                      <Autocomplete
                        id="ids"
                        options={userOptions ?? []}
                        disableCloseOnSelect={true}
                        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                        getOptionSelected={(option: any, val) => option.optionValue === val}
                        value={
                          userOptions && userOptions?.filter((data) => values['ids'].includes(data.optionValue))?.length
                            ? userOptions?.filter((data) => values['ids'].includes(data.optionValue))
                            : []
                        }
                        onChange={(e: any, value) => {
                          setFieldValue('ids', value?.length > 0 ? value.map((ele) => ele.optionValue) : []);
                        }}
                        multiple
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Users"
                            placeholder="Users"
                            name="users"
                            required
                            error={touched['ids'] && Boolean(errors['ids'])}
                            helperText={touched['ids'] && errors['ids']}
                          />
                        )}
                      />
                    </Box>
                  </>
                )}
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                color="primary"
                disabled={submitting}
                onClick={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={submitting}
                variant="contained"
                color="primary"
                size="small"
                type="submit"
                onClick={submitForm}
                endIcon={submitting && <CircularProgress color="inherit" size={18} />}
              >
                {' '}
                Save
              </Button>
            </CustomDialogFooter>

            {showConfirmDialog ? (
              <ConfirmationCancelDialog
                close={() => setShowConfirmDialog(false)}
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
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddNotificationDialog;
