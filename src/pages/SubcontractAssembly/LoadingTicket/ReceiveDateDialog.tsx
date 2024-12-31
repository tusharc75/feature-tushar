import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { convertDateInDateTime, CustomDialogTransition, productInventory } from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ReceiveDateDialog = ({ handleClose, handleSucess, loading, refrenceData }) => {
  const [lockDate, setLockDate] = useState(null);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    const {
      data: { data }
    } = await axiosInstance().get(`${productInventory.api}/setting?warehouse=${refrenceData?.warehouse?.optionValue}`);
    setLockDate(data?.lockDate);
  };

  const handleSubmit = (values) => {
    handleSucess(values?.receiveDate);
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
            <CustomDialogHeader title={`Deliver ${resources?.subcontractAssembly?.titleSingular}`} showRequiredLabel={true} onClose={handleClose} />
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
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={loading} disabled={loading}  buttonType="theme" onClick={submitForm}>
                {'Deliver'}
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog >
  );
};

export default ReceiveDateDialog;
