import { useState, Fragment } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import CustomButton from '../../components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from './../../constants/helpers';
import FormTypes from '../../components/Helpers/FormTypes';

const AddDisplayTypeDialog = (props) => {
  const { displayType, handleClose, handleAddDisplayType, fieldData } = props;
  const [initialData] = useState({ currency: '', unit: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values) => {
    setLoading(true);
    if (displayType === 'currency') {
      handleAddDisplayType(displayType, fieldData, values.currency);
    } else if (displayType === 'converter') {
      handleAddDisplayType(displayType, fieldData, values.unit);
    } else if (displayType === 'currencyConverter') {
      let displayValue: any = {};
      if (values.currency || values.currency !== '') {
        displayValue['currency'] = values.currency;
      }
      if (values.unit || values.unit !== '') {
        displayValue['unit'] = values.unit;
      }
      if (!displayValue.currency && !displayValue.unit) {
        alert('please select one currency / unit');
        setLoading(false);
        return;
      }
      handleAddDisplayType(displayType, fieldData, displayValue);
    }
  };

  function validate(values) {
    const errors = {};
    if (displayType === 'currency') {
      if (!values.currency || values.currency === '') {
        errors['currency'] = 'please select currency';
      } else {
        if (fieldData.displayCurrency.includes(values.currency)) {
          errors['currency'] = 'currency already added';
        }
      }
    } else if (displayType === 'converter') {
      if (!values.unit || values.unit === '') {
        errors['unit'] = 'please select unit';
      } else {
        if (fieldData.displayUnits.includes(values.unit)) {
          errors['unit'] = 'unit already added';
        }
      }
    } else if (displayType === 'currencyConverter') {
      if (values.currency || values.currency !== '') {
        if (fieldData.displayCurrency.includes(values.currency)) {
          errors['currency'] = 'currency already added';
        }
      }
      if (values.unit || values.unit !== '') {
        if (fieldData.displayUnits.includes(values.unit)) {
          errors['unit'] = 'unit already added';
        }
      }
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="xs"
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <Formik enableReinitialize={true} initialValues={initialData} validateOnMount onSubmit={handleSubmit} validate={validate}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Fragment>
            <CustomDialogHeader title={displayType === 'currency' ? 'Add Currency' : 'Add Converter Unit'} onClose={handleClose}></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box p={1}>
                  {(displayType === 'currency' || displayType === 'currencyConverter') && (
                    <Box mt={2}>
                      <FormTypes
                        values={values}
                        errors={errors}
                        touched={touched}
                        label={'Currency'}
                        name="currency"
                        type="currency"
                        setFieldValue={setFieldValue}
                        required={true}
                        fullWidth
                        isTooltip={false}
                        tooltipMessage={''}
                        size="small"
                      />
                    </Box>
                  )}
                  {(displayType === 'converter' || displayType === 'currencyConverter') && (
                    <Box mt={2}>
                      <FormTypes
                        values={values}
                        errors={errors}
                        touched={touched}
                        label={'Unit'}
                        name="unit"
                        type="dropDown"
                        options={
                          fieldData.units &&
                          fieldData.units
                            .filter((_u) => !fieldData.displayUnits.includes(_u))
                            .map((_unit) => ({ optionLabel: _unit, optionValue: _unit }))
                        }
                        setFieldValue={setFieldValue}
                        required={true}
                        fullWidth
                        isTooltip={false}
                        tooltipMessage={''}
                        size="small"
                      />
                    </Box>
                  )}
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" onClick={handleClose}>
                Cancel
              </Button>
              <CustomButton variant="contained" color="primary" type="submit" loading={loading} disabled={loading} size="small" onClick={submitForm}>
                {' '}
                Add
              </CustomButton>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddDisplayTypeDialog;
