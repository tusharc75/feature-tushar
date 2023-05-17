import React, { useEffect, useState, useContext, Fragment, useRef } from 'react';
import { Box, Button, Grid, IconButton, Tooltip, InputAdornment } from '@material-ui/core';
import { Formik, Form } from 'formik';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import {
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  initializeDropdownById,
  opportunity,
  customerAccount,
  setFieldsInAscendingOrder,
  getUniqueCurrencies,
  formFieldNames,
  supplierAccount
} from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageAccountDialog from '../../Account/ManageAccount';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import ManageMarketSegmentDialog from '../../MarketSegment/ManageMarketSegmentDialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import ManageAddressDialog from '../../../components/Address/ManageAddressDialog';
import { isArray, isEqual } from 'lodash';
export default function ManageOpportunityDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  isRedirectTodetailPage,
  userId = null,
  contactId = null,
  contactResource = null,
  disableOwnerAndAccount = false,
  opportunityId = null,
  isClone = false
}) {
  const { opportunityApi } = opportunity;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const [disableOwnerSelection] = useState((!isNew && user.user._id !== dataToUpdate.owner.optionValue) || disableOwnerAndAccount);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] = useState(false);
  const [showAddSupplierAccountDialog, setShowAddSupplierAccountDialog] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [additionalFieldName, setAdditionalFieldName] = useState('');
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);
  const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
  const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
  const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
  const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
  const [countryBillToDropDown, setCountryBillToDropDown] = useState([]);
  const [countrySellToDropDown, setCountrySellToDropDown] = useState([]);
  const [countryBillToMainData, setCountryBillToMainData] = useState([]);
  const [countrySellToMainData, setCountrySellToMainData] = useState([]);
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  const [addressType, setAddressType] = useState('');
  const ref = useRef(null);
  const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (isNew) {
      const processSteps = initialData.fields.find((d) => d.type.toLowerCase() === 'process');

      if (processSteps) {
        initialData.fields.map((d) => {
          if (d.sectionName === processSteps.additionalInfoSection) {
            setAdditionalFieldName(d.sectionName);
          }
        });
      }
    }
    if (!isNew) {
      const processSteps = initialData.fields.find((d) => d.type.toLowerCase() === 'process');
      if (processSteps) {
        let len = processSteps.option.length;
        if (dataToUpdate.process !== processSteps.option[len - 1]['optionValue']) {
          initialData.fields.map((d) => {
            if (d.sectionName === processSteps.additionalInfoSection) {
              setAdditionalFieldName(d.sectionName);
            }
          });
        }
      }
    }
    let ownerCollaboratorOptions = initialData.fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
    if (ownerCollaboratorOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollaboratorOptions[0].option);
      setOwnerData(ownerCollaboratorOptions[0].option);
      setCollaboratorData(ownerCollaboratorOptions[0].option);
    }

    let customerAccountOptions = initialData.fields.find((d) => d.fieldName === 'customerAccount');
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }

    let supplierAccountOptions = initialData.fields.find((d) => d.fieldName === 'supplierAccount');
    if (supplierAccountOptions) {
      setSupplierData(supplierAccountOptions.option);
    }

    setFormsData(setFieldsInAscendingOrder(initialData.fields));

    return () => {
      setOwnerCollaboratorData([]);
      setOwnerData([]);
      setCollaboratorData([]);
      setAccountData([]);
      setSupplierData([]);
    };
  }, [initialData.fields]);

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData));
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData));
  };

  useEffect(() => {
    getOpportunityFields();

    return () => {
      setCurrencySymbol(null);
      setInitialData({
        fields: [],
        values: {}
      });
    };
  }, []);

  const getOpportunityFields = () => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(async ({ data: { data } }) => {
        const newFields = [];

        const filterData = isNew ? data.filter((d) => d.isCreate) : data.filter((d) => d.isUpdate);

        //  Initialize market segment dropdown which have parentMarketSegment === "" or that record have child
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

        const countryBillToDropdownData = filterData.map((m) => m.fieldData).find((d) => d.fieldName === 'countryBillTo');
        if (countryBillToDropdownData) {
          setCountryBillToMainData(countryBillToDropdownData.option);
          setCountryBillToDropDown(countryBillToDropdownData.option);
        }
        const countrySellToDropdownData = filterData.map((m) => m.fieldData).find((d) => d.fieldName === 'countrySellTo');
        if (countrySellToDropdownData) {
          setCountrySellToMainData(countrySellToDropdownData.option);
          setCountrySellToDropDown(countrySellToDropdownData.option);
        }

        filterData.map((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (accountId && [customerAccount.accountResource, supplierAccount.accountResource].some((d) => d === _f.fieldData.fieldName)) {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
          }

          if (!isNew && _f.fieldData.fieldName === 'currency') {
            setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === dataToUpdate['currency'])?.symbolNative);
          }
          if (isNew && userId && _f.fieldData.fieldName === 'owner') {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
          }

          if (_f.fieldData.fieldName !== 'supplierAccountName') {
            newFields.push(_f.fieldData);
          }
        });

        let tempInitialData = getObjKeys('', newFields);

        if (filterData.some((e) => e.fieldData.fieldName === 'currency')) {
          tempInitialData['currency'] = user.user?.brandCurrency;
        }
        if (isClone && opportunityId) {
          const {
            data: { data }
          } = await axiosInstance().get(`${opportunityApi}/${opportunityId}?entity=${selectedEntity}`);
          const { opportunityName, ...rest } = data;
          setCloneHeading(opportunityName);
          tempInitialData = getObjKeysWithValues({ ...rest }, newFields);
          if (data?.marketSegment?.optionValue && marketSegmentDropdownData) {
            setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter((d) => d.parentMarketSegment === data?.marketSegment?.optionValue));
          }
        } else {
          if (!isNew && marketSegmentDropdownData) {
            setSubMarketSegmentDataSource(
              marketSegmentDropdownData.option.filter((d) => d.parentMarketSegment === dataToUpdate.marketSegment?.optionValue)
            );
          }
        }

        if (!isClone && isNew && filterData?.some((e) => e.fieldName === 'currency')) {
          const selectedEntityDetails = user?.entity?.find((d) => d?._id === selectedEntity);
          if (selectedEntityDetails) {
            tempInitialData['currency'] = selectedEntityDetails.currency || '';
            setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === tempInitialData['currency'])?.symbolNative);
          }
        }

        setInitialData({
          fields: newFields,
          values: isNew ? tempInitialData : getObjKeysWithValues(dataToUpdate, newFields)
        });
      });
  };

  const onSubmit = (values) => {
    isNew ? handleCreateOpportunity(values) : handleUpdateOpportunity(values);
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

  const handleCreateOpportunity = (values) => {
    if (contactId && contactResource)
      values.staticData = {
        [contactResource]: [contactId]
      };
    setLoading(true);
    axiosInstance()
      .post(`${opportunityApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (isRedirectTodetailPage) history.push(`${opportunityApi}/detail/${newId}`);
        onSuccess(data);
        setTimeout(() => setLoading(false), 500);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleUpdateOpportunity = (values) => {
    values = { ...values, _id: dataToUpdate._id };
    setLoading(true);

    axiosInstance()
      .put(`${opportunityApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const updateAccountDropdown = (data) => {
    const entityFields = initialData.fields;
    const customerAccountNameFieldIndex = entityFields.findIndex((d) => d.fieldName === 'customerAccountName');

    if (customerAccountNameFieldIndex > -1) {
      entityFields[customerAccountNameFieldIndex].option = [
        ...entityFields[customerAccountNameFieldIndex].option,
        {
          optionValue: data._id,
          optionLabel: data.accountName,
          order: entityFields[customerAccountNameFieldIndex].option.length,
          default: false
        }
      ];

      setAccountData(entityFields[customerAccountNameFieldIndex].option);
    }
  };

  const onCountrySellToDropDownOpen = (selectedAccount, alreadySelected) => {
    let filterAddress = accountData.find((d) => d.optionValue === selectedAccount)?.shippingAddress;
    if (isArray(filterAddress) || alreadySelected) {
      setCountrySellToDropDown(
        countrySellToMainData.filter((d) => filterAddress?.some((u) => u === d.optionValue) || alreadySelected?.some((u) => u === d.optionValue))
      );
    } else {
      setCountrySellToDropDown([]);
    }
  };

  const onCountryBillToDropDownOpen = (selectedAccount, alreadySelected) => {
    let filterAddress = accountData.find((d) => d.optionValue === selectedAccount)?.billingAddress;
    if (isArray(filterAddress) || alreadySelected) {
      setCountryBillToDropDown(
        countryBillToMainData.filter((d) => filterAddress?.some((u) => u === d.optionValue) || alreadySelected?.some((u) => u === d.optionValue))
      );
    } else {
      setCountryBillToDropDown([]);
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

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
      >
        {initialData?.fields?.length ? (
          <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={onSubmit} innerRef={ref}>
            {({ submitForm, values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <Fragment>
                <CustomDialogHeader
                  title={isClone ? `Clone - ${cloneHeading}` : isNew ? 'Create Opportunity' : `Editing ${dataToUpdate.opportunityName}`}
                  onClose={(e, reason) => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {formsData &&
                      formsData
                        .filter((item) => item.name !== additionalFieldName)
                        .map((form, index1) => {
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
                                      {field.fieldName == 'customerAccount' ? (
                                        <Grid container spacing={1}>
                                          <Grid
                                            item
                                            xs={permissions.customerAccount.isCreate ? 11 : 11}
                                            sm={permissions.customerAccount.isCreate ? 11 : 11}
                                            md={permissions.customerAccount.isCreate ? 11 : 11}
                                          >
                                            <FormTypes
                                              isNew={isNew}
                                              {...field}
                                              disabled={disableOwnerAndAccount || (!isNew && field.disableOnEdit)}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={accountData}
                                              onChange={(e, value) => {
                                                setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                                if (initialData?.fields?.some((e) => e.fieldName === 'marketSegment')) {
                                                  setFieldValue('marketSegment', value?.marketSegment ?? '');
                                                  marketSegmentChange(value?.marketSegment ?? '');
                                                }
                                                if (initialData?.fields?.some((e) => e.fieldName === 'subMarketSegment')) {
                                                  setFieldValue('subMarketSegment', value?.subMarketSegment ?? '');
                                                }
                                                if (initialData?.fields?.some((e) => e.fieldName === 'countryBillTo')) {
                                                  setFieldValue('countryBillTo', value?.billingAddress?.length > 0 ? value?.billingAddress : []);
                                                }
                                                if (initialData?.fields?.some((e) => e.fieldName === 'countrySellTo')) {
                                                  setFieldValue('countrySellTo', value?.shippingAddress?.length > 0 ? value?.shippingAddress : []);
                                                }
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                              doNotShowInfoTooltip={true}
                                            />
                                          </Grid>
                                          {permissions.customerAccount.isCreate && !accountId && (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip title="Create Account" className="mt-1">
                                                <IconButton
                                                  onClick={() => {
                                                    setShowAddCustomerAccountDialog(true);
                                                  }}
                                                  disabled={disableOwnerAndAccount || (!isNew && field.disableOnEdit)}
                                                  size="small"
                                                >
                                                  <AddIcon
                                                    color={disableOwnerAndAccount || (!isNew && field.disableOnEdit) ? 'disabled' : 'primary'}
                                                  />
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
                                      ) : field.fieldName === 'supplierAccount' ? (
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid
                                              item
                                              xs={permissions.supplierAccount?.isCreate ? 11 : 11}
                                              sm={permissions.supplierAccount?.isCreate ? 11 : 11}
                                              md={permissions.supplierAccount?.isCreate ? 11 : 11}
                                            >
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                disabled={!isNew && field.disableOnEdit}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={supplierData}
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
                                            {permissions.supplierAccount?.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip title="Add Supplier Account" className="mt-1">
                                                  <IconButton
                                                    onClick={() => {
                                                      setShowAddSupplierAccountDialog(true);
                                                    }}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                      ) : field.fieldName === 'countryBillTo' ? (
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid
                                              item
                                              xs={permissions.address?.isCreate ? 11 : 11}
                                              sm={permissions.address?.isCreate ? 11 : 11}
                                              md={permissions.address?.isCreate ? 11 : 11}
                                            >
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                disabled={!isNew && field.disableOnEdit}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={countryBillToDropDown}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(name, value);
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                                onOpen={() => onCountryBillToDropDownOpen(values.customerAccountName, values.countryBillTo)}
                                              />
                                            </Grid>
                                            {permissions.address?.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip title="Add Country Bill to Address" className="mt-1">
                                                  <IconButton
                                                    onClick={() => {
                                                      setShowAddressDialog(true);
                                                      setAddressType('countryBillTo');
                                                    }}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                      ) : field.fieldName === 'countrySellTo' ? (
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid
                                              item
                                              xs={permissions.address?.isCreate ? 11 : 11}
                                              sm={permissions.address?.isCreate ? 11 : 11}
                                              md={permissions.address?.isCreate ? 11 : 11}
                                            >
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                disabled={!isNew && field.disableOnEdit}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={countrySellToDropDown}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(name, value);
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                                onOpen={() => onCountrySellToDropDownOpen(values.customerAccountName, values.countrySellTo)}
                                              />
                                            </Grid>
                                            {permissions.address?.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip title="Add Country Sell to Address" className="mt-1">
                                                  <IconButton
                                                    onClick={() => {
                                                      setShowAddressDialog(true);
                                                      setAddressType('countrySellTo');
                                                    }}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                      ) : field.fieldName === 'owner' ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={ownerData}
                                          onChange={(e, val) => {
                                            setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');

                                            if (val && val.optionValue !== user?.user?._id) {
                                              const checkOwnerAddedInCollaborator = values['collaborator'].find(
                                                (d) => d?.optionValue === user?.user?._id
                                              );
                                              if (!checkOwnerAddedInCollaborator) {
                                                setFieldValue('collaborator', [
                                                  ...values['collaborator'],
                                                  collaboratorData.find((d) => d?.optionValue === user?.user?._id).optionValue
                                                ]);
                                              }
                                            }
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          disabled={disableOwnerSelection || (!isNew && field.disableOnEdit)}
                                          onOpen={() => {
                                            onOwnerDropdownOpen(values['collaborator']);
                                          }}
                                        />
                                      ) : field.fieldName === 'collaborator' ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          disabled={!isNew && field.disableOnEdit}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={collaboratorData}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onOpen={() => {
                                            onCollabOwnerMultiselectOpen(values['owner']);
                                          }}
                                        />
                                      ) : field.fieldName === 'probability' ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          // {...rest}
                                          disabled={!isNew && field.disableOnEdit}
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
                                          onChange={(e) => {
                                            if (e.target.value && parseFloat(e.target.value) > 100) {
                                              setFieldValue('probability', '100');
                                            } else {
                                              setFieldValue('probability', e.target.value);
                                            }
                                          }}
                                        />
                                      ) : field.fieldName === 'lostReason' ? (
                                        values['stage'] === 'Closed Lost' ? (
                                          <FormTypes
                                            isNew={isNew}
                                            {...field}
                                            // {...rest}
                                            disabled={!isNew && field.disableOnEdit}
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
                                        ) : null
                                      ) : field.fieldName === 'currency' ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          // {...rest}
                                          disabled={!isNew && field.disableOnEdit}
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
                                      ) : field.fieldName.trim() === 'estimatedAmount' ? (
                                        <FormTypes
                                          isNew={isNew}
                                          {...field}
                                          // {...rest}
                                          disabled={!isNew && field.disableOnEdit}
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
                                      ) : field.fieldName === formFieldNames.marketSegment ? (
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid
                                              item
                                              xs={permissions.marketSegment?.isCreate ? 11 : 11}
                                              sm={permissions.marketSegment?.isCreate ? 11 : 11}
                                              md={permissions.marketSegment?.isCreate ? 11 : 11}
                                            >
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                disabled={!isNew && field.disableOnEdit}
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
                                                values={
                                                  newMarketSegmentId ? initializeMarketSegmentDropdown(values, marketSegmentDataSource) : values
                                                }
                                                options={marketSegmentDataSource}
                                                doNotShowInfoTooltip={true}
                                              />
                                            </Grid>
                                            {
                                              // permissions.productCategory
                                              //     .isCreate
                                              permissions.marketSegment?.isCreate && (
                                                <Grid item xs={1} sm={1} md={1}>
                                                  <Tooltip title="Add Market Segment" className="mt-1">
                                                    <IconButton
                                                      onClick={() => {
                                                        setShowAddMarketSegmentDialog(true);
                                                      }}
                                                      disabled={!isNew && field.disableOnEdit}
                                                      size="small"
                                                    >
                                                      <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
                                                    </IconButton>
                                                  </Tooltip>
                                                </Grid>
                                              )
                                            }
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
                                              xs={permissions.marketSegment?.isCreate ? 11 : 11}
                                              sm={permissions.marketSegment?.isCreate ? 11 : 11}
                                              md={permissions.marketSegment?.isCreate ? 11 : 11}
                                            >
                                              <FormTypes
                                                isNew={isNew}
                                                {...field}
                                                disabled={!isNew && field.disableOnEdit}
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
                                                  newSubMarketSegmentId
                                                    ? initializeSubMarketSegmentDropdown(values, subMarketSegmentDataSource)
                                                    : values
                                                }
                                                options={subMarketSegmentDataSource}
                                                doNotShowInfoTooltip={true}
                                              />
                                            </Grid>
                                            {permissions.marketSegment?.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip title="Add Sub Market Segment" className="mt-1">
                                                  <IconButton
                                                    onClick={() => {
                                                      setShowAddMarketSegmentDialog(true);
                                                    }}
                                                    disabled={!isNew && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={!isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                          isNew={isNew}
                                          {...field}
                                          // {...rest}
                                          disabled={!isNew && field.disableOnEdit}
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
                                isNew={isNew}
                                {...field}
                                // {...rest}
                                disabled={!isNew && field.disableOnEdit}
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
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (!isEqual(ref.current.values, initialData.values)) {
                        setShowConfirmDialog(true);
                      } else {
                        onClose();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
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
                      submitForm();
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
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
                {showAddressDialog && (
                  <ManageAddressDialog
                    onClose={() => {
                      setShowAddressDialog(false);
                    }}
                    onSuccess={(obj) => {
                      if (obj) {
                        setShowAddressDialog(false);
                        if (obj?.isAlreadyExist === true) {
                          let tempAddress =
                            addressType === 'countryBillTo'
                              ? countryBillToMainData.find((d) => d?.optionLabel === obj?.fullAddress)
                              : countrySellToMainData.find((d) => d?.optionLabel === obj?.fullAddress);
                          if (addressType === 'countryBillTo') {
                            onCountryBillToDropDownOpen(
                              values.customerAccountName,
                              values.countryBillTo ? [...values.countryBillTo, tempAddress?.optionValue] : [tempAddress?.optionValue]
                            );
                          } else {
                            onCountrySellToDropDownOpen(
                              values.customerAccountName,
                              values.countrySellTo ? [...values.countrySellTo, tempAddress?.optionValue] : [tempAddress?.optionValue]
                            );
                          }
                          setFieldValue(addressType, [...values[`${addressType}`], tempAddress?.optionValue]);
                        } else {
                          addressType === 'countryBillTo'
                            ? setCountryBillToMainData((prevState) => [
                                ...prevState,
                                {
                                  default: false,
                                  optionLabel: obj?.fullAddress,
                                  optionValue: obj._id,
                                  order: countryBillToMainData.length + 1
                                }
                              ])
                            : setCountrySellToMainData((prevState) => [
                                ...prevState,
                                {
                                  default: false,
                                  optionLabel: obj?.fullAddress,
                                  optionValue: obj._id,
                                  order: countrySellToMainData.length + 1
                                }
                              ]);
                          addressType === 'countryBillTo'
                            ? setCountryBillToDropDown((prevState) => [
                                ...prevState,
                                {
                                  default: false,
                                  optionLabel: obj?.fullAddress,
                                  optionValue: obj._id,
                                  order: countryBillToDropDown.length + 1
                                }
                              ])
                            : setCountrySellToDropDown((prevState) => [
                                ...prevState,
                                {
                                  default: false,
                                  optionLabel: obj?.fullAddress,
                                  optionValue: obj._id,
                                  order: countrySellToDropDown.length + 1
                                }
                              ]);
                          setFieldValue(addressType, [...values[`${addressType}`], obj._id]);
                        }
                      }
                    }}
                  />
                )}

                {showAddSupplierAccountDialog && (
                  <ManageAccountDialog
                    open={showAddSupplierAccountDialog}
                    onClose={() => {
                      setShowAddSupplierAccountDialog(false);
                    }}
                    id={null}
                    accountResource="supplierAccount"
                    accountApi="supplier-account"
                    isGetAccountData={true}
                    onGetAddedAccount={({ data }) => {
                      setSupplierData((prevState) => {
                        return [
                          ...prevState,
                          {
                            optionValue: data._id,
                            optionLabel: data.accountName,
                            order: supplierData.length,
                            default: false
                          }
                        ];
                      });

                      setFieldValue('supplierAccount', [...values['supplierAccount'], data._id]);
                    }}
                    isRedirectToDetailPage={false}
                  />
                )}

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
                      setAccountData((prevState) => {
                        return [
                          ...prevState,
                          {
                            optionValue: data._id,
                            optionLabel: data.accountName,
                            order: accountData.length,
                            default: false
                          }
                        ];
                      });
                      setFieldValue('customerAccount', data._id);
                      setFieldValue('marketSegment', data?.marketSegment ?? '');
                      setFieldValue('subMarketSegment', data?.subMarketSegment ?? '');
                      setFieldValue('countryBillTo', data?.billingAddress ?? '');
                      setFieldValue('countrySellTo', data?.shippingAddress ?? '');
                    }}
                    isRedirectToDetailPage={false}
                  />
                )}
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
}

ManageOpportunityDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool
};
