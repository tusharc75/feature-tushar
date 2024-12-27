import { useState, useEffect, useContext, useRef, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  wellMaster,
  setFieldsInAscendingOrder,
  yupSchema
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import { useData } from '../../../StateProvider/Provider';
import { isArray, isEqual } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';

const ManageWellMaster = ({ isClone = false, wellMasterId = null, onClose, onSuccess, referenceData = null, isRedirectToDetailPage = true }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity, resources }
  }: any = useData();
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [title, setTitle] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Well Master')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (wellMasterId) {
          axiosInstance()
            .get(`${wellMaster.api}/` + wellMasterId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, wellName, updatedBy, ...rest } = data;
                setTitle(`Clone - ${wellName}`);
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
                });
                setAllFields(fieldsDataForCreate);
                setLoading(false);
              } else {
                setTitle(`Editing - ${data.wellName}`);
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
                setAllFields(fieldsDataForUpdate);

                setLoading(false);
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setTitle(`Create ${resources?.wellMaster?.titleSingular}`);
          let tempInitialData: any = getObjKeys('', fieldsDataForCreate);
          for (const key in referenceData) {
            if (referenceData[key] && fieldsDataForCreate?.some((e) => e.fieldName === key)) {
              const field: any = fieldsDataForCreate?.find((e) => e.fieldName === key);
              if (field.type === 'multiSelect' && !isArray(referenceData[key])) {
                tempInitialData[key] = [referenceData[key]];
              } else {
                tempInitialData[key] = referenceData[key];
              }
              field.disableOnEdit = true;
              field.isUneditable = true;
            }
          }
          setAllFields(fieldsDataForCreate);
          setInitialData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            values: tempInitialData
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [wellMasterId]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (wellMasterId && isClone === false) {
      values._id = wellMasterId;
      axiosInstance()
        .put(`${wellMaster.api}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess(data.data);
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
        .post(`${wellMaster.api}`, values)
        .then(({ data: { data, message } }) => {
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          if (isRedirectToDetailPage) {
            history.push(`${routes.wellMasterDetail.path}/${data?._id}`);
          } else {
            onSuccess(data);
          }
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
      open={true}
    >
      {initialData?.fields?.length ? (
        <Formik innerRef={ref} initialValues={initialData.values} validationSchema={yupSchema(allFields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={title}
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
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={allFields}
                    size="small"
                    fullWidth
                  />
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
                  startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
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
  );
};

export default ManageWellMaster;
