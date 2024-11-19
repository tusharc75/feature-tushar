import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  invoice,
  yupSchema,
  GenerateResourceLineNumber,
  sidebarResource
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

const ManageInvoiceDialog = ({ isClone, invoiceId, invoiceData = null, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [invoiceId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Invoice');
      fieldData = response?.data?.data;

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (invoiceId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${invoice.api}/` + invoiceId);
          data = response?.data?.data;

          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, invoiceNumber, updatedBy, ...rest } = data;
            rest.status = 'New';
            rest.invoiceNumber = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(invoiceNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
            setLoading(false);
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate), currency: user.user?.brandCurrency || '' };
        initialData['invoiceNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
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
    if (invoiceId && isClone === false) {
      values._id = invoiceId;
      axiosInstance()
        .put(`${invoice.api}`, values)
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
        .post(`${invoice.api}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes.invoiceDetail.path}/${data?._id}`);
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
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input?.scrollIntoView({
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
          <Formik
            initialValues={initialData.values}
            validationSchema={yupSchema(initialData.fields)}
            validateOnMount
            validate={validate}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    !invoiceId ? `Create ${routes.invoice.title}` : `${isClone ? `Clone - ${cloneHeading}` : `Update ${invoiceData?.invoiceNumber}`}`
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
                      resource={sidebarResource.invoice}
                      referenceId={invoiceId || null}
                      collaborateTools={true}
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
                      if (isEqual(initialData.values, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
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
};

export default ManageInvoiceDialog;
