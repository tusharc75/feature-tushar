import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, IconButton, Tooltip } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import {
  deliveryTicket,
  gridLoadingTimeout,
  quoteStepColors,
  rentalManagement,
  sidebarResource
} from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import { useHistory } from "react-router-dom";
import { groupBy } from 'lodash';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import { FaSuitcase } from "react-icons/fa";
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';

const renderedFrom = "rentalManagementDetailsPageDeliveryTicket"

const LoadingTicket = ({ currentStep, rentalManagementData, fetchRentalData, setNextStep }) => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [assignedSerializedAsset, setAssignedSerializedAsset] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false)
  const [okBtnLoading, setOkBtnLoading] = useState(false)


  const [productInventoryForDeliveryTicket, setProductInventoryForDeliveryTicket] = useState<any[]>([]);
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    setNextStep(false)
    if (gridApi) {
      gridApi.deselectAll();
    }
    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/inventory`).then(({ data }) => {
      setAssignedSerializedAsset(data.data)
      let productAssets = data.data.map(d => d.inventory).map(u => ({ ...u, productName: u?.product?.optionLabel }))
      dispatch({ type: "loading", loading: true });
      axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/delivery-ticket`).then(({ data }) => {
        data.data.map(obj => {
          if (obj.ticketType === "Loading") {
            productAssets.map((d, index) => {
              if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                productAssets[index]["type"] = obj?.type
                productAssets[index]["deliveryTicket"] = obj?.ticketName
                productAssets[index]["deliveryTicketId"] = obj?._id
              }
            })
          }
        })
        productAssets.forEach((d) => {
          d["hideSelection"] = ["In-Use", "In-Transit", "Repair", "Scrap", "Lost", "Under Review"].includes(d.status);
        })
        if (productAssets.filter((e) => ["In-Use", "Repair", "Scrap", "Lost", "In-Transit", "Under Review"].includes(e.status)).length === productAssets.length) {
          setNextStep(true)
        }
        dispatch({
          type: "initialize", data: productAssets, count: productAssets.length
        });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }).catch((error) => {
      toastConfig.setToastConfig(error)
    });
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
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productNameRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
  ];

  const columnState = JSON.parse(localStorage.getItem("rentalManagementDetailsPageDeliveryTicket"));
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

  return (<>
    <Box display="flex" justifyContent="flex-end" p="4px">
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
        disabled={downlodingFile}
        startIcon={<AiFillFilePdf />}
      >
        {downlodingFile ? "Please wait..." : "Preview"}
      </Button>
      <Box mx={1} />
      <IconButton
        disabled={(selectedRecords.length === 0) || currentStep === 4 || (selectedRecords.some(f => f.hasOwnProperty("deliveryTicketId")))}
        onClick={() => {
          handleDeliveryTicketDialog(selectedRecords, warehouse)
        }}
        color='primary'
        size="small"
      >
        <Tooltip
          title="Create Loading Ticket">
          <AddBoxRoundedIcon />
        </Tooltip>
      </IconButton>
      <Box mx={1} />
      <IconButton
        disabled={(selectedRecords.length === 0) || currentStep === 4 || (selectedRecords.some(f => !f.hasOwnProperty("deliveryTicketId")))}
        onClick={() => {
          setShowRemoveAssetFromLoadingTicketDialog(true)
        }}
        color='primary'
        size="small"
      >
        <Tooltip
          title="Remove Assets From Loading Ticket(s)">
          <RemoveCircleRoundedIcon />
        </Tooltip>
      </IconButton>
      <Box mx={1} />
    </Box>
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {columns ?
        isMobile ?
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={true}
            primaryField={columns?.find(d => d.field)}
            onClick={(data) => {
              history.push(`${routes.deliveryTicketDetail.path}/${data._id}`)
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
                label: "Asset Number : ",
                field: "assetNumber",
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
            allowSelection={true}
            renderedFrom={renderedFrom}
            refreshGrid={fetchRecords}
          />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
      }
    </Grid>
    {showDeliveryTicketDialog && (
      <ManageDeliveryTicket
        ticketType="Loading"
        refrenceType="Rental Job"
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
          message={`Are you sure you want to remove selected records from ${sidebarResource.deliveryTicket}(s) ?`}
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
  </>
  );
}

export default LoadingTicket;

