import { useContext, useEffect, useState } from 'react';
import {
  getObjKeys,
  sidebarResource,
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
  CustomDialogTransition,
  yupSchema
} from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import FormTypes from '../../../components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { useData } from 'src/StateProvider/Provider';

export default function ManageContactDialog({
  contactResource,
  contactApi,
  contactId,
  isClone,
  onClose,
  onSuccess,
  isRedirectToDetailPage = false,
  referenceData = null
}) {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();
  const [contactData, setContactData] = useState<any>({
    fields: [],
    initialValues: {}
  });
  const [loading, setLoading] = useState(false);

  const [formsData, setFormsData] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const history = useHistory();

  const isNew = isClone ? true : contactId ? false : true;

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [contactId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource[contactResource]}`);
      fieldData = response?.data?.data;

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (contactId) {
        let data;
        const response: any = await axiosInstance().get(`/${contactApi}/${contactId}`);
        data = response?.data?.data;

        if (isClone) {
          const { firstName, middleName, lastName, ...rest } = data;
          setCloneHeading(`${firstName ?? ''} ${middleName ?? ''} ${lastName ?? ''}`);
          setContactData({
            fields: fieldsDataForCreate,
            initialValues: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
          });
          setLoading(false);
        } else {
          setContactData({
            fields: fieldsDataForUpdate,
            initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
          });
          setLoading(false);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };

        if (referenceData) {
          Object.keys(referenceData)?.forEach((key) => {
            if (fieldsDataForCreate?.find((i) => i.fieldName === key)) {
              initialData[key] = referenceData[key];
              if (key === 'accountName') {
                fieldsDataForCreate?.forEach((e) => {
                  if (e.fieldName === 'accountName') {
                    e.disableOnEdit = true;
                    e.isUneditable = true;
                  }
                });
              }
            }
          });
        }

        setContactData({
          fields: fieldsDataForCreate,
          initialValues: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(contactData.fields));
  }, [contactData.fields]);

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

  const handleSubmit = (values) => {
    setLoading(true);
    if (!contactId || isClone === true) {
      axiosInstance()
        .post(`/${contactApi}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          onClose();
          setLoading(false);
          if (isRedirectToDetailPage) {
            history.push(`${contactApi}/detail/${data?._id}`);
          } else {
            onSuccess(data);
          }
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      values._id = contactId;
      axiosInstance()
        .put(`/${contactApi}`, values)
        .then(({ data }) => {
          setLoading(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
    >
      {contactData?.fields?.length > 0 ? (
        <Formik initialValues={contactData.initialValues} validationSchema={yupSchema(contactData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ submitForm, values, errors, touched, setFieldValue }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(contactData.initialValues, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                title={
                  isClone
                    ? `Clone - ${cloneHeading}`
                    : isNew
                      ? contactResource === 'customerContact'
                        ? `Add ${routes?.customerContact?.title}`
                        : `Add ${routes?.supplierContact?.title}`
                      : `Edit ${contactData?.initialValues?.firstName ?? ''} ${contactData?.initialValues?.lastName ?? ''}`
                }
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData &&
                    formsData?.map((form, i) => (
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
                                  isNew={isNew}
                                  {...field}
                                  disabled={!isNew && field.disableOnEdit}
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
                                  fieldData={field}
                                  fields={contactData?.fields}
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
                  onClick={() => {
                    if (isEqual(contactData.initialValues, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={loading || uploadingImageOrFileProgress > 0}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmationCancelDialog
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
              )}
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
