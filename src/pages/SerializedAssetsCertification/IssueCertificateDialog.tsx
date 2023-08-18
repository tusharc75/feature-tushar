import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { CustomDialogTransition, getObjKeys, serializedAssetsCertification, setFieldsInAscendingOrder, yupSchema } from 'src/constants/helpers';

const IssueCertificateDialog = ({ onClose, onSuccess, assetId, certificateExpiryDate }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formsData, setFormsData] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const tempInitialData: any = getObjKeys('', fields);
      tempInitialData['issueDate'] = null;
      tempInitialData['expiryDate'] = null;
      setInitialData({
        fields: fields,
        values: tempInitialData
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true)
    const attachments = values?.attachments?.map((file) => ({ name: file?.fileName?.split('_')[3], url: file?.fileName }))
    const body = { ...values, asset: assetId, attachments: attachments };
    axiosInstance().post(`${serializedAssetsCertification.api}/issue-certificate`, body)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess()
        setLoading(false)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }

  function validate(values) {
    const errors = {};
    if (moment(values.issueDate) > moment(values.expiryDate)) {
      errors['expiryDate'] = 'Expiry date must greater then Issue date';
    }
    return errors;
  }

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

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
      {formsData && formsData.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit} validate={validate}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={'Attach Certificate'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData.length > 0 &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                <FormTypes
                                  {...field}
                                  fieldData={field}
                                  fields={initialData.fields}
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
                                  required={field.required}
                                  fullWidth
                                  isTooltip={field?.isTooltip || false}
                                  tooltipMessage={field?.tooltipMessage}
                                  size="small"
                                  imageOrFileUploadCompletePercentage={
                                    ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                      ? (completePercentage) => {
                                        setUploadingImageOrFileProgress(completePercentage);
                                      }
                                      : null
                                  }
                                  {...(certificateExpiryDate && field.fieldName === 'issueDate' ? { minDate: new Date(certificateExpiryDate) } : {})}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={loading}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading || uploadingImageOrFileProgress > 0}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  onClick={submitForm}
                  endIcon={loading && <CircularProgress color="inherit" size={18} />}
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

const fields = [
  {
    _id: '6426d49d6ccedf33bf69cc7a',
    fieldLabel: 'Issue Date',
    type: 'date',
    option: [],
    required: true,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 0,
    fieldName: 'issueDate',
    resource: 'Serialized Asset',
    sectionName: 'Information',
    roleType: 0
  },
  {
    _id: '6426d49d6ccedf33bf69cc7b',
    fieldLabel: 'Expiry Date',
    type: 'date',
    option: [],
    required: true,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 1,
    fieldName: 'expiryDate',
    resource: 'Serialized Asset',
    sectionName: 'Information',
    roleType: 0
  },
  {
    _id: '6492e7d800bd0966ec702574',
    fieldLabel: 'Attachment',
    type: 'multiFileUpload',
    option: [],
    required: true,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 2,
    fieldName: 'attachments',
    resource: 'Serialized Asset',
    sectionName: 'Information',
    roleType: 0
  }
];

export default IssueCertificateDialog;
