import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import {
  Button, Tooltip, IconButton, Menu, MenuItem,
  Dialog, TextField, CircularProgress
} from "@material-ui/core";
import { AiFillFilePdf, AiOutlineDeliveredProcedure } from 'react-icons/ai';
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import {
  gridLoadingTimeout, deliveryTicket, rentalManagement,
  sidebarResource, serializedAsset as productInventoryHelperObject, INVENTORY_STATUS, DELIVERY_TICKET_STATUS, RENTAL_INTERNAL_ASSET_STATUS,
  DELIVERY_TICKET_TYPE, DELIVERY_TICKET_REFRENCE_TYPE,
  repairJob, DELIVERY_FROM_TO_TYPE
} from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
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
import { getRentalProductAssets, getRentalDeliveryTicket } from './../rentalOfflineHelper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import MultipleTicket from "../../DeliveryTicket/MultipleTicket";
import ManageRepairJob from '../../RepairJob/ManageRepairJob'
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import InfoIcon from '@material-ui/icons/Info';
import { ExpandMore } from '@material-ui/icons';
import ExistingRentalJob from "./ExistingRentalJob";
import { groupBy, uniq, map, filter } from "lodash";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import AddSerializedAsset from "../SerializedAsset/AddSerializedAsset";
import ReplaceAssetReason from "../../../components/RentalManagment/ReplaceAssetReason";


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

