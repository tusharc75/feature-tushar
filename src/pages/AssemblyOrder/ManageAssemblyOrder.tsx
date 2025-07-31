import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  ASSEMBLY_ORDER_STATUS,
  CustomDialogTransition,
  GenerateResourceLineNumber,
  getObjKeys,
  getObjKeysWithValues,
  sidebarResource,
  yupSchema
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import InputField from 'src/components/Helpers/InputField';
import { fetch_resource_fields } from 'src/components/ResourceFields';
import SelectionConfirmationDialog from 'src/components/Helpers/SelectionConfirmationDialog';

const ManageAssemblyOrder = ({
  isClone = false,
  assemblyOrderId = null,
  onClose,
  onSuccess,
  referenceData = null,
  isRedirectTodetailPage = true
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [assemblyOrderData, setAssemblyOrderData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmCloneDetailsDialog, setShowConfirmCloneDetailsDialog] = useState(false);


  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [assemblyOrderId]);

  const fetchFields = async () => {
    try {
      const { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(
        sidebarResource.assemblyOrder, ['quotation', 'rentalJob']);
      if (assemblyOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${routes.assemblyOrder.path}/${assemblyOrderId}`);
          data = response?.data?.data;
          setAssemblyOrderData(data);
          if (isClone) {
            const { assemblyOrderNumber, ...rest } = data;
            rest.status = ASSEMBLY_ORDER_STATUS.new;
            rest.assemblyOrderNumber = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(assemblyOrderNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
            setLoading(false);
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataAll)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['assemblyOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);

        if (referenceData) {
          Object.keys(referenceData)?.forEach((key) => {
            if (fieldsDataForCreate?.find((i) => i.fieldName === key)) {
              initialData[key] = referenceData[key];
            }
            const field = fieldsDataForCreate?.find((f) => f?.fieldName === key);
            if (field) {
              field.disableOnEdit = true;
              field.isUneditable = true;
            }
          });
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (assemblyOrderId && isClone === false) {
      values._id = assemblyOrderId;
      axiosInstance()
        .put(`${routes.assemblyOrder.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.assemblyOrder.path}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          if (isRedirectTodetailPage) {
            history.push(`${routes.assemblyOrderDetail.path}/${data?._id}`);
          }
          onSuccess(data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err?.length) {
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
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
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
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={(values) => {
            if (assemblyOrderId && isClone && !assemblyOrderData?.canDelete && !showConfirmCloneDetailsDialog) {
              setShowConfirmCloneDetailsDialog(true);
            }
            else {
              handleSubmit(values)
            }
          }}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={
                  !assemblyOrderId
                    ? `Create ${resources?.assemblyOrder?.titleSingular}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${assemblyOrderData?.assemblyOrderNumber || ''}`}`
                }
                onClose={() => {
                  if (isEqual(initialData.values, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
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
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.assemblyOrder}
                    referenceId={assemblyOrderId || null}
                    collaborateTools={true}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (isEqual(initialData.values, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
                  buttonType="theme"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
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
              {showConfirmCloneDetailsDialog && (
                <SelectionConfirmationDialog
                  open={showConfirmCloneDetailsDialog}
                  message={"Would you like to clone with all line items? Click 'Yes' to include header and line items, or 'No' to clone only the header."}
                  onOk={(type) => {
                    if (type === 'Yes') {
                      setFieldValue('assemblyOrderId', assemblyOrderId);
                    }
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmCloneDetailsDialog(false)
                  }}
                  selection1={'Yes'}
                  selection2={'No'}
                />)}
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
};

export default ManageAssemblyOrder;
