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

  useEffect(() => {
    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`)
      .then(({ data }) => {
        setAssignedSerializedAsset(data.data)
        let tempProductInventory = data.data.map(d => d.inventory)
        dispatch({ type: "loading", loading: true });
        axiosInstance()
          .get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/delivery-ticket `)
          .then(({ data }) => {
            data.data.map(obj => {
              tempProductInventory.map((d, index) => {
                if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                  tempProductInventory[index]["deliveryTicket"] = obj?.deliveryJobName
                  tempProductInventory[index]["deliveryTicketId"] = obj?._id
                }
              })
            })
            dispatch({
              type: "initialize", data: tempProductInventory, count: tempProductInventory.length
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
    // eslint-disable-next-line
  }, [warehouse, productInventory]);

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
    ticketRenderer: TicketRenderer,
    commonRenderer: CommonRenderer,
  };

  const columns = [
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "ticketRenderer" },
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

  </>
  );
}

export default DeliveryTicket;

