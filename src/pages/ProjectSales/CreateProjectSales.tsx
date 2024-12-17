import { Fragment, useContext, useEffect, useState } from 'react';
import { Dialog, Button, Box } from '@material-ui/core';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { useHistory } from 'react-router-dom';
import {
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  GenerateResourceLineNumber,
  sidebarResource,
  CustomDialogTransition
} from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import { isEqual } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
import InputField from 'src/components/Helpers/InputField';
interface InitialData {
  fields: any[];
  values: object;
}

const CreateProjectSales = ({
  isClone = false,
  open,
  close,
  fetchData,
  type = null,
  projectSalesId = null,
  fields = null,
  onSuccess = null,
  accountId = null,
  resource = null
}) => {
  const {
    state: {
      user: { user },
      resources
    }
  } = useData();
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {}
  });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const history = useHistory();

  const [productSalesName, setProductSalesName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    axiosInstance()
      .get('/field?resource=Project Sales')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (projectSalesId) {
          axiosInstance()
            .get(`${routes.projectSales.path}/${projectSalesId}`)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { projectName, ...rest } = data;
                let tempData = { ...rest };
                tempData['projectName'] = GenerateResourceLineNumber(fieldsDataForCreate);
                let tempObjKeysWithValues = getObjKeysWithValues(tempData, fieldsDataForUpdate, true, user);
                if (fieldsDataForUpdate?.some((e) => e.fieldName === 'projectManager')) {
                  tempObjKeysWithValues['projectManager'] = user._id;
                }
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: tempObjKeysWithValues
                });
              } else {
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
              setProductSalesName(data.projectName);
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let tempObjKeysWithValues = getObjKeys('', fieldsDataForCreate);
          tempObjKeysWithValues['projectName'] = GenerateResourceLineNumber(fieldsDataForCreate);
          if (fieldsDataForCreate.some((e) => e.fieldName === 'currency')) {
            tempObjKeysWithValues['currency'] = user?.brandCurrency;
          }
          if (fieldsDataForCreate?.some((e) => e.fieldName === 'projectManager')) {
            tempObjKeysWithValues['projectManager'] = user._id;
          }
          setInitialData({
            fields: fieldsDataForCreate,
            values: tempObjKeysWithValues
          });
        }
      })
      .catch((err) => {});
  };

  const handleSubmit = (values) => {
    if (projectSalesId && !isClone) {
      setSubmitting(true);
      axiosInstance()
        .put(`${routes.projectSales.path}`, { ...values, _id: projectSalesId })
        .then(({ data }) => {
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          close();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      setSubmitting(true);
      var tempStaticData = {};
      if (type) {
        type.map((d: any) => {
          tempStaticData[d.type] = [d.id];
        });
      }
      tempStaticData['user'] = [values?.projectManager, user._id];
      values.staticData = tempStaticData;
      axiosInstance()
        .post(`${routes.projectSales.path}`, values)
        .then(({ data }) => {
          if (accountId) {
            axiosInstance().put(`${routes.projectSales.path}/add-customer-account`, {
              _id: data?.data._id,
              customerAccount: [accountId]
            });
          }
          if (onSuccess) {
            onSuccess(data);
          }
          const newId = data.data?._id;
          setSubmitting(false);
          fetchData();
          if (type) {
            close();
          } else {
            history.push(`${routes.projectSalesDetail.path}/${newId}`, {
              managerId: data.data?.projectManager
            });
            close();
          }
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
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
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validateOnMount
          validate={validate}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) {
                    close();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                title={`${isClone ? `Clone - ${productSalesName}` : projectSalesId ? `Update ${productSalesName}` : `Create ${resources?.projectSales?.titleSingular}`}`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                      if (name === 'entity') {
                        if (initialData?.fields?.some((e) => e.fieldName === 'projectManager')) {
                          setFieldValue('projectManager', '');
                        }
                      }
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.projectSales}
                    referenceId={projectSalesId || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) {
                      close();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={isSubmitting}
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
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
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    close();
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

export default CreateProjectSales;
