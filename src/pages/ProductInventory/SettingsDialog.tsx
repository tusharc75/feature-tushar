import { Box, Button, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, productInventory } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import InfoIcon from '@mui/icons-material/Info';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomDatePicker from 'src/components/CustomDatePicker';

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
                    <Grid size={{xs:12, sm:12, md:6}}>
                      <Fragment>
                        <CustomDatePicker
                          label="Lock Date"
                          fullWidth
                          value={values['lockDate']}
                          placeholder="Lock Date"
                          margin="dense"
                          size="small"
                          required
                          maxDate={new Date()}
                          onChange={(value) => {
                            setFieldValue('lockDate', value);
                          }}
                          error={errors['lockDate'] ? true : false}
                          helperText={errors['lockDate']}
                        />
                      </Fragment>
                    </Grid>
                    <Grid size={{xs:12, sm:12, md:6}}>
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
