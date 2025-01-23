import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Dialog, Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ASSET_STATUS, CustomDialogTransition } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

const DateDialog = ({ title, type, status, onClose, handleSubmit, loading, assets = [] }) => {
  const [minDate, setMinDate] = useState(new Date());

  useEffect(() => {
    findValidationDate();
  }, [assets]);

  const findValidationDate = async () => {
    const last = type === 'changeStatus' ? 1 : 2;
    const {
      data: { data }
    } = await axiosInstance().put(`/rental-management/assets-last-date`, { assets, last });
    var lastDate: any = new Date();
    if (data?.date) {
      lastDate = new Date(data?.date);
    }
    lastDate.setHours(0, 0, 0);
    setMinDate(lastDate);
  };

  function validate(values) {
    const errors = {};
    if (!dayjs(values['date']).isSameOrAfter(dayjs(minDate))) {
      errors['date'] = `Please select valid date`;
    }
    return errors;
  }

  return (
    <Dialog
      open={true}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <Formik
        initialValues={{ date: new Date() }}
        validate={validate}
        onSubmit={(values) => {
          handleSubmit(values.date, values?.status);
        }}
      >
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Form>
            <CustomDialogHeader title={title} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  <CustomDatePicker
                    fullWidth
                    size="small"
                    margin="dense"
                    required
                    value={values.date}
                    name="date"
                    placeholder={`${type === 'changeStatus' ? status : ''} Date`}
                    label={`${type === 'changeStatus' ? status : ''} Date`}
                    minDate={minDate}
                    error={touched['date'] && Boolean(errors['date'])}
                    helperText={touched['date'] && errors['date']}
                    onChange={(value) => {
                      setFieldValue('date', value);
                    }}
                  />
                  {status === ASSET_STATUS.delivered && (
                    <Box pt={2}>
                      <Typography>Would you like to change status ?</Typography>
                      <Box pt={1}>
                        <FormControl component="fieldset">
                          <RadioGroup
                            row
                            aria-label="status"
                            name="status"
                            value={values['status']}
                            onChange={(e) => {
                              setFieldValue('status', e.target.value);
                            }}
                          >
                            <FormControlLabel
                              value={ASSET_STATUS.standByNotChargeable}
                              control={<Radio />}
                              label={ASSET_STATUS.standByNotChargeable}
                            />
                            <FormControlLabel value={ASSET_STATUS.standBy} control={<Radio />} label={ASSET_STATUS.standBy} />
                            <FormControlLabel value={ASSET_STATUS.inUse} control={<Radio />} label={ASSET_STATUS.inUse} />
                          </RadioGroup>
                        </FormControl>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton
                onClick={onClose}
                buttonType='transparent'
              >
                Close
              </ThemeButton>
              <ThemeButton
                onClick={submitForm}
                disabled={loading}
                buttonType='theme'
                isLoading={loading}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default DateDialog;
