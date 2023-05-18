import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  packages,
  setFieldsInAscendingOrder,
  sidebarResource,
  yupSchema
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';

const ManagePackageDialog = ({ isClone, packageId, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [packageName, setPackageName] = useState('');
  const {
    state: { user }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  useEffect(() => {
    fetchFields();
  }, [packageId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.packages}`);
      fieldData = response?.data?.data;
      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (packageId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${packages.api}/${packageId}`);
          data = response?.data?.data;
          if (isClone) {
            const { _id, brand, createdBy, entity, packageName, history, updatedBy, ...rest } = data;
            setPackageName(packageName);
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(rest, fieldsDataForCreate)
            });
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = getObjKeys('', fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (packageId && isClone === false) {
      values._id = packageId;
      axiosInstance()
        .put(`${packages.api}`, values)
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
        .post(`${packages.api}`, values)
        .then(({ data: { data, message } }) => {
          history.push(`${routes.packagesDetail.path}/${data._id}`);
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
      open={open}
    >
      {formsData && formsData?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit }) => (
            <Fragment>
              <CustomDialogHeader
                title={!packageId ? 'Create Package' : `${isClone ? `Clone - ${packageName}` : 'Edit'}`}
                onClose={(e, reason) => {
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
                  {formsData.map((form, i) => (
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
                                isNew={Boolean(packageId)}
                                {...field}
                                fieldData={field}
                                disabled={Boolean(packageId) && field.disableOnEdit && !isClone}
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
                  disabled={submitting}
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
                  loading={submitting}
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    handleSubmit();
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
                    handleSubmit();
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
  );
};

export default ManagePackageDialog;
