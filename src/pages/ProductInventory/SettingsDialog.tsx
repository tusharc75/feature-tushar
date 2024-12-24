import { Box, Button, Dialog, Grid, TextField } from '@mui/material';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Form, Formik } from 'formik';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, dateFormat, productInventory } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import InfoIcon from '@material-ui/icons/Info';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

function SettingsDialog({ onClose, warehouse }) {
  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState({ lockDate: '' });
  const [settingLoading, setSettingLoading] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = () => {
    setSettingLoading(true);
    axiosInstance()
      .get(`${productInventory.api}/setting?warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        if (data?.lockDate) {
          setInitialData({
            lockDate: data?.lockDate
          });
        }
        setSettingLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSettingLoading(false);
      });
  };

  const handleSubmit = (values) => {
    axiosInstance()
      .post(`${productInventory.api}/setting`, { lockDate: moment(values.lockDate).format('MM/DD/YYYY'), warehouse: warehouse })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const validate = (values) => {
    const errors: any = {};
    if (!values['lockDate']) {
      errors['lockDate'] = 'Lock Date is Required';
    }
    if (moment(values['lockDate']).isAfter(moment())) {
      errors['lockDate'] = `Please select valid date`;
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader title="Inventory Setting" onClose={onClose} />
      {!settingLoading ? (
        <Formik initialValues={initialData} validateOnMount={false} validate={validate} onSubmit={handleSubmit}>
          {({ submitForm, values, setFieldValue, errors, touched }) => (
            <>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={6}>
                      <Fragment>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                          <KeyboardDatePicker
                            autoOk
                            variant="inline"
                            inputVariant="outlined"
                            label="Lock Date"
                            fullWidth
                            format={dateFormat}
                            value={values['lockDate']}
                            placeholder="Lock Date"
                            margin="dense"
                            required
                            maxDate={new Date()}
                            onChange={(value) => {
                              setFieldValue('lockDate', value);
                            }}
                            InputLabelProps={{
                              shrink: true
                            }}
                            error={errors['lockDate'] ? true : false}
                            helperText={errors['lockDate']}
                          />
                        </MuiPickersUtilsProvider>
                      </Fragment>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                      <Box mt={2}>
                        <HtmlTooltip title="The transactions recorded prior to this date cannot be modified or deleted.">
                          <InfoIcon />
                        </HtmlTooltip>
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button color="primary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" size="small" onClick={submitForm}>
                  Save
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : (
        <div>
          <CommonSkeleton lenArray={[...Array(4).keys()]} />
        </div>
      )}
    </Dialog>
  );
}

export default SettingsDialog;
