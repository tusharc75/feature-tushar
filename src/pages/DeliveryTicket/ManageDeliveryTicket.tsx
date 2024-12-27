import { Box, Button, Dialog, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/AddCircle';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ManageAddressDialog from '../../components/Address/ManageAddressDialog';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import CustomButton from '../../components/Helpers/CustomButton';
import FormTypes from '../../components/Helpers/FormTypes';
import {
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  deliveryTicket,
  getObjKeys,
  getObjKeysWithValues,
  sidebarResource,
  yupSchema,
  restoreObjKeysWithValues
} from '../../constants/helpers';
import { findOne, objectStore } from '../../constants/indexdbhelper';
import {
  CustomDialogTransition,
  convertDateInDateTime,
  generateUniqueIdOnly,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
  setFieldsInAscendingOrder
} from './../../constants/helpers';
import { createDeliveryTicketOffline } from './deliveryTicketOfflineHelper';
import { generateFormFieldSteps, generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import dayjs from 'dayjs';

const ManageDeliveryTicket = ({
  onClose,
  onSuccess,
  deliveryTicketId = null,
  ticketType = null,
  referenceType = null,
  referenceData = null,
  assets = null,
  products = null
}) => {
  const {
    state: { user }
  }: any = useData();
  const walkmeInstance = useGetWalkmeInstance();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);

  const ref = useRef(null);

  const [supplierData, setSupplierData] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  const [addressData, setAddressData] = useState([]);
  const [pickupFromAddress, setPickupFromAddress] = useState([]);
  const [deliveryToAddress, setDeliveryToAddress] = useState([]);

  const [staticDeliveryToAddress, setStaticDeliveryToAddress] = useState(null);
  const [staticPickupFromAddress, setStaticPickupFromAddress] = useState(null);

  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressType, setAddressType] = useState('');
  const [createDateMin, setCreateDateMin] = useState(new Date());
  const isStepDataSet = useRef(false);

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields.length > 0) {
      isStepDataSet.current = true;
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData?.fields?.some((field) => field?.fieldName === 'createDate') && assets?.length) {
      findValidationDate();
    }
  }, [initialData, assets]);

  const findValidationDate = async () => {
    if (
      initialData?.values?.type === DELIVERY_TICKET_REFERENCE_TYPE.transferAsset &&
      initialData?.values?.ticketType === DELIVERY_TICKET_TYPE.loading
    ) {
      const {
        data: { data }
      } = await axiosInstance().put(`${routes.serializedAsset.path}/asset-last-history-date-before-adding`, {
        assets: assets?.map((e) => e._id),
        referenceId: initialData?.values?.transferAsset
      });
      var lastDate: any = new Date();
      if (data?.date) {
        lastDate = new Date(data?.date);
        lastDate.setHours(0, 0, 0);
      }
      setCreateDateMin(lastDate);
    } else {
      let last = 1;
      if (
        initialData?.values?.type === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob &&
        initialData?.values?.ticketType === DELIVERY_TICKET_TYPE.loading
      ) {
        last = 2;
      }
      const {
        data: { data }
      } = await axiosInstance().put(`/rental-management/assets-last-date`, { assets: assets?.map((e) => e._id), last: last });
      var lastDate: any = new Date();
      if (data?.date) {
        lastDate = new Date(data?.date);
        lastDate.setHours(0, 0, 0);
      }
      setCreateDateMin(lastDate);
    }
  };

  useEffect(() => {
    const fields = initialData.fields;
    if (fields.length > 0) {
      const ownerCollabOptions = fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
      if (ownerCollabOptions.length > 0) {
        setOwnerCollaboratorData(ownerCollabOptions[0].option);
        setOwnerData(ownerCollabOptions[0].option);
        setCollaboratorData(ownerCollabOptions[0].option);
      }
      const supplierAccountData = fields.find((d) => d.fieldName === 'supplierAccount');
      if (supplierAccountData) {
        setSupplierData(supplierAccountData.option);
      }
      const customerAccountData = fields.find((d) => d.fieldName === 'customerAccount');
      if (customerAccountData) {
        setCustomerData(customerAccountData.option);
      }
      const allAddressData = fields.find((d) => d.fieldName === 'pickupFromAddress');
      if (allAddressData) {
        setAddressData(allAddressData.option);
        setPickupFromAddress(allAddressData.option);
        setDeliveryToAddress(allAddressData.option);
      }

      const modifiedData = setFieldsInAscendingOrder(fields);

      const newFilteredData = modifiedData.filter((formData) => {
        if (formData.name.includes('Fields')) {
          return false;
        }
        return true;
      });
      setFormsData(newFilteredData);
    }
  }, [initialData.fields, referenceData]);

  const updateFieldProperty = (
    fields,
    pickupFromType,
    deliveryToType,
    ticketType,
    pickupFrom,
    deliveryTo,
    isPickupFromDisable,
    isDeliveryToDisable,
    isPickupFromStorageLocationDisable,
    isDeliveryToStorageLocationDisable,
    deliveryToLabel
  ) => {
    var warehouse = [];
    var customerAccount = [];
    var supplierAccount = [];
    if (fields.filter((f) => f.fieldName === 'warehouse').length) {
      warehouse = fields.filter((f) => f.fieldName === 'warehouse')[0]?.option;
    }
    if (fields.filter((f) => f.fieldName === 'customerAccount').length) {
      customerAccount = fields.filter((f) => f.fieldName === 'customerAccount')[0]?.option;
    }
    if (fields.filter((f) => f.fieldName === 'supplierAccount').length) {
      supplierAccount = fields.filter((f) => f.fieldName === 'supplierAccount')[0]?.option;
    }
    fields.forEach((element: any) => {
      if (element.fieldName === 'pickupFrom') {
        if (pickupFromType === DELIVERY_FROM_TO_TYPE.plant) {
          element.option = warehouse;
        }
        if (pickupFromType === DELIVERY_FROM_TO_TYPE.customer) {
          element.option = customerAccount;
        }
        if (pickupFromType === DELIVERY_FROM_TO_TYPE.supplier) {
          element.option = supplierAccount;
        }
      } else if (element.fieldName === 'deliveryTo') {
        if (deliveryToType === DELIVERY_FROM_TO_TYPE.plant) {
          if (!warehouse?.find((e) => e.optionValue === deliveryTo) && deliveryToLabel) {
            warehouse.push({
              optionLabel: deliveryToLabel,
              optionValue: deliveryTo
            });
          }
          element.option = warehouse;
        }
        if (deliveryToType === DELIVERY_FROM_TO_TYPE.customer) {
          element.option = customerAccount;
        }
        if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
          element.option = supplierAccount;
        }
      }
      if (isPickupFromDisable && element.fieldName === 'pickupFrom') {
        element.isUneditable = true;
      }
      if (isDeliveryToDisable && element.fieldName === 'deliveryTo') {
        element.isUneditable = true;
      }
      if (pickupFromType === DELIVERY_FROM_TO_TYPE.plant && element.fieldName === 'pickupFromAddress') {
        element.isUneditable = true;
      }
      if (deliveryToType === DELIVERY_FROM_TO_TYPE.plant && element.fieldName === 'deliveryToAddress') {
        element.isUneditable = true;
      }

      if (pickupFromType === DELIVERY_FROM_TO_TYPE.plant && deliveryToType === DELIVERY_FROM_TO_TYPE.plant && element.fieldName === 'deliveryTo') {
        element.option = element.option?.filter((e) => e.optionValue !== pickupFrom);
      }
      if (
        pickupFromType === DELIVERY_FROM_TO_TYPE.supplier &&
        deliveryToType === DELIVERY_FROM_TO_TYPE.supplier &&
        element.fieldName === 'deliveryTo'
      ) {
        element.option = element.option?.filter((e) => e.optionValue !== pickupFrom);
      }

      if (ticketType === DELIVERY_TICKET_TYPE.return && element.fieldName === 'returnReason') {
        element.required = true;
      }

      if (isPickupFromStorageLocationDisable && element.fieldName === 'pickupFromStorageLocation') {
        element.isUneditable = true;
      }
      if (isDeliveryToStorageLocationDisable && element.fieldName === 'deliveryToStorageLocation') {
        element.isUneditable = true;
      }
    });
    return fields;
  };

  useEffect(() => {
    fetchFields();
  }, [deliveryTicketId, referenceData]);

  const fetchFields = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.deliveryTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource['deliveryTicket']}`);
        data = response?.data?.data;
      }
      if (walkmeInstance) {
      }
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (deliveryTicketId) {
        let data;
        if (isOffline) {
          data = await findOne(objectStore.deliveryTicket, deliveryTicketId);
        } else {
          const response = await axiosInstance().get(`${deliveryTicket.api}/${deliveryTicketId}`);
          data = response?.data?.data;
        }
        setDisableOwnerSelection(deliveryTicketId && user.user._id !== data?.owner?.optionValue);
        fieldsDataForUpdate = updateFieldProperty(
          fieldsDataForUpdate,
          data?.pickupFromType,
          data?.deliveryToType,
          data?.ticketType,
          data?.pickupFrom,
          data?.deliveryTo,
          true,
          true,
          true,
          true,
          null
        );
        setInitialData({
          fields: fieldsDataForUpdate,
          values: getObjKeysWithValues(data, fieldsDataForUpdate)
        });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        var isPickupFromDisable = false;
        var isDeliveryToDisable = false;
        var isPickupFromStorageLocationDisable = false;
        var isDeliveryToStorageLocationDisable = false;

        if ((assets || products) && referenceType && referenceData) {
          if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.transferInventory) {
          } else if (
            user?.user?.brandPolicy?.storageLocation &&
            ((referenceType === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob && user?.user?.brandPolicy?.rentalInventoryDebit) ||
              referenceType === DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly)
          ) {
            if (ticketType === DELIVERY_TICKET_TYPE.loading) {
              fieldsDataForCreate = fieldsDataForCreate?.filter((e) => !['deliveryToStorageLocation']?.includes(e.fieldName));
              fieldsDataForCreate?.forEach((element) => {
                if (element?.fieldName === 'pickupFromStorageLocation') {
                  element.required = true;
                }
              });
            }
            if ([DELIVERY_TICKET_TYPE.return, DELIVERY_TICKET_TYPE.receiving]?.includes(ticketType)) {
              fieldsDataForCreate = fieldsDataForCreate?.filter((e) => !['pickupFromStorageLocation']?.includes(e.fieldName));
              fieldsDataForCreate?.forEach((element) => {
                if (element?.fieldName === 'deliveryToStorageLocation') {
                  element.required = true;
                }
              });
            }
          } else {
            fieldsDataForCreate = fieldsDataForCreate?.filter(
              (e) => !['pickupFromStorageLocation', 'deliveryToStorageLocation']?.includes(e.fieldName)
            );
          }
          if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
            tempInitialData['ticketName'] = `${referenceData?.ticketName}_${generateUniqueIdOnly()}`;
          }
          tempInitialData['type'] = referenceType;
          tempInitialData['ticketType'] = ticketType;
          tempInitialData['assets'] = [];
          assets?.forEach((ele) => {
            const obj: any = {};
            obj.asset = ele._id;
            if (ele?.uniqueId) {
              obj.uniqueId = ele.uniqueId;
            }
            if (ele?.assetData) {
              obj.assetData = ele.assetData;
            }
            tempInitialData['assets'].push(obj);
          });
          tempInitialData['products'] = [];
          products?.forEach((ele) => {
            const obj: any = {};
            obj.product = ele._id;
            obj.qty = ele.qty;
            if (ele?.uniqueId) {
              obj.uniqueId = ele.uniqueId;
            }
            if (ele?.productSerialNumbers?.length > 0) {
              obj.serialNumber = ele?.productSerialNumbers?.map((s) => s?.serialNumber);
            }
            tempInitialData['products'].push(obj);
          });
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'padName') && referenceData?.padName) {
            tempInitialData['padName'] = referenceData?.padName;
          }
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'wellName') && referenceData?.wellName) {
            tempInitialData['wellName'] = referenceData?.wellName;
          }
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'wellNumber') && referenceData?.wellNumber) {
            tempInitialData['wellNumber'] = referenceData?.wellNumber;
          }
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'afeNumber') && referenceData?.afeNumber) {
            tempInitialData['afeNumber'] = referenceData?.afeNumber;
          }
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'deliveryPerson') && referenceData?.processor) {
            tempInitialData['deliveryPerson'] = referenceData?.processor;
          }
          if (referenceData.status) {
            tempInitialData['status'] = referenceData.status;
          }
          isPickupFromDisable = referenceData?.isPickupFromDisable ? true : false;
          isDeliveryToDisable = referenceData?.isDeliveryToDisable ? true : false;

          isPickupFromStorageLocationDisable = referenceData?.isPickupFromStorageLocationDisable ? true : false;
          isDeliveryToStorageLocationDisable = referenceData?.isDeliveryToStorageLocationDisable ? true : false;

          if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob) {
            tempInitialData['rentalJob'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.salesOrder) {
            tempInitialData['salesOrder'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.repairJob) {
            tempInitialData['repairJob'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.transferAsset) {
            tempInitialData['transferAsset'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.sublease) {
            tempInitialData['sublease'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.transferInventory) {
            tempInitialData['transferInventory'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.repairOrder) {
            tempInitialData['repairOrder'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.productionOrder) {
            tempInitialData['productionOrder'] = referenceData?.referenceId;
          } else if (referenceType === DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly) {
            tempInitialData['subcontractAssembly'] = referenceData?.referenceId;
          }

          tempInitialData['pickupFromType'] = referenceData?.pickupFromType;
          tempInitialData['pickupFrom'] = referenceData?.pickupFrom;
          tempInitialData['pickupFromAddress'] = referenceData?.pickupFromAddress;
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'pickupFromStorageLocation') && referenceData?.pickupFromStorageLocation) {
            tempInitialData['pickupFromStorageLocation'] = referenceData?.pickupFromStorageLocation;
          }
          tempInitialData['deliveryToType'] = referenceData?.deliveryToType;
          tempInitialData['deliveryTo'] = referenceData?.deliveryTo;
          tempInitialData['deliveryToAddress'] = referenceData?.deliveryToAddress;
          if (fieldsDataForUpdate.find((d) => d.fieldName === 'deliveryToStorageLocation') && referenceData?.deliveryToStorageLocation) {
            tempInitialData['deliveryToStorageLocation'] = referenceData?.deliveryToStorageLocation;
          }
          const warehouse = fieldsDataForUpdate.find((d) => d.fieldName === 'warehouse');
          if (warehouse && warehouse?.option?.length) {
            if (tempInitialData['pickupFromType'] === DELIVERY_FROM_TO_TYPE.plant) {
              const pickupPlant = warehouse?.option.find((d) => d.optionValue === tempInitialData['pickupFrom']);
              if (pickupPlant) {
                tempInitialData['pickupFromAddress'] = pickupPlant?.address;
              }
            }
            if (tempInitialData['deliveryToType'] === DELIVERY_FROM_TO_TYPE.plant) {
              const deliveryPlant = warehouse?.option.find((d) => d.optionValue === tempInitialData['deliveryTo']);
              if (deliveryPlant) {
                tempInitialData['deliveryToAddress'] = deliveryPlant?.address;
              }
            }
          }
          if (!tempInitialData['deliveryToAddress']) {
            if (referenceData?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer) {
              const customerAccountData = fieldsDataForCreate?.find((d) => d?.fieldName === 'customerAccount')?.option || [];
              const customerShippingAddress = customerAccountData?.find((d) => d?.optionValue === referenceData?.deliveryTo)?.shippingAddress || [];
              if (customerShippingAddress?.length === 1) {
                tempInitialData['deliveryToAddress'] = customerShippingAddress[0];
              }
            } else if (referenceData?.deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
              const supplierAccountData = fieldsDataForCreate?.find((d) => d?.fieldName === 'supplierAccount')?.option || [];
              const supplierShippingAddress = supplierAccountData?.find((d) => d?.optionValue === referenceData?.deliveryTo)?.shippingAddress || [];
              if (supplierShippingAddress?.length === 1) {
                tempInitialData['deliveryToAddress'] = supplierShippingAddress[0];
              }
            }
          }

          if (referenceData?.pickupFromType === DELIVERY_FROM_TO_TYPE.customer && tempInitialData['pickupFromAddress']) {
            setStaticPickupFromAddress(tempInitialData['pickupFromAddress']);
          }
          if (referenceData?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer && tempInitialData['deliveryToAddress']) {
            setStaticDeliveryToAddress(tempInitialData['deliveryToAddress']);
          }
        }
        fieldsDataForCreate = updateFieldProperty(
          fieldsDataForCreate,
          tempInitialData['pickupFromType'],
          tempInitialData['deliveryToType'],
          tempInitialData['ticketType'],
          tempInitialData['pickupFrom'],
          tempInitialData['deliveryTo'],
          isPickupFromDisable,
          isDeliveryToDisable,
          isPickupFromStorageLocationDisable,
          isDeliveryToStorageLocationDisable,
          referenceData?.deliveryToLabel
        );
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData));
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData));
  };

  const handleSubmit = async (values) => {
    if (isOffline) {
      setSubmitting(true);
      const data: any = restoreObjKeysWithValues(values, initialData.fields);
      const oridata = JSON.parse(JSON.stringify(values));
      await createDeliveryTicketOffline(data, oridata);
      onSuccess();
      setSubmitting(false);
    } else {
      if (deliveryTicketId) {
        setSubmitting(true);
        values._id = deliveryTicketId;
        axiosInstance()
          .put(`${deliveryTicket.api}`, values)
          .then(({ data }) => {
            setLoading(false);
            onSuccess();
            setSubmitting(false);
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
      } else {
        setSubmitting(true);
        let updatedValues = { ...values };
        axiosInstance()
          .post(`${deliveryTicket.api}`, updatedValues)
          .then(({ data }) => {
            setLoading(false);
            onSuccess(data?.data);
            setSubmitting(false);
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
    }
  };

  function validate(values) {
    const errors = {};
    if (initialData?.fields?.find((e) => e?.fieldName === 'pickUpDate') && initialData?.fields?.find((e) => e?.fieldName === 'deliveryDate')) {

      let pickUpDate = dayjs(values?.pickUpDate);
      let deliveryDate = dayjs(values?.deliveryDate);
      if (deliveryDate.diff(pickUpDate, 'days') < 0) {
        errors['pickUpDate'] = 'Please enter valid pick-Up date';
      }
    }
    if (initialData?.fields?.find((e) => e?.fieldName === 'createDate') && assets?.length) {
      if (!dayjs(values['createDate']).isSameOrAfter(dayjs(createDateMin))) {
        errors['createDate'] = `Please select valid date`;
      }
    }
    return errors;
  }

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

  const onPickupFromAddressOpen = (pickupFromType, pickupFrom, pickupFromAddress) => {
    if (pickupFromType === DELIVERY_FROM_TO_TYPE.supplier) {
      let filterAddress = supplierData.find((d) => d.optionValue === pickupFrom)?.shippingAddress;
      if (filterAddress || pickupFromAddress) {
        setPickupFromAddress(addressData.filter((d) => filterAddress?.some((u) => u === d.optionValue) || d.optionValue === pickupFromAddress));
      } else {
        setPickupFromAddress([]);
      }
    } else if (pickupFromType === DELIVERY_FROM_TO_TYPE.customer) {
      let filterAddress = customerData.find((d) => d.optionValue === pickupFrom)?.shippingAddress;
      if (filterAddress || pickupFromAddress || staticPickupFromAddress) {
        setPickupFromAddress(
          addressData.filter(
            (d) => filterAddress?.some((u) => u === d.optionValue) || d.optionValue === pickupFromAddress || d.optionValue === staticPickupFromAddress
          )
        );
      } else {
        setPickupFromAddress([]);
      }
    } else {
      setPickupFromAddress(addressData);
    }
  };

  const onDeliveryToAddressOpen = (deliveryToType, deliveryTo, deliveryToAddress) => {
    if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
      let filterAddress = supplierData.find((d) => d.optionValue === deliveryTo)?.shippingAddress;
      if (filterAddress || deliveryToAddress) {
        setDeliveryToAddress(addressData.filter((d) => filterAddress?.some((u) => u === d.optionValue) || d.optionValue === deliveryToAddress));
      } else {
        setDeliveryToAddress([]);
      }
    } else if (deliveryToType === DELIVERY_FROM_TO_TYPE.customer) {
      let filterAddress = customerData.find((d) => d.optionValue === deliveryTo)?.shippingAddress;
      if (filterAddress || deliveryToAddress || staticDeliveryToAddress) {
        setDeliveryToAddress(
          addressData.filter(
            (d) => filterAddress?.some((u) => u === d.optionValue) || d.optionValue === deliveryToAddress || d.optionValue === staticDeliveryToAddress
          )
        );
      } else {
        setDeliveryToAddress([]);
      }
    } else {
      setDeliveryToAddress(addressData);
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length && formsData ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validate={validate}
          innerRef={ref}
        >
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
                title={`${
                  deliveryTicketId
                    ? `Update ${initialData.values?.ticketName ? `(${initialData.values?.ticketName})` : ''}`
                    : `Create Transaction Ticket`
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
                      return form.name ? (
                        <div key={index1}>
                          <div className="detail-box-content">
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className="form-label-style form-label-quotes">{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) =>
                                [
                                  'sublease',
                                  'repairJob',
                                  'transferAsset',
                                  'rentalJob',
                                  'salesOrder',
                                  'type',
                                  'productInventory',
                                  'pickupFromType',
                                  'deliveryToType'
                                ].includes(field.fieldName) ? null : ['returnReason'].includes(field.fieldName) &&
                                  values['ticketType'] !== DELIVERY_TICKET_TYPE.return ? null : (
                                  <Grid key={index2} size={{xs:12, sm:6, md:6}}>
                                    {field.fieldName === 'pickUpDate' ? (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        isNew={!Boolean(deliveryTicketId)}
                                        disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
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
                                    ) : field.fieldName === 'createDate' ? (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        fields={initialData.fields}
                                        isNew={!Boolean(deliveryTicketId)}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          var newDate = convertDateInDateTime(value);
                                          setFieldValue(name, newDate);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        {...(assets?.length ? { minDate: createDateMin } : {})}
                                      />
                                    ) : field.fieldName === 'deliveryDate' ? (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        isNew={!Boolean(deliveryTicketId)}
                                        disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
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
                                        minDate={new Date(values['pickUpDate'])}
                                      />
                                    ) : field.fieldName === 'owner' ? (
                                      <FormTypes
                                        fieldData={field}
                                        isNew={!deliveryTicketId}
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
                                        disabled={disableOwnerSelection || (deliveryTicketId && field.disableOnEdit)}
                                        onOpen={() => {
                                          onOwnerDropdownOpen(values['collaborator']);
                                        }}
                                      />
                                    ) : field.fieldName === 'collaborator' ? (
                                      <FormTypes
                                        fieldData={field}
                                        isNew={!deliveryTicketId}
                                        {...field}
                                        disabled={deliveryTicketId && field.disableOnEdit}
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
                                    ) : field.fieldName === 'pickupFrom' ? (
                                      <FormTypes
                                        {...field}
                                        isNew={!deliveryTicketId}
                                        fieldData={field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        onChange={(e, val) => {
                                          setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');
                                          if (values['pickupFromType'] === DELIVERY_FROM_TO_TYPE.plant && val?.address) {
                                            setFieldValue('pickupFromAddress', val?.address);
                                          } else {
                                            setFieldValue('pickupFromAddress', '');
                                          }
                                        }}
                                        hidelookupAddButton={true}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        disabled={disableOwnerSelection || (deliveryTicketId && field.disableOnEdit)}
                                      />
                                    ) : field.fieldName === 'deliveryTo' ? (
                                      <FormTypes
                                        {...field}
                                        isNew={!deliveryTicketId}
                                        fieldData={field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        hidelookupAddButton={true}
                                        onChange={(e, val) => {
                                          setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');
                                          if (values['deliveryToType'] === DELIVERY_FROM_TO_TYPE.plant && val?.address) {
                                            setFieldValue('deliveryToAddress', val?.address);
                                          } else {
                                            setFieldValue('deliveryToAddress', '');
                                          }
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        disabled={disableOwnerSelection || (deliveryTicketId && field.disableOnEdit)}
                                      />
                                    ) : field.fieldName === 'pickupFromAddress' ? (
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
                                            fieldData={field}
                                            values={values}
                                            hidelookupAddButton={true}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={pickupFromAddress}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onOpen={() =>
                                              onPickupFromAddressOpen(values['pickupFromType'], values['pickupFrom'], values['pickupFromAddress'])
                                            }
                                          />
                                        </Box>
                                        {values['pickupFromType'] !== DELIVERY_FROM_TO_TYPE.plant && (
                                          <Box>
                                            <HtmlTooltip title={`Add ${field.fieldLabel}`} className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddressDialog(true);
                                                  setAddressType('pickupFromAddress');
                                                }}
                                                disabled={field.disableOnEdit}
                                                size="small"
                                              >
                                                <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                              </IconButton>
                                            </HtmlTooltip>
                                          </Box>
                                        )}
                                      </Box>
                                    ) : field.fieldName === 'deliveryToAddress' ? (
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
                                            fieldData={field}
                                            values={values}
                                            errors={errors}
                                            hidelookupAddButton={true}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={deliveryToAddress}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            onOpen={() =>
                                              onDeliveryToAddressOpen(values['deliveryToType'], values['deliveryTo'], values['deliveryToAddress'])
                                            }
                                          />
                                        </Box>
                                        {values['deliveryToType'] !== DELIVERY_FROM_TO_TYPE.plant && (
                                          <Box>
                                            <HtmlTooltip title={`Add ${field.fieldLabel}`} className="mt-1">
                                              <IconButton
                                                onClick={() => {
                                                  setShowAddressDialog(true);
                                                  setAddressType('deliveryToAddress');
                                                }}
                                                disabled={field.disableOnEdit}
                                                size="small"
                                              >
                                                <AddIcon color={field.disableOnEdit ? 'disabled' : 'primary'} />
                                              </IconButton>
                                            </HtmlTooltip>
                                          </Box>
                                        )}
                                      </Box>
                                    ) : (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        fields={initialData.fields}
                                        isNew={!Boolean(deliveryTicketId)}
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
                                    )}
                                  </Grid>
                                )
                              )}
                            </Grid>
                          </Box>
                        </div>
                      ) : (
                        form.sectionFields.map((field) => (
                          <FormTypes
                            {...field}
                            fieldData={field}
                            fields={initialData.fields}
                            disabled={Boolean(deliveryTicketId) && field.disableOnEdit}
                            isNew={Boolean(deliveryTicketId)}
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
                  id={'manage-ticket-dialog-cancel-button'}
                  size="small"
                  disabled={isSubmitting || loading}
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
                  disabled={isSubmitting || loading}
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  id={'manage-ticket-dialog-save-button'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  {' '}
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
                          addressType === 'pickupFromAddress'
                            ? addressData.find((d) => d?.optionLabel === obj?.fullAddress)
                            : addressData.find((d) => d?.optionLabel === obj?.fullAddress);
                        if (addressType === 'pickupFromAddress') {
                          onPickupFromAddressOpen(values.pickupFromType, values.pickupFrom, tempAddress?.optionValue);
                        } else {
                          onDeliveryToAddressOpen(values.deliveryToType, values.deliveryTo, tempAddress?.optionValue);
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
                        if (addressType === 'pickupFromAddress') {
                          setPickupFromAddress((prevState) => [
                            ...prevState,
                            {
                              default: false,
                              optionLabel: obj?.fullAddress,
                              optionValue: obj._id,
                              order: pickupFromAddress.length + 1
                            }
                          ]);
                        } else {
                          setDeliveryToAddress((prevState) => [
                            ...prevState,
                            {
                              default: false,
                              optionLabel: obj?.fullAddress,
                              optionValue: obj._id,
                              order: deliveryToAddress.length + 1
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

export default ManageDeliveryTicket;
