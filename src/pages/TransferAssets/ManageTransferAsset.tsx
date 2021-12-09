import { useState, useEffect, Fragment, useContext, useRef, FC } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import { IconButton, Tooltip } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, transferAsset, setFieldsInAscendingOrder, generateUniqueIdOnly } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues, RESOURCE_LABEL } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useData } from "../../StateProvider/Provider";
import ManageWarehouse from "../Warehouse/ManageWarehouse"
import ManageAccountDialog from "../Account/ManageAccount/index";

interface Props {
  isClone?: boolean;
  transferAssetId?: any;
  onClose?: any;
  onSuccess?: any;
  number?: string;
  isEditable?: boolean;
  isMainInfoEditable?: boolean;
}

const ManageTransferAsset: FC<Props> = (props) => {
  const {
    state: { selectedEntity,permissions },
  }: any = useData();
  const { isClone = false, transferAssetId = null, onClose, onSuccess, number = '', isEditable = false, isMainInfoEditable = false } = props;
  const toastConfig = useContext(CustomToastContext);
  const initialRender = useRef(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [plantsCategoryOptions, setPlantsCategoryOptions] = useState([]);
  const [plantsToCategoryOptions, setPlantsToCategoryOptions] = useState([]);
  const [supplierToCategoryOptions,setSupplierToCategoryOptions] = useState([]);
  const [customerToCategoryOptions, setCustomerToCategoryOptions]= useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [customerOpen, setCustomerOpen] = useState({open: false, isClone: false})
  const [transferToPlantOpen,setTransferToPlantOpen]= useState({open: false, isClone: false})
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [plantsOpen, setPlantsOpen] = useState({ open: false, isClone: false });
  const[supplierOpen, setSupplierOpen] = useState({open:false,isClone: false});
  


  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        const plantsOptions = data.find((obj) => obj?.fieldData.fieldName === 'transferFromPlant')?.fieldData.option;
        const plantsToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transferToPlant')?.fieldData.option;
        const supplierToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transferToSupplier')?.fieldData.option;
        const cusomerToOptions = data.find((obj) => obj?.fieldData.fieldName === 'transferToCustomer')?.fieldData.option;

        setPlantsCategoryOptions(plantsOptions);
        setPlantsToCategoryOptions(plantsToOptions);
        setSupplierToCategoryOptions(supplierToOptions);
        setCustomerToCategoryOptions(cusomerToOptions);
        

        
       
        if (transferAssetId) {
          axiosInstance()
            .get(`${transferAsset.api}/` + transferAssetId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, entity, ...rest } = data;

                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(rest, fieldsDataForCreate)
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
          createValues.transferAssetNumber = `TA_${generateUniqueIdOnly()}`
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
            if (_f.fieldName === 'transferToPlant' || _f.fieldName === 'plantShipTo') {
              if (formValues.transferType === 'Internal') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            if (_f.fieldName === 'transferToCustomer' || _f.fieldName === 'customerShipTo') {
              if (formValues.transferType === 'External Customer') {
                _f.required = true;
              } else {
                _f.required = false;
              }
            }
            if (_f.fieldName === 'transferToSupplier' || _f.fieldName === 'supplierShipTo') {
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
                      ? 'Clone'
                      : `Update ${RESOURCE_LABEL.transferAsset} (${number})`
                    : 'Create ' + RESOURCE_LABEL.transferAsset
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
                        <h2 className="form-label-style">{form.name}</h2>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) =>
                              field.fieldName === 'transferToPlant'  || field.fieldName === 'plantShipTo' ? (
                                values?.transferType.includes('Internal') && (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                     <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
                                        >
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
                                      options={plantsToCategoryOptions}
                                      setFieldValue={(name, value) => {
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value);
                                        if (field.fieldName === 'transferToPlant') {
                                          const address = field.option?.find((_d: any) => _d?.optionValue === value)?.address ?? '';
                                          setFieldValue('plantShipTo', address);
                                        }
                                      }}
                                      required={values?.transferType.includes('Internal')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                   {  field.fieldName === 'transferToPlant' ? 
                                  <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Transfer to Plant" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setPlantsOpen({ open: true, isClone: false });
                                              }}
                                              // disabled={!isNew && field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Grid>
                                      :null}

                                        { field.fieldName === 'transferToPlant' &&  field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                  </Grid>
                                  </Grid>
                                  </Grid>
                                )
                              ) : field.fieldName === 'transferToSupplier' || field.fieldName === 'supplierShipTo' ? (
                                values?.transferType.includes('Supplier') && (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                     <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
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
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value);
                                        if (field.fieldName === 'transferToSupplier') {
                                          setFieldValue('supplierShipTo', '');
                                        }
                                      }}
                                      required={values?.transferType.includes('Supplier')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                  {field.fieldName === 'transferToSupplier'?
                                  <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Transfer To Supplier" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setSupplierOpen({ open: true, isClone: false });
                                              }}
                                              // disabled={!isNew && field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Grid>
                                        :null}

                                        {field.fieldName === 'transferToSupplier'&& field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                  </Grid>
                                  </Grid>
                                  </Grid>
                                )
                              ) : field.fieldName === 'transferToCustomer' || field.fieldName === 'customerShipTo' ? (
                                values?.transferType.includes('Customer') && (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
                                        >
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
                                      options={customerToCategoryOptions}
                                      setFieldValue={(name, value) => {
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value);
                                        if (field.fieldName === 'transferToCustomer') {
                                          setFieldValue('customerShipTo', '');
                                        }
                                      }}
                                      required={values?.transferType.includes('Customer')}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  </Grid>
                                  {field.fieldName === 'transferToCustomer' ?
                                  <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Manufacturer" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setCustomerOpen({ open: true, isClone: false });
                                              }}
                                              // disabled={!isNew && field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Grid>
                                        :null}

                                        {field.fieldName === 'transferToCustomer' && field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                  </Grid>
                                  </Grid>
                                  </Grid>
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
                                      setFieldValue('transferToCustomer', '');
                                      setFieldValue('transferToSupplier', '');
                                      setFieldValue('transferToPlant', '');
                                      setFieldValue('customerShipTo', '');
                                      setFieldValue('supplierShipTo', '');
                                      setFieldValue('plantShipTo', '');
                                    }}
                                  />
                                </Grid>
                              ) : field.fieldName === 'transferFromPlant' ? (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                   <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
                                        >
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
                                    options={plantsCategoryOptions}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                      const address = field.option?.find((_d: any) => _d?.optionValue === value)?.address ?? '';
                                      if (address === values?.plantShipTo) {
                                        setFieldValue('plantShipTo', "");
                                        setFieldValue('transferToPlant', "");
                                      }
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Tranfer From Plant" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setTransferToPlantOpen({ open: true, isClone: false });
                                              }}
                                              // disabled={!isNew && field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Grid>

                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                </Grid>
                                </Grid>
                                </Grid>
                              ) : (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    isNew={Boolean(transferAssetId)}
                                    {...field}
                                    disabled={(Boolean(transferAssetId) && field.disableOnEdit) || (field.fieldName === 'status' && true) || (field.fieldName === 'transferAssetNumber' && true)}
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
                      </div>
                    ))}
                </Form>
                {transferToPlantOpen?.open && (
        <ManageWarehouse
          // isUpdateDisabled={false}
          // productCategoryId={productCategoryId}
          open = {transferToPlantOpen?.open}
         close={()=>setTransferToPlantOpen({ open: false, isClone: false })}
          isClone={transferToPlantOpen?.isClone}
         
          onSuccess={({data}) => {
        
            setTransferToPlantOpen({ open: false, isClone: false });
            if(data._id){
                setFieldValue("transferFromPlant", data._id);
                setPlantsCategoryOptions((prevState) => {     
                    return [
                        ...prevState,
                        {
                            optionValue: data._id,
                            optionLabel: data.warehouseName,
                            order: plantsCategoryOptions.length,
                            default: false
                        },
                    ];
                });
            }
           
          }
        }
        />
      )}
      {plantsOpen?.open && (
        <ManageWarehouse
          // isUpdateDisabled={false}
          // productCategoryId={productCategoryId}
          open = {plantsOpen?.open}
         close={()=>setPlantsOpen({ open: false, isClone: false })}
          isClone={plantsOpen?.isClone}
         
          onSuccess={({data}) => {
        
            setPlantsOpen({ open: false, isClone: false });
            if(data._id){
                setFieldValue("transferToPlant", data._id);
                setFieldValue('plantShipTo', data.address);
                setPlantsToCategoryOptions((prevState) => {     
                    return [
                        ...prevState,
                        {
                            optionValue: data._id,
                            optionLabel: data.warehouseName,
                            order: plantsCategoryOptions.length,
                            default: false
                        },
                    ];
                });
            }
           
          }}
        />
      )}

