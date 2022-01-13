import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, IconButton, Tooltip, Menu, MenuItem, Dialog, TextField, CircularProgress } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
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
  productInventory
} from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import { useHistory } from "react-router-dom";
import { groupBy } from 'lodash';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { getRentalProductAssets, getRentalDeliveryTicket } from './../rentalOfflineHelper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { makeStyles } from '@material-ui/core/styles';
import MultipleTicket from "../../DeliveryTicket/MultipleTicket";

const renderedFrom = "rentalManagementDetailsPageDeliveryTicket"

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  paper: {
    width: '80%',
    maxHeight: 435,
  },
}));

const LoadingTicket = ({ currentStep, rentalManagementData, fetchRentalData, setNextStep }) => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const classes = useStyles();

  const [gridApi, setGridApi] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false)
  const [okBtnLoading, setOkBtnLoading] = useState(false)

  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: "", message: "" })
  const [anchorEl, setAnchorEl] = useState(null);

  const [productInventoryForDeliveryTicket, setProductInventoryForDeliveryTicket] = useState<any[]>([]);
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);


  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setNextStep(false)
    try {
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      if (gridApi) {
        gridApi.deselectAll();
      }
      var productAssets: any = []
      var deliveryTicketList: any = []
      dispatch({ type: "loading", loading: true });
      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id)
        productAssets = productAssets?.map(u => ({ ...u, productName: u?.product?.optionLabel }))
        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id)
      }
      else {
        const response = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/inventory`)
        productAssets = response?.data?.data
        productAssets = productAssets.map(d => d.inventory).map(u => ({ ...u, productName: u?.product?.optionLabel }))

        const result = await axiosInstance().get(`${deliveryTicket.deliveryTicketApi}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`)
        deliveryTicketList = result?.data?.data
      }
      if (deliveryTicketList.length) {
        if (deliveryTicketList.filter((e) => [DELIVERY_TICKET_STATUS.new, DELIVERY_TICKET_STATUS.indTransit].includes(e.status)).length) {
          setShowProcessDeliveryTicket(true)
        }
      }
      deliveryTicketList.map(obj => {
        if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
          productAssets.map((d, index) => {
            if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
              productAssets[index]["type"] = obj?.type
              productAssets[index]["deliveryTicket"] = obj?.ticketName
              productAssets[index]["deliveryTicketId"] = obj?._id
              productAssets[index]["deliveryTicketStatus"] = obj?.status
            }
          })
        }
      })
      productAssets.forEach((d) => {
        d["isChecked"] = false;
        d["hideSelection"] = [INVENTORY_STATUS.inUse, INVENTORY_STATUS.indTransit, INVENTORY_STATUS.repair,
        INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost, INVENTORY_STATUS.underReview].includes(d.status)
          || d.deliveryTicketStatus === DELIVERY_TICKET_STATUS.delivered
      })
      if (productAssets.filter((e) => e.deliveryTicketStatus === DELIVERY_TICKET_STATUS.delivered).length > 0) {
        setNextStep(true)
      }
      dispatch({ type: "initialize", data: productAssets, count: productAssets.length });
      setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
    }
    catch (error) {
      dispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error);
    }
  }

  const TicketRenderer = (params) => (
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );

  const InventoryRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
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
    commonRenderer: CommonRenderer,
  };

  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "inventoryRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "ticketRenderer" },
    { field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "productNameRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
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

  const handleDeliveryTicketDialog = (selectedProductInventory, warehouse) => {
    setProductInventoryForDeliveryTicket(selectedProductInventory);
    setShowDeliveryTicketDialog(true);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (<>
    <Box display="flex" justifyContent="flex-end" pt={1}>
      <Box display="flex" alignItems="center">
        <Button
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
          variant="outlined"
          color="primary"
          type="button"
          size="small"
          disabled={downlodingFile || isOffline}
          startIcon={<AiFillFilePdf />}
        >
          {downlodingFile ? "Please wait..." : "Preview"}
        </Button>
        <Box mx={1} />
        <Button variant="outlined" color="primary" aria-controls="simple-menu"
          aria-haspopup="true"
          disabled={selectedRecords.length === 0 || isOffline}
          size="small"
          onClick={handleClick}
          endIcon={<ArrowDropDownIcon />}>
          Change Status
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
        <Tooltip
          title="Create Loading Ticket">
          <Button
            onClick={() => {
              handleDeliveryTicketDialog(selectedRecords, warehouse)
            }}
            variant="outlined"
            color="primary"
            size="small"
            disabled={(selectedRecords.length === 0) || (selectedRecords.some(f => f.hasOwnProperty("deliveryTicketId")))}
          >
            Create Loading Ticket
          </Button>
        </Tooltip>
        <Box mx={1} />
        <Tooltip
          title="Remove Assets From Loading Ticket(s)">
          <Button
            onClick={() => {
              setShowRemoveAssetFromLoadingTicketDialog(true)
            }}
            variant="outlined"
            color="primary"
            size="small"
            disabled={(selectedRecords.length === 0) || currentStep === 4 || (selectedRecords.some(f => !f.hasOwnProperty("deliveryTicketId")))}
          >
            Remove Assets
          </Button>
        </Tooltip>
        <Box mx={1} />
        {(showProcessDeliveryTicket && !isOffline) &&
          <Fragment>
            <Tooltip
              title="Process Multiple Loading Ticket(s)">
              <Button
                onClick={() => {
                  setOpenDeliveryTicketDialog(true)
                }}
                variant="outlined"
                color="primary"
                size="small"
              >
                Process Loading Ticket
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
              history.push(`${routes.productInventoryDetail.path}/${data._id}`)
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
                field: "deliveryTicket",
                onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.deliveryTicketId}`)
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
    {showDeliveryTicketDialog && (
      <ManageDeliveryTicket
        ticketType={DELIVERY_TICKET_TYPE.loading}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        refrenceData={rentalManagementData}
        onClose={() => setShowDeliveryTicketDialog(false)}
        productInventory={productInventoryForDeliveryTicket}
        warehouseId={rentalManagementData?.warehouse}
        onSuccess={() => {
          setShowDeliveryTicketDialog(false);
          fetchRecords();
        }}
      />
    )}
    {
      showRemoveAssetFromLoadingTicketDialog && (
        <ConfirmationDialog
          open={showRemoveAssetFromLoadingTicketDialog}
          message={`Are you sure you want to remove selected records from Loading Ticket?`}
          onClose={() => {
            setShowRemoveAssetFromLoadingTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);

            const groupByCalls = groupBy(selectedRecords, "deliveryTicketId");
            let apiCalls = [];

            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(axiosInstance().put(`${deliveryTicket.deliveryTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map(m => m._id) }));
            })

            Promise.all(apiCalls).then(() => {
              toastConfig.setToastConfig({ open: true, type: "success", message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)` });
              fetchRecords();
            }).catch((error) => {
              toastConfig.setToastConfig(error);
            }).finally(() => {
              setOkBtnLoading(false);
              setShowRemoveAssetFromLoadingTicketDialog(false);
            });

          }}
          okBtnLoading={okBtnLoading}
        />
      )
    }
    {
      statusToUpdate.open && <Dialog open
        classes={{
          paper: classes.paper,
        }}
        onClose={() => setStatusToUpdate(prevState => ({ ...prevState, isUpdating: false, open: false }))}
      >
        <CustomDialogHeader title="Are you sure ?"
          showRequiredLabel={false}
          onClose={() => setStatusToUpdate(prevState => ({ ...prevState, isUpdating: false, open: false }))} />

        <CustomDialogContent>
          <Box className="my-2">
            {
              statusToUpdate.status === "Repair" ? <h4>You want to change the status of selected assets to {statusToUpdate.status} ?</h4>
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
              axiosInstance().put(`${productInventory.api}/update-status`, {
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
    }
    {openDeliveryTicketDialog &&
      <MultipleTicket
        refrenceData={rentalManagementData}
        ticketType={DELIVERY_TICKET_TYPE.loading}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        handleClose={() => {
          setOpenDeliveryTicketDialog(false)
          fetchRecords()
        }}
      />}
  </>
  );
}

export default LoadingTicket;

