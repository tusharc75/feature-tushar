import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, IconButton, Tooltip, Chip } from "@material-ui/core";
import axiosInstance from "src/axios/axiosInstance";
import { useData } from "src/StateProvider/Provider";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { gridLoadingTimeout, isObjectEmpty } from "src/constants/helpers";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, ImageRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import { MdAddShoppingCart } from "react-icons/md";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { prepareDataForGrid } from '../../../constants/helpers';
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import NoDataCell from "../../../components/Helpers/NoDataCell";

const ProductGridLayout = ({ renderedFrom, setAssignCartProductQty, plantId, searchVal, productCategory, refreshData }) => {

    const toastConfig = useContext(CustomToastContext);

    const { state: { user, permissions } }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const columns = [
        { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "productNameRenderer" },
        { field: "productImage", headerName: "Product Image", show: false, cellRenderer: "imageRenderer" },
        { field: "availableInventory", headerName: "Inventory", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productCategory", headerName: "Product Category", show: false, cellRenderer: "commonRenderer" },
    ]

    const ProductNameRenderer = (params) => (
        params?.value ? (
            <Link className="link text-truncate" title={params.value} to={`${routes.posProductDetail.path}/${params.data?._id}/${params.data?.plantId}`}>
                {params.value}
            </Link>
        ) : (
            <NoDataCell />
        )
    );

    const ActionsRenderer = (params) => (
        <HtmlTooltip title={params?.data?.inventory ? 'Add to cart' : 'No inventory'} >
            <span>
                <IconButton
                    size="small"
                    disabled={!params.data?.inventory || params.data?.inventory === 0}
                    aria-label="Add to cart"
                    onClick={() => {
                        setAssignCartProductQty(params.data)
                    }}
                    color={params?.data?.inventory ? "secondary" : "inherit"}
                >
                    <MdAddShoppingCart />
                </IconButton>
            </span>
        </HtmlTooltip>
    );

    const frameWorkComponent = {
        commonRenderer: CommonRenderer,
        imageRenderer: ImageRenderer,
        productNameRenderer: ProductNameRenderer,
        actionsRenderer: ActionsRenderer
    };

    useEffect(() => {
        if (plantId) {
            fetchProducts();
        }
    }, [page, limit, filters, sorting, search, plantId, productCategory, refreshData]);

    useEffect(() => {
        dispatch({ type: 'search', search: searchVal });
    }, [searchVal]);

    const getQueryString = () => {
        let deepFilter = `&page=${page}&limit=${limit}`;
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach((field) => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                });
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }
        const filterById = [];
        if (productCategory && productCategory !== '') {
            filterById.push({ field: 'productCategory', term: productCategory });
        }
        if (filterById.length) {
            deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById) + '&filterType=and';
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        return deepFilter;
    };

    const fetchProducts = () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        if (gridApi) {
            gridApi.setRowData([]);
        }
        let api = `/pos?wareHouse=${plantId}${queryString}`;
        axiosInstance().get(api).then(({ data: { data, count } }) => {
            let rows = data?.map((u) => {
                let finalObject = prepareDataForGrid(u);
                return {
                    plantId: plantId,
                    ...finalObject
                };
            });
            dispatch({ type: 'initialize', data: rows, count: count });
            setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: 'loading', loading: false });
        })
    }

    return (
        <Fragment>
            {columns && frameWorkComponent ?
                <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={100}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchProducts}
                    allowSelection={false} />
                : <Box
                    p={2}
                    height={500}
                    bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            }
        </Fragment>
    );
};

export default ProductGridLayout;
