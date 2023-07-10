import { useState, useEffect, Fragment, useContext } from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
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
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  ASSET_STATUS,
  serializedAsset,
  setFieldsInAscendingOrder,
  supplierAccount,
  ASSET_NUMBER_TYPE
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import AddIcon from '@material-ui/icons/AddCircle';
import { FaDiceOne } from 'react-icons/fa';
import { useData } from '../../StateProvider/Provider';
import CreateProductCategory from '../ProductCategory/CreateProductCategory';
import CreateProduct from '../../components/Product/CreateProduct';
import { isEqual } from 'lodash';

const ManageSerializedAsset = ({
  isClone = false,
  productInventoryId = null,
  onClose,
  onSuccess,
  productId = null,
  productCategory = null,
  referenceType = null,
  referenceData = null
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [productCategoryOptions, setProductCategoryOptions] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [productDescriptionOptions, setProductDescriptionOptions] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('');
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [productOpen, setProductOpen] = useState({ open: false, isClone: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [productCategoryID, setProductCategoryID] = useState(null);
  const [productCategoryName, setProductCategoryName] = useState(null);

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        data = data.filter(
          (d) =>
            d.fieldData.type !== 'lookUpDisplay' &&
            !['currentOwnerType', 'currentOwner', 'purchaseOrder', 'bulkAssetCreation'].includes(d.fieldData.fieldName)
        );

        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        var fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        const categoryOptions = data.find((obj) => obj?.fieldData.fieldName === 'productCategory')?.fieldData?.option || [];
        const plantsOptions = data.find((obj) => obj?.fieldData.fieldName === 'warehouse')?.fieldData?.option || [];
        const productOptions = data.find((obj) => obj?.fieldData.fieldName === 'product')?.fieldData?.option || [];

        setProductCategoryOptions(categoryOptions);
        setProductDescriptionOptions(productOptions);

        setAllFields(productInventoryId ? fieldsDataForUpdate : fieldsDataForCreate);

        if (productInventoryId) {
          axiosInstance()
            .get(`${serializedAsset.api}/` + productInventoryId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, assetNumber, mtrAttached, mtrAttachedBy, mtrAttachedDate, ...rest } = data;
                setCloneHeading(assetNumber);
                let oldValues = { ...rest };
                oldValues.status = ASSET_STATUS.new;
                oldValues.assetNumber = fieldsDataForUpdate?.find((e) => e.fieldName === 'assetNumber')?.defaultValue || '';
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(oldValues, fieldsDataForCreate)
                });
                setLoading(false);
              } else {
                fieldsDataForUpdate?.forEach((e: any) => {
                  if (e?.fieldName === 'warehouse') {
                    e.required = false;
                  }
                });
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues = getObjKeys('', fieldsDataForCreate);
          if (productId && fieldsDataForCreate.some((e) => e.fieldName === 'product')) {
            createValues['product'] = productId;
          }
          if (productCategory && fieldsDataForCreate.some((e) => e.fieldName === 'productCategory')) {
            createValues['productCategory'] = productCategory;
          }
          if (fieldsDataForCreate.some((e) => e.fieldName === 'recertDate')) {
            createValues['recertDate'] = '';
          }
          if (fieldsDataForCreate.some((e) => e.fieldName === 'mtrAttachedDate')) {
            createValues['mtrAttachedDate'] = '';
          }

          if (referenceType === 'repairOrder' || referenceType === "assetsReceiving") {
            if (fieldsDataForCreate.some((e) => e.fieldName === 'customerAccount') && referenceData?.customerAccount) {
              createValues['customerAccount'] = referenceData?.customerAccount;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'warehouse') && referenceData?.warehouse) {
              createValues['warehouse'] = referenceData?.warehouse;
              const warehouseAddress = plantsOptions?.find((e) => e.optionValue === referenceData?.warehouse);
              if (warehouseAddress && fieldsDataForCreate.some((e) => e.fieldName === 'currentLocation')) {
                createValues['currentLocation'] = warehouseAddress?.address;
              }
            }
            fieldsDataForCreate?.forEach((e) => {
              if (referenceData?.customerAccount && ['customerAccount'].includes(e.fieldName)) {
                e.isUneditable = true;
              }
              if (['warehouse', 'currentLocation'].includes(e.fieldName)) {
                e.isUneditable = true;
              }
            });
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
  }, [productInventoryId]);

  const handleSubmit = (values) => {
    setProductCategoryID(null);
    setProductCategoryName(null);
    setSubmitting(true);
    if (productInventoryId && isClone === false) {
      values._id = productInventoryId;
      axiosInstance()
        .put(`${serializedAsset.api}`, values)
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
        .post(`${serializedAsset.api}`, values)
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

  return (
    <>
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
        {initialData && initialData.fields.length ? (
          <Formik initialValues={initialData.values} validationSchema={yupSchema(allFields)} onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    productInventoryId
                      ? isClone
                        ? `Clone - ${cloneHeading}`
                        : 'Update ' + routes.serializedAsset.title
                      : 'Create ' + routes.serializedAsset.title
                  }
                  onClose={() => {
                    if (isEqual(initialData.values, values)) onClose();
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
                          <div className={'detail-box-content'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  {field.fieldName === 'product' ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            isNew={Boolean(productInventoryId)}
                                            {...field}
                                            disabled={productId ? true : Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={productDescriptionOptions}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onChange={(_, val) => {
                                              const value = val && val.optionValue ? val.optionValue : '';
                                              setFieldValue(field.fieldName, value);
                                              if (allFields?.some((e) => e.fieldName === 'productCategory')) {
                                                const productCategory = val && val?.productCategory ? val?.productCategory : '';
                                                setFieldValue('productCategory', productCategory);
                                                const productLabel = productCategory
                                                  ? productCategoryOptions.find((obj) => obj.optionValue === productCategory).optionLabel
                                                  : '';
                                                const productValue = productCategory
                                                  ? productCategoryOptions.find((obj) => obj.optionValue === productCategory).optionValue
                                                  : '';

                                                setProductCategoryID(productValue);
                                                setProductCategoryName(productLabel);
                                              }
                                            }}
                                          />
                                        </Box>
                                        {permissions?.product?.isCreate && (
                                          <Box className="ml-1 mt-1">
                                            <Tooltip title={`Add ${routes.product.title}`}>
                                              <IconButton
                                                onClick={() => {
                                                  setProductOpen({ open: true, isClone: false });
                                                }}
                                                disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                                size="small"
                                              >
                                                <AddIcon
                                                  color={Boolean(productInventoryId) && field.disableOnEdit && !isClone ? 'disabled' : 'primary'}
                                                />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        )}
                                      </Box>
                                    </Grid>
                                  ) : field.fieldName === 'productCategory' ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            isNew={Boolean(productInventoryId)}
                                            {...field}
                                            disabled={productCategory ? true : Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={productCategoryOptions}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onChange={(_, val) => {
                                              const value = val && val.optionValue ? val.optionValue : '';
                                              const label = val && val.optionLabel ? val.optionLabel : '';
                                              setFieldValue(field.fieldName, value);
                                              setFieldValue('product', '');
                                              setProductCategoryID(value);
                                              setProductCategoryName(label);
                                            }}
                                          />
                                        </Box>
                                        {permissions?.productCategory?.isCreate && (
                                          <Box className="ml-1 mt-1">
                                            <Tooltip title={`Add ${routes?.productCategory?.title}`}>
                                              <IconButton
                                                onClick={() => {
                                                  setOpen({ open: true, isClone: false });
                                                }}
                                                disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                                size="small"
                                              >
                                                <AddIcon
                                                  color={Boolean(productInventoryId) && field.disableOnEdit && !isClone ? 'disabled' : 'primary'}
                                                />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        )}
                                      </Box>
                                    </Grid>
                                  ) : field.fieldName === 'warehouse' ? (
                                    <FormTypes
                                      isNew={Boolean(productInventoryId)}
                                      {...field}
                                      disabled={
                                        Boolean(productInventoryId) && !isClone ? field.disableOnEdit || field.isUneditable : field.isUneditable
                                      }
                                      fieldData={field}
                                      values={values}
                                      hidelookupAddButton={true}
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
                                      onChange={(e, value) => {
                                        setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                        if (value.address) {
                                          setFieldValue('currentLocation', value.address);
                                        }
                                      }}
                                    />
                                  ) : field.fieldName === 'assetNumber' ? (
                                    <FormTypes
                                      isNew={Boolean(productInventoryId)}
                                      {...field}
                                      disabled={
                                        values['assetNumberType']
                                          ? values['assetNumberType'] === ASSET_NUMBER_TYPE.manual
                                            ? false
                                            : true
                                          : Boolean(productInventoryId) && !isClone
                                            ? field.disableOnEdit || field.isUneditable
                                            : field.isUneditable
                                      }
                                      fieldData={field}
                                      values={values}
                                      hidelookupAddButton={true}
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
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                    />
                                  ) : (
                                    <>
                                      <FormTypes
                                        isNew={Boolean(productInventoryId)}
                                        {...field}
                                        disabled={
                                          Boolean(productInventoryId) && !isClone ? field?.disableOnEdit || field?.isUneditable : field?.isUneditable
                                        }
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
                                          if (field.fieldName === 'assetNumberType') {
                                            setFieldValue('assetNumber', value === ASSET_NUMBER_TYPE.manual ? '' : 'Auto Generate');
                                          }
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    </>
                                  )}
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      ))}
                  </Form>
                  {open?.open && (
                    <CreateProductCategory
                      isClone={open?.isClone}
                      onClose={() => setOpen({ open: false, isClone: false })}
                      onSuccess={(data) => {
                        setOpen({ open: false, isClone: false });
                        if (data._id) {
                          setFieldValue('productCategory', data._id);
                          setProductCategoryID(data?._id);
                          setProductCategoryName(data?.productRendererNames);
                          setProductCategoryOptions((prevState) => {
                            return [
                              ...prevState,
                              {
                                optionValue: data._id,
                                optionLabel: data.name,
                                order: productCategoryOptions.length,
                                default: false
                              }
                            ];
                          });
                        }
                      }}
                    />
                  )}
                  {productOpen?.open && (
                    <CreateProduct
                      isClone={productOpen?.isClone}
                      productCategoryID={productCategoryID}
                      productCategoryName={productCategoryName}
                      handleClose={() => setProductOpen({ open: false, isClone: false })}
                      isRedirectToDetailPage={false}
                      openFrom="serializedAsset"
                      onSuccess={(data) => {
                        setProductOpen({ open: false, isClone: false });
                        if (data._id) {
                          setFieldValue('product', data._id);
                          setProductDescriptionOptions((prevState) => {
                            return [
                              ...prevState,
                              {
                                optionValue: data._id,
                                optionLabel: data.productName,
                                order: productDescriptionOptions.length,
                                default: false
                              }
                            ];
                          });
                          if (allFields?.some((e) => e.fieldName === 'productCategory')) {
                            setFieldValue('productCategory', data.productCategory);
                            setProductCategoryOptions((prevState) => {
                              return [
                                ...prevState,
                                {
                                  optionValue: data.productCategory,
                                  order: productDescriptionOptions.length,
                                  default: false
                                }
                              ];
                            });
                            setProductCategoryID(data.productCategory);
                          }
                        }
                      }}
                    />
                  )}
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    disabled={isSubmitting}
                    size="small"
                    color="primary"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) onClose();
                      else setShowConfirmDialog(true);
                      setProductCategoryID(null);
                      setProductCategoryName(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton disabled={isSubmitting} loading={isSubmitting} variant="contained" color="primary" type="submit" onClick={submitForm}>
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
                      setProductCategoryID(null);
                      setProductCategoryName(null);
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
                      setProductCategoryID(null);
                      setProductCategoryName(null);
                    }}
                  />
                ) : null}
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default ManageSerializedAsset;
