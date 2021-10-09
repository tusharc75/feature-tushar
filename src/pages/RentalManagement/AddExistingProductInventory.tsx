import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { Box } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { productInventory, isObjectEmpty, gridLoadingTimeout, CustomDialogTransition } from '../../constants/helpers';
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";

const AddExistingProductInventory = ({ addProductInventory, handleProductInventoryClose }) => {
    const toastConfig = useContext(CustomToastContext)

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions },
    }: any = useData();

    useEffect(() => {
        fetchProductInventory()
    }, [page, limit, filters, sorting, search]);

    const columns = [
        { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
        { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
        { field: "warehouse", headerName: "Warehouse", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ];

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.filter(u => u?.status === "Available")
                .map((u) => ({
                    ...u,
                    id: u._id,
                    productName: u.product?.optionLabel,
                    productCategory: u.productCategory?.optionLabel,
                    warehouse: u.warehouse?.optionLabel,
                }));

            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };



    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };


    const NameRenderer = (params) => (
        <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    );


    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const frameworkComponents = {
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        nameRenderer: NameRenderer,
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            default:
                return field;
        }
    };

    const getRowStyleScheduled = (params) => {
        if (["Available", "New"].indexOf(params?.data?.status) >= 0) {
            return {
                'background-color': "#d3ffe0",
            }
        }
        return null;
    };

    return (<Fragment>
        {(<Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={"Add Serialized Assets"} onClose={handleProductInventoryClose} ></CustomDialogHeader>
            <div className="listing-grid p-3">
                <Box mb={2}>
                    <Grid container >
                        <Grid item xs={12} sm={6}>

                        </Grid>
                        <Grid item xs={12} sm={6} container justify="flex-end">
                            <SearchBox
                                onSearch={handleSearch}
                                searchbox="terms_header_search_bar"
                                width="300px"
                                value={search}
                            />
                            <Box ml={1} mt={1} >
                                <Button size="small" color="primary" onClick={() => addProductInventory(selectedRecords)} variant="contained" disabled={selectedRecords.length > 0 ? false : true}  >
                                    {selectedRecords.length ? "(" + selectedRecords.length + ")  " : ""}
                                    Add</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
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
                        refreshGrid={fetchProductInventory}
                        customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                    />
                    : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
            </div>
        </Dialog>
        )}
    </Fragment>
    );
}

export default AddExistingProductInventory;
