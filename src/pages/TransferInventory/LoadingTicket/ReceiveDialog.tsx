import React, { useContext, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import {
  convertDateInDateTime,
  deliveryTicket,
  DELIVERY_TICKET_STATUS,
  productInventory,
  CustomDialogTransition
} from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq, map } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import moment from 'moment';
import CustomDatePicker from 'src/components/CustomDatePicker';

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
      if (moment(fromLockDate).diff(moment(toLockDate), 'days') > 0) {
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
      data['receiveDate'] = values?.receiveDate;
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
      if (!moment(values['receiveDate']).isSameOrAfter(moment(lockDate))) {
        errors['receiveDate'] = `Date entered prior to the locked date`;
      }
    }
    if (moment(values['receiveDate']).isAfter(moment())) {
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
                    var newDate = convertDateInDateTime(value);
                    setFieldValue('receiveDate', newDate);
                  }}
                  error={touched['receiveDate'] && Boolean(errors['receiveDate'])}
                  helperText={touched['receiveDate'] && errors['receiveDate']}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button color="primary" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <CustomButton
                id={`receive-dialog-receive-button`}
                loading={loading}
                disabled={loading}
                variant="contained"
                color="primary"
                type="submit"
                onClick={submitForm}
              >
                {'Receive'}
              </CustomButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ReceiveDialog;
