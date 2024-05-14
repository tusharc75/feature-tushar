import { Button, CircularProgress, Dialog, IconButton, Menu, MenuItem, TextField } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import Grid from '@material-ui/core/Grid/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { ExpandMore } from '@material-ui/icons';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Edit from '@material-ui/icons/Edit';
import HelpIcon from '@material-ui/icons/HelpOutline';
import InfoIcon from '@material-ui/icons/Info';
import LocalShippingIcon from '@material-ui/icons/LocalShipping';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { groupBy, map, uniq } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdHandyman, MdHomeRepairService } from 'react-icons/md';
import { Link } from 'react-router-dom';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ReplaceAssetReason from 'src/components/RentalManagment/ReplaceAssetReason';
import { rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import ConsumeProduct from '../../../components/RentalManagment/ConsumeProduct';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  RENTAL_INTERNAL_ASSET_STATUS,
  RENTAL_STEPS,
  REPAIR_JOB_STATUS,
  dateFormat,
  deliveryTicket,
  gridLoadingTimeout,
  serializedAsset as productInventoryHelperObject,
  rentalManagement,
  repairJob,
  repairOrder,
  sidebarResource
} from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import ManageRepairJob from '../../RepairJob/ManageRepairJob';
import DateDialog from '../LoadingTicket/DateDialog';
import AddSerializedAsset from '../SerializedAsset/AddSerializedAsset';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import { getRentalDeliveryTicket, getRentalProductAssets, uniqueProduct } from './../rentalOfflineHelper';
import ChangeActualDateDialog from './ChangeActualDateDialog';
import ExistingRentalJob from './ExistingRentalJob';
import ReturnTicketDialog from './ReturnTicketDialog';
import StatusChangeFieldDialog from './StatusAssetChangeDialog';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  }
}));

