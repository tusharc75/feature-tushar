import { Button, Dialog, Grid, TextField } from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Form, Formik } from 'formik';
import React, { Fragment, useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import { dateFormat, productInventory } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

function SettingsDialog({ onClose }) {
  const [initialData, setInitialData] = useState({ lockDate: '' });
  const [settingLoading, setSettingLoading] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = () => {
    setSettingLoading(true);
    axiosInstance()
      .get(`${productInventory.api}/setting`)
      .then(({ data: { data } }) => {
        console.log(data);
        setInitialData({
          lockDate: data?.lockDate
        });
        setSettingLoading(false);
      })
      .catch((err) => {
        setSettingLoading(false);
        console.log(err);
      });
  };

  const validate = (values) => {
    const errors: any = {};
    if (!values['lockDate']) {
      errors['lockDate'] = 'Lock Date is Required';
    }
    return errors;
  };

  const handleSubmit = (values) => {
    axiosInstance()
      .post(`${productInventory.api}/setting`, values)
      .then((res) => {
        onClose();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Dialog maxWidth="md" fullWidth open={true} onClose={onClose}>
      <CustomDialogHeader title="Settings" onClose={onClose} />
      {!settingLoading ? (
        <Formik
          initialValues={initialData}
          // validationSchema={yupSchema(quotationInitialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ submitForm, values, setFieldValue, errors }) => (
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
                            margin="dense"
                            maxDate={new Date()}
                            onChange={(event) => {
                              setFieldValue('lockDate', moment(event).format('YYYY-MM-DD'));
                            }}
                            error={!!errors['lockDate']}
                            helperText={errors['lockDate']}
                          />
                        </MuiPickersUtilsProvider>
                      </Fragment>
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button variant="outlined" color="primary" onClick={onClose}>
                  Close
                </Button>
                <Button variant="contained" color="primary" onClick={submitForm}>
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
