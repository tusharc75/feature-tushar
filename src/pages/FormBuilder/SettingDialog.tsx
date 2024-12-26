import { Box, Button, Checkbox, Dialog, FormControlLabel, Grid, TextField } from '@mui/material';
import { Field, FieldArray, Form, Formik } from 'formik';
import { isEmpty, isEqual } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from '../../constants/helpers';
import Autocomplete from '@mui/material/Autocomplete';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const SettingDialog = ({ entities, resource, handleClose }) => {
  const [initialValues, setInitialValues] = useState({
    entityWiseResourceName: false,
    entityResources: {}
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  const fetchData = async () => {
    const response = await axiosInstance().get(`/sa-formbuilder/entity-wise-resource-names/${resource}`);
    const data = response?.data?.data;
    if (data?.length) {
      const values: any = {};
      data?.forEach((d: any) => {
        values[d.entity] = {
          resourceLabel: d.resourceLabel,
          homePageLabel: d.homePageLabel
        };
      });
      setInitialValues({
        entityWiseResourceName: true,
        entityResources: values
      });
      setSelectedEntities(entities?.filter((e: any) => data?.find((d: any) => d?.entity === e?._id)) || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resource]);

  const handleSave = (values) => {
    const payload = [];
    if (values?.entityWiseResourceName) {
      selectedEntities?.forEach((entity) => {
        payload.push({
          entity: entity._id,
          resourceLabel: values?.entityResources[entity._id]?.resourceLabel,
          homePageLabel: values?.entityResources[entity._id]?.homePageLabel
        });
      });
    }

    axiosInstance()
      .post(`/sa-formbuilder/entity-wise-resource-names/${resource}`, payload)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        handleClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        handleClose();
      });
  };

  const validation = (values) => {
    const errors: any = {};
    if (values?.entityWiseResourceName) {
      selectedEntities?.forEach((entity) => {
        if (!values?.entityResources[entity._id]?.resourceLabel) {
          errors[`entityResources.${entity._id}.resourceLabel`] = 'Required';
        }
        if (!values?.entityResources[entity._id]?.homePageLabel) {
          errors[`entityResources.${entity._id}.homePageLabel`] = 'Required';
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="md"
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
      <Formik enableReinitialize={true} initialValues={initialValues} onSubmit={handleSave} validate={validation}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`Settings`}
              onClose={() => {
                if (isEqual(values, initialValues)) handleClose();
                setShowConfirmDialog(true);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              showRequiredLabel={false}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Box>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="entityWiseResourceName"
                        checked={values['entityWiseResourceName']}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setFieldValue('entityWiseResourceName', val);
                        }}
                        color="primary"
                      />
                    }
                    label="Entity Wise Resoure Name"
                  />
                  {values.entityWiseResourceName && (
                    <Box pt={1} pb={1}>
                      <Autocomplete
                        id="entities"
                        multiple
                        size="small"
                        disableCloseOnSelect
                        options={entities || []}
                        getOptionLabel={(option: any) => (option ? option?.entityName : '')}
                        isOptionEqualToValue={(option: any, val) => option?._id === val?._id}
                        value={selectedEntities}
                        onChange={(e, val) => {
                          setSelectedEntities(val);
                        }}
                        renderInput={(params) => (
                          <TextField {...params} margin="dense" size="small" variant="outlined" label="Entities" fullWidth name="entities" />
                        )}
                      />
                      <FieldArray name="entityResources">
                        {() =>
                          selectedEntities?.map((entity, index) => (
                            <Box pt={2}>
                              <Grid container spacing={1}>
                                <Grid item xs={4}>
                                  <TextField
                                    disabled
                                    variant="outlined"
                                    size="small"
                                    value={entities.find((e) => e._id === entity._id)?.entityName || ''}
                                    label="Entity"
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={4}>
                                  <Field
                                    as={TextField}
                                    variant="outlined"
                                    size="small"
                                    required={true}
                                    value={values['entityResources'][entity._id]?.resourceLabel || ''}
                                    label="Resource Label (Singular)"
                                    fullWidth
                                    onChange={(e) => {
                                      setFieldValue(`entityResources.${entity._id}.resourceLabel`, e.target.value);
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={4}>
                                  <Field
                                    as={TextField}
                                    value={values['entityResources'][entity._id]?.homePageLabel || ''}
                                    variant="outlined"
                                    size="small"
                                    required={true}
                                    label="Resource Label (Plural)"
                                    fullWidth
                                    onChange={(e) => {
                                      setFieldValue(`entityResources.${entity._id}.homePageLabel`, e.target.value);
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          ))
                        }
                      </FieldArray>
                    </Box>
                  )}
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                onClick={() => {
                  if (isEqual(values, initialValues)) handleClose();
                  setShowConfirmDialog(true);
                }}
                color="primary"
              >
                Cancel
              </Button>
              <Button
                size="small"
                type="submit"
                color="primary"
                variant="contained"
                disabled={(values.entityWiseResourceName && !selectedEntities?.length) || !isEmpty(errors)}
                onClick={submitForm}
              >
                Save
              </Button>
            </CustomDialogFooter>
            {showConfirmDialog ? (
              <ConfirmCancelDialog
                close={() => setShowConfirmDialog(false)}
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false);
                  submitForm();
                }}
                onClose={() => {
                  setShowConfirmDialog(false);
                  handleClose();
                }}
              />
            ) : null}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default SettingDialog;
