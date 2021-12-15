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
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  CustomDialogTransition,
  generateUniqueIdOnly,
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
import moment from "moment";
import { FaDiceOne } from "react-icons/fa";

const ManageReceivingTicket = ({ isClone, receivingTicketId, productInventoryForReceivingTicket = null, rentalData = null, repairJobData = null, transferData = null, isRedirectToDetailPage = true, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user },
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receivingTicketData, setReceivingTicketData] = useState<any>({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState("")
  const [disableReceivingJobName, setDisableReceivingJobName] = useState(false)

  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [
    ownerCollaboratorCommonDataSource,
    setOwnerCollaboratorCommonDataSource,
  ] = useState([]);
  const [ownerDataSource, setOwnerDataSource] = useState([]);
  const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);
  const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);


  useEffect(() => {
    if (!receivingTicketId) {
      setTitle("Create Receiving Ticket");
    }

    const ownerCollabOptions = receivingTicketData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }

    const fields = receivingTicketData.fields

    const modifiedData = setFieldsInAscendingOrder(fields)
    const newFilteredData = modifiedData.filter((formData) => {
      if (transferData && transferData?.transferType) {
        if (transferData?.transferType === "Internal") {
          if (formData.name.includes("Customer") || formData.name.includes("Supplier")) {
            return false
          }
        }
        if (transferData?.transferType.includes("External Supplier")) {
          if (formData.name.includes("Customer") || formData.name.includes("Plant")) {
            return false
          }
        }
        if (transferData?.transferType.includes("External Customer")) {
          if (formData.name.includes("Supplier") || formData.name.includes("Plant")) {
            return false
          }
        }
      }
      if (repairJobData) {
        if (repairJobData?.typeOfRepair === "Internal") {
          if (formData.name.includes("Supplier")) {
            return false
          }
        }
        if (repairJobData?.typeOfRepair === "External") {
          if (formData.name.includes("Customer")) {
            return false
          }
        }
      }
      if (rentalData) {
        if (formData.name.includes("Supplier")) {
          return false
        }
        if (formData.name.includes("Plant Pickup")) {
          return false
        }
      }
      return true
    })

    setFormsData(newFilteredData);
  }, [receivingTicketData.fields, repairJobData, rentalData]);

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(
      getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData)
    );
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(
      getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData)
    );
  };

  useEffect(() => {
    if (receivingTicketId) {
      setTitle(isClone ? "Clone" : `Update ${receivingTicketData.initialValues?.receivingJobName ? `(${receivingTicketData.initialValues?.receivingJobName})` : ""}`);
    }

    setLoading(true);
    axiosInstance().get('/field?resource=Receiving Ticket').then(({ data: { data } }) => {
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
              setDisableOwnerSelection(receivingTicketId && user.user._id !== data?.owner?.optionValue);
              setTitle(prevState => `${prevState} ${data.receivingJobName}`);
              setDisableReceivingJobName(true);
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
          setDisableReceivingJobName(true);
          const tempInitialData = getObjKeys("", fieldsDataForCreate)
          tempInitialData["productInventory"] = productInventoryForReceivingTicket.map(d => d._id)
          tempInitialData["rentalJob"] = rentalData._id
          tempInitialData["customerAccount"] = rentalData.customerAccount.optionValue
          tempInitialData["warehouse"] = rentalData?.warehouse?.optionValue
          tempInitialData["receivingPlantAddress"] = rentalData.shippingAddress
          tempInitialData["pickupAddress"] = rentalData.shippingAddress
          tempInitialData["type"] = "Rental Job"
          tempInitialData["receivingJobName"] = `${rentalData?.rentalJobName}_${generateUniqueIdOnly()}`
          setReceivingTicketData({
            fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "rentalJob"),
            initialValues: tempInitialData,
          });
          setFormValues(tempInitialData)
        } else if (productInventoryForReceivingTicket && repairJobData) {
          setDisableReceivingJobName(true);
          const tempInitialData = getObjKeys("", fieldsDataForCreate)
          tempInitialData["productInventory"] = productInventoryForReceivingTicket.map(d => d._id)
          tempInitialData["repairJob"] = repairJobData._id
          tempInitialData["type"] = "Repair Job"
          tempInitialData["receivingJobName"] = `${repairJobData?.repairJobName}_${generateUniqueIdOnly()}`
          if (repairJobData?.typeOfRepair === "Internal") {
            // tempInitialData["customerAccount"] = repairJobData?.repairPlant?.optionValue;
            tempInitialData["pickupAddress"] = repairJobData?.plantShipTo;
          }
          if (repairJobData?.typeOfRepair === "External") {
            tempInitialData["supplierAccount"] = repairJobData?.vendor?.optionValue;
            tempInitialData["supplierShippingAddress"] = repairJobData?.supplierShipTo;
          }
          setReceivingTicketData({
            fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "warehouse" && d.fieldName !== "repairJob"),
            initialValues: tempInitialData,
          });
          setFormValues(tempInitialData)
        } else if (productInventoryForReceivingTicket && transferData) {
          setDisableReceivingJobName(true);
          const tempInitialData = getObjKeys("", fieldsDataForCreate)
          tempInitialData["productInventory"] = productInventoryForReceivingTicket.map(d => d._id)
          tempInitialData["transferAsset"] = transferData._id
          tempInitialData["type"] = "Transfer Asset"
          tempInitialData["warehouse"] = transferData?.transferFromPlant.optionValue ?? "";
          tempInitialData["receivingPlantAddress"] = transferData?.transferFromPlant.address ?? "";
          tempInitialData["expectedDeliveryDate"] = moment(new Date()).add(7, 'days');
          tempInitialData["receivingJobName"] = `${transferData?.transferAssetNumber}_${generateUniqueIdOnly()}`
          if (transferData?.transferType === "External Customer") {
            tempInitialData["customerAccount"] = transferData?.transferToCustomer?.optionValue;
            tempInitialData["pickupAddress"] = transferData?.customerShipTo;
          }
          if (transferData?.transferType === "External Supplier") {
            tempInitialData["supplierAccount"] = transferData?.transferToSupplier?.optionValue;
            tempInitialData["supplierShippingAddress"] = transferData?.supplierShipTo;
          }
          setReceivingTicketData({
            fields: fieldsDataForCreate.filter(d => d.fieldName !== "productInventory" && d.fieldName !== "transferAsset"),
            initialValues: tempInitialData,
          });
          setFormValues(tempInitialData)
          setLoading(false);
        } else {
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
          if (isRedirectToDetailPage) {
            history.push(`${routes.receivingTicketDetail.path}/${data._id}`);
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

  function validate(values) {
    const errors = {};
    let startDate = moment(values?.["pick-UpDate"]);
    let endDate = moment(values?.deliveryDate);
    if (endDate.diff(startDate, 'days') < 0) {
      errors['pick-UpDate'] = 'Please enter valid pick-Up  date';
    }
    return errors;
  }

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
          title={title}
          onClose={(e, reason) => {
            if (isFieldNotTouched(receivingTicketData, formValues)) onClose();
            else setShowConfirmDialog(true);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
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
          <Formik initialValues={receivingTicketData.initialValues} validationSchema={yupSchema(receivingTicketData.fields)} validate={validate} validateOnMount onSubmit={() => { }}>
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    {formsData && formsData.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={"detail-box-content"}>
                              <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                              <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    {
                                      (rentalData && field.fieldName === "customerAccount") || field.fieldName === "deliveryType" ? (
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
                                      ) : (repairJobData && field.fieldName === "customerAccount") ? (
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
                                      ) : field.fieldName === "owner" ? (
                                        <FormTypes
                                          isNew={!receivingTicketId || isClone}
                                          {...field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={ownerData}
                                          onChange={(e, val) => {
                                            handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })
                                            setFieldValue(
                                              field.fieldName,
                                              val && val.optionValue
                                                ? val.optionValue
                                                : ""
                                            );

                                            if (
                                              val &&
                                              val.optionValue !== user?.user?._id
                                            ) {
                                              const checkOwnerAddedInCollaborator =
                                                values["collaborator"].find(
                                                  (d) =>
                                                    d?.optionValue ===
                                                    user?.user?._id
                                                );
                                              if (
                                                !checkOwnerAddedInCollaborator
                                              ) {
                                                setFieldValue("collaborator", [
                                                  ...values["collaborator"],
                                                  collaboratorData.find(
                                                    (d) =>
                                                      d?.optionValue ===
                                                      user?.user?._id
                                                  ).optionValue,
                                                ]);
                                                handleValuesChange({
                                                  "collaborator": collaboratorData.find(
                                                    (d) =>
                                                      d?.optionValue ===
                                                      user?.user?._id
                                                  ).optionValue
                                                })
                                              }
                                            }
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          disabled={disableOwnerSelection || (receivingTicketId && field.disableOnEdit)}
                                          onOpen={() => {
                                            onOwnerDropdownOpen(
                                              values["collaborator"]
                                            );
                                          }}
                                        />
                                      ) : field.fieldName === "collaborator" ? (
                                        <FormTypes
                                          isNew={!receivingTicketId || isClone}
                                          {...field}
                                          disabled={receivingTicketId && field.disableOnEdit}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={collaboratorData}
                                          setFieldValue={(name, value) => {
                                            handleValuesChange({ [name]: value });
                                            setFieldValue(name, value)
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onOpen={() => {
                                            onCollabOwnerMultiselectOpen(
                                              values["owner"]
                                            );
                                          }}
                                        />
                                      ) : field.fieldName === "receivingJobName" ? (
                                        <FormTypes
                                          {...field}
                                          disabled={disableReceivingJobName}
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
                                        />
                                      ) : <FormTypes
                                        {...field}
                                        fieldData={field}
                                        disabled={Boolean(receivingTicketId) && field.disableOnEdit}
                                        isNew={Boolean(receivingTicketId)}
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
