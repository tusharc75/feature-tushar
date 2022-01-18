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
  sidebarResource, productInventory as productInventoryHelperObject, INVENTORY_STATUS, DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE, DELIVERY_TICKET_REFRENCE_TYPE,
  repairJob
} from "../../../constants/helpers";
import { groupBy } from "lodash";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
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
import { RiExchangeFundsLine } from 'react-icons/ri';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import MultipleTicket from "../../DeliveryTicket/MultipleTicket";
import ManageRepairJob from '../../RepairJob/ManageRepairJob'

const renderedFrom = 'rentalManagementDetailsPageReceivingTicket';

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

const ReceivingTicket = ({ currentStep, rentalManagementData, setNextStep }) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);

  const [productInventoryForTicket, setProductInventoryForTicket] = useState<any[]>([]);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: "" });

  const { isOffline } = useContext(CustomOfflineContext);

  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);

  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    fetchRecords();
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
      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map((u) => ({ ...u, productName: u?.product?.optionLabel }));
        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);
      } else {
        const response = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/inventory`);
        productAssets = response?.data?.data;
        productAssets = productAssets.map((d) => d.inventory).map((u) => ({ ...u, productName: u?.product?.optionLabel }));

        const result = await axiosInstance().get(`${deliveryTicket.deliveryTicketApi}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalManagementData._id}`)
        deliveryTicketList = result?.data?.data
      }

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
        });
      });
      productAssets.forEach((d) => {
        d["isChecked"] = false;
        d["hideSelection"] = [INVENTORY_STATUS.indTransit, INVENTORY_STATUS.lost].includes(d.status);
      })
      if (productAssets.filter((e) => [INVENTORY_STATUS.underReview, INVENTORY_STATUS.available, INVENTORY_STATUS.repair, INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost].includes(e.status)).length === productAssets.length) {
        setNextStep(true)
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

  const InventoryRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data?.product?.optionValue}`}>
      {params.value}
    </Link>
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
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "inventoryRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "productNameRenderer" },
    { field: "loadingTicket", headerName: "Loading Ticket", show: true, cellRenderer: "deliveryTicketRenderer" },
    { field: "receivingTicket", headerName: "Receiving Ticket", show: true, cellRenderer: "receivingTicketRenderer" },
    { field: "returnTicket", headerName: "Return Ticket", show: true, cellRenderer: "returnTicketRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
  ];

  const columnState = JSON.parse(localStorage.getItem('rentalManagementDetailsPageReceivingTicket'));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const handleTicketDialog = (selectedProductInventory, ticketType) => {
    setProductInventoryForTicket(selectedProductInventory);
    setShowTicketDialog({ open: true, ticketType: ticketType });
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.repairJobApi}/${repairJobId}/add-assets`, { "ids": selectedRecords?.map(s => s._id) })
      .then(({ data }) => {
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }


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
          variant={isMobile && !isTablet ? 'text' : 'outlined'}
          color="primary"
          type="button"
          size="small"
          disabled={downlodingFile || isOffline}
          startIcon={isMobile ? '' : <AiFillFilePdf />}
          style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}

        >
          {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : downlodingFile ? "Please wait..." : "Preview"}
        </Button>
        <Box mx={1} />
        <Button variant={isMobile && !isTablet ? 'text' : 'outlined'} color="primary" aria-controls="simple-menu"
          aria-haspopup="true"
          disabled={selectedRecords.length === 0 || isOffline}
          size="small"
          onClick={handleClick}
          style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
          endIcon={<ArrowDropDownIcon />}>
          {isMobile && !isTablet ? <RiExchangeFundsLine size={20} /> : 'Change Status'}

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
              <MenuItem onClick={() => {
                setAnchorEl(null)
                setStatusToUpdate({ open: true, isUpdating: false, status: INVENTORY_STATUS.repair, message: "" })
              }}>{INVENTORY_STATUS.repair}</MenuItem>
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
        <Tooltip title="Create Receiving Ticket">
          <Button
            variant={isMobile && !isTablet ? "text" : "outlined"}
            color="primary"
            size="small"
            style={isMobile && !isTablet ? { color: "#FFD700" } : {}}
            onClick={() => {
              handleTicketDialog(selectedRecords, DELIVERY_TICKET_TYPE.receiving)
            }}
            disabled={(selectedRecords.length === 0)
              || (selectedRecords.some(f => f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                || !f.hasOwnProperty("loadingTicketId")
                || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
          >
            {isMobile && !isTablet ? <AiOutlineDeliveredProcedure size={18} /> : 'Create Receiving Ticket'}
          </Button>
        </Tooltip>
        <Box mx={1} />
        {(selectedRecords.length && selectedRecords?.filter(f => f.hasOwnProperty("receivingTicketId") &&
          f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedRecords?.length) ?
          <Fragment>
            <Tooltip title="Remove Assets From Receiving Ticket(s)">
              <Button
                variant={isMobile && !isTablet ? "text" : "outlined"}
                color="primary"
                size="small"
                style={isMobile && !isTablet ? { color: "var(--danger-light)" } : {}}
                onClick={() => {
                  setShowRemoveAssetFromReceivingTicketDialog(true)
                }}
                disabled={(selectedRecords.length === 0) || (selectedRecords.some(f =>
                  !f.hasOwnProperty("receivingTicketId") || [INVENTORY_STATUS.underReview].includes(f.status)
                  || f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered))}
              >
                {isMobile && !isTablet ? <IoRemoveCircleOutline size={22} /> : "Remove Receiving Ticket"}
              </Button>
            </Tooltip>
            <Box mx={1} />
          </Fragment> : null
        }
        <Tooltip title="Create Return Ticket">
          <Button
            variant={isMobile && !isTablet ? "text" : "outlined"}
            color="primary"
            size="small"
            style={isMobile && !isTablet ? { color: "#FFD700" } : {}}
            onClick={() => {
              handleTicketDialog(selectedRecords, DELIVERY_TICKET_TYPE.return)
            }}
            disabled={(selectedRecords.length === 0)
              || (selectedRecords.some(f =>
                !f.hasOwnProperty("loadingTicketId") || f.hasOwnProperty("receivingTicketId") || f.hasOwnProperty("returnTicketId")
                || [INVENTORY_STATUS.lost].includes(f.status) || ![INVENTORY_STATUS.inUse, INVENTORY_STATUS.scrap].includes(f.status)))}
          >
            {isMobile && !isTablet ? <AiOutlineDeliveredProcedure size={18} /> : 'Create Return Ticket'}
          </Button>
        </Tooltip>

        {(selectedRecords.length && selectedRecords?.filter(f =>
        ((f.hasOwnProperty("receivingTicketId") && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
          (f.hasOwnProperty("returnTicketId") && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered))
          && [INVENTORY_STATUS.underReview].includes(f.status)
        )?.length === selectedRecords?.length) ?
          <Fragment>
            <Box mx={1} />
            <Tooltip title="Create Repair Job">
              <Button
                variant={isMobile && !isTablet ? "text" : "outlined"}
                color="primary"
                size="small"
                style={isMobile && !isTablet ? { color: "#FFD700" } : {}}
                onClick={() => {
                  setShowRepairJobDialog(true)
                }}
              >
                {isMobile && !isTablet ? <AiOutlineDeliveredProcedure size={18} /> : 'Create Repair Job'}
              </Button>
            </Tooltip>
          </Fragment> : null}

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
      </Box>
    </Box>
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {columns ? (
        isMobile ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={true}
            primaryField={columns?.find((d) => d.field)}
            onClick={(data) => {
              history.push(`${routes.productInventoryDetail.path}/${data._id}`);
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
            rowClassRules={{
              'red-data-row': function (params) {
                return [INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost].some((s) => s === params.data.status);
              }
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
        refrenceType="Rental Job"
        refrenceData={rentalManagementData}
        productInventory={productInventoryForTicket}
        onClose={() => setShowTicketDialog({ open: false, ticketType: "" })}
        onSuccess={() => {
          setShowTicketDialog({ open: false, ticketType: "" });
          fetchRecords();
        }}
        warehouseId={rentalManagementData?.warehouse}
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
              axiosInstance().put(`${deliveryTicket.deliveryTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map((m) => m._id) })
            );
          });
          Promise.all(apiCalls)
            .then(() => {
              toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: `Selected records removed from assiged ${sidebarResource.receivingTicket}(s)`
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
        refrenceData={rentalManagementData}
        inventories={selectedRecords?.map(s => s._id)}
        open={showRepairJobDialog}
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
