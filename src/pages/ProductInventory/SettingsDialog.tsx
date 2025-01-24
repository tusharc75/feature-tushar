import { Box, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition, dateFormatToSend, productInventory } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import InfoIcon from '@mui/icons-material/Info';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

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
      .post(`${productInventory.api}/setting`, { lockDate: dateFormatToSend(values.lockDate), warehouse: warehouse })
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
    if (dayjs(values['lockDate']).isAfter(dayjs())) {
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
                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
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
                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
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
                <ThemeButton buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton buttonType="theme" onClick={submitForm}>
                  Save
                </ThemeButton>
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
