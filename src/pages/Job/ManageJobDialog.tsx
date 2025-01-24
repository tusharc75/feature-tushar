import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box } from '@mui/material';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  yupSchema,
  GenerateResourceLineNumber,
  sidebarResource
} from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

const ManageJobDialog = ({ isClone, jobId, jobData = null, onClose, onSuccess, open, referenceData = null, isDisableCustomerAccount = false }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [jobDetails, setJobDetails] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [jobId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Job');
      fieldData = response?.data?.data;

      var statusOptions = [];
      fieldData?.forEach((e: any) => {
        if (e?.fieldData?.fieldName === 'status') {
          statusOptions = e.fieldData.option;
        }
      });
      var fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      var fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (jobId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${routes.job.path}/` + jobId);
          data = response?.data?.data;
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, jobNumber, updatedBy, ...rest } = data;
            rest['status'] = 'New';
            rest['jobNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(jobNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
            setLoading(false);
          } else {
            setJobDetails(data);
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = getObjKeys('', fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          initialData['currency'] = user.user?.brandCurrency;
        }
        initialData['jobNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (jobId && isClone === false) {
      values._id = jobId;
      axiosInstance()
        .put(`${routes.job.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.job.path}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes.jobDetail.path}/${data?._id}`);
          setLoading(false);
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

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <>
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
        open={open}
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
                  title={
                    !jobId ? `Create ${resources?.job?.titleSingular}` : `${isClone ? `Clone - ${cloneHeading}` : `Update ${jobData?.jobNumber}`}`
                  }
                  onClose={() => {
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
                  <Form>
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                      }}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                      resource={sidebarResource.job}
                      referenceId={jobId || null}
                    />
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <ThemeButton
                    buttonType="transparent"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                  >
                    Cancel
                  </ThemeButton>
                  <ThemeButton
                    isLoading={loading}
                    buttonType="theme"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
                    }}
                  >
                    Save
                  </ThemeButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
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
    </>
  );
};

export default ManageJobDialog;
