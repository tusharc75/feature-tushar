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
import { gridLoadingTimeout, rentalManagement } from "../../constants/helpers";

const DeliveryTicket = ({ warehouselist, productInventory, currentStep, handleDeliveryTicketDialog, rentalManagementId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [assignedSerializedAsset, setAssignedSerializedAsset] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)

  useEffect(() => {
    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`)
      .then(({ data }) => {
        setAddSerializedAssetDialog(false)
        setAssignedSerializedAsset(data.data)
        dispatch({ type: "loading", loading: true });
        if (warehouse) {
          dispatch({
            type: "initialize", data: productInventory.map((u) => ({
              ...u,
              serializedAsset: data.data?.filter(d => d.inventory?.product?.optionValue === u._id || u.products?.some(obj => d.inventory?.product?.optionValue === obj?.productId)).map(d => d.inventory?.serialNumber),
              deliveryTicket: u.deliveryTicket || "",
              deliveryTicketId: u.deliveryTicketId || "",
            })).filter(d => d.inventory.warehouse.optionValue === warehouse.optionValue), count: productInventory.filter(d => d.inventory.warehouse.optionValue === warehouse.optionValue).length
          });
          setTimeout(() => {
            dispatch({ type: "loading", loading: false });
          }, gridLoadingTimeout);
        }
        else {
          dispatch({
            type: "initialize", data: productInventory.map((u) => ({
              ...u,
              serializedAsset: data.data?.filter(d => d.inventory?.product?.optionValue === u._id || u.products?.some(obj => d.inventory?.product?.optionValue === obj?.productId)).map(d => d.inventory?.serialNumber),
              deliveryTicket: u.deliveryTicket || "",
              deliveryTicketId: u.deliveryTicketId || "",
            })), count: productInventory.length
          });
          setTimeout(() => {
            dispatch({ type: "loading", loading: false });
          }, gridLoadingTimeout);
        }
      }).catch((error) => {
        setAddSerializedAssetDialog(false)
        toastConfig.setToastConfig(error)
      });
    // eslint-disable-next-line
  }, [warehouse, productInventory]);

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
      {params.value}
    </Link>
  );

  const SerializedAssetRenderer = (params) => (
    <h5 className="createBy d-flex">
      {params.data?.serializedAsset[0]}
      {params.data?.serializedAsset?.length > 0 && (
        <span className="createdAtTime badge-date">{`+${params.data?.serializedAsset.length} more..`}</span>
      )}
    </h5>
  )

  const TicketRenderer = (params) => (
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );

  const ProductRenderer = (params) => (
    <Link className="link" title={params.value} to={params.data.type === "Product" ? `${routes.productDetail.path}/${params.data.id}` : `${routes.packagesDetail.path}/${params.data.id}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    productRenderer: ProductRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    serializedAssetRenderer: SerializedAssetRenderer
  };

  const columns = [
    { field: "detail", headerName: "Detail", show: true, disabled: true, cellRenderer: "productRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "serializedAsset", headerName: "Serialized Asset", show: true, disabled: true, cellRenderer: "serializedAssetRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "TicketRenderer" },
    { field: "startDate", headerName: "Start Date", show: true, disabled: true, cellRenderer: "dateRenderer" },
    { field: "endDate", headerName: "End Date", show: true, disabled: true, cellRenderer: "dateRenderer" },
    { field: "qty", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "UOM", headerName: "UOM", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "pricingMethod", headerName: "Pricing Method", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "discount", headerName: "Discount", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
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

