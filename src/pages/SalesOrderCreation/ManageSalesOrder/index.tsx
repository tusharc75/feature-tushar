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
  salesOrder,
  setFieldsInAscendingOrder,
  yupSchema
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import {FaDiceOne} from "react-icons/fa";

const ManageSalesOrder = (props) => {
  const { isClone, salesOrderId, onClose, onSuccess, open, inventories, fromInventory } = props;
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salesOrderData, setSalesOrderData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  
  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(salesOrderData.fields));
  }, [salesOrderData.fields]);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Sales Order')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (salesOrderId) {
          axiosInstance()
            .get(`${salesOrder.salesOrderApi}/` + salesOrderId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, history, salesOrderName, updatedBy, ...rest } = data;

                setSalesOrderData({
                  fields: fieldsDataForCreate,
                  initialValues: getObjKeysWithValues(rest, fieldsDataForCreate)
                });
                setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate));
                setLoading(false);
              } else {
                setSalesOrderData({
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
          let initialData = getObjKeys('', fieldsDataForCreate);

          setSalesOrderData({
            fields: fieldsDataForCreate,
            initialValues: initialData
          });
          setFormValues(initialData);
          setLoading(false);
        }
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  }, [salesOrderId]);

  const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
    if (Object.keys(errors).length) {
      salesOrderData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleUpdateSalesOrder(values);
    }
  };

  const handleUpdateSalesOrder = (values) => {
    setSubmitting(true);
    if (salesOrderId && isClone === false) {
      values._id = salesOrderId;
      axiosInstance()
        .put(`${salesOrder.salesOrderApi}`, values)
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
        .post(`${salesOrder.salesOrderApi}`, values)
        .then(({ data: { data, message } }) => {
          if (!fromInventory) {
            history.push(`${routes.salesOrderDetail.path}/${data._id}`);
          }
          setSubmitting(false);
          onSuccess(data);
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
        fullScreen={fullScreen || (isMobile || isTablet)}
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
          title={!salesOrderId ? 'Create Sales Order' : `${isClone ? 'Clone' : 'Editing'}`}
          onClose={(e, reason) => {
            if (isFieldNotTouched(salesOrderData, formValues)) onClose();
            else setShowConfirmDialog(true);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
        {loading || !salesOrderData.fields.length ? (
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
            initialValues={salesOrderData.initialValues}
            validationSchema={yupSchema(salesOrderData.fields)}
            validateOnMount
            onSubmit={() => { }}
          >
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    {/*<h2 className="form-label-style" style={{ borderBottom: 'none' }}>*/}
                    {/*  * Required Fields*/}
                    {/*</h2>*/}
                    {formsData &&
                      formsData.map((form, i) => {
                        return (
                          form.name && (
                            <div key={i}>
                              <div className={"detail-box-content"}>
                                <FaDiceOne size={16} color={"var(--white)"} style={{marginRight:"5px"}}/>
                                <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                              </div>

                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field) => (
                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                      {field.fieldName === '' ? null : (
                                        <FormTypes
                                          salesOrderId={salesOrderId}
                                          {...field}
                                          disabled={!salesOrderId && field.disableOnEdit}
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
                                      )}
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
                      if (isFieldNotTouched(salesOrderData, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </Button>

                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                    disabled={
                      // loading || Object.keys(errors).length > 0 ? true : false
                      uploadingImageOrFileProgress > 0 || isFieldNotTouched(salesOrderData, values) || submitting || loading
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
                  close={() => setShowConfirmDialog(false)}
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

export default ManageSalesOrder;
