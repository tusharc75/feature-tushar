import { Fragment, useContext, useEffect, useState } from 'react';
import { Dialog, Button, Grid, Box, IconButton, Tooltip, InputAdornment } from '@material-ui/core';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { useHistory } from 'react-router-dom';
import {
  getObjKeys,
  yupSchema,
  setFieldsInAscendingOrder,
  getObjKeysWithValues,
  formFieldNames,
  getUniqueCurrencies,
  initializeDropdownById
} from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import FormTypes from '../../components/Helpers/FormTypes';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageMarketSegmentDialog from '../MarketSegment/ManageMarketSegmentDialog';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import ManageAddressDialog from '../../components/Address/ManageAddressDialog';
import routes from 'src/components/Helpers/Routes';
import { isEqual } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
interface InitialData {
  fields: any[];
  values: object;
}

const CreateProjectSales = ({
  isClone = false,
  open,
  close,
  fetchData,
  type = null,
  projectSalesId = null,
  fields = null,
  onSuccess = null,
  accountId = null,
  resource = null
}) => {
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {}
  });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const history = useHistory();
  const [formsData, setFormsData] = useState([]);

  const [productSalesName, setProductSalesName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState(null);

  const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);

  const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
  const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
  const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
  const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
  const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showAddAddresstDialog, setShowAddAddresstDialog] = useState(false);
  const [addressDataSource, setAddressDataSource] = useState([]);

  useEffect(() => {
    if (initialData.fields.length > 0) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Project Sales')
      .then(({ data: { data } }) => {
        const newFields = [];

        const filterData = projectSalesId
          ? data.filter((d) => d.isUpdate)
          : data.filter((d) => {
              if (accountId && ['customerAccountName', 'supplierAccountName'].some((_f) => _f === d.fieldData.fieldName)) {
                d = initializeDropdownById(d, d.fieldData.fieldName, accountId);
              }
              return d.isCreate;
            });

        const addressDropdownData = filterData.map((m) => m.fieldData).find((d) => d.fieldName === 'finalDestination');
        if (addressDropdownData) {
          setAddressDataSource(addressDropdownData.option);
        }

        const marketSegmentDropdownData = filterData.map((m) => m.fieldData).find((d) => d.fieldName === formFieldNames.marketSegment);
        if (marketSegmentDropdownData) {
          setMainMarketSegmentDataSource(marketSegmentDropdownData.option);

          let initializeMarketSegmentDataSource = [];
          marketSegmentDropdownData.option.forEach((option) => {
            if (option.parentMarketSegment === '' || marketSegmentDropdownData.option.some((s) => s.parentMarketSegment === option.optionValue)) {
              initializeMarketSegmentDataSource.push(option);
            }
          });
          setMarketSegmentDataSource(initializeMarketSegmentDataSource);
        }

        if (projectSalesId) {
          axiosInstance()
            .get(`${routes.projectSales.path}/` + projectSalesId)
            .then(({ data: { data } }) => {
              filterData.map((_f) => {
                if (_f.fieldData.fieldName === 'currency') {
                  setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
                }
                newFields.push(_f.fieldData);
              });

              if (isClone) {
                const { projectName, ...rest } = data;

                let tempData = { ...rest };
                let tempObjKeysWithValues = getObjKeysWithValues(tempData, newFields);
                if (newFields?.some((e) => e.fieldName === 'projectManager')) {
                  tempObjKeysWithValues['projectManager'] = user._id;
                }
                setInitialData({
                  fields: newFields,
                  values: tempObjKeysWithValues
                });
              } else {
                setInitialData({
                  fields: newFields,
                  values: getObjKeysWithValues(data, newFields)
                });
              }
              setProductSalesName(data.projectName);

              if (marketSegmentDropdownData && data.marketSegment) {
                setSubMarketSegmentDataSource(
                  marketSegmentDropdownData.option.filter((d) => d.parentMarketSegment === data.marketSegment.optionValue)
                );
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          const createFields = filterData.map((m) => m.fieldData);
          let tempObjKeysWithValues = getObjKeys('', createFields);
          if (createFields.some((e) => e.fieldName === 'currency')) {
            tempObjKeysWithValues['currency'] = user?.brandCurrency;
          }
          if (createFields?.some((e) => e.fieldName === 'projectManager')) {
            tempObjKeysWithValues['projectManager'] = user._id;
          }
          setInitialData({
            fields: createFields,
            values: tempObjKeysWithValues
          });
        }
        setTimeout(() => setLoading(false), 500);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    if (projectSalesId && !isClone) {
      setSubmitting(true);
      axiosInstance()
        .put(`${routes.projectSales.path}`, { ...values, _id: projectSalesId })
        .then(({ data }) => {
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          close();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      setSubmitting(true);
      var tempStaticData = {};
      if (type) {
        type.map((d: any) => {
          tempStaticData[d.type] = [d.id];
        });
      }
      tempStaticData['user'] = [values?.projectManager, user._id];
      values.staticData = tempStaticData;
      axiosInstance()
        .post(`${routes.projectSales.path}`, values)
        .then(({ data }) => {
          if (accountId) {
            axiosInstance().put(`${routes.projectSales.path}/add-customer-account`, {
              _id: data?.data._id,
              customerAccount: [accountId]
            });
          }
          if (onSuccess) {
            onSuccess(data);
          }
          const newId = data.data?._id;
          setSubmitting(false);
          fetchData();
          if (type) {
            close();
          } else {
            history.push(`${routes.projectSalesDetail.path}/${newId}`, {
              managerId: data.data?.projectManager
            });
            close();
          }
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    }
  };

  const initializeMarketSegmentDropdown = (values, marketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.marketSegment)) {
      const getNewAddedMarketSegment = marketSegmentSource.find((d) => d?.optionValue === newMarketSegmentId);
      if (getNewAddedMarketSegment) {
        values[formFieldNames.marketSegment] = getNewAddedMarketSegment.optionValue;
      }
      return values;
    }
    return values;
  };

  const initializeSubMarketSegmentDropdown = (values, subMarketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.subMarketSegment)) {
      const getNewAddedSubMarketSegment = subMarketSegmentSource.find((d) => d?.optionValue === newSubMarketSegmentId);
      if (getNewAddedSubMarketSegment) {
        values[formFieldNames.subMarketSegment] = getNewAddedSubMarketSegment.optionValue;
      }
      return values;
    }
    return values;
  };

  const marketSegmentChange = (marketSegmentId: string) => {
    setSubMarketSegmentDataSource(marketSegmentId ? mainMarketSegmentDataSource.filter((d) => d.parentMarketSegment === marketSegmentId) : []);
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

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validateOnMount
          validate={validate}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) {
                    close();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                title={`${
                  isClone ? `Clone - ${productSalesName}` : projectSalesId ? `Update ${productSalesName}` : `New ${routes.projectSales.title}`
                }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form noValidate>
                  {formsData &&
                    formsData.map((form, index1) => {
                      return form.name ? (
                        <div key={index1}>
                          <div className={'detail-box-content'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  {field.fieldName === formFieldNames.marketSegment ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions.marketSegment.isCreate ? 11 : 11}
                                          sm={permissions.marketSegment.isCreate ? 11 : 11}
                                          md={permissions.marketSegment.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                            isNew={Boolean(projectSalesId)}
                                            fields={initialData.fields}
                                            fieldData={field}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field.isTooltip}
                                            tooltipMessage={field.tooltipMessage}
                                            onChange={(e, val) => {
                                              setNewMarketSegmentId(null);
                                              setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');
                                              if (initialData?.fields?.some((e) => e.fieldName === formFieldNames.subMarketSegment)) {
                                                setNewSubMarketSegmentId(null);
                                                setFieldValue(formFieldNames.subMarketSegment, '');
                                              }
                                              marketSegmentChange(val && val.optionValue ? val.optionValue : '');
                                            }}
                                            size="small"
                                            values={newMarketSegmentId ? initializeMarketSegmentDropdown(values, marketSegmentDataSource) : values}
                                            options={marketSegmentDataSource}
                                            doNotShowInfoTooltip={true}
                                          />
                                        </Grid>
                                        {permissions.marketSegment.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Add Market Segment" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddMarketSegmentDialog(true);
                                                }}
                                                disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                size="small"
                                              >
                                                <AddIcon color={Boolean(projectSalesId) && field.disableOnEdit ? 'disabled' : 'primary'} />
                                              </IconButton>
                                            </Tooltip>
                                          </Grid>
                                        )}
                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                      </Grid>
                                    </Grid>
                                  ) : field.fieldName === formFieldNames.subMarketSegment ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions.marketSegment.isCreate ? 11 : 11}
                                          sm={permissions.marketSegment.isCreate ? 11 : 11}
                                          md={permissions.marketSegment.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                            isNew={Boolean(projectSalesId)}
                                            fields={initialData.fields}
                                            fieldData={field}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field.isTooltip}
                                            tooltipMessage={field.tooltipMessage}
                                            onChange={(e, val) => {
                                              setNewSubMarketSegmentId(null);
                                              setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');
                                            }}
                                            size="small"
                                            values={
                                              newSubMarketSegmentId ? initializeSubMarketSegmentDropdown(values, subMarketSegmentDataSource) : values
                                            }
                                            options={subMarketSegmentDataSource}
                                            doNotShowInfoTooltip={true}
                                          />
                                        </Grid>
                                        {permissions.marketSegment.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Add Sub Market Segment" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddMarketSegmentDialog(true);
                                                }}
                                                disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                size="small"
                                              >
                                                <AddIcon color={Boolean(projectSalesId) && field.disableOnEdit ? 'disabled' : 'primary'} />
                                              </IconButton>
                                            </Tooltip>
                                          </Grid>
                                        )}
                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                      </Grid>
                                    </Grid>
                                  ) : field.fieldName === 'projectCategory' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
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
                                      imageOrFileUploadCompletePercentage={null}
                                    />
                                  ) : field.fieldName === 'startDate' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      maxDate={values.endDate}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      imageOrFileUploadCompletePercentage={null}
                                    />
                                  ) : field.fieldName === 'endDate' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      minDate={values.startDate}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      imageOrFileUploadCompletePercentage={null}
                                    />
                                  ) : field.fieldName === 'entity' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && !isClone && field.disableOnEdit}
                                      multiple
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      onChange={(e, value) => {
                                        setFieldValue(field.fieldName, value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []);
                                        if (initialData?.fields?.some((e) => e.fieldName === 'projectManager')) {
                                          setFieldValue('projectManager', '');
                                        }
                                      }}
                                    />
                                  ) : field.fieldName === 'projectManager' ? (
                                    <FormTypes
                                      {...field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={
                                        values['entity'] && values['entity'].length
                                          ? field.option.filter((data) => values['entity']?.some((d) => data.entities?.some((e) => e.entity === d)))
                                          : field.option
                                      }
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      onChange={(e, value) => {
                                        setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                      }}
                                    />
                                  ) : field.fieldName === 'currency' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
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
                                      onChange={(e, val) => {
                                        if (val && val.currencyCode) {
                                          setFieldValue(field.fieldName, val.currencyCode);
                                          setCurrencySymbol(val.symbolNative);
                                        } else {
                                          setFieldValue(field.fieldName, '');
                                          setCurrencySymbol(null);
                                        }
                                      }}
                                    />
                                  ) : field.fieldName.trim() === 'amount' ? (
                                    <FormTypes
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
                                      fieldId={field._id}
                                      lookup={field.lookup}
                                      // {...rest}
                                      selectedCurrencyCode={values['currency']}
                                      startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ''}
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
                                    />
                                  ) : field.fieldName === 'finalDestination' ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions?.projectSales?.isCreate ? 11 : 12}
                                          sm={permissions?.projectSales?.isCreate ? 11 : 12}
                                          md={permissions?.projectSales?.isCreate ? 11 : 12}
                                        >
                                          <FormTypes
                                            {...field}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={addressDataSource}
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
                                        {permissions?.projectSales?.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Add Address" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddAddresstDialog(true);
                                                }}
                                                disabled={field.disableOnEdit}
                                                size="small"
                                              >
                                                <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                              </IconButton>
                                            </Tooltip>
                                          </Grid>
                                        )}
                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                      </Grid>
                                    </Grid>
                                  ) : (
                                    <FormTypes
                                      {...field}
                                      isNew={Boolean(projectSalesId)}
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
                                      imageOrFileUploadCompletePercentage={null}
                                      disabled={(projectSalesId && field.fieldName === 'projectManager') || (!projectSalesId && field.disableOnEdit)}
                                    />
                                  )}
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      ) : (
                        form.sectionFields.map((field) => (
                          <FormTypes
                            {...field}
                            disabled={Boolean(projectSalesId) && field.disableOnEdit}
                            isNew={Boolean(projectSalesId)}
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
                            style={{ visibility: 'hidden' }}
                          />
                        ))
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) {
                      close();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={isSubmitting}
                  variant="contained"
                  color="primary"
                  disabled={uploadingImageOrFileProgress > 0 || loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showAddAddresstDialog && (
                <ManageAddressDialog
                  onClose={() => {
                    setShowAddAddresstDialog(false);
                  }}
                  onSuccess={(obj) => {
                    if (obj) {
                      setShowAddAddresstDialog(false);
                      if (obj?.isAlreadyExist === true) {
                        let tempAddress = addressDataSource.find((d) => d?.optionLabel === obj?.fullAddress);
                        setFieldValue('finalDestination', [...values[`finalDestination`], tempAddress.optionValue]);
                      } else {
                        setAddressDataSource((prevState) => [
                          ...prevState,
                          {
                            default: false,
                            optionLabel: obj?.fullAddress,
                            optionValue: obj._id,
                            order: addressDataSource.length + 1
                          }
                        ]);
                        setFieldValue('finalDestination', [...values[`finalDestination`], obj._id]);
                      }
                    }
                  }}
                />
              )}
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
                    close();
                  }}
                />
              ) : null}
              {showAddMarketSegmentDialog && (
                <ManageMarketSegmentDialog
                  marketSegmentId={null}
                  onClose={() => {
                    setShowAddMarketSegmentDialog(false);
                  }}
                  onSuccess={(data) => {
                    if (data?._id) {
                      setMainMarketSegmentDataSource((prevState) => {
                        return [
                          ...prevState,
                          {
                            optionValue: data._id,
                            optionLabel: data.name,
                            order: mainMarketSegmentDataSource.length,
                            default: false,
                            parentMarketSegment: data.parentMarketSegment
                          }
                        ];
                      });

                      //  If no parent selected, consider that as parent and add it in Market Segment
                      if (data.parentMarketSegment === '') {
                        setMarketSegmentDataSource((prevState) => {
                          return [
                            ...prevState,
                            {
                              optionValue: data._id,
                              optionLabel: data.name,
                              order: marketSegmentDataSource.length,
                              default: false,
                              parentMarketSegment: data.parentMarketSegment
                            }
                          ];
                        });
                        setSubMarketSegmentDataSource([]);
                        setNewMarketSegmentId(data._id);
                        setNewSubMarketSegmentId(null);
                      } else {
                        //  If parent selected, consider that as a child
                        if (marketSegmentDataSource.some((d) => d?.optionValue === data.parentMarketSegment)) {
                          setSubMarketSegmentDataSource([
                            ...mainMarketSegmentDataSource.filter((s) => s.parentMarketSegment === data.parentMarketSegment),
                            {
                              optionValue: data._id,
                              optionLabel: data.name,
                              order: subMarketSegmentDataSource.length,
                              default: false,
                              parentMarketSegment: data.parentMarketSegment
                            }
                          ]);
                        } else {
                          let initializeMarketSegmentDataSource = [];
                          mainMarketSegmentDataSource.forEach((option) => {
                            if (
                              option.parentMarketSegment === '' ||
                              mainMarketSegmentDataSource.some((s) => s.parentMarketSegment === option.optionValue)
                            ) {
                              initializeMarketSegmentDataSource.push(option);
                            }
                          });

                          if (!initializeMarketSegmentDataSource.some((s) => s.optionValue === data.parentMarketSegment)) {
                            const getMarketSegment = mainMarketSegmentDataSource.find((d) => d?.optionValue === data.parentMarketSegment);

                            initializeMarketSegmentDataSource.push({
                              optionValue: getMarketSegment.optionValue,
                              optionLabel: getMarketSegment.optionLabel,
                              order: initializeMarketSegmentDataSource.length,
                              default: false,
                              parentMarketSegment: getMarketSegment.parentMarketSegment
                            });
                          }
                          setMarketSegmentDataSource(initializeMarketSegmentDataSource);

                          setSubMarketSegmentDataSource([
                            ...mainMarketSegmentDataSource.filter((s) => s.parentMarketSegment === data.parentMarketSegment),
                            {
                              optionValue: data._id,
                              optionLabel: data.name,
                              order: subMarketSegmentDataSource.length,
                              default: false,
                              parentMarketSegment: data.parentMarketSegment
                            }
                          ]);
                        }
                        setNewMarketSegmentId(data.parentMarketSegment);
                        setNewSubMarketSegmentId(data._id);
                      }
                    }
                    setShowAddMarketSegmentDialog(false);
                  }}
                />
              )}
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default CreateProjectSales;
