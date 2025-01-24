import React, { useContext, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import {
  deliveryTicket,
  DELIVERY_TICKET_STATUS,
  productInventory,
  CustomDialogTransition,
  dateFormatToSend
} from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq, map } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

const ReceiveDialog = ({ handleClose, selectedRecords, handleSucess, transferInventoryData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [lockDate, setLockDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    var fromLockDate = null;
    var toLockDate = null;
    if (transferInventoryData?.transferFromPlant?.optionValue) {
      const {
        data: { data: transferFromPlant }
      } = await axiosInstance().get(`${productInventory.api}/setting?warehouse=${transferInventoryData?.transferFromPlant?.optionValue}`);
      if (transferFromPlant?.lockDate) {
        fromLockDate = transferFromPlant?.lockDate;
      }
    }
    if (transferInventoryData?.transfertoPlant?.optionValue) {
      const {
        data: { data: transferToPlant }
      } = await axiosInstance().get(`${productInventory.api}/setting?warehouse=${transferInventoryData?.transfertoPlant?.optionValue}`);
      if (transferToPlant?.lockDate) {
        toLockDate = transferToPlant?.lockDate;
      }
    }
    if (fromLockDate && toLockDate) {
      if (dayjs(fromLockDate).diff(dayjs(toLockDate), 'day') > 0) {
        setLockDate(fromLockDate);
      } else {
        setLockDate(toLockDate);
      }
    } else if (fromLockDate) {
      setLockDate(fromLockDate);
    } else if (toLockDate) {
      setLockDate(toLockDate);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['receiveDate'] = dateFormatToSend(values?.receiveDate);
      data['signatures'] = [];
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Inventory Received Successfully`
          });
          handleSucess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const validate = (values) => {
    const errors = {};
    if (lockDate) {
      if (!dayjs(values['receiveDate']).isSameOrAfter(dayjs(lockDate))) {
        errors['receiveDate'] = `Date entered prior to the locked date`;
      }
    }
    if (dayjs(values['receiveDate']).isAfter(dayjs())) {
      errors['receiveDate'] = `Please select valid date`;
    }
    return errors;
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={true}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-labelledby="assign-roles-dialog"
    >
      <Formik initialValues={{ receiveDate: new Date() }} onSubmit={handleSubmit} validateOnMount validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogHeader title="Receive Inventory" showRequiredLabel={true} onClose={handleClose} />
            <CustomDialogContent>
              <Box p={1}>
                <CustomDatePicker
                  {...(lockDate ? { minDate: lockDate } : {})}
                  fullWidth
                  size="small"
                  margin="dense"
                  required
                  value={values.receiveDate}
                  name="receiveDate"
                  placeholder={'Receive Date'}
                  label="Receive Date"
                  maxDate={new Date()}
                  onChange={(value) => {
                    setFieldValue('receiveDate', value);
                  }}
                  error={touched['receiveDate'] && Boolean(errors['receiveDate'])}
                  helperText={touched['receiveDate'] && errors['receiveDate']}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton
                id={`receive-dialog-receive-button`}
                disabled={loading}
                isLoading={loading}
                buttonType="theme"
                onClick={submitForm}
              >
                {'Receive'}
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ReceiveDialog;
