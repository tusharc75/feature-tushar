import { Button, CircularProgress, Dialog, IconButton, Menu, MenuItem, TextField, useMediaQuery } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { makeStyles } from '@material-ui/core/styles';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Edit from '@material-ui/icons/Edit';
import HelpIcon from '@material-ui/icons/HelpOutline';
import InfoIcon from '@material-ui/icons/Info';
import LocalShippingIcon from '@material-ui/icons/LocalShipping';
import { groupBy, isArray, isEmpty, isEqual, isObject, map, uniq, uniqueId } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { actionDisable, rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  INVENTORY_OWNER_TYPE,
  MATERIAL_TYPE,
  RENTAL_INTERNAL_ASSET_STATUS,
  deliveryTicket,
  gridLoadingTimeout,
  rentalManagement,
  serializedAsset,
  sidebarResource
} from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import AddSerializedAsset from '../SerializedAsset/AddSerializedAsset';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import { getRentalDeliveryTicket, getRentalProductAssets, uniqueProduct } from './../rentalOfflineHelper';
import DateDialog from './DateDialog';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { FiExternalLink } from 'react-icons/fi';
import { getParentWellNumber, getUniqueWellNumber } from 'src/components/RentalManagment/helper';
import PreviewDownloadMultiple from '../../../components/DeliveryTicket/PreviewDownloadMultiple';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateDeliveredToCustomer, generateLoadingStepCreateTicketSteps, nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';
import AssetDataDialog from 'src/pages/RentalManagement/LoadingTicket/AssetDataDialog';

const stepGlobalDataAdded = {
  createTicket: false,
  deliverToCustomer: false
};

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

