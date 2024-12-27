import { useState, useEffect, useContext } from 'react';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, WORK_FLOW_STATUS } from '../../constants/helpers';
import { Box, CircularProgress, TextField } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { getLookupResource } from 'src/components/FormBuilder/helper';
import Autocomplete from '@mui/material/Autocomplete';
import { object, string } from 'yup';
import ConfirmationCancelDialog from '../../components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';

const workFlowSchema = object().shape({
  workflowName: string().required('Please enter Workflow Name'),
  workflowResource: string().required('Please enter Workflow Resource')
});

const ManageWorkFlow = ({ onClose, onSuccess, isRedirectToDetailPage = false, data = null }) => {
  const {
    state: { resources }
  }: any = useData();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [resourceOption, setResourceOption] = useState(null);

  useEffect(() => {
    if (data) {
      setInitialValues({
        workflowName: data?.workflowName,
        workflowResource: data?.workflowResource
      });
    } else {
      setInitialValues({
        workflowName: '',
        workflowResource: ''
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
    if (data?._id) {
      axiosInstance()
        .put(`${routes?.workflow?.path}`, { ...values, _id: data?._id })
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
    } else {
      axiosInstance()
        .post(`${routes.workflow.path}`, { ...values, status: WORK_FLOW_STATUS.open })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          history.push(`${routes.workflow.path}/${data?.data?._id}`);
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
        <Formik initialValues={initialValues} validationSchema={workFlowSchema} onSubmit={handleSubmit} validate={() => { }}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${data ? 'Edit' : 'Add'} ${resources?.workflow?.titleSingular}`}
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
                      label="Workflow Name"
                      required={true}
                      name="workflowName"
                      fullWidth
                      margin="dense"
                      size="small"
                      value={values['workflowName']}
                      error={touched['workflowName'] && Boolean(errors['workflowName'])}
                      helperText={touched['workflowName'] && errors['workflowName']}
                      onChange={(e) => setFieldValue('workflowName', e.target.value.trimStart())}
                    />
                  </Box>
                  <Box>
                    <Autocomplete
                      id="linkResourceName"
                      options={resourceOption}
                      disabled={data}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                      value={
                        resourceOption && resourceOption?.filter((data) => data.optionValue === values['workflowResource'])?.length
                          ? resourceOption && resourceOption?.filter((data) => data.optionValue === values['workflowResource'])[0]
                          : ''
                      }
                      onChange={(e: any, value) => {
                        setFieldValue('workflowResource', value && value?.optionValue ? value.optionValue : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          size="small"
                          variant="outlined"
                          label="Workflow Resource"
                          placeholder="Workflow Resource"
                          name="workflowResource"
                          required
                          error={touched['workflowResource'] && Boolean(errors['workflowResource'])}
                          helperText={touched['workflowResource'] && errors['workflowResource']}
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
