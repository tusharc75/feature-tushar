import { useState, Fragment, useRef } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import { object, string } from 'yup';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { Autocomplete } from '@material-ui/lab';

export const AddAllColumnDialog = (props) => {
  const { fieldLabelOptions, handleClose, handleAddField, fields, section } = props;

  const [initialValues] = useState({
    sectionName: '',
    columns: fieldLabelOptions
  });

  const ref = useRef(null);

  const handleSave = (values) => {
    let data: any = [];
    values?.columns?.forEach((column) => {
      const obj: any = {
        _id: parseInt((Math.random() * 100000).toString()),
        sectionName: values?.sectionName || '',
        type: column?.type,
        fieldLabel: column?.fieldLabel,
        fieldName: fieldLabelToFieldName(column?.fieldLabel),
        required: false,
        isTooltip: false,
        tooltipMessage: '',
        option: [],
        isvlookupReverse: false,
        units: [],
        displayUnits: [],
        isConverter: false,
        isFormula: false,
        isMulitFormula: false,
        leval: 'price-builder-custom'
      };
      if (column?.type === 'decimal') {
        obj.decimalPlaces = column?.decimalPlaces || 2;
      }
      if (fields?.filter((_f) => _f.sectionName === obj?.sectionName).length) {
        if (fields?.filter((_f) => _f.sectionName === obj?.sectionName)[0].leval !== 'price-template') {
          obj.leval = 'product-builder-custom';
        }
      }
      data.push({ ...obj });
    });

    if (fields.some((f) => data?.map((d) => d?.fieldName)?.includes(f.fieldName))) {
      alert('Some field name alredy exist');
      return;
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
    if (values?.columns?.length <= 0) {
      errors['columns'] = 'Please select atleast one column';
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
      <Formik innerRef={ref} initialValues={initialValues} onSubmit={handleSave} validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Fragment>
            <CustomDialogHeader title={'Add Field'} onClose={handleClose}></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate onKeyPress={onKeyPress}>
                <Autocomplete
                  options={section || []}
                  fullWidth
                  size="small"
                  getOptionSelected={(option, val) => option === val}
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
                  multiple
                  getOptionLabel={(option: any) => option?.fieldLabel ?? ''}
                  value={values?.columns}
                  onChange={(_, newVal) => {
                    setFieldValue('columns', newVal);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required={true}
                      error={touched['columns'] && Boolean(errors['columns'])}
                      helperText={touched['columns'] && errors['columns']}
                      label="Columns"
                      margin="dense"
                      name="columns"
                      variant="outlined"
                    />
                  )}
                />
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
