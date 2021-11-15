import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { Box, CircularProgress } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { productInventory, isObjectEmpty, gridLoadingTimeout, CustomDialogTransition, getLocalStorageArrayData } from '../../constants/helpers';
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";

const addSerializedAssetsRenderedFrom = "addSerializedAssets";
const localStorageSelectedRecords = `${addSerializedAssetsRenderedFrom}_selected`;

const AddSerializedAsset = ({ isAdding, addSerializedAsset, handleSerializedAssetClose, selectedProducts }) => {
    const toastConfig = useContext(CustomToastContext)

    const [serializedProducts, setSerializedProducts] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions },
    }: any = useData();

    useEffect(() => {
        fetchProductInventory()
    }, [page, limit, filters, sorting, search]);

    useEffect(() => {
        let tempProducts = serializedProducts
        const alreadyStoredSelectedRecords = [...getLocalStorageArrayData(localStorageSelectedRecords)];

        if (tempProducts.length === 0) {
            selectedProducts.map(d => {
                if (d.productName) {
                    if (tempProducts.find(obj => obj.id === d._id)) {
                        tempProducts.find(obj => obj.id === d._id).qty = d?.qty + tempProducts.find(obj => obj.id === d._id).qty
                    }
                    else {
                        tempProducts.push({ "id": d._id, "name": d.productName, "qty": d?.qty })
                    }
                }
                if (d.packageName && d?.products?.length > 0) {
                    d.products.map(u => {
                        if (tempProducts.find(obj => obj.id === u?.productDetail?._id)) {
                            tempProducts.find(obj => obj.id === u?.productDetail?._id).qty = (u?.qty * d?.qty) + tempProducts.find(obj => obj.id === u?.productDetail?._id).qty
                        }
                        else {
                            tempProducts.push({ "id": u?.productDetail?._id, "name": u?.productDetail?.productName || "", "qty": u?.qty * d?.qty })
                        }
                    })
                }
            })
        }
        else {
            tempProducts = []
            selectedProducts.map(d => {
                if (d.productName) {
                    tempProducts.push({ "id": d._id, "name": d.productName, "qty": d?.qty - alreadyStoredSelectedRecords.filter(obj => obj.product.optionValue === d._id).length })
                }
                if (d.packageName && d?.products?.length > 0) {
                    d.products.map(u => {
                        if (tempProducts.find(obj => obj.id === d?.productDetail?._id)) {
                            tempProducts.find(obj => obj.id === d?.productDetail?._id).qty = u?.qty * d?.qty + tempProducts.find(obj => obj.id === d?.productDetail?._id).qty - alreadyStoredSelectedRecords.filter(obj => obj.product.optionValue === u?.productDetail?._id).length
                        }
                        else {
                            tempProducts.push({ "id": u?.productDetail?._id, "name": u?.productDetail?.productName || "", "qty": u?.qty * d?.qty - alreadyStoredSelectedRecords.filter(obj => obj.product.optionValue === u?.productDetail?._id).length })
                        }
                    })
                }
                // if (d?.qty - alreadyStoredSelectedRecords.filter(obj => obj.product.optionValue === d._id).length <= -1) {
                //     let tempSelectedRecoeds = [...alreadyStoredSelectedRecords]
                //     var idx = tempSelectedRecoeds.findIndex(obj => obj.product.optionValue === d._id);
                //     var removed = tempSelectedRecoeds.splice(idx, 1);
                //     // dispatch({ type: "loading", loading: true });
                //     // setTimeout(() => {
                //     //     dispatch({ type: "loading", loading: false });
                //     // }, gridLoadingTimeout);
                //     dispatch({ type: "selection", selectedRecords: tempSelectedRecoeds });
                // }
            })
        }
        setSerializedProducts(tempProducts)
    }, [selectedRecords]);

    const columns = [
        { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
        { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
        { field: "plant", headerName: "Plant", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ];

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        let queryString = getQueryString();
        if (selectedProducts.length > 0) {
            queryString = `${queryString}&filterById=${JSON.stringify(selectedProducts.map(m => { return { "field": "product", "term": m?._id ?? "" } }))}&filterByIdType=or`
        }

        axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
            data.data = data.data
                // ?.filter(u => (u?.status === "Available" || u?.status === "New")
                // && selectedProducts.some(d => d._id === u?.product?.optionValue || d.products?.some(obj => obj?.productId === u?.product?.optionValue))
                // )
                .map((u) => ({
                    ...u,
                    id: u._id,
                    productName: u.product?.optionLabel,
                    productCategory: u?.productCategory?.optionLabel,
                    warehouse: u?.warehouse?.optionLabel,
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
        let deepFilter = `?page=${page}&limit=${limit}&availableAssets=true`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
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
            <CustomDialogHeader title={`Add ${routes.productInventory.title}`} onClose={handleSerializedAssetClose} ></CustomDialogHeader>
            <CustomDialogContent>
                <div className="listing-grid p-3">
                    <Box mb={2}>
                        <Grid container >
                            <Grid item xs={12} sm={6}>
                                <div>
                                    {
                                        serializedProducts.length > 0 ?
                                            serializedProducts.map(d =>
                                                d?.qty < 0 ? <span className="text-error">{d.name ? `  ${d.name} (${d?.qty})  |` : ""}</span>
                                                    : (d?.qty === 0 ? <span className="text-success">{d.name ? `  ${d.name} (${d?.qty})  |` : ""}</span> : <span>{d.name ? `  ${d.name} (${d?.qty})  |` : ""}</span>)
                                            ) : null
                                    }
                                </div>

                                {
                                    serializedProducts.length > 0 && serializedProducts.some(s => s.qty < 0) ? <div className="text-error font-weight-bold">You have selected more assets then needed.</div> : ""
                                }
                            </Grid>
                            <Grid item xs={12} sm={6} container justify="flex-end">
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox="terms_header_search_bar"
                                    width="300px"
                                    value={search}
                                />
                                <Box ml={1} mt={1} >
                                    <Button size="small"
                                        color="primary"
                                        onClick={() => addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)])}
                                        variant="contained"
                                        disabled={getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length === 0 || isAdding ||
                                            serializedProducts.some(d => d?.qty < 0)}
                                        endIcon={isAdding && <CircularProgress size={20} />}
                                    >
                                        {getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length ? "(" + getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length + ")  " : ""}
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
                            customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                            // selectedRecords={selectedRecords}
                            renderedFrom={addSerializedAssetsRenderedFrom}
                            // showOnlyShowFilteredRecordSwitch={true}
                            // allowHeaderSelection={false}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                </div>
            </CustomDialogContent>
        </Dialog>
        )}
    </Fragment>
    );
}

export default AddSerializedAsset;