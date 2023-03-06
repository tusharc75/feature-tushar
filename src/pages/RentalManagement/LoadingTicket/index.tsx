import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, Tooltip, Menu, MenuItem, Dialog, TextField, CircularProgress, IconButton } from '@material-ui/core';
import { AiFillFilePdf, AiOutlineLoading3Quarters } from 'react-icons/ai';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  deliveryTicket,
  gridLoadingTimeout,
  rentalManagement,
  sidebarResource,
  INVENTORY_STATUS,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  serializedAsset,
  DELIVERY_FROM_TO_TYPE,
  COLOUR_MASTER,
  INVENTORY_OWNER_TYPE
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { useHistory } from 'react-router-dom';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { getRentalProductAssets, getRentalDeliveryTicket, uniqueProduct } from './../rentalOfflineHelper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { makeStyles } from '@material-ui/core/styles';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import { groupBy, uniq, map, sortBy, isEqual } from 'lodash';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import InfoIcon from '@material-ui/icons/Info';
import HelpIcon from '@material-ui/icons/HelpOutline';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import { ExpandMore } from '@material-ui/icons';
import AddSerializedAsset from '../SerializedAsset/AddSerializedAsset';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';

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
  renderedFrom,
  allowedToEdit,
  isProcessor,
  allowUpdateStatus,
  checkProgressiveBilling
}) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const classes = useStyles();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

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
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState(false);

  useEffect(() => {
    fetchRecords();
    getColumn();
  }, []);

  const fetchRecords = async () => {
    setLoadingData(true)
    setNextStep(false);
    try {
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      if (gridApi) {
        gridApi.setRowData([]);
      }
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
      var invoiceData: any = [];

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
          currentLocation: u?.currentLocation?.optionValue
        }));

        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);

        const productResponse = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = productResponse.material;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
        productAssets = response?.data?.data;
        productAssets = productAssets?.filter((e) => e.replace != true).map((d) => ({
          ...d.inventory,
          isReplaced: d.isReplaced,
          replaceReason: d.replaceReason,
          replaceAsset: d?.replaceAsset ? productAssets?.find((ele) => ele?.inventory?._id === d?.replaceAsset)?.inventory?.assetNumber || d?.replaceAsset : "",
          description: d?.product?.productDescription,
        })).map((u) => ({
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
        }));

        const result = await axiosInstance().get(`${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`);
        deliveryTicketList = result?.data?.data;

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = productResponse?.data?.data?.material;
        nonSerializeAsset = productResponse?.data?.data?.nonSerializeAsset;

        const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData._id}/invoice/material-end-date-qty`)
        invoiceData = invoiceResponse?.data?.data?.material || []

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
          obj.status = element?.productDetail?.hasOwnProperty('serializedProduct') && element?.productDetail?.serializedProduct === true ? element?.status : "N/A";
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
          obj.loadingTicket = ele?.loadingTicket;
          obj.loadingTicketId = ele?.loadingTicketId;
          obj.loadingTicketStatus = ele?.loadingTicketStatus;
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
            if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
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
        d['hideSelection'] = [INVENTORY_STATUS.repair, INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost, INVENTORY_STATUS.underReview].includes(d.status) ||
          d?.manualStatus === INVENTORY_STATUS.reserved || d?.isReplaced;

        d['isReplaceable'] = true;
        if (invoiceData?.length && invoiceData?.some((e) => isEqual(e._id, d._id))) {
          d['isReplaceable'] = false;
        }
      });

      if (productAssets.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length > 0) {
        setNextStep(true);
      }

      setUniqueLoadingTicket([...new Set(productAssets.filter((d) => d.loadingTicketId !== undefined).map((d) => d.loadingTicketId))]);

      productAssets = [...productAssets?.filter((e) => !e.isReplaced), ...productAssets?.filter((e) => e.isReplaced)]

      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      setTimeout(() => { dispatch({ type: 'loading', loading: false }) }, gridLoadingTimeout);
      setLoadingData(false)
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
      setLoadingData(false)
    }
  };

  const TicketRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const WarehouseRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.warehouseDetail.path}/${params.data?.warehouse?.optionValue}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const InventoryRenderer = (params) => (
    <Fragment>
      <Link
        className="link text-truncate"
        title={params.value}
        to={`${params.data.type === 'Asset' ? routes.serializedAssetDetail.path : routes.productDetail.path}/${params?.data?._id?.split('_')[0]}`}
      >
        {params.value}
      </Link>
      {params?.data?.warehouseId && params?.data?.warehouseId !== rentalManagementData?.warehouse?.optionValue && (
        <HtmlTooltip title="This asset will be shipped from different facility">
          <IconButton size="small">
            <HelpIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      {params?.data?.nonSerializeAsset && params?.data?.nonSerializeAsset?.length > 0 && (
        <Box ml={1}>
          <HtmlTooltip title={`Non-${routes.serializedAsset.title}`}>
            <IconButton
              size="small"
              onClick={() => {
                setShowNonSerializeAsset({
                  open: true,
                  data: { productName: params?.data?.productName, nonSerializeAsset: params?.data?.nonSerializeAsset }
                });
              }}
            >
              <InfoIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        </Box>
      )}
      {params?.data?.isReplaced && (
        <Box ml={1}>
          <HtmlTooltip title={`This Asset has been Replaced by ${params?.data?.replaceAsset} (Due to following reason-"${params?.data?.replaceReason}")`}>
            <InfoIcon fontSize="small" color={'primary'} />
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params.value}
    </Link>
  );

  const ParentNameRenderer = (params) => (params.data?.parentId ? <span>{params?.data?.parentName}</span> : <NoDataCell />);

  const frameworkComponents = {
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    inventoryRenderer: InventoryRenderer,
    warehouseRenderer: WarehouseRenderer,
    commonRenderer: CommonRenderer,
    parentNameRenderer: ParentNameRenderer
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
      field: 'assetNumber',
      headerName: 'Details',
      show: true,
      disabled: true,
      cellRenderer: 'inventoryRenderer',
      cellStyle: (params) => {
        if (
          [INVENTORY_STATUS.lost, INVENTORY_STATUS.scrap, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(params?.data?.status)
        ) {
          return { backgroundColor: COLOUR_MASTER.lostAssets.background };
        }
        if (params?.data?.warehouseId && params?.data?.warehouseId !== rentalManagementData?.warehouse?.optionValue) {
          return { backgroundColor: COLOUR_MASTER.transferAsset.background };
        }
        return null;
      }
    },
    { field: 'displayType', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'parent', headerName: 'Parent', show: true, disabled: true, cellRenderer: 'parentNameRenderer' },
    { field: 'qty', headerName: 'Qty', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'serialNumber', headerName: findHeader(columnHeader?.assetFields, 'serialNumber'), show: true, cellRenderer: 'commonRenderer' },
    { field: 'productName', headerName: findHeader(columnHeader?.productFields, 'productName'), show: true, cellRenderer: 'productNameRenderer' },
    {
      field: 'description',
      headerName: 'Description',
      show: true,
      cellRenderer: 'commonRenderer'
    },
    { field: 'warehouse', headerName: 'Plant', show: false, cellRenderer: 'warehouseRenderer' },
    { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
    { field: 'status', headerName: 'Asset Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const handleDeliveryTicketDialog = () => {
    if (selectedRecords.length) {
      const data = {};
      data['ticketName'] = rentalManagementData.rentalJobName;
      data['referenceId'] = rentalManagementData._id;

      if (selectedRecords[0].warehouse) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
        data['pickupFrom'] = selectedRecords[0].warehouseId;
        data['pickupFromAddress'] = selectedRecords[0].currentLocation;
      } else {
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
      data['afeNumber'] = rentalManagementData?.afeNumber;
      if (rentalManagementData?.processor?.optionValue) {
        data['processor'] = rentalManagementData?.processor?.optionValue;
      }
      data['status'] = DELIVERY_TICKET_STATUS.indTransit;

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

  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return false;
    } else {
      return true;
    }
  };

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.referenceType = 'rentalJob';
    data.referenceId = rentalManagementData._id;
    const assets: any = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        assets.push({ _id: element._id, status: element.status, deliveryTicketId: element.loadingTicketId, newId: result[0]._id });
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

  const handelProcessTickets = () => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = rentalManagementData?.warehouse?.optionValue;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          fetchRecords();
          checkProgressiveBilling();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Delivered Successfully`
          });
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
        ele.products = selectedRecords?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === "Product")?.map((e) => e.productId);
        ele.assets = selectedRecords?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === "Asset")?.map((e) => e._id);
        data.push(ele);
      })
      axiosInstance().put(`${deliveryTicket.api}/revert-partially`, data).then(({ data: { data } }) => {
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
  }

  const handelCancleTickets = () => {
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: loadingTicketIds }).then(({ data: { data } }) => {
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Cancelled Successfully`
        });
      })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }

  return (
    <>
      <Box display="flex" justifyContent="flex-end" pt={1}>
        <Box display="flex" alignItems="center">
          {!isMobile && (
            <Button
              onClick={() => {
                setDownlodingFile(true);
                axiosInstance()
                  .post(`/delivery-ticket/pdf`, { ids: uniqueLoadingTicket })
                  .then(({ data }) => {
                    axiosInstance()
                      .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: 'blob'
                      })
                      .then(({ data }) => {
                        const file = new Blob([data], { type: 'application/pdf' });
                        const fileURL = URL.createObjectURL(file);
                        const pdfWindow = window.open();
                        pdfWindow.location.href = fileURL;
                        toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                        setDownlodingFile(false);
                      })
                      .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setDownlodingFile(false);
                      });
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
              disabled={downlodingFile || isOffline || uniqueLoadingTicket.length === 0}
              startIcon={<AiFillFilePdf />}
            >
              {downlodingFile ? 'Please wait...' : 'Preview'}
            </Button>
          )}
          <Box mx={1} />
          {allowedToEdit && (
            <Button
              variant={'outlined'}
              color="primary"
              aria-controls="simple-menu"
              aria-haspopup="true"
              disabled={!allowUpdateStatus || selectedRecords.length === 0 || selectedRecords?.some((f) => f.type === 'Product') || isOffline}
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
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.scrap, message: '' });
              }}
            >
              Scrap
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.lost, message: '' });
              }}
            >
              Lost
            </MenuItem>
          </Menu>
          {(allowedToEdit || isProcessor) && (
            <Fragment>
              <Box mx={1} />
              <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedRecords.length === 0}
              >
                Actions <ExpandMore />
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
                    closeActions();
                    handleDeliveryTicketDialog();
                  }}
                  disabled={selectedRecords.length === 0 || selectedRecords.some((f) => f.hasOwnProperty('loadingTicketId')) || checkUniqWarehouse()}
                >
                  Create Loading Ticket
                </MenuItem>

                <MenuItem
                  disabled={
                    selectedRecords.length === 0 ||
                    selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length
                  }
                  onClick={() => {
                    handelProcessTickets();
                    closeActions();
                  }}
                >
                  Delivered to Customer
                </MenuItem>
                {selectedRecords.length &&
                  selectedRecords?.filter((f) => f.hasOwnProperty('loadingTicketId')
                    && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit)?.length === selectedRecords?.length ? (
                  <Fragment>
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        setShowConformationRevertTicket(true);
                      }}
                    >
                      Revert Line Items
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        setShowConformationCancleTicket(true);
                      }}
                    >
                      Cancel Loading Ticket
                    </MenuItem>
                  </Fragment>
                ) : null}
                {selectedRecords.length &&
                  selectedRecords?.filter((f) =>
                    f.hasOwnProperty('loadingTicketId')
                    && f?.type === 'Asset'
                    && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered
                    && f?.status === INVENTORY_STATUS.inUse
                    && f?.isReplaceable)?.length === selectedRecords?.length
                  &&
                  <MenuItem
                    onClick={() => {
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
                      closeActions();
                    }}
                  >
                    Replace Asset
                  </MenuItem>
                }
              </Menu>
              <Box mx={1} />
              {selectedRecords.length &&
                selectedRecords?.filter((f) => f.hasOwnProperty('loadingTicketId') && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length ===
                selectedRecords?.length ? (
                <Fragment>
                  <Tooltip title="Remove Assets From Loading Ticket(s)">
                    <Button
                      onClick={() => {
                        setShowRemoveTicketDialog(true);
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="primary"
                      size="small"
                      style={isMobile && !isTablet ? { color: 'var(--danger-light)' } : {}}
                      disabled={
                        selectedRecords.length === 0 || currentStep === 4 || selectedRecords.some((f) => !f.hasOwnProperty('loadingTicketId'))
                      }
                    >
                      {isMobile && !isTablet ? <IoRemoveCircleOutline size={22} /> : 'Remove Loading Ticket'}
                    </Button>
                  </Tooltip>
                  <Box mx={1} />
                </Fragment>
              ) : null}
              {showProcessDeliveryTicket && !isOffline && (
                <Fragment>
                  <Tooltip title="Process Multiple Loading Ticket(s)">
                    <Button
                      onClick={() => {
                        setOpenDeliveryTicketDialog(true);
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                    >
                      {isMobile && !isTablet ? <AddBoxRoundedIcon /> : 'Process Loading Ticket'}
                    </Button>
                  </Tooltip>
                  <Box mx={1} />
                </Fragment>
              )}
            </Fragment>
          )}
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit || isProcessor}
              allowSwipe={true}
              permissions={true}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={false}
              extraParamsToCheckDelete={true}
              onDelete={false}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[
                {
                  label: 'Status : ',
                  field: 'status'
                },
                {
                  label: 'Loading Ticket : ',
                  field: 'loadingTicket',
                  onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`)
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => { }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={false}
              loading={loading}
              isClientSideGrid={true}
              allowSelection={allowedToEdit || isProcessor}
              rowClassRules={{
                "light-grey-data-row":
                  function (params) {
                    return params?.data?.isReplaced;
                  },
              }}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRecords}
            />
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
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
                    assets: selectedRecords.map((m) => m?._id ?? m?.id),
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
          referenceData={{
            _id: rentalManagementData?._id,
            warehouse: rentalManagementData?.warehouse?.optionValue
          }}
          isAdding={replaceLoading}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={rentalManagementData?.warehouse?.optionValue}
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
      {showConformationCancleTicket && (
        <ConfirmationDialog
          open={showConformationCancleTicket}
          message={`This action will cancel the complete Loading Ticket. Are you sure?`}
          onClose={() => {
            setShowConformationCancleTicket(false);
          }}
          onOk={() => {
            handelCancleTickets();
            setShowConformationCancleTicket(false);
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
    </>
  );
};

export default LoadingTicket;
