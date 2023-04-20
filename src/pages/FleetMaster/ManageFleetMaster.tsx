import { useState, useEffect, useContext, useRef, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress, Grid, IconButton, Tooltip } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import Dialog from '@material-ui/core/Dialog';
import { FaDiceOne } from 'react-icons/fa';
import { isEqual } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { setFieldsInAscendingOrder, getObjKeysWithValues, getObjKeys, CustomDialogTransition, yupSchema } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import ManageAddressDialog from 'src/components/Address/ManageAddressDialog';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const ManageFleetMaster = ({ isClone = false, id = null, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState('');
  const [showAddAddresstDialog, setShowAddAddresstDialog] = useState(false);
  const [addressDataSource, setAddressDataSource] = useState([]);
  const [formsData, setFormsData] = useState([]);

  const ref = useRef(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Fleet Master')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        const addressDropdownData = data.map((m) => m.fieldData).find((d) => d.fieldName === 'currentLocation');
        if (addressDropdownData) {
          setAddressDataSource(addressDropdownData.option);
        }
        if (id) {
          axiosInstance()
            .get(`${routes?.fleetMaster.path}/` + id)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, fleetNumber, updatedBy, ...rest } = data;
                setTitle(`Clone - ${fleetNumber}`);
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate) }
                });
                setLoading(false);
              } else {
                setTitle(`Editing - ${data.fleetNumber}`);
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
                setLoading(false);
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setTitle('Create Fleet Master');
          let initialData = { ...getObjKeys('', fieldsDataForCreate) };
          setInitialData({
            fields: fieldsDataForCreate,
            values: initialData
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [id]);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields])

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (id && isClone === false) {
      values._id = id;
      axiosInstance()
        .put(`${routes?.fleetMaster.path}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess(data.data);
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
    } else {
      axiosInstance()
        .post(`${routes?.fleetMaster.path}`, values)
        .then(({ data: { data, message } }) => {
          setSubmitting(false);
          onSuccess(data);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={title}
                onClose={(e, reason) => {
                  if (isEqual(initialData.values, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData &&
                    formsData.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    {field.fieldName === 'currentLocation' ? (
                                      <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                        <Grid container spacing={1}>
                                          <Grid
                                            item
                                            xs={permissions?.fleetMaster?.isCreate ? 11 : 12}
                                            sm={permissions?.fleetMaster?.isCreate ? 11 : 12}
                                            md={permissions?.fleetMaster?.isCreate ? 11 : 12}
                                          >
                                            <FormTypes
                                              {...field}
                                              disabled={Boolean(id) && field.disableOnEdit && !isClone}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={addressDataSource}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                            />
                                          </Grid>
                                          {permissions?.fleetMaster?.isCreate && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip title="Add Address" className="mt-1">
                                                <IconButton
                                                  onClick={() => {
                                                    setShowAddAddresstDialog(true);
                                                  }}
                                                  disabled={field.disableOnEdit}
                                                  size="small"
                                                >
                                                  <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                                </IconButton>
                                              </Tooltip>
                                            </Grid>
                                          )}
                                          {field?.tooltipMessage ? (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </Tooltip>
                                            </Grid>
                                          ) : null}
                                        </Grid>
                                      </Grid>
                                    ) : (
                                      <FormTypes
                                        {...field}
                                        disabled={field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        fieldData={field}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    )}
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        )
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  disabled={submitting}
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showAddAddresstDialog && (
                <ManageAddressDialog
                  onClose={() => {
                    setShowAddAddresstDialog(false);
                  }}
                  onSuccess={(obj) => {
                    if (obj) {
                      setShowAddAddresstDialog(false);
                      if (obj?.isAlreadyExist === true) {
                        let tempAddress = addressDataSource.find((d) => d?.optionLabel === obj?.fullAddress);
                        setFieldValue('currentLocation', tempAddress.optionValue);
                      } else {
                        setAddressDataSource((prevState) => [
                          ...prevState,
                          {
                            default: false,
                            optionLabel: obj?.fullAddress,
                            optionValue: obj._id,
                            order: addressDataSource.length + 1
                          }
                        ]);
                        setFieldValue('currentLocation', obj._id);
                      }
                    }
                  }}
                />
              )}
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
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
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageFleetMaster;
