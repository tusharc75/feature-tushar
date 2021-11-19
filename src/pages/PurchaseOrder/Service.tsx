
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, IconButton } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { gridLoadingTimeout, purchaseOrder, rentalManagement } from "../../constants/helpers";
import BulkEditDialog from "./BulkEditDialog";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import HtmlTooltip from "../../components/CustomTooltipTitle";
import EditIcon from "@material-ui/icons/Edit";
import { useData } from "../../StateProvider/Provider";


const Service = ({ currencySymbol, purchaseOrderData ,statusOptions}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [isSavingBulkEditDialog, setIsSavingBulkEditDialog] = useState(false)
  const [selectedServiceData, setSelectedServiceData] = useState(null)
  const [columns, setColumns] = useState([
    { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "expectedDelivery", headerName: "Expected Delivery", show: true, disabled: true, cellRenderer: "dateRenderer" },
    { field: "qty", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "uom", headerName: "Base UOM", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "tax", headerName: "Tax Percent", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "taxPerUnit", headerName: "Tax Per Unit", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "totalTax", headerName: "Total Tax", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
  ])

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.rentalManagement?.isDelete}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          deletePurchaseOrderService([params.data._id])
        }
        }
        entity="purchaseOrder"
      />
      {
        <HtmlTooltip title="Edit">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowAddServiceDialog(true)
              setSelectedServiceData(params.data)
            }}
          >
            <EditIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      }
    </>
  );

  const frameworkComponents = {
    dateRenderer: DateRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: ActionsRenderer,
  };

  useEffect(() => {
    fetchService()
  }, []);

  const fetchService = () => {
    dispatch({ type: "loading", loading: true });

    axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData._id}/service-details`)
      .then(({ data }) => {
        dispatch({
          type: "initialize", data: data.data, count: data.data.length
        });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      }).catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error)
      });
  }

  const handleAddService = (service) => {

    let tempService = {
      "description": service.description || "",
      "qty": service.qty || 0,
      "expectedDelivery": service.expectedDelivery || purchaseOrderData?.deliveryDate,
      "uom": service.baseUOM || "",
      "price": service.price || 0,
      "finalPrice": service.finalPrice || 0,
      "taxSchedule": service.taxSchedule || "",
      "tax": service.tax || 0,
      "taxPerUnit": service.taxPerUnit || 0,
      "totalTax": service.totalTax || 0
    }

    axiosInstance().post(`${purchaseOrder.api}/${purchaseOrderData._id}/service-details/add`, { "serviceDetail": [tempService] })
      .then(() => {
        setShowAddServiceDialog(false)
        fetchService()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const handleUpdateService = (service) => {

    let tempService = {
      "_id": service._id,
      "description": service.description || "",
      "qty": service.qty || 0,
      "expectedDelivery": service.expectedDelivery || purchaseOrderData?.deliveryDate,
      "uom": service.baseUOM || "",
      "price": service.price || 0,
      "finalPrice": service.finalPrice || 0,
      "taxSchedule": service.taxSchedule || "",
      "tax": service.tax || 0,
      "taxPerUnit": service.taxPerUnit || 0,
      "totalTax": service.totalTax || 0
    }

    axiosInstance().put(`${purchaseOrder.api}/${purchaseOrderData._id}/service-details/update`, tempService)
      .then(() => {
        setShowAddServiceDialog(false)
        fetchService()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const deletePurchaseOrderService = (ids) => {
    axiosInstance().delete(`${purchaseOrder.api}/${purchaseOrderData._id}/service-details/remove/${ids}`)
      .then(() => {
        fetchService()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }


  return (<>

    <Box display="flex" justifyContent="flex-end" p="4px">
      <Button
        onClick={() => { setShowAddServiceDialog(true) }}
        variant="outlined"
        color="primary"
        type="button"
        size="small"
        startIcon={<AiFillFilePdf />}
      >
        {"Add Service"}
      </Button>
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
          allowAction={true}
          loading={loading}
          allowSelection={true}
          renderedFrom="purchaseOrderDetailsPageService"
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

      }
    </Grid>
    {showAddServiceDialog &&
      <BulkEditDialog
        isSaving={isSavingBulkEditDialog}
        onClose={() => {
          setShowAddServiceDialog(false)
        }}
        submitBulkEdit={selectedServiceData ? handleUpdateService : handleAddService}
        currencySymbol={currencySymbol}
        data={selectedServiceData}
        type={"service"}
        statusOptions={statusOptions}
      />
    }
  </>
  );
}

export default Service;