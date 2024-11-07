import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEmpty, isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, FIELD_TICKET_LOG_TYPE, FIELD_TICKET_STATUS, fieldTicket, getObjKeys, getObjKeysWithValues, restoreObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';
import InputField from 'src/components/Helpers/InputField';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { findAll, findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { useData } from 'src/StateProvider/Provider';

const ManageSubmit = ({ onClose, onSuccess, fieldTicketData, fields }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const walkmeInstance = useGetWalkmeInstance();
  const { isOffline } = useContext(CustomOfflineContext);

  const { state: { user: { user } } } = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      fields = fields?.filter((f) => f?.isRead);
      if (isOffline) {
        fields = fields?.filter((f) => f?.type !== "multiFileUpload" && f?.type !== "fileUpload");
      }
      let tempInitialData = getObjKeys('', fields);
      if (fields?.find((d) => d.fieldName === 'customerAccount') && fieldTicketData?.customerAccount?.optionValue) {
        tempInitialData['customerAccount'] = fieldTicketData.customerAccount.optionValue;
      }
      let logData = [];
      if (!isOffline) {
        const { data } = await axiosInstance().get(`${fieldTicket.api}/view-logs/${fieldTicketData?._id}`);
        logData = data?.data;
      } else {
        const data = await findAll(objectStore.fieldTicketLogs);
        logData = data?.filter((d) => d?.fieldTicketId === fieldTicketData?._id)?.sort((a, b) => new Date(b.date ?? 0)?.getTime() - new Date(a.date ?? 0)?.getTime());
      }
      for (const d of logData) {
        if (d?.type === FIELD_TICKET_LOG_TYPE.readyToInvoice) {
          tempInitialData = { ...tempInitialData, ...d };
          break;
        }
      };
      setInitialData({
        fields: fields,
        values: getObjKeysWithValues(tempInitialData, fields)
      });
      if (walkmeInstance) {
        walkmeInstance.instance.insertAtCurrentIndex(generateStepsFormfieldData(fields || []));
        walkmeInstance.handleNext();
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    if (isOffline) {
      const result = await findOne(objectStore.offlineDataSync, fieldTicketData?._id);
      let updatedData;
      if (result && result?.type === 'fieldTicket') {
        updatedData = { ...result?.data, logs: [values] };
        await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { type: 'fieldTicket', data: updatedData });
      } else {
        updatedData = { _id: fieldTicketData?._id, offlineSyncStatus: 'update', logs: [values] };
        await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_submit`, { type: 'fieldTicket', data: updatedData });
      }
      const fieldTicket = await findOne(objectStore.fieldTicket, fieldTicketData?._id);
      if (fieldTicket) {
        await insertUpdate(objectStore.fieldTicket, fieldTicketData?._id, { ...fieldTicket, status: FIELD_TICKET_STATUS.readyToInvoice });
      }
      const data: any = restoreObjKeysWithValues(values, initialData.fields);
      data._id = new Date().getTime().toString();
      data.type = FIELD_TICKET_LOG_TYPE.readyToInvoice;
      data.fieldTicketId = fieldTicketData?._id;
      data.user = {
        optionLabel: user.firstName + ' ' + user.lastName,
        optionValue: user._id
      };
      data.date = new Date();
      await insertUpdate(objectStore.fieldTicketLogs, data._id, data);
      onSuccess();
    } else {
      await axiosInstance()
        .put(`${fieldTicket.api}/${fieldTicketData._id}/submit`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          setSubmitting(false);
          onSuccess();
        })
        .catch((err) => {
          setSubmitting(false);
          toastConfig.setToastConfig(err);
        });
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik
          enableReinitialize={true}
          initialValues={initialData.values}
          onSubmit={handleSubmit}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
        >
          {({ values, errors, setFieldValue, touched, setFieldTouched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`Submit Field Ticket`}
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
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  id={'dialog-save-button'}
                  disabled={submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={() => {
                    if (isEmpty(errors)) {
                      submitForm();
                    } else {
                      setFieldTouched('files', true);
                    }
                  }}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
                  close={() => setShowConfirmDialog(false)}
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

export default ManageSubmit;
