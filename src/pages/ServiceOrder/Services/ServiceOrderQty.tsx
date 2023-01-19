import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  isFieldNotTouched,
  setFieldsInAscendingOrder,
  yupSchema
} from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { Skeleton } from '@material-ui/lab';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';

const ServiceOrderQty = ({ onClose, serviceData, handleSave, from = null }) => {
  const fieldData = [{
    "_id": "630dbe1e9ec418610523533e",
    "fieldLabel": "Qty",
    "type": "decimal",
    "option": [],
    "required": true,
    "isTooltip": false,
    "tooltipMessage": "",
    "editAble": true,
    "order": 1,
    "decimalPlaces": 2,
    "sectionName": "Quantity Information",
    "fieldName": "qty",
    "resource": "Service Order",
    "defaultValue": "",
    "disableOnEdit": false,
    "hiddenField": false,
    "isDefaultValue": false,
    "isDropdown": false,
    "isWarningTooltip": false,
    "lookup": false,
    "lookupResource": "",
    "warningTooltipMessage": "",
    "brand": "630dbe1e9ec418610523529c",
    "createdBy": {
      "user": "61b84437885fdf02d9104cb0",
      "date": "2022-08-30T07:37:02.237Z"
    },
    "roleType": 0,
    "entityWiseLookup": false,
    "isColumnEditable": true,
    "isMinMaxValue": false,
    "isSystemGenerate": false,
    "maxValue": 0,
    "maxValueServiceAdd": "",
    "minValue": 0,
    "minValueServiceAdd": ""
  },
  {
    "_id": "630dbe1e9ec418610523533f",
    "fieldLabel": "Unit",
    "type": "dropDown",
    "option": [
      {
        "optionLabel": "Piece",
        "optionValue": "Piece",
        "order": 1,
        "default": false
      },
      {
        "optionLabel": "One Well Pad",
        "optionValue": "One Well Pad",
        "order": 2,
        "default": false
      },
      {
        "optionLabel": "Two Well Pad",
        "optionValue": "Two Well Pad",
        "order": 3,
        "default": false
      },
      {
        "optionLabel": "Three Well Pad",
        "optionValue": "Three Well Pad",
        "order": 4,
        "default": false
      },
      {
        "optionLabel": "Four Well Pad",
        "optionValue": "Four Well Pad",
        "order": 5,
        "default": false
      },
      {
        "optionLabel": "Five Well Pad",
        "optionValue": "Five Well Pad",
        "order": 6,
        "default": false
      },
      {
        "optionLabel": "Six Well Pad",
        "optionValue": "Six Well Pad",
        "order": 7,
        "default": false
      }
    ],
    "required": true,
    "isTooltip": false,
    "tooltipMessage": "",
    "editAble": true,
    "order": 2,
    "hiddenField": false,
    "isDefaultValue": false,
    "disableOnEdit": false,
    "addManualOptionInExcel": false,
    "addAdditionalOption": false,
    "lookup": false,
    "lookupResource": "",
    "isDropdown": false,
    "isWarningTooltip": false,
    "warningTooltipMessage": "",
    "defaultValue": "",
    "sectionName": "Quantity Information",
    "fieldName": "unit",
    "resource": "Service Order",
    "brand": "630dbe1e9ec418610523529c",
    "createdBy": {
      "user": "61b84437885fdf02d9104cb0",
      "date": "2022-08-30T07:37:02.237Z"
    },
    "roleType": 0
  },
  {
    "_id": "63c8e3d1afbb98da8bb62154",
    "fieldLabel": "Estimate Start Date",
    "type": "dateTime",
    "option": [],
    "required": true,
    "isTooltip": false,
    "tooltipMessage": "",
    "editAble": true,
    "deletAble": true,
    "order": 8,
    "hiddenField": false,
    "isDefaultValue": false,
    "disableOnEdit": false,
    "lookup": false,
    "lookupResource": "",
    "entityWiseLookup": false,
    "isMinMaxValue": false,
    "minValue": 0,
    "maxValue": 0,
    "minValueServiceAdd": "",
    "maxValueServiceAdd": "",
    "isDropdown": false,
    "isSystemGenerate": false,
    "isColumnEditable": false,
    "isWarningTooltip": false,
    "warningTooltipMessage": "",
    "defaultValue": "",
    "fieldName": "estimateStartDate",
    "sectionName": "Service Order Information",
    "resource": "Service Order",
    "brand": "630dbe1e9ec418610523529c"
  },
  {
    "_id": "63c8e3d1afbb98da8bb62155",
    "fieldLabel": "Estimate End Date",
    "type": "dateTime",
    "option": [],
    "required": true,
    "isTooltip": false,
    "tooltipMessage": "",
    "editAble": true,
    "deletAble": true,
    "order": 9,
    "hiddenField": false,
    "isDefaultValue": false,
    "disableOnEdit": false,
    "lookup": false,
    "lookupResource": "",
    "entityWiseLookup": false,
    "isMinMaxValue": false,
    "minValue": 0,
    "maxValue": 0,
    "minValueServiceAdd": "",
    "maxValueServiceAdd": "",
    "isDropdown": false,
    "isSystemGenerate": false,
    "isColumnEditable": false,
    "isWarningTooltip": false,
    "warningTooltipMessage": "",
    "defaultValue": "",
    "fieldName": "estimateEndDate",
    "sectionName": "Service Order Information",
    "resource": "Service Order",
    "brand": "630dbe1e9ec418610523529c"
  }];
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [digitalData, setDigitalData] = useState({ fields: [], initialValues: {} });
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    setDigitalData({
      fields: fieldData,
      initialValues: getObjKeysWithValues(serviceData, fieldData)
    });
    setFormsData(setFieldsInAscendingOrder(fieldData));
  }, []);

  const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
    if (Object.keys(errors).length) {
      digitalData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleSave([{ ...serviceData, ...values }]);
    }
  };

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={true}
      >
        <CustomDialogHeader
          title={`Edit ${serviceData?.detail || ''}`}
          onClose={(e, reason) => {
            if (isFieldNotTouched(digitalData, formValues)) onClose();
            else setShowConfirmDialog(true);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        {!digitalData.fields.length ? (
          <>
            <CustomDialogContent>
              <Skeleton width="100%" height="70px" />
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <Grid key={i} item xs={12} sm={6} md={6}>
                    <Skeleton width="100%" height="60px" />
                  </Grid>
                ))}
              </Grid>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button variant="outlined" size="small" color="primary" disabled>
                Cancel
              </Button>
              <Button variant="contained" size="small" color="primary" disabled>
                Submit
              </Button>
            </CustomDialogFooter>
          </>
        ) : (
          <Formik
            initialValues={digitalData.initialValues}
            validationSchema={yupSchema(digitalData.fields)}
            validateOnMount
            // validate={validate}
            onSubmit={() => { }}
          >
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    {formsData &&
                      formsData.map((form, i) => {
                        return (
                          form.name && (
                            <div key={i}>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field) => (
                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        disabled={field.disabled}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={from === routes.serviceOrder.title && field.fieldName === "unit" ? serviceData?.serviceDetail?.unit?.map((d, index) => {
                                          return {
                                            "optionLabel": d,
                                            "optionValue": d,
                                            "order": index + 1,
                                            "default": false
                                          }
                                        }) : field.option}
                                        setFieldValue={(name, value) => {
                                          handleValuesChange({ [name]: value });
                                          setFieldValue(name, value);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isMultipleUpload={true}
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={
                                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                            ? (completePercentage) => {
                                              setUploadingImageOrFileProgress(completePercentage);
                                            }
                                            : null
                                        }
                                        row={true}
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
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (isFieldNotTouched(digitalData, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={uploadingImageOrFileProgress > 0 || loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false);

                      handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                    }}
                    close={() => setShowConfirmDialog(false)}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
                    }}
                  />
                ) : null}
              </>
            )}
          </Formik>
        )}
      </Dialog>
    </>
  );
};

export default ServiceOrderQty;
