import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, sidebarResource } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box } from '@mui/material';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isArray, isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ManageWellNumber = ({ isClone = false, id = null, onClose, onSuccess, referenceData = null, isRedirectToDetailPage = false }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();
  const ref = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [wellNumberData, setWellNumberData] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.wellNumber}`)
      .then(({ data: { data } }) => {
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (id) {
          axiosInstance()
            .get(`${routes.wellNumber.path}/` + id)
            .then(({ data: { data } }) => {
              setWellNumberData(data);
              if (isClone) {
                const { wellNumber, ...rest } = data;
                setCloneHeading(wellNumber);
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
                });
                setLoading(false);
              } else {
                if (referenceData?.wellName) {
                  fieldsDataForCreate?.forEach((e) => {
                    if (e.fieldName === 'wellName') {
                      e.disableOnEdit = true;
                      e.isUneditable = true;
                    }
                  });
                }
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
          if (referenceData) {
            for (const [key, values] of Object.entries(referenceData)) {
              if (fieldsDataForCreate?.find((e) => e.fieldName === key)) {
                if (key === 'wellName' && isArray(values)) {
                  if (values?.length === 1) {
                    createValues[key] = values[0];
                  }
                } else {
                  createValues[key] = values;
                }
              }
            }
            if (referenceData?.wellName) {
              fieldsDataForCreate?.forEach((e) => {
                if (e.fieldName === 'wellName') {
                  if (isArray(referenceData?.wellName)) {
                    e.option = e.option?.filter((e) => referenceData?.wellName?.includes(e?.optionValue));
                  } else {
                    e.disableOnEdit = true;
                    e.isUneditable = true;
                  }
                }
              });
            }
          }
          setInitialData({
            fields: fieldsDataForCreate,
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [id]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (id && isClone === false) {
      values._id = id;
      axiosInstance()
        .put(`${routes.wellNumber.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          onSuccess(data.data);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.wellNumber.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          if (isRedirectToDetailPage) {
            history.push(`${routes.wellNumberDetail.path}/${data?.data?._id}`);
          } else {
            onSuccess(data.data);
          }
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
      {initialData.fields.length ? (
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
                title={
                  id
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${wellNumberData?.wellNumber}`
                    : 'Create ' + resources?.wellNumber?.titleSingular
                }
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
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
                  buttonType="theme"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={loading}
                >
                  {' '}
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
  );
};

export default ManageWellNumber;
