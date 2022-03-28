import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Tooltip, Menu, MenuItem, Dialog, Chip, TextField, CircularProgress } from "@material-ui/core";
import { AiFillFilePdf, AiOutlineLoading3Quarters } from 'react-icons/ai';
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import {
  deliveryTicket,
  rentalManagement,
  sidebarResource,
  INVENTORY_STATUS,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFRENCE_TYPE,
  serializedAsset,
  DELIVERY_FROM_TO_TYPE,
  treeToFlatArray
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import { isMobile, isTablet } from 'react-device-detect';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { getRentalProductAssets, getRentalDeliveryTicket } from './../rentalOfflineHelper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { makeStyles } from '@material-ui/core/styles';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import MultipleTicket from "../../DeliveryTicket/MultipleTicket";
import { groupBy, uniq, uniqBy, map } from "lodash";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import NoDataCell from "../../../components/Helpers/NoDataCell";

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

const LoadingTicket = ({ currentStep, rentalManagementData, fetchRentalData, setNextStep, renderedFrom, stepFullScreen }) => {

  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();

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

  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([])

  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    let flatArray = treeToFlatArray(selectedRecords, "subRows");
    flatArray = uniqBy(flatArray, '_id')
    setSelectedAssets(flatArray?.filter((ele) => ele.type === "asset" && !ele.hideSelection))
    setSelectedProducts(flatArray?.filter((ele) => ele.type === "product" && !ele.serializedProduct))
  }, [selectedRecords]);

  const fetchRecords = async () => {
    setNextStep(false);
    try {
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      const rows = []
      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id)
        productAssets = productAssets?.map(u => ({
          ...u,
          productName: u?.product?.optionLabel,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue
        }))
        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id)
      }
      else {
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)

        const result = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`)
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
              ele.loadingTicket = obj?.ticketName;
              ele.loadingTicketId = obj?._id;
              ele.loadingTicketStatus = obj?.status;
            }
          });
          ele.hideSelection = ele.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered;

          ele.subRows = [];
          const assets = productAssets?.filter((e) => e._id === element._id)
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
            deliveryTicketList.map(obj => {
              if (obj?.productInventory?.some((p) => asset?._id === p?.optionValue)) {
                asset.loadingTicket = obj?.ticketName;
                asset.loadingTicketId = obj?._id;
                asset.loadingTicketStatus = obj?.status;
              }
            });
            asset.hideSelection =
              [
                INVENTORY_STATUS.inUse,
                INVENTORY_STATUS.indTransit,
                INVENTORY_STATUS.repair,
                INVENTORY_STATUS.scrap,
                INVENTORY_STATUS.lost,
                INVENTORY_STATUS.underReview
              ].includes(asset.status) || asset.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered || asset?.manualStatus === INVENTORY_STATUS.reserved;

            ele.subRows.push(asset)
          })
          if (ele.subRows.length) {
            ele.hideSelection = ele.subRows?.some((e) => !e.hideSelection) ? false : true;
          }

          ele.qty = ele.serializedProduct ? assets.length : element.qty;
          if (rows.filter((e) => e._id === ele._id).length) {
            rows.forEach((e) => {
              if (e._id === ele._id) {
                e.qty += ele.qty;
                e.subRows = [...ele.subRows, ...e.subRows];
              }
            })
          }
          else {
            rows.push(ele)
          }
        })
      }
      setRowsData(rows);
      setSelectedProducts([]);

      if (deliveryTicketList.filter((e) => e.status === DELIVERY_TICKET_STATUS.delivered).length > 0) {
        setNextStep(true);
      }
      if (deliveryTicketList.length) {
        if ((deliveryTicketList.filter((e) => [DELIVERY_TICKET_STATUS.new, DELIVERY_TICKET_STATUS.indTransit].includes(e.status))).length > 0) {
          setShowProcessDeliveryTicket(true)
        }
        else {
          setShowProcessDeliveryTicket(false)
        }
      }
      setUniqueLoadingTicket(deliveryTicketList?.map(d => d._id));
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const columns: any = [
    {
      accessor: 'detail',
      Header: 'Detail',
      sticky: isMobile ? "none" : "left",
      Cell: ({ row }) => (
        row?.original?.type === "product" ?
          <Fragment>
            <Link className="link text-truncate" title={row?.original?.detail} to={`${routes.productDetail.path}/${row?.original?._id}`}>
              {row?.original?.detail}
            </Link>
            <Chip className="ml-2" label="Product" size="small" color="primary" />
          </Fragment>
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
      Cell: ({ row }) => (<p>{row?.original?.qty}</p>),
    },
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
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
      accessor: 'status',
      Header: 'Asset Status',
      Cell: ({ row }) => (
        <p className="text-truncate">{row?.original?.status ? <p>{row?.original?.status}</p> : <NoDataCell />}</p>),
    }
  ];

  const handleDeliveryTicketDialog = () => {
    if (selectedAssets.length) {
      const data = {}
      data["ticketName"] = rentalManagementData.rentalJobName;
      data["refrenceId"] = rentalManagementData._id;

      if (selectedAssets[0].warehouse) {
        data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.plant;
        data["pickupFrom"] = selectedAssets[0].warehouse;
        data["pickupFromAddress"] = selectedAssets[0].currentLocation;
      }
      else {
        data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.supplier;
        data["pickupFrom"] = selectedAssets[0].currentOwner;
        data["pickupFromAddress"] = selectedAssets[0].currentLocation;
      }
      data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.customer;
      data["deliveryTo"] = rentalManagementData?.customerAccount?.optionValue;
      data["deliveryToAddress"] = rentalManagementData.shippingAddress?.optionValue;

      data["startDate"] = rentalManagementData?.estimateStartDate;
      data["endDate"] = rentalManagementData?.estimateStartDate;
      data["isPickupFromDisable"] = true;
      data["isDeliveryToDisable"] = true;

      data["wellName"] = rentalManagementData?.wellName?.optionValue;
      data["afeNumber"] = rentalManagementData?.afeNumber;
      if (rentalManagementData?.processor?.optionValue) {
        data["processor"] = rentalManagementData?.processor?.optionValue;
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

  const checkUniqWarehouse = () => {
    if (selectedAssets.length === 0) {
      return true;
    } else if (uniq(map(selectedAssets, "warehouse")).length === 1) {
      return false;
    } else {
      return true;
    }
  };

  return (<>
    <Box display="flex" justifyContent="flex-end" pt={1}>
      <Box display="flex" alignItems="center">
        {!isMobile && <Button
          onClick={() => {
            setDownlodingFile(true);
            axiosInstance().post(`/delivery-ticket/pdf`, { "ids": uniqueLoadingTicket })
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
          disabled={downlodingFile || isOffline || uniqueLoadingTicket.length === 0}
          startIcon={<AiFillFilePdf />}
        >
          {downlodingFile ? "Please wait..." : "Preview"}
        </Button>}
        <Box mx={1} />
        <Button
          variant={isMobile && !isTablet ? 'text' : 'outlined'}
          color="primary"
          aria-controls="simple-menu"
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
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => {
            setAnchorEl(null)
            setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.scrap, message: "" })
          }}>Scrap</MenuItem>
          <MenuItem onClick={() => {
            setAnchorEl(null)
            setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.lost, message: "" })
          }}>Lost</MenuItem>
        </Menu>
        <Box mx={1} />
        <Tooltip title={(checkUniqWarehouse() && selectedAssets.length > 1) ? "Selected assets are located in several locations."
          : "Create Loading Ticket"}>
          <span>
            <Button
              onClick={() => { handleDeliveryTicketDialog() }}
              variant={isMobile && !isTablet ? "text" : "outlined"}
              color="primary"
              size="small"
              disabled={(selectedAssets.length === 0) || (selectedAssets.some(f => f.hasOwnProperty("loadingTicketId")) || checkUniqWarehouse())}
            >
              {'Create Loading Ticket'}
            </Button>
          </span>
        </Tooltip>
        <Box mx={1} />
        {(selectedAssets.length && selectedAssets?.filter(f => f.hasOwnProperty("loadingTicketId") &&
          f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedAssets?.length) ?
          <Fragment>
            <Tooltip
              title="Remove Assets From Loading Ticket(s)">
              <Button
                onClick={() => {
                  setShowRemoveTicketDialog(true)
                }}
                variant={isMobile && !isTablet ? "text" : "outlined"}
                color="primary"
                size="small"
                style={isMobile && !isTablet ? { color: "var(--danger-light)" } : {}}
                disabled={(selectedAssets.length === 0) || currentStep === 4 || (selectedAssets.some(f => !f.hasOwnProperty("loadingTicketId")))}
              >
                {isMobile && !isTablet ? <IoRemoveCircleOutline size={22} /> : "Remove Loading Ticket"}
              </Button>
            </Tooltip>
            <Box mx={1} />
          </Fragment> : null
        }
        {(showProcessDeliveryTicket && !isOffline) &&
          <Fragment>
            <Tooltip
              title="Process Multiple Loading Ticket(s)">
              <Button
                onClick={() => {
                  setOpenDeliveryTicketDialog(true)
                }}
                variant={isMobile && !isTablet ? "text" : "contained"}
                color="primary"
                size="small"
              >
                {isMobile && !isTablet ? <AddBoxRoundedIcon /> : "Process Loading Ticket"}
              </Button>
            </Tooltip>
            <Box mx={1} />
          </Fragment>}
      </Box>
    </Box>
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {(columns && rowsData) ?
        <CustomReactTable
          height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 365px)"}
          columns={columns}
          data={rowsData}
          setCellColor={(rowData) => {
            if ([INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost].includes(rowData?.status)) return "error";
            return "";
          }}
          onSelect={setSelectedRecords}
          childrenProperty="subRows"
          uniqueKey="_id"
          renderedFrom="rental_management_loading_ticket"
          isClientSideGrid={true}
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
      }
    </Grid>
    {
      showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
          refrenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          productInventory={selectedAssets}
          products={selectedProducts}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
            fetchRentalData()
          }}
        />
      )
    }
    {
      showRemoveTicketDialog && (
        <ConfirmationDialog
          open={showRemoveTicketDialog}
          message={`Are you sure you want to remove selected records from Loading Ticket?`}
          onClose={() => {
            setShowRemoveTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);
            const groupByCalls = groupBy(selectedAssets, 'loadingTicketId');
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
      )
    }
    {
      statusToUpdate.open && (
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
            <Button
              size="small"
              variant="outlined" color="primary" onClick={() => setStatusToUpdate(prevState => ({ ...prevState, open: false }))}>
              Cancel
            </Button>
            <Button
              size="small"
              onClick={() => {
                setStatusToUpdate(prevState => ({ ...prevState, isUpdating: true }));
                axiosInstance().put(`${serializedAsset.api}/update-status`, {
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
      )
    }
    {
      openDeliveryTicketDialog &&
      <MultipleTicket
        refrenceData={rentalManagementData}
        ticketType={[DELIVERY_TICKET_TYPE.loading]}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        handleClose={() => {
          setOpenDeliveryTicketDialog(false)
          fetchRecords()
        }}
      />
    }
  </>
  );
};

export default LoadingTicket;
