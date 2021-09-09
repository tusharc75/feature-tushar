import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { IconButton } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import EditIcon from "@material-ui/icons/Edit";
import { object, string } from "yup";
import { gridLoadingTimeout } from "../../constants/helpers";
import { AddRentalCostDialog } from "./AddRentalCostDialog";


const AddRentalCost = ({ productInventory, rentalId, currencySymbol = "", fetchProductInventory }) => {
  const [addRentalCostDialog, setAddRentalCostDialog] = useState(false);
  const [addRentalCostData, setAddRentalCostData] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  useEffect(() => {
    dispatch({ type: "loading", loading: true });
    dispatch({
      type: "initialize", data: productInventory.map((u) => ({
        ...u,
        costPerDay: u.costing?.costPerDay,
        totalCost: u.costing?.totalCost,
        startDate: u.costing?.startDate,
        dueDate: u.costing?.dueDate,
      })), count: productInventory.length
    });
    setTimeout(() => {
      dispatch({ type: "loading", loading: false });
    }, gridLoadingTimeout);
    // eslint-disable-next-line
  }, [productInventory]);

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const LinkRenderer = (params) => (
    <span className="link" title={params.value}
      onClick={() => {
      setAddRentalCostData(params.data)
      setAddRentalCostDialog(true)
    }}>
      {params.value}
    </span>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip title="Add Rental Cost">
        <IconButton
          size="small"
          aria-label="AddRentalCost"
          onClick={() => {
            setAddRentalCostData(params.data)
            setAddRentalCostDialog(true)
          }}
        >
          <EditIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    linkRenderer: LinkRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    actionsRenderer: ActionsRenderer,
  };
  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "linkRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "costPerDay", headerName: "Cost Per Day", show: true, cellRenderer: "commonRenderer" },
    { field: "totalCost", headerName: "Total Cost", show: true, cellRenderer: "commonRenderer" },
    { field: "startDate", headerName: "Start Date", show: true, cellRenderer: "dateRenderer" },
    { field: "dueDate", headerName: "End Date", show: true, cellRenderer: "dateRenderer" },
  ];

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} sm={12} >
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
            />
            : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
          }
        </Grid>
      </Grid>
      {addRentalCostDialog && (<AddRentalCostDialog RentalCostData={addRentalCostData}
        open={addRentalCostDialog}
        rentalId={rentalId}
        currencySymbol={currencySymbol}
        onClose={() => setAddRentalCostDialog(false)}
        onSuccess={() => {
          setAddRentalCostDialog(false);
          fetchProductInventory()
        }}
      />)}
    </>
  );
}

export default AddRentalCost;