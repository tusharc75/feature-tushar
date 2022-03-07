import { useState, useEffect, Fragment, useContext, useRef, FC } from 'react';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import { Formik, Form } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from 'src/components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, transferAsset, setFieldsInAscendingOrder, generateUniqueIdOnly } from 'src/constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import ManageWarehouse from '../Warehouse/ManageWarehouse';
import ManageAccountDialog from '../Account/ManageAccount/index';
import { FaDiceOne } from "react-icons/fa";

interface Props {
  isClone?: boolean;
  transferAssetId?: any;
  onClose?: any;
  onSuccess?: any;
  number?: string;
  isEditable?: boolean;
  isMainInfoEditable?: boolean;
  refrenceType?: string;
  refrenceId?: string;
  refrenceData?: any;
}

const ManageTransferAsset: FC<Props> = (props) => {
  const {
    state: { selectedEntity, permissions }
  }: any = useData();
  const { isClone = false, transferAssetId = null, onClose, onSuccess, number = '', isEditable = false, isMainInfoEditable = false,
    refrenceType = null, refrenceId = null, refrenceData = null } = props;

  const toastConfig = useContext(CustomToastContext);
  const initialRender = useRef(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState(null);

  const [plantsCategoryOptions, setPlantsCategoryOptions] = useState([]);
  const [plantsToCategoryOptions, setPlantsToCategoryOptions] = useState([]);
  const [supplierToCategoryOptions, setSupplierToCategoryOptions] = useState([]);
  const [customerToCategoryOptions, setCustomerToCategoryOptions] = useState([]);
  const [plantShipToOptions, setPlantShipToOptions] = useState([])
  const [supplierShipToOptions, setSupplierShipToOptions] = useState([])
  const [customerShipToOptions, setCustomerShipToOptions] = useState([])
  const [cloneHeading, setCloneHeading] = useState('')
  const [customerOpen, setCustomerOpen] = useState({ open: false, isClone: false });
  const [transferToPlantOpen, setTransferToPlantOpen] = useState({ open: false, isClone: false });
  const [plantsOpen, setPlantsOpen] = useState({ open: false, isClone: false });
  const [supplierOpen, setSupplierOpen] = useState({ open: false, isClone: false });

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        data = data.filter((obj) => obj?.fieldData?.fieldName !== "rentalJob");
      
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        const plantsOptions = data.find((obj) => obj?.fieldData.fieldName === 'transferFromPlant')?.fieldData.option;
        const plantsToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transfertoPlant')?.fieldData.option;
        const supplierToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transfertoSupplier')?.fieldData.option;
        const cusomerToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transfertoCustomer')?.fieldData.option;
        const plantToOptions = data.find((obj) => obj?.fieldData.fieldName === 'plantShipTo')?.fieldData.option;
        const customerShipToOptions = data.find((obj) => obj?.fieldData.fieldName === 'customerShipTo')?.fieldData.option;
        const supplierShipToOptions = data.find((obj) => obj?.fieldData.fieldName === 'supplierShipTo')?.fieldData.option;

        setPlantsCategoryOptions(plantsOptions);
        setPlantsToCategoryOptions(plantsToOptions);
        setSupplierToCategoryOptions(supplierToOptions);
        setCustomerToCategoryOptions(cusomerToOptions);
        setPlantShipToOptions(plantToOptions)
        setCustomerShipToOptions(customerShipToOptions)
        setSupplierShipToOptions(supplierShipToOptions)

        if (transferAssetId) {
          axiosInstance()
            .get(`${transferAsset.api}/` + transferAssetId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, entity, transferAssetNumber, ...rest } = data;
                let oldValues = { ...rest }
                oldValues.transferAssetNumber = `TA_${generateUniqueIdOnly()}`;
                oldValues.status = "New"
                setCloneHeading(transferAssetNumber)
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(oldValues, fieldsDataForCreate)
                });
              } else {
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
          setAllFields(fieldsDataForUpdate);
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          setAllFields(fieldsDataForCreate);
          createValues.transferAssetNumber = `TA_${generateUniqueIdOnly()}`;
          if (refrenceType === "Rental Job") {
            createValues["transferFromPlant"] = refrenceData?.transferFromPlant;
            createValues["transfertoPlant"] = refrenceData?.transferToPlant;
            fieldsDataForCreate?.forEach((e) => {
              if (e.fieldName === "transfertoPlant") {
                const plantAddress = e?.option?.filter((e) => e.optionValue === refrenceData?.transferToPlant)
                if (plantAddress.length) {
                  createValues["plantShipTo"] = plantAddress[0].address
                }
              }
            })
            createValues["rentalJob"] = refrenceId;
            if (fieldsDataForCreate.some((e) => e.fieldName === "wellName")) {
              createValues["wellName"] = refrenceData?.wellName
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === "afeNumber")) {
              createValues["afeNumber"] = refrenceData?.afeNumber
            }
          }
          setInitialData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [transferAssetId]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
    } else {
      let fields = initialData.fields;

      if (fields.length > 0 && formValues) {
        fields = fields.map((field) => {
          const sectionFields = field.sectionFields.map((_f) => {
            if (_f.fieldName === 'transfertoPlant' || _f.fieldName === 'plantShipTo') {
              if (formValues.transferType === 'Internal') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            if (_f.fieldName === 'transfertoCustomer' || _f.fieldName === 'customerShipTo') {
              if (formValues.transferType === 'External Customer') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            if (_f.fieldName === 'transfertoSupplier' || _f.fieldName === 'supplierShipTo') {
              if (formValues.transferType === 'External Supplier') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            return _f;
          });
          return {
            ...field,
            sectionFields
          };
        });
      }

      setInitialData({ ...initialData, fields });
    }
  }, [formValues]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (transferAssetId && isClone === false) {
      values._id = transferAssetId;
      axiosInstance()
        .put(`${transferAsset.api}`, values)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${transferAsset.api}`, values)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess(data);
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const isFieldNotTouched = (initialData, values) => {
    return (
      Object.values(simplifyValues(initialData.values, initialData?.fields[0]?.sectionFields || [])).toString() ===
      Object.values(simplifyValues(values, initialData?.fields[0]?.sectionFields || [])).toString()
    );
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {initialData.fields.length ? (
        <Formik
          innerRef={(ref) => {
            if (ref) {
              setFormValues(ref.values);
            } else {
              setFormValues(null);
            }
          }}
          initialValues={initialData.values}
          validationSchema={yupSchema(allFields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm, setErrors }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  transferAssetId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${routes.transferAsset.title} (${number})`
                    : 'Create ' + routes.transferAsset.title
                }
                onClose={() => {
                  if (isFieldNotTouched(initialData, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {initialData.fields.length > 0 &&
                    initialData.fields.map((form, i) => (
                      <div key={i}>
                        <div className={"detail-box-content"}>
                          <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                          <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container alignItems="center">
                            {form.sectionFields.map((field, index2) =>
                              field.fieldName === 'transfertoPlant' || field.fieldName === 'plantShipTo' ? (
                                values?.transferType.includes('Internal') && (
                                  <Fragment key={index2}>
                                    {field.fieldName === 'transfertoPlant' && (
                                      <Grid item xs={12} sm={6} md={6}>
                                        <Grid container spacing={1} alignItems="center">
                                          <Grid item xs={isMainInfoEditable ? 12 : !isMainInfoEditable && permissions?.warehouse.isCreate ? 11 : 12}>
                                            <FormTypes
                                              isNew={Boolean(transferAssetId)}
                                              {...field}
                                              disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                              values={values}
                                              errors={{ ...errors }}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={plantsToCategoryOptions.filter((val) => val.optionValue !== values?.transferFromPlant) ?? []}
                                              setFieldValue={(name, value) => {
                                                // handleValuesChange({ [name]: value })
                                                setFieldValue(name, value);
                                                const address = field.option?.find((_d: any) => _d?.optionValue === value)?.address ?? '';
                                                setFieldValue('plantShipTo', address);
                                              }}
                                              required={values?.transferType.includes('Internal')}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                            />
                                          </Grid>
                                          {!isMainInfoEditable && permissions?.warehouse.isCreate && (
                                            <Grid item xs={1}>
                                              <HtmlTooltip title="Add new plant">
                                                <IconButton size="small" onClick={() => setTransferToPlantOpen({ open: true, isClone: false })}>
                                                  <AddIcon fontSize="small" color={'primary'} />
                                                </IconButton>
                                              </HtmlTooltip>
                                            </Grid>
                                          )}
                                        </Grid>
                                      </Grid>
                                    )}
                                    {field.fieldName === 'plantShipTo' && (
                                      <Grid key={index2} item xs={12} sm={6} md={6}>
                                        <FormTypes
                                          isNew={Boolean(transferAssetId)}
                                          {...field}
                                          disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                          values={values}
                                          errors={{ ...errors }}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={plantShipToOptions.filter(plant => plant?.optionValue === plantsToCategoryOptions.find(p => p.optionValue === values?.transfertoPlant)?.address) ?? []}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={values?.transferType.includes('Internal')}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      </Grid>
                                    )}
                                  </Fragment>
                                )
                              ) : field.fieldName === 'transfertoSupplier' || field.fieldName === 'supplierShipTo' ? (
                                values?.transferType.includes('Supplier') && (
                                  <Fragment key={index2}>
                                    {field.fieldName === 'transfertoSupplier' && (
                                      <Grid key={index2} item xs={12} sm={6} md={6}>
                                        <Grid container spacing={1} alignItems="center">
                                          <Grid
                                            item
                                            xs={isMainInfoEditable ? 12 : !isMainInfoEditable && permissions?.supplierAccount.isCreate ? 11 : 12}
                                          >
                                            <FormTypes
                                              isNew={Boolean(transferAssetId)}
                                              {...field}
                                              disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={supplierToCategoryOptions}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                                const address = field.option?.find((_d: any) => _d?.optionValue === value)?.shippingAddress ?? [];
                                                const options = supplierShipToOptions.filter(option => address.includes(option.optionValue))
                                                setSupplierShipToOptions(options)
                                                setFieldValue('supplierShipTo', "");
                                              }}
                                              required={values?.transferType.includes('Supplier')}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                            />
                                          </Grid>
                                          {!isMainInfoEditable && permissions?.supplierAccount.isCreate && (
                                            <Grid item xs={1}>
                                              <HtmlTooltip title="Add new supplier account">
                                                <IconButton size="small" onClick={() => setSupplierOpen({ open: true, isClone: false })}>
                                                  <AddIcon fontSize="small" color={'primary'} />
                                                </IconButton>
                                              </HtmlTooltip>
                                            </Grid>
                                          )}
                                        </Grid>
                                      </Grid>
                                    )}
                                    {field.fieldName === 'supplierShipTo' && (
                                      <Grid key={index2} item xs={12} sm={6} md={6}>
                                        <FormTypes
                                          isNew={Boolean(transferAssetId)}
                                          {...field}
                                          disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={supplierShipToOptions}
                                          setFieldValue={(name, value) => setFieldValue(name, value)}
                                          required={values?.transferType.includes('Supplier')}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      </Grid>
                                    )}
                                  </Fragment>
                                )
                              ) : field.fieldName === 'transfertoCustomer' || field.fieldName === 'customerShipTo' ? (
                                values?.transferType.includes('Customer') && (
                                  <Fragment key={index2}>
                                    {field.fieldName === 'transfertoCustomer' && (
                                      <Grid key={index2} item xs={12} sm={6} md={6}>
                                        <Grid container spacing={1} alignItems="center">
                                          <Grid
                                            item
                                            xs={isMainInfoEditable ? 12 : !isMainInfoEditable && permissions?.customerAccount.isCreate ? 11 : 12}
                                          >
                                            <FormTypes
                                              isNew={Boolean(transferAssetId)}
                                              {...field}
                                              disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={customerToCategoryOptions}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                                const address = field.option?.find((_d: any) => _d?.optionValue === value)?.shippingAddress ?? [];
                                                const options = customerShipToOptions.filter(option => address.includes(option.optionValue))
                                                setCustomerShipToOptions(options)
                                                setFieldValue('customerShipTo', '');
                                              }}
                                              required={values?.transferType.includes('Customer')}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                            />
                                          </Grid>
                                          {!isMainInfoEditable && permissions?.customerAccount.isCreate && (
                                            <Grid item xs={1}>
                                              <HtmlTooltip title="Add new customer account">
                                                <IconButton size="small" onClick={() => setCustomerOpen({ open: true, isClone: false })}>
                                                  <AddIcon fontSize="small" color={'primary'} />
                                                </IconButton>
                                              </HtmlTooltip>
                                            </Grid>
                                          )}
                                        </Grid>
                                      </Grid>
                                    )}
                                    {field.fieldName === 'customerShipTo' && (
                                      <Grid key={index2} item xs={12} sm={6} md={6}>
                                        <FormTypes
                                          isNew={Boolean(transferAssetId)}
                                          {...field}
                                          disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={customerShipToOptions}
                                          setFieldValue={(name, value) => setFieldValue(name, value)}
                                          required={values?.transferType.includes('Customer')}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      </Grid>
                                    )}
                                  </Fragment>
                                )
                              ) : field.fieldName === 'transferType' ? (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    isNew={Boolean(transferAssetId)}
                                    {...field}
                                    disabled={Boolean(transferAssetId) && (isMainInfoEditable || field.disableOnEdit)}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    onChange={(e, val) => {
                                      setFieldValue(field.fieldName, val?.optionValue ?? '');

                                      // DO THIS WHEN CHANGING TYPE
                                      setFieldValue('transfertoCustomer', '');
                                      setFieldValue('transfertoSupplier', '');
                                      setFieldValue('transfertoPlant', '');
                                      setFieldValue('customerShipTo', '');
                                      setFieldValue('supplierShipTo', '');
                                      setFieldValue('plantShipTo', '');
                                    }}
                                  />
                                </Grid>
                              ) : field.fieldName === 'transferFromPlant' ? (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <Grid container spacing={1} alignItems="center">
                                    <Grid item xs={isMainInfoEditable ? 12 : !isMainInfoEditable && permissions?.warehouse.isCreate ? 11 : 12}>
                                      <FormTypes
                                        isNew={Boolean(transferAssetId)}
                                        {...field}
                                        disabled={Boolean(transferAssetId) && (isEditable || field.disableOnEdit)}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={plantsCategoryOptions?.filter((o: any) => o?.entity.includes(selectedEntity)) ?? []}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                          const address = field.option?.find((_d: any) => _d?.optionValue === value)?.address ?? '';
                                          if (address === values?.plantShipTo) {
                                            setFieldValue('plantShipTo', '');
                                            setFieldValue('transfertoPlant', '');
                                          }
                                        }}
                                      />
                                    </Grid>
                                    {!isEditable && !isMainInfoEditable && permissions?.warehouse.isCreate && (
                                      <Grid item xs={1}>
                                        <HtmlTooltip title="Add new plant">
                                          <IconButton size="small" onClick={() => setPlantsOpen({ open: true, isClone: false })}>
                                            <AddIcon fontSize="small" color={'primary'} />
                                          </IconButton>
                                        </HtmlTooltip>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Grid>
                              ) : (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    isNew={Boolean(transferAssetId)}
                                    {...field}
                                    disabled={
                                      (Boolean(transferAssetId) && field.disableOnEdit) ||
                                      (field.fieldName === 'status' && true) ||
                                      (field.fieldName === 'transferAssetNumber' && true)
                                    }
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      // handleValuesChange({ [name]: value })
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                </Grid>
                              )
                            )}
                          </Grid>
                        </Box>

                        {transferToPlantOpen?.open && (
                          <ManageWarehouse
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={transferToPlantOpen?.open}
                            close={() => setTransferToPlantOpen({ open: false, isClone: false })}
                            isClone={transferToPlantOpen?.isClone}
                            onSuccess={async ({ data }) => {
                              setTransferToPlantOpen({ open: false, isClone: false });
                              setFieldValue('transfertoPlant', data._id);
                              const { data: { data: addressData } } = await axiosInstance().get(`warehouse/${data._id}`)
                              setPlantShipToOptions(prevState => [{ ...addressData?.address, default: false, order: prevState.length }, ...prevState])
                              setFieldValue('plantShipTo', data.address);
                              setPlantsToCategoryOptions((prevState) => {
                                return [
                                  ...prevState,
                                  {
                                    optionValue: data._id,
                                    optionLabel: data.warehouseName,
                                    order: plantsCategoryOptions.length,
                                    address: data.address,
                                    default: false,
                                    entity: data.entity
                                  }
                                ];
                              });

                            }}
                          />
                        )}
                        {plantsOpen?.open && (
                          <ManageWarehouse
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={plantsOpen?.open}
                            close={() => setPlantsOpen({ open: false, isClone: false })}
                            isClone={plantsOpen?.isClone}
                            onSuccess={({ data }) => {
                              setPlantsOpen({ open: false, isClone: false });
                              setFieldValue('transferFromPlant', data._id);

                              setPlantsCategoryOptions((prevState) => {
                                return [
                                  ...prevState,
                                  {
                                    optionValue: data._id,
                                    optionLabel: data.warehouseName,
                                    order: plantsCategoryOptions.length,
                                    address: data.address,
                                    default: false,
                                    entity: data.entity
                                  }
                                ];
                              });

                            }}
                          />
                        )}

                        {supplierOpen?.open && (
                          <ManageAccountDialog
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={supplierOpen?.open}
                            onClose={() => setSupplierOpen({ open: false, isClone: false })}
                            isClone={supplierOpen?.isClone}
                            accountResource="supplierAccount"
                            accountApi="supplier-account"
                            isRedirectToDetailPage={false}
                            onSuccess={({ data }) => {
                              setSupplierOpen({ open: false, isClone: false });

                              if (data._id) {
                                setFieldValue('transfertoSupplier', data._id);
                                setSupplierToCategoryOptions((prevState) => {
                                  return [
                                    ...prevState,
                                    {
                                      optionValue: data._id,
                                      optionLabel: data.accountName,
                                      order: supplierToCategoryOptions.length,
                                      default: false
                                    }
                                  ];
                                });
                              }
                            }}
                          />
                        )}

                        {customerOpen?.open && (
                          <ManageAccountDialog
                            // isUpdateDisabled={false}
                            // productCategoryId={productCategoryId}
                            open={customerOpen?.open}
                            onClose={() => setCustomerOpen({ open: false, isClone: false })}
                            isClone={customerOpen?.isClone}
                            accountResource="customerAccount"
                            accountApi="customer-account"
                            isRedirectToDetailPage={false}
                            onSuccess={({ data }) => {
                              setCustomerOpen({ open: false, isClone: false });

                              if (data._id) {
                                setFieldValue('transfertoCustomer', data._id);
                                setCustomerToCategoryOptions((prevState) => {
                                  return [
                                    ...prevState,
                                    {
                                      optionValue: data._id,
                                      optionLabel: data.accountName,
                                      order: supplierToCategoryOptions.length,
                                      default: false
                                    }
                                  ];
                                });
                              }
                            }}
                          />
                        )}
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isFieldNotTouched(initialData, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton loading={isSubmitting} disabled={isSubmitting} variant="contained" color="primary" type="submit" onClick={submitForm}>
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>

              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageTransferAsset;
