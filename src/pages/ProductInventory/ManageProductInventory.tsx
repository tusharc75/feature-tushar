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
import { CustomDialogTransition, productInventory, setFieldsInAscendingOrder } from '../../constants/helpers';
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
import ManageAccountDialog from "../Account/ManageAccount/index";

const ManageProductInventory = ({ isClone = false, productInventoryId = null, onClose, onSuccess, productId = null, productCategory = null, isNew = true }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [productCategoryOptions, setProductCategoryOptions] = useState([]);
  const [plantsCategoryOptions, setPlantsCategoryOptions] = useState([]);
  const [productDescriptionOptions, setProductDescriptionOptions] = useState([]);
  const [manufacturerCategoryOptions, setManufacturerCategoryOptions] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [plantsOpen, setPlantsOpen] = useState({ open: false, isClone: false });
  const [productOpen, setProductOpen] = useState({ open: false, isClone: false });
  const [manufacturerOpen, setManufacturerOpen] = useState({ open: false, isClone: false })
  // const desc = {
  //     productCategory: "",
  //     product: "",
  //     serialNumber: ""
  // }
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const { permissions } = useData();


  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Product Inventory')
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        const categoryOptions = data.find((obj) => obj?.fieldData.fieldName === 'productCategory')?.fieldData.option;
        const plantsOptions = data.find((obj) => obj?.fieldData.fieldLabel === 'Plants')?.fieldData.option;
        const productOptions = data.find((obj) => obj?.fieldData.fieldName === 'product')?.fieldData.option;
        const manufacturerOptions = data.find((obj) => obj?.fieldData.fieldLabel === 'Manufacturer')?.fieldData.option;
<<<<<<< HEAD
      console.log(data, "data")
      
=======


>>>>>>> master

        setProductCategoryOptions(categoryOptions);
        setPlantsCategoryOptions(plantsOptions);
        setProductDescriptionOptions(productOptions)
        setManufacturerCategoryOptions(manufacturerOptions)


        if (productInventoryId) {
          axiosInstance()
            .get(`${productInventory.api}/` + productInventoryId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, createdBy, updatedBy, serialNumber, ...rest } = data;

                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: getObjKeysWithValues(rest, fieldsDataForCreate)
                });
                setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate));

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
        .put(`${productInventory.api}`, values)
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
        .post(`${productInventory.api}`, values)
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

  // const setDescription = (setValue) => {
  //     const value = Object.values(desc).join(" - ")
  //     setValue("description", value);
  // }
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
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    productInventoryId ? (isClone ? 'Clone' : 'Update ' + routes.productInventory.title) : 'Create ' + routes.productInventory.title
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
                    {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}
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
                                            // setFieldValue={(name, value) => {
                                            //   handleValuesChange({ [name]: value });
                                            //   setFieldValue(name, value);
                                            // }}
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



                                              // desc.product = label
                                              // desc.productCategory = productLabel
                                              // setDescription(setFieldValue)
                                            }}
                                          />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Product Description" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setProductOpen({ open: true, isClone: false });
                                              }}
                                              disabled={!isNew && field.disableOnEdit}
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
                                            // setFieldValue={(name, value) => {
                                            //             handleValuesChange({[name]: value })
                                            // setFieldValue(name, value)
                                            // }}

                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onChange={(_, val) => {
                                              const value = val && val.optionValue ? val.optionValue : '';
                                              const label = val && val.optionLabel ? val.optionLabel : '';
                                              // desc.productCategory = label
                                              setFieldValue(field.fieldName, value);
                                              setFieldValue("product", "")
                                              handleValuesChange({
                                                [field.fieldName]: value && value.optionValue ? value.optionValue : "",
                                                "product": ""
                                              });
                                              sessionStorage.setItem('productCategoryId', JSON.stringify(value))
                                              sessionStorage.setItem('productCategoryName', JSON.stringify(label))

                                              // setDescription(setFieldValue)
                                            }}
                                          />
                                        </Grid>

                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Product Category" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setOpen({ open: true, isClone: false });
                                              }}
                                              disabled={!isNew && field.disableOnEdit}
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
                                  ) : field.fieldLabel === 'Plants' ? (
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
<<<<<<< HEAD
                                             setFieldValue={(name, value) => {
                                        handleValuesChange({ [name]: value });
                                        setFieldValue(name, value);
                                      }}
                                            // onChange={(e) => {
                                            //   const val = e.target.value.trim();
                                            //   setFieldValue(field.fieldLabel, val);
                                            //   handleValuesChange({ [field.fieldLabel]: val });
                                            //   // desc.serialNumber = val
                                            //   // setDescription(setFieldValue)
                                            // }}
=======
                                            onChange={(_, newVal) => {
                                              const val = newVal?.optionValue;
                                              setFieldValue(field.fieldName, val);
                                              handleValuesChange({ [field.fieldName]: val });
                                              // desc.serialNumber = val
                                              // setDescription(setFieldValue)
                                            }}
>>>>>>> master
                                          />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Plants" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setPlantsOpen({ open: true, isClone: false });
                                              }}
                                               disabled={!isNew && field.disableOnEdit}
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
                                  ) : field.fieldLabel === 'Manufacturer' ? (
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
                                            //   disabled={true}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldLabel}
                                            type={field.type}
                                            options={manufacturerCategoryOptions}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                          />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Manufacturer" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setManufacturerOpen({ open: true, isClone: false });
                                              }}
                                              disabled={!isNew && field.disableOnEdit}
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
                                  ):(
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
                      // isUpdateDisabled={false}
                      // productCategoryId={productCategoryId}
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
                      // isUpdateDisabled={false}
                      // productCategoryId={productCategoryId}
                      open={plantsOpen?.open}
                      close={() => setPlantsOpen({ open: false, isClone: false })}
                      isClone={plantsOpen?.isClone}

                      onSuccess={({ data }) => {

                        setPlantsOpen({ open: false, isClone: false });
                        if (data._id) {
                          setFieldValue("plants", data._id);
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
                      // isUpdateDisabled={false}
                      // productCategoryId={productCategoryId}
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

                  {manufacturerOpen?.open && (
                    <ManageAccountDialog
                      // isUpdateDisabled={false}
                      // productCategoryId={productCategoryId}
                      open={manufacturerOpen?.open}
                      onClose={() => setManufacturerOpen({ open: false, isClone: false })}
                      isClone={manufacturerOpen?.isClone}
                      accountResource='supplierAccount'
                      accountApi='supplier-account'
                      isRedirectToDetailPage={false}

                      onSuccess={({ data }) => {

                        setManufacturerOpen({ open: false, isClone: false });

                        if (data._id) {
                          setFieldValue("Manufacturer", data._id);
                          setManufacturerCategoryOptions((prevState) => {
                            return [
                              ...prevState,
                              {
                                optionValue: data._id,
                                optionLabel: data.accountName,
                                order: manufacturerCategoryOptions.length,
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




export default ManageProductInventory;