const ReceivingTicket = ({ currentStep, rentalManagementData, fetchRentalData, setNextStep, renderedFrom, allowedToEdit }) => {

  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);

  const [showConformationConsume, setShowConformationConsume] = useState(false);

  const [okBtnLoading, setOkBtnLoading] = useState(false);

  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: "", data: {} });

  const { isOffline } = useContext(CustomOfflineContext);

  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);

  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [repairJobCount, setRepairJobCount] = useState(0);

  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [isExistingRentalJob, setIsExistingRentalJob] = useState(false);
  const [uniqueReceivingTicket, setUniqueReceivingTicket] = useState([]);

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] })
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} })
  const [replaceLoading, setReplaceLoading] = useState(false)


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
    fetchRecords();
    if (!isOffline) {
      fetchRepairJob()
    }
  }, []);

  const fetchRecords = async () => {
    try {
      setNextStep(false)
      dispatch({ type: "loading", loading: true });
      if (gridApi) {
        gridApi.deselectAll();
      }
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var products: any = [];
      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map(u => ({
          ...u,
          type: "Asset",
          qty: 1,
          productName: u?.product?.optionLabel,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          currentLocation: u?.currentLocation?.optionValue,
          rentalAssetStatus: u?.status
        }))

        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);

        const productResponse = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        products = productResponse.material;

      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
        productAssets = response?.data?.data;
        productAssets = productAssets.map(d => ({ ...d.inventory, rentalAssetStatus: d.status, startDate: d.startDate, endDate: d.endDate })).map(u => ({
          ...u,
          type: "Asset",
          qty: 1,
          productName: u?.product?.optionLabel,
          productId: u?.product?.optionValue,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          currentLocation: u?.currentLocation?.optionValue,
        }))

        const result = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}`)
        deliveryTicketList = result?.data?.data

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)
        products = productResponse?.data?.data?.material

      }
      products = products.filter((e) => !e?.productDetail?.serializedProduct && e.type === "product")

      products?.forEach((ele) => {
        if (productAssets.filter((e) => e.productId === ele.materialId).length === 0) {
          if (productAssets.filter((e) => e._id === ele.materialId).length) {
            productAssets.forEach(element => {
              if (element._id === ele.materialId) {
                element.qty += ele.qty
              }
            });
          }
          else {
            const obj: any = {}
            obj._id = ele.materialId
            obj.type = "Product"
            obj.qty = ele.qty
            obj.assetNumber = ele?.productDetail?.productName
            obj.productName = ele?.productDetail?.productName
            obj.productId = ele?.productDetail?._id
            obj.warehouse = rentalManagementData?.warehouse?.optionLabel
            obj.warehouseId = rentalManagementData?.warehouse?.optionValue
            obj.status = ele?.status
            obj.rentalAssetStatus = ele?.status
            obj.startDate = ele?.actualStartDate
            obj.endDate = ele?.actualEndDate
            productAssets.push(obj)
          }
        }
      })

      if (deliveryTicketList.length) {
        if (deliveryTicketList.filter((e) => [DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return].includes(e.ticketType) &&
          [DELIVERY_TICKET_STATUS.new, DELIVERY_TICKET_STATUS.indTransit].includes(e.status)).length) {
          setShowProcessDeliveryTicket(true)
        }
        else {
          setShowProcessDeliveryTicket(false)
        }
      }
      deliveryTicketList?.map(obj => {
        productAssets?.map((d, index) => {
          if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
            if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
              productAssets[index]['loadingTicket'] = obj?.ticketName;
              productAssets[index]['loadingTicketId'] = obj?._id;
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
          if (obj?.products?.some((p) => d?._id === p?.product)) {
            if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
              productAssets[index]['loadingTicket'] = obj?.ticketName;
              productAssets[index]['loadingTicketId'] = obj?._id;
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
        d["isChecked"] = false;
        d["hideSelection"] = [INVENTORY_STATUS.indTransit, INVENTORY_STATUS.lost].includes(d.status) || d?.manualStatus === INVENTORY_STATUS.reserved
          || d?.status === RENTAL_INTERNAL_ASSET_STATUS.consumed;
      })

      if (productAssets.filter((e) =>
        [INVENTORY_STATUS.underReview, INVENTORY_STATUS.available, INVENTORY_STATUS.repair, INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost].includes(e.status) ||
        [RENTAL_INTERNAL_ASSET_STATUS.consumed, RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(e.rentalAssetStatus)).length
        === productAssets.length) {
        setNextStep(true)
      }

      setUniqueReceivingTicket([...new Set(productAssets.filter(d => d.receivingTicketId !== undefined).map(d => d.receivingTicketId))]);
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
    filterById.push({ field: "rentalJob", term: rentalManagementData?._id });
    const queryString = `?filterById=${JSON.stringify(filterById)}`
    axiosInstance().get(`${repairJob.api}${queryString}`).then(({ data: { data } }) => {
      setRepairJobCount(data.length)
    }).catch((error) => {
    });
  }
  const InventoryRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${params.data.type === "Asset" ? routes.serializedAssetDetail.path : routes.productDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params.value}
    </Link>
  );

  const WarehouseRenderer = (params) => (
    params?.value ? (
      <Link className="link text-truncate" title={params?.value} to={`${routes.warehouseDetail.path}/${params?.data?.warehouse?.optionValue}`}>
        {params?.value}
      </Link>
    ) : (
      <NoDataCell />
    )
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
    warehouseRenderer: WarehouseRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, disabled: true, cellRenderer: "inventoryRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "productName", headerName: "Product Type", show: true, cellRenderer: "productNameRenderer" },
    { field: "warehouse", headerName: "Plant", show: false, cellRenderer: "warehouseRenderer" },
    { field: "loadingTicket", headerName: "Loading Ticket", show: true, cellRenderer: "deliveryTicketRenderer" },
    { field: "receivingTicket", headerName: "Receiving Ticket", show: true, cellRenderer: "receivingTicketRenderer" },
    { field: "returnTicket", headerName: "Return Ticket", show: true, cellRenderer: "returnTicketRenderer" },
    { field: "status", headerName: "Asset Status", show: true, cellRenderer: "commonRenderer" },
    { field: "startDate", headerName: "Actual Start Date", show: true, cellRenderer: "dateRenderer" },
    { field: "endDate", headerName: "Actual End Date", show: true, cellRenderer: "dateRenderer" },
    { field: "rentalAssetStatus", headerName: "Rental Asset Status", show: true, cellRenderer: "commonRenderer" },
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

  const handleTicketDialog = (ticketType, deliveryToType) => {
    const data = {}
    data["ticketName"] = rentalManagementData.rentalJobName;
    data["refrenceId"] = rentalManagementData._id;
    data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.customer;
    data["pickupFrom"] = rentalManagementData?.customerAccount?.optionValue;
    data["pickupFromAddress"] = selectedRecords[0]?.currentLocation;
    data["deliveryToType"] = deliveryToType;
    if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
      if (selectedRecords.length) {
        data["deliveryTo"] = selectedRecords[0].owner;
        data["deliveryToAddress"] = ""
      }
    }
    else {
      data["deliveryTo"] = rentalManagementData?.warehouse?.optionValue;
      data["deliveryToAddress"] = rentalManagementData?.warehouse?.address;
    }
    data["startDate"] = rentalManagementData?.estimateStartDate;
    data["endDate"] = rentalManagementData?.estimateStartDate;
    data["isPickupFromDisable"] = true;

    data["wellName"] = rentalManagementData?.wellName?.optionValue;
    data["afeNumber"] = rentalManagementData?.afeNumber;
    if (rentalManagementData?.processor?.optionValue) {
      data["processor"] = rentalManagementData?.processor?.optionValue;
    }
    setShowTicketDialog({ open: true, ticketType: ticketType, data: data });
    closeActions()
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, { "ids": selectedRecords?.map(s => s._id) })
      .then(({ data }) => {
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }

  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, "warehouseId")).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {}
    data.refrenceType = "rentalJob";
    data.referenceId = rentalManagementData._id;
    const assets: any = []
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter(f => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        assets.push({ _id: element._id, status: element.status, deliveryTicketId: element.loadingTicketId, newId: result[0]._id })
        result[0].isCounted = true;
      }
    })
    data.assets = assets;
    setShowReplaceReason({ open: true, data: data })
  }

  const handleReplaceAsset = (reason) => {
    setReplaceLoading(true)
    axiosInstance().post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] })
        setAddSerializedAssetDialog({ open: false, products: [] })
        setReplaceLoading(false)
        fetchRecords()
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }

  const checkTransferValid = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (selectedRecords.some(f => !f.hasOwnProperty("loadingTicketId") || [INVENTORY_STATUS.lost].includes(f.status))) {
      return false;
    } else if (selectedRecords.filter((f) => [INVENTORY_STATUS.inUse].includes(f.status)
      && [RENTAL_INTERNAL_ASSET_STATUS.inUse].includes(f.rentalAssetStatus)).length === selectedRecords.length) {
      return true;
    } else if (selectedRecords.filter((f) => [INVENTORY_STATUS.available, INVENTORY_STATUS.underReview, RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.consumed].includes(f.status)
      && [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.consumed].includes(f.rentalAssetStatus)).length === selectedRecords.length) {
      return true;
    }
    else {
      return false;
    }
  };

  return (<>
    <Box display="flex" justifyContent="flex-end" pt={1}>
      <Box display="flex" alignItems="center">
        {!isMobile && <Button
          onClick={() => {
            setDownlodingFile(true);
            axiosInstance().post(`/delivery-ticket/pdf`, { "ids": uniqueReceivingTicket })
              .then(({ data }) => {
                axiosInstance()
                  .get(`user/download?fileName=${data.data.fileName}`, {
                    responseType: "blob",
                  })
                  .then(({ data }) => {
                    const file = new Blob([data], { type: "application/pdf" });
                    const fileURL = URL.createObjectURL(file);
                    const pdfWindow = window.open();
                    pdfWindow.location.href = fileURL;
                    toastConfig.setToastConfig({ open: true, type: "success", message: "Preview file downloaded successfully." })
                    setDownlodingFile(false);
                  })
                  .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setDownlodingFile(false);
                  });
              }).catch((err) => {
                toastConfig.setToastConfig(err);
                setDownlodingFile(false);
              })
          }}
          variant={isMobile && !isTablet ? 'text' : 'outlined'}
          color="primary"
          type="button"
          size="small"
          disabled={downlodingFile || isOffline || uniqueReceivingTicket.length === 0}
          startIcon={isMobile ? '' : <AiFillFilePdf />}
          style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
        >
          {downlodingFile ? "Please wait..." : "Preview"}
        </Button>}
        <Box mx={1} />
        {allowedToEdit &&
          <Fragment>
            <Button variant={isMobile && !isTablet ? 'text' : 'outlined'} color="primary" aria-controls="simple-menu"
              aria-haspopup="true"
              disabled={selectedRecords?.length === 0 || isOffline}
              size="small"
              onClick={handleClick}
              style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
              endIcon={<ArrowDropDownIcon />}>
              {'Change Status'}
            </Button>
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
              {(selectedRecords?.filter((f) => f.type === "Asset").length === selectedRecords.length) &&
                <Fragment>
                  {(selectedRecords?.filter(f =>
                    ((f.hasOwnProperty("receivingTicketId") && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                      (f.hasOwnProperty("returnTicketId") && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered))
                    && [INVENTORY_STATUS.underReview].includes(f.status)
                  )?.length === selectedRecords?.length) &&
                    <Fragment>
                      <MenuItem onClick={() => {
                        setAnchorEl(null)
                        setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.available, message: "" })
                      }}>{INVENTORY_STATUS.available}</MenuItem>
                    </Fragment>}
                  <MenuItem onClick={() => {
                    setAnchorEl(null)
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.scrap, message: "" })
                  }}>{INVENTORY_STATUS.scrap}</MenuItem>
                  <MenuItem onClick={() => {
                    setAnchorEl(null)
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.lost, message: "" })
                  }}>{INVENTORY_STATUS.lost}</MenuItem>
                  <MenuItem onClick={() => {
                    setAnchorEl(null)
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.needRepair, message: "" })
                  }}>{INVENTORY_STATUS.needRepair}</MenuItem>
                  <MenuItem onClick={() => {
                    setAnchorEl(null)
                    setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.needRecert, message: "" })
                  }}>{INVENTORY_STATUS.needRecert}</MenuItem>
                </Fragment>
              }
              {(selectedRecords?.filter((f) => f.type === "Product" && f.hasOwnProperty("loadingTicketId")).length === selectedRecords.length) &&
                <MenuItem onClick={() => {
                  setAnchorEl(null)
                  setShowConformationConsume(true)
                }}>{RENTAL_INTERNAL_ASSET_STATUS.consumed}</MenuItem>
              }
            </Menu>
            <Box mx={1} />
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={(selectedRecords.length === 0)}
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
                disabled={(selectedRecords.length === 0) ||
                  (selectedRecords.some(f => f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                    || !f.hasOwnProperty("loadingTicketId")
                    || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
                onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant) }}>
                Create Receiving Ticket</MenuItem>

              {(selectedRecords.length && selectedRecords?.filter(f => f.hasOwnProperty("receivingTicketId") &&
                f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedRecords?.length) ?
                <MenuItem onClick={() => { setShowRemoveAssetFromReceivingTicketDialog(true) }}>Remove Receiving Ticket</MenuItem>
                : null}

              <MenuItem
                onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant) }}
                disabled={(selectedRecords.length === 0)
                  || (selectedRecords.some(f =>
                    !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                    || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
              >
                Create Return Ticket</MenuItem>


              <MenuItem
                onClick={() => handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier)}
                disabled={(selectedRecords.length === 0) || isOffline
                  || (selectedRecords.some(f =>
                    !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                    || !f.subleaseAsset || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
              >Create Supplier Delivery Ticket</MenuItem>

              <MenuItem
                onClick={() => {
                  setIsExistingRentalJob(true)
                  closeActions()
                }}
                disabled={isOffline || !checkTransferValid()}
              >
                {`Transfer to another ${routes.rentalManagement.title}`}</MenuItem>

              {(selectedRecords.length && selectedRecords?.filter(f =>
                ((f.hasOwnProperty("receivingTicketId") && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                  (f.hasOwnProperty("returnTicketId") && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered) || f.status === INVENTORY_STATUS.scrap)
                && [INVENTORY_STATUS.underReview, INVENTORY_STATUS.scrap, INVENTORY_STATUS.available].includes(f.status)
                && !f.subleaseAsset && checkUniqWarehouse()
              )?.length === selectedRecords?.length && !isOffline) ?

                <MenuItem
                  onClick={() => setShowRepairJobDialog(true)}
                >Create Repair Job</MenuItem>
                : null}

              <MenuItem
                onClick={() => {
                  const products = []
                  selectedRecords?.forEach((element) => {
                    const foundProduct = products.filter((e) => e._id === element?.product?.optionValue)
                    if (foundProduct.length) {
                      foundProduct[0].qty += 1
                    }
                    else {
                      products.push({
                        _id: element?.product?.optionValue,
                        productName: element?.product?.optionLabel,
                        qty: 1
                      })
                    }
                  })
                  setAddSerializedAssetDialog({ open: true, products: products });
                  closeActions()
                }}
                disabled={(selectedRecords.length === 0) || isOffline || (selectedRecords.some((f: any) => f.type !== "Asset" ||
                  !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                ))}
              >
                Replace Assets</MenuItem>
            </Menu>
            <Box mx={1} />
            {(showProcessDeliveryTicket && !isOffline) &&
              <Fragment>
                <Tooltip
                  title="Process Multiple Receiving/Return Ticket(s)">
                  <Button
                    variant={isMobile && !isTablet ? "text" : "contained"}
                    color="primary"
                    size="small"
                    onClick={() => {
                      setOpenDeliveryTicketDialog(true)
                    }}
                  >
                    {isMobile && !isTablet ? <AddBoxRoundedIcon /> : "Process Ticket"}
                  </Button>
                </Tooltip>
                <Box mx={1} />
              </Fragment>}
            {repairJobCount > 0 &&
              <Fragment>
                <HtmlTooltip title={`Created ${routes.repairJob.title}`}>
                  <IconButton size="small" onClick={() => {
                    history.push(routes.repairJob.path, {
                      rental: rentalManagementData,
                    })
                  }}>
                    <InfoIcon color={"primary"} />
                  </IconButton>
                </HtmlTooltip>
                <Box mx={1} />
              </Fragment>
            }
          </Fragment>
        }
      </Box>
    </Box>
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {columns ? (
        isMobile ? (
          <CustomSwipableList
            allowSelection={allowedToEdit}
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
            renderedFrom={renderedFrom}
            allowSelection={allowedToEdit}
            rowClassRules={{
              "red-data-row": function (params) {
                return [INVENTORY_STATUS.lost, INVENTORY_STATUS.scrap].some(s => s === params.data.status);
              },
            }}
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
        productInventory={selectedRecords?.filter((e => e.type === "Asset"))}
        products={selectedRecords?.filter((e => e.type === "Product"))}
        onClose={() => setShowTicketDialog({ open: false, ticketType: "", data: {} })}
        onSuccess={() => {
          setShowTicketDialog({ open: false, ticketType: "", data: {} });
          fetchRecords();
          fetchRentalData()
        }}
      />
    )}
    {isExistingRentalJob && (
      <ExistingRentalJob
        referenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        referenceData={rentalManagementData}
        productInventory={selectedRecords}
        onClose={() => setIsExistingRentalJob(false)}
        onSuccess={() => {
          setIsExistingRentalJob(false)
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
            apiCalls.push(
              axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) })
            );
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
    {showConformationConsume && (
      <ConfirmationDialog
        open={showConformationConsume}
        message={`Are you sure you want to consume selected records?`}
        onClose={() => {
          setShowConformationConsume(false);
        }}
        okBtnLoading={okBtnLoading}
        onOk={() => {
          setOkBtnLoading(true);
          axiosInstance().post(`${rentalManagement.api}/consume-product/${rentalManagementData._id}`, { "products": selectedRecords?.map(s => s._id) })
            .then(({ data }) => {
              setOkBtnLoading(false);
              setShowConformationConsume(false);
              fetchRecords();
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            })
        }}
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
            {[INVENTORY_STATUS.available, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(statusToUpdate.status) ?
              <h4>You want to change the status of selected assets to {statusToUpdate.status} ?</h4>
              : <TextField
                id="outlined-multiline-static"
                label={`Please enter the reason for ${statusToUpdate.status}`}
                multiline
                fullWidth
                rows={4}
                value={statusToUpdate.message}
                variant="outlined"
                onChange={(e) => {
                  setStatusToUpdate(prevState => ({ ...prevState, message: e.target.value }))
                }}
              />}
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            size="small"
            variant="outlined" color="primary" onClick={() => setStatusToUpdate(prevState => ({ ...prevState, open: false }))}>
            Cancel
          </Button>
          <Button
            size="small"
            onClick={() => {
              setStatusToUpdate(prevState => ({ ...prevState, isUpdating: true }));
              axiosInstance().put(`${productInventoryHelperObject.api}/update-status`, {
                comment: statusToUpdate.message,
                assets: selectedRecords.map(m => m?._id ?? m?.id),
                status: statusToUpdate.status,
                reference: {
                  _id: rentalManagementData._id,
                  type: "Rental"
                }
              }).then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message })
                setStatusToUpdate({ open: false, isUpdating: false, status: "", message: "" });
                fetchRecords();
              }).catch((error) => {
                setStatusToUpdate(prevState => ({ ...prevState, isUpdating: false }));
                toastConfig.setToastConfig(error)
              })
            }}
            disabled={statusToUpdate.isUpdating}
            variant="contained"
            color="primary"
          >
            {
              statusToUpdate.isUpdating ? <CircularProgress
                style={{ marginRight: "8px" }}
                size={20} color="inherit" /> : null
            }
            Change Status
          </Button>
        </CustomDialogFooter>
      </Dialog>
    )}
    {openDeliveryTicketDialog &&
      <MultipleTicket
        refrenceData={rentalManagementData}
        ticketType={[DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return]}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        handleClose={() => {
          setOpenDeliveryTicketDialog(false)
          fetchRecords()
        }}
      />}
    {showRepairJobDialog &&
      <ManageRepairJob
        refrenceType="Rental Job"
        refrenceData={{
          _id: rentalManagementData._id, warehouse: selectedRecords[0].warehouseId,
          wellName: rentalManagementData?.wellName, afeNumber: rentalManagementData?.afeNumber
        }}
        onClose={() => setShowRepairJobDialog(false)}
        onSuccess={(obj) => {
          handleAddAssetToRepairJob(obj?._id)
          setShowRepairJobDialog(false);
          fetchRecords()
        }}
      />
    }
    {addSerializedAssetDialog.open &&
      <AddSerializedAsset
        addSerializedAsset={handleOpenReplaceAssetReason}
        handleSerializedAssetClose={() => {
          setAddSerializedAssetDialog({ open: false, products: [] });
        }}
        refrenceType={"ReplaceAsset"}
        refrenceData={{
          _id: rentalManagementData?._id, warehouse: rentalManagementData?.warehouse?.optionValue
        }}
        isAdding={replaceLoading}
        selectedProducts={addSerializedAssetDialog.products}
        filterByPlant={rentalManagementData?.warehouse?.optionValue}
      />
    }
    {showReplaceReason.open &&
      <ReplaceAssetReason
        handleClose={() => setShowReplaceReason({ open: false, data: {} })}
        loading={replaceLoading}
        handleSucess={(data) => { handleReplaceAsset(data?.reason) }}
      />
    }
  </>
  );
};

export default ReceivingTicket;