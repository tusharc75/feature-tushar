import React from 'react';
import { Dialog, Box, Grid, Button } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from 'src/components/Helpers/FormTypes';
import { yupSchema } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';

const StepFieldsDialog = ({ handleClose, handleSubmit, fieldData, step }) => {

  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

  return (
    <Dialog
      open
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      maxWidth="md"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
        }
      }}>
      <CustomDialogHeader
        title={step.stepName}
        onClose={handleClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      {fieldData.fields.length ? (
        <Formik
          initialValues={fieldData.values}
          validationSchema={yupSchema(fieldData.fields)}
          onSubmit={(values) => handleSubmit(values, step)}
          enableReinitialize
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogContent>
                <React.Fragment>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {fieldData.formsData.length > 0 &&
                      fieldData.formsData?.map((form, index1) => {
                        return form?.name ? (
                          <div key={index1}>
                            <div className="detail-box-content">
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className="form-label-style form-label-quotes">{form?.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form?.sectionFields?.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    <FormTypes
                                      {...field}
                                      row={field.type === 'radio'}
                                      fieldData={field}
                                      disabled={field.disableOnEdit}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      imageOrFileUploadCompletePercentage={null}
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        ) : (
                          form?.sectionFields.map((field) => (
                            <FormTypes
                              {...field}
                              fieldData={field}
                              disabled={field.disableOnEdit}
                              values={values}
                              errors={errors}
                              touched={touched}
                              label={field.fieldLabel}
                              name={field.fieldName}
                              type={field.type}
                              options={field.option}
                              setFieldValue={(name, value) => {
                                setFieldValue(name, value);
                              }}
                              required={field.required}
                              fullWidth
                              isTooltip={field?.isTooltip || false}
                              tooltipMessage={field?.tooltipMessage}
                              size="small"
                              style={{ visibility: 'hidden' }}
                            />
                          ))
                        );
                      })}
                  </Form>
                </React.Fragment>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button variant="outlined" size="small" onClick={handleClose} color="primary">
                  Cancel
                </Button>
                <Button variant="contained" size="small" onClick={submitForm} color="primary">
                  Save
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : null}
    </Dialog>
  );
};

export default StepFieldsDialog;
