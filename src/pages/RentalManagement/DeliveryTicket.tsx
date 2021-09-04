import Box from "@material-ui/core/Box/Box";
import TextField from "@material-ui/core/TextField/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import { useState, useEffect, Fragment, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";

const DeliveryTicket = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { rentalManagementId, onClose, onSuccess } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });

    const costTypeList = ["Repair", "Delivery", "Assembly"]
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  
    const NameRenderer = (params) => (
      <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
        {params.value}
      </Link>
    );
    const frameworkComponents = {
      createdByRenderer: CreatedByRenderer,
      updatedByRenderer: UpdatedByRenderer,
      nameRenderer: NameRenderer,
    };
    const columns = [
      { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
      { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "CommonRenderer" },
      { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "CommonRenderer" },
      { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
      { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];
    return (<>
        <Autocomplete
          id="combo-box-demo"
          size="small"
          style={{ minWidth: 200 }}
          value={null}
          options={userList}
          getOptionLabel={(option: any) => option?.name ? option?.name : ""}
          onChange={(event, newValue) => {

          }}
          placeholder="Select User"
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
            allowAction={true}
            loading={loading}
          />
          : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

        }
      </>
    );
}

export default DeliveryTicket;

