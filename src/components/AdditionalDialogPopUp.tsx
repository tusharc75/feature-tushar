import React, { useState } from 'react';
import { Box, Button, Dialog, Grid } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, getObjKeys, setFieldsInAscendingOrder, yupSchema } from '../constants/helpers';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import CommonSkeleton from './Helpers/CommonSkeleton';
import { Form, Formik } from 'formik';
import FormTypes from './Helpers/FormTypes';
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import CustomButton from './Helpers/CustomButton';

const arr = [...Array(9).keys()];

const AdditionalDialogPopUp = ({ open, close, title, handleSave, fieldData }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [entityData] = useState({
    fields: fieldData.map((fields) => fields.fieldData),
    initialValues: getObjKeys(
      '',
      fieldData.map((fields) => fields.fieldData)
    )
  });

  entityData.fields.map((obj) => {
    return (obj.required = true);
  });

  const formsData = setFieldsInAscendingOrder(entityData.fields);

  const onSubmit = (values) => {
    handleSave(values);
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={close}
        open={open}
        disableBackdropClick={true}
      >
        <CustomDialogHeader
          title={title}
          onClose={close}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        {entityData.fields.length === 0 && (
          <CustomDialogContent>
            <CommonSkeleton lenArray={arr} />
          </CustomDialogContent>
        )}
        {entityData.fields.length > 0 && (
          <Formik initialValues={entityData.initialValues} validationSchema={yupSchema(entityData.fields)} validateOnMount onSubmit={onSubmit}>
            {({ submitForm, values, errors, touched, setFieldValue }) => (
              <>
                <CustomDialogContent>
                  <Form noValidate>
                    {formsData &&
                      formsData.map((form, index1) => {
                        return (
                          form.name && (
                            <div key={index1}>
                              <h2 className="form-label-style">{form.name}</h2>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field, index2) => (
                                    <Grid key={index2} item xs={12} sm={6} md={6}>
                                      <FormTypes
                                        // {...rest}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        fieldData={field}
                                        fields={entityData.fields}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </div>
                          )
                        );
                      })}
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button type="button" variant="outlined" color="primary" size="small" onClick={close}>
                    Cancel
                  </Button>

                  <CustomButton
                    // loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={Object.keys(errors).length > 0 ? true : false}
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        )}
      </Dialog>
    </>
  );
};

export default AdditionalDialogPopUp;
