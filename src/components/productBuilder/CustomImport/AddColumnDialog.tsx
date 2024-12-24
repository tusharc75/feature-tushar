import { useState, Fragment, useRef } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { object, string } from 'yup';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import Autocomplete from '@mui/material/Autocomplete';

const FieldSchema = object().shape({
  type: string().required('please select field type'),
  fieldLabel: string().required('please enter field label')
});

export const AddColumnDialog = (props) => {
  const { fieldLabelOptions, handleClose, handleAddField, fields, section } = props;

  const [initialValues] = useState({
    sectionName: '',
    type: '',
    fieldLabel: '',
    required: false,
    isTooltip: false,
    tooltipMessage: '',
    decimalPlaces: 2,
    option: [],
    isvlookupReverse: false,
    units: [],
    displayUnits: [],
    isConverter: false,
    isFormula: false,
    isMulitFormula: false
  });

  const ref = useRef(null);

  const handleSave = (values) => {
    let data: any = {};
    data._id = parseInt((Math.random() * 100000).toString());
    data.sectionName = values.sectionName;
    data.type = values.type;
    data.fieldLabel = values.fieldLabel;
    data.fieldName = fieldLabelToFieldName(values.fieldLabel);

    if (fields.filter((t) => t.fieldName === data.fieldName).length) {
      alert('Field name alredy exist');
      return;
    }

    data.required = values.required;
    data.isTooltip = values.isTooltip;
    data.tooltipMessage = values.tooltipMessage;
    data.isConverter = values.isConverter;
    data.isFormula = values.isFormula;
    data.isMulitFormula = values.isMulitFormula;

    if (values.type === 'decimal') {
      data.decimalPlaces = values?.decimalPlaces || 2;
    }

    handleAddField(data);
  };

  const onKeyPress = (event) => {
    if (event.which === 13) {
      event.preventDefault();
    }
  };

  function validate(values) {
    const errors = {};
    if (!values.sectionName) {
      errors['sectionName'] = 'Please select SectionName';
    }
    return errors;
  }

  return (
    <Dialog
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      disableEnforceFocus
      maxWidth={'md'}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <Formik innerRef={ref} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSave} validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Fragment>
            <CustomDialogHeader title={'Add Field'} onClose={handleClose}></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate onKeyPress={onKeyPress}>
                <Autocomplete
                  options={section || []}
                  fullWidth
                  size="small"
                  isOptionEqualToValue={(option, val) => option === val}
                  getOptionLabel={(option) => option ?? ''}
                  value={values?.sectionName}
                  onChange={(_, newVal) => {
                    setFieldValue('sectionName', newVal ? newVal : '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required={true}
                      error={touched['sectionName'] && Boolean(errors['sectionName'])}
                      helperText={touched['sectionName'] && errors['sectionName']}
                      label="Section Name"
                      margin="dense"
                      name="sectionName"
                      variant="outlined"
                    />
                  )}
                />
                <Autocomplete
                  options={fieldLabelOptions || []}
                  fullWidth
                  size="small"
                  isOptionEqualToValue={(option, val) => option === val}
                  getOptionLabel={(option) => option?.fieldLabel ?? ''}
                  value={
                    fieldLabelOptions?.filter((f) => f?.fieldLabel === values?.fieldLabel)?.length > 0
                      ? fieldLabelOptions?.filter((f) => f?.fieldLabel === values?.fieldLabel)[0]
                      : ''
                  }
                  onChange={(_, newVal) => {
                    setFieldValue('fieldLabel', newVal ? newVal?.fieldLabel : '');
                    setFieldValue('type', newVal ? newVal?.type : '');
                    if (newVal?.type === 'decimal') {
                      setFieldValue('decimalPlaces', newVal ? newVal?.decimalPlaces : 2);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required={true}
                      error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
                      helperText={touched['fieldLabel'] && errors['fieldLabel']}
                      label="Field Label"
                      margin="dense"
                      name="fieldLabel"
                      variant="outlined"
                    />
                  )}
                />
                <FormControl fullWidth margin="dense" variant="outlined">
                  <InputLabel id="demo-simple-select-outlined-label">Field Type</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    value={values['type']}
                    onChange={(e) => setFieldValue('type', e.target.value)}
                    label="Type"
                    name="type"
                    margin="dense"
                    error={touched['type'] && Boolean(errors['type'])}
                    disabled={true}
                  >
                    <MenuItem value={'singleLine'}>Single Line</MenuItem>
                    <MenuItem value={'decimal'}>Decimal</MenuItem>
                  </Select>
                </FormControl>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" onClick={submitForm} variant="contained">
                Add
              </Button>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};
