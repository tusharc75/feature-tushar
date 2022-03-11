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
import { isEqual } from 'lodash';

const ManageRepairJob = ({ isClone = false, repairJobId = null, onClose, onSuccess, refrenceType = null, refrenceData = null }) => {

  const initialRender = useRef(true)

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { state: { permissions, user, selectedEntity } }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [title, setTitle] = useState("");
  const [optionsPlantsEntity, setOptionsPlantsEntity] = useState([]);

  const [disablePlantIfAssetAdded, setDisablePlantIfAssetAdded] = useState(true)

  const [showAddWarehouseDialog, setShowAddWarehouseDialog] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance().get('/field?resource=Repair Job').then(({ data: { data } }) => {
      data = data.filter((obj) => obj?.fieldData?.fieldName !== "rentalJob");
      
      const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      const plantsOptions = data.find((obj) => ["plant", "warehouse"].indexOf(obj?.fieldData.fieldName) > -1)?.fieldData?.option ?? [];
      const plantOptionsEntity = plantsOptions?.filter((a) => { if (a.entity.includes(selectedEntity)) { return a } });
      setOptionsPlantsEntity(plantOptionsEntity)

      if (repairJobId) {
        axiosInstance().get(`${repairJob.api}/` + repairJobId).then(({ data: { data } }) => {
          if (isClone) {
            const { _id, brand, createdBy, history, repairJobName, updatedBy, ...rest } = data;
            setTitle(`Clone - ${repairJobName}`)
            setDisablePlantIfAssetAdded(false);
            rest.repairJobName = `RJ_${generateUniqueIdOnly()}`;
            rest.status = `New`;
            setInitialData({
              fields: setFieldsInAscendingOrder(fieldsDataForCreate),
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate) }
            });
            setAllFields(fieldsDataForCreate);
            setLoading(false);
          } else {
            setTitle(`Editing - [${data.repairJobName}]`)
            setInitialData({
              fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setAllFields(fieldsDataForUpdate);
            axiosInstance().get(`${repairJob.api}/${repairJobId}/assets`)
              .then(({ data: { data } }) => {
                if (data.length) {
                  setDisablePlantIfAssetAdded(true);
                }
                else {
                  setDisablePlantIfAssetAdded(false);
                }
              }).catch((error) => {
              });
            setLoading(false);
          }
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });
      } else {
        setTitle('Create Repair Job')
        setDisablePlantIfAssetAdded(false);
        let initialData = { ...getObjKeys('', fieldsDataForCreate), expectedCompletionDate: "", repairJobName: `RJ_${generateUniqueIdOnly()}` };

        if (refrenceType === "Rental Job") {
          initialData["warehouse"] = refrenceData?.warehouse
          initialData["rentalJob"] = refrenceData?._id
          if (fieldsDataForCreate.some((e) => e.fieldName === "wellName")) {
            initialData["wellName"] = refrenceData?.wellName
          }
          if (fieldsDataForCreate.some((e) => e.fieldName === "afeNumber")) {
            initialData["afeNumber"] = refrenceData?.afeNumber
          }
        }
        if (refrenceType === "Product Inventory") {
          initialData["warehouse"] = refrenceData?.warehouse
        }

        setAllFields(fieldsDataForCreate);
        setInitialData({
          fields: setFieldsInAscendingOrder(fieldsDataForCreate),
          values: initialData
        });
        setLoading(false);
      }
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [repairJobId]);

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
      axiosInstance().post(`${repairJob.api}`, rest).then(({ data: { data, message } }) => {
        axiosInstance().put(`${repairJob.api}/${data._id}/process-status`, {
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

  return (<Dialog
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
    open={true}
  >
    {loading || !initialData.fields.length ? (
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
        innerRef={ref}
        initialValues={initialData.values}
        validationSchema={yupSchema(allFields)}
        validateOnMount
        onSubmit={handleSubmit}>
        {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues, submitForm }) => (
          <>
            <CustomDialogHeader
              title={title}
              onClose={(e, reason) => {
                if (!isEqual(ref.current.values, initialData.values)) {
                  setShowConfirmDialog(true)
                }
                else {
                  onClose()
                }
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form>
                {initialData.fields.length > 0 &&
                  initialData.fields.map((form, i) => {
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
                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                  {field.fieldName === "startDate"
                                    ? <FormTypes
                                      repairJobId={repairJobId}
                                      {...field}
                                      disabled={(!repairJobId && field.disableOnEdit)}
                                      values={values}
                                      fieldData={field}
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
                                        disabled={(!repairJobId && field.disableOnEdit)}
                                        values={values}
                                        fieldData={field}
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
                                            <Grid item xs={permissions?.warehouse?.isCreate ? 11 : 11}
                                              sm={permissions?.warehouse?.isCreate ? 11 : 11}
                                              md={permissions?.warehouse?.isCreate ? 11 : 11}
                                            >
                                              <FormTypes
                                                repairJobId={repairJobId}
                                                {...field}
                                                fieldData={field}
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
                                      ) : <FormTypes
                                        repairJobId={repairJobId}
                                        {...field}
                                        disabled={(!repairJobId && field.disableOnEdit) || (field.fieldName === "repairJobName")}
                                        values={values}
                                        errors={errors}
                                        fieldData={field}
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
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true)
                  }
                  else {
                    onClose()
                  }
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

  );
};

export default ManageRepairJob;
