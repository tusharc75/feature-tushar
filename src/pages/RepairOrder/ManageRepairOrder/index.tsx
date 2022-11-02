import { useState, useEffect, useContext } from "react";
import { Formik, Form } from "formik";
import { Box, Button, Grid, IconButton, Tooltip } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import {
  CustomDialogTransition, customerAccount, customerContact, getCollaboratorDropdownDataSource, getObjKeys,
  getObjKeysWithValues, getOwnerDropdownDataSource, isFieldNotTouched, setFieldsInAscendingOrder, yupSchema,
  generateUniqueIdOnly,
  repairOrder
} from "../../../constants/helpers";
import axiosInstance from '../../../axios/axiosInstance'
import Dialog from "@material-ui/core/Dialog";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog";
import Skeleton from "@material-ui/lab/Skeleton/Skeleton";
import { useHistory } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { FaDiceOne } from "react-icons/fa";
import moment from "moment";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageAccountDialog from "../../Account/ManageAccount";
import ManageContactDialog from "../../Contact/ManageContact";
import ManageWarehouse from "src/pages/Warehouse/ManageWarehouse";

const ManageRepairOrder = ({ isClone = false, repairOrderId = null, onClose, onSuccess, refrenceType = null, refrenceData = null }) => {

  const history = useHistory()
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [repairOrderInitialData, setRepairOrderInitialData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const {
    state: { user, permissions, selectedEntity },
  }: any = useData();
  const [formValues, setFormValues] = useState({})
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [contactData, setContactData] = useState([]);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] =
    useState(false);
  const [showAddCustomerContactDialog, setShowAddCustomerContactDialog] =
    useState(false);

  const [accountData, setAccountData] = useState([]);
  const [repairOrderData, setRepairOrderData] = useState(null);
  const [customerContactMainDataSource, setCustomerContactMainDataSource] = useState([]);
  const [customerContactDataSource, setCustomerContactDataSource] = useState([]);
  const [newAddedAccountId, setNewAddedAccountId] = useState(null);

  const [cloneHeading, setCloneHeading] = useState('');

  const [optionsPlantsEntity, setOptionsPlantsEntity] = useState([]);
  const [showAddWarehouseDialog, setShowAddWarehouseDialog] = useState(false);
  const [disablePlantIfAssetAdded, setDisablePlantIfAssetAdded] = useState(true)

  const updateAccountDropdown = (data) => {
    const entityFields = repairOrderInitialData.fields;
    const customerAccountNameFieldIndex = entityFields.findIndex(
      (d) => d.fieldName === "customerAccount"
    );
    if (customerAccountNameFieldIndex > -1) {
      entityFields[customerAccountNameFieldIndex].option = [
        ...entityFields[customerAccountNameFieldIndex].option,
        {
          optionValue: data._id,
          optionLabel: data.accountName,
          order: entityFields[customerAccountNameFieldIndex].option.length,
          default: false,
        },
      ];
      setAccountData(entityFields[customerAccountNameFieldIndex].option);
    }
  };

  const updateContactDropdown = (data) => {
    const entityFields = repairOrderInitialData.fields;
    const customerContactNameFieldIndex = entityFields.findIndex(
      (d) => d.fieldName === "customerContact"
    );
    if (customerContactNameFieldIndex > -1) {
      const newCustomer = {
        optionValue: data._id,
        optionLabel: `${data.firstName} ${data.lastName}`,
        order: entityFields[customerContactNameFieldIndex].option.length,
        default: false,
        parentAccount: data.accountName,
      };
      entityFields[customerContactNameFieldIndex].option = [
        ...entityFields[customerContactNameFieldIndex].option,
        newCustomer,
      ];
      setCustomerContactMainDataSource(
        entityFields[customerContactNameFieldIndex].option
      );
      setCustomerContactDataSource((prevState) => [...prevState, newCustomer]);
    }
  };

  useEffect(() => {
    const ownerCollabOptions = repairOrderInitialData.fields.filter(
      (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
    );
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }
    let customerAccountOptions = repairOrderInitialData.fields.find(
      (d) => d.fieldName === "customerAccount"
    );
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }
    let customerContactOptions = repairOrderInitialData.fields.find(
      (d) => d.fieldName === "customerContact"
    );
    if (customerContactOptions) {
      setContactData(customerContactOptions.option);
    }
    const customerContactDropdownData = repairOrderInitialData.fields.find(
      (d) => d.fieldName === "customerContact"
    );

    if (customerContactDropdownData) {
      setCustomerContactMainDataSource(customerContactDropdownData.option);
      if (repairOrderId) {
        setCustomerContactDataSource(
          customerContactDropdownData.option.filter(
            (d) =>
              d.parentAccount === repairOrderData?.customerAccount.optionValue
          )
        );
      }
    }
    setFormsData(setFieldsInAscendingOrder(repairOrderInitialData.fields));
  }, [repairOrderInitialData.fields]);

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

  const onCustomerContactDropdownOpen = (selectedAccount) => {
    setCustomerContactDataSource(
      customerContactMainDataSource.filter(
        (d) => d.parentAccount === selectedAccount
      )
    );
  };

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [repairOrderId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get("/field?resource=Repair Order");
      fieldData = response?.data?.data;

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      const plantsOptions = fieldData.find((obj) => ["plant", "warehouse"].indexOf(obj?.fieldData.fieldName) > -1)?.fieldData?.option ?? [];
      setOptionsPlantsEntity(plantsOptions);
      if (repairOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${repairOrder.api}/` + repairOrderId);
          data = response?.data?.data;
          setRepairOrderData(data)
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, repairOrderNumber, updatedBy, ...rest } = data
            setDisablePlantIfAssetAdded(false);
            rest.status = "New"
            rest.repairOrderNumber = `RO_${generateUniqueIdOnly()}`
            setCloneHeading(repairOrderNumber)
            setRepairOrderInitialData({
              fields: fieldsDataForCreate,
              initialValues: getObjKeysWithValues(rest, fieldsDataForCreate),
            });
            setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate))
            setLoading(false)
          } else {
            setRepairOrderInitialData({
              fields: fieldsDataForUpdate,
              initialValues: getObjKeysWithValues(data, fieldsDataForUpdate),
            });
            setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate))
            setLoading(false)
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      }
      else {
        let initialData = { ...getObjKeys("", fieldsDataForCreate) };
        initialData['repairOrderNumber'] = `RO_${generateUniqueIdOnly()}`
        setDisablePlantIfAssetAdded(false);
        setRepairOrderInitialData({
          fields: fieldsDataForCreate,
          initialValues: initialData,
        });
        setFormValues(initialData)
        setLoading(false)
      }

    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const handleSubmit = async (
    errors,
    setTouched,
    values,
    setValues,
    setErrors
  ) => {
    if (Object.keys(errors).length) {
      repairOrderInitialData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleUpdateRepairJorepairOrder(values)
    }
  };

  const handleUpdateRepairJorepairOrder = (values) => {
    setLoading(true);
    if (repairOrderId && isClone === false) {
      values._id = repairOrderId;
      axiosInstance()
        .put(`${repairOrder.api}`, values)
        .then(({ data }) => {
          setLoading(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      const { productInventory, ...rest } = values
      axiosInstance().post(`${repairOrder.api}`, rest).then(({ data: { data, message } }) => {
        if (!refrenceType) {
          history.push(`${routes.repairOrderDetail.path}/${data._id}`);
        }
        setLoading(false);
        onSuccess(data);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
      })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(
        `input[name=${err[0]}]`,
      );
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start',
      });
    }
  }

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }))
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
            setShowConfirmDialog(true)
          }
        }}
        open={true}
      >
        <CustomDialogHeader
          title={
            !repairOrderId
              ? `Create ${routes.repairOrder.title}`
              : `${isClone ? `Clone - ${cloneHeading}` : `Update ${repairOrderData?.repairOrderNumber}`}`
          }
          onClose={(e, reason) => {
            if (isFieldNotTouched(repairOrderInitialData, formValues)) onClose()
            else setShowConfirmDialog(true)
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
        {!repairOrderInitialData.fields.length ? (
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
              <Button variant="outlined" size="small" color="primary" disabled
              >
                Cancel
              </Button>
              <Button variant="contained" size="small" color="primary" disabled>
                Submit
              </Button>
            </CustomDialogFooter>
          </>
        ) : (
          <Formik
            initialValues={repairOrderInitialData.initialValues}
            validationSchema={yupSchema(repairOrderInitialData.fields)}
            validateOnMount
            onSubmit={() => { }}
          >
            {({
              values,
              errors,
              touched,
              setFieldValue,
              setFieldTouched,
              setErrors,
              setValues,
            }) => (
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
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}   >
                                    {field.fieldName == "customerAccount" ? (
                                      <Grid container spacing={1}>
                                        <Grid item xs={permissions.customerAccount?.isCreate ? 11 : 11}
                                          sm={permissions.customerAccount?.isCreate ? 11 : 11}
                                          md={permissions.customerAccount?.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            isNew={!repairOrderId}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountData}
                                            disabled={!isClone ? (repairOrderId && field.disableOnEdit) : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={
                                              field?.isTooltip || false
                                            }
                                            tooltipMessage={
                                              field?.tooltipMessage
                                            }
                                            size="small"
                                            doNotShowInfoTooltip={true}
                                            onChange={(e, value) => {
                                              setFieldValue(
                                                field.fieldName,
                                                value && value.optionValue
                                                  ? value.optionValue
                                                  : ""
                                              );
                                              if (repairOrderInitialData.fields.find((d) => d.fieldName === "customerContact")) {
                                                setFieldValue("customerContact", "");
                                                handleValuesChange({
                                                  [field.fieldName]: value && value.optionValue ? value.optionValue : "",
                                                  "customerContact": "",
                                                })
                                              }
                                            }}
                                          />
                                        </Grid>
                                        {permissions.customerAccount?.isCreate &&
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip
                                              title="Create Account"
                                              className="mt-1"
                                            >
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddCustomerAccountDialog(
                                                    true
                                                  );
                                                }}
                                                disabled={!isClone ? (repairOrderId && field.disableOnEdit) : false}
                                                size="small"
                                              >
                                                <AddIcon color={isClone ? "primary" : repairOrderId && field.disableOnEdit ? "disabled" : "primary"} />
                                              </IconButton>
                                            </Tooltip>
                                          </Grid>
                                        }
                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip
                                              title={
                                                field?.tooltipMessage ?? ""
                                              }
                                            >
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                      </Grid>
                                    ) : field.fieldName === "customerContact" ? (
                                      <Grid container spacing={1}>
                                        <Grid item xs={permissions.customerContact?.isCreate ? 11 : 11}
                                          sm={permissions.customerContact?.isCreate ? 11 : 11}
                                          md={permissions.customerContact?.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            isNew={!repairOrderId}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={customerContactDataSource}
                                            doNotShowInfoTooltip={true}
                                            setFieldValue={(name, value) => {
                                              handleValuesChange({ [name]: value })
                                              setFieldValue(name, value)
                                            }}
                                            disabled={!isClone ? (repairOrderId && field.disableOnEdit) : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={false}
                                            size="small"
                                            onOpen={() =>
                                              onCustomerContactDropdownOpen(
                                                values["customerAccount"]
                                              )
                                            }
                                          // onChange={(e, value) => {
                                          //   setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");

                                          // }}
                                          />
                                        </Grid>
                                        {permissions.customerContact?.isCreate &&
                                          <Grid item xs={1} sm={1} md={1} >
                                            <Tooltip
                                              title="Create Contact"
                                              className="mt-1"
                                            >
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddCustomerContactDialog(
                                                    true
                                                  );
                                                }}
                                                disabled={!isClone ? (repairOrderId && field.disableOnEdit) : false}
                                                size="small"
                                              >
                                                <AddIcon color={isClone ? "primary" : (repairOrderId && field.disableOnEdit) ? "disabled" : "primary"} />
                                              </IconButton>
                                            </Tooltip>
                                          </Grid>
                                        }
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
                                    ) : field.fieldName === "owner" ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={ownerData}
                                        onChange={(e, val) => {
                                          setFieldValue(
                                            field.fieldName,
                                            val && val.optionValue
                                              ? val.optionValue
                                              : ""
                                          );
                                          handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })

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
                                                collaborator: collaboratorData.find(
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
                                        disabled={(repairOrderId && field.disableOnEdit)}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(
                                            values["collaborator"]
                                          );
                                        }}
                                      />
                                    ) : field.fieldName === "collaborator" ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        disabled={!repairOrderId && field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={collaboratorData}
                                        setFieldValue={(name, value) => {
                                          handleValuesChange({ [name]: value })
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
                                    ) : field.fieldName === "startDate"
                                      ? <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        disabled={(repairOrderId && field.disableOnEdit)}
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
                                          repairOrderId={repairOrderId}
                                          {...field}
                                          disabled={(repairOrderId && field.disableOnEdit)}
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
                                                  repairOrderId={repairOrderId}
                                                  {...field}
                                                  fieldData={field}
                                                  disabled={disablePlantIfAssetAdded || (repairOrderId && field.disableOnEdit)}
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
                                                      disabled={disablePlantIfAssetAdded || (repairOrderId && field.disableOnEdit)}
                                                      size="small"
                                                    >
                                                      <AddIcon color={disablePlantIfAssetAdded || (repairOrderId && field.disableOnEdit) ? "disabled" : "primary"} />
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
                                        )
                                          : (
                                            <FormTypes
                                              repairOrderId={repairOrderId}
                                              {...field}
                                              fieldData={field}
                                              disabled={(repairOrderId && field.disableOnEdit) || (field.fieldName === "repairOrderNumber")}
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
                                              imageOrFileUploadCompletePercentage={
                                                ["imageUpload", "fileUpload"].some(
                                                  (s) => s === field.type
                                                )
                                                  ? (completePercentage) => {
                                                    setUploadingImageOrFileProgress(
                                                      completePercentage
                                                    );
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
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (isFieldNotTouched(repairOrderInitialData, values)) onClose()
                      else setShowConfirmDialog(true)
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={
                      // loading || Object.keys(errors).length > 0 ? true : false
                      uploadingImageOrFileProgress > 0 ||
                      // isFieldNotTouched(repairOrderInitialData, values) ||
                      loading
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors)
                      handleSubmit(
                        errors,
                        setFieldTouched,
                        values,
                        setValues,
                        setErrors
                      );
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
                {
                  showConfirmDialog ?
                    <ConfirmCancelDialog
                      open={showConfirmDialog}
                      onSave={() => {
                        setShowConfirmDialog(false)
                        handleScroll(errors)

                        handleSubmit(
                          errors,
                          setFieldTouched,
                          values,
                          setValues,
                          setErrors
                        );
                      }}
                      onClose={() => {
                        setShowConfirmDialog(false)
                        onClose()
                      }}
                    /> : null
                }
                {showAddCustomerAccountDialog && (
                  <ManageAccountDialog
                    open={showAddCustomerAccountDialog}
                    onClose={() => {
                      setShowAddCustomerAccountDialog(false);
                    }}
                    id={null}
                    accountResource={customerAccount.accountResource}
                    accountApi={customerAccount.accountApi}
                    isGetAccountData={true}
                    onGetAddedAccount={({ data }) => {
                      setNewAddedAccountId(data._id);
                      updateAccountDropdown(data);

                      setFieldValue("customerAccount", data._id);
                      setFieldValue("customerContact", "");
                    }}
                    isRedirectToDetailPage={false}
                  />
                )}
                {showAddCustomerContactDialog && (
                  <ManageContactDialog
                    open={showAddCustomerContactDialog}
                    onClose={() => setShowAddCustomerContactDialog(false)}
                    onSuccess={(obj) => {
                      if (obj) {
                        setShowAddCustomerContactDialog(false);
                        updateContactDropdown(obj.data.data);

                        setFieldValue("customerContact", obj.id);
                      }
                    }}
                    accountId={values["customerAccount"]}
                    contactResource={customerContact.contactResource}
                    contactApi={customerContact.contactApi}
                    isRedirectToDetailPage={false}
                    collaborators={collaboratorData}
                    owner={ownerData}
                    account={customerAccount}
                    isAccountFieldDisable={true}
                  />
                )}
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
                        setFieldValue("warehouse", data._id);
                      }
                    }}
                  />}
              </>
            )}
          </Formik>
        )}
      </Dialog>



    </>
  );

}

export default ManageRepairOrder;

