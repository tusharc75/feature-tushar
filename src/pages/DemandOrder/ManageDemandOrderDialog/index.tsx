import { useState, useEffect, useContext, Fragment, useRef } from 'react';
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
  isFieldNotTouched,
  salesOrder,
  setFieldsInAscendingOrder,
  yupSchema,
  generateUniqueIdOnly,
  demandOrder
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { FaDiceOne } from 'react-icons/fa';
import moment from 'moment';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
import ManageAccountDialog from '../../Account/ManageAccount';
import ManageContactDialog from '../../Contact/ManageContact';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';

const ManageDemandOrderDialog = ({ isClone, salesOrderId, salesOrderData = null, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState({ fields: [], initialValues: {} });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [formValues, setFormValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [contactData, setContactData] = useState([]);
  const [showAddCustomerAccountDialog, setShowAddCustomerAccountDialog] = useState(false);
  const [showAddCustomerContactDialog, setShowAddCustomerContactDialog] = useState(false);

  const [accountData, setAccountData] = useState([]);
  const [customerContactMainDataSource, setCustomerContactMainDataSource] = useState([]);
  const [customerContactDataSource, setCustomerContactDataSource] = useState([]);
  const [newAddedAccountId, setNewAddedAccountId] = useState(null);

  const [salesDetails, setSalesDetails] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');
  const [countryBillToDropDown, setCountryBillToDropDown] = useState([]);
  const [countrySellToDropDown, setCountrySellToDropDown] = useState([]);
  const [countryBillToMainData, setCountryBillToMainData] = useState([]);
  const [countrySellToMainData, setCountrySellToMainData] = useState([]);
  const ref = useRef(null);

  const updateAccountDropdown = (data) => {
    const entityFields = salesData.fields;
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
    const entityFields = salesData.fields;
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
    const ownerCollabOptions = salesData.fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
    if (ownerCollabOptions.length > 0) {
      setOwnerCollaboratorData(ownerCollabOptions[0].option);
      setOwnerData(ownerCollabOptions[0].option);
      setCollaboratorData(ownerCollabOptions[0].option);
    }
    let customerAccountOptions = salesData.fields.find((d) => d.fieldName === 'customerAccount');
    if (customerAccountOptions) {
      setAccountData(customerAccountOptions.option);
    }
    let customerContactOptions = salesData.fields.find((d) => d.fieldName === 'customerContact');
    if (customerContactOptions) {
      setContactData(customerContactOptions.option);
    }
    const customerContactDropdownData = salesData.fields.find((d) => d.fieldName === 'customerContact');
    const countryBillToDropdownData = salesData.fields.find((d) => d.fieldName === 'billingAddress');
    if (countryBillToDropdownData) {
      setCountryBillToMainData(countryBillToDropdownData.option);
      setCountryBillToDropDown(countryBillToDropdownData.option);
    }
    const countrySellToDropdownData = salesData.fields.find((d) => d.fieldName === 'shippingAddress');
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
    setFormsData(setFieldsInAscendingOrder(salesData.fields));
  }, [salesData.fields]);

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
      const response: any = await axiosInstance().get('/field?resource=Demand Order');
      fieldData = response?.data?.data;

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (salesOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${demandOrder.api}/` + salesOrderId);
          data = response?.data?.data;

          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, demandOrderNumber, updatedBy, ...rest } = data;
            rest.demandOrderNumber = `DO_${generateUniqueIdOnly()}`;
            setCloneHeading(demandOrderNumber);
            setSalesData({
              fields: fieldsDataForCreate,
              initialValues: getObjKeysWithValues(rest, fieldsDataForCreate)
            });
            setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate));
            setLoading(false);
          } else {
            setSalesDetails(data);
            setSalesData({
              fields: fieldsDataForUpdate,
              initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate));
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['demandOrderNumber'] = `DO_${generateUniqueIdOnly()}`;
        setSalesData({
          fields: fieldsDataForCreate,
          initialValues: initialData
        });
        setFormValues(initialData);
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  // const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
  //   if (Object.keys(errors).length) {
  //     salesData.fields.forEach((input) => {
  //       if (input.required || values[input.fieldName]) {
  //         setTouched(input.fieldName, true);
  //       }
  //     });
  //     setErrors({ ...errors });
  //   } else {
  //     handleUpdateSalesOrder(values);
  //   }
  // };

  const handleSubmit = (values) => {
    setLoading(true);
    if (salesOrderId && isClone === false) {
      values._id = salesOrderId;
      axiosInstance()
        .put(`${demandOrder.api}`, values)
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
      axiosInstance()
        .post(`${demandOrder.api}`, values)
        .then(({ data: { data, message } }) => {
          history.push(`${routes.demandOrderDetail.path}/${data._id}`);
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

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
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
        {formsData && formsData.length ? (
          <Formik
            innerRef={ref}
            initialValues={salesData.initialValues}
            validationSchema={yupSchema(salesData.fields)}
            validateOnMount
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, submitForm, setFieldValue }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    !salesOrderId
                      ? `Create ${routes.demandOrder.title}`
                      : `${isClone ? `Clone - ${cloneHeading}` : `Update ${salesOrderData?.demandOrderNumber}`}`
                  }
                  onClose={() => {
                    if (!isEqual(ref.current.values, salesData.initialValues)) {
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
                                  <FormTypes
                                    isNew={Boolean(salesOrderId)}
                                    {...field}
                                    fieldData={field}
                                    disabled={!isClone ? salesOrderId && field.disableOnEdit : false}
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
                      if (!isEqual(ref.current.values, salesData.initialValues)) {
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
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
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
                      submitForm();
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
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

export default ManageDemandOrderDialog;
