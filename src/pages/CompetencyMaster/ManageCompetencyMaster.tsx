import { Box, Button, CircularProgress, Dialog, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { CustomDialogTransition, isFieldNotTouched, setFieldsInAscendingOrder } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';

const ManageCompetencyMaster = ({ onClose, onSuccess, isClone = false, id = null }) => {
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [competencySteps, setCompetencySteps] = useState([]);

  const ref = useRef(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get('/field?resource=Competency Master');
      data = response?.data?.data;
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`/competency-master/${id}`)
          .then(({ data: { data } }) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            setCompetencySteps(data?.competency || []);
            if (isClone) {
              fields = fieldsDataForCreate;
              const { label, ...rest } = data;
              setCloneHeading(label);
              tempData = { ...rest, label };
            }
            setInitialData({
              fields: fields,
              values: getObjKeysWithValues(tempData, fields)
            });
            setFormsData(setFieldsInAscendingOrder(fields));
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
        setFormsData(setFieldsInAscendingOrder(fieldsDataForCreate));
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    values.competency = competencySteps;
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`/competency-master`, values)
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
    } else {
      axiosInstance()
        .post(`/competency-master`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess(data);
          setSubmitting(true);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Created Successfully'
          });
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
        });
    }
  };
  function validate(values) {
    const errors = {};
    return errors;
  }

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
  };

  const handleAddLTMSteps = () => {
    setCompetencySteps([...competencySteps, { name: '', description: '' }]);
  };

  const handleRemoveLTMSteps = (index) => {
    const data = competencySteps?.filter((e, i) => i !== index);
    setCompetencySteps(data);
  };

  const handleOnDescriptionChangeValue = (index, value) => {
    const data = [...competencySteps];
    data[index].description = value;
    setCompetencySteps(data);
    // setTotalDays(data?.reduce((acc, curr) => acc + parseInt(curr.days), 0));
  };

  const handleOnNameChangeValue = (index, value) => {
    const data = [...competencySteps];
    data[index].name = value;
    setCompetencySteps(data);
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
      {initialData.fields.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validate={validate}
          innerRef={ref}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={`${
                  id
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${initialData.values?.label ? `(${initialData.values?.label})` : ''}`
                    : `Create New Competency`
                }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
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
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      disabled={field.disabled}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        handleValuesChange({ [name]: value });
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        )
                      );
                    })}
                  <div className={'detail-box-content'}>
                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Competency Steps</h2>
                  </div>
                  <Grid container>
                    <Grid item xs={12}>
                      <Box
                        style={{ maxHeight: '350px', overflow: 'auto' }}
                        bgcolor="white"
                        border={1}
                        mt={2}
                        mb={1}
                        borderColor="grey.300"
                        width={'100%'}
                      >
                        <Box p={1} bgcolor="grey.200">
                          <Grid container xs={12}>
                            <Grid item xs={6}>
                              <Typography variant="body2">Name</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2">Description</Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Grid container justifyContent="flex-end">
                                <IconButton
                                  size="small"
                                  aria-label="setting"
                                  onClick={() => {
                                    handleAddLTMSteps();
                                  }}
                                >
                                  <AddCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Box>
                        {competencySteps?.map((steps, index) => (
                          <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <TextField
                                  id="Days-Field"
                                  variant="outlined"
                                  margin="dense"
                                  name="name"
                                  label="Name"
                                  type="name"
                                  fullWidth
                                  style={{ margin: 0 }}
                                  value={steps?.name || ''}
                                  onChange={(event) => handleOnNameChangeValue(index, event.target.value)}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  id="Days-Field"
                                  variant="outlined"
                                  margin="dense"
                                  name="description"
                                  label="Description"
                                  type="description"
                                  fullWidth
                                  style={{ margin: 0 }}
                                  value={steps?.description || ''}
                                  onChange={(event) => handleOnDescriptionChangeValue(index, event.target.value)}
                                />
                              </Grid>
                              <Grid item xs={2}>
                                <Grid container justifyContent="flex-end">
                                  <IconButton size="small" aria-label="setting" onClick={() => handleRemoveLTMSteps(index)}>
                                    <RemoveCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (
                      isFieldNotTouched(
                        {
                          initialValues: initialData.values,
                          fields: initialData.fields
                        },
                        values
                      )
                    )
                      onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading || submitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
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
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageCompetencyMaster;
