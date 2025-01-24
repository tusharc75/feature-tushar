import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, GenerateResourceLineNumber } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ManageIrtTicket = ({ onClose, onSuccess, isClone = false, id = null, referenceData = null }) => {
  const {
    state: { user, resources }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);
  const history = useHistory();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get('/field?resource=IRT Ticket');
      data = response?.data?.data;
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`${routes?.irtTicket?.path}/${id}`)
          .then(({ data: { data } }) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { irtTicketNumber, ...rest } = data;
              rest.irtTicketNumber = GenerateResourceLineNumber(fieldsDataForCreate);
              setCloneHeading(irtTicketNumber);
              tempData = rest;
            }
            setInitialData({
              fields: fields,
              values: isClone ? { ...getObjKeysWithValues(tempData, fields, true, user) } : getObjKeysWithValues(tempData, fields)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        tempInitialData['irtTicketNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);

        if (referenceData) {
          tempInitialData['irtTicketNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
          tempInitialData['purchaseOrder'] = referenceData?.purchaseOrder;
          tempInitialData['warehouse'] = referenceData?.warehouse;
          tempInitialData['qty'] = referenceData?.qty;
          tempInitialData['amount'] = referenceData?.amount;
          tempInitialData['product'] = referenceData?.product;
          tempInitialData['collaborator'] = referenceData?.collaborator;
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes?.irtTicket?.path}`, values)
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
        .post(`${routes?.irtTicket?.path}`, values)
        .then(({ data: { data } }) => {
          if (referenceData) {
            axiosInstance()
              .post(`${routes?.irtTicket?.path}/approver/${data._id}`, {
                approver: referenceData?.approver?.map((e) => {
                  return { user: e };
                })
              })
              .then(({ data }) => {
                setLoading(false);
                onSuccess(data);
                setSubmitting(true);
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data.message
                });
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          } else {
            history.push(`${routes?.irtTicketDetail?.path}/${data._id}`);
            setLoading(false);
            onSuccess(data);
            setSubmitting(true);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
          }
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig(error);
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
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validate={validate}
          innerRef={ref}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${
                  id
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${initialData.values?.irtTicketNumber ? `(${initialData.values?.irtTicketNumber})` : ''}`
                    : `Create ${resources?.irtTicket?.titleSingular}`
                }`}
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
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  buttonType='transparent'
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  onClick={submitForm}
                  disabled={loading || submitting}
                  isLoading={submitting}
                  buttonType='theme'
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
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

export default ManageIrtTicket;
