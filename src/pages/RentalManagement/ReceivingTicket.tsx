import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Tooltip, IconButton } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { gridLoadingTimeout, receivingTicket, rentalManagement, sidebarResource } from "../../constants/helpers";
import { groupBy } from "lodash";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';

const renderedFrom = "rentalManagementDetailsPageReceivingTicket"

const ReceivingTicket = ({ productInventory, currentStep, handleReceivingTicketDialog, rentalManagementId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false)
  const [okBtnLoading, setOkBtnLoading] = useState(false)

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, [productInventory]);

  const fetchRecords = () => {
    if (gridApi) {
      gridApi.deselectAll();
    }

    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`)
      .then(({ data }) => {
        let tempProductInventory = data.data.map(d => d.inventory).map(u => ({ ...u, productName: u?.product?.optionLabel }))
        dispatch({ type: "loading", loading: true });
        axiosInstance()
          .get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/delivery-ticket`)
          .then(({ data }) => {
            data.data.map(obj => {
              tempProductInventory.map((d, index) => {
                if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                  tempProductInventory[index]["deliveryTicket"] = obj?.deliveryJobName
                  tempProductInventory[index]["deliveryTicketId"] = obj?._id
                }
              })
            })
            axiosInstance()
              .get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/receiving-ticket`)
              .then(({ data }) => {
                data.data.map(obj => {
                  tempProductInventory.map((d, index) => {
                    if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                      tempProductInventory[index]["receivingTicket"] = obj?.receivingJobName
                      tempProductInventory[index]["receivingTicketId"] = obj?._id
                    }
                  })
                })

                // tempProductInventory.forEach((d) => {
                //   d["hideSelection"] = d.status === "In-Transit";
                // })

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
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }


  const InventoryRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );
  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.product.optionValue}`}>
      {params.value}
    </Link>
  );
  const DeliveryTicketRenderer = (params) => (
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );
  const ReceivingTicketRenderer = (params) => (
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.receivingTicketDetail.path}/${params.data.receivingTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );

  const frameworkComponents = {
    receivingTicketRenderer: ReceivingTicketRenderer,
    deliveryTicketRenderer: DeliveryTicketRenderer,
    inventoryRenderer: InventoryRenderer,
    productNameRenderer: ProductNameRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
  };
  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "inventoryRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "deliveryTicketRenderer" },
    { field: "receivingTicket", headerName: "Receiving Ticket", show: true, cellRenderer: "receivingTicketRenderer" },
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productNameRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
  ];

  const columnState = JSON.parse(localStorage.getItem("rentalManagementDetailsPageReceivingTicket"));
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

      <IconButton
        disabled={(selectedRecords.length === 0) || currentStep === 5 || (selectedRecords.some(f => f.hasOwnProperty("receivingTicketId")))}
        onClick={() => {
          handleReceivingTicketDialog(selectedRecords)
        }}
        color='primary'
        size="small"
      >
        <Tooltip
          title="Create Receiving Ticket">
          <AddBoxRoundedIcon />
        </Tooltip>
      </IconButton>

      <Box mx={1} />

      <IconButton
        disabled={(selectedRecords.length === 0) || currentStep === 5 || (selectedRecords.some(f => !f.hasOwnProperty("receivingTicketId")))}
        onClick={() => {
          setShowRemoveAssetFromReceivingTicketDialog(true)
        }}
        color='primary'
        size="small"
      >
        <Tooltip
          title="Remove Assets From Receiving Ticket(s)">
          <RemoveCircleRoundedIcon />
        </Tooltip>
      </IconButton>

      <Box mx={1} />
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
          renderedFrom={renderedFrom}
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

      }
    </Grid>

    {showRemoveAssetFromReceivingTicketDialog && (
      <ConfirmationDialog
        open={showRemoveAssetFromReceivingTicketDialog}
        message={`Are you sure you want to remove selected records from ${sidebarResource.receivingTicket}(s) ?`}
        onClose={() => {
          setShowRemoveAssetFromReceivingTicketDialog(false);
        }}
        onOk={() => {
          setOkBtnLoading(true);

          const groupByCalls = groupBy(selectedRecords, "receivingTicketId");
          let apiCalls = [];

          Object.keys(groupByCalls).forEach((key) => {
            apiCalls.push(axiosInstance().put(`${receivingTicket.receivingTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map(m => m._id) }));
          })

          Promise.all(apiCalls).then(() => {
            toastConfig.setToastConfig({ open: true, type: "success", message: `Selected records removed from assiged ${sidebarResource.receivingTicket}(s)` });
            fetchRecords();
          }).catch((error) => {
            toastConfig.setToastConfig(error);
          }).finally(() => {
            setOkBtnLoading(false);
            setShowRemoveAssetFromReceivingTicketDialog(false);
          });

        }}
        okBtnLoading={okBtnLoading}
      />
    )}
  </>
  );
}

export default ReceivingTicket;

