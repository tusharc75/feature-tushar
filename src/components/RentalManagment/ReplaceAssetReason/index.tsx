import { useState, Fragment } from 'react';
import { Box, TextField } from '@mui/material';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from '../../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import { Formik } from 'formik';
import { object, string } from 'yup';

const schema = object().shape({
  reason: string().required('Please enter the reason for replacement').min(3, 'Too Short')
});

const ReplaceAssetReason = ({ handleClose, loading, handleSucess }) => {
  const [initialValues, setInitialValues] = useState({ reason: '' });

  return (
    <Dialog maxWidth="sm" fullWidth TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title="Do you want to replace?" showRequiredLabel={false} onClose={handleClose} />
      <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSucess}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Fragment>
            <CustomDialogContent>
              <Box className="my-2">
                <TextField
                  variant="outlined"
                  type="text"
                  label={`Reason For Replacement`}
                  required={true}
                  name="reason"
                  fullWidth
                  multiline
                  rows={4}
                  margin="dense"
                  size="small"
                  value={values['reason']}
                  error={touched['reason'] && Boolean(errors['reason'])}
                  helperText={touched['reason'] && errors['reason']}
                  onChange={(e) => setFieldValue('reason', e.target.value)}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={loading} buttonType="theme" disabled={loading} onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};

export default ReplaceAssetReason;
