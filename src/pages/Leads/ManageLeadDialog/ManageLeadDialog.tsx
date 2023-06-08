import { useEffect, useState, useContext, Fragment } from 'react';
import { Box, Button, Grid, IconButton, Tooltip } from '@material-ui/core';
import { Formik, Form } from 'formik';
import { useHistory } from 'react-router-dom';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import {
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
} from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';

export default function ManageLeadDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  isRedirectToDetailPage = true,
  isClone = false,
  leadId = null
}) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const { state: { user, selectedEntity, permissions } }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    getLeadFields();
  }, []);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  const getLeadFields = async () => {
    const response = await axiosInstance().get(`/field?resource=Lead`);
    let data = response?.data?.data;

    const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
    const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

    if (isNew) {
      if (isClone) {
        axiosInstance()
          .get(`${routes.lead.path}/${leadId}?entity=${selectedEntity}`)
          .then(({ data: { data } }) => {
            const { _id, firstName, lastName, middleName, ...rest } = data;
            setCloneHeading(`${firstName || ''} ${middleName || ''} ${lastName || ''}`);
            let tempData = { ...rest };
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(tempData, fieldsDataForCreate)
            });
          });
      } else {
        setInitialData({
          fields: fieldsDataForCreate,
          values: getObjKeys('', fieldsDataForCreate)
        });
      }
    } else {
      setInitialData({
        fields: fieldsDataForUpdate,
        values: getObjKeysWithValues(dataToUpdate, fieldsDataForUpdate)
      });
    }
  };

  const handleSubmit = async (values) => {
    if (isNew) {
      axiosInstance()
        .post(`${routes.lead.path}?entity=${selectedEntity}`, values)
        .then(({ data }) => {
          const newId = data.data._id;
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          if (isRedirectToDetailPage) {
            history.push(`${routes.leadDetail.path}/${newId}`);
          }
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    } else {
      values = { ...values, _id: dataToUpdate._id };
      axiosInstance()
        .put(`${routes.lead.path}?entity=${selectedEntity}`, values)
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
          toastConfig.setToastConfig(error);
          setLoading(false);
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
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
            {({ values, errors, setFieldValue, setFieldTouched, setErrors, setValues, touched, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    isClone
                      ? `Clone - ${cloneHeading}`
                      : isNew
                        ? 'Create Lead'
                        : `Editing ${[dataToUpdate.firstName, dataToUpdate.lastName].filter((f) => f).join(' ')}`
                  }
                  onClose={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {formsData && formsData.map((form, i) => {
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
                                      isNew={isNew}
                                      {...field}
                                      disabled={!isNew && field.disableOnEdit}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      fieldData={field}
                                      fields={initialData.fields}
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
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={uploadingImageOrFileProgress > 0 || loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
                {showConfirmDialog && (
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
                )}
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
}
