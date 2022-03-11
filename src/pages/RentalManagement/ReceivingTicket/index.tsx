import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import {
  Button, Tooltip, IconButton, Menu, MenuItem,
  Dialog, TextField, CircularProgress, Chip
} from "@material-ui/core";
import { AiFillFilePdf, AiOutlineDeliveredProcedure } from 'react-icons/ai';
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import {
  deliveryTicket, rentalManagement,
  serializedAsset as productInventoryHelperObject, INVENTORY_STATUS, DELIVERY_TICKET_STATUS, RENTAL_INTERNAL_ASSET_STATUS,
  DELIVERY_TICKET_TYPE, DELIVERY_TICKET_REFRENCE_TYPE,
  repairJob, DELIVERY_FROM_TO_TYPE, treeToFlatArray, dateFormat
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
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { getRentalProductAssets, getRentalDeliveryTicket } from './../rentalOfflineHelper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import MultipleTicket from "../../DeliveryTicket/MultipleTicket";
import ManageRepairJob from '../../RepairJob/ManageRepairJob'
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import InfoIcon from '@material-ui/icons/Info';
import { ExpandMore } from '@material-ui/icons';
import ExistingRentalJob from "./ExistingRentalJob";
import { groupBy, uniq, uniqBy, map } from "lodash";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import moment from "moment";

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

const ReceivingTicket = ({ currentStep, rentalManagementData, fetchRentalData, setNextStep, renderedFrom, stepFullScreen }) => {

  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);
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

  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([])

  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])

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

  useEffect(() => {
    let flatArray = treeToFlatArray(selectedRecords, "subRows");
    flatArray = uniqBy(flatArray, '_id')
    setSelectedAssets(flatArray?.filter((ele) => ele.type === "asset" && !ele.hideSelection))
    setSelectedProducts(flatArray?.filter((ele) => ele.type === "product" && !ele.serializedProduct))
  }, [selectedRecords]);

  const fetchRecords = async () => {
    try {
      setNextStep(false)
      var isNextStep = false;
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      const rows = []

      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map((u) => ({ ...u, productName: u?.product?.optionLabel }));
        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)

        const result = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}`)
        deliveryTicketList = result?.data?.data

        const products = response?.data?.data?.material.filter((e) => e.type === "product");
        productAssets = response?.data?.data?.inventory

        products?.forEach((element: any) => {
          const ele: any = {}
          ele.detail = element.productDetail?.productName;
          ele._id = element.productDetail?._id;
          ele.type = "product";
          ele.serializedProduct = element.productDetail?.serializedProduct;

          deliveryTicketList.map(obj => {
            if (obj?.products?.some((p) => ele?._id === p?.product)) {
              if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
                ele.loadingTicket = obj?.ticketName;
                ele.loadingTicketId = obj?._id;
                ele.loadingTicketStatus = obj?.status;
              }
              if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving) {
                ele.receivingTicket = obj?.ticketName;
                ele.receivingTicketId = obj?._id;
                ele.receivingTicketStatus = obj?.status;
              }
              if (obj.ticketType === DELIVERY_TICKET_TYPE.return) {
                ele.returnTicket = obj?.ticketName;
                ele.returnTicketId = obj?._id;
                ele.returnTicketStatus = obj?.status;
              }
            }
          });

          ele.subRows = [];
          const assets = productAssets?.filter((e) => e.product === element.materialId)
          assets?.forEach((_asset: any) => {
            const asset: any = {};
            asset.detail = _asset?.inventoryDetail?.assetNumber;
            asset._id = _asset?.inventoryDetail?._id;
            asset.type = "asset";
            asset.serialNumber = _asset?.inventoryDetail?.serialNumber;
            asset.status = _asset?.inventoryDetail?.status;
            asset.warehouse = _asset?.inventoryDetail?.warehouse;
            asset.currentOwner = _asset?.inventoryDetail?.currentOwner;
            asset.currentLocation = _asset?.inventoryDetail?.currentLocation;
            asset.manualStatus = _asset?.inventoryDetail?.manualStatus;
            asset.rentalAssetStatus = _asset?.status;
            asset.startDate = _asset?.startDate;
            asset.endDate = _asset?.endDate;

            deliveryTicketList.map(obj => {
              if (obj?.productInventory?.some((p) => asset?._id === p?.optionValue)) {
                asset.loadingTicket = obj?.ticketName;
                asset.loadingTicketId = obj?._id;
                asset.loadingTicketStatus = obj?.status;
                if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
                  asset.loadingTicket = obj?.ticketName;
                  asset.loadingTicketId = obj?._id;
                  asset.loadingTicketStatus = obj?.status;
                }
                if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving) {
                  asset.receivingTicket = obj?.ticketName;
                  asset.receivingTicketId = obj?._id;
                  asset.receivingTicketStatus = obj?.status;
                }
                if (obj.ticketType === DELIVERY_TICKET_TYPE.return) {
                  asset.returnTicket = obj?.ticketName;
                  asset.returnTicketId = obj?._id;
                  asset.returnTicketStatus = obj?.status;
                }
              }
            });

            if ([RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(asset.rentalAssetStatus)) {
              isNextStep = true
            }
            else {
              isNextStep = false
            }
            asset.hideSelection = [INVENTORY_STATUS.indTransit, INVENTORY_STATUS.lost].includes(asset.status) || asset?.manualStatus === INVENTORY_STATUS.reserved;
            ele.subRows.push(asset)
          })
          ele.qty = ele.serializedProduct ? assets.length : element.qty;
          rows.push(ele)
        })
      }
      setNextStep(isNextStep)
      setRowsData(rows);
      setSelectedProducts([]);
      if (deliveryTicketList.length) {
        if (deliveryTicketList.filter((e) => [DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return].includes(e.ticketType) &&
          [DELIVERY_TICKET_STATUS.new, DELIVERY_TICKET_STATUS.indTransit].includes(e.status)).length) {
          setShowProcessDeliveryTicket(true)
        }
        else {
          setShowProcessDeliveryTicket(false)
        }
      }
      setUniqueReceivingTicket(deliveryTicketList.filter(d => [DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return].includes(d.ticketType)).map(d => d._id));
    } catch (error) {
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

  const columns: any = [
    {
      accessor: 'detail',
      Header: 'Detail',
      sticky: isMobile ? "none" : "left",
      width: 300,
      Cell: ({ row }) => (
        row?.original?.type === "product" ?
          <Link className="link text-truncate" title={row?.original?.detail} to={`${routes.productDetail.path}/${row?.original?._id}`}>
            {row?.original?.detail}
          </Link>
          : row?.original?.type === "asset" ?
            <Fragment>
              <Link className="link text-truncate" title={row?.original?.detail} to={`${routes.serializedAssetDetail.path}/${row?.original?._id}`}>
                {row?.original?.detail}
              </Link>
              <Chip className="ml-2" label="Asset" size="small" color="primary" />
            </Fragment>
            : <p className="text-truncate">{row?.original?.detail}</p>),
    },
    {
      accessor: 'qty',
      Header: 'Asset Qty',
      width: 80,
      Cell: ({ row }) => (<p>{row?.original?.qty}</p>),
    },
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
      width: 100,
      Cell: ({ row }) => (<p className="text-truncate">{row?.original?.serialNumber ? <p>{row?.original?.serialNumber}</p> : <NoDataCell />}</p>),
    },
    {
      accessor: 'loadingTicket',
      Header: 'Loading Ticket',
      Cell: ({ row }) => (
        row?.original?.loadingTicket ?
          <Link className="link text-truncate" title={row?.original?.loadingTicket} to={`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`}>
            {row?.original?.loadingTicket}
          </Link>
          : <NoDataCell />
      )
    },
    {
      accessor: 'receivingTicket',
      Header: 'Loading Ticket',
      Cell: ({ row }) => (
        row?.original?.receivingTicket ?
          <Link className="link text-truncate" title={row?.original?.receivingTicket} to={`${routes.deliveryTicketDetail.path}/${row?.original?.receivingTicketId}`}>
            {row?.original?.receivingTicket}
          </Link>
          : <NoDataCell />
      )
    },
    {
      accessor: 'returnTicket',
      Header: 'Return Ticket',
      Cell: ({ row }) => (
        row?.original?.returnTicket ?
          <Link className="link text-truncate" title={row?.original?.returnTicket} to={`${routes.deliveryTicketDetail.path}/${row?.original?.returnTicketId}`}>
            {row?.original?.returnTicket}
          </Link>
          : <NoDataCell />
      )
    },
    {
      accessor: 'status',
      Header: 'Asset Status',
      width: 100,
      Cell: ({ row }) => (
        <p className="text-truncate">{row?.original?.status ? <p>{row?.original?.status}</p> : <NoDataCell />}</p>),
    },
    {
      accessor: 'startDate',
      Header: 'Actual Start Date',
      width: 100,
      Cell: ({ row }) => (
        <p className="text-truncate">{row?.original?.startDate ? <p>{moment(row?.original?.startDate?.slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />}</p>),
    },
    {
      accessor: 'endDate',
      Header: 'Actual End Date',
      width: 100,
      Cell: ({ row }) => (
        <p className="text-truncate">{row?.original?.endDate ? <p>{moment(row?.original?.endDate?.slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />}</p>),
    },
    {
      accessor: 'rentalAssetStatus',
      Header: 'Rental Asset Status',
      width: 100,
      Cell: ({ row }) => (
        <p className="text-truncate">{row?.original?.rentalAssetStatus ? <p>{row?.original?.rentalAssetStatus}</p> : <NoDataCell />}</p>),
    }
  ];

  const handleTicketDialog = (ticketType, deliveryToType) => {
    const data = {}
    data["ticketName"] = rentalManagementData.rentalJobName;
    data["refrenceId"] = rentalManagementData._id;
    data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.customer;
    data["pickupFrom"] = rentalManagementData?.customerAccount?.optionValue;
    data["pickupFromAddress"] = selectedAssets[0]?.currentLocation;
    data["deliveryToType"] = deliveryToType;
    if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
      if (selectedAssets.length) {
        data["deliveryTo"] = selectedAssets[0].owner;
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
      .post(`${repairJob.api}/${repairJobId}/assets`, { "ids": selectedAssets?.map(s => s._id) })
      .then(({ data }) => {
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }

  const checkUniqWarehouse = () => {
    if (selectedAssets.length === 0) {
      return false;
    } else if (uniq(map(selectedAssets, "warehouse")).length === 1) {
      return true;
    } else {
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
        <Button variant={isMobile && !isTablet ? 'text' : 'outlined'} color="primary" aria-controls="simple-menu"
          aria-haspopup="true"
          disabled={selectedAssets.length === 0 || isOffline}
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
          {(selectedAssets?.filter(f =>
            ((f.hasOwnProperty("receivingTicketId") && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
              (f.hasOwnProperty("returnTicketId") && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered))
            && [INVENTORY_STATUS.underReview].includes(f.status)
          )?.length === selectedAssets?.length) &&
            <Fragment>
              <MenuItem onClick={() => {
                setAnchorEl(null)
                setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.available, message: "" })
              }}>{INVENTORY_STATUS.available}</MenuItem>
            </Fragment>
          }
          <MenuItem onClick={() => {
            setAnchorEl(null)
            setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.scrap, message: "" })
          }}>{INVENTORY_STATUS.scrap}</MenuItem>
          <MenuItem onClick={() => {
            setAnchorEl(null)
            setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.lost, message: "" })
          }}>{INVENTORY_STATUS.lost}</MenuItem>
        </Menu>
        <Box mx={1} />
        <Button
          variant="outlined"
          color="default"
          size="small"
          onClick={openActions}
          aria-controls="action-menu"
          disabled={(selectedAssets.length === 0)}
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
            disabled={(selectedAssets.length === 0) ||
              (selectedAssets.some(f => f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                || !f.hasOwnProperty("loadingTicketId")
                || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
            onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant) }}>
            Create Receiving Ticket</MenuItem>

          {(selectedAssets.length && selectedAssets?.filter(f => f.hasOwnProperty("receivingTicketId") &&
            f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedAssets?.length) ?
            <MenuItem onClick={() => { setShowRemoveAssetFromReceivingTicketDialog(true) }}>Remove Receiving Ticket</MenuItem>
            : null}

          <MenuItem
            onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant) }}
            disabled={(selectedAssets.length === 0)
              || (selectedAssets.some(f =>
                !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
          >
            Create Return Ticket</MenuItem>


          <MenuItem
            onClick={() => handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier)}
            disabled={(selectedAssets.length === 0)
              || (selectedAssets.some(f =>
                !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                || !f.subleaseAsset || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
          >Create Supplier Delivery Ticket</MenuItem>

          <MenuItem
            onClick={() => {
              setIsExistingRentalJob(true)
              closeActions()
            }}
            disabled={(selectedAssets.length === 0)
              || (selectedAssets.some(f =>
                !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
          >
            {`Transfer to another ${routes.rentalManagement.title}`}</MenuItem>

          {(selectedAssets.length && selectedAssets?.filter(f =>
            ((f.hasOwnProperty("receivingTicketId") && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
              (f.hasOwnProperty("returnTicketId") && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered) || f.status === INVENTORY_STATUS.scrap)
            && [INVENTORY_STATUS.underReview, INVENTORY_STATUS.scrap, INVENTORY_STATUS.available].includes(f.status)
            && !f.subleaseAsset && checkUniqWarehouse()
          )?.length === selectedAssets?.length) ?

            <MenuItem
              onClick={() => setShowRepairJobDialog(true)}
            >Create Repair Job</MenuItem>
            : null}
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
      </Box>
    </Box>
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {(columns && rowsData) ?
        <CustomReactTable
          height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 365px)"}
          columns={columns}
          data={rowsData}
          onSelect={setSelectedRecords}
          childrenProperty="subRows"
          uniqueKey="_id"
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
      }
    </Grid>
    {showTicketDialog.open && (
      <ManageDeliveryTicket
        ticketType={showTicketDialog.ticketType}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        refrenceData={showTicketDialog.data}
        productInventory={selectedAssets}
        products={selectedProducts}
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
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        refrenceData={rentalManagementData}
        productInventory={selectedAssets}
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
          const groupByCalls = groupBy(selectedAssets, 'receivingTicketId');
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
            {[INVENTORY_STATUS.available, INVENTORY_STATUS.repair].includes(statusToUpdate.status) ? <h4>You want to change the status of selected assets to {statusToUpdate.status} ?</h4>
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
              />
            }
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
                assets: selectedAssets.map(m => m?._id ?? m?.id),
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
          _id: rentalManagementData._id, warehouse: selectedAssets[0].warehouse,
          wellName: rentalManagementData?.wellName?.optionValue, afeNumber: rentalManagementData?.afeNumber
        }}
        onClose={() => setShowRepairJobDialog(false)}
        onSuccess={(obj) => {
          handleAddAssetToRepairJob(obj?._id)
          setShowRepairJobDialog(false);
          fetchRecords()
        }}
      />
    }
  </>
  );
};

export default ReceivingTicket;
