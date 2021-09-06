import Box from "@material-ui/core/Box/Box";
import TextField from "@material-ui/core/TextField/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import { useState, useEffect, Fragment, useContext, useReducer } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CreatedByRenderer, UpdatedByRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";

const DeliveryTicket = ({warehouselist,productInventory}) => {

    const costTypeList = ["Repair", "Delivery", "Assembly"]
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  
    useEffect(() => {
      dispatch({ type: "initialize", data:productInventory, count: productInventory.length });
      // eslint-disable-next-line
    }, []);

    const NameRenderer = (params) => (
      <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
        {params.value}
      </Link>
    );
    const frameworkComponents = {
      nameRenderer: NameRenderer,
    };
    const columns = [
      { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
      { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "CommonRenderer" },
      { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "CommonRenderer" },
  ];
    return (<>
        <Autocomplete
          id="combo-box-demo"
          size="small"
          style={{ minWidth: 200 }}
          value={null}
          options={warehouselist}
          onChange={(event, newValue) => {

          }}
          placeholder="Select Warehouse"
          renderInput={(params) => <TextField
            {...params}
            variant="outlined"
            name="nameField"
          />}
        />
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
      </>
    );
}

export default DeliveryTicket;

