import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  bulkAssetCreation,
  setFieldsInAscendingOrder,
  GenerateResourceLineNumber,
  sidebarResource,
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

const ManageBulkAssetCreation = ({ isClone = false, bulkAssetCreationId = null, onClose, onSuccess, referenceId = null, refrenceData = null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bulkAssetCreationData, setBulkAssetCreationData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('head');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Bulk Asset Creation')
      .then(({ data: { data } }) => {
        data = data?.filter((obj) => !['rentalJob'].includes(obj?.fieldData?.fieldName));
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (bulkAssetCreationId) {
          axiosInstance()
            .get(`${bulkAssetCreation.api}/` + bulkAssetCreationId)
            .then(({ data: { data } }) => {
              setBulkAssetCreationData(data);
              if (isClone) {
                const { _id, createdBy, updatedBy, serialNumber, baNumber, ...rest } = data;
                rest['baNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
                rest['status'] = 'New';
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: {...getObjKeysWithValues(rest, fieldsDataForCreate, true, user)}
                });
                setCloneHeading(baNumber);
                setLoading(false);
              } else {
                if (data?.canEdit === false) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['warehouse', 'supplierAccount']?.includes(e?.fieldName)) {
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
          if (fieldsDataForCreate.some((e) => e.fieldName === 'currency')) {
            createValues['currency'] = user.user?.brandCurrency;
          }
          createValues['baNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
          if (refrenceData) {
            createValues['rentalJob'] = referenceId;
            createValues['warehouse'] = refrenceData?.warehouse;
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellName')) {
              createValues['wellName'] = refrenceData?.wellName;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellNumber') && refrenceData?.wellNumber) {
              createValues['wellNumber'] = refrenceData?.wellNumber;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'afeNumber')) {
              createValues['afeNumber'] = refrenceData?.afeNumber;
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
  }, [bulkAssetCreationId]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (bulkAssetCreationId && isClone === false) {
      values._id = bulkAssetCreationId;
      axiosInstance()
        .put(`${bulkAssetCreation.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      if (refrenceData && refrenceData?.products) {
        values.products = refrenceData?.products;
      }
      axiosInstance()
        .post(`${bulkAssetCreation.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          if (refrenceData && refrenceData?.products) {
            onSuccess();
          } else {
            history.push(`${bulkAssetCreation.api}/detail/${data._id}`);
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
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  bulkAssetCreationId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update  ${bulkAssetCreationData?.baNumber || ''}`
                    : 'Create ' + resources?.bulkAssetCreation?.titleSingular
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
                    resource={sidebarResource.quotation}
                    referenceId={bulkAssetCreationId || null}
                    collaborateTools = {true}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
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
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    handleSubmit();
                  }}
                  disabled={loading}
                >
                  {' '}
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
                    handleSubmit();
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

export default ManageBulkAssetCreation;
