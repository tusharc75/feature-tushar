import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Grid, IconButton, Tooltip } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  customerAccount,
  customerContact,
  getCollaboratorDropdownDataSource,
  getObjKeys,
  getObjKeysWithValues,
  getOwnerDropdownDataSource,
  rentalManagement,
  setFieldsInAscendingOrder,
  yupSchema,
  generateUniqueIdOnly,
  RENTAL_STATUS,
  getNestedlookupDependentOn
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import moment from 'moment';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageAccountDialog from '../../Account/ManageAccount';
import ManageContactDialog from '../../Contact/ManageContact';
import ManageAddressDialog from 'src/components/Address/ManageAddressDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';

const ManageRentalManagementDialog = ({
  isClone,
  rentalManagementId,
  rentalManagementData = null,
  onClose,
  onSuccess,
  open,
  referenceData = null,
  isDisableCustomerAccount = false
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);

  const [rentalData, setRentalData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [contactData, setContactData] = useState([]);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] = useState(false);
  const [showAddCustomerContactDialog, setShowAddCustomerContactDialog] = useState(false);

  const [accountData, setAccountData] = useState([]);
  const [customerContactMainDataSource, setCustomerContactMainDataSource] = useState([]);
  const [customerContactDataSource, setCustomerContactDataSource] = useState([]);

  const [rentalDetails, setRentalDetails] = useState(null);

  const [addressData, setAddressData] = useState([]);
  const [billingAddress, setBillingAddress] = useState([]);
  const [shippingAddress, setShippingAddress] = useState([]);
  const [cloneHeading, setCloneHeading] = useState('');

  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressType, setAddressType] = useState('');

  const updateAccountDropdown = (data) => {
    const entityFields = rentalData.fields;
    const customerAccountNameFieldIndex = entityFields.findIndex((d) => d.fieldName === 'customerAccount');
    if (customerAccountNameFieldIndex > -1) {
      entityFields[customerAccountNameFieldIndex].option = [
        ...entityFields[customerAccountNameFieldIndex].option,
        {
          optionValue: data._id,
          optionLabel: data.accountName,
          order: entityFields[customerAccountNameFieldIndex].option.length,
          default: false,
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress
        }
      ];
      setAccountData(entityFields[customerAccountNameFieldIndex].option);
    }
  };

  const updateContactDropdown = (data) => {
    const entityFields = rentalData.fields;
    const customerContactNameFieldIndex = entityFields.findIndex((d) => d.fieldName === 'customerContact');
    if (customerContactNameFieldIndex > -1) {
      const newCustomer = {
        optionValue: data._id,
        optionLabel: `${data.firstName} ${data.lastName}`,
        order: entityFields[customerContactNameFieldIndex].option.length,
        default: false,
        parentAccount: data.accountName
      };
      entityFields[customerContactNameFieldIndex].option = [...entityFields[customerContactNameFieldIndex].option, newCustomer];
      setCustomerContactMainDataSource(entityFields[customerContactNameFieldIndex].option);
      setCustomerContactDataSource((prevState) => [...prevState, newCustomer]);
    }
  };

  useEffect(() => {
    const ownerCollabOptions = rentalData.fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }
    let customerAccountOptions = rentalData.fields.find((d) => d.fieldName === 'customerAccount');
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }
    let customerContactOptions = rentalData.fields.find((d) => d.fieldName === 'customerContact');
    if (customerContactOptions) {
      setContactData(customerContactOptions.option);
    }
    const customerContactDropdownData = rentalData.fields.find((d) => d.fieldName === 'customerContact');
    const billingAddressDropdownData = rentalData.fields.find((d) => d.fieldName === 'billingAddress' || d.fieldName === 'shippingAddress');
    if (billingAddressDropdownData) {
      setAddressData(billingAddressDropdownData.option);
      setBillingAddress(billingAddressDropdownData.option);
      setShippingAddress(billingAddressDropdownData.option);
    }
    if (customerContactDropdownData) {
      setCustomerContactMainDataSource(customerContactDropdownData.option);
      if (rentalManagementId) {
        setCustomerContactDataSource(
          customerContactDropdownData?.option.filter((d) => d.parentAccount === rentalManagementData?.customerAccount.optionValue)
        );
      }
    }
    setFormsData(setFieldsInAscendingOrder(rentalData.fields));
  }, [rentalData.fields]);

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData));
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData));
  };

  const onCustomerContactDropdownOpen = (selectedAccount) => {
    setCustomerContactDataSource(customerContactMainDataSource.filter((d) => d.parentAccount === selectedAccount));
  };

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [rentalManagementId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Rental Management');
      fieldData = response?.data?.data;
      
      fieldData = fieldData?.filter((e) => !['quotation'].includes(e?.fieldData?.fieldName));

      var fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      var fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (rentalManagementId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${rentalManagement.api}/` + rentalManagementId);
          data = response?.data?.data;
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, rentalJobName, updatedBy, ...rest } = data;
            rest['status'] = 'New';
            rest['rentalJobName'] = `RJ_${generateUniqueIdOnly()}`;
            rest['estimateStartDate'] = new Date();
            rest['estimateEndDate'] = '';
            rest['actualStartDate'] = '';
            rest['actualEndDate'] = '';
            fieldsDataForCreate = fieldsDataForCreate?.filter((obj) => !['actualStartDate', 'actualEndDate'].includes(obj.fieldName));
            setCloneHeading(rentalJobName);
            setRentalData({
              fields: fieldsDataForCreate,
              initialValues: { ...getObjKeysWithValues(rest, fieldsDataForCreate), estimateEndDate: null }
            });
            setLoading(false);
          } else {
            setRentalDetails(data);
            if (data?.actualStartDate === '') {
              fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !['actualStartDate'].includes(obj.fieldName));
            }
            if (data?.actualEndDate === '') {
              fieldsDataForUpdate = fieldsDataForUpdate?.filter((obj) => !['actualEndDate'].includes(obj.fieldName));
            }
            setRentalData({
              fields: fieldsDataForUpdate,
              initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        fieldsDataForCreate = fieldsDataForCreate?.filter((obj) => !['actualStartDate', 'actualEndDate'].includes(obj.fieldName));
        let initialData = getObjKeys('', fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          initialData['currency'] = user.user?.brandCurrency;
        }
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'estimateEndDate')) {
          initialData['estimateEndDate'] = null;
        }
        initialData['actualStartDate'] = '';
        initialData['actualEndDate'] = '';
        if (fieldsDataForCreate?.some((e) => e.primaryField && e.isSystemGenerate)) {
          initialData['rentalJobName'] = `RJ_${generateUniqueIdOnly()}`;
        }
        if (referenceData) {
          if (fieldsDataForCreate?.some((e) => e.fieldName === 'warehouse')) {
            initialData['warehouse'] = referenceData?.warehouse;
          }
        }
        setRentalData({
          fields: fieldsDataForCreate,
          initialValues: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (rentalManagementId && isClone === false) {
      values._id = rentalManagementId;
      axiosInstance()
        .put(`${rentalManagement.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${rentalManagement.api}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          if (referenceData) {
            onSuccess(data);
          } else {
            history.push(`${routes.rentalManagementDetail.path}/${data?._id}`);
            setLoading(false);
          }
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
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  const onShippingAddressOpen = (customerAccount, shippingAddress) => {
    let filterAddress = accountData.find((d) => d.optionValue === customerAccount)?.shippingAddress;
    if (filterAddress || shippingAddress) {
      setShippingAddress(addressData.filter((d) => filterAddress?.some((u) => u === d.optionValue) || d.optionValue === shippingAddress));
    } else {
      setShippingAddress([]);
    }
  };

  const onBillingAddressOpen = (customerAccount, billingAddress) => {
    let filterAddress = accountData.find((d) => d.optionValue === customerAccount)?.billingAddress;
    if (filterAddress || billingAddress) {
      setBillingAddress(addressData.filter((d) => filterAddress?.some((u) => u === d.optionValue) || d.optionValue === billingAddress));
    } else {
      setBillingAddress([]);
    }
  };

  function validate(values) {
    const errors = {};
    let estimateStartDate = moment(values?.estimateStartDate);
    let estimateEndDate = moment(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    let actualStartDate = moment(values?.actualStartDate);
    let actualEndDate = moment(values?.actualEndDate);
    if (actualStartDate.format('YYYY-MM-DD') !== actualEndDate.format('YYYY-MM-DD')) {
      if (actualEndDate.diff(actualStartDate, 'days') <= 0) {
        errors['actualEndDate'] = 'Please enter valid actual end date';
      }
    }
    return errors;
  }

  return (
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
      {rentalData.fields.length ? (
        <Formik
          initialValues={rentalData.initialValues}
          validationSchema={yupSchema(rentalData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  !rentalManagementId
                    ? `Create ${routes.rentalManagement.title}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${rentalManagementData?.rentalJobName}`}`
                }
                onClose={(e, reason) => {
                  if (isEqual(rentalData.initialValues, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
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
                    formsData.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    {field.fieldName == 'customerAccount' ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions.customerAccount?.isCreate ? 11 : 11}
                                          sm={permissions.customerAccount?.isCreate ? 11 : 11}
                                          md={permissions.customerAccount?.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            isNew={!rentalManagementId}
                                            values={values}
                                            errors={errors}
                                            fieldData={field}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountData}
                                            disabled={!isClone ? (rentalManagementId && field.disableOnEdit) || isDisableCustomerAccount : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            doNotShowInfoTooltip={true}
                                            onChange={(e, value) => {
                                              setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                              if (rentalData?.fields?.some((e) => e.fieldName === 'customerContact')) {
                                                setFieldValue('customerContact', '');
                                              }
                                              if (rentalData?.fields?.some((e) => e.fieldName === 'billingAddress')) {
                                                setFieldValue('billingAddress', '');
                                              }
                                              if (rentalData?.fields?.some((e) => e.fieldName === 'shippingAddress')) {
                                                setFieldValue('shippingAddress', '');
                                              }
                                              const fieldChange: any = getNestedlookupDependentOn(rentalData?.fields, 'customerAccount');
                                              fieldChange.forEach((val: any) => {
                                                setFieldValue(val.fieldName, val.value);
                                              });
                                            }}
                                          />
                                        </Grid>
                                        {permissions.customerAccount?.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Create Account" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddCustomerAccountDialog(true);
                                                }}
                                                disabled={!isClone ? rentalManagementId && field.disableOnEdit : false}
                                                size="small"
                                              >
                                                <AddIcon
                                                  color={isClone ? 'primary' : rentalManagementId && field.disableOnEdit ? 'disabled' : 'primary'}
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
                                    ) : field.fieldName === 'customerContact' ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions.customerContact?.isCreate ? 11 : 11}
                                          sm={permissions.customerContact?.isCreate ? 11 : 11}
                                          md={permissions.customerContact?.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            isNew={!rentalManagementId}
                                            values={values}
                                            fieldData={field}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={customerContactDataSource}
                                            doNotShowInfoTooltip={true}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            disabled={!isClone ? rentalManagementId && field.disableOnEdit : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={false}
                                            size="small"
                                            onOpen={() => onCustomerContactDropdownOpen(values['customerAccount'])}
                                          // onChange={(e, value) => {
                                          //   setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");

                                          // }}
                                          />
                                        </Grid>
                                        {permissions.customerContact?.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Create Contact" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddCustomerContactDialog(true);
                                                }}
                                                disabled={!isClone ? rentalManagementId && field.disableOnEdit : false}
                                                size="small"
                                              >
                                                <AddIcon
                                                  color={isClone ? 'primary' : rentalManagementId && field.disableOnEdit ? 'disabled' : 'primary'}
                                                />
                                              </IconButton>
                                            </Tooltip>
                                          </Grid>
                                        )}
                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip className="mt-2" title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                      </Grid>
                                    ) : field.fieldName === 'owner' ? (
                                      <FormTypes
                                        rentalManagementId={rentalManagementId}
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        fieldData={field}
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
                                        disabled={!rentalManagementId && field.disableOnEdit}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(values['collaborator']);
                                        }}
                                      />
                                    ) : field.fieldName === 'collaborator' ? (
                                      <FormTypes
                                        rentalManagementId={rentalManagementId}
                                        {...field}
                                        disabled={!rentalManagementId && field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        fieldData={field}
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
                                    ) : field.fieldName === 'estimateStartDate' ? (
                                      <FormTypes
                                        {...field}
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
                                      />
                                    ) : field.fieldName === 'estimateEndDate' ? (
                                      <FormTypes
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        fieldData={field}
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
                                    ) : field.fieldName === 'actualStartDate' ? (
                                      <FormTypes
                                        {...field}
                                        disabled={values['status'] === RENTAL_STATUS.readyToInvoice ? false : true}
                                        fieldData={field}
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
                                    ) : field.fieldName === 'actualEndDate' ? (
                                      <FormTypes
                                        {...field}
                                        disabled={values['status'] === RENTAL_STATUS.readyToInvoice ? false : true}
                                        fieldData={field}
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
                                    ) : field.fieldName === 'billingAddress' ? (
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(rentalManagementId) && field.disableOnEdit && !isClone}
                                            fieldData={field}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={billingAddress}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onOpen={() => onBillingAddressOpen(values['customerAccount'], values['billingAddress'])}
                                          />
                                        </Box>
                                        <Box>
                                          <Tooltip title={`Add ${field.fieldLabel}`} className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setShowAddressDialog(true);
                                                setAddressType('billingAddress');
                                              }}
                                              disabled={field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>
                                    ) : field.fieldName === 'shippingAddress' ? (
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(rentalManagementId) && field.disableOnEdit && !isClone}
                                            fieldData={field}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={shippingAddress}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onOpen={() => onShippingAddressOpen(values['customerAccount'], values['shippingAddress'])}
                                          />
                                        </Box>
                                        <Box>
                                          <Tooltip title={`Add ${field.fieldLabel}`} className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setShowAddressDialog(true);
                                                setAddressType('shippingAddress');
                                              }}
                                              disabled={field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>
                                    ) : (
                                      <FormTypes
                                        rentalManagementId={rentalManagementId}
                                        {...field}
                                        fieldData={field}
                                        disabled={
                                          field.fieldName === 'currency'
                                            ? rentalDetails && rentalDetails?.material?.length
                                              ? true
                                              : false
                                            : field.fieldName === 'warehouse'
                                              ? rentalDetails && rentalDetails?.productInventory?.length
                                                ? true
                                                : false
                                              : rentalManagementId && field.disableOnEdit && !isClone
                                        }
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
                                        fields={rentalData.fields}
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
                    if (isEqual(rentalData.initialValues, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
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
              {showConfirmDialog && (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);

                    submitForm();
                  }}
                  close={() => setShowConfirmDialog(false)}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
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
                    updateAccountDropdown(data);
                    if (rentalData?.fields?.some((e) => e.fieldName === 'customerAccount')) {
                      setFieldValue('customerAccount', data._id);
                    }
                    if (rentalData?.fields?.some((e) => e.fieldName === 'customerContact')) {
                      setFieldValue('customerContact', '');
                    }
                    if (rentalData?.fields?.some((e) => e.fieldName === 'billingAddress')) {
                      setFieldValue('billingAddress', '');
                    }
                    if (rentalData?.fields?.some((e) => e.fieldName === 'shippingAddress')) {
                      setFieldValue('shippingAddress', '');
                    }
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
                      setFieldValue('customerContact', obj.id);
                    }
                  }}
                  accountId={values['customerAccount']}
                  contactResource={customerContact.contactResource}
                  contactApi={customerContact.contactApi}
                  isRedirectToDetailPage={false}
                  collaborators={collaboratorData}
                  owner={ownerData}
                  account={customerAccount}
                  isAccountFieldDisable={true}
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
                          addressType === 'shippingAddress'
                            ? addressData.find((d) => d?.optionLabel === obj?.fullAddress)
                            : addressData.find((d) => d?.optionLabel === obj?.fullAddress);
                        if (addressType === 'shippingAddress') {
                          onShippingAddressOpen(values.customerAccount, tempAddress?.optionValue);
                        } else {
                          onBillingAddressOpen(values.customerAccount, tempAddress?.optionValue);
                        }
                        setFieldValue(addressType, tempAddress?.optionValue);
                      } else {
                        setAddressData((prevState) => [
                          ...prevState,
                          {
                            default: false,
                            optionLabel: obj?.fullAddress,
                            optionValue: obj._id,
                            order: addressData.length + 1
                          }
                        ]);
                        if (addressType === 'shippingAddress') {
                          setShippingAddress((prevState) => [
                            ...prevState,
                            {
                              default: false,
                              optionLabel: obj?.fullAddress,
                              optionValue: obj._id,
                              order: shippingAddress.length + 1
                            }
                          ]);
                        } else {
                          setBillingAddress((prevState) => [
                            ...prevState,
                            {
                              default: false,
                              optionLabel: obj?.fullAddress,
                              optionValue: obj._id,
                              order: billingAddress.length + 1
                            }
                          ]);
                        }
                        setFieldValue(addressType, obj._id);
                      }
                    }
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

export default ManageRentalManagementDialog;
