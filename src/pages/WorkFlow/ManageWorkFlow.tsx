import { useState, useEffect, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, WORK_FLOW_STATUS } from '../../constants/helpers';
import { Box, CircularProgress, TextField } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { getLookupResource } from 'src/components/FormBuilder/helper';
import { Autocomplete } from '@material-ui/lab';
import { object, string } from 'yup';
import ConfirmationCancelDialog from '../../components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const workFlowSchema = object().shape({
  workFlowName: string().required('Please enter Work Flow name'),
  workFlowResource: string().required('Please enter Work Flow Resource')
});

const ManageWorkFlow = ({ onClose, onSuccess, isRedirectToDetailPage = false, data= null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [resourceOption, setResourceOption] = useState(null);

  useEffect(() => {
    if(data){
      setInitialValues({
        workFlowName: data?.workFlowName,
        workFlowResource: data?.workFlowResource
      });
    }else{
      setInitialValues({
        workFlowName: '',
        workFlowResource: ''
      });
    }
    getResourceList();
  }, []);

  const getResourceList = async () => {
    const lookupResource = await getLookupResource();
    setResourceOption(lookupResource);
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if(data?._id){
      axiosInstance()
      .put(`${routes?.workFlow?.path}`, {...values, _id: data?._id})
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSubmitting(false);
        onSuccess();
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
    }else{
      axiosInstance()
      .post(`${routes.workFlow.path}`, {...values, status: WORK_FLOW_STATUS.open})
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSubmitting(false);
        history.push(`${routes.workFlow.path}/${data?.data?._id}`);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
    }
  };

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
      {resourceOption && resourceOption?.length > 0 ? (
        <Formik initialValues={initialValues} validationSchema={workFlowSchema} onSubmit={handleSubmit} validate={() => {}}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${data ? 'Edit' : 'Add'} Work Flow`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Work Flow Name"
                      required={true}
                      name="workFlowName"
                      fullWidth
                      margin="dense"
                      size="small"
                      value={values['workFlowName']}
                      error={touched['workFlowName'] && Boolean(errors['workFlowName'])}
                      helperText={touched['workFlowName'] && errors['workFlowName']}
                      onChange={(e) => setFieldValue('workFlowName', e.target.value.trimStart())}
                    />
                  </Box>
                  <Box>
                    <Autocomplete
                      id="linkResourceName"
                      options={resourceOption}
                      disabled={data}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        resourceOption && resourceOption?.filter((data) => data.optionValue === values['workFlowResource'])?.length
                          ? resourceOption && resourceOption?.filter((data) => data.optionValue === values['workFlowResource'])[0]
                          : ''
                      }
                      onChange={(e: any, value) => {
                        setFieldValue('workFlowResource', value && value?.optionValue ? value.optionValue : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          variant="outlined"
                          label="Work Flow Resource"
                          placeholder="Work Flow Resource"
                          name="workFlowResource"
                          required
                          error={touched['workFlowResource'] && Boolean(errors['workFlowResource'])}
                          helperText={touched['workFlowResource'] && errors['workFlowResource']}
                        />
                      )}
                    />
                  </Box>
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
      ) : (
        <Box p={2} height={300}>
          <CommonSkeleton lenArray={[...Array(6).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageWorkFlow;
