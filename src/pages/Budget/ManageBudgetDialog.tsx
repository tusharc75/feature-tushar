import { Box, Button } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import CustomButton from '../../components/Helpers/CustomButton';
import {
  CustomDialogTransition,
  GenerateResourceLineNumber,
  budget,
  getObjKeys,
  getObjKeysWithValues,
  sidebarResource,
  yupSchema
} from '../../constants/helpers';
import InputField from 'src/components/Helpers/InputField';

export default function ManageBudgetDialog({ open, onSuccess, onClose, budgetId, isClone }) {
  const { api } = budget;
  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState({
    fields: [],
    values: {}
  });
  const {
    state: { user, resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    getBudgetFields();
  }, []);

  const getBudgetFields = () => {
    axiosInstance()
      .get(`/field?resource=Budget`)
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (budgetId) {
          axiosInstance()
            .get(`${api}/${budgetId}`)
            .then(({ data: { data } }) => {
              data.year = new Date(`${data.year}-01-01`);
              let clonedData = { ...data };
              if (isClone) {
                let { name, _id, ...rest } = clonedData;
                clonedData = { ...rest };
                clonedData['name'] = GenerateResourceLineNumber(fieldsDataForCreate);
                let tempObjKeysWithValues = getObjKeysWithValues(clonedData, fieldsDataForCreate, true, user);
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: tempObjKeysWithValues
                });
              } else {
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
          let tempObjKeysWithValues = getObjKeys('', fieldsDataForCreate);
          tempObjKeysWithValues['name'] = GenerateResourceLineNumber(fieldsDataForCreate);
          setInitialData({
            fields: fieldsDataForCreate,
            values: tempObjKeysWithValues
          });
        }
      });
  };

  const onSubmit = (values) => {
    setLoading(true);
    values['year'] = values['year'].format('YYYY');
    if (budgetId && !isClone) {
      values._id = budgetId;
      axiosInstance()
        .put(api, values)
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
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(api, values)
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
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={open}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
      >
        {initialData?.fields?.length ? (
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={onSubmit}>
            {({ submitForm, values, errors, touched, setFieldValue }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    isClone
                      ? 'Clone'
                      : budgetId
                        ? `Editing ${initialData.values && initialData.values['name'] ? initialData.values['name'] : ''}`
                        : `Create ${resources?.budget?.titleSingular}`
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
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        if (name === 'entity') {
                          if (initialData?.fields?.some((e) => e.fieldName === 'salesRep')) {
                            setFieldValue('salesRep', '');
                          }
                        }
                      }}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                      resource={sidebarResource.budget}
                      referenceId={budgetId || null}
                    />
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
                    disabled={loading}
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
}

ManageBudgetDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  budgetId: PropTypes.string
};
