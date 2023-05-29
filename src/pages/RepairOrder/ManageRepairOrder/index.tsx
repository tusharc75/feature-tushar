import { useState, useEffect, useContext } from 'react';
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
  setFieldsInAscendingOrder,
  yupSchema,
  generateUniqueIdOnly,
  repairOrder,
  REPAIR_ORDER_TYPE
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
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';

const ManageRepairOrder = ({
  isClone = false,
  repairOrderId = null,
  onClose,
  onSuccess,
  referenceType = null,
  referenceData = null,
  isEditable = true,
  isAnyMaterial = false
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
  const [repairOrderData, setRepairOrderData] = useState(null);
  const [customerContactMainDataSource, setCustomerContactMainDataSource] = useState([]);
  const [customerContactDataSource, setCustomerContactDataSource] = useState([]);

  const [cloneHeading, setCloneHeading] = useState('');

  const updateAccountDropdown = (data) => {
    const entityFields = initialData.fields;
    const customerAccountNameFieldIndex = entityFields.findIndex((d) => d.fieldName === 'customerAccount');
    if (customerAccountNameFieldIndex > -1) {
      entityFields[customerAccountNameFieldIndex].option = [
        ...entityFields[customerAccountNameFieldIndex].option,
        {
          optionValue: data._id,
          optionLabel: data.accountName,
          order: entityFields[customerAccountNameFieldIndex]?.option?.length,
          default: false
        }
      ];
      setAccountData(entityFields[customerAccountNameFieldIndex]?.option);
    }
  };

  const updateContactDropdown = (data) => {
    const entityFields = initialData.fields;
    const customerContactNameFieldIndex = entityFields.findIndex((d) => d.fieldName === 'customerContact');
    if (customerContactNameFieldIndex > -1) {
      const newCustomer = {
        optionValue: data._id,
        optionLabel: `${data.firstName} ${data.lastName}`,
        order: entityFields[customerContactNameFieldIndex]?.option?.length,
        default: false,
        parentAccount: data.accountName
      };
      entityFields[customerContactNameFieldIndex].option = [...entityFields[customerContactNameFieldIndex].option, newCustomer];
      setCustomerContactMainDataSource(entityFields[customerContactNameFieldIndex].option);
      setCustomerContactDataSource((prevState) => [...prevState, newCustomer]);
    }
  };

  useEffect(() => {
    const ownerCollabOptions = initialData.fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
    if (ownerCollabOptions?.length > 0) {
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
      setContactData(customerContactOptions?.option);
    }
    const customerContactDropdownData = initialData.fields.find((d) => d.fieldName === 'customerContact');

    if (customerContactDropdownData) {
      setCustomerContactMainDataSource(customerContactDropdownData?.option);
      if (repairOrderId) {
        setCustomerContactDataSource(
          customerContactDropdownData.option.filter((d) => d.parentAccount === repairOrderData?.customerAccount?.optionValue)
        );
      }
    }
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

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
  }, [repairOrderId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Repair Order');
      fieldData = response?.data?.data;

      fieldData = fieldData?.filter((e) => !['rentalJob', 'quotation']?.includes(e.fieldData.fieldName));

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (repairOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${repairOrder.api}/` + repairOrderId);
          data = response?.data?.data;
          setRepairOrderData(data);
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, repairOrderNumber, updatedBy, ...rest } = data;
            rest.status = 'New';
            rest.repairOrderNumber = `RO_${generateUniqueIdOnly()}`;
            setCloneHeading(repairOrderNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(rest, fieldsDataForCreate)
            });
            setLoading(false);
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['repairOrderNumber'] = `RO_${generateUniqueIdOnly()}`;
        if (referenceType === 'rentalJob') {
          initialData['rentalJob'] = referenceData?._id;
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'warehouse')) {
            initialData['warehouse'] = referenceData?.warehouse;
          }
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'customerAccount')) {
            initialData['customerAccount'] = referenceData?.customerAccount;
          }
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'customerContact')) {
            initialData['customerContact'] = referenceData?.customerContact;
          }
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'type')) {
            initialData['type'] = REPAIR_ORDER_TYPE.external;
          }
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
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
      const { productInventory, ...rest } = values;
      axiosInstance()
        .post(`${repairOrder.api}`, rest)
        .then(({ data: { data, message } }) => {
          if (!referenceType) {
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
    if (err?.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

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
      open={true}
    >
      {formsData && formsData?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit }) => (
            <>
              <CustomDialogHeader
                title={
                  !repairOrderId
                    ? `Create ${routes.repairOrder.title}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${repairOrderData?.repairOrderNumber || ''}`}`
                }
                onClose={(e, reason) => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
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
                                            isNew={!repairOrderId}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={accountData}
                                            disabled={
                                              isAnyMaterial || ![REPAIR_ORDER_TYPE.external].includes(values['type'])
                                                ? true
                                                : !isClone
                                                ? repairOrderId && field.disableOnEdit
                                                : false || !isEditable
                                            }
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            doNotShowInfoTooltip={true}
                                            onChange={(e, value) => {
                                              setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                              if (initialData.fields.find((d) => d.fieldName === 'customerContact')) {
                                                setFieldValue('customerContact', '');
                                              }
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
                                                disabled={
                                                  isAnyMaterial || ![REPAIR_ORDER_TYPE.external].includes(values['type'])
                                                    ? true
                                                    : !isClone
                                                    ? repairOrderId && field.disableOnEdit
                                                    : false
                                                }
                                                size="small"
                                              >
                                                <AddIcon
                                                  color={
                                                    isAnyMaterial || ![REPAIR_ORDER_TYPE.external].includes(values['type'])
                                                      ? 'disabled'
                                                      : isClone
                                                      ? 'primary'
                                                      : repairOrderId && field.disableOnEdit
                                                      ? 'disabled'
                                                      : 'primary'
                                                  }
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
                                              setFieldValue(name, value);
                                            }}
                                            disabled={
                                              ![REPAIR_ORDER_TYPE.external].includes(values['type'])
                                                ? true
                                                : !isClone
                                                ? repairOrderId && field.disableOnEdit
                                                : false || !isEditable
                                            }
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
                                                disabled={
                                                  ![REPAIR_ORDER_TYPE.external].includes(values['type'])
                                                    ? true
                                                    : !isClone
                                                    ? repairOrderId && field.disableOnEdit
                                                    : false
                                                }
                                                size="small"
                                              >
                                                <AddIcon
                                                  color={
                                                    ![REPAIR_ORDER_TYPE.external].includes(values['type'])
                                                      ? 'disabled'
                                                      : isClone
                                                      ? 'primary'
                                                      : repairOrderId && field.disableOnEdit
                                                      ? 'disabled'
                                                      : 'primary'
                                                  }
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
                                        disabled={repairOrderId && field.disableOnEdit}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(values['collaborator']);
                                        }}
                                      />
                                    ) : field.fieldName === 'collaborator' ? (
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
                                    ) : field.fieldName === 'startDate' ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        disabled={repairOrderId && field.disableOnEdit}
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
                                        maxDate={
                                          values['expectedCompletionDate'] ? moment(values['expectedCompletionDate']) : moment().add(5, 'years')
                                        }
                                      />
                                    ) : field.fieldName === 'expectedCompletionDate' ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        disabled={repairOrderId && field.disableOnEdit}
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
                                        minDate={values['startDate']}
                                      />
                                    ) : field.fieldName === 'type' ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        fieldData={field}
                                        disabled={(repairOrderId && field.disableOnEdit) || !isEditable}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        onChange={(e, value) => {
                                          setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                          if (
                                            initialData.fields.find((d) => d.fieldName === 'customerContact') &&
                                            initialData.fields.find((d) => d.fieldName === 'customerAccount')
                                          ) {
                                            setFieldValue('customerContact', '');
                                            setFieldValue('customerAccount', '');
                                          } else if (initialData.fields.find((d) => d.fieldName === 'customerAccount')) {
                                            setFieldValue('customerAccount', '');
                                          } else if (initialData.fields.find((d) => d.fieldName === 'customerContact')) {
                                            setFieldValue('customerContact', '');
                                          }
                                          setInitialData((prevState: any) => ({
                                            ...prevState,
                                            fields: [
                                              ...prevState?.fields?.map((e) => {
                                                if (value?.optionValue === REPAIR_ORDER_TYPE.internal) {
                                                  if (e?.fieldName === 'customerAccount') {
                                                    e.required = false;
                                                  }
                                                  if (e?.fieldName === 'customerContact') {
                                                    e.required = false;
                                                  }
                                                }
                                                if (value?.optionValue === REPAIR_ORDER_TYPE.external) {
                                                  if (e?.fieldName === 'customerAccount') {
                                                    e.required = true;
                                                  }
                                                  if (e?.fieldName === 'customerContact') {
                                                    e.required = true;
                                                  }
                                                }
                                                return e;
                                              })
                                            ]
                                          }));
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    ) : (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        fields={initialData?.fields}
                                        disabled={(Boolean(repairOrderId) && field.disableOnEdit && !isClone) || field.isUneditable}
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
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
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
                    handleSubmit();
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
                    handleSubmit();
                  }}
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
                    setFieldValue('customerAccount', data._id);
                    setFieldValue('customerContact', '');
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
            </>
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

export default ManageRepairOrder;
