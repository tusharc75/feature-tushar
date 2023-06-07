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
  salesOrder,
  setFieldsInAscendingOrder,
  yupSchema,
  generateUniqueIdOnly
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageAccountDialog from '../../Account/ManageAccount';
import ManageContactDialog from '../../Contact/ManageContact';
import { isEqual } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const ManageSalesOrderDialog = ({ isClone, salesOrderId, salesOrderData = null, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
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

  const [salesDetails, setSalesDetails] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');
  const [countryBillToDropDown, setCountryBillToDropDown] = useState([]);
  const [countrySellToDropDown, setCountrySellToDropDown] = useState([]);
  const [countryBillToMainData, setCountryBillToMainData] = useState([]);
  const [countrySellToMainData, setCountrySellToMainData] = useState([]);
  const [fields, setFields] = useState(null);

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
          default: false
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
    const countryBillToDropdownData = initialData.fields.find((d) => d.fieldName === 'billingAddress');
    if (countryBillToDropdownData) {
      setCountryBillToMainData(countryBillToDropdownData.option);
      setCountryBillToDropDown(countryBillToDropdownData.option);
    }
    const countrySellToDropdownData = initialData.fields.find((d) => d.fieldName === 'shippingAddress');
    if (countryBillToDropdownData) {
      setCountrySellToMainData(countrySellToDropdownData.option);
      setCountrySellToDropDown(countrySellToDropdownData.option);
    }
    if (customerContactDropdownData) {
      setCustomerContactMainDataSource(customerContactDropdownData.option);
      if (salesOrderId) {
        setCustomerContactDataSource(
          customerContactDropdownData.option.filter((d) => d.parentAccount === salesOrderData?.customerAccount.optionValue)
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
  }, [salesOrderId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Sales Order');
      fieldData = response?.data?.data;
      setFields(fieldData);
      fieldData = fieldData?.filter((e) => !['quotation'].includes(e?.fieldData?.fieldName));

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (salesOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${salesOrder.api}/` + salesOrderId);
          data = response?.data?.data;

          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, salesOrderNo, updatedBy, ...rest } = data;
            rest.status = 'New';
            if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
              rest.salesOrderNo = `SO_${generateUniqueIdOnly()}`;
            }
            setCloneHeading(salesOrderNo);
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(rest, fieldsDataForCreate)
            });
            setLoading(false);
          } else {
            setSalesDetails(data);
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
        let initialData = { ...getObjKeys('', fieldsDataForCreate), currency: user.user?.brandCurrency || '' };
        if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
          initialData['salesOrderNo'] = `SO_${generateUniqueIdOnly()}`;
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
    if (salesOrderId && isClone === false) {
      values._id = salesOrderId;
      axiosInstance()
        .put(`${salesOrder.api}`, values)
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
        .post(`${salesOrder.api}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes.salesOrderDetail.path}/${data?._id}`);
          setLoading(false);
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

  const onCountrySellToDropDownOpen = (selectedAccount) => {
    let filterAddress = accountData.find((d) => d.optionValue === selectedAccount)?.shippingAddress;
    if (filterAddress) {
      setCountrySellToDropDown(countrySellToMainData.filter((d) => filterAddress?.some((u) => u === d.optionValue)));
    } else {
      setCountrySellToDropDown([]);
    }
  };

  const onCountryBillToDropDownOpen = (selectedAccount) => {
    let filterAddress = accountData.find((d) => d.optionValue === selectedAccount)?.billingAddress;
    if (filterAddress) {
      setCountryBillToDropDown(countryBillToMainData.filter((d) => filterAddress?.some((u) => u === d.optionValue)));
    } else {
      setCountryBillToDropDown([]);
    }
  };

  function validate(values) {
    const errors = {};
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
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  !salesOrderId
                    ? `Create ${routes.salesOrder.title}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${salesOrderData?.salesOrderNo}`}`
                }
                onClose={(e, reason) => {
                  if (isEqual(initialData.values, values)) {
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
                                    <FormTypes
                                      // {...rest}
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
                                      fieldData={field}
                                      fields={initialData?.fields}
                                    />
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
                    if (isEqual(initialData.values, values)) {
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

export default ManageSalesOrderDialog;
