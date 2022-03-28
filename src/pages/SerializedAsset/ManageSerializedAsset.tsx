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
import { CustomDialogTransition, serializedAsset, setFieldsInAscendingOrder } from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, simplifyValues } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import { FaDiceOne } from 'react-icons/fa';
import { useData } from '../../StateProvider/Provider';
import CreateProductCategory from '../ProductCategory/CreateProductCategory';
import CreateProduct from "../../components/Product/CreateProduct";
import ManageWarehouse from "../Warehouse/ManageWarehouse"

const ManageSerializedAsset = ({ isClone = false, productInventoryId = null, onClose, onSuccess, productId = null, productCategory = null, isNew = true }) => {

  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [productCategoryOptions, setProductCategoryOptions] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [plantsCategoryOptions, setPlantsCategoryOptions] = useState([]);
  const [productDescriptionOptions, setProductDescriptionOptions] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('')
  const [formValues, setFormValues] = useState({});
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [plantsOpen, setPlantsOpen] = useState({ open: false, isClone: false });
  const [productOpen, setProductOpen] = useState({ open: false, isClone: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const { permissions } = useData();

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        data = data.filter((d) => !["currentOwnerType", "currentOwner", "purchaseOrder", "bulkAssetCreation"].includes(d.fieldData.fieldName));
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        var fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        const categoryOptions = data.find((obj) => obj?.fieldData.fieldName === 'productCategory')?.fieldData.option;
        const plantsOptions = data.find((obj) => obj?.fieldData.fieldName === 'warehouse')?.fieldData.option;
        const productOptions = data.find((obj) => obj?.fieldData.fieldName === 'product')?.fieldData.option;
        
        setProductCategoryOptions(categoryOptions);
        setPlantsCategoryOptions(plantsOptions);
        setProductDescriptionOptions(productOptions)
        setAllFields(productInventoryId ? fieldsDataForUpdate : fieldsDataForCreate)
        if (productInventoryId) {
          axiosInstance()
            .get(`${serializedAsset.api}/` + productInventoryId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, assetNumber, ...rest } = data;

                setCloneHeading(assetNumber);
                let oldValues = { ...rest };
                oldValues.status = "New";
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(oldValues, fieldsDataForCreate)
                });
                setFormValues(getObjKeysWithValues(oldValues, fieldsDataForCreate));
                setLoading(false);
              } else {
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
                setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate));
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues = getObjKeys('', fieldsDataForCreate);
          if (productId && createValues) {
            createValues['product'] = productId;
          }
          if (productCategory && createValues) {
            createValues['productCategory'] = productCategory;
          }
          setInitialData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            values: createValues
          });
          setFormValues(createValues);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [productInventoryId]);

  const handleSubmit = (values) => {
    sessionStorage.removeItem('productCategoryId')
    sessionStorage.removeItem('productCategoryName')
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


  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
  };

  const isFieldNotTouched = (initialData, values) => {
    return (
      Object.values(simplifyValues(initialData.values, initialData?.fields[0]?.sectionFields || [])).toString() ===
      Object.values(simplifyValues(values, initialData?.fields[0]?.sectionFields || [])).toString()
    );
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
                    productInventoryId ? (isClone ? `Clone - ${cloneHeading}` : 'Update ' + routes.serializedAsset.title) : 'Create ' + routes.serializedAsset.title
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
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
                                        >
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
                                              const label = val && val.optionLabel ? val.optionLabel : '';
                                              const productCategory = val && val?.productCategory ? val?.productCategory : '';
                                              setFieldValue(field.fieldName, value);
                                              setFieldValue('productCategory', productCategory);
                                              handleValuesChange({
                                                [field.fieldName]: value,
                                                productCategory: productCategory
                                              });
                                              const productLabel = productCategory
                                                ? productCategoryOptions.find((obj) => obj.optionValue === productCategory).optionLabel
                                                : '';
                                              const productValue = productCategory
                                                ? productCategoryOptions.find((obj) => obj.optionValue === productCategory).optionValue
                                                : '';
                                              sessionStorage.setItem('productCategoryId', JSON.stringify(productValue))
                                              sessionStorage.setItem('productCategoryName', JSON.stringify(productLabel))
                                            }}
                                          />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Product Description" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setProductOpen({ open: true, isClone: false });
                                              }}
                                              disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                              size="small"
                                            >
                                              <AddIcon color={Boolean(productInventoryId) && field.disableOnEdit && !isClone ? 'disabled' : 'primary'} />
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
                                  ) : field.fieldName === 'productCategory' ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
                                        >
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
                                              setFieldValue("product", "")
                                              handleValuesChange({
                                                [field.fieldName]: value && value.optionValue ? value.optionValue : "",
                                                "product": ""
                                              });
                                              sessionStorage.setItem('productCategoryId', JSON.stringify(value))
                                              sessionStorage.setItem('productCategoryName', JSON.stringify(label))
                                            }}
                                          />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Product Category" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setOpen({ open: true, isClone: false });
                                              }}
                                              disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                              size="small"
                                            >
                                              <AddIcon color={Boolean(productInventoryId) && field.disableOnEdit && !isClone ? 'disabled' : 'primary'} />
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
                                  ) : field.fieldName === 'warehouse' ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.isCreate ? 10 : 11}
                                          sm={permissions?.isCreate ? 10 : 11}
                                          md={permissions?.isCreate ? 10 : 11}
                                        >
                                          <FormTypes
                                            isNew={Boolean(productInventoryId)}
                                            {...field}
                                            disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
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
                                            onChange={(e, value) => {
                                              setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");
                                              if (value.address) {
                                                setFieldValue("currentLocation", value.address);
                                              }
                                            }}
                                          />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Plants" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setPlantsOpen({ open: true, isClone: false });
                                              }}
                                              disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
                                              size="small"
                                            >
                                              <AddIcon color={Boolean(productInventoryId) && field.disableOnEdit && !isClone ? 'disabled' : 'primary'} />
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
                                  ) : field.fieldName === 'status' ? (
                                    <FormTypes
                                      isNew={Boolean(productInventoryId)}
                                      {...field}
                                      disabled={Boolean(productInventoryId) && field.disableOnEdit && !isClone}
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
                                    />
                                  ) : (
                                    <FormTypes
                                      isNew={Boolean(productInventoryId)}
                                      {...field}
                                      disabled={(Boolean(productInventoryId) && field.disableOnEdit && !isClone) || (field.fieldName === 'assetNumber' && field.isUneditable)}
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
                                    />
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
                          setFieldValue("productCategory", data._id);
                          sessionStorage.setItem('productCategoryId', JSON.stringify(data._id));
                          sessionStorage.setItem('productCategoryName', JSON.stringify(data.name));
                          setProductCategoryOptions((prevState) => {
                            return [
                              ...prevState,
                              {
                                optionValue: data._id,
                                optionLabel: data.name,
                                order: productCategoryOptions.length,
                                default: false
                              },
                            ];
                          });
                        }
                      }}
                    />
                  )}
                  {plantsOpen?.open && (
                    <ManageWarehouse
                      open={plantsOpen?.open}
                      close={() => setPlantsOpen({ open: false, isClone: false })}
                      isClone={plantsOpen?.isClone}
                      onSuccess={({ data }) => {
                        setPlantsOpen({ open: false, isClone: false });
                        if (data._id) {
                          setFieldValue("warehouse", data._id);
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
                      }}
                    />
                  )}
                  {productOpen?.open && (
                    <CreateProduct
                      open={productOpen?.open}
                      handleClose={() => setProductOpen({ open: false, isClone: false })}
                      isClone={productOpen?.isClone}
                      onSuccess={(data) => {
                        setProductOpen({ open: false, isClone: false });
                        if (data._id) {
                          setFieldValue("product", data._id);
                          setProductDescriptionOptions((prevState) => {
                            return [
                              ...prevState,
                              {
                                optionValue: data._id,
                                optionLabel: data.productName,
                                order: productDescriptionOptions.length,
                                default: false
                              },
                            ];
                          });
                          setFieldValue("productCategory", data.productCategory);
                          setProductCategoryOptions((prevState) => {
                            return [
                              ...prevState,
                              {
                                optionValue: data.productCategory,
                                order: productDescriptionOptions.length,
                                default: false
                              },
                            ];
                          });
                          sessionStorage.setItem('productCategoryId', JSON.stringify(data.productCategory));
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
                      if (isFieldNotTouched(initialData, values)) onClose();
                      else setShowConfirmDialog(true);
                      sessionStorage.removeItem('productCategoryId')
                      sessionStorage.removeItem('productCategoryName')
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
                      sessionStorage.removeItem('productCategoryId')
                      sessionStorage.removeItem('productCategoryName')
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
                      sessionStorage.removeItem('productCategoryId')
                      sessionStorage.removeItem('productCategoryName')
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

    </>
  );
};




export default ManageSerializedAsset;
