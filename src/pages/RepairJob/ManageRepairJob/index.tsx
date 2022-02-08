import { useState, useEffect, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress, Grid, IconButton, Tooltip } from '@material-ui/core';
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
  repairJob,
  setFieldsInAscendingOrder,
  yupSchema,
  repairJobProcessSteps,
  REPAIR_JOB_STATUS,
  generateUniqueIdOnly
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from "react-icons/fa";
import moment from 'moment';
import { useData } from "../../../StateProvider/Provider";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageWarehouse from '../../Warehouse/ManageWarehouse';

const ManageRepairJob = (props) => {
  const initialRender = useRef(true)
  const { isClone, repairJobId, onClose, onSuccess, open, inventories, refrenceType, refrenceData } = props
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions },
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [repairJobData, setRepairJobData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [title, setTitle] = useState("");
  const [optionsPlantsEntity, setOptionsPlantsEntity] = useState([]);

  const [disablePlantIfAssetAdded, setDisablePlantIfAssetAdded] = useState(true)
  const [disableFields, setDisableFields] = useState(true)

  const [supplierShipToAddresses, setSupplierShipToAddresses] = useState([]);
  const [supplierShipToAddressesDataSource, setSupplierShipToAddressesDataSource] = useState([]);
  const [repairPlantDataSource, setRepairPlantDataSource] = useState([]);
  const [showAddWarehouseDialog, setShowAddWarehouseDialog] = useState(false);

  const {
    state: { user, selectedEntity },
  }: any = useData();

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(repairJobData.fields));
  }, [repairJobData.fields]);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Repair Job')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        const plantsOptions = data.find((obj) => ["plant", "warehouse"].indexOf(obj?.fieldData.fieldName) > -1)?.fieldData?.option ?? [];
        const plantOptionsEntity = plantsOptions.filter((a) => { if (a.entity == selectedEntity) { return a } });
        const commonDataSource = [...data.find((obj) => obj?.fieldData.fieldName === 'supplierShipTo')?.fieldData?.option] ?? [];
        const commonRepairPlantDataSource = [...data.find((obj) => obj?.fieldData.fieldName === 'repairPlant')?.fieldData?.option] ?? [];

        setSupplierShipToAddressesDataSource([...commonDataSource]);
        setRepairPlantDataSource([...commonRepairPlantDataSource]);

        setOptionsPlantsEntity(plantOptionsEntity)

        if (repairJobId) {
          axiosInstance()
            .get(`${repairJob.api}/` + repairJobId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, history, repairJobName, updatedBy, ...rest } = data;
                setTitle('Clone')
                setDisablePlantIfAssetAdded(false);

                rest.repairJobName = `RJ_${generateUniqueIdOnly()}`;

                setRepairJobData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  initialValues: { ...getObjKeysWithValues(rest, fieldsDataForCreate), status: REPAIR_JOB_STATUS.new }
                });
                setAllFields(fieldsDataForCreate);
                setDisableFields(false);
                setLoading(false);
              } else {
                setTitle(`Editing - [${data.repairJobName}]`)
                setRepairJobData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
                setAllFields(fieldsDataForUpdate);

                setLoading(false);

                //  If loading ticket is created, then we need to disable some controls in update dialog
                axiosInstance().get(`${repairJob.api}/${repairJobId}/get-assets`)
                  .then(({ data: { data } }) => {
                    let tempProductInventory = data.map(u => ({ ...u, _id: u?.id, productName: u?.product?.optionLabel }))
                    setDisablePlantIfAssetAdded(data.length > 0)

                    if (data.some(s => s["repaired"] === true)) {
                      setDisableFields(true);
                    } else {
                      let isLoadingTicketFound = false;
                      axiosInstance()
                        .get(`${routes.deliveryTicket.path}/typewise?refrenceType=Repair Job&refrenceId=${repairJobId}`)
                        .then(({ data }) => {
                          data.data.map(obj => {
                            tempProductInventory.map((d, index) => {
                              if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                                tempProductInventory[index]["deliveryTicket"] = obj?.deliveryJobName
                                tempProductInventory[index]["deliveryTicketId"] = obj?._id
                                if (isLoadingTicketFound === false) {
                                  isLoadingTicketFound = true;
                                }
                              }
                            })
                          })
                          setDisableFields(isLoadingTicketFound);
                        });
                    }
                  });
              }
              if (data["typeOfRepair"] === "External") {
                const supplierOptions = isClone ? fieldsDataForCreate.find(option => option.fieldName === "supplier")?.option : fieldsDataForUpdate.find(option => option.fieldName === "supplier")?.option;
                const options = supplierOptions.find(option => option.optionValue === data.supplier?.optionValue)?.shippingAddress ?? [];
                let newDataSource = [];

                options.forEach((d) => {
                  const getAddress = commonDataSource.find(s => s.optionValue === d);
                  if (getAddress) {
                    newDataSource = [...newDataSource, getAddress];
                  }
                  setSupplierShipToAddresses([...newDataSource])
                })
              }
            }).catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setTitle('Create Repair Job')
          setDisablePlantIfAssetAdded(false);
          let initialData = { ...getObjKeys('', fieldsDataForCreate), expectedCompletionDate: "", repairJobName: `RJ_${generateUniqueIdOnly()}` };
          if (refrenceType === "Rental Job") {
            initialData["typeOfRepair"] = "Internal"
            initialData["plant"] = refrenceData?.warehouse?.optionValue
            initialData["repairPlant"] = refrenceData?.warehouse?.optionValue
            initialData["productInventory"] = inventories
            initialData["rentalJob"] = refrenceData?._id
          }
          setDisableFields(false);
          setAllFields(fieldsDataForCreate);
          setRepairJobData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            initialValues: initialData
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [repairJobId]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
    } else {
      let fields = repairJobData.fields;

      if (fields.length > 0) {
        fields = fields.map(field => {
          const sectionFields = field.sectionFields.map(_f => {

            if (_f.fieldName === "repairPlant" || _f.fieldName === "plantShipTo") {
              if (formValues && formValues["typeOfRepair"] === "Internal") {
                _f.required = true
              } else {
                _f.required = false
              }
            }

            if (_f.fieldName === "supplier" || _f.fieldName === "supplierShipTo") {
              if (formValues && formValues["typeOfRepair"] === "External") {
                _f.required = true
              } else {
                _f.required = false
              }
            }

            return _f
          })
          return {
            ...field,
            sectionFields
          }
        })
      }
      setRepairJobData({ ...repairJobData, fields })
    }
  }, [formValues])

  // const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
  //   if (Object.keys(errors).length) {
  //     repairJobData.fields.forEach((input) => {
  //       if (input.required || values[input.fieldName]) {
  //         setTouched(input.fieldName, true);
  //       }
  //     });
  //     setErrors({ ...errors });
  //   } else {
  //     handleUpdateRepairJorepairJob(values);
  //   }
  // };

  const handleSubmit = (values) => {
    handleUpdateRepairJorepairJob(values);
  };

  const handleUpdateRepairJorepairJob = (values) => {
    setSubmitting(true);
    if (repairJobId && isClone === false) {
      values._id = repairJobId;
      axiosInstance()
        .put(`${repairJob.api}`, values)
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
      const { productInventory, ...rest } = values
      axiosInstance()
        .post(`${repairJob.api}`, rest)
        .then(({ data: { data, message } }) => {

          axiosInstance()
            .put(`${repairJob.api}/${data._id}/process-status`, {
              "processStatus": repairJobProcessSteps[0]
            })
            .then(() => {
              if (!refrenceType) {
                history.push(`${routes.repairJobDetail.path}/${data._id}`);
              }
              setSubmitting(false);
              onSuccess(data);
              toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: message
              });
            }).catch((error) => {

              setSubmitting(false);
              onSuccess(data);
              toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: message
              });
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

  const getValues = (values) => {
    if (refrenceType) {
      values["productInventory"] = inventories
    }
    return values
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
        {loading || !repairJobData.fields.length ? (
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
          <Formik innerRef={(ref) => { if (ref) { setFormValues(ref.values) } }} initialValues={repairJobData.initialValues} validationSchema={yupSchema(allFields)} validateOnMount onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues, submitForm }) => (
              <>
                <CustomDialogHeader
                  title={title}
                  onClose={(e, reason) => {
                    if (isFieldNotTouched(repairJobData, formValues)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen(prevState => !prevState)
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form>

                    {repairJobData.fields.length > 0 &&
                      repairJobData.fields.map((form, i) => {
                        return (
                          form.name && (
                            <div key={i}>
                              <div className={"detail-box-content"}>
                                <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                              </div>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field) =>
                                    field.fieldName === 'supplier' || field.fieldName === 'supplierShipTo' ? (
                                      values["typeOfRepair"] === "External" && (
                                        <Grid item xs={12} sm={6} md={6}>
                                          <FormTypes
                                            repairJobId={repairJobId}
                                            {...field}
                                            disabled={(!repairJobId && field.disableOnEdit)}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={field.fieldName === 'supplierShipTo' ? supplierShipToAddresses : field.option}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);

                                              if (field.fieldName === 'supplier') {
                                                setFieldValue("supplierShipTo", "");
                                                if (value) {
                                                  const options = field.option.find(option => option.optionValue === value)?.shippingAddress ?? [];
                                                  let newDataSource = [];

                                                  options.forEach((d) => {
                                                    const getAddress = supplierShipToAddressesDataSource.find(s => s.optionValue === d);
                                                    if (getAddress) {
                                                      newDataSource = [...newDataSource, getAddress];
                                                    }
                                                    setSupplierShipToAddresses([...newDataSource])
                                                  })
                                                }
                                                else {
                                                  setSupplierShipToAddresses([])
                                                }
                                              }

                                            }}
                                            required={values["typeOfRepair"] === "External"}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                          />
                                        </Grid>
                                      )
                                    ) : field.fieldName === 'repairPlant' || field.fieldName === 'plantShipTo' ? (
                                      values["typeOfRepair"] === "Internal" && (
                                        <Grid item xs={12} sm={6} md={6}>
                                          <FormTypes
                                            repairJobId={repairJobId}
                                            {...field}
                                            disabled={disableFields || (!repairJobId && field.disableOnEdit)}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={field.option}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);

                                              if (field.fieldName === 'repairPlant') {
                                                if (value) {
                                                  setFieldValue("plantShipTo", field.option.find(d => d.optionValue === value)?.address ?? "");
                                                } else {
                                                  setFieldValue("plantShipTo", "");
                                                }
                                              }
                                            }}
                                            required={values["typeOfRepair"] === "Internal"}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                          />
                                        </Grid>
                                      )
                                    )
                                      :
                                      <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                        {
                                          field.fieldName === "productInventory"
                                            ? <FormTypes
                                              repairJobId={repairJobId}
                                              {...field}
                                              disabled={(!repairJobId && field.disableOnEdit) || (field.fieldName === "productInventory" && refrenceType)}
                                              values={getValues(values)}
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
                                            />
                                            :
                                            field.fieldName === "typeOfRepair"
                                              ? <FormTypes
                                                repairJobId={repairJobId}
                                                {...field}
                                                disabled={disableFields || (!repairJobId && field.disableOnEdit)}
                                                values={getValues(values)}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={field.option}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(name, value);

                                                  if (value) {
                                                    if (value === "Internal") {
                                                      setFieldValue("repairPlant", values["plant"] ?? values["warehouse"]);
                                                      setFieldValue("plantShipTo", repairPlantDataSource.find(d => d.optionValue === values["plant"] || d.optionValue === values["warehouse"])?.address ?? "");
                                                    } else {
                                                      setFieldValue("repairPlant", "");
                                                      setFieldValue("plantShipTo", "");
                                                    }
                                                    setFieldValue("supplier", "");
                                                    setFieldValue("supplierShipTo", "");

                                                    setSupplierShipToAddresses([]);
                                                  }
                                                  else {
                                                    setFieldValue("repairPlant", "");
                                                    setFieldValue("plantShipTo", "");
                                                    setFieldValue("supplier", "");
                                                    setFieldValue("supplierShipTo", "");

                                                    setSupplierShipToAddresses([]);
                                                  }
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                              /> : field.fieldName === "startDate"
                                                ? <FormTypes
                                                  repairJobId={repairJobId}
                                                  {...field}
                                                  disabled={(!repairJobId && field.disableOnEdit) || values["status"] === "Completed"}
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
                                                  minDate={new Date()}
                                                  maxDate={values["expectedCompletionDate"] ? moment(values["expectedCompletionDate"]) : moment().add(5, "years")}
                                                /> : field.fieldName === "expectedCompletionDate"
                                                  ? <FormTypes
                                                    repairJobId={repairJobId}
                                                    {...field}
                                                    disabled={(!repairJobId && field.disableOnEdit) || values["status"] === "Completed"}
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
                                                    minDate={values["startDate"]}
                                                  /> : (field.fieldName === "plant" || field.fieldName === "warehouse") ? (
                                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                      <Grid container spacing={1}>
                                                        <Grid item
                                                          xs={
                                                            permissions?.warehouse?.isCreate
                                                              ? 11
                                                              : 11
                                                          }
                                                          sm={
                                                            permissions?.warehouse?.isCreate
                                                              ? 11
                                                              : 11
                                                          }
                                                          md={
                                                            permissions?.warehouse?.isCreate
                                                              ? 11
                                                              : 11
                                                          }
                                                        >
                                                          <FormTypes
                                                            repairJobId={repairJobId}
                                                            {...field}
                                                            disabled={disablePlantIfAssetAdded || (!repairJobId && field.disableOnEdit)}
                                                            values={values}
                                                            errors={errors}
                                                            touched={touched}
                                                            label={field.fieldLabel}
                                                            name={field.fieldName}
                                                            type={field.type}
                                                            options={optionsPlantsEntity}
                                                            setFieldValue={(name, value) => {
                                                              setFieldValue(name, value);

                                                              if (values["typeOfRepair"] === "Internal") {
                                                                setFieldValue("repairPlant", value);
                                                                setFieldValue("plantShipTo", repairPlantDataSource.find(d => d.optionValue === value)?.address ?? "");
                                                              }

                                                            }}
                                                            required={field.required}
                                                            fullWidth
                                                            isTooltip={field?.isTooltip || false}
                                                            tooltipMessage={field?.tooltipMessage}
                                                            size="small"
                                                          />
                                                        </Grid>
                                                        {permissions?.warehouse?.isCreate && (
                                                          <Grid item xs={1} sm={1} md={1} >
                                                            <Tooltip

                                                              title="Create Plant"
                                                              className="mt-1"
                                                            >
                                                              <IconButton
                                                                onClick={() => {
                                                                  setShowAddWarehouseDialog(true);
                                                                }}
                                                                disabled={disablePlantIfAssetAdded || (!repairJobId && field.disableOnEdit)}
                                                                size="small"
                                                              >
                                                                <AddIcon color={disablePlantIfAssetAdded || (!repairJobId && field.disableOnEdit) ? "disabled" : "primary"} />
                                                              </IconButton>
                                                            </Tooltip>
                                                          </Grid>
                                                        )}
                                                        {field?.tooltipMessage ? (
                                                          <Grid item xs={1} sm={1} md={1}>
                                                            <Tooltip
                                                              className="mt-2"
                                                              title={
                                                                field?.tooltipMessage ?? ""
                                                              }
                                                            >
                                                              <InfoIcon color="disabled" />
                                                            </Tooltip>
                                                          </Grid>
                                                        ) : null}
                                                      </Grid>
                                                    </Grid>

                                                  ) : field.fieldName === "status"
                                                    ? <FormTypes
                                                      repairJobId={repairJobId}
                                                      {...field}
                                                      disabled={true}
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
                                                    /> : field.fieldName === "repairPerson"
                                                      ? <FormTypes
                                                        repairJobId={repairJobId}
                                                        {...field}
                                                        disabled={disableFields || (!repairJobId && field.disableOnEdit)}
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
                                                      /> : <FormTypes
                                                        repairJobId={repairJobId}
                                                        {...field}
                                                        disabled={(!repairJobId && field.disableOnEdit) || (field.fieldName === "repairJobName")}
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
                                                        imageOrFileUploadCompletePercentage={
                                                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                                            ? (completePercentage) => {
                                                              setUploadingImageOrFileProgress(completePercentage);
                                                            }
                                                            : null
                                                        }
                                                      />}

                                      </Grid>
                                  )}
                                </Grid>
                              </Box>
                            </div>
                          )
                        );
                      })}
                    {showAddWarehouseDialog &&
                      <ManageWarehouse
                        open={showAddWarehouseDialog}
                        close={() => setShowAddWarehouseDialog(false)}
                        isClone={false}
                        onSuccess={({ data }) => {
                          if (data._id) {
                            setShowAddWarehouseDialog(false)
                            setOptionsPlantsEntity((prevState) => {
                              return [
                                ...prevState,
                                {
                                  optionValue: data._id,
                                  optionLabel: data.warehouseName,
                                  order: optionsPlantsEntity.length,
                                  default: false
                                },
                              ];
                            });
                            setFieldValue("plant", data._id);
                          }
                        }}
                      />}
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
                      if (isFieldNotTouched(repairJobData, values)) onClose();
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
                    disabled={submitting}
                    onClick={(e) => {
                      submitForm();
                      // e.preventDefault();
                      // handleScroll(errors);
                      // handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
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
                      submitForm();
                      // handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
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

export default ManageRepairJob;