const LoadingTicket = ({
  currentStep,
  rentalManagementData,
  fetchRentalData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  allowedToEdit,
  isProcessor,
  allowUpdateStatus,
  checkProgressiveBilling,
  stepFullScreen,
  rentalPolicyData,
  hideDeliveryTicketDelivered
}) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:600px)');
  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { selectedRecords, dataRows } = state;

  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showRemoveTicketDialog, setShowRemoveTicketDialog] = useState(false);
  const [uniqueLoadingTicket, setUniqueLoadingTicket] = useState([]);
  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);
  const [columnHeader, setColumnHeader] = useState(null);
  const [showInfo, setShowInfo] = useState({ open: false, data: {}, type: null });
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [showConformationRevertTicket, setShowConformationRevertTicket] = useState(false);
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState({ open: false });
  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState(false);

  useEffect(() => {
    fetchRecords();
    getColumn();
    fetchPolicy();
  }, []);

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

  const fetchRecords = async () => {
    setNextStep(false);
    setNextStepToolTip(null);

    try {
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
      var productSerialNumbers: any = [];
      var invoiceData: any = [];
      var consumeProducts: any = [];
      var nonSerializedInventory: any = [];

      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });

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
          rentalAssetStatus: u?.status
        }));

        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);

        const productResponse = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = productResponse.material;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
        productAssets = response?.data?.data;

        productAssets = productAssets
          .map((d) => ({
            ...d.inventory,
            uniqueId: d._id,
            isReplaced: d?.isReplaced,
            replaceReason: d?.replaceReason,
            replaceAsset: d?.replaceAsset?.optionLabel,
            rentalAssetStatus: d?.status,
            startDate: d?.startDate,
            description: d?.product?.productDescription,
            wellNumber: d?.inventory?.wellNumber,
            position: d?.inventory?.position
          }))
          .map((u) => ({
            ...u,
            type: 'Asset',
            displayType: 'Asset',
            qty: 1,
            productName: u?.product?.optionLabel,
            materialId: u?.product?.optionValue,
            warehouse: u?.warehouse?.optionLabel,
            warehouseId: u?.warehouse?.optionValue,
            currentOwner: u?.currentOwner,
            currentLocation: u?.currentLocation?.optionValue,
            startDate: u?.startDate,
            mtrAttachedView: u?.mtrAttached ? 'Yes' : 'No'
          }));

        const result = await axiosInstance().get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
        );
        deliveryTicketList = result?.data?.data;

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = productResponse?.data?.data?.material;
        nonSerializeAsset = productResponse?.data?.data?.nonSerializeAsset;
        consumeProducts = productResponse?.data?.data?.consumeProducts;
        productSerialNumbers = productResponse?.data?.data?.productSerialNumbers;
        nonSerializedInventory = productResponse?.data?.data?.nonSerializedInventory;

        const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData._id}/invoice/material-end-date-qty`);
        invoiceData = invoiceResponse?.data?.data?.material || [];
      }

      const loadingTicketProducts = [];

      deliveryTicketList?.forEach((element) => {
        if (element.ticketType === DELIVERY_TICKET_TYPE.loading && element?.products?.length) {
          element?.products?.forEach((ele) => {
            loadingTicketProducts.push({
              ...ele,
              loadingTicketId: element._id,
              loadingTicket: element?.ticketName,
              loadingTicketStatus: element?.status,
              warehouse: element?.pickupFrom
            });
          });
        }
      });

      products = uniqueProduct(
        material?.filter((e) => e.consumableType !== 'Internal'),
        nonSerializedInventory
      );

      products?.forEach((element) => {
        var qty = element.qty;

        var ticketProduct: any = [];
        if (element?.warehouse) {
          ticketProduct = loadingTicketProducts?.filter(
            (e) => e.uniqueId === element._id && e.product === element.materialId && e?.warehouse?.optionValue === element?.warehouse?.optionValue
          );
        } else {
          ticketProduct = loadingTicketProducts?.filter((e) => e.uniqueId === element._id && e.product === element.materialId);
        }

        ticketProduct?.forEach((ele) => {
          var consumeQty = 0;

          consumeProducts
            ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
            ?.forEach((e) => {
              consumeQty = consumeQty + e.qty;
            });

          const obj: any = {};
          obj._id = element.materialId + '_' + ele.loadingTicketId;
          obj.uniqueId = element?._id;
          obj.materialId = element?.materialId;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.qty = ele.qty;
          obj.description =
            element.type === MATERIAL_TYPE.service
              ? element?.serviceDetail?.serviceDescription || ''
              : element.type === MATERIAL_TYPE.product
                ? element?.productDetail?.productDescription || ''
                : element.type === MATERIAL_TYPE.package
                  ? element?.packageDetail?.packageDescription || ''
                  : '';
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.parentId = element?.parentId;
          obj.warehouse = element?.warehouse ? element?.warehouse?.optionLabel : rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = element?.warehouse ? element?.warehouse?.optionValue : rentalManagementData?.warehouse?.optionValue;
          obj.status =
            element?.productDetail?.hasOwnProperty('serializedProduct') && element?.productDetail?.serializedProduct === true
              ? element?.status
              : 'N/A';
          obj.rentalAssetStatus = element?.status;
          obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
            ? ele.qty === consumeQty
              ? RENTAL_INTERNAL_ASSET_STATUS.consumed
              : consumeQty < ele.qty && consumeQty > 0
                ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
                : element?.status
            : element?.status;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.materialId && e._id === element._id);
          obj.loadingTicket = ele?.loadingTicket;
          obj.loadingTicketId = ele?.loadingTicketId;
          obj.loadingTicketStatus = ele?.loadingTicketStatus;
          obj.startDate = element?.actualStartDate;
          obj.wellNumber = getParentWellNumber(material, element?._id);
          productAssets.push(obj);
          qty = qty - ele.qty;
        });

        if (qty > 0) {
          const obj: any = {};
          obj._id = `${element.materialId}_${productAssets?.length + 1}`;
          obj.materialId = element?.materialId;
          obj.uniqueId = element?._id;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.qty = qty;
          obj.description =
            element.type === MATERIAL_TYPE.service
              ? element?.serviceDetail?.serviceDescription || ''
              : element.type === MATERIAL_TYPE.product
                ? element?.productDetail?.productDescription || ''
                : element.type === MATERIAL_TYPE.package
                  ? element?.packageDetail?.packageDescription || ''
                  : '';
          obj.parentId = element?.parentId;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.warehouse = element?.warehouse ? element?.warehouse?.optionLabel : rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = element?.warehouse ? element?.warehouse?.optionValue : rentalManagementData?.warehouse?.optionValue;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.materialId && e._id === element._id);
          obj.wellNumber = getParentWellNumber(material, element?._id);

          productAssets.push(obj);
        }
      });

      if (productSerialNumbers?.length) {
        material
          ?.filter((e) => e?.productDetail?.serializedProduct && e.type === MATERIAL_TYPE.product)
          .forEach((element) => {
            var qty = productSerialNumbers?.filter((e) => e?._id === element?._id)?.length;
            if (qty) {
              const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId && e.uniqueId === element._id);
              let ticketProductSerialNumbers: any = [];

              ticketProduct?.forEach((ele) => {
                var consumeQty = 0;
                consumeProducts
                  ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
                  ?.forEach((e) => {
                    consumeQty = consumeQty + e.qty;
                  });

                const obj: any = {};
                obj._id = element.materialId + '_' + ele.loadingTicketId;
                obj.materialId = element?.materialId;
                obj.uniqueId = element?._id;
                obj.type = 'Product';
                obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
                obj.qty = ele.qty;
                obj.description =
                  element.type === MATERIAL_TYPE.service
                    ? element?.serviceDetail?.serviceDescription || ''
                    : element.type === MATERIAL_TYPE.product
                      ? element?.productDetail?.productDescription || ''
                      : element.type === MATERIAL_TYPE.package
                        ? element?.packageDetail?.packageDescription || ''
                        : '';
                obj.assetNumber = element?.productDetail?.productName;
                obj.productName = element?.productDetail?.productName;
                obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
                obj.parentId = element?.parentId;
                obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
                obj.status = 'N/A';
                obj.rentalAssetStatus = element?.status;
                obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
                  ? ele.qty === consumeQty
                    ? RENTAL_INTERNAL_ASSET_STATUS.consumed
                    : consumeQty < ele.qty && consumeQty > 0
                      ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
                      : element?.status
                  : element?.status;
                obj.loadingTicket = ele?.loadingTicket;
                obj.loadingTicketId = ele?.loadingTicketId;
                obj.loadingTicketStatus = ele?.loadingTicketStatus;
                obj.startDate = element?.actualStartDate;
                obj.productSerialNumbers = productSerialNumbers
                  ?.filter((e) => e?._id === element?._id && ele?.serialNumber?.includes(e?.productSerialNumberDetail?._id))
                  ?.map((e) => ({ ...e, assetNumber: e?.productSerialNumberDetail?.serialNumber }));
                obj.wellNumber = getParentWellNumber(material, element?._id);

                productAssets.push(obj);
                qty = qty - ele.qty;
                ticketProductSerialNumbers = [...ticketProductSerialNumbers, ...(ele?.serialNumber || [])];
              });

              if (qty > 0) {
                productAssets.push({
                  _id: element.materialId,
                  materialId: element?.materialId,
                  uniqueId: element?._id,
                  type: 'Product',
                  displayType: 'Product (Serialized)',
                  qty: qty,
                  description: element?.productDetail?.productDescription || '',
                  parentId: element?.parentId,
                  assetNumber: element?.productDetail?.productName,
                  productName: element?.productDetail?.productName,
                  warehouse: rentalManagementData?.warehouse?.optionLabel,
                  warehouseId: rentalManagementData?.warehouse?.optionValue,
                  productSerialNumbers: productSerialNumbers
                    ?.filter((e) => e?._id === element?._id && !ticketProductSerialNumbers?.includes(e?.productSerialNumberDetail?._id))
                    ?.map((e) => ({ ...e, assetNumber: e?.productSerialNumberDetail?.serialNumber })),
                  wellNumber: getParentWellNumber(material, element?._id)
                });
              }
            }
          });
      }

      deliveryTicketList.map((obj) => {
        if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
          productAssets.map((d, index) => {
            if (obj?.assets?.some((p) => p?.asset === d?._id && p?.uniqueId === d?.uniqueId)) {
              productAssets[index]['loadingTicket'] = obj?.ticketName;
              productAssets[index]['loadingTicketId'] = obj?._id;
              productAssets[index]['loadingTicketStatus'] = obj?.status;
            }
          });
        }
      });

      productAssets.forEach((d) => {
        if (d.type === 'Asset') {
          const parentId = material?.find((e) => e._id === d.uniqueId)?.parentId;
          if (parentId) {
            const parent = material?.find((e) => e._id === parentId);
            if (parent) {
              d['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
            }
          }
        } else if (d?.parentId) {
          const parent = material?.find((e) => e._id === d?.parentId);
          if (parent) {
            d['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
          }
        }
        d['isChecked'] = false;
        d['hideSelection'] =
          [ASSET_STATUS.repair, ASSET_STATUS.scrap, ASSET_STATUS.lost].includes(d.status) ||
          [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(d.rentalAssetStatus) ||
          d?.manualStatus === ASSET_STATUS.reserved ||
          d?.isReplaced;
        d['isReplaceable'] = true;
        if (invoiceData?.length && invoiceData?.some((e) => isEqual(e._id, d._id))) {
          d['isReplaceable'] = false;
        }
      });

      if (user?.user?.brandPolicy?.rentalOnFieldStep) {
        if (productAssets.filter((e) => e.loadingTicketStatus).length) {
          setNextStep(true);
        } else {
          setNextStepToolTip(rentalManagementMessage.loadingCreateToProceed);
        }
      } else {
        if (
          productAssets.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length > 0 &&
          productAssets?.some((e: any) => e.startDate)
        ) {
          setNextStep(true);
        } else {
          if (productAssets.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length === 0) {
            setNextStepToolTip(rentalManagementMessage.loadingCreatedAndDelivered);
          } else {
            setNextStepToolTip(rentalManagementMessage.changeStatusToInUse);
          }
        }
      }

      setUniqueLoadingTicket([...new Set(productAssets.filter((d) => d.loadingTicketId !== undefined).map((d) => d.loadingTicketId))]);

      productAssets = [...productAssets?.filter((e) => !e.isReplaced), ...productAssets?.filter((e) => e.isReplaced)];

      productAssets?.forEach((e, index) => {
        e.index = index + 1;
      });
      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      addWalkmeData(productAssets);

      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const addWalkmeData = (rows: any[]) => {
    if (rows.length === 0) return;
    const stepDataAdded = {
      createTicket: false,
      deliverToCustomer: false
    };
    const walkmeData = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!stepDataAdded.createTicket && r.hideSelection !== true) {
        stepDataAdded.createTicket = true;
        walkmeData.push(generateLoadingStepCreateTicketSteps(i, r.type === 'Asset' && r.mtrAttached !== true));
        if (walkmeInstance && walkmeInstance.type === 'flow' && !Boolean(r?.loadingTicketId) && !stepGlobalDataAdded.createTicket) {
          stepGlobalDataAdded.createTicket = true;
          walkmeInstance.instance.push(generateLoadingStepCreateTicketSteps(i, r.type === 'Asset' && r.mtrAttached !== true, true).steps);
          walkmeInstance.handleNext();
        }
      }
      if (
        r.hideSelection !== true &&
        !stepDataAdded.deliverToCustomer &&
        !user?.user?.brandPolicy?.rentalOnFieldStep &&
        !hideDeliveryTicketDelivered &&
        !user?.user?.brandPolicy?.assetDeliveredStatus &&
        Boolean(r?.loadingTicketId)
      ) {
        stepDataAdded.deliverToCustomer = true;
        walkmeData.push(generateDeliveredToCustomer(i));
        if (walkmeInstance && walkmeInstance.type === 'flow' && !stepGlobalDataAdded.deliverToCustomer) {
          stepGlobalDataAdded.deliverToCustomer = true;
          const steps = generateDeliveredToCustomer(i).steps;
          steps.push({ ...nextButtonStep, waitForStepInsertion: true });
          walkmeInstance.instance.push(steps);
          walkmeInstance.handleNext();
        }
      }
    }
    setWalkmeData(walkmeData);
  };

  const getColumn = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.product,
          fieldNames: ['productName']
        },
        {
          resource: sidebarResource.serializedAsset,
          fieldNames: ['serialNumber', 'position', 'wellNumber', 'mtrAttached', 'warehouse', 'jobCount']
        }
      ]
    });
    const productFields = data?.find((d) => d.resource === sidebarResource.product);
    const assetFields = data?.find((d) => d.resource === sidebarResource.serializedAsset);

    setCheckMTRValidation(assetFields?.fieldNames?.some((e) => e?.fieldName === 'mtrAttached'));
    setColumnHeader({ productFields, assetFields });
  };

  const findHeader = (resource, fieldName) => {
    const field = resource?.fieldNames?.find((f) => f.fieldName === fieldName);
    return field?.fieldLabel || '';
  };

  const columns: any = [
    {
      accessor: 'index',
      Header: 'Index',
      minWidth: 100,
      width: 100,
      disabled: true,
      Cell: ({ row }) => (
        <div
          className="d-flex align-items-center gap-2"
          style={{
            backgroundColor:
              row?.original?.warehouseId &&
                row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
                !row?.original?.loadingTicketId
                ? COLOUR_MASTER.transferAsset.background
                : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(row?.original?.status)
                  ? COLOUR_MASTER.lostAssets.background
                  : ''
          }}
        >
          <h5 className="text-truncate">{row?.original?.index}</h5>
          {row?.original?.loadingTicketId && (
            <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
              <LocalShippingIcon fontSize="small" color={'primary'} />
            </HtmlTooltip>
          )}
          {row?.original?.warehouseId &&
            row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
            !row?.original?.loadingTicketId && (
              <HtmlTooltip title="Will be shipped from different facility">
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
        <div className="flex items-center gap-2">
          <h5 className="text-truncate" title={row?.original?.assetNumber}>
            {row?.original?.assetNumber}
          </h5>
          <IconButton
            size="small"
            onClick={() => {
              if (row?.original?.type === 'Asset') {
                window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
              } else {
                window.open(`${routes.productDetail.path}/${row?.original?.materialId}`);
              }
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
          {((row?.original?.nonSerializeAsset && row?.original?.nonSerializeAsset?.length > 0) ||
            (row?.original?.productSerialNumbers && row?.original?.productSerialNumbers?.length > 0)) && (
              <Box>
                <HtmlTooltip title={`Serial Numbers`}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowInfo({
                        open: true,
                        data: {
                          productName: row?.original?.productName,
                          data: row?.original?.nonSerializeAsset?.length > 0 ? row?.original?.nonSerializeAsset : row?.original?.productSerialNumbers
                        },
                        type: `Serial Numbers`
                      });
                    }}
                  >
                    <InfoIcon fontSize="small" color={'primary'} />
                  </IconButton>
                </HtmlTooltip>
              </Box>
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
      Cell: ({ row }) => (row?.original?.parentName ? <h5 className="text-truncate">{row?.original?.parentName}</h5> : <NoDataCell />)
    },
    {
      accessor: 'loadingTicket',
      Header: 'Loading Ticket',
      Cell: ({ row }) =>
        row?.original?.loadingTicket ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'qty',
      Header: 'Qty',
      disabled: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
    },
    ...(findHeader(columnHeader?.assetFields, 'serialNumber')
      ? [
        {
          accessor: 'serialNumber',
          Header: findHeader(columnHeader?.assetFields, 'serialNumber'),
          Cell: ({ row }) => (row?.original?.serialNumber ? <h5 className="text-truncate">{row?.original?.serialNumber}</h5> : <NoDataCell />)
        }
      ]
      : []),
    ...(findHeader(columnHeader?.assetFields, 'position')
      ? [
        {
          accessor: 'position',
          Header: findHeader(columnHeader?.assetFields, 'position'),
          Cell: ({ row }) => (row?.original?.position ? <h5 className="text-truncate">{row?.original?.position}</h5> : <NoDataCell />)
        }
      ]
      : []),
    ...(findHeader(columnHeader?.assetFields, 'jobCount')
      ? [
        {
          accessor: 'jobCount',
          Header: findHeader(columnHeader?.assetFields, 'jobCount'),
          Cell: ({ row }) => (row?.original?.jobCount ? <h5 className="text-truncate">{row?.original?.jobCount}</h5> : <NoDataCell />)
        }
      ]
      : []),
    {
      accessor: 'productName',
      Header: findHeader(columnHeader?.productFields, 'productName'),
      Cell: ({ row }) =>
        row?.original?.productName ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row?.original?.productName}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.productDetail.path}/${row?.original?.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
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
      Header: findHeader(columnHeader?.assetFields, 'warehouse') || 'Plant',
      Cell: ({ row }) =>
        row?.original?.warehouse ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row?.original?.warehouse}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'rentalAssetStatus',
      Header: 'Rental Asset Status',
      Cell: ({ row }) => (row?.original?.rentalAssetStatus ? <h5 className="text-truncate">{row?.original?.rentalAssetStatus}</h5> : <NoDataCell />)
    },
    {
      accessor: 'status',
      Header: 'Asset Status',
      Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
    },
    ...(findHeader(columnHeader?.assetFields, 'wellNumber')
      ? [
        {
          accessor: 'wellNumber',
          Header: findHeader(columnHeader?.assetFields, 'wellNumber'),
          accessorFn: (original) => {
            return isArray(original?.wellNumber)
              ? original?.wellNumber[0]?.optionLabel
              : isObject(original?.wellNumber)
                ? original?.wellNumber?.optionLabel
                : original?.wellNumber;
          },
          Cell: ({ row }) => (
            <DropdownCell
              permissions={permissions}
              permissionForLinks={{}}
              field={{
                fieldName: 'wellNumber',
                lookupResource: sidebarResource.wellNumber
              }}
              original={row?.original}
            />
          )
        }
      ]
      : [])
  ];

  if (findHeader(columnHeader?.assetFields, 'mtrAttached')) {
    columns.push({
      accessor: 'mtrAttachedView',
      Header: 'MTR Attached',
      Cell: ({ row }) => (row?.original?.mtrAttachedView ? <h5 className="text-truncate">{row?.original?.mtrAttachedView}</h5> : <NoDataCell />)
    });
  }

  columns.push({
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) =>
      user?.user?.brandPolicy?.assetDeliveredStatus &&
        [RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standBy, RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable]?.includes(
          row?.original?.rentalAssetStatus
        ) &&
        row?.original?.type === 'Asset' ? (
        <HtmlTooltip title={`Change ${routes.serializedAsset.title} Last Status Date`}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setOpenDateDialog({
                open: true,
                type: 'changeDate',
                status: row?.original?.assetNumber,
                prevStatus: '',
                assets: [row?.original?._id],
                loading: false
              });
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      ) : (
        ''
      )
  });

  const handleDeliveryTicketDialog = () => {
    if (selectedRecords.length) {
      const data = {};
      data['ticketName'] = rentalManagementData.rentalJobName;
      data['referenceId'] = rentalManagementData._id;

      if (selectedRecords[0].warehouseId) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
        data['pickupFrom'] = selectedRecords[0].warehouseId;
        data['pickupFromAddress'] = selectedRecords[0].currentLocation;
      } else if (selectedRecords[0].currentOwnerType === INVENTORY_OWNER_TYPE.customerAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
        data['pickupFrom'] = selectedRecords[0].currentOwner;
        data['pickupFromAddress'] = selectedRecords[0].currentLocation;
      } else if (selectedRecords[0].currentOwnerType === INVENTORY_OWNER_TYPE.supplierAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.supplier;
        data['pickupFrom'] = selectedRecords[0].currentOwner;
        data['pickupFromAddress'] = selectedRecords[0].currentLocation;
      }

      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = rentalManagementData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = rentalManagementData.shippingAddress?.optionValue;

      data['startDate'] = rentalManagementData?.estimateStartDate;
      data['endDate'] = rentalManagementData?.estimateStartDate;
      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;

      if (rentalManagementData?.padName?.optionValue) {
        data['padName'] = rentalManagementData?.padName?.optionValue;
      }
      if (rentalManagementData?.wellName?.optionValue) {
        data['wellName'] = rentalManagementData?.wellName?.optionValue;
      }

      if (selectedRecords?.find((e) => !isEmpty(e?.wellNumber))) {
        data['wellNumber'] = getUniqueWellNumber(selectedRecords);
      } else if (rentalManagementData?.wellNumber) {
        if (rentalManagementData?.wellNumber?.optionValue) {
          data['wellNumber'] = rentalManagementData?.wellNumber?.optionValue;
        } else {
          data['wellNumber'] = rentalManagementData?.wellNumber?.map((e) => e?.optionValue);
        }
      }

      if (rentalManagementData?.afeNumber) {
        data['afeNumber'] = rentalManagementData?.afeNumber;
      }
      if (rentalManagementData?.processor?.optionValue) {
        data['processor'] = rentalManagementData?.processor?.optionValue;
      }
      setShowTicketDialog({ open: true, data: data });
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
    setReplaceLoading(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] });
        setAddSerializedAssetDialog({ open: false, products: [] });
        setReplaceLoading(false);
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

  const handelProcessTickets = (date = new Date(), status = null) => {
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

  const handelRevertTickets = () => {
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      let data = [];
      loadingTicketIds?.forEach((loadingTicketId) => {
        const ele: any = {};
        ele._id = loadingTicketId;
        ele.products = selectedRecords?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === 'Product')?.map((e) => e.materialId);
        ele.assets = selectedRecords?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === 'Asset')?.map((e) => e._id);
        data.push(ele);
      });
      axiosInstance()
        .put(`${deliveryTicket.api}/revert-partially`, data)
        .then(({ data: { data } }) => {
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Reverted Successfully`
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelCancleTickets = async () => {
    setOkBtnLoading(true);
    try {
      const inTransitloadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'loadingTicketId'
        )
      );
      if (inTransitloadingTicketIds?.length) {
        await axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: inTransitloadingTicketIds });
      }
      const deliveredloadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'loadingTicketId'
        )
      );
      if (deliveredloadingTicketIds?.length) {
        await axiosInstance().post(`${deliveryTicket.api}/cancel-delivered-ticket`, { _ids: deliveredloadingTicketIds });
      }
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Cancelled Successfully`
      });
      setOkBtnLoading(false);
      setShowConformationCancleTicket({ open: false });
      fetchRecords();
    } catch (error) {
      setOkBtnLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleChangeStatusInUse = (status, prevStatus, date) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    const assets = selectedRecords
      ?.filter((e: any) => e.type === 'Asset')
      ?.map((e) => {
        return { asset: e._id, uniqueId: e.uniqueId };
      });
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

  const validateAction = (action) => {
    const errorMessages = [];
    var records = [...selectedRecords];
    if (action === rentalManagementActions.cancelLoadingTicket) {
      const loadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.loadingTicketId),
          'loadingTicketId'
        )
      );
      records = [...selectedRecords?.filter((e) => !e?.loadingTicketId), ...dataRows?.filter((e) => loadingTicketIds?.includes(e?.loadingTicketId))];
    }
    records?.forEach((e) => {
      if (action === rentalManagementActions.createLoadingTicket) {
        if (e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyCreated });
        } else if (
          e.type === 'Asset' &&
          (![ASSET_STATUS.reserved, ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(e?.status) ||
            e?.rentalAssetStatus !== RENTAL_INTERNAL_ASSET_STATUS.reserved)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingReservedAssetStatus });
        } else if (uniq(map(records, 'warehouseId')).length !== 1) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.repairSameWarehouse });
        }
      } else if (action === rentalManagementActions.deliveredToCustomer) {
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
      } else if (action === rentalManagementActions.cancelInTransitLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.inTransit) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.cancelInTransitLineItems });
        }
      } else if (action === rentalManagementActions.cancelLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.loadingTicketStatus)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.inTransitDeliveredLoadingTicket });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          if (
            e?.type === 'Asset' &&
            ![
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable,
              RENTAL_INTERNAL_ASSET_STATUS.delivered
            ]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusInUseCancelLoading });
          } else if (
            e?.type === 'Asset' &&
            ![
              ASSET_STATUS.needRepair,
              ASSET_STATUS.needRecert,
              ASSET_STATUS.inUse,
              ASSET_STATUS.standBy,
              ASSET_STATUS.standByNotChargeable,
              ASSET_STATUS.delivered
            ]?.includes(e?.status)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.statusInUseCancelLoading });
          } else if (
            e?.type === 'Product' &&
            [RENTAL_INTERNAL_ASSET_STATUS.consumed, RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalProductConsumed });
          } else if (
            e?.type === 'Product' &&
            ![
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable,
              RENTAL_INTERNAL_ASSET_STATUS.delivered
            ]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusInUseCancelLoading });
          }
        }
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  const rightSideContents = () => {
    return (
      <>
        <span>
          <PreviewDownloadMultiple referenceIds={uniqueLoadingTicket} />
        </span>
        {allowedToEdit && !rentalPolicyData?.hideAssetChangeStatus && (
          <Button
            variant={'outlined'}
            color="primary"
            aria-controls="simple-menu"
            aria-haspopup="true"
            disabled={
              !allowUpdateStatus ||
              selectedRecords.length === 0 ||
              selectedRecords?.some((f) => f.type === 'Product') ||
              isOffline ||
              selectedRecords?.some((f) =>
                [
                  ASSET_STATUS.lost,
                  ASSET_STATUS.delivered,
                  ASSET_STATUS.inUse,
                  ASSET_STATUS.standBy,
                  ASSET_STATUS.standByNotChargeable,
                  ASSET_STATUS.inTransit,
                  ASSET_STATUS.inRepair,
                  ASSET_STATUS.scrapRequested
                ].includes(f.status)
              )
            }
            size="small"
            onClick={handleClick}
            endIcon={<ArrowDropDownIcon />}
          >
            Change Status
          </Button>
        )}
        {(allowedToEdit || isProcessor) && (
          <>
            {selectedRecords.length &&
              selectedRecords?.filter((f) => f.hasOwnProperty('loadingTicketId') && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length ===
              selectedRecords?.length ? (
              <HtmlTooltip title="Remove Assets From Loading Ticket(s)">
                <Button
                  onClick={() => {
                    setShowRemoveTicketDialog(true);
                  }}
                  variant={isMobile ? 'text' : 'outlined'}
                  color="primary"
                  size="small"
                  style={isMobile ? { color: 'var(--danger-light)' } : {}}
                  disabled={selectedRecords.length === 0 || currentStep === 4 || selectedRecords.some((f) => !f.hasOwnProperty('loadingTicketId'))}
                >
                  {isMobile ? <IoRemoveCircleOutline size={22} /> : 'Remove Loading Ticket'}
                </Button>
              </HtmlTooltip>
            ) : null}
            {showProcessDeliveryTicket && !isOffline && (
              <HtmlTooltip title="Process Multiple Loading Ticket(s)">
                <Button
                  onClick={() => {
                    setOpenDeliveryTicketDialog(true);
                  }}
                  variant={isMobile ? 'text' : 'contained'}
                  color="primary"
                  size="small"
                >
                  {isMobile ? <AddBoxRoundedIcon /> : 'Process Loading Ticket'}
                </Button>
              </HtmlTooltip>
            )}
          </>
        )}
      </>
    );
  };

  const handleAssetData = (assetsData) => {
    const assetsAdd: any = [];
    selectedRecords.forEach((r) => {
      const obj: any = {};
      obj._id = r?.uniqueId;
      obj.asset = r?._id;
      const matchedAsset = assetsData?.find((asset) => asset._id === obj.asset);
      if (matchedAsset) {
        const { _id, ...assetData } = matchedAsset;
        obj.assetData = assetData;
      }
      assetsAdd.push(obj);
    });
    setReplaceLoading(true)
    axiosInstance().put(`${rentalManagement.api}/${rentalManagementData._id}/change-asset-data`, assetsAdd)
      .then(({ data }) => {
        fetchRecords();
        setReplaceLoading(false)
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenAssetDataDialog(false)
      })
      .catch((error) => {
        setReplaceLoading(false)
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={allowedToEdit || isProcessor}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              validateAction,
              checkMTRValidation,
              selectedRecords,
              setMtrConfirmBox,
              handleDeliveryTicketDialog,
              user,
              setOpenDateDialog,
              handelProcessTickets,
              setAddSerializedAssetDialog,
              setShowConformationRevertTicket,
              setShowConformationCancleTicket,
              hideDeliveryTicketDelivered,
              permissions,
              assetPolicyData,
              setOpenAssetDataDialog
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
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
      </Menu>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          assets={selectedRecords?.filter((e) => e.type === 'Asset')}
          products={selectedRecords
            ?.filter((e) => e.type === 'Product')
            ?.map((e) => {
              return { ...e, _id: e.materialId };
            })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
            fetchRentalData();
            if (hideDeliveryTicketDelivered) {
              checkProgressiveBilling();
            }
          }}
        />
      )}
      {showRemoveTicketDialog && (
        <ConfirmationDialog
          open={showRemoveTicketDialog}
          message={`Are you sure you want to remove selected records from Loading Ticket?`}
          onClose={() => {
            setShowRemoveTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);

            const groupByCalls = groupBy(selectedRecords, 'loadingTicketId');
            let apiCalls = [];

            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) }));
            });

            Promise.all(apiCalls)
              .then(() => {
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)`
                });
                fetchRecords();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              })
              .finally(() => {
                setOkBtnLoading(false);
                setShowRemoveTicketDialog(false);
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
              {statusToUpdate.status === 'Repair' ? (
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
            <Button
              size="small"
              onClick={() => {
                setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: true }));
                axiosInstance()
                  .put(`${serializedAsset.api}/update-status`, {
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
                    toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
                    setStatusToUpdate({ open: false, isUpdating: false, status: '', message: '' });
                    fetchRecords();
                  })
                  .catch((error) => {
                    setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false }));
                    toastConfig.setToastConfig(error);
                  });
              }}
              disabled={statusToUpdate.isUpdating}
              variant="contained"
              color="primary"
            >
              {statusToUpdate.isUpdating ? <CircularProgress style={{ marginRight: '8px' }} size={20} color="inherit" /> : null}
              Change Status
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
      {openDeliveryTicketDialog && (
        <MultipleTicket
          referenceData={rentalManagementData}
          ticketType={[DELIVERY_TICKET_TYPE.loading]}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          handleClose={() => {
            setOpenDeliveryTicketDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showInfo.open && (
        <ShowNonSerializeAssets data={showInfo.data} onClose={() => setShowInfo({ open: false, data: {}, type: null })} title={showInfo.type} />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleOpenReplaceAssetReason}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [] });
          }}
          referenceType={'ReplaceAsset'}
          replaceAssets={true}
          referenceData={{
            _id: rentalManagementData?._id,
            warehouse: rentalManagementData?.warehouse?.optionValue
          }}
          isAdding={replaceLoading}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={rentalManagementData?.warehouse}
        />
      )}
      {showReplaceReason.open && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceReason({ open: false, data: {} })}
          loading={replaceLoading}
          handleSucess={(data) => {
            handleReplaceAsset(data?.reason);
          }}
        />
      )}
      {showConformationRevertTicket && (
        <ConfirmationDialog
          open={showConformationRevertTicket}
          message={`Are you sure you want to revert loading ticket for the selected line item ?`}
          onClose={() => {
            setShowConformationRevertTicket(false);
          }}
          onOk={() => {
            handelRevertTickets();
            setShowConformationRevertTicket(false);
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showConformationCancleTicket.open && (
        <ConfirmationDialog
          open={showConformationCancleTicket.open}
          message={`This action will cancel the complete Loading Ticket(s). Are you sure?`}
          onClose={() => {
            setShowConformationCancleTicket({ open: false });
          }}
          onOk={() => {
            handelCancleTickets();
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {mtrConfirmBox && (
        <ConfirmationDialog
          open={mtrConfirmBox}
          message={`MTR(s) missing for some or all line items.`}
          onClose={() => {
            setMtrConfirmBox(false);
          }}
          onOk={() => {
            handleDeliveryTicketDialog();
            setMtrConfirmBox(false);
          }}
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
              handelProcessTickets(date, status);
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
      {openAssetDataDialog && (
        <AssetDataDialog
          onClose={() => {
            setOpenAssetDataDialog(false);
          }}
          statusPolicy={assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved)}
          staticLookUpFilters={{
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null
          }}
          ids={selectedRecords?.map((r) => r?._id)}
          onSuccess={handleAssetData}
          loading={replaceLoading}
        />
      )}
    </>
  );
};

export default LoadingTicket;

const ActionButtonMenuItems = ({
  validateAction,
  checkMTRValidation,
  selectedRecords,
  setMtrConfirmBox,
  handleDeliveryTicketDialog,
  user,
  setOpenDateDialog,
  handelProcessTickets,
  setAddSerializedAssetDialog,
  setShowConformationRevertTicket,
  setShowConformationCancleTicket,
  hideDeliveryTicketDelivered,
  permissions,
  assetPolicyData,
  setOpenAssetDataDialog
}) => {
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

  return (
    <>
      <HtmlTooltip title={!permissions?.deliveryTicket?.isCreate ? actionDisable : ''}>
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.createLoadingTicket)) {
              if (checkMTRValidation && selectedRecords?.some((e) => e.type === 'Asset' && e.mtrAttached !== true)) {
                setMtrConfirmBox(true);
              } else {
                handleDeliveryTicketDialog();
              }
            }
          }}
          id={'create-loding-ticket-menu-item'}
          disabled={!permissions?.deliveryTicket?.isCreate || selectedRecords.length === 0}
        >
          Create Loading Ticket
        </MenuItem>
      </HtmlTooltip>

      {user?.user?.brandPolicy?.rentalOnFieldStep || hideDeliveryTicketDelivered ? null : (
        <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
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
                  handelProcessTickets();
                }
              }
            }}
            id={'delivered-to-customer-menu-item'}
            disabled={!permissions?.deliveryTicket?.isUpdate}
          >
            Delivered to Customer
          </MenuItem>
        </HtmlTooltip>
      )}
      {user?.user?.brandPolicy?.assetDeliveredStatus &&
        (user?.user?.brandPolicy?.rentalOnFieldStep ? null : (
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
                  id={'change-status-to-standby-menu-item'}
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
                  id={'change-status-to-standby-not-chargeable-menu-item'}
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
                  id={'change-status-to-inuse-menu-item'}
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
                  id={'change-serialized-asset-last-status-date-menu-item'}
                >
                  {`Change ${routes.serializedAsset.title} Last Status Date`}
                </MenuItem>
              )}
          </Box>
        ))}
      {user?.user?.brandPolicy?.rentalOnFieldStep ? null : (
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
              setAddSerializedAssetDialog({ open: true, products: products });
            }
          }}
          id={'last-status-menu-item'}
        >
          Replace Asset
        </MenuItem>
      )}
      {!hideDeliveryTicketDelivered && (
        <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
          <MenuItem
            onClick={() => {
              if (!validateAction(rentalManagementActions.cancelInTransitLoadingTicket)) {
                setShowConformationRevertTicket(true);
              }
            }}
            id={'cancel-specific-line-item-menu-item'}
            disabled={!permissions?.deliveryTicket?.isUpdate}
          >
            Cancel Specific Line Items
          </MenuItem>
        </HtmlTooltip>
      )}
      <HtmlTooltip title={!permissions?.deliveryTicket?.isDelete ? actionDisable : ''}>
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.cancelLoadingTicket)) {
              setShowConformationCancleTicket({ open: true });
            }
          }}
          id={'cancel-loading-ticket-menu-item'}
          disabled={!permissions?.deliveryTicket?.isDelete}
        >
          Cancel Loading Ticket(s)
        </MenuItem>
      </HtmlTooltip>
      {assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved) &&
        selectedRecords?.length > 0 && selectedRecords?.every((r) => r?.type === 'Asset' &&
          [
            RENTAL_INTERNAL_ASSET_STATUS.reserved,
            RENTAL_INTERNAL_ASSET_STATUS.inUse,
            RENTAL_INTERNAL_ASSET_STATUS.standBy,
            RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
          ]?.includes(r?.rentalAssetStatus)
        ) && (
          <MenuItem
            onClick={() => {
              setOpenAssetDataDialog(true);
            }}
            id={'change-asset-data-menu-item'}
          >
            Change Assets Data
          </MenuItem>
        )}
    </>
  );
};
