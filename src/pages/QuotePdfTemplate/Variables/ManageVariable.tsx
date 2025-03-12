import { Box, Dialog, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import { Formula } from 'src/components/FormBuilder/AddField/formula';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Formik } from 'formik';
import { checkFormula } from 'src/constants/formulaUtility';
import { isEmpty } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';


export default function Manage({ data, fields, handleClose, id }) {

  const [isUpdating, setIsUpdating] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  function validate(values) {
    const errors = {};
    if (!values?.fieldLabel || values?.fieldLabel?.trim() === '') {
      errors['fieldLabel'] = 'Please enter field label';
    }
    if (!values?.inputFields || values?.inputFields?.length === 0) {
      errors['inputFields'] = 'Please select input parameters';
    }
    let inputValues = {};
    values?.inputFields &&
      values?.inputFields?.forEach((_input) => {
        inputValues[_input] = 1;
      });
    if (!checkFormula(values?.formula, inputValues)) {
      errors['formula'] = 'Please enter valid formula';
    }
    return errors;
  }

  const handleSave = (values) => {
    setIsUpdating(true);
    if (values?._id) {
      delete values.fieldName;
      axiosInstance().put(`/quote-pdf-template/${id}/variables`, { ...values }).then(({ data: { message } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
        setIsUpdating(false);
        handleClose();
      })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance().post(`/quote-pdf-template/${id}/variables`, { ...values }).then(({ data: { message } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
        setIsUpdating(false);
        handleClose();
      })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  }

  return (
    <Dialog
      open={true}
      TransitionComponent={CustomDialogTransition}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      maxWidth="md"
      fullWidth
    >
      <Formik
        enableReinitialize={true}
        initialValues={data ?? {}}
        onSubmit={handleSave}
        validate={validate}
      >
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader title={`${!isEmpty(data) ? `Update ${data?.fieldLabel}` : 'Add'} Variable`} showRequiredLabel={false} onClose={handleClose} />
            <CustomDialogContent>
              <Box>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 10, md: 10, sm: 10 }}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Field Label"
                      name="fieldLabel"
                      fullWidth
                      margin="dense"
                      size="small"
                      value={values['fieldLabel']}
                      error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
                      helperText={touched['fieldLabel'] && errors['fieldLabel']}
                      onChange={(e) => {
                        setFieldValue('fieldLabel', e.target.value.trimStart());
                      }}
                    />
                  </Grid>
                </Grid>
                <Formula
                  fields={fields?.map((_field) => _field.fieldData)}
                  values={values}
                  setFieldValue={(name, value) => {
                    setFieldValue(name, value);
                  }}
                  _id={null}
                  touched={touched}
                  errors={errors}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton
                buttonType='transparent'
                onClick={handleClose}
                disabled={isUpdating}
              >
                Cancel
              </ThemeButton>
              <ThemeButton
                buttonType='theme'
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => {
                  submitForm();
                }}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
}