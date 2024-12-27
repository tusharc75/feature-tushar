import { Box, Button, CircularProgress, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, setFieldsInAscendingOrder } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from 'src/components/Helpers/FormTypes';

const ManageStep = ({ onClose, onSuccess, resource, resourceId, stepId, id = null, fields = [] }) => {
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = () => {
    setLoading(true);
    if (id) {
      axiosInstance()
        .get(`/dynamic-form/step/detail/${resourceId}/${stepId}/${id}`, {
          headers: {
            Resource: resource
          }
        })
        .then(({ data: { data } }) => {
          setInitialData({
            fields: fields,
            values: getObjKeysWithValues(data, fields)
          });
          setLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      const tempInitialData = getObjKeys('', fields);
      setInitialData({
        fields: fields,
        values: tempInitialData
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    if (id) {
      axiosInstance()
        .put(
          `/dynamic-form/step/${resourceId}`,
          { ...values, _id: id, stepId },
          {
            headers: {
              Resource: resource
            }
          }
        )
        .then(({ data }) => {
          onSuccess();
          setSubmitting(false);
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
        .post(`/dynamic-form/step/${resourceId}`, [{ ...values, stepId }], {
          headers: {
            Resource: resource
          }
        })
        .then(({ data }) => {
          onSuccess();
          setSubmitting(false);
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
    }
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
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={id ? `${'Edit'}` : 'Create'}
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
                                  <Grid key={field.fieldName} size={{xs:12, sm:6, md:6}}>
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      imageOrFileUploadCompletePercentage={
                                        ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                          ? (completePercentage) => {
                                              setUploadingImageOrFileProgress(completePercentage);
                                            }
                                          : null
                                      }
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      fields={initialData?.fields}
                                    />
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
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={uploadingImageOrFileProgress > 0 || loading || submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
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

export default ManageStep;
