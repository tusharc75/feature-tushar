import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, Tooltip, IconButton, Menu, MenuItem, Dialog, TextField, CircularProgress } from '@material-ui/core';
import { AiFillFilePdf, AiOutlineDeliveredProcedure } from 'react-icons/ai';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  gridLoadingTimeout,
  deliveryTicket,
  rentalManagement,
  sidebarResource,
  serializedAsset as productInventoryHelperObject,
  INVENTORY_STATUS,
  DELIVERY_TICKET_STATUS,
  RENTAL_INTERNAL_ASSET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFRENCE_TYPE,
  repairJob,
  DELIVERY_FROM_TO_TYPE,
  COLOUR_MASTER,
  REPAIR_JOB_STATUS
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { makeStyles } from '@material-ui/core/styles';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { getRentalProductAssets, getRentalDeliveryTicket, uniqueProduct } from './../rentalOfflineHelper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import ManageRepairJob from '../../RepairJob/ManageRepairJob';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import InfoIcon from '@material-ui/icons/Info';
import { ExpandMore } from '@material-ui/icons';
import ExistingRentalJob from './ExistingRentalJob';
import { groupBy, uniq, map, filter } from 'lodash';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import AddSerializedAsset from '../SerializedAsset/AddSerializedAsset';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import ConsumeProduct from '../../../components/RentalManagment/ConsumeProduct';
import { useData } from '../../../StateProvider/Provider';

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
  renderedFrom,
  allowedToEdit,
  isProcessor,
  allowUpdateStatus
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);

  const [showConformationConsume, setShowConformationConsume] = useState(false);
  const [showConformationConsumeMultiple, setShowConformationConsumeMultiple] = useState(false);

  const [okBtnLoading, setOkBtnLoading] = useState(false);

  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: '', data: {} });

  const { isOffline } = useContext(CustomOfflineContext);

  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);

  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [repairJobCount, setRepairJobCount] = useState(0);

  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [isExistingRentalJob, setIsExistingRentalJob] = useState(false);
  const [uniqueReceivingTicket, setUniqueReceivingTicket] = useState([]);

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);

  const [showNonSerializeAsset, setShowNonSerializeAsset] = useState({ open: false, data: {} });
  const [seletedProducts, setSeletedProducts] = useState([]);
  const [columnHeader, setColumnHeader] = useState(null);


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

  useEffect(() => {
    getColumn()
    fetchRecords();
    if (!isOffline) {
      if (permissions?.repairJob?.isRead) {
        fetchRepairJob();
      }
    }
  }, []);

  const fetchRecords = async () => {
    try {
      setNextStep(false);
      dispatch({ type: 'loading', loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
      }
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
      var consumeProducts: any = [];

      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map((u) => ({
          ...u,
          type: 'Asset',
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
            rentalAssetStatus: d.status,
            startDate: d.startDate,
            endDate: d.endDate,
            isReplaced: d.isReplaced,
            replaceReason: d.replaceReason,
            replaceAsset: d.replaceAsset
          }))
          .map((u) => ({
            ...u,
            type: 'Asset',
            qty: 1,
            productName: u?.product?.optionLabel,
            productId: u?.product?.optionValue,
            warehouse: u?.warehouse?.optionLabel,
            warehouseId: u?.warehouse?.optionValue,
            currentOwner: u?.currentOwner,
            currentLocation: u?.currentLocation?.optionValue
          }));

        const result = await axiosInstance().get(
          `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}`
        );
        deliveryTicketList = result?.data?.data;

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = productResponse?.data?.data?.material;
        nonSerializeAsset = productResponse?.data?.data?.nonSerializeAsset;
        consumeProducts = productResponse?.data?.data?.consumeProducts;
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

        const parentProduct = material.find((p) => p?._id === element?.parentId)?.productDetail

        var consumeQty = 0;

        consumeProducts
          ?.filter((e) => e.product === element.materialId)
          ?.forEach((e) => {
            consumeQty = consumeQty + e.qty;
          });

        const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId);
        ticketProduct?.forEach((ele) => {
          const obj: any = {};
          obj._id = element?.productDetail?._id + '_' + ele.loadingTicketId;
          obj.materialId = element?.productDetail?._id;
          obj.type = 'Product';
          obj.qty = ele.qty;
          obj.consumeQty = consumeQty;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
          obj.status = element?.status;
          obj.parentProductId = parentProduct ? parentProduct?._id : ''
          obj.parentId = element?.parentId;
          obj.parentName = element?.parentName;
          obj.rentalAssetStatus = element?.status;
          obj.startDate = element?.actualStartDate;
          obj.endDate = element?.actualEndDate;
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
          obj.materialId = element?.materialId;
          obj.type = 'Product';
          obj.qty = qty;
          obj.parentId = element?.parentId;
          obj.parentName = element?.parentName;
          obj.consumeQty = consumeQty;
          obj.parentProductId = parentProduct ? parentProduct?._id : ''
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId);
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
          if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
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
          if (obj?.products?.some((p) => d?._id?.split('_')[0] === p?.product)) {
            if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving && productAssets[index]['loadingTicketId']) {
              productAssets[index]['receivingTicket'] = obj?.ticketName;
              productAssets[index]['receivingTicketId'] = obj?._id;
              productAssets[index]['receivingTicketStatus'] = obj?.status;
            }
            if (obj.ticketType === DELIVERY_TICKET_TYPE.return && productAssets[index]['returnTicketId']) {
              productAssets[index]['returnTicket'] = obj?.ticketName;
              productAssets[index]['returnTicketId'] = obj?._id;
              productAssets[index]['returnTicketStatus'] = obj?.status;
            }
          }
        });
      });

      productAssets.forEach((d) => {
        d['isChecked'] = false;
        d['hideSelection'] =
          [INVENTORY_STATUS.lost].includes(d.status) ||
          d?.manualStatus === INVENTORY_STATUS.reserved ||
          (d?.status === RENTAL_INTERNAL_ASSET_STATUS.consumed && d?.qty === d?.consumeQty);
      });

      if (
        productAssets.filter(
          (e) =>
            [
              INVENTORY_STATUS.underReview,
              INVENTORY_STATUS.available,
              INVENTORY_STATUS.repair,
              INVENTORY_STATUS.scrap,
              INVENTORY_STATUS.lost
            ].includes(e.status) ||
            [RENTAL_INTERNAL_ASSET_STATUS.consumed, RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(
              e.rentalAssetStatus
            )
        ).length === productAssets.length
      ) {
        setNextStep(true);
      }

      setUniqueReceivingTicket([...new Set(productAssets.filter((d) => d.receivingTicketId !== undefined).map((d) => d.receivingTicketId))]);
      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const fetchRepairJob = async () => {
    let filterById = [];
    filterById.push({ field: 'rentalJob', term: rentalManagementData?._id });
    const queryString = `?filterById=${JSON.stringify(filterById)}`;
    axiosInstance()
      .get(`${repairJob.api}${queryString}`)
      .then(({ data: { data } }) => {
        setRepairJobCount(data.length);
      })
      .catch((error) => {});
  };

  const InventoryRenderer = (params) => (
    <Fragment>
      <Link
        className="link text-truncate"
        title={params.value}
        to={`${params.data.type === 'Asset' ? routes.serializedAssetDetail.path : routes.productDetail.path}/${params?.data?._id?.split('_')[0]}`}
      >
        {params.value}
      </Link>
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
        <Box ml={1} mt={1}>
          <HtmlTooltip title={`This asset has replaced ${params?.data?.replaceAsset} (Due to following reason-"${params?.data?.replaceReason}")`}>
            <InfoIcon fontSize="small" color={'primary'} />
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params?.value}
    </Link>
  );
  
  const ParentNameRenderer = (params) => params.data?.parentId ? (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.parentProductId}`}>
      {params?.data?.parentName}
    </Link>
  ) : <NoDataCell />;

  const WarehouseRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params?.value} to={`${routes.warehouseDetail.path}/${params?.data?.warehouse?.optionValue}`}>
        {params?.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const DeliveryTicketRenderer = (params) =>
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReceivingTicketRenderer = (params) =>
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.receivingTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReturnTicketRenderer = (params) =>
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.returnTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const frameworkComponents = {
    receivingTicketRenderer: ReceivingTicketRenderer,
    deliveryTicketRenderer: DeliveryTicketRenderer,
    returnTicketRenderer: ReturnTicketRenderer,
    inventoryRenderer: InventoryRenderer,
    productNameRenderer: ProductNameRenderer,
    parentNameRenderer: ParentNameRenderer,
    warehouseRenderer: WarehouseRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
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

          fieldNames: ['assetNumber']
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
      headerName: findHeader(columnHeader?.assetFields, 'assetNumber'),
      show: true,
      disabled: true,
      cellRenderer: 'inventoryRenderer',
      cellStyle: (params) => {
        if (
          [INVENTORY_STATUS.lost, INVENTORY_STATUS.scrap, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(params?.data?.status)
        ) {
          return { backgroundColor: COLOUR_MASTER.lostAssets.background };
        }
        if (params?.data?.isReplaced) {
          return { backgroundColor: COLOUR_MASTER.replaceAssetColor.background };
        }
        return null;
      }
    },
    { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'parent', headerName: 'Parent', show: true, disabled: true, cellRenderer:  'parentNameRenderer'},
    { field: 'qty', headerName: 'Qty', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'productName', headerName: findHeader(columnHeader?.productFields, 'productName'), show: true, cellRenderer: 'productNameRenderer' },
    { field: 'warehouse', headerName: 'Plant', show: false, cellRenderer: 'warehouseRenderer' },
    { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'deliveryTicketRenderer' },
    { field: 'receivingTicket', headerName: 'Receiving Ticket', show: true, cellRenderer: 'receivingTicketRenderer' },
    { field: 'returnTicket', headerName: 'Return Ticket', show: true, cellRenderer: 'returnTicketRenderer' },
    { field: 'status', headerName: 'Asset Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'startDate', headerName: 'Actual Start Date', show: true, cellRenderer: 'dateRenderer' },
    { field: 'endDate', headerName: 'Actual End Date', show: true, cellRenderer: 'dateRenderer' },
    { field: 'rentalAssetStatus', headerName: 'Rental Asset Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns?.forEach((item) => {
      columnState?.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const handleTicketDialog = (ticketType, deliveryToType) => {
    const data = {};
    data['ticketName'] = rentalManagementData.rentalJobName;
    data['refrenceId'] = rentalManagementData._id;
    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
    data['pickupFrom'] = rentalManagementData?.customerAccount?.optionValue;
    data['pickupFromAddress'] = selectedRecords[0]?.currentLocation;
    data['deliveryToType'] = deliveryToType;
    if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
      if (selectedRecords.length) {
        data['deliveryTo'] = selectedRecords[0].owner;
        data['deliveryToAddress'] = '';
      }
    } else {
      data['deliveryTo'] = rentalManagementData?.warehouse?.optionValue;
      data['deliveryToAddress'] = rentalManagementData?.warehouse?.address;
    }
    data['startDate'] = rentalManagementData?.estimateStartDate;
    data['endDate'] = rentalManagementData?.estimateStartDate;
    data['isPickupFromDisable'] = true;

    data['wellName'] = rentalManagementData?.wellName?.optionValue;
    data['afeNumber'] = rentalManagementData?.afeNumber;
    if (rentalManagementData?.processor?.optionValue) {
      data['processor'] = rentalManagementData?.processor?.optionValue;
    }
    data['status'] = DELIVERY_TICKET_STATUS.indTransit;

    setShowTicketDialog({ open: true, ticketType: ticketType, data: data });
    closeActions();
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, { ids: selectedRecords?.map((s) => s._id) })
      .then(({ data }) => {
        axiosInstance()
          .patch(`${repairJob.api}/${repairJobId}/status`, { status: REPAIR_JOB_STATUS.inProgress })
          .then(({ data: { data } }) => {})
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
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

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.refrenceType = 'rentalJob';
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

  const checkTransferValid = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (selectedRecords.some((f) => !f.hasOwnProperty('loadingTicketId') || [INVENTORY_STATUS.lost].includes(f.status))) {
      return false;
    } else if (
      selectedRecords.filter((f) => [INVENTORY_STATUS.inUse].includes(f.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse].includes(f.rentalAssetStatus))
        .length === selectedRecords.length
    ) {
      return true;
    } else if (
      selectedRecords.filter(
        (f) =>
          [
            INVENTORY_STATUS.available,
            INVENTORY_STATUS.underReview,
            RENTAL_INTERNAL_ASSET_STATUS.complete,
            RENTAL_INTERNAL_ASSET_STATUS.consumed
          ].includes(f.status) && [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.consumed].includes(f.rentalAssetStatus)
      ).length === selectedRecords.length
    ) {
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
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Receiving Successfully`
          });
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
        products.push({ product: e.materialId, qty: parseInt(data.qty) });
      });
    } else {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, qty: parseInt(e.qty) });
      });
    }
    setOkBtnLoading(true);
    axiosInstance()
      .post(`${rentalManagement.api}/consume-product/${rentalManagementData._id}`, { products: products })
      .then(({ data }) => {
        setOkBtnLoading(false);
        setShowConformationConsume(false);
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
        assets: selectedRecords.map((m) => m?._id ?? m?.id),
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

  return (
    <>
      <Box display="flex" justifyContent="flex-end" pt={1}>
        <Box display="flex" alignItems="center">
          {!isMobile && (
            <Button
              onClick={() => {
                setDownlodingFile(true);
                axiosInstance()
                  .post(`/delivery-ticket/pdf`, { ids: uniqueReceivingTicket })
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
              disabled={downlodingFile || isOffline || uniqueReceivingTicket.length === 0}
              startIcon={isMobile ? '' : <AiFillFilePdf />}
              style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
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
              disabled={selectedRecords?.length === 0 || isOffline}
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
              <Fragment>
                {selectedRecords?.filter(
                  (f) =>
                    ((f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                      (f.hasOwnProperty('returnTicketId') && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered)) &&
                    [INVENTORY_STATUS.underReview].includes(f.status)
                )?.length === selectedRecords?.length && (
                  <Fragment>
                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.available, message: '' });
                      }}
                    >
                      {INVENTORY_STATUS.available}
                    </MenuItem>
                  </Fragment>
                )}
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.scrap, message: '' });
                  }}
                >
                  {INVENTORY_STATUS.scrap}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.lost, message: '' });
                  }}
                >
                  {INVENTORY_STATUS.lost}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.needRepair, message: '' });
                  }}
                >
                  {INVENTORY_STATUS.needRepair}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.needRecert, message: '' });
                  }}
                >
                  {INVENTORY_STATUS.needRecert}
                </MenuItem>
              </Fragment>
            )}
            {selectedRecords?.filter(
              (f) => f.type === 'Product' && f.hasOwnProperty('loadingTicketId') && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered
            ).length === selectedRecords.length && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  if (selectedRecords?.length === 1) {
                    setShowConformationConsume(true);
                  } else {
                    setShowConformationConsumeMultiple(true);
                  }
                }}
              >
                {RENTAL_INTERNAL_ASSET_STATUS.consumed}
              </MenuItem>
            )}
          </Menu>
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
              disabled={
                selectedRecords.length === 0 ||
                selectedRecords.some(
                  (f) =>
                    f.hasOwnProperty('receivingTicketId') ||
                    f.hasOwnProperty('returnTicketId') ||
                    !f.hasOwnProperty('loadingTicketId') ||
                    [INVENTORY_STATUS.lost].includes(f.status) ||
                    ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(f.status)
                )
              }
              onClick={() => {
                handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant);
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
                }}
              >
                Remove Receiving Ticket
              </MenuItem>
            ) : null}

            <MenuItem
              onClick={() => {
                handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant);
              }}
              disabled={
                selectedRecords.length === 0 ||
                selectedRecords.some(
                  (f) =>
                    !f.hasOwnProperty('loadingTicketId') ||
                    f.hasOwnProperty('receivingTicketId') ||
                    f.hasOwnProperty('returnTicketId') ||
                    [INVENTORY_STATUS.lost].includes(f.status) ||
                    ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(f.status)
                )
              }
            >
              Create Return Ticket (Non-Chargeable)
            </MenuItem>

            <MenuItem
              disabled={
                selectedRecords.length === 0 ||
                selectedRecords.filter(
                  (e: any) =>
                    e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.indTransit || e?.returnTicketStatus === DELIVERY_TICKET_STATUS.indTransit
                ).length !== selectedRecords.length
              }
              onClick={() => {
                closeActions();
                handelProcessTickets();
              }}
            >
              Receive Assets
            </MenuItem>

            <MenuItem
              onClick={() => handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier)}
              disabled={
                selectedRecords.length === 0 ||
                isOffline ||
                selectedRecords.some(
                  (f) =>
                    !f.hasOwnProperty('loadingTicketId') ||
                    f.hasOwnProperty('receivingTicketId') ||
                    f.hasOwnProperty('returnTicketId') ||
                    !f.subleaseAsset ||
                    [INVENTORY_STATUS.lost].includes(f.status) ||
                    ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)
                )
              }
            >
              Create Supplier Delivery Ticket
            </MenuItem>

            <MenuItem
              onClick={() => {
                setIsExistingRentalJob(true);
                closeActions();
              }}
              disabled={isOffline || !checkTransferValid()}
            >
              {`Transfer to another ${routes.rentalManagement.title}`}
            </MenuItem>

            {permissions?.repairJob?.isCreate &&
            selectedRecords.length &&
            selectedRecords?.filter(
              (f) =>
                ((f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                  (f.hasOwnProperty('returnTicketId') && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                  f.status === INVENTORY_STATUS.scrap) &&
                [
                  INVENTORY_STATUS.underReview,
                  INVENTORY_STATUS.scrap,
                  INVENTORY_STATUS.available,
                  INVENTORY_STATUS.needRecert,
                  INVENTORY_STATUS.needRepair
                ].includes(f.status) &&
                !f.subleaseAsset &&
                checkUniqWarehouse()
            )?.length === selectedRecords?.length &&
            !isOffline ? (
              <MenuItem onClick={() => setShowRepairJobDialog(true)}>Create Repair Job</MenuItem>
            ) : null}

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
              disabled={
                selectedRecords.length === 0 ||
                isOffline ||
                selectedRecords.some(
                  (f: any) =>
                    f.type !== 'Asset' ||
                    !f.hasOwnProperty('loadingTicketId') ||
                    f.hasOwnProperty('receivingTicketId') ||
                    f.hasOwnProperty('returnTicketId')
                )
              }
            >
              Replace Assets
            </MenuItem>
          </Menu>
          <Box mx={1} />
          {showProcessDeliveryTicket && !isOffline && (
            <Fragment>
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
              <Box mx={1} />
            </Fragment>
          )}
          {repairJobCount > 0 && (
            <Fragment>
              <HtmlTooltip title={`Created ${routes.repairJob.title}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    history.push(routes.repairJob.path, {
                      rental: rentalManagementData
                    });
                  }}
                >
                  <InfoIcon color={'primary'} />
                </IconButton>
              </HtmlTooltip>
              <Box mx={1} />
            </Fragment>
          )}
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          isMobile ? (
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
                  label: 'Receiving Ticket : ',
                  field: 'receivingTicket',
                  onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.receivingTicketId}`)
                },
                {
                  label: 'Loading Ticket : ',
                  field: 'loadingTicket',
                  onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`)
                },
                {
                  label: 'Return Ticket : ',
                  field: 'returnTicket',
                  onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.returnTicketId}`)
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => {}}
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
              renderedFrom={renderedFrom}
              allowSelection={allowedToEdit || isProcessor}
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
          ticketType={showTicketDialog.ticketType}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
          refrenceData={showTicketDialog.data}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
          products={seletedProducts}
          onClose={() => setShowTicketDialog({ open: false, ticketType: '', data: {} })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
            fetchRecords();
            fetchRentalData();
          }}
        />
      )}
      {isExistingRentalJob && (
        <ExistingRentalJob
          referenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
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
          message={`Are you sure you want to remove selected records from Receiving Ticket?`}
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
              {[INVENTORY_STATUS.available, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(statusToUpdate.status) ? (
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
          refrenceData={rentalManagementData}
          ticketType={[DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return]}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
          handleClose={() => {
            setOpenDeliveryTicketDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showRepairJobDialog && (
        <ManageRepairJob
          refrenceType="Rental Job"
          refrenceData={{
            _id: rentalManagementData._id,
            warehouse: selectedRecords[0].warehouseId,
            wellName: rentalManagementData?.wellName?.optionValue,
            afeNumber: rentalManagementData?.afeNumber
          }}
          onClose={() => setShowRepairJobDialog(false)}
          onSuccess={(obj) => {
            handleAddAssetToRepairJob(obj?._id);
            setShowRepairJobDialog(false);
            if (permissions?.repairJob?.isRead) {
              fetchRepairJob();
            }
            fetchRecords();
          }}
        />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleOpenReplaceAssetReason}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [] });
          }}
          refrenceType={'ReplaceAsset'}
          refrenceData={{
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
      {showConformationConsume && (
        <ConsumeProduct
          products={selectedRecords}
          handleClose={() => setShowConformationConsume(false)}
          loading={okBtnLoading}
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
    </>
  );
};

export default ReceivingTicket;
