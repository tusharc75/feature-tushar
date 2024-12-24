import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, repairType } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid, Typography, IconButton, TextField } from '@mui/material';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isEqual } from 'lodash';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InputField from 'src/components/Helpers/InputField';

const ManageRepairType = ({ isClone = false, repairTypeId = null, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const ref = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [repairTypeData, setRepairTypeData] = useState(null);
  const [repairSteps, setRepairSteps] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${repairType.resource}`)
      .then(({ data: { data } }) => {
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (repairTypeId) {
          axiosInstance()
            .get(`${repairType.api}/` + repairTypeId)
            .then(({ data: { data } }) => {
              setRepairTypeData(data);
              setRepairSteps(data?.steps ? data?.steps : []);
              if (isClone) {
                const { _id, createdBy, updatedBy, repairType, ...rest } = data;
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
                });
                setLoading(false);
              } else {
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          setInitialData({
            fields: fieldsDataForCreate,
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [repairTypeId]);

  const handleSubmit = (values) => {
    if (repairSteps?.length === 0) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Please add repair steps'
      });
      return;
    } else {
      if (repairSteps?.filter((e) => e.name?.trim() === '').length) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Step name can not be blank'
        });
        return;
      }
    }
    setLoading(true);
    if (repairTypeId && isClone === false) {
      values._id = repairTypeId;
      values.steps = repairSteps;
      axiosInstance()
        .put(`${repairType.api}`, values)
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
      values.steps = repairSteps;
      axiosInstance()
        .post(`${repairType.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          history.push(`${routes.repairType.path}/detail/${data?.data?._id}`);
        })
        .catch((error) => {
          setLoading(false);
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

  const handleAddRepairSteps = () => {
    setRepairSteps([...repairSteps, { name: '', order: repairSteps.length + 1 }]);
  };

  const handleRemoveRepairSteps = (index) => {
    setRepairSteps(repairSteps?.filter((e, i) => i !== index));
  };

  const handleonChangeValue = (index, value) => {
    const data = [...repairSteps];
    data[index].name = value;
    setRepairSteps(data);
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
      {initialData && initialData?.fields?.length ? (
        <Formik
          innerRef={ref}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, submitForm, setFieldValue }) => (
            <Fragment>
              <CustomDialogHeader
                title={repairTypeId ? (isClone ? 'Clone' : `Update ${repairTypeData?.repairType}`) : 'Create ' + resources?.repairType?.titleSingular}
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
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
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                  <div className={'detail-box-content'}>
                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Repair Steps</h2>
                  </div>
                  <Grid container>
                    <Grid item xs={12} sm={6} md={6} lg={6}>
                      <Box
                        style={{ maxHeight: '350px', overflow: 'auto' }}
                        border={1}
                        mt={2}
                        mb={1}
                        borderColor="var(--common-border-color)"
                        width={'100%'}
                      >
                        <Box p={1}>
                          <Grid container alignItems="center">
                            <Grid item xs={2} sm={2} md={2} lg={2}>
                              <Typography variant="body2">Sr.</Typography>
                            </Grid>
                            <Grid item xs={8} sm={8} md={8} lg={8}>
                              <Typography variant="body2">Step Name</Typography>
                            </Grid>
                            <Grid item xs={2} sm={2} md={2} lg={2}>
                              <Grid container justifyContent="flex-end">
                                <IconButton size="small" aria-label="setting" onClick={() => handleAddRepairSteps()}>
                                  <AddCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Box>
                        {repairSteps?.map((steps, index) => (
                          <Box key={index} p={1} borderTop={1} borderColor="var(--common-border-color)" width={'100%'}>
                            <Grid container alignItems="center">
                              <Grid item xs={2} sm={2} md={2} lg={2}>
                                <Typography variant="body2">{steps.order}</Typography>
                              </Grid>
                              <Grid item xs={8} sm={8} md={8} lg={8}>
                                <TextField
                                  id="standard-basic"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  style={{ margin: 0 }}
                                  value={steps?.name}
                                  onChange={(event) => handleonChangeValue(index, event.target.value)}
                                />
                              </Grid>
                              <Grid item xs={2} sm={2} md={2} lg={2}>
                                <Grid container justifyContent="flex-end">
                                  <IconButton size="small" aria-label="setting" onClick={() => handleRemoveRepairSteps(index)}>
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
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={loading}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
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
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageRepairType;
