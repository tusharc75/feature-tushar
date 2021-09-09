import Box from "@material-ui/core/Box/Box";
import TextField from "@material-ui/core/TextField/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import { useState, useEffect, useReducer } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button } from "@material-ui/core";

const DeliveryTicket = ({ warehouselist, productInventory, currentStep, handleDeliveryTicketDialog }) => {

  const [gridApi, setGridApi] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  useEffect(() => {

    if (warehouse) {
      dispatch({
        type: "initialize", data: productInventory.map((u) => ({
          ...u,
          costPerDay: u.costing?.costPerDay,
          totalCost: u.costing?.totalCost,
          startDate: u.costing?.startDate,
          dueDate: u.costing?.dueDate,
          deliveryTicket: u.deliveryTicket,
          hideSelection: u.deliveryTicket === null || u.deliveryTicket === undefined ? false : true,
        })).filter(d => d.inventory.warehouse.optionValue === warehouse.optionValue), count: productInventory.filter(d => d.inventory.warehouse.optionValue === warehouse.optionValue).length
      });
    }
    else {
      dispatch({
        type: "initialize", data: productInventory.map((u) => ({
          ...u,
          costPerDay: u.costing?.costPerDay,
          totalCost: u.costing?.totalCost,
          startDate: u.costing?.startDate,
          dueDate: u.costing?.dueDate,
          deliveryTicket: u.deliveryTicket,
          hideSelection: u.deliveryTicket === null || u.deliveryTicket === undefined ? false : true,
        })), count: productInventory.length
      });
    }
    // eslint-disable-next-line
  }, [warehouse, productInventory]);

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );
  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
  };
  const columns = [
    { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "commonRenderer" },
    { field: "costPerDay", headerName: "Cost Per Day", show: true, cellRenderer: "commonRenderer" },
    { field: "totalCost", headerName: "Total Cost", show: true, cellRenderer: "commonRenderer" },
    { field: "startDate", headerName: "Start Date", show: true, cellRenderer: "dateRenderer" },
    { field: "dueDate", headerName: "End Date", show: true, cellRenderer: "dateRenderer" },

  ];
  return (<>

    <Grid container spacing={3}>
      <Grid item xs={12} md={12} sm={12} className="d-flex justify-content-end">
        {/* <Autocomplete
          id="combo-box-demo"
          size="small"
          style={{ minWidth: 300 }}
          value={warehouse}
          options={warehouselist}
          getOptionLabel={(option: any) => option ? option?.optionLabel : ""}
          onChange={(event, newValue) => {
            setWarehouse(newValue)
          }}
          placeholder="Select Warehouse"
          renderInput={(params) => <TextField
            {...params}
            variant="outlined"
            label="Select Warehouse"
            name="warehouseField"
          />}
        /> */}
        <Button
          variant="contained"
          color="primary"
          type="submit"
          size="small"
          disabled={(selectedRecords.length === 0) || currentStep === 4}
          onClick={() => {
            handleDeliveryTicketDialog(selectedRecords, warehouse)
          }}
        >
          Create Loading Ticket
        </Button>
      </Grid>
    </Grid>
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
          allowAction={false}
          loading={loading}
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

      }
    </Grid>
  </>
  );
}

export default DeliveryTicket;

