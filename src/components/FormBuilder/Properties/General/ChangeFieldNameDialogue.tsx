import React, { useState, useEffect } from 'react';
import { Dialog, Box, Grid, TextField, Button } from '@material-ui/core';
import { Formik, Form } from 'formik';
import { isEqual } from 'lodash';
import ConfirmCancelDialog from '../../../../components/ConfirmCancelDialog';
import { object, string } from 'yup';
import { isMobile, isTablet } from 'react-device-detect';
import FieldList from '../../FieldList';
import CustomDialogHeader from '../../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../../components/CustomDialog/CustomDialogFooter';

const FieldSchema = object().shape({
  fieldName: string().required('Please enter field Name')
});

const ChangeFieldNameDialogue = ({ setFieldValue, fieldData, handleClose, section, setSection, sectionId }) => {
  const [initialValues, setInitialValues] = useState({ ...fieldData });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    setInitialValues({ ...fieldData });
  }, [fieldData]);

  // const handleSave = (values) => {
  //   const updatedFieldData = {
  //     ...fieldData,
  //     fieldName: values.fieldName
  //   };
  //   setFieldValue('fieldName', updatedFieldData.fieldName);
  //   console.log('HandleSave called here!!',updatedFieldData.fieldName);
  //   console.log('Form values:', values);
  //   handleClose();
  // };
  const handleSave = (values) => {
    const updatedFieldData = {
      ...fieldData,
      fieldName: values.fieldName
    };
  
    
    let updatedSection = section.map(row => {
      if (row.sectionId.toString() === sectionId.toString()) {
        return {
          ...row,
          field: row.field.map(ele => {
            if (ele._id.toString() === fieldData._id.toString()) {
              return {
                ...ele,
                fieldName: values.fieldName
              };
            }
            return ele;
          })
        };
      }
      return row;
    });

    setSection(updatedSection);
    handleClose();
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
      maxWidth="md"
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
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={FieldSchema}
        onSubmit={handleSave}
        validate={validate}
      >
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`${values['fieldName']} - ${FieldList[fieldData?.type?.toUpperCase()]?.label} Properties`}
              onClose={() => {
                if (isEqual(values, initialValues)) handleClose();
                setShowConfirmDialog(true);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Box>
                <Grid item xs={10} md={6} sm={6}>
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Field Name"
                    required={true}
                    name="fieldName"
                    fullWidth
                    margin="dense"
                    disabled={!values['editAble']}
                    value={values['fieldName']}
                    error={touched['fieldName'] && Boolean(errors['fieldName'])}
                    helperText={touched['fieldName'] && errors['fieldName']}
                    onChange={(e) => {
                      setFieldValue('fieldName', e.target.value.trimStart());
                    }}
                  />
                </Grid>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                onClick={() => {
                  if (isEqual(values, initialValues)) handleClose();
                  setShowConfirmDialog(true);
                }}
                color="primary"
              >
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" variant="contained" onClick={submitForm}>
                Save
              </Button>
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

export default ChangeFieldNameDialogue;
