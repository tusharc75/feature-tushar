import { Button, CircularProgress, Dialog, IconButton, Menu, MenuItem, TextField, Tooltip, useMediaQuery } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { makeStyles } from '@material-ui/core/styles';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Edit from '@material-ui/icons/Edit';
import HelpIcon from '@material-ui/icons/HelpOutline';
import InfoIcon from '@material-ui/icons/Info';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { groupBy, isEqual, map, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
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
import VisibilityIcon from '@material-ui/icons/Visibility';

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
  stepFullScreen
}) => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:600px)');
  const {
    state: { user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { selectedRecords, dataRows } = state;

  const [downlodingFile, setDownlodingFile] = useState(false);
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
  const [showNonSerializeAsset, setShowNonSerializeAsset] = useState({ open: false, data: {} });
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [showConformationRevertTicket, setShowConformationRevertTicket] = useState(false);
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState({ open: false });
  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

  useEffect(() => {
    fetchRecords();
    getColumn();
  }, []);

  const fetchRecords = async () => {
    setNextStep(false);
    setNextStepToolTip(null);

    try {
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
      var invoiceData: any = [];
      var consumeProducts: any = [];

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
          ?.filter((e) => e.replace != true)
          .map((d) => ({
            ...d.inventory,
            uniqueId: d._id,
            isReplaced: d.isReplaced,
            replaceReason: d.replaceReason,
            replaceAsset: d?.replaceAsset
              ? productAssets?.find((ele) => ele?.inventory?._id === d?.replaceAsset)?.inventory?.assetNumber || d?.replaceAsset
              : '',
            description: d?.product?.productDescription,
            rentalAssetStatus: d?.status,
            startDate: d?.startDate
          }))
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


        const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData._id}/invoice/material-end-date-qty`);
        invoiceData = invoiceResponse?.data?.data?.material || [];
      }

      const loadingTicketProducts = [];
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
      });

      products = uniqueProduct(material?.filter((e) => e.consumableType !== 'Internal'));

      products?.forEach((element) => {
        var qty = element.qty;
        const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId);

        ticketProduct?.forEach((ele) => {

          var consumeQty = 0;
          consumeProducts?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)?.forEach((e) => {
            consumeQty = consumeQty + e.qty
          });

          const obj: any = {};
          obj._id = element?.productDetail?._id + '_' + ele.loadingTicketId;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.qty = ele.qty;
          obj.description =
            element.type === 'service'
              ? element?.serviceDetail?.serviceDescription || ''
              : element.type === 'product'
                ? element?.productDetail?.productDescription || ''
                : element.type === 'package'
                  ? element?.packageDetail?.packageDescription || ''
                  : '';
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.parentId = element?.parentId;
          obj.parentName = element?.parentName;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
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
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
          obj.loadingTicket = ele?.loadingTicket;
          obj.loadingTicketId = ele?.loadingTicketId;
          obj.loadingTicketStatus = ele?.loadingTicketStatus;
          obj.startDate = element?.actualStartDate;

          productAssets.push(obj);
          qty = qty - ele.qty;
        });
        if (qty > 0) {
          const obj: any = {};
          obj._id = element.materialId;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.qty = qty;
          obj.description =
            element.type === 'service'
              ? element?.serviceDetail?.serviceDescription || ''
              : element.type === 'product'
                ? element?.productDetail?.productDescription || ''
                : element.type === 'package'
                  ? element?.packageDetail?.packageDescription || ''
                  : '';
          obj.parentId = element?.parentId;
          obj.parentName = element?.parentName;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
          productAssets.push(obj);
        }
      });

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
        d['parentName'] = d?.hasOwnProperty('parentName') && d?.parentName !== '' ? d?.parentName : d?.productName;
        d['parentId'] = d?.hasOwnProperty('parentId') && d?.parentId !== '' ? d?.parentId : d?.productId;
        d['isChecked'] = false;
        d['hideSelection'] =
          [ASSET_STATUS.repair, ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.underReview].includes(d.status) ||
          d?.manualStatus === ASSET_STATUS.reserved ||
          d?.isReplaced;

        d['isReplaceable'] = true;
        if (invoiceData?.length && invoiceData?.some((e) => isEqual(e._id, d._id))) {
          d['isReplaceable'] = false;
        }
      });

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

      setUniqueLoadingTicket([...new Set(productAssets.filter((d) => d.loadingTicketId !== undefined).map((d) => d.loadingTicketId))]);

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
          fieldNames: ['serialNumber', 'mtrAttached']
        }
      ]
    });
    const productFields = data?.find((d) => d.resource === 'Product');
    const assetFields = data?.find((d) => d.resource === 'Serialized Asset');

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
      Cell: ({ row }) => (row?.original?.index ? <h5 className="text-truncate">{row?.original?.index}</h5> : <NoDataCell />)
    },
    {
      accessor: 'assetNumber',
      Header: 'Details',
      disabled: true,
      Cell: ({ row }) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor:
              row?.original?.warehouseId && row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue
                ? COLOUR_MASTER.transferAsset.background
                : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(row?.original?.status)
                  ? COLOUR_MASTER.lostAssets.background
                  : ''
          }}
        >
          <h5 className="text-truncate" title={row?.original?.assetNumber}>
            {row?.original?.assetNumber}
          </h5>
          <Box ml={1}>
            <IconButton
              size="small"
              onClick={() => {
                window.open(
                  `${row?.original?.type === 'Asset' ? routes.serializedAssetDetail.path : routes.productDetail.path}/${row?.original?._id?.split('_')[0]
                  }`
                );
              }}
            >
              <OpenInNewIcon fontSize="small" color={'primary'} />
            </IconButton>
          </Box>

          {row?.original?.warehouseId && row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue && (
            <HtmlTooltip title="This asset will be shipped from different facility">
              <IconButton size="small">
                <HelpIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          {row?.original?.nonSerializeAsset && row?.original?.nonSerializeAsset?.length > 0 && (
            <Box ml={1}>
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
            </Box>
          )}
          {row?.original?.isReplaced && (
            <Box ml={1}>
              <HtmlTooltip
                title={`This Asset has been Replaced by ${row?.original?.replaceAsset} (Due to following reason-"${row?.original?.replaceReason}")`}
              >
                <InfoIcon fontSize="small" color={'primary'} />
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
      accessor: 'rentalAssetStatus',
      Header: 'Rental Asset Status',
      Cell: ({ row }) => (row?.original?.rentalAssetStatus ? <h5 className="text-truncate">{row?.original?.rentalAssetStatus}</h5> : <NoDataCell />)
    },
    {
      accessor: 'status',
      Header: 'Asset Status',
      Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
    }
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
      setShowTicketDialog({ open: true, data: data });
    }
  };

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
        ele.products = selectedRecords?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === 'Product')?.map((e) => e.productId);
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
      const inTransitloadingTicketIds = uniq(map(selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit), 'loadingTicketId'));
      if (inTransitloadingTicketIds?.length) {
        await axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: inTransitloadingTicketIds })
      }
      const deliveredloadingTicketIds = uniq(map(selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered), 'loadingTicketId'));
      if (deliveredloadingTicketIds?.length) {
        await axiosInstance().post(`${deliveryTicket.api}/cancel-delivered-ticket`, { _ids: deliveredloadingTicketIds })
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

  const validateAction = (action) => {
    const errorMessages = [];
    var records = [...selectedRecords];
    if (action === rentalManagementActions.cancelLoadingTicket) {
      const loadingTicketIds = uniq(map(selectedRecords?.filter((e) => e?.loadingTicketId), 'loadingTicketId'));
      records = [...selectedRecords?.filter((e) => !e?.loadingTicketId),
      ...dataRows?.filter((e) => loadingTicketIds?.includes(e?.loadingTicketId))]
    }
    records?.forEach((e) => {
      if (action === rentalManagementActions.createLoadingTicket) {
        if (e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyCreated });
        }
      }
      else if (action === rentalManagementActions.deliveredToCustomer) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyDelivered });
        }
      }
      else if (action === rentalManagementActions.replaceAsset) {
        if (e?.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.productsCanNotReplace });
        } else if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingDeliveredForReplace });
        } else if (e?.status !== ASSET_STATUS.inUse || e?.rentalAssetStatus !== ASSET_STATUS.inUse) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlyReplaceInUse });
        }
      }
      else if (action === rentalManagementActions.cancelInTransitLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.inTransit) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.cancelInTransitLineItems });
        }
      }
      else if (action === rentalManagementActions.cancelLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        }
        else if (![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.loadingTicketStatus)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.inTransitDeliveredLoadingTicket });
        }
        else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          if (e?.type === 'Asset' &&
            ![
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable,
              RENTAL_INTERNAL_ASSET_STATUS.delivered
            ]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusInUseCancelLoading });
          }
          else if (e?.type === 'Asset' &&
            ![ASSET_STATUS.needRepair, ASSET_STATUS.needRecert,
            ASSET_STATUS.inUse, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable, ASSET_STATUS.delivered]?.includes(e?.status)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.statusInUseCancelLoading });
          }
          else if (e?.type === 'Product' && [RENTAL_INTERNAL_ASSET_STATUS.consumed, RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed]?.includes(e?.rentalAssetStatus)) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalProductConsumed });
          }
          else if (e?.type === 'Product' &&
            ![
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable,
              RENTAL_INTERNAL_ASSET_STATUS.delivered,
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

  const getPreview = () => {
    setDownlodingFile(true);
    axiosInstance()
      .get(`pdf/multiple?resource=${sidebarResource.deliveryTicket}&ids=${uniqueLoadingTicket}`, {
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
        <HtmlTooltip title={'Preview PDF'} placement="top" arrow enterTouchDelay={0}>
          <span>
            <Button
              onClick={getPreview}
              variant={isMobile ? 'text' : 'outlined'}
              className={`${isMobile ? 'btn-outline-v1  with-border max-[600px]:[max-width:36px_!important]' : ''}`}
              color="primary"
              type="button"
              size="small"
              disabled={downlodingFile || isOffline || uniqueLoadingTicket.length === 0}
              startIcon={isMobile ? null : <VisibilityIcon />}
            >
              {isMobile ? downlodingFile ? <CircularProgress size={20} /> : <VisibilityIcon /> : downlodingFile ? 'Please wait...' : 'Preview'}
            </Button>
          </span>
        </HtmlTooltip>
        {allowedToEdit && (
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
              selectedRecords?.some((f) => [ASSET_STATUS.lost].includes(f.status))
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
              <Tooltip title="Remove Assets From Loading Ticket(s)">
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
              </Tooltip>
            ) : null}
            {showProcessDeliveryTicket && !isOffline && (
              <Tooltip title="Process Multiple Loading Ticket(s)">
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
              </Tooltip>
            )}
          </>
        )}
      </>
    );
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
              setShowConformationCancleTicket
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
          products={selectedRecords?.filter((e) => e.type === 'Product')}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
            fetchRentalData();
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
      {showNonSerializeAsset.open && (
        <ShowNonSerializeAssets data={showNonSerializeAsset.data} onClose={() => setShowNonSerializeAsset({ open: false, data: {} })} />
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
  setShowConformationCancleTicket
}) => {
  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return false;
    } else {
      return true;
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

  return (
    <>
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
        disabled={selectedRecords.length === 0 || checkUniqWarehouse()}
      >
        Create Loading Ticket
      </MenuItem>
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
      >
        Delivered to Customer
      </MenuItem>
      {user?.user?.brandPolicy?.assetDeliveredStatus && (
        <Box>
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                [RENTAL_INTERNAL_ASSET_STATUS.delivered, RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable].includes(e?.rentalAssetStatus)
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
                [RENTAL_INTERNAL_ASSET_STATUS.delivered, RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standBy].includes(e?.rentalAssetStatus)
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
                [RENTAL_INTERNAL_ASSET_STATUS.delivered, RENTAL_INTERNAL_ASSET_STATUS.standBy, RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable].includes(e?.rentalAssetStatus)
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
      >
        Replace Asset
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (!validateAction(rentalManagementActions.cancelInTransitLoadingTicket)) {
            setShowConformationRevertTicket(true);
          }
        }}
      >
        Cancel Specific Line Items
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (!validateAction(rentalManagementActions.cancelLoadingTicket)) {
            setShowConformationCancleTicket({ open: true });
          }
        }}
      >
        Cancel Loading Ticket(s)
      </MenuItem>
    </>
  );
};
