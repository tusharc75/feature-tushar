import { useState, useEffect, Fragment, useContext } from 'react';
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
  generateUniqueIdOnly,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
  bulkAssetCreation,
  setFieldsInAscendingOrder,
  supplierAccount,
  supplierContact
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid, IconButton, Tooltip } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageAccountDialog from '../Account/ManageAccount';
import ManageContactDialog from '../Contact/ManageContact';
import { isEqual } from 'lodash';

const ManageBulkAssetCreation = ({ isClone = false, bulkAssetCreationId = null, onClose, onSuccess, referenceId = null, refrenceData = null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [bulkAssetCreationData, setBulkAssetCreationData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('head');

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [accountData, setAccountData] = useState([]);
  const [contactData, setContactData] = useState([]);

  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);

  const [showAddSupplierAccountDialog, setShowAddSupplierAccountDialog] = useState(false);
  const [showAddSupplierContactDialog, setShowAddSupplierContactDialog] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Bulk Asset Creation')
      .then(({ data: { data } }) => {
        data = data?.filter((obj) => !['rentalJob'].includes(obj?.fieldData?.fieldName));
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (bulkAssetCreationId) {
          axiosInstance()
            .get(`${bulkAssetCreation.api}/` + bulkAssetCreationId)
            .then(({ data: { data } }) => {
              setBulkAssetCreationData(data);
              if (isClone) {
                const { _id, createdBy, updatedBy, serialNumber, baNumber, ...rest } = data;
                if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
                  rest['baNumber'] = `BA_${generateUniqueIdOnly()}`;
                }
                rest['status'] = 'New';
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: getObjKeysWithValues(rest, fieldsDataForCreate)
                });
                setCloneHeading(baNumber);
                setLoading(false);
              } else {
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          if (fieldsDataForCreate.some((e) => e.fieldName === 'currency')) {
            createValues['currency'] = user.user?.brandCurrency;
          }
          if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
            createValues['baNumber'] = `BA_${generateUniqueIdOnly()}`;
          }
          if (refrenceData) {
            createValues['rentalJob'] = referenceId;
            createValues['warehouse'] = refrenceData?.warehouse;
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellName')) {
              createValues['wellName'] = refrenceData?.wellName;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellNumber') && refrenceData?.wellNumber) {
              createValues['wellNumber'] = refrenceData?.wellNumber;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'afeNumber')) {
              createValues['afeNumber'] = refrenceData?.afeNumber;
            }
          }
          setInitialData({
            fields: fieldsDataForCreate,
            values: createValues
          });
        }
        const supplierAccountOptions = fieldsDataForCreate.find((d) => d.fieldName === 'supplierAccount');
        if (supplierAccountOptions) {
          setAccountData(supplierAccountOptions.option);
        }
        const supplierContactOptions = fieldsDataForCreate.find((d) => d.fieldName === 'supplierContact');
        if (supplierAccountOptions) {
          setContactData(supplierContactOptions.option);
        }
        let ownerCollaboratorOptions = fieldsDataForCreate.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
        if (ownerCollaboratorOptions.length > 0) {
          setOwnerCollaboratorData(ownerCollaboratorOptions[0].option);
          setOwnerData(ownerCollaboratorOptions[0].option);
          setCollaboratorData(ownerCollaboratorOptions[0].option);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [bulkAssetCreationId]);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (bulkAssetCreationId && isClone === false) {
      values._id = bulkAssetCreationId;
      axiosInstance()
        .put(`${bulkAssetCreation.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      if (refrenceData && refrenceData?.products) {
        values.products = refrenceData?.products;
      }
      axiosInstance()
        .post(`${bulkAssetCreation.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          if (refrenceData && refrenceData?.products) {
            onSuccess();
          } else {
            history.push(`${bulkAssetCreation.api}/detail/${data._id}`);
          }
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData));
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData));
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
      {formsData && formsData.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  bulkAssetCreationId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update [ ${bulkAssetCreationData?.baNumber || ''} ]`
                    : 'Create ' + routes.bulkAssetCreation.title
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
                  {formsData.length > 0 &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                {field.fieldName === 'rentalJob' ? (
                                  <FormTypes
                                    isNew={Boolean(bulkAssetCreationId)}
                                    {...field}
                                    disabled={Boolean(bulkAssetCreationId) && field.disableOnEdit && !isClone}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
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
                                ) : field.fieldName == 'supplierAccount' ? (
                                  <Grid container spacing={1}>
                                    <Grid
                                      item
                                      xs={permissions.supplierAccount?.isCreate ? 11 : 11}
                                      sm={permissions.supplierAccount?.isCreate ? 11 : 11}
                                      md={permissions.supplierAccount?.isCreate ? 11 : 11}
                                    >
                                      <FormTypes
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        fieldData={field}
                                        type={field.type}
                                        options={accountData}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        doNotShowInfoTooltip={true}
                                        onChange={(e, value) => {
                                          setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                          setFieldValue('supplierContact', '');
                                        }}
                                      />
                                    </Grid>
                                    {permissions.supplierAccount?.isCreate && (
                                      <Grid item xs={1} sm={1} md={1}>
                                        <Tooltip title="Create Account" className="mt-1">
                                          <IconButton
                                            onClick={() => {
                                              setShowAddSupplierAccountDialog(true);
                                            }}
                                            disabled={!isClone ? field.disableOnEdit : false}
                                            size="small"
                                          >
                                            <AddIcon color={isClone ? 'primary' : field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                ) : field.fieldName === 'supplierContact' ? (
                                  <Grid container spacing={1}>
                                    <Grid
                                      item
                                      xs={permissions.supplierContact?.isCreate ? 11 : 11}
                                      sm={permissions.supplierContact?.isCreate ? 11 : 11}
                                      md={permissions.supplierContact?.isCreate ? 11 : 11}
                                    >
                                      <FormTypes
                                        isNew={Boolean(bulkAssetCreationId)}
                                        {...field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        fieldData={field}
                                        type={field.type}
                                        options={contactData.filter((d) => d.parentAccount === values['supplierAccount'])}
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
                                    {permissions.supplierContact?.isCreate && (
                                      <Grid item xs={1} sm={1} md={1}>
                                        <Tooltip title="Create Contact" className="mt-1">
                                          <IconButton
                                            onClick={() => {
                                              setShowAddSupplierContactDialog(true);
                                            }}
                                            disabled={!isClone ? field.disableOnEdit : false}
                                            size="small"
                                          >
                                            <AddIcon color={isClone ? 'primary' : field.disableOnEdit ? 'disabled' : 'primary'} />
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
                                ) : field.fieldName === 'owner' ? (
                                  <FormTypes
                                    {...field}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
                                    type={field.type}
                                    options={ownerData}
                                    onChange={(e, val) => {
                                      setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');

                                      if (val && val.optionValue !== user?.user?._id) {
                                        const checkOwnerAddedInCollaborator = values['collaborator'].find((d) => d?.optionValue === user?.user?._id);
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
                                    disabled={field.disableOnEdit}
                                    onOpen={() => {
                                      onOwnerDropdownOpen(values['collaborator']);
                                    }}
                                  />
                                ) : field.fieldName === 'collaborator' ? (
                                  <FormTypes
                                    {...field}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
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
                                ) : (
                                  <FormTypes
                                    isNew={Boolean(bulkAssetCreationId)}
                                    {...field}
                                    disabled={
                                      (Boolean(bulkAssetCreationId) && field.disableOnEdit && !isClone) ||
                                      field.fieldName === 'baNumber' ||
                                      field.fieldName === 'status'
                                    }
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    fieldData={field}
                                    allFields={initialData.fields}
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
                                )}
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
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
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    handleSubmit();
                  }}
                  disabled={loading}
                >
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
                    handleScroll(errors);
                    handleSubmit();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
              {showAddSupplierAccountDialog && (
                <ManageAccountDialog
                  open={showAddSupplierAccountDialog}
                  onClose={() => {
                    setShowAddSupplierAccountDialog(false);
                  }}
                  id={null}
                  accountResource={supplierAccount.accountResource}
                  accountApi={supplierAccount.accountApi}
                  isGetAccountData={true}
                  onGetAddedAccount={({ data, addressDataSource }) => {
                    setAccountData((prevState) => {
                      return [
                        ...prevState,
                        {
                          optionValue: data._id,
                          optionLabel: data.accountName,
                          order: accountData.length,
                          default: false,
                          billingAddress: data?.billingAddress,
                          shippingAddress: data?.shippingAddress
                        }
                      ];
                    });
                    setFieldValue('supplierAccount', data._id);
                    setFieldValue('supplierContact', '');
                  }}
                  isRedirectToDetailPage={false}
                />
              )}
              {showAddSupplierContactDialog && (
                <ManageContactDialog
                  open={showAddSupplierContactDialog}
                  onClose={() => setShowAddSupplierContactDialog(false)}
                  onSuccess={(obj) => {
                    if (obj?.data?.data) {
                      setContactData((prevState) => {
                        return [
                          ...prevState,
                          {
                            optionValue: obj?.data?.data?._id,
                            optionLabel: `${obj?.data?.data?.firstName} ${obj?.data?.data?.lastName}`,
                            order: contactData.length,
                            default: false,
                            parentAccount: obj?.data?.data?.accountName
                          }
                        ];
                      });
                      setShowAddSupplierContactDialog(false);
                      setFieldValue('supplierContact', obj?.data?.data?._id);
                    }
                  }}
                  accountId={values['supplierAccount']}
                  contactResource={supplierContact.contactResource}
                  contactApi={supplierContact.contactApi}
                  isRedirectToDetailPage={false}
                  collaborators={collaboratorData}
                  owner={ownerData}
                  account={supplierAccount}
                  isAccountFieldDisable={true}
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

export default ManageBulkAssetCreation;