const ReceivingTicket = ({
  currentStep,
  rentalManagementData,
  fetchRentalData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  allowedToEdit,
  isProcessor,
  allowUpdateStatus,
  stepFullScreen,
  checkProgressiveBilling
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { selectedRecords, dataRows } = state;

  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);
  const [showConformationConsume, setShowConformationConsume] = useState({ open: false, type: 'add' });
  const [showConformationConsumeMultiple, setShowConformationConsumeMultiple] = useState(false);
  const [showConformationRevertTicket, setShowConformationRevertTicket] = useState(false);
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState({ open: false });
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showQtyDialog, setShowQtyDialog] = useState({ open: false, data: null });
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: '', data: {} });
  const { isOffline } = useContext(CustomOfflineContext);
  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [showRepairOrderDialog, setShowRepairOrderDialog] = useState(false);
  const [isExistingRentalJob, setIsExistingRentalJob] = useState(false);
  const [uniqueReceivingTicket, setUniqueReceivingTicket] = useState([]);
  const [showInfo, setShowInfo] = useState({ open: false, data: {}, type: null });
  const [invoiceData, setInvoiceData] = useState(null);
  const [openChangeActualDateDialog, setOpenChangeActualDateDialog] = useState({ open: false, data: null, loading: false });
  const [anchorLinkActionEl, setAnchorLinkActionEl] = useState(null);
  const [repairJobCount, setRepairJobCount] = useState(0);
  const [repairOrderCount, setRepairOrderCount] = useState(0);
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [], type: '' });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });

  const [columns, setColumns] = useState(null);
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({open:false, fields:[], referenceData: {}});
  const [assetsData,setAssetsData] = useState([])

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openLinkActions = (event) => {
    setAnchorLinkActionEl(event.currentTarget);
  };

  const closeLinkActions = () => {
    setAnchorLinkActionEl(null);
  };

  useEffect(() => {
    getColumn();
    fetchRecords();
    fetchPolicy();
  }, [currentStep]);

  const OpenInNewWindow = (url) => {
    window.open(`${url}?referenceType=${rentalManagementData?.rentalJobName}&referenceId=${rentalManagementData?._id}`, '_blank');
  };

  const fetchRecords = async () => {
    try {
      setNextStep(false);
      setNextStepToolTip(null);
      setAssetsData([]);
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });

      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
      var productSerialNumbers: any = [];
      var consumeProducts: any = [];
      var transactionData: any = [];

      var invoiceData: any = [];

      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map((u) => ({
          ...u,
          type: 'Asset',
          displayType: 'Asset',
          qty: 1,
          productName: u?.product?.optionLabel,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          currentLocation: u?.currentLocation?.optionValue,
          rentalAssetStatus: u?.status,
          startDate: u?.actualStartDate,
          endDate: u?.actualEndDate,
          manualStartDate: u?.manualStartDate,
          manualEndDate: u?.manualEndDate
        }));

        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);

        const productResponse = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = productResponse.material;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
        productAssets = response?.data?.data;
        productAssets = productAssets
          .map((d) => {
            return {
              ...d.inventory,
              uniqueId: d._id,
              rentalAssetStatus: d.status,
              startDate: d.actualStartDate || d.startDate,
              endDate: d.actualEndDate || d.endDate,
              manualStartDate: d.manualStartDate,
              manualEndDate: d.manualEndDate,
              isReplaced: d.isReplaced,
              replaceReason: d.replaceReason,
              replaceAsset: d?.replaceAsset
                ? productAssets?.find((ele) => ele?.inventory?._id === d?.replaceAsset)?.inventory?.assetNumber || d?.replaceAsset
                : '',
              description: d?.product?.productDescription
            };
          })
          .map((u) => ({
            ...u,
            type: 'Asset',
            displayType: 'Asset',
            qty: 1,
            productName: u?.product?.optionLabel,
            productId: u?.product?.optionValue,
            warehouse: u?.warehouse?.optionLabel,
            warehouseId: u?.warehouse?.optionValue,
            currentOwner: u?.currentOwner,
            currentLocation: u?.currentLocation?.optionValue,
            startDate: u?.startDate,
            endDate: u?.endDate,
            manualStartDate: u?.manualStartDate,
            manualEndDate: u?.manualEndDate
          }));

        const transactionResult = await axiosInstance().get(`${rentalManagement.api}/rental-related-transaction/${rentalManagementData._id}`);
        transactionData = transactionResult?.data?.data;

        const result = await axiosInstance().get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}`
        );
        deliveryTicketList = result?.data?.data;

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = productResponse?.data?.data?.material;
        nonSerializeAsset = productResponse?.data?.data?.nonSerializeAsset;
        consumeProducts = productResponse?.data?.data?.consumeProducts;
        productSerialNumbers = productResponse?.data?.data?.productSerialNumbers;

        const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData._id}/invoice/material-end-date-qty`);
        invoiceData = invoiceResponse?.data?.data?.material || [];

        setInvoiceData(invoiceData);
      }

      if (permissions?.repairJob?.isRead && transactionData?.repairJob?.length) {
        setRepairJobCount(transactionData?.repairJob?.length);
      }
      if (permissions?.repairOrder?.isRead && transactionData?.repairOrder?.length) {
        setRepairOrderCount(transactionData?.repairOrder?.length);
      }

      if (transactionData?.repairJob?.length || transactionData?.repairOrder?.length) {
        productAssets?.forEach((element) => {
          const repairJob = transactionData?.repairJob?.find((e) => e?.assetId === element?._id);
          if (repairJob) {
            element.isRepairJob = true;
            element.repairJob = repairJob?._id;
          }
          const repairOrder = transactionData?.repairOrder?.find((e) => e?.assetId === element?._id);
          if (repairOrder) {
            element.isRepairOrder = true;
            element.repairOrder = repairOrder?._id;
          }
        });
      }

      const loadingTicketProducts = [];
      const returnTicketProducts = [];
      const receiveTicketProducts = [];

      deliveryTicketList?.forEach((element) => {
        if (element.ticketType === DELIVERY_TICKET_TYPE.loading && element?.products && element?.products?.length) {
          element?.products?.forEach((ele) => {
            loadingTicketProducts.push({
              ...ele,
              loadingTicketId: element._id,
              loadingTicket: element?.ticketName,
              loadingTicketStatus: element?.status
            });
          });
        }
        if (element.ticketType === DELIVERY_TICKET_TYPE.return && element?.products && element?.products?.length) {
          element?.products?.forEach((ele) => {
            returnTicketProducts.push({
              ...ele,
              returnTicketId: element._id,
              returnTicket: element?.ticketName,
              returnTicketStatus: element?.status
            });
          });
        }
        if (element.ticketType === DELIVERY_TICKET_TYPE.receiving && element?.products && element?.products?.length) {
          element?.products?.forEach((ele) => {
            receiveTicketProducts.push({
              ...ele,
              receivingTicketId: element._id,
              receivingTicket: element?.ticketName,
              receivingTicketStatus: element?.status
            });
          });
        }
      });

      products = uniqueProduct(material?.filter((e) => e.consumableType !== 'Internal'));
      products?.forEach((element) => {
        var qty = element.qty;

        const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId);
        ticketProduct?.forEach((ele) => {
          const returnTicket = returnTicketProducts?.find((e) => e.qty <= ele.qty && e.product === element.materialId && !e.isCount);

          var consumeQty = 0;

          consumeProducts
            ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
            ?.forEach((e) => {
              consumeQty = consumeQty + e.qty;
            });

          const obj: any = {};
          obj.uniqueId = element._id;
          obj.serialized = element?.productDetail?.serializedProduct;
          obj._id = element?.productDetail?._id + '_' + ele.loadingTicketId;
          obj.materialId = element?.productDetail?._id;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.description =
            element.type === 'service'
              ? element?.serviceDetail?.serviceDescription || ''
              : element.type === 'product'
                ? element?.productDetail?.productDescription || ''
                : element.type === 'package'
                  ? element?.packageDetail?.packageDescription || ''
                  : '';
          obj.qty = ele.qty;
          obj.consumeQty = consumeQty;
          obj.returnQty = !element?.productDetail?.serializedProduct ? returnTicket?.qty || 0 : 0;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
          obj.status = element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
          obj.parentId = element?.parentId;
          obj.parentName = element?.parentName;
          obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
            ? ele.qty === consumeQty
              ? RENTAL_INTERNAL_ASSET_STATUS.consumed
              : consumeQty < ele.qty && consumeQty > 0
                ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
                : ele.qty === (returnTicket?.qty || 0)
                  ? 'Returned'
                  : element?.status
            : element?.status;
          obj.startDate = element?.actualStartDate;
          obj.endDate = element?.actualEndDate;
          obj.manualStartDate = element?.manualStartDate;
          obj.manualEndDate = element?.manualEndDate;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
          obj.loadingTicket = ele?.loadingTicket;
          obj.loadingTicketId = ele?.loadingTicketId;
          obj.loadingTicketStatus = ele?.loadingTicketStatus;
          obj.currentLocation =
            element?.currentLocation?.optionValue ||
            rentalManagementData?.shippingAddress?.optionValue ||
            rentalManagementData?.billingAddress?.optionValue;

          if (returnTicket) {
            returnTicket.isCount = true;
            obj.returnTicket = returnTicket?.returnTicket;
            obj.returnTicketId = returnTicket?.returnTicketId;
            obj.returnTicketStatus = returnTicket?.returnTicketStatus;
          }
          productAssets.push(obj);
          qty = qty - ele.qty;
        });

        if (qty > 0) {
          const obj: any = {};
          obj._id = element.materialId;
          obj.materialId = element?.materialId;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.description =
            element.type === 'service'
              ? element?.serviceDetail?.serviceDescription || ''
              : element.type === 'product'
                ? element?.productDetail?.productDescription || ''
                : element.type === 'package'
                  ? element?.packageDetail?.packageDescription || ''
                  : '';
          obj.qty = qty;
          obj.parentId = element?.parentId;
          obj.parentName = element?.parentName;
          obj.consumeQty = 0;
          obj.returnQty = 0;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
          obj.status = element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
          obj.rentalAssetStatus = element?.productDetail?.serializedProduct ? element?.status : '';
          obj.currentLocation =
            element?.currentLocation?.optionValue ||
            rentalManagementData?.shippingAddress?.optionValue ||
            rentalManagementData?.billingAddress?.optionValue;

          productAssets.push(obj);
        }
      });

      if (productSerialNumbers?.length) {
        material?.filter((e) => e?.productDetail?.serializedProduct && e.type === MATERIAL_TYPE.product).forEach((element) => {

          var qty = productSerialNumbers?.filter((e) => e?._id === element?._id)?.length;

          if (qty) {
            const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId);
            ticketProduct?.forEach((ele) => {
              const returnTicket = returnTicketProducts?.find((e) => e.qty <= ele.qty && e.product === element.materialId && !e.isCount);
              const receiveTicket = receiveTicketProducts?.find((e) => e.qty <= ele.qty && e.product === element.materialId && !e.isCount);

              var consumeQty = 0;
              consumeProducts
                ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
                ?.forEach((e) => {
                  consumeQty = consumeQty + e.qty;
                });

              const obj: any = {};
              obj._id = element?.productDetail?._id + '_' + ele.loadingTicketId;
              obj.uniqueId = element._id;
              obj.serialized = element?.productDetail?.serializedProduct;
              obj.materialId = element?.productDetail?._id;
              obj.type = 'Product';
              obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
              obj.description =
                element.type === 'service'
                  ? element?.serviceDetail?.serviceDescription || ''
                  : element.type === 'product'
                    ? element?.productDetail?.productDescription || ''
                    : element.type === 'package'
                      ? element?.packageDetail?.packageDescription || ''
                      : '';
              obj.qty = ele.qty;
              obj.consumeQty = consumeQty;
              obj.returnQty = !element?.productDetail?.serializedProduct ? returnTicket?.qty || 0 : 0;
              obj.assetNumber = element?.productDetail?.productName;
              obj.productName = element?.productDetail?.productName;
              obj.productId = element?.productDetail?._id;
              obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
              obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
              obj.status = element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
              obj.parentId = element?.parentId;
              obj.parentName = element?.parentName;
              obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
                ? ele.qty === consumeQty
                  ? RENTAL_INTERNAL_ASSET_STATUS.consumed
                  : consumeQty < ele.qty && consumeQty > 0
                    ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
                    : ele.qty === (returnTicket?.qty || 0)
                      ? 'Returned'
                      : element?.status
                : element?.status;
              obj.startDate = element?.actualStartDate;
              obj.endDate = element?.actualEndDate;
              obj.manualStartDate = element?.manualStartDate;
              obj.manualEndDate = element?.manualEndDate;
              obj.productSerialNumbers = productSerialNumbers?.filter((p) => p?._id === element?._id)?.map(_p => ({ ..._p, assetNumber: _p?.productSerialNumberDetail?.serialNumber }));
              obj.loadingTicket = ele?.loadingTicket;
              obj.loadingTicketId = ele?.loadingTicketId;
              obj.loadingTicketStatus = ele?.loadingTicketStatus;
              obj.currentLocation =
                element?.currentLocation?.optionValue ||
                rentalManagementData?.shippingAddress?.optionValue ||
                rentalManagementData?.billingAddress?.optionValue;

              if (returnTicket) {
                returnTicket.isCount = true;
                obj.returnTicket = returnTicket?.returnTicket;
                obj.returnTicketId = returnTicket?.returnTicketId;
                obj.returnTicketStatus = returnTicket?.returnTicketStatus;
              }
              if (receiveTicket) {
                receiveTicket.isCount = true;
                obj.receivingTicketId = receiveTicket?.receivingTicketId;
                obj.receivingTicket = receiveTicket?.receivingTicket;
                obj.receivingTicketStatus = receiveTicket?.receivingTicketStatus;
              }
              productAssets.push(obj);
              qty = qty - ele.qty;
            });

            if (qty > 0) {
              productAssets.push({
                _id: element?._id,
                materialId: element?.materialId,
                uniqueId: element?.uniqueId,
                type: 'Product',
                displayType: 'Product (Serialized)',
                qty: qty,
                description: element?.productDetail?.productDescription || '',
                parentId: element?.parentId,
                parentName: element?.parentName,
                consumeQty: 0,
                returnQty: 0,
                assetNumber: element?.productDetail?.productName,
                productName: element?.productDetail?.productName,
                productId: element?.productDetail?._id,
                warehouse: rentalManagementData?.warehouse?.optionLabel,
                warehouseId: rentalManagementData?.warehouse?.optionValue,
                productSerialNumbers: productSerialNumbers?.filter((p) => p?._id === element?._id)?.map(_p => ({ ..._p, assetNumber: _p?.productSerialNumberDetail?.serialNumber })),
                status: element?.productDetail?.serializedProduct === true ? element?.status : 'N/A',
                rentalAssetStatus: element?.productDetail?.serializedProduct ? element?.status : '',
                currentLocation:
                  element?.currentLocation?.optionValue ||
                  rentalManagementData?.shippingAddress?.optionValue ||
                  rentalManagementData?.billingAddress?.optionValue
              });
            }
          }
        });
      }

      deliveryTicketList?.map((obj) => {
        productAssets?.map((d, index) => {
          if (obj?.assets?.some((p) => p?.asset === d?._id && p?.uniqueId === d?.uniqueId)) {
            if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
              productAssets[index]['loadingTicket'] = obj?.ticketName;
              productAssets[index]['loadingTicketId'] = obj?._id;
              productAssets[index]['loadingTicketStatus'] = obj?.status;
            }
            if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving) {
              productAssets[index]['receivingTicket'] = obj?.ticketName;
              productAssets[index]['receivingTicketId'] = obj?._id;
              productAssets[index]['receivingTicketStatus'] = obj?.status;
            }
            if (obj.ticketType === DELIVERY_TICKET_TYPE.return) {
              productAssets[index]['returnTicket'] = obj?.ticketName;
              productAssets[index]['returnTicketId'] = obj?._id;
              productAssets[index]['returnTicketStatus'] = obj?.status;
            }
          }
        });
      });

      productAssets.forEach((d) => {
        d['parentName'] = d?.hasOwnProperty('parentName') && d?.parentName !== '' ? d?.parentName : d?.productName;
        d['parentId'] = d?.hasOwnProperty('parentId') && d?.parentId !== '' ? d?.parentId : d?.productId;
        d['isChecked'] = false;
        d['hideSelection'] = [ASSET_STATUS.lost].includes(d.status) || d?.manualStatus === ASSET_STATUS.reserved ? true : false;

        const invoiceMaterial = invoiceData?.find((obj) => obj?._id === d?._id || obj?._id === d?.uniqueId);
        d['isInvoiceCreated'] = invoiceMaterial ? true : false;
        d['isAllowedStartDate'] = d?.manualStartDate && !invoiceMaterial ? true : false;
        d['isAllowedEndDate'] = d?.manualEndDate ? true : false;
        if (d['isAllowedEndDate'] && invoiceMaterial) {
          d['minEndDate'] = new Date(invoiceMaterial?.endDate);
        }
      });

      if (user?.user?.brandPolicy?.rentalOnFieldStep && currentStep === RENTAL_STEPS.onField) {
        if (productAssets.filter((e) => e?.receivingTicketId || e?.returnTicketId).length) {
          setNextStep(true);
        } else {
          setNextStepToolTip(rentalManagementMessage.receivingCreateToProceed);
        }
      } else {
        if (
          productAssets.filter(
            (e) =>
              [
                ASSET_STATUS.underReview,
                ASSET_STATUS.available,
                ASSET_STATUS.repair,
                ASSET_STATUS.scrap,
                ASSET_STATUS.lost,
                ASSET_STATUS.notApplied
              ].includes(e.status) ||
              [RENTAL_INTERNAL_ASSET_STATUS.consumed, RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(
                e.rentalAssetStatus
              )
          ).length === productAssets.length
        ) {
          setNextStep(true);
        } else {
          setNextStepToolTip(rentalManagementMessage.receivingCreatedAndDelivered);
        }
      }

      setUniqueReceivingTicket([...new Set(productAssets.filter((d) => d.receivingTicketId !== undefined).map((d) => d.receivingTicketId))]);

      productAssets = [...productAssets?.filter((e) => !e.isReplaced), ...productAssets?.filter((e) => e.isReplaced)];

      productAssets?.forEach((e, index) => {
        e.index = index + 1;
      });

      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const getColumn = async () => {
    setColumns(null);
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName']
        },
        {
          resource: 'Serialized Asset',
          fieldNames: ['serialNumber']
        }
      ]
    });
    const productFields = data?.filter((d) => d.resource === 'Product');
    const assetFields = data?.filter((d) => d.resource === 'Serialized Asset');
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        minWidth: 100,
        width: 100,
        disabled: true,
        Cell: ({ row }) => (
          <div
            className="d-flex gap-2 align-items-center"
            style={{
              backgroundColor: [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(
                row?.original?.status
              )
                ? COLOUR_MASTER.lostAssets.background
                : ''
            }}
          >
            <h5 className="text-truncate">{row?.original?.index}</h5>
            {row?.original?.receivingTicketId && (
              <HtmlTooltip title={`Receiving Ticket ${row?.original?.receivingTicketStatus}`}>
                <LocalShippingIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
            {row?.original?.returnTicketId && (
              <HtmlTooltip title={`Return Ticket ${row?.original?.returnTicketStatus}`}>
                <LocalShippingIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
            {row?.original?.warehouseId && row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue && (
              <HtmlTooltip title="This asset will be shipped from different facility">
                <IconButton size="small">
                  <HelpIcon fontSize="small" color="primary" />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.isReplaced && (
              <HtmlTooltip
                title={`This Asset has been Replaced by ${row?.original?.replaceAsset} (Due to following reason-"${row?.original?.replaceReason}")`}
              >
                <InfoIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
          </div>
        )
      },
      {
        accessor: 'assetNumber',
        Header: 'Details',
        disabled: true,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate">{row?.original?.assetNumber}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(
                  `${row?.original?.type === 'Asset' ? routes.serializedAssetDetail.path : routes.productDetail.path}/${row?.original?._id?.split('_')[0]
                  }`
                );
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
            {((row?.original?.nonSerializeAsset && row?.original?.nonSerializeAsset?.length > 0) ||
              (row?.original?.productSerialNumbers && row?.original?.productSerialNumbers?.length > 0)) && (
                <HtmlTooltip
                  title={row?.original?.nonSerializeAsset?.length > 0 ? `Non-${routes.serializedAsset.title}` : `Serial Numbers`}
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowInfo({
                        open: true,
                        data: {
                          productName: row?.original?.productName,
                          data:
                            row?.original?.nonSerializeAsset?.length > 0 ? row?.original?.nonSerializeAsset : row?.original?.productSerialNumbers
                        },
                        type: row?.original?.nonSerializeAsset?.length > 0 ? `Non-${routes.serializedAsset.title}` : `Serial Numbers`
                      });
                    }}
                  >
                    <InfoIcon fontSize="small" color={'primary'} />
                  </IconButton>
                </HtmlTooltip>
              )}
            {row?.original?.isRepairJob && (
              <HtmlTooltip title={`${routes.repairJob.title}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.repairJobDetail.path}/${row?.original?.repairJob}`);
                  }}
                >
                  <MdHomeRepairService fontSize="20" color="#163340" />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.isRepairOrder && (
              <HtmlTooltip title={`${routes.repairOrder.title}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.repairOrderDetail.path}/${row?.original?.repairOrder}`);
                  }}
                >
                  <MdHandyman fontSize="20" color="#163340" />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        )
      },
      {
        accessor: 'displayType',
        Header: 'Type',
        disabled: true,
        Cell: ({ row }) => (row?.original?.displayType ? <h5 className="text-truncate">{row?.original?.displayType}</h5> : <NoDataCell />)
      },
      {
        accessor: 'parentName',
        Header: 'Parent',
        disabled: true,
        Cell: ({ row }) => (row?.original?.parentId ? <h5 className="text-truncate">{row?.original?.parentName}</h5> : <NoDataCell />)
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        disabled: true,
        Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
      },
      ...(assetFields?.find((f) => f.fieldName === 'serialNumber') ? [{
        accessor: 'serialNumber',
        Header: assetFields?.find((f) => f.fieldName === 'serialNumber')?.fieldLabel || 'Serial Number',
        Cell: ({ row }) => (row?.original?.serialNumber ? <h5 className="text-truncate">{row?.original?.serialNumber}</h5> : <NoDataCell />)
      }] : []),
      {
        accessor: 'productName',
        Header: productFields?.find((f) => f.fieldName === 'productName')?.fieldLabel || 'Product',
        Cell: ({ row }) =>
          row?.original?.productName ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h5 className="text-truncate">{row?.original?.productName}</h5>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'description',
        Header: 'Description',
        Cell: ({ row }) => (row?.original?.description ? <h5 className="text-truncate">{row?.original?.description}</h5> : <NoDataCell />)
      },
      {
        accessor: 'warehouse',
        Header: 'Plant',
        Cell: ({ row }) =>
          row?.original?.warehouse ? (
            <Link
              className="link text-truncate"
              target="_blank"
              title={row?.original?.warehouse}
              to={`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`}
            >
              {row?.original?.warehouse}
            </Link>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'loadingTicket',
        Header: 'Loading Ticket',
        Cell: ({ row }) =>
          row?.original?.loadingTicket ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'receivingTicket',
        Header: 'Receiving Ticket',
        Cell: ({ row }) =>
          row?.original?.receivingTicket ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h5 className="text-truncate">{row?.original?.receivingTicket}</h5>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.receivingTicketId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'returnTicket',
        Header: 'Return Ticket',
        Cell: ({ row }) =>
          row?.original?.returnTicket ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h5 className="text-truncate">{row?.original?.returnTicket}</h5>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.returnTicketId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'returnQty',
        Header: 'Returned Qty',
        Cell: ({ row }) => (row?.original?.returnQty ? <h5 className="text-truncate">{row?.original?.returnQty}</h5> : <NoDataCell />)
      },
      {
        accessor: 'status',
        Header: 'Asset Status',
        Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
      },
      {
        accessor: 'manualStartDate',
        Header: 'Start Date',
        Cell: ({ row }) =>
          row?.original?.manualStartDate ? (
            <h5 className="text-truncate" title={`${moment(row?.original?.manualStartDate).format(dateFormat)}`}>
              {moment(row?.original?.manualStartDate)?.format(dateFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'manualEndDate',
        Header: 'End Date',
        Cell: ({ row }) =>
          row?.original?.manualEndDate ? (
            <h5 className="text-truncate" title={`${moment(row?.original?.manualEndDate).format(dateFormat)}`}>
              {moment(row?.original?.manualEndDate)?.format(dateFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'startDate',
        Header: 'System Start Date',
        Cell: ({ row }) =>
          row?.original?.startDate ? (
            <h5 className="text-truncate" title={`${moment(row?.original?.startDate).format(dateFormat)}`}>
              {moment(row?.original?.startDate)?.format(dateFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'endDate',
        Header: 'System End Date',
        Cell: ({ row }) =>
          row?.original?.endDate ? (
            <h5 className="text-truncate" title={`${moment(row?.original?.endDate).format(dateFormat)}`}>
              {moment(row?.original?.endDate)?.format(dateFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'rentalAssetStatus',
        Header: 'Rental Asset Status',
        Cell: ({ row }) => (row?.original?.rentalAssetStatus ? <h5 className="text-truncate">{row?.original?.rentalAssetStatus}</h5> : <NoDataCell />)
      }
    ];
    if (user?.user?.brandPolicy?.rentalReceivingStepConsume) {
      column.push({
        accessor: 'consumeQty',
        Header: 'Consumed Qty',
        Cell: ({ row }) => (row?.original?.consumeQty ? <h5 className="text-truncate">{row?.original?.consumeQty}</h5> : <NoDataCell />)
      });
    }
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) =>
        allowedToEdit ? (
          <HtmlTooltip
            title={
             row?.original?.isInvoiceCreated && !row?.original?.isAllowedEndDate ? 'Invoice Created - Cannot change Start Date' :
              row?.original?.isAllowedStartDate === false && row?.original?.isAllowedEndDate === false
                ? `Can change the Date after delivered`
                : row?.original?.isAllowedEndDate === false && row?.original?.isAllowedStartDate !== true
                  ? `Can change the End Date after received`
                  : 'Update - Start Date/End Date'
            }
          >
            <span>
              <IconButton
                size="small"
                disabled={row?.original?.isAllowedStartDate || row?.original?.isAllowedEndDate ? false : true}
                onClick={() => {
                  setOpenChangeActualDateDialog({ ...openChangeActualDateDialog, open: true, data: row?.original });
                }}
              >
                <Edit fontSize="small" color={row?.original?.isAllowedStartDate || row?.original?.isAllowedEndDate ? 'primary' : 'inherit'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : null
    });
    setColumns(column);
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setAssetPolicyData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };
 
  const handleTicketDialog = (ticketType, deliveryToType, open = true) => {
    const data = {};
    const matchedStatus = assetPolicyData?.policy?.statusChangeFields?.find((ele)=> ele.status===ASSET_STATUS.underReview);
    data['ticketName'] = rentalManagementData.rentalJobName;
    data['referenceId'] = rentalManagementData._id;
    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
    data['pickupFrom'] = rentalManagementData?.customerAccount?.optionValue;
    data['pickupFromAddress'] = selectedRecords[0]?.currentLocation;
    data['deliveryToType'] = deliveryToType;
    if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
      if (selectedRecords.length) {
        data['deliveryTo'] = selectedRecords[0].owner;
        data['deliveryToAddress'] = '';
        data['isDeliveryToDisable'] = true;
      }
    } else {
      data['deliveryTo'] = rentalManagementData?.warehouse?.optionValue;
      data['deliveryToAddress'] = rentalManagementData?.warehouse?.address;
    }
    data['startDate'] = rentalManagementData?.estimateStartDate;
    data['endDate'] = rentalManagementData?.estimateStartDate;
    data['isPickupFromDisable'] = true;

    data['wellName'] = rentalManagementData?.wellName?.optionValue;

    if (rentalManagementData?.wellNumber) {
      if (rentalManagementData?.wellNumber?.optionValue) {
        data['wellNumber'] = rentalManagementData?.wellNumber?.optionValue;
      } else {
        data['wellNumber'] = rentalManagementData?.wellNumber?.map((e) => e?.optionValue);
      }
    }

    data['afeNumber'] = rentalManagementData?.afeNumber;
    if (rentalManagementData?.processor?.optionValue) {
      data['processor'] = rentalManagementData?.processor?.optionValue;
    }
    //data['status'] = DELIVERY_TICKET_STATUS.inTransit;
    if(matchedStatus){
     setOpenAssetDataDialog({open:true, fields: matchedStatus?.fields, referenceData:data})
    }else{
      setShowTicketDialog({ open: open, ticketType: ticketType, data: data });
    }  
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, {
        assets: selectedRecords?.map((s) => {
          return { _id: s._id, currentStatus: s.status };
        })
      })
      .then(({ data }) => {
        axiosInstance()
          .patch(`${repairJob.api}/${repairJobId}/status`, { status: REPAIR_JOB_STATUS.inProgress })
          .then(({ data: { data } }) => { })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssetsToRepairOrder = async (repairOrderData: any) => {
    let rows = selectedRecords.map((record: any) => ({
      materialId: record._id,
      type: MATERIAL_TYPE.serializedAsset,
      qty: 1,
      parentId: null
    }));
    axiosInstance()
      .post(`${repairOrder.api}/${repairOrderData}/product-package`, { material: rows })
      .then(() => {
        setShowRepairOrderDialog(false);
        fetchRecords();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handelProcessLoadingTickets = (date = new Date(), status = null) => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = rentalManagementData?.warehouse?.optionValue;
      data['receiveDate'] = date;

      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          if (status) {
            handleChangeStatusInUse(status, openDateDialog.prevStatus, date);
          } else {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: `Delivered Successfully`
            });
            setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
            fetchRecords();
          }
          checkProgressiveBilling();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelProcessTickets = () => {
    let data = {};
    const receivingTicketId = uniq(map(selectedRecords, 'receivingTicketId'));
    const returnTicketId = uniq(map(selectedRecords, 'returnTicketId'));
    const ticketIds: any = [];
    receivingTicketId?.forEach((e) => {
      if (e && e !== undefined) {
        ticketIds.push(e);
      }
    });
    returnTicketId?.forEach((e) => {
      if (e && e !== undefined) {
        ticketIds.push(e);
      }
    });
    if (ticketIds.length) {
      data['_ids'] = ticketIds;
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = rentalManagementData?.warehouse?.optionValue;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Receiving Successfully`
          });
          if (
            receivingTicketId?.length &&
            selectedRecords?.filter((e) => e.type === 'Asset')?.length &&
            user?.user?.brandPolicy?.rentalRepairAutoCreate
          ) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Repair Order created for received assets'
            });
          }
          fetchRecords();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleConsumProduct = (data) => {
    const products = [];
    if (data) {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, loadingTicketId: e.loadingTicketId, qty: parseInt(data.qty) });
      });
    } else {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, loadingTicketId: e.loadingTicketId, qty: parseInt(e.qty) - parseInt(e.consumeQty || 0) });
      });
    }
    setOkBtnLoading(true);

    if (showConformationConsume?.type === 'revert') {
      axiosInstance()
        .post(`${rentalManagement.api}/revert-consume-product/${rentalManagementData._id}`, { products: products })
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationConsume({ open: false, type: '' });
          setShowConformationConsumeMultiple(false);
          fetchRecords();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${rentalManagement.api}/consume-product/${rentalManagementData._id}`, { products: products })
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationConsume({ open: false, type: '' });
          setShowConformationConsumeMultiple(false);
          fetchRecords();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleAutoConsume = (data: any[]) => {
    const products = data?.map((d) => ({ product: d.materialId, qty: parseInt(d.qty) }));
    axiosInstance()
      .post(`${rentalManagement.api}/consume-product/${rentalManagementData._id}`, { products })
      .then(({ data }) => {
        setOkBtnLoading(false);
        setShowConformationConsume({ open: false, type: '' });
        setShowConformationConsumeMultiple(false);
        fetchRecords();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeStatus = () => {
    setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: true }));
    axiosInstance()
      .put(`${productInventoryHelperObject.api}/update-status`, {
        comment: statusToUpdate.message,
        assets: selectedRecords.map((m) => ({
          _id: m?._id ?? m?.id,
          currentStatus: m.status
        })),
        status: statusToUpdate.status,
        reference: {
          _id: rentalManagementData._id,
          type: 'Rental'
        }
      })
      .then(({ data }) => {
        setStatusToUpdate({ open: false, isUpdating: false, status: '', message: '' });
        fetchRecords();
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
      })
      .catch((error) => {
        setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false }));
        toastConfig.setToastConfig(error);
      });
  };

  const handelRevertTickets = () => {
    setOkBtnLoading(true);
    const receivingTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e?.receivingTicketId),
        'receivingTicketId'
      )
    );
    const returnTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e?.returnTicketId),
        'returnTicketId'
      )
    );
    if (receivingTicketIds?.length || returnTicketIds?.length) {
      let data = [];
      receivingTicketIds?.forEach((receivingTicketId) => {
        const ele: any = {};
        ele._id = receivingTicketId;
        ele.products = selectedRecords?.filter((e) => e?.receivingTicketId === receivingTicketId && e?.type === 'Product')?.map((e) => e?.productId);
        ele.assets = selectedRecords?.filter((e) => e?.receivingTicketId === receivingTicketId && e?.type === 'Asset')?.map((e) => e?._id);
        data.push(ele);
      });
      returnTicketIds?.forEach((returnTicketId) => {
        const ele: any = {};
        ele._id = returnTicketId;
        ele.products = selectedRecords?.filter((e) => e?.returnTicketId === returnTicketId && e?.type === 'Product')?.map((e) => e?.productId);
        ele.assets = selectedRecords?.filter((e) => e?.returnTicketId === returnTicketId && e?.type === 'Asset')?.map((e) => e?._id);
        data.push(ele);
      });
      axiosInstance()
        .put(`${deliveryTicket.api}/revert-partially`, data)
        .then(({ data: { data } }) => {
          setOkBtnLoading(false);
          setShowConformationRevertTicket(false);
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Reverted Successfully`
          });
        })
        .catch((error) => {
          setOkBtnLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelCancleTickets = async () => {
    setOkBtnLoading(true);
    try {
      const inTransitReceivingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'receivingTicketId'
        )
      );
      const inTransitReturnTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.returnTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'returnTicketId'
        )
      );

      if (inTransitReceivingTicketIds.length || inTransitReturnTicketIds.length) {
        await axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: [...inTransitReceivingTicketIds, ...inTransitReturnTicketIds] });
      }

      const deliveredReceivingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'receivingTicketId'
        )
      );
      const deliveredReturnTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'returnTicketId'
        )
      );

      if (deliveredReceivingTicketIds.length || deliveredReturnTicketIds.length) {
        await axiosInstance().post(`${deliveryTicket.api}/cancel-delivered-ticket`, {
          _ids: [...deliveredReceivingTicketIds, ...deliveredReturnTicketIds]
        });
      }

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Cancelled Successfully`
      });
      setOkBtnLoading(false);
      setShowConformationCancleTicket({ open: false });
      fetchRecords();
      fetchRentalData();
    } catch (error) {
      setOkBtnLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmitChangeDates = (values) => {
    if (!openChangeActualDateDialog.data) return;
    setOpenChangeActualDateDialog({ ...openChangeActualDateDialog, loading: true });
    const data: any = {
      _id: openChangeActualDateDialog?.data?.uniqueId,
      asset: openChangeActualDateDialog?.data?._id?.split('_')[0]
    };
    if (values.manualStartDate) {
      data.startDate = values.manualStartDate;
    }
    if (values.manualEndDate) {
      data.endDate = values.manualEndDate;
    }
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData?._id}/start-end-date`, data)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          message: 'Dates Updated Successfully',
          type: 'success'
        });
        setOpenChangeActualDateDialog({ open: false, data: null, loading: false });
        fetchRecords();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setOpenChangeActualDateDialog({ open: false, data: null, loading: false });
      });
  };

  const handleChangeStatusInUse = (status, prevStatus, date) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    const assets = selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id);
    if (assets?.length) {
      axiosInstance()
        .put(`${rentalManagement.api}/${rentalManagementData._id}/assets-inuse-standby`, {
          assets,
          status: status,
          prevStatus: prevStatus,
          date: date
        })
        .then(({ data }) => {
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setOpenDateDialog((prev) => ({ ...prev, loading: false }));
        });
    } else {
      fetchRecords();
      setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
    }
  };

  const handleChangeDate = (date) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/assets-date-update`, { assets: openDateDialog.assets, date: date })
      .then(({ data }) => {
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenDateDialog({ open: false, type: null, status: null, prevStatus: '', assets: [], loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOpenDateDialog((prev) => ({ ...prev, loading: false }));
      });
  };

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.referenceType = 'rentalJob';
    data.referenceId = rentalManagementData._id;
    const assets: any = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        assets.push({
          _id: element._id,
          uniqueId: element.uniqueId,
          status: element.status,
          deliveryTicketId: element.loadingTicketId,
          newId: result[0]._id
        });
        result[0].isCounted = true;
      }
    });
    data.assets = assets;
    setShowReplaceReason({ open: true, data: data });
  };

  const handleReplaceAsset = (reason) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] });
        setAddSerializedAssetDialog({ open: false, products: [], type: '' });
        setIsSubmitting(false);
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSwapAssets = (rows) => {
    const data = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        data.push({ _id: element._id, newId: result[0]._id });
        result[0].isCounted = true;
      }
    });
    setIsSubmitting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/swap-inuse-assets`, {
        assets: data?.map((e) => e._id),
        newAssets: data?.map((e) => e.newId),
        rentalJob: rentalManagementData?._id
      })
      .then(({ data }) => {
        setAddSerializedAssetDialog({ open: false, products: [], type: '' });
        setIsSubmitting(false);
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Swapped Successfully`
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const getPreview = () => {
    setDownlodingFile(true);
    axiosInstance()
      .get(`pdf/multiple?resource=${sidebarResource.deliveryTicket}&ids=${uniqueReceivingTicket}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileURL;
        link.target = '_blank';
        link.style.display = 'none';
        link.click();
        toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewed Successfully.' });
        setDownlodingFile(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setDownlodingFile(false);
      });
  };

  const rightSideContents = () => {
    return (
      <>
        <Button
          onClick={getPreview}
          variant={isMobile && !isTablet ? 'text' : 'outlined'}
          color="primary"
          type="button"
          size="small"
          disabled={downlodingFile || isOffline || uniqueReceivingTicket.length === 0}
          startIcon={isMobile ? '' : <VisibilityIcon />}
          style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
        >
          {downlodingFile ? 'Please wait...' : 'Preview'}
        </Button>
        {allowedToEdit && (
          <Button
            variant={'outlined'}
            color="primary"
            aria-controls="simple-menu"
            aria-haspopup="true"
            disabled={
              selectedRecords?.length === 0 ||
              isOffline ||
              selectedRecords?.some((f) => f.type === 'Product') ||
              selectedRecords?.some((f) => [ASSET_STATUS.lost].includes(f.status))
            }
            size="small"
            onClick={handleClick}
            endIcon={<ArrowDropDownIcon />}
          >
            {'Change Status'}
          </Button>
        )}
        {(repairJobCount > 0 || repairOrderCount > 0) && (
          <Button
            onClick={openLinkActions}
            variant="outlined"
            color="default"
            size="small"
            aria-controls="action-menu"
            className="normal-case"
            endIcon={<ExpandMore fontSize="inherit" />}
          >
            Order(s)
          </Button>
        )}
        {showProcessDeliveryTicket && !isOffline && (
          <>
            <HtmlTooltip title="Process Multiple Receiving/Return Ticket(s)">
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                color="primary"
                size="small"
                onClick={() => {
                  setOpenDeliveryTicketDialog(true);
                }}
              >
                {isMobile && !isTablet ? <AddBoxRoundedIcon /> : 'Process Ticket'}
              </Button>
            </HtmlTooltip>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              selectedRecords,
              setOpenMessageDialog,
              handleTicketDialog,
              setShowRemoveAssetFromReceivingTicketDialog,
              setShowQtyDialog,
              handelProcessLoadingTickets,
              handelProcessTickets,
              isOffline,
              setIsExistingRentalJob,
              setAddSerializedAssetDialog,
              permissions,
              setShowRepairJobDialog,
              setShowRepairOrderDialog,
              setShowConformationRevertTicket,
              setShowConformationCancleTicket,
              setShowConformationConsume,
              setShowConformationConsumeMultiple,
              dataRows,
              user,
              setOpenDateDialog,
              currentStep
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        rightSideContents={rightSideContents()}
        hasXpadding
      />

      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchRecords}
            hideAction={!(allowedToEdit || isProcessor)}
            hideSelection={!(allowedToEdit || isProcessor)}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      <Menu
        anchorEl={anchorLinkActionEl}
        keepMounted
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        id="orders-menu"
        open={Boolean(anchorLinkActionEl)}
        onClose={closeLinkActions}
      >
        {repairJobCount > 0 && (
          <MenuItem
            onClick={() => {
              OpenInNewWindow(routes.repairJob.path);
            }}
          >
            {`Created ${routes.repairJob.title}`}
          </MenuItem>
        )}
        {repairOrderCount > 0 && (
          <MenuItem
            onClick={() => {
              OpenInNewWindow(routes.repairOrder.path);
            }}
          >
            {`Created ${routes.repairOrder.title}`}
          </MenuItem>
        )}
      </Menu>
      <Menu
        id="status-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {selectedRecords?.filter((f) => f.type === 'Asset').length === selectedRecords.length && allowUpdateStatus && (
          <>
            {selectedRecords?.filter(
              (f) =>
                ((f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                  (f.hasOwnProperty('returnTicketId') && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered)) &&
                [ASSET_STATUS.underReview].includes(f.status)
            )?.length === selectedRecords?.length && (
                <>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.available, message: '' });
                    }}
                  >
                    {ASSET_STATUS.available}
                  </MenuItem>
                </>
              )}
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.scrap, message: '' });
              }}
            >
              {ASSET_STATUS.scrap}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.lost, message: '' });
              }}
            >
              {ASSET_STATUS.lost}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.needRepair, message: '' });
              }}
            >
              {ASSET_STATUS.needRepair}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.needRecert, message: '' });
              }}
            >
              {ASSET_STATUS.needRecert}
            </MenuItem>
          </>
        )}
      </Menu>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={showTicketDialog.ticketType}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          assets={assetsData?.length ? selectedRecords?.filter((e) => e.type === 'Asset')?.map((ele)=> {
            const matchedAsset = assetsData.find(asset => asset._id === ele._id);
            if(matchedAsset){
              const { _id, assetNumber, ...assetData } = matchedAsset;
              return {
                ...ele,
                assetData: {...assetData}
              };
            }
            return ele
            })
            : selectedRecords?.filter((e) => e.type === 'Asset')}
          products={
            showTicketDialog.ticketType === DELIVERY_TICKET_TYPE.return ?
              showQtyDialog?.data && showQtyDialog?.data?.length > 0
                ? showQtyDialog.data.map((d) => ({ ...d, _id: d?.productId, qty: d.returnQuantity }))
                : []
              : selectedRecords?.filter((e) => e.type === 'Product').map((d) => ({
                _id: d?.materialId,
                qty: d?.qty,
                uniqueId: d?.uniqueId,
                productSerialNumbers: d?.productSerialNumbers
              }))}
          onClose={() => setShowTicketDialog({ open: false, ticketType: '', data: {} })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
            if (showTicketDialog.ticketType === DELIVERY_TICKET_TYPE.return) {
              if (showQtyDialog?.data || showQtyDialog?.data?.length > 0) {
                let consumableData = showQtyDialog.data.filter((d) => d?.consumeQuantity > 0);
                consumableData = consumableData.map((d) => ({ ...d, materialId: d?.row?.materialId, qty: d.consumeQuantity }));
                if (consumableData.length > 0) {
                  handleAutoConsume(consumableData);
                }
              }
            }
            fetchRecords();
            fetchRentalData();
          }}
        />
      )}
      {openAssetDataDialog.open && (
        <StatusChangeFieldDialog
          assetData={selectedRecords?.filter((e) => e.type === 'Asset')}
          statusFields={openAssetDataDialog.fields}
          referenceData={openAssetDataDialog.referenceData}
          setAssetsData={setAssetsData}
          onClose={()=> setOpenAssetDataDialog({open:false,fields:null,referenceData:null})}
          onSuccess={(referenceData)=>{
            setOpenAssetDataDialog({open:false,fields:null,referenceData:null})
            setShowTicketDialog({ open: true, ticketType: DELIVERY_TICKET_TYPE.receiving, data: referenceData });

          }}

        />
      )}
      {showQtyDialog.open && (
        <ReturnTicketDialog
          products={selectedRecords.filter((d: any) => d?.type === 'Product')}
          onSuccess={(data) => {
            setShowQtyDialog({ data: data, open: false });
            setShowTicketDialog((ps: any) => ({ ...ps, open: true }));
          }}
          onClose={() => {
            setShowQtyDialog({ open: false, data: null });
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
          }}
          invoiceQtyData={invoiceData}
        />
      )}
      {isExistingRentalJob && (
        <ExistingRentalJob
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={rentalManagementData}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
          onClose={() => setIsExistingRentalJob(false)}
          onSuccess={() => {
            setIsExistingRentalJob(false);
            fetchRecords();
          }}
        />
      )}
      {showRemoveAssetFromReceivingTicketDialog && (
        <ConfirmationDialog
          open={showRemoveAssetFromReceivingTicketDialog}
          message={`Are you sure you want to revert selected records from Receiving Ticket(s)?`}
          onClose={() => {
            setShowRemoveAssetFromReceivingTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);
            const groupByCalls = groupBy(selectedRecords, 'receivingTicketId');
            let apiCalls = [];
            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) }));
            });
            Promise.all(apiCalls)
              .then(() => {
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: `Selected records removed from assiged Receiving Ticket(s)`
                });
                fetchRecords();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              })
              .finally(() => {
                setOkBtnLoading(false);
                setShowRemoveAssetFromReceivingTicketDialog(false);
              });
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {statusToUpdate.open && (
        <Dialog
          open
          classes={{
            paper: classes.paper
          }}
          onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
        >
          <CustomDialogHeader
            title="Are you sure ?"
            showRequiredLabel={false}
            onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
          />
          <CustomDialogContent>
            <Box className="my-2">
              {[ASSET_STATUS.available, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(statusToUpdate.status) ? (
                <h4>You want to change the status of selected assets to {statusToUpdate.status} ?</h4>
              ) : (
                <TextField
                  id="outlined-multiline-static"
                  label={`Please enter the reason for ${statusToUpdate.status}`}
                  multiline
                  fullWidth
                  rows={4}
                  value={statusToUpdate.message}
                  variant="outlined"
                  onChange={(e) => {
                    setStatusToUpdate((prevState) => ({ ...prevState, message: e.target.value }));
                  }}
                />
              )}
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button size="small" variant="outlined" color="primary" onClick={() => setStatusToUpdate((prevState) => ({ ...prevState, open: false }))}>
              Cancel
            </Button>
            <Button size="small" onClick={handleChangeStatus} disabled={statusToUpdate.isUpdating} variant="contained" color="primary">
              {statusToUpdate.isUpdating ? <CircularProgress style={{ marginRight: '8px' }} size={20} color="inherit" /> : null}
              Change Status
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
      {openDeliveryTicketDialog && (
        <MultipleTicket
          referenceData={rentalManagementData}
          ticketType={[DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return]}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          handleClose={() => {
            setOpenDeliveryTicketDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showRepairJobDialog && (
        <ManageRepairJob
          referenceType="Rental Job"
          referenceData={{
            _id: rentalManagementData._id,
            warehouse: selectedRecords[0].warehouseId,
            wellName: rentalManagementData?.wellName?.optionValue,
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null,
            afeNumber: rentalManagementData?.afeNumber
          }}
          onClose={() => setShowRepairJobDialog(false)}
          onSuccess={(obj) => {
            handleAddAssetToRepairJob(obj?._id);
            setShowRepairJobDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showRepairOrderDialog && (
        <ManageRepairOrder
          referenceType="rentalJob"
          referenceData={{
            _id: rentalManagementData._id,
            warehouse: selectedRecords[0].warehouseId,
            customerAccount: rentalManagementData?.customerAccount?.optionValue,
            customerContact: rentalManagementData?.customerContact?.optionValue
          }}
          onClose={() => setShowRepairOrderDialog(false)}
          onSuccess={(obj) => {
            handleAddAssetsToRepairOrder(obj?._id);
          }}
          isClone={false}
        />
      )}
      {showConformationConsume?.open && (
        <ConsumeProduct
          products={selectedRecords}
          handleClose={() => setShowConformationConsume({ open: false, type: '' })}
          loading={okBtnLoading}
          type={showConformationConsume.type}
          handleSucess={(data) => {
            handleConsumProduct(data);
          }}
        />
      )}
      {showInfo.open && (
        <ShowNonSerializeAssets data={showInfo.data} onClose={() => setShowInfo({ open: false, data: {}, type: null })} title={showInfo?.type} />
      )}
      {showConformationConsumeMultiple && (
        <ConfirmationDialog
          open={showConformationConsumeMultiple}
          message={`Are you sure you want to consumed selected products?`}
          onClose={() => {
            setShowConformationConsumeMultiple(false);
          }}
          onOk={() => {
            handleConsumProduct(null);
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showConformationRevertTicket && (
        <ConfirmationDialog
          open={showConformationRevertTicket}
          message={`Are you sure you want to revert ticket for the selected line item ?`}
          onClose={() => {
            setShowConformationRevertTicket(false);
          }}
          onOk={() => {
            handelRevertTickets();
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showConformationCancleTicket.open && (
        <ConfirmationDialog
          open={showConformationCancleTicket.open}
          message={`This action will cancel the complete Receiving/Return Ticket(s). Are you sure?`}
          onClose={() => {
            setShowConformationCancleTicket({ open: false });
          }}
          onOk={() => {
            handelCancleTickets();
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {openChangeActualDateDialog.open && (
        <ChangeActualDateDialog
          data={openChangeActualDateDialog.data}
          open={openChangeActualDateDialog.open}
          loading={openChangeActualDateDialog.loading}
          onClose={() => {
            setOpenChangeActualDateDialog({ open: false, data: null, loading: false });
          }}
          handleSubmit={handleSubmitChangeDates}
        />
      )}
      {openMessageDialog.open && (
        <CustomMessageDialog
          open={openMessageDialog.open}
          errorMessages={openMessageDialog.errorMessages}
          onClose={() => {
            setOpenMessageDialog({ open: false, errorMessages: [] });
          }}
        />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={(rows) => {
            if (addSerializedAssetDialog.type === 'ReplaceAsset') {
              handleOpenReplaceAssetReason(rows);
            } else {
              handleSwapAssets(rows);
            }
          }}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [], type: '' });
          }}
          referenceType={addSerializedAssetDialog.type}
          referenceData={{
            _id: rentalManagementData?._id,
            warehouse: rentalManagementData?.warehouse?.optionValue
          }}
          isAdding={isSubmitting}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={rentalManagementData?.warehouse}
        />
      )}
      {openDateDialog.open && (
        <DateDialog
          loading={openDateDialog.loading}
          onClose={() => {
            setOpenDateDialog({ open: false, type: null, status: null, prevStatus: '', assets: [], loading: false });
          }}
          handleSubmit={(date, status) => {
            if (
              openDateDialog.type === 'changeStatus' &&
              [ASSET_STATUS.inUse, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable]?.includes(openDateDialog.status)
            ) {
              handleChangeStatusInUse(openDateDialog.status, openDateDialog.prevStatus, date);
            } else if (openDateDialog.type === 'changeStatus' && [ASSET_STATUS.delivered]?.includes(openDateDialog.status)) {
              handelProcessLoadingTickets(date, status);
            } else if (openDateDialog.type === 'changeDate') {
              handleChangeDate(date);
            }
          }}
          type={openDateDialog.type}
          status={openDateDialog.status}
          title={
            openDateDialog.type === 'changeStatus'
              ? openDateDialog.status === ASSET_STATUS.delivered
                ? 'Delivered Date'
                : `Change Status ${openDateDialog.status}`
              : `Change Date ${openDateDialog.status}`
          }
          assets={openDateDialog.assets}
        />
      )}
      {showReplaceReason.open && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceReason({ open: false, data: {} })}
          loading={isSubmitting}
          handleSucess={(data) => {
            handleReplaceAsset(data?.reason);
          }}
        />
      )}
    </>
  );
};

export default ReceivingTicket;

const ActionButtonMenuItems = ({
  selectedRecords,
  setOpenMessageDialog,
  handleTicketDialog,
  setShowRemoveAssetFromReceivingTicketDialog,
  setShowQtyDialog,
  handelProcessLoadingTickets,
  handelProcessTickets,
  isOffline,
  setIsExistingRentalJob,
  setAddSerializedAssetDialog,
  permissions,
  setShowRepairJobDialog,
  setShowRepairOrderDialog,
  setShowConformationRevertTicket,
  setShowConformationCancleTicket,
  setShowConformationConsume,
  setShowConformationConsumeMultiple,
  dataRows,
  user,
  setOpenDateDialog,
  currentStep
}) => {
  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  const checkUniqStatus = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (
      uniq(
        map(
          selectedRecords?.filter((e: any) => e.type === 'Asset'),
          'status'
        )
      ).length === 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  const validateAction = (action) => {
    const errorMessages = [];
    var records = selectedRecords;
    if (action === rentalManagementActions.cancelReceivingReturnTicket) {
      const receivingTicketIds = uniq(map(selectedRecords?.filter((e) => e?.receivingTicketId), 'receivingTicketId'));
      const returnTicketIds = uniq(map(selectedRecords?.filter((e) => e?.returnTicketId), 'returnTicketId'));
      records = [...selectedRecords?.filter((e) => !e?.receivingTicketId && !e?.returnTicketId),
      ...dataRows?.filter((e) => receivingTicketIds?.includes(e?.receivingTicketId)),
      ...dataRows?.filter((e) => returnTicketIds?.includes(e?.returnTicketId))]
    }
    records.forEach((e) => {
      if (action === rentalManagementActions.deliveredToCustomer) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyDelivered });
        }
      } else if (action === rentalManagementActions.replaceAsset) {
        if (e?.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.productsCanNotReplace });
        } else if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingDeliveredForReplace });
        } else if (e?.status !== ASSET_STATUS.inUse || e?.rentalAssetStatus !== ASSET_STATUS.inUse) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlyReplaceInUse });
        }
      } else if (action === rentalManagementActions.createReceivingTicket) {
        if (e?.type !== 'Asset' && (e?.type === 'Product' && !e?.serialized)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingNotProduct });
        } else if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (e?.hasOwnProperty('receivingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyCreated });
        } else if (e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyCreated });
        } else if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        } else if (
          ![
            ASSET_STATUS.inUse,
            ASSET_STATUS.standBy,
            ASSET_STATUS.standByNotChargeable,
            ASSET_STATUS.scrap,
            ASSET_STATUS.needRepair,
            ASSET_STATUS.needRecert,
            ASSET_STATUS.notApplied
          ]?.includes(e?.status)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingNotValidStatus });
        }
      } else if (action === rentalManagementActions.createReturnTicket) {
        if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (e?.hasOwnProperty('receivingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyCreated });
        } else if (e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyCreated });
        } else if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        } else if (
          ![
            ASSET_STATUS.inUse,
            ASSET_STATUS.standBy,
            ASSET_STATUS.standByNotChargeable,
            ASSET_STATUS.scrap,
            ASSET_STATUS.needRepair,
            ASSET_STATUS.needRecert,
            ASSET_STATUS.notApplied
          ]?.includes(e?.status) &&
          !e?.isReplaced
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingNotValidStatus });
        }
      } else if (action === rentalManagementActions.receiveItems) {
        if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (!e?.hasOwnProperty('receivingTicketId') && !e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingOrReturnNotCreated });
        } else if ([e?.receivingTicketStatus].includes(DELIVERY_TICKET_STATUS.delivered)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyDelivered });
        } else if ([e?.returnTicketStatus].includes(DELIVERY_TICKET_STATUS.delivered)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyDelivered });
        }
      } else if (action === rentalManagementActions.createSupplierDeliveryTicket) {
        if (!e?.subleaseAsset) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlySubleaseAsset });
        } else if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (e?.hasOwnProperty('receivingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyCreated });
        } else if (e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyCreated });
        } else if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        }
      } else if (action === rentalManagementActions.cancelInTransitTicket) {
        if (!e.hasOwnProperty('receivingTicketId') && !e.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingReturnNotCreated });
        } else if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.inTransit && e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.inTransit) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.cancelInTransitLineItems });
        }
      } else if (action === rentalManagementActions.cancelReceivingReturnTicket) {
        if (!e.hasOwnProperty('receivingTicketId') && !e.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingReturnNotCreated });
        } else if (
          ![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.receivingTicketStatus) &&
          ![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.returnTicketStatus)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.inTransitDeliveredLoadingTicket });
        } else if (e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered || e?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          if (![ASSET_STATUS.underReview]?.includes(e?.status) && e?.type === 'Asset') {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.statusURForCancelReceiving });
          } else if (![RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return, 'Returned']?.includes(e?.rentalAssetStatus)) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusCompleteCancelReceiving });
          }
        }
      } else if (action === rentalManagementActions.createRepairJob || action === rentalManagementActions.createRepairOrder) {
        if (e.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlyAssetsCanBeRepaired });
        } else if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.delivered && e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingOrReturnNotDelivered });
        } else if (action === rentalManagementActions.createRepairJob && e.subleaseAsset) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.notSubleaseAsset });
        } else if (![ASSET_STATUS.underReview, ASSET_STATUS.scrap, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair].includes(e.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.repairCanForThisAsset });
        } else if (!checkUniqWarehouse()) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.repairSameWarehouse });
        }
      } else if (action === rentalManagementActions.transferToAnotherRental) {
        if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        } else if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (
          ([ASSET_STATUS.inUse].includes(e.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse].includes(e.rentalAssetStatus)) ||
          ([ASSET_STATUS.available, ASSET_STATUS.underReview].includes(e.status) &&
            [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(e.rentalAssetStatus))
        ) {
        } else {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAsset });
        }
      } else if (action === rentalManagementActions.swapInUseAssets) {
        if (e.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlySwapAssets });
        } else if ([ASSET_STATUS.inUse].includes(e.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse].includes(e.rentalAssetStatus)) {
        } else {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlySwapInUseAssets });
        }
      }
    });
    if (action === rentalManagementActions.transferToAnotherRental && errorMessages?.length === 0) {
      if (records?.find((e) => [RENTAL_INTERNAL_ASSET_STATUS.inUse]?.includes(e.rentalAssetStatus))) {
        if (
          records?.filter((e) => [ASSET_STATUS.inUse]?.includes(e.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse]?.includes(e.rentalAssetStatus))
            ?.length !== records?.length
        ) {
          records?.forEach((e) => {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAssetSame });
          });
        }
      } else {
        if (
          records?.filter(
            (e) =>
              [ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(e.status) &&
              [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return]?.includes(e.rentalAssetStatus)
          )?.length !== records?.length
        ) {
          records?.forEach((e) => {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAssetSame });
          });
        }
      }
    }
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  return (
    <>
      {currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep && (
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.deliveredToCustomer)) {
              if (user?.user?.brandPolicy?.assetDeliveredStatus) {
                setOpenDateDialog({
                  open: true,
                  type: 'changeStatus',
                  status: ASSET_STATUS.delivered,
                  prevStatus: ASSET_STATUS.delivered,
                  assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                  loading: false
                });
              } else {
                handelProcessLoadingTickets();
              }
            }
          }}
        >
          Delivered to Customer
        </MenuItem>
      )}
      {currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.assetDeliveredStatus && user?.user?.brandPolicy?.rentalOnFieldStep && (
        <Box>
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                [
                  RENTAL_INTERNAL_ASSET_STATUS.delivered,
                  RENTAL_INTERNAL_ASSET_STATUS.inUse,
                  RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                ].includes(e?.rentalAssetStatus)
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.standBy,
                    prevStatus: selectedRecords[0].status,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change Status to ${ASSET_STATUS.standBy}`}
              </MenuItem>
            )}
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standBy].includes(e?.status) &&
                [RENTAL_INTERNAL_ASSET_STATUS.delivered, RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standBy].includes(
                  e?.rentalAssetStatus
                )
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.standByNotChargeable,
                    prevStatus: selectedRecords[0].status,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change Status to ${ASSET_STATUS.standByNotChargeable}`}
              </MenuItem>
            )}
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                [
                  RENTAL_INTERNAL_ASSET_STATUS.delivered,
                  RENTAL_INTERNAL_ASSET_STATUS.standBy,
                  RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                ].includes(e?.rentalAssetStatus)
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.inUse,
                    prevStatus: selectedRecords[0].status,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change Status to ${ASSET_STATUS.inUse}`}
              </MenuItem>
            )}
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [
                  RENTAL_INTERNAL_ASSET_STATUS.inUse,
                  RENTAL_INTERNAL_ASSET_STATUS.standBy,
                  RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                ].includes(e?.rentalAssetStatus)
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeDate',
                    status: '',
                    prevStatus: '',
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change ${routes.serializedAsset.title} Last Status Date`}
              </MenuItem>
            )}
        </Box>
      )}
      {((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.createReceivingTicket)) {
                  handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant);
                }
              }}
            >
              Create Receiving Ticket (Chargeable)
            </MenuItem>
            {selectedRecords.length &&
              selectedRecords?.filter((f) => f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length ===
              selectedRecords?.length ? (
              <MenuItem
                onClick={() => {
                  setShowRemoveAssetFromReceivingTicketDialog(true);
                }}
              >
                Remove Receiving Ticket
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.createReturnTicket)) {
                  if (selectedRecords?.every((e) => e.type === 'Asset')) {
                    handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant);
                  } else {
                    setShowQtyDialog({ open: true, data: null });
                    handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant, false);
                  }
                }
              }}
            >
              Create Return Ticket (Non-Chargeable)
            </MenuItem>
            {permissions?.sublease?.isRead && (
              <MenuItem
                onClick={() => {
                  if (!validateAction(rentalManagementActions.createSupplierDeliveryTicket)) {
                    handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier);
                  }
                }}
              >
                Create Delivery Ticket for Supplier
              </MenuItem>
            )}
          </>
        )}
      {currentStep === RENTAL_STEPS.receiving && (
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.receiveItems)) {
              handelProcessTickets();
            }
          }}
        >
          {`Receive Items`}
        </MenuItem>
      )}
      {!isOffline && ((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <MenuItem
            onClick={() => {
              if (!validateAction(rentalManagementActions.transferToAnotherRental)) {
                setIsExistingRentalJob(true);
              }
            }}
          >
            {`Transfer to another ${routes.rentalManagement.title}`}
          </MenuItem>
        )}
      {currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep && (
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.replaceAsset)) {
              const products = [];
              selectedRecords?.forEach((element) => {
                const foundProduct = products.filter((e) => e._id === element?.product?.optionValue);
                if (foundProduct.length) {
                  foundProduct[0].qty += 1;
                } else {
                  products.push({
                    _id: element?.product?.optionValue,
                    id: element?.product?.optionValue,
                    productName: element?.product?.optionLabel,
                    qty: 1
                  });
                }
              });
              setAddSerializedAssetDialog({ open: true, products: products, type: 'ReplaceAsset' });
            }
          }}
        >
          Replace Asset
        </MenuItem>
      )}
      {!isOffline && ((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <MenuItem
            onClick={() => {
              if (!validateAction(rentalManagementActions.swapInUseAssets)) {
                const products = [];
                selectedRecords?.forEach((element) => {
                  const foundProduct = products.filter((e) => e._id === element?.product?.optionValue);
                  if (foundProduct.length) {
                    foundProduct[0].qty += 1;
                  } else {
                    products.push({
                      _id: element?.product?.optionValue,
                      id: element?.product?.optionValue,
                      productName: element?.product?.optionLabel,
                      qty: 1
                    });
                  }
                });
                setAddSerializedAssetDialog({ open: true, products: products, type: 'SwapAsset' });
              }
            }}
          >
            {`Swap In-Use Assets`}
          </MenuItem>
        )}
      {permissions?.repairJob?.isCreate && !isOffline && currentStep === RENTAL_STEPS.receiving && (
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.createRepairJob)) {
              setShowRepairJobDialog(true);
            }
          }}
        >
          {`Create ${routes.repairJob.title}`}
        </MenuItem>
      )}
      {permissions?.repairOrder?.isCreate && !isOffline && currentStep === RENTAL_STEPS.receiving && (
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.createRepairOrder)) {
              setShowRepairOrderDialog(true);
            }
          }}
        >
          {`Create ${routes.repairOrder.title}`}
        </MenuItem>
      )}
      {((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.cancelInTransitTicket)) {
                  setShowConformationRevertTicket(true);
                }
              }}
            >
              Cancel Specific Line Items
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.cancelReceivingReturnTicket)) {
                  setShowConformationCancleTicket({ open: true });
                }
              }}
            >
              Cancel Receiving/Return Ticket(s)
            </MenuItem>
          </>
        )}
      {selectedRecords?.filter(
        (f) =>
          f.type === 'Product' &&
          f.hasOwnProperty('loadingTicketId') &&
          f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
          Number(f?.consumeQty) + Number(f?.returnQty) < Number(f?.qty)
      ).length === selectedRecords.length &&
        user?.user?.brandPolicy?.rentalReceivingStepConsume && (
          <MenuItem
            onClick={() => {
              if (selectedRecords?.length === 1) {
                setShowConformationConsume({ open: true, type: 'add' });
              } else {
                setShowConformationConsumeMultiple(true);
              }
            }}
          >
            {RENTAL_INTERNAL_ASSET_STATUS.consumed}
          </MenuItem>
        )}
      {selectedRecords.length === 1 &&
        selectedRecords?.filter(
          (f) =>
            f.type === 'Product' &&
            f.hasOwnProperty('loadingTicketId') &&
            f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
            f?.consumeQty > 0
        ).length === selectedRecords.length &&
        user?.user?.brandPolicy?.rentalReceivingStepConsume && (
          <MenuItem
            onClick={() => {
              setShowConformationConsume({ open: true, type: 'revert' });
            }}
          >
            {`Revert Consumed Qty`}
          </MenuItem>
        )}
    </>
  );
};
