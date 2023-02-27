import { Box, Button, CircularProgress, Dialog, Grid, IconButton, Tooltip } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import {
  CustomDialogTransition,
  customerAccount,
  customerContact,
  generateUniqueIdOnly,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
  isFieldNotTouched,
  setFieldsInAscendingOrder
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { FaDiceOne } from 'react-icons/fa';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import { useHistory } from 'react-router-dom';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageAccountDialog from '../Account/ManageAccount';
import ManageContactDialog from '../Contact/ManageContact';
import ManageAddressDialog from 'src/components/Address/ManageAddressDialog';

const ManagePlanning = ({ onClose, onSuccess, isClone = false, id = null }) => {
  const {
    state: { user, permissions }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [addressType, setAddressType] = useState('');
  const [contactData, setContactData] = useState([]);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] = useState(false);
  const [showAddCustomerContactDialog, setShowAddCustomerContactDialog] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [customerContactMainDataSource, setCustomerContactMainDataSource] = useState([]);
  const [customerContactDataSource, setCustomerContactDataSource] = useState([]);
  const [addressData, setAddressData] = useState([]);
  const [billingAddress, setBillingAddress] = useState([]);
  const [shippingAddress, setShippingAddress] = useState([]);
  const [formValues, setFormValues] = useState({});
  const ref = useRef(null);
  const history = useHistory();

  const updateAccountDropdown = (data) => {
    const entityFields = initialData.fields;
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
    const entityFields = initialData.fields;
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

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData));
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData));
  };

  const onCustomerContactDropdownOpen = (selectedAccount) => {
    setCustomerContactDataSource(customerContactMainDataSource.filter((d) => d.parentAccount === selectedAccount));
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

  const fetchFields = async () => {
    try {
      const response = await axiosInstance().get('/field?resource=Planning');
      const data = response?.data?.data;
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate && !["rentalJob", "salesOrder", "serviceOrder"]?.includes(obj.fieldData?.fieldName)).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate && !["rentalJob", "salesOrder", "serviceOrder"]?.includes(obj.fieldData?.fieldName)).map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`${routes?.planning?.path}/${id}`)
          .then(({ data: { data } }) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { planningNumber, ...rest } = data;
              rest.planningNumber = `PLO_${generateUniqueIdOnly()}`;
              setCloneHeading(planningNumber);
              tempData = rest;
            }
            setInitialData({
              fields: fields,
              values: getObjKeysWithValues(tempData, fields)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
        tempInitialData["planningNumber"] = `PLO_${generateUniqueIdOnly()}`;
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          tempInitialData['currency'] = user.user?.brandCurrency;
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
        setFormValues(tempInitialData)
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes.planning?.path}`, values)
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
      axiosInstance()
        .post(`${routes.planning?.path}`, values)
        .then(({ data }) => {
          setLoading(false);
          setSubmitting(true);
          history.push(`${routes.planningDetail.path}/${data?.data?._id}`);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
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

  useEffect(() => {
    const ownerCollabOptions = initialData.fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }
    let customerAccountOptions = initialData.fields.find((d) => d.fieldName === 'customerAccount');
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }
    let customerContactOptions = initialData.fields.find((d) => d.fieldName === 'customerContact');
    if (customerContactOptions) {
      setContactData(customerContactOptions.option);
    }
    const customerContactDropdownData = initialData.fields.find((d) => d.fieldName === 'customerContact');
    const billingAddressDropdownData = initialData.fields.find((d) => d.fieldName === 'billingAddress' || d.fieldName === 'shippingAddress');
    if (billingAddressDropdownData) {
      setAddressData(billingAddressDropdownData.option);
      setBillingAddress(billingAddressDropdownData.option);
      setShippingAddress(billingAddressDropdownData.option);
    }
    if (customerContactDropdownData) {
      setCustomerContactMainDataSource(customerContactDropdownData.option);
      if (id) {
        setCustomerContactDataSource(
          customerContactDropdownData?.option.filter((d) => d.parentAccount === initialData.values?.customerAccount)
        );
      }
    }
    setFormsData(setFieldsInAscendingOrder(initialData?.fields));
  }, [initialData?.fields]);

  useEffect(() => {
    fetchFields();
  }, []);

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (isFieldNotTouched(initialData.data, formValues)) onClose()
        else setShowConfirmDialog(true)
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit} innerRef={ref}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={`${id
                  ? isClone
                    ? `Clone - ${cloneHeading}`
                    : `Update ${initialData.values?.planningNumber ? `(${initialData.values?.planningNumber})` : ''}`
                  : `Create ${routes?.planning?.title}`
                  }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData &&
                    formsData.map((form, index1) => {
                      return (
                        form.name && (
                          <div key={index1}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    {field.fieldName === 'customerAccount' ? (
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={permissions.customerAccount?.isCreate ? 11 : 11}
                                          sm={permissions.customerAccount?.isCreate ? 11 : 11}
                                          md={permissions.customerAccount?.isCreate ? 11 : 11}
                                        >
                                          <FormTypes
                                            {...field}
                                            isNew={!id}
                                            values={values}
                                            errors={errors}
                                            fieldData={field}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountData}
                                            disabled={!isClone ? id && field.disableOnEdit : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            doNotShowInfoTooltip={true}
                                            onChange={(e, value) => {
                                              setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                              if (initialData?.fields?.some((e) => e.fieldName === 'customerContact')) {
                                                setFieldValue('customerContact', '');
                                              }
                                              if (initialData?.fields?.some((e) => e.fieldName === 'billingAddress')) {
                                                setFieldValue('billingAddress', '');
                                              }
                                              if (initialData?.fields?.some((e) => e.fieldName === 'shippingAddress')) {
                                                setFieldValue('shippingAddress', '');
                                              }
                                              handleValuesChange({
                                                [field.fieldName]: value && value.optionValue ? value.optionValue : ''
                                              });
                                            }}
                                          />
                                        </Grid>
                                        {permissions.customerAccount?.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Add Account" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddCustomerAccountDialog(true);
                                                }}
                                                disabled={!isClone ? id && field.disableOnEdit : false}
                                                size="small"
                                              >
                                                <AddIcon color={isClone ? 'primary' : id && field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                            isNew={!id}
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
                                              handleValuesChange({ [name]: value });
                                              setFieldValue(name, value);
                                            }}
                                            disabled={!isClone ? id && field.disableOnEdit : false}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={false}
                                            size="small"
                                            onOpen={() => onCustomerContactDropdownOpen(values['customerAccount'])}
                                          />
                                        </Grid>
                                        {permissions.customerContact?.isCreate && (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title="Add Contact" className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddCustomerContactDialog(true);
                                                }}
                                                disabled={!isClone ? id && field.disableOnEdit : false}
                                                size="small"
                                              >
                                                <AddIcon color={isClone ? 'primary' : id && field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                        serviceOrderId={id}
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
                                          handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : '' });

                                          if (val && val.optionValue !== user?.user?._id) {
                                            const checkOwnerAddedInCollaborator = values['collaborator'].find(
                                              (d) => d?.optionValue === user?.user?._id
                                            );
                                            if (!checkOwnerAddedInCollaborator) {
                                              setFieldValue('collaborator', [
                                                ...values['collaborator'],
                                                collaboratorData.find((d) => d?.optionValue === user?.user?._id).optionValue
                                              ]);
                                              handleValuesChange({
                                                collaborator: collaboratorData.find((d) => d?.optionValue === user?.user?._id).optionValue
                                              });
                                            }
                                          }
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        disabled={!id && field.disableOnEdit}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(values['collaborator']);
                                        }}
                                      />
                                    ) : field.fieldName === 'collaborator' ? (
                                      <FormTypes
                                        serviceOrderId={id}
                                        {...field}
                                        disabled={!id && field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        fieldData={field}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={collaboratorData}
                                        setFieldValue={(name, value) => {
                                          handleValuesChange({ [name]: value });
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
                                    ) : field.fieldName === 'billingAddress' ? (
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(id) && field.disableOnEdit && !isClone}
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
                                            disabled={Boolean(id) && field.disableOnEdit && !isClone}
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
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={null}
                                        disabled={field.disableOnEdit}
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
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (
                      isFieldNotTouched(
                        {
                          initialValues: initialData.values,
                          fields: initialData.fields
                        },
                        values
                      )
                    )
                      onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading || submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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
                    if (initialData?.fields?.some((e) => e.fieldName === 'customerAccount')) {
                      setFieldValue('customerAccount', data._id);
                    }
                    if (initialData?.fields?.some((e) => e.fieldName === 'customerContact')) {
                      setFieldValue('customerContact', '');
                    }
                    if (initialData?.fields?.some((e) => e.fieldName === 'billingAddress')) {
                      setFieldValue('billingAddress', '');
                    }
                    if (initialData?.fields?.some((e) => e.fieldName === 'shippingAddress')) {
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
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManagePlanning;
