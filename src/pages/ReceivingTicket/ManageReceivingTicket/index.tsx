import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  isFieldNotTouched,
  receivingTicket,
  setFieldsInAscendingOrder,
  yupSchema
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { useHistory } from 'react-router-dom';
import { useData } from '../../../StateProvider/Provider';
import routes from '../../../components/Helpers/Routes';

const ManageReceivingTicket = ({ isClone, receivingTicketId, productInventoryForReceivingTicket = null, rentalData = null, warehouseId = null, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receivingTicketData, setReceivingTicketData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(receivingTicketData.fields));
  }, [receivingTicketData.fields]);


  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Receiving Ticket')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (receivingTicketId) {
          axiosInstance()
            .get(`${receivingTicket.receivingTicketApi}/` + receivingTicketId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, history, receivingJobName, updatedBy, ...rest } = data;

                setReceivingTicketData({
                  fields: fieldsDataForCreate,
                  initialValues: getObjKeysWithValues(rest, fieldsDataForCreate)
                });
                setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate));
                setLoading(false);
              } else {
                setReceivingTicketData({
                  fields: fieldsDataForUpdate,
                  initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
                setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate));
                setLoading(false);
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          if (productInventoryForReceivingTicket && rentalData) {
            const tempInitialData = getObjKeys("", fieldsDataForCreate)
            tempInitialData["productInventory"] = productInventoryForReceivingTicket.map(d => d.inventory._id)
            tempInitialData["warehouse"] = warehouseId?.optionValue ? warehouseId?.optionValue : ""
            tempInitialData["rentalJob"] = rentalData._id
            tempInitialData["customerAccount"] = rentalData.customerAccount.optionValue
            tempInitialData["pickupAddress"] = rentalData.shippingAddress
            tempInitialData["receivingJobName"] = rentalData?.rentalJobName
            setReceivingTicketData({
              fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "warehouse" && d.fieldName !== "rentalJob"),
              initialValues: tempInitialData,
            });
            setFormValues(tempInitialData)
          }
          else {
            let initialData = getObjKeys('', fieldsDataForCreate);
            setReceivingTicketData({
              fields: fieldsDataForCreate,
              initialValues: initialData
            });
            setFormValues(initialData);
          }
          setLoading(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [receivingTicketId]);

  const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
    if (Object.keys(errors).length) {
      receivingTicketData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleUpdateReceivingTicket(values);
    }
  };

  const handleUpdateReceivingTicket = (values) => {
    setSubmitting(true);
    if (receivingTicketId && isClone === false) {
      values._id = receivingTicketId;
      axiosInstance()
        .put(`${receivingTicket.receivingTicketApi}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${receivingTicket.receivingTicketApi}`, values)
        .then(({ data: { data, message } }) => {
          history.push(`${routes.receivingTicketDetail.path}/${data._id}`);
          setSubmitting(false);
          onSuccess(data);
          console.log(data)
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);

      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
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
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
      >
        <CustomDialogHeader
          title={!receivingTicketId ? 'Create Receiving Ticket' : `${isClone ? 'Clone' : 'Editing'}`}
          onClose={(e, reason) => {
            if (isFieldNotTouched(receivingTicketData, formValues)) onClose();
            else setShowConfirmDialog(true);
          }}
        />
        {loading || !receivingTicketData.fields.length ? (
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
          <Formik initialValues={receivingTicketData.initialValues} validationSchema={yupSchema(receivingTicketData.fields)} validateOnMount onSubmit={() => { }}>
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    <h2 className="form-label-style" style={{ borderBottom: 'none' }}>
                      * Required Fields
                    </h2>
                    {formsData &&
                      formsData.map((form, i) => {
                        return (
                          form.name && (
                            <div key={i}>
                              <h2 className="form-label-style">{form.name}</h2>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field) => (
                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                      {field.fieldName === "customerAccount" || field.fieldName === "pickupAddress" || field.fieldName === "deliveryType" ? (
                                        <FormTypes
                                          {...field}
                                          disabled={true}
                                          isNew={Boolean(receivingTicketId)}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            handleValuesChange({ [name]: value })
                                            setFieldValue(name, value)
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          imageOrFileUploadCompletePercentage={null}
                                        />
                                      ) : <FormTypes
                                        receivingTicketId={receivingTicketId}
                                        {...field}
                                        disabled={!receivingTicketId && field.disableOnEdit}
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
                                      />
                                      }
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
                    disabled={submitting}
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (isFieldNotTouched(receivingTicketData, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </Button>

                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    startIcon={submitting && <CircularProgress size={20} color='inherit' />}
                    disabled={
                      // loading || Object.keys(errors).length > 0 ? true : false
                      uploadingImageOrFileProgress > 0 || isFieldNotTouched(receivingTicketData, values) || submitting || loading
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
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
                      handleScroll(errors);

                      handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                    }}
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

export default ManageReceivingTicket;
