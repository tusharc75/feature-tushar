import React, { useContext, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  convertDateInDateTime,
  dateFormatForInputControl,
  deliveryTicket,
  DELIVERY_TICKET_STATUS,
  CustomDialogTransition,
  displayDate
} from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq, map } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

const ReceiveDialog = ({ handleClose, selectedRecords, handleSuccess, transferAssetId, type }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState(null);

  useEffect(() => {
    findValidationDate();
  }, []);

  const findValidationDate = async () => {
    try {
      const assets = selectedRecords?.map((e) => e?._id);
      let response;
      if (type === 'changeReceiveDate') {
        response = await axiosInstance().put(`${routes.serializedAsset.path}/asset-last-history-date-before-adding`, {
          assets,
          referenceId: transferAssetId
        });
      } else {
        response = await axiosInstance().put(`/rental-management/assets-last-date`, { assets: assets, last: 1 });
      }
      var lastDate: any = new Date();
      let date = response?.data?.data?.date;
      if (date) {
        lastDate = new Date(date);
        lastDate.setHours(0, 0, 0);
      }
      setMinDate(lastDate);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (type === 'changeReceiveDate') {
      let data = {};
      data['date'] = values?.receiveDate;
      data['assets'] = selectedRecords?.map((e: any) => {
        return {
          asset: e?._id,
          referenceId: e?.loadingTicketId
        };
      });
      axiosInstance()
        .put(`transfer-asset/change-receive-date`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Receive Date Changed Successfully`
          });
          handleSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
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
              message: `Assets Received Successfully`
            });
            handleSuccess();
            setLoading(false);
          })
          .catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const validate = (values) => {
    const errors: any = {};
    if (!values.receiveDate) {
      errors.receiveDate = 'Receive Date is Required';
    } else if (minDate && values.receiveDate < minDate) {
      errors.receiveDate = `Receive date can't be less than ${displayDate(minDate)}`;
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
      <Formik initialValues={{ receiveDate: new Date() }} onSubmit={handleSubmit} validateOnMount validate={validate} enableReinitialize={true}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate>
            <CustomDialogHeader
              title={type === 'changeReceiveDate' ? 'Change Receive Date' : 'Receive Assets'}
              showRequiredLabel={true}
              onClose={handleClose}
            />
            <CustomDialogContent>
              <Box p={1}>
                <DatePicker
                  {...(minDate ? { minDate } : {})}
                  fullWidth
                  size="small"
                  margin="dense"
                  autoOk
                  required
                  variant="inline"
                  inputVariant="outlined"
                  value={values.receiveDate}
                  name="receiveDate"
                  placeholder={'Receive Date'}
                  label="Receive Date"
                  format={dateFormatForInputControl}
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
              <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit" onClick={submitForm}>
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
