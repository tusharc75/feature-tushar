import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Tooltip, Menu, MenuItem, Dialog, TextField, CircularProgress } from "@material-ui/core";
import { AiFillFilePdf, AiOutlineLoading3Quarters } from 'react-icons/ai';
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import {
  deliveryTicket,
  gridLoadingTimeout,
  rentalManagement,
  sidebarResource,
  INVENTORY_STATUS,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFRENCE_TYPE,
  serializedAsset,
  DELIVERY_FROM_TO_TYPE
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { useHistory } from 'react-router-dom';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { getRentalProductAssets, getRentalDeliveryTicket } from './../rentalOfflineHelper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { makeStyles } from '@material-ui/core/styles';
import { RiExchangeFundsLine } from 'react-icons/ri';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import MultipleTicket from "../../DeliveryTicket/MultipleTicket";
import { groupBy, uniq, map } from "lodash";
import { camelCase } from "lodash";


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

const LoadingTicket = ({ currentStep, rentalManagementData, fetchRentalData, setNextStep }) => {

  const renderedFrom = camelCase(`${routes.rentalManagement.title}4`);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const classes = useStyles();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);


  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showRemoveTicketDialog, setShowRemoveTicketDialog] = useState(false);

  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setNextStep(false);
    try {
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      if (gridApi) {
        gridApi.deselectAll();
      }
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      dispatch({ type: 'loading', loading: true });
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
        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`)
        productAssets = response?.data?.data
        productAssets = productAssets.map(d => d.inventory).map(u => ({
          ...u,
          productName: u?.product?.optionLabel,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          currentLocation: u?.currentLocation?.optionValue,
        }))
        const result = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`)
        deliveryTicketList = result?.data?.data
      }
      if (deliveryTicketList.length) {
        if ((deliveryTicketList.filter((e) => [DELIVERY_TICKET_STATUS.new, DELIVERY_TICKET_STATUS.indTransit].includes(e.status))).length > 0) {
          setShowProcessDeliveryTicket(true)
        }
        else {
          setShowProcessDeliveryTicket(false)
        }
      }
      deliveryTicketList.map(obj => {
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
        d['isChecked'] = false;
        d['hideSelection'] =
          [
            INVENTORY_STATUS.inUse,
            INVENTORY_STATUS.indTransit,
            INVENTORY_STATUS.repair,
            INVENTORY_STATUS.scrap,
            INVENTORY_STATUS.lost,
            INVENTORY_STATUS.underReview
          ].includes(d.status) || d.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered || d?.manualStatus === INVENTORY_STATUS.reserved;
      });
      if (productAssets.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length > 0) {
        setNextStep(true);
      }
      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
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

  const WarehouseRenderer = (params) => (
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.warehouseDetail.path}/${params.data?.warehouse?.optionValue}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );

  const InventoryRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.product?.optionValue}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    inventoryRenderer: InventoryRenderer,
    warehouseRenderer: WarehouseRenderer,
    commonRenderer: CommonRenderer
  };

  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, disabled: true, cellRenderer: "inventoryRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "productName", headerName: "Product Type", show: true, cellRenderer: "productNameRenderer" },
    { field: "warehouse", headerName: "Plant", show: false, cellRenderer: "warehouseRenderer" },
    { field: "loadingTicket", headerName: "Loading Ticket", show: true, cellRenderer: "ticketRenderer" },
    { field: "status", headerName: "Asset Status", show: true, cellRenderer: "commonRenderer" },
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
      const data = {}
      data["ticketName"] = rentalManagementData.rentalJobName;
      data["refrenceId"] = rentalManagementData._id;

      if (selectedRecords[0].warehouse) {
        data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.plant;
        data["pickupFrom"] = selectedRecords[0].warehouseId;
        data["pickupFromAddress"] = selectedRecords[0].currentLocation;
      }
      else {
        data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.supplier;
        data["pickupFrom"] = selectedRecords[0].currentOwner;
        data["pickupFromAddress"] = selectedRecords[0].currentLocation;
      }
      data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.customer;
      data["deliveryTo"] = rentalManagementData?.customerAccount?.optionValue;
      data["deliveryToAddress"] = rentalManagementData.shippingAddress?.optionValue;

      data["startDate"] = rentalManagementData?.estimateStartDate;
      data["endDate"] = rentalManagementData?.estimateStartDate;

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
    if (selectedRecords.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, "warehouseId")).length === 1) {
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
            axiosInstance().get(`/rental-management/${rentalManagementData._id}/pdf`)
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
          disabled={downlodingFile || isOffline}
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
          disabled={selectedRecords.length === 0 || isOffline}
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
        <Tooltip title={selectedRecords.length === 0 ? "Create Loading Ticket" : "Selected assets are located in various locations."}>
          <span>
            <Button
              onClick={() => { handleDeliveryTicketDialog() }}
              variant={isMobile && !isTablet ? "text" : "outlined"}
              color="primary"
              size="small"
              disabled={(selectedRecords.length === 0)
                || (selectedRecords.some(f => f.hasOwnProperty("loadingTicketId")) || checkUniqWarehouse())}
            >
              {'Create Loading Ticket'}
            </Button>
          </span>
        </Tooltip>
        <Box mx={1} />
        {(selectedRecords.length && selectedRecords?.filter(f => f.hasOwnProperty("loadingTicketId") &&
          f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedRecords?.length) ?
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
                disabled={(selectedRecords.length === 0) || currentStep === 4 || (selectedRecords.some(f => !f.hasOwnProperty("loadingTicketId")))}
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
      {columns ?
        isMobile && !isTablet ?
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={true}
            primaryField={columns?.find(d => d.field)}
            onClick={(data) => {
              history.push(`${routes.serializedAssetDetail.path}/${data._id}`)
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
            additionalDetails={[
            ]}
            chips={[
              {
                label: "Status : ",
                field: "status",
              },
              {
                label: "Loading Ticket : ",
                field: "loadingTicket",
                onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`)
              }
            ]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom={renderedFrom}
          /> :
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
            allowSelection={true}
            rowClassRules={{
              "red-data-row":
                function (params) {
                  return [INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost].some(s => s === params.data.status);
                },
            }}
            renderedFrom={renderedFrom}
            refreshGrid={fetchRecords}
          />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
      }
    </Grid>
    {showTicketDialog.open && (
      <ManageDeliveryTicket
        ticketType={DELIVERY_TICKET_TYPE.loading}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        refrenceData={showTicketDialog.data}
        onClose={() => setShowTicketDialog({ open: false, data: {} })}
        productInventory={selectedRecords}
        onSuccess={() => {
          setShowTicketDialog({ open: false, data: {} });
          fetchRecords();
          fetchRentalData()
        }}
      />
    )}
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

            const groupByCalls = groupBy(selectedRecords, 'loadingTicketId');
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
        ticketType={[DELIVERY_TICKET_TYPE.loading]}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        handleClose={() => {
          setOpenDeliveryTicketDialog(false)
          fetchRecords()
        }}
      />}
  </>
  );
};

export default LoadingTicket;