{supplierOpen?.open && (
        <ManageAccountDialog
          // isUpdateDisabled={false}
          // productCategoryId={productCategoryId}
          open = {supplierOpen?.open}
         onClose={()=>setSupplierOpen({ open: false, isClone: false })}
          isClone={supplierOpen?.isClone}
          accountResource='supplierAccount'
          accountApi='supplier-account'
          isRedirectToDetailPage={false}
          
          onSuccess={({data}) => {
            
            setSupplierOpen({ open: false, isClone: false });
           
            if(data._id){
                setFieldValue("transferToSupplier", data._id);
                setSupplierToCategoryOptions((prevState) => {     
                    return [
                        ...prevState,
                        {
                            optionValue: data._id,
                            optionLabel: data.accountName,
                            order: supplierToCategoryOptions.length,
                            default: false
                        },
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
          open = {customerOpen?.open}
         onClose={()=>setCustomerOpen({ open: false, isClone: false })}
          isClone={customerOpen?.isClone}
          accountResource='customerAccount'
          accountApi='customer-account'
          isRedirectToDetailPage={false}
          
          onSuccess={({data}) => {
            
            setCustomerOpen({ open: false, isClone: false });
           
            if(data._id){
                setFieldValue("transferToCustomer", data._id);
                setCustomerToCategoryOptions((prevState) => {     
                    return [
                        ...prevState,
                        {
                            optionValue: data._id,
                            optionLabel: data.accountName,
                            order: supplierToCategoryOptions.length,
                            default: false
                        },
                    ];
                });
            }
           
          }}
        />
      )}
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