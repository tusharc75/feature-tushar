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
import axiosInstance from 'src/axios/axiosInstance';

const PurchaseRequisitionDetailDialog = ({ onClose, productionOrderData, handleSave, loading }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [digitalData, setDigitalData] = useState({ fields: [], initialValues: {} });
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let fields = await axiosInstance().get('/field?resource=Purchase Requisition Detail');
      let data = fields?.data?.data.map((i: any) => {
        return i?.fieldData;
      });
      setDigitalData({
        fields: data,
        initialValues: getObjKeysWithValues(productionOrderData, data)
      });
      setFormsData(setFieldsInAscendingOrder(data));
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
    if (Object.keys(errors).length) {
      digitalData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleSave([{ ...productionOrderData, ...values }]);
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
          title={`Edit ${productionOrderData?.detail || ''}`}
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
            onSubmit={() => {}}
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
                                        options={field.option}
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

export default PurchaseRequisitionDetailDialog;
