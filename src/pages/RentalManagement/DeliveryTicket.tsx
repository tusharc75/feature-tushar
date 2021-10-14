import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import AddSerializedAsset from "./AddSerializedAsset";
import { rentalManagement } from "../../constants/helpers";

const DeliveryTicket = ({ warehouselist, productInventory, currentStep, handleDeliveryTicketDialog, rentalManagementId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)

  useEffect(() => {

    if (warehouse) {
      dispatch({
        type: "initialize", data: productInventory.map((u) => ({
          ...u,
          name: u.name || "",
          inventoryId: u?._id,
          costPerDay: u.costing?.costPerDay,
          totalCost: u.costing?.totalCost,
          startDate: u.costing?.startDate,
          dueDate: u.costing?.dueDate,
          deliveryTicket: u.deliveryTicket || "",
          deliveryTicketId: u.deliveryTicketId || "",
          hideSelection: u.deliveryTicket === null || u.deliveryTicket === undefined ? false : true,
        })).filter(d => d.inventory.warehouse.optionValue === warehouse.optionValue), count: productInventory.filter(d => d.inventory.warehouse.optionValue === warehouse.optionValue).length
      });
    }
    else {
      dispatch({
        type: "initialize", data: productInventory.map((u) => ({
          ...u,
          name: u.name || "",
          inventoryId: u?._id,
          costPerDay: u.costing?.costPerDay,
          totalCost: u.costing?.totalCost,
          startDate: u.costing?.startDate,
          dueDate: u.costing?.dueDate,
          deliveryTicket: u.deliveryTicket || "",
          deliveryTicketId: u.deliveryTicketId || "",
          hideSelection: u.deliveryTicket === null || u.deliveryTicket === undefined ? false : true,
        })), count: productInventory.length
      });
    }
    // eslint-disable-next-line
  }, [warehouse, productInventory]);

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
      {params.value}
    </Link>
  );

  const InventoryRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data.inventoryId}`}>
      {params.value}
    </Link>
  );

  const TicketRenderer = (params) => (
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    TicketRenderer: TicketRenderer,
    inventoryRenderer: InventoryRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
  };
  const columns = [
    { field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "productRenderer" },
    { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "qty", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "TicketRenderer" },
    { field: "costPerDay", headerName: "Cost Per Day", show: true, cellRenderer: "commonRenderer" },
    { field: "totalCost", headerName: "Total Cost", show: true, cellRenderer: "commonRenderer" },
    { field: "startDate", headerName: "Start Date", show: true, cellRenderer: "dateRenderer" },
    { field: "dueDate", headerName: "End Date", show: true, cellRenderer: "dateRenderer" },
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

  const handleAddSerializedAsset = (productInventoryArray) => {
    let tempProductArray = productInventoryArray.map(d => { return { "inventory": d._id } })
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`, { "products": tempProductArray })
      .then(({ data }) => {
        setAddSerializedAssetDialog(false)
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
      }).catch((error) => {
        setAddSerializedAssetDialog(false)
        toastConfig.setToastConfig(error)
      });
  };

  return (<>

    <Box display="flex" justifyContent="flex-end">
      <Button
        onClick={() => {
          setDownlodingFile(true);

          axiosInstance().get(`/rental-management/${rentalManagementId}/pdf`)
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
      <Button
        variant="contained"
        color="primary"
        type="button"
        size="small"
        disabled={(selectedRecords.length === 0)}
        onClick={() => {
          setAddSerializedAssetDialog(true)
        }}
      >
        {`Assign ${routes.productInventory.title}`}
      </Button>
      <Box mx={1} />
      <Button
        variant="contained"
        color="primary"
        type="button"
        size="small"
        disabled={(selectedRecords.length === 0) || currentStep === 4}
        onClick={() => {
          handleDeliveryTicketDialog(selectedRecords, warehouse)
        }}
      >
        Create Loading Ticket
      </Button>
    </Box>

    <Grid item xs={12} md={12} sm={12} className="mt-3">

      {columns ?
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
          renderedFrom="rentalManagementDetailsPageDeliveryTicket"
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

      }
    </Grid>
    {addSerializedAssetDialog &&
      <AddSerializedAsset
        addSerializedAsset={handleAddSerializedAsset}
        handleSerializedAssetClose={() => { setAddSerializedAssetDialog(false) }}
        selectedProducts={selectedRecords}
      // type={inventoryType}
      />
    }
  </>
  );
}

export default DeliveryTicket;

