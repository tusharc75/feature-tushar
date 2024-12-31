import { useState } from 'react';
import { Dialog, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import ConfirmCancelDialog from '../../../ConfirmCancelDialog';
import { object, string } from 'yup';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from '../../../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';

const FieldSchema = object().shape({
  fieldName: string().required('Please enter field Name')
});

const FieldNameDialog = ({ fieldData, handleSave, handleClose }) => {
  const [initialValues, setInitialValues] = useState({ fieldName: fieldData?.fieldName });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleSubmit = (values) => {
    handleSave({ ...values, _id: fieldData?._id });
  };

  const validate = (values) => {
    let errors = {};
    if (!values.fieldName) {
      errors['fieldName'] = 'Field Name is required';
    }
    return errors;
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      aria-labelledby="customized-dialog-title"
      className="properties_dialog_height"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSubmit} validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`Change Field Name`}
              onClose={() => {
                if (isEqual(values, initialValues)) {
                  handleClose();
                } else {
                  setShowConfirmDialog(true);
                }
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <TextField
                  variant="outlined"
                  type="text"
                  label="Field Name"
                  required={true}
                  name="fieldName"
                  fullWidth
                  margin="dense"
                  size="small"
                  value={values['fieldName']}
                  error={touched['fieldName'] && Boolean(errors['fieldName'])}
                  helperText={touched['fieldName'] && errors['fieldName']}
                  onChange={(e) => {
                    setFieldValue('fieldName', e.target.value.trimStart());
                  }}
                />
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton
                buttonType="transparent"
                onClick={() => {
                  if (isEqual(values, initialValues)) {
                    handleClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
              >
                Cancel
              </ThemeButton>
              <ThemeButton buttonType="theme" onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
            {showConfirmDialog ? (
              <ConfirmCancelDialog
                close={() => setShowConfirmDialog(false)}
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false);
                  submitForm();
                }}
                onClose={() => {
                  setShowConfirmDialog(false);
                  handleClose();
                }}
              />
            ) : null}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default FieldNameDialog;
