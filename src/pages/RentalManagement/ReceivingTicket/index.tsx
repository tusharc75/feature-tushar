import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { Link } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, Tooltip, IconButton, Menu, MenuItem, Dialog, TextField, CircularProgress } from '@material-ui/core';
import { AiFillFilePdf } from 'react-icons/ai';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  gridLoadingTimeout,
  deliveryTicket,
  rentalManagement,
  serializedAsset as productInventoryHelperObject,
  ASSET_STATUS,
  DELIVERY_TICKET_STATUS,
  RENTAL_INTERNAL_ASSET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  repairJob,
  DELIVERY_FROM_TO_TYPE,
  COLOUR_MASTER,
  REPAIR_JOB_STATUS,
  repairOrder,
  sidebarResource,
  dateFormat
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { makeStyles } from '@material-ui/core/styles';
import { isMobile, isTablet } from 'react-device-detect';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { getRentalProductAssets, getRentalDeliveryTicket, uniqueProduct } from './../rentalOfflineHelper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import ManageRepairJob from '../../RepairJob/ManageRepairJob';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import InfoIcon from '@material-ui/icons/Info';
import HelpIcon from '@material-ui/icons/HelpOutline';
import { ExpandMore } from '@material-ui/icons';
import ExistingRentalJob from './ExistingRentalJob';
import { groupBy, uniq, map, filter } from 'lodash';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import ConsumeProduct from '../../../components/RentalManagment/ConsumeProduct';
import { useData } from '../../../StateProvider/Provider';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';
import ReturnTicketDialog from './ReturnTicketDialog';
import Edit from '@material-ui/icons/Edit';
import ChangeActualDateDialog from './ChangeActualDateDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { MdHandyman, MdHomeRepairService } from 'react-icons/md';
import CustomMessageDialog from 'src/components/MessageDialog';
import { rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
import moment from 'moment';

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
  stepFullScreen
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;

  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);
  const [showConformationConsume, setShowConformationConsume] = useState({ open: false, type: 'add' });
  const [showConformationConsumeMultiple, setShowConformationConsumeMultiple] = useState(false);
  const [showConformationRevertTicket, setShowConformationRevertTicket] = useState(false);
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState({ open: false, type: null });
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showQtyDialog, setShowQtyDialog] = useState({ open: false, data: null });
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: '', data: {} });
  const { isOffline } = useContext(CustomOfflineContext);
  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [showRepairOrderDialog, setShowRepairOrderDialog] = useState(false);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [isExistingRentalJob, setIsExistingRentalJob] = useState(false);
  const [uniqueReceivingTicket, setUniqueReceivingTicket] = useState([]);
  const [showNonSerializeAsset, setShowNonSerializeAsset] = useState({ open: false, data: {} });
  const [seletedProducts, setSeletedProducts] = useState([]);
  const [columnHeader, setColumnHeader] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, data: null, loading: false });
  const [anchorLinkActionEl, setAnchorLinkActionEl] = useState(null);
  const [repairJobCount, setRepairJobCount] = useState(0);
  const [repairOrderCount, setRepairOrderCount] = useState(0);
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
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
  }, []);

  const OpenInNewWindow = (url) => {
    window.open(`${url}?referenceType=${rentalManagementData?.rentalJobName}&referenceId=${rentalManagementData?._id}`, '_blank');
  };

  const fetchRecords = async () => {
    setLoadingData(true);
    try {
      setNextStep(false);
      setNextStepToolTip(null);

      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });

      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
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
        productAssets = productAssets.map((d) => {
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
      });

      products = uniqueProduct(material?.filter((e) => e.consumableType !== 'Internal'));
      products?.forEach((element) => {
        var qty = element.qty;
        var consumeQty = 0;
        consumeProducts
          ?.filter((e) => e.product === element.materialId)
          ?.forEach((e) => {
            consumeQty = consumeQty + e.qty;
          });
        const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId);
        ticketProduct?.forEach((ele) => {
          const returnTicket = returnTicketProducts?.find((e) => e.qty <= ele.qty && e.product === element.materialId && !e.isCount);

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
              ? 'Consumed'
              : consumeQty < ele.qty && consumeQty > 0
                ? 'Partially Consumed'
                : ele.qty === (returnTicket?.qty || 0)
                  ? 'Returned'
                  : ''
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
          obj.consumeQty = consumeQty;
          obj.returnQty = 0;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
          obj.status = element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
          obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
            ? qty === consumeQty
              ? 'Consumed'
              : consumeQty < qty && consumeQty > 0
                ? 'Partially Consumed'
                : ''
            : element?.status;
          obj.currentLocation =
            element?.currentLocation?.optionValue ||
            rentalManagementData?.shippingAddress?.optionValue ||
            rentalManagementData?.billingAddress?.optionValue;

          productAssets.push(obj);
        }
      });

      // if (deliveryTicketList.length) {
      //   if (deliveryTicketList.filter((e) => [DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return].includes(e.ticketType) &&
      //     [DELIVERY_TICKET_STATUS.new, DELIVERY_TICKET_STATUS.indTransit].includes(e.status)).length) {
      //     setShowProcessDeliveryTicket(true)
      //   }
      //   else {
      //     setShowProcessDeliveryTicket(false)
      //   }
      // }

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
        d['isAllowedStartDate'] = d?.manualStartDate && !invoiceMaterial ? true : false;
        d['isAllowedEndDate'] = d?.manualEndDate ? true : false;
        if (d['isAllowedEndDate'] && invoiceMaterial) {
          d['minEndDate'] = new Date(invoiceMaterial?.endDate);
        }
      });

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

      setUniqueReceivingTicket([...new Set(productAssets.filter((d) => d.receivingTicketId !== undefined).map((d) => d.receivingTicketId))]);

      productAssets = [...productAssets?.filter((e) => !e.isReplaced), ...productAssets?.filter((e) => e.isReplaced)];

      productAssets?.forEach((e, index) => {
        e.index = index + 1;
      });

      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
      setLoadingData(false);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
      setLoadingData(false);
    }
  };

  const getColumn = async () => {
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
    const productFields = data?.find((d) => d.resource === 'Product');
    const assetFields = data?.find((d) => d.resource === 'Serialized Asset');
    setColumnHeader({ productFields, assetFields });
  };

  const findHeader = (resource, fieldName) => {
    const field = resource?.fieldNames?.find((f) => f.fieldName === fieldName);
    return field?.fieldLabel || '';
  };

  const columns = [
    {
      accessor: 'index',
      Header: 'Index',
      minWidth: 100,
      width: 100,
      disabled: true,
      Cell: ({ row }) => (row?.original?.index ? <h5 className="text-truncate">{row?.original?.index}</h5> : <NoDataCell />)
    },
    {
      accessor: 'assetNumber',
      Header: 'Details',
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
          {row?.original?.warehouseId && row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue && (
            <HtmlTooltip title="This asset will be shipped from different facility">
              <IconButton size="small">
                <HelpIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          {row?.original?.nonSerializeAsset && row?.original?.nonSerializeAsset?.length > 0 && (
            <HtmlTooltip title={`Non-${routes.serializedAsset.title}`}>
              <IconButton
                size="small"
                onClick={() => {
                  setShowNonSerializeAsset({
                    open: true,
                    data: { productName: row?.original?.productName, nonSerializeAsset: row?.original?.nonSerializeAsset }
                  });
                }}
              >
                <InfoIcon fontSize="small" color={'primary'} />
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
    {
      accessor: 'serialNumber',
      Header: findHeader(columnHeader?.assetFields, 'serialNumber'),
      Cell: ({ row }) => (row?.original?.serialNumber ? <h5 className="text-truncate">{row?.original?.serialNumber}</h5> : <NoDataCell />)
    },
    {
      accessor: 'productName',
      Header: findHeader(columnHeader?.productFields, 'productName'),
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
    },
    {
      accessor: 'consumeQty',
      Header: 'Consumed Qty',
      Cell: ({ row }) => (row?.original?.consumeQty ? <h5 className="text-truncate">{row?.original?.consumeQty}</h5> : <NoDataCell />)
    },
    {
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
              row?.original?.isAllowedStartDate === false && row?.original?.isAllowedEndDate === false
                ? `Invoice Created - Cannot change Start Date`
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
                  setOpenDateDialog({ ...openDateDialog, open: true, data: row?.original });
                }}
              >
                <Edit fontSize="small" color={row?.original?.isAllowedStartDate || row?.original?.isAllowedEndDate ? 'primary' : 'inherit'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : null
    }
  ];

  const handleTicketDialog = (ticketType, deliveryToType, open = true) => {
    const data = {};
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
    data['status'] = DELIVERY_TICKET_STATUS.indTransit;

    setShowTicketDialog({ open: open, ticketType: ticketType, data: data });
    closeActions();
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
      type: 'serializedAsset',
      unit: '',
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

  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return true;
    } else {
      return false;
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

  const handelCancelDeliveredTicket = () => {
    setOkBtnLoading(true);
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
      let data = {};
      data['_ids'] = ticketIds;
      axiosInstance()
        .post(`${deliveryTicket.api}/cancel-delivered-ticket`, data)
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationCancleTicket({ open: false, type: '' });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Cancelled Successfully`
          });
          fetchRecords();
          fetchRentalData();
        })
        .catch((error) => {
          setOkBtnLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleConsumProduct = (data) => {
    const products = [];
    if (data) {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, qty: parseInt(data.qty) });
      });
    } else {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, qty: parseInt(e.qty) });
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
    const receivingTicketIds = uniq(map(selectedRecords?.filter((e) => e?.receivingTicketId), 'receivingTicketId'));
    const returnTicketIds = uniq(map(selectedRecords?.filter((e) => e?.returnTicketId), 'returnTicketId'));
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

  const handelCancleTickets = () => {
    setOkBtnLoading(true);
    const receivingTicketIds = uniq(map(selectedRecords?.filter((e) => e?.receivingTicketId), 'receivingTicketId'));
    const returnTicketIds = uniq(map(selectedRecords?.filter((e) => e?.returnTicketId), 'returnTicketId'));
    if (receivingTicketIds.length || returnTicketIds.length) {
      axiosInstance()
        .put(`${deliveryTicket.api}/revert`, { ids: [...receivingTicketIds, ...returnTicketIds] })
        .then(({ data: { data } }) => {
          setOkBtnLoading(false);
          setShowConformationCancleTicket({ open: false, type: '' });
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Cancelled Successfully`
          });
        })
        .catch((error) => {
          setOkBtnLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  useEffect(() => {
    const product = selectedRecords?.filter((e) => e.type === 'Product');
    if (product.length) {
      const result: any = [];
      product?.forEach((ele) => {
        if (result.filter((e) => e._id === ele.materialId).length) {
          result.forEach((element) => {
            if (element._id === ele.materialId) {
              element.qty += ele.qty;
            }
          });
        } else {
          result.push({ _id: ele.materialId, qty: ele.qty });
        }
      });
      setSeletedProducts(result);
    } else {
      setSeletedProducts([]);
    }
  }, [selectedRecords]);

  const handleSubmitChangeDates = (values) => {
    if (!openDateDialog.data) return;
    setOpenDateDialog({ ...openDateDialog, loading: true });
    const data: any = {
      _id: openDateDialog?.data?.uniqueId,
      asset: openDateDialog?.data?._id?.split('_')[0]
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
        setOpenDateDialog({ open: false, data: null, loading: false });
        fetchRecords();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setOpenDateDialog({ open: false, data: null, loading: false });
      });
  };

  const validateAction = (action) => {
    const errorMessages = [];
    selectedRecords.forEach((e) => {
      if (action === rentalManagementActions.createReceivingTicket) {
        if (e?.type !== 'Asset') {
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
        } else if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.indTransit &&
          e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.indTransit) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.cancelInTransitLineItems });
        }
      } else if (action === rentalManagementActions.cancelDeliveredTicket) {
        if (!e.hasOwnProperty('receivingTicketId') && !e.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingReturnNotCreated });
        } else if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.delivered &&
          e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingReturnNotDeliverd });
        } else if (![ASSET_STATUS.underReview]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.statusURForCancelReceiving });
        } else if (![RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return]?.includes(e?.rentalAssetStatus)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusCompleteCancelReceiving });
        }
      } else if (action === rentalManagementActions.createRepairJob || action === rentalManagementActions.createRepairOrder) {
        if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.delivered && e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingOrReturnNotDelivered });
        } else if (e.subleaseAsset) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.notSubleaseAsset });
        } else if (
          ![ASSET_STATUS.underReview, ASSET_STATUS.scrap, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair].includes(e.status)
        ) {
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
          ![ASSET_STATUS.inUse, ASSET_STATUS.available, ASSET_STATUS.underReview].includes(e.status) &&
          ![RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.complete].includes(e.rentalAssetStatus)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAsset });
        }
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" m={1}>
        <Box display="flex" alignItems="center" gridGap={'8px'}>
          {!isMobile && (
            <Button
              onClick={() => {
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
              }}
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              type="button"
              size="small"
              disabled={downlodingFile || isOffline || uniqueReceivingTicket.length === 0}
              startIcon={isMobile ? '' : <AiFillFilePdf />}
              style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
            >
              {downlodingFile ? 'Please wait...' : 'Preview'}
            </Button>
          )}
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
          <Menu
            id="simple-menu"
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
          <Button
            variant="outlined"
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
            disabled={selectedRecords.length === 0}
            endIcon={<ExpandMore />}
            className="new-dropdown-v1"
          >
            Actions
          </Button>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorActionEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.createReceivingTicket)) {
                  handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant);
                }
                closeActions();
              }}
            >
              Create Receiving Ticket (Chargeable)
            </MenuItem>
            {selectedRecords.length &&
              selectedRecords?.filter((f) => f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)
                ?.length === selectedRecords?.length ? (
              <MenuItem
                onClick={() => {
                  setShowRemoveAssetFromReceivingTicketDialog(true);
                  closeActions();
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
                  }
                  else {
                    setShowQtyDialog({ open: true, data: null });
                    handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant, false);
                  }
                }
                closeActions();
              }}
            >
              Create Return Ticket (Non-Chargeable)
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.receiveItems)) {
                  handelProcessTickets();
                }
                closeActions();
              }}
            >
              Receive Items
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.createSupplierDeliveryTicket)) {
                  handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier);
                }
                closeActions();
              }}
            >
              Create Supplier Delivery Ticket
            </MenuItem>
            {!isOffline && (
              <MenuItem
                onClick={() => {
                  if (!validateAction(rentalManagementActions.transferToAnotherRental)) {
                    setIsExistingRentalJob(true);
                  }
                  closeActions();
                }}
              >
                {`Transfer to another ${routes.rentalManagement.title}`}
              </MenuItem>
            )}
            {permissions?.repairJob?.isCreate && !isOffline && (
              <MenuItem
                onClick={() => {
                  if (!validateAction(rentalManagementActions.createRepairJob)) {
                    setShowRepairJobDialog(true);
                  }
                  closeActions();
                }}
              >
                {`Create ${routes.repairJob.title}`}
              </MenuItem>
            )}
            {permissions?.repairOrder?.isCreate && !isOffline && (
              <MenuItem
                onClick={() => {
                  if (!validateAction(rentalManagementActions.createRepairOrder)) {
                    setShowRepairOrderDialog(true);
                  }
                  closeActions();
                }}
              >
                {`Create ${routes.repairOrder.title}`}
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.cancelInTransitTicket)) {
                  setShowConformationRevertTicket(true);
                }
                closeActions();
              }}
            >
              Cancel In-Transit Line Items
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.cancelInTransitTicket)) {
                  setShowConformationCancleTicket({ open: true, type: 'Non-Delivered' });
                }
                closeActions();
              }}
            >
              Cancel In-Transit Ticket(s)
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!validateAction(rentalManagementActions.cancelDeliveredTicket)) {
                  setShowConformationCancleTicket({ open: true, type: 'Delivered' });
                }
                closeActions();
              }}
            >
              Cancel Delivered Ticket(s)
            </MenuItem>
            {selectedRecords?.filter(
              (f) =>
                f.type === 'Product' &&
                f.hasOwnProperty('loadingTicketId') &&
                f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                Number(f?.consumeQty) + Number(f?.returnQty) < Number(f?.qty)
            ).length === selectedRecords.length && (
                <MenuItem
                  onClick={() => {
                    closeActions();
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
              ).length === selectedRecords.length && (
                <MenuItem
                  onClick={() => {
                    closeActions();
                    setShowConformationConsume({ open: true, type: 'revert' });
                  }}
                >
                  {`Revert Consumed Qty`}
                </MenuItem>
              )}
          </Menu>
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

          <Menu
            anchorEl={anchorLinkActionEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
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
          {showProcessDeliveryTicket && !isOffline && (
            <>
              <Tooltip title="Process Multiple Receiving/Return Ticket(s)">
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
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
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
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={showTicketDialog.ticketType}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          assets={selectedRecords?.filter((e) => e.type === 'Asset')}
          products={
            showQtyDialog?.data && showQtyDialog?.data?.length > 0
              ? showQtyDialog.data.map((d) => ({ ...d, _id: d?.productId, qty: d.returnQuantity }))
              : []
          }
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
      {showQtyDialog.open && (
        <ReturnTicketDialog
          products={selectedRecords.filter((d: any) => d?.type === 'Product')}
          onSuccess={(data) => {
            setShowQtyDialog({ data: data, open: false });
            setShowTicketDialog((ps: any) => ({ ...ps, open: true }));
            fetchRecords();
            fetchRentalData();
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
      {showNonSerializeAsset.open && (
        <ShowNonSerializeAssets data={showNonSerializeAsset.data} onClose={() => setShowNonSerializeAsset({ open: false, data: {} })} />
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
            setShowConformationCancleTicket({ open: false, type: '' });
          }}
          onOk={() => {
            if (showConformationCancleTicket.type === 'Delivered') {
              handelCancelDeliveredTicket();
            } else {
              handelCancleTickets();
            }
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {openDateDialog.open && (
        <ChangeActualDateDialog
          data={openDateDialog.data}
          open={openDateDialog.open}
          loading={openDateDialog.loading}
          onClose={() => {
            setOpenDateDialog({ open: false, data: null, loading: false });
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
    </>
  );
};

export default ReceivingTicket;
