import { useState, useEffect, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CreateProduct from "../../components/Product/CreateProduct";
import { GiAbstract055 } from 'react-icons/gi';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import routes from "../../components/Helpers/Routes";
import ImportExportLinks from "../../components/Product/ImportExportLinks";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import { product, gridPageSizes, isObjectEmpty } from '../../constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";

function reducer(state, action) {
    switch (action.type) {
        case "loading":
            return {
                ...state,
                loading: action.loading
            }
        case "initialize":
            return {
                ...state,
                dataRows: action.data,
                rowCount: action.count,
                loading: false
            }
        case "selection":
            return {
                ...state,
                selectedRecords: action.selectedRecords,
            }
        case "update":
            return {
                ...state,
                dataRows: action.data,
                loading: false
            }
        case "filter":
            return {
                ...state,
                loading: true,
                filters: action.filters,
                page: 0
            }
        case "sort":
            return {
                ...state,
                sorting: action.sorting,
                loading: true
            }
        case "search":
            return {
                ...state,
                search: action.search,
                loading: true
            }
        case "pageChange":
            return {
                ...state,
                page: action.page
            }
        case "pageSizeChange":
            return {
                ...state,
                limit: action.limit,
                page: 0,
                loading: true
            }
        case "complete":
            return {
                ...state,
                loading: false
            }
        default:
            break;
    }
    return state;
}

const intialState = {
    dataRows: [],
    rowCount: 0,
    loading: false,
    page: 0,
    limit: 25,
    pageSizes: gridPageSizes,
    search: "",
    filters: {},
    sorting: [],
    selectedRecords: []
}

let termsTimeout

const Product = () => {

    const toastConfig = useContext(CustomToastContext)
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [isClone, setIsClone] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);

    const [gridApi, setGridApi] = useState(null);
    const [columnApi, setColumnApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;


    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search]);

    const fetchProduct = () => {

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            let rows = data.data?.map((u) => ({
                ...u,
                id: u._id,
                productCategory: u.productCategory?.optionLabel,
                productTemplate: u.productTemplate?.optionLabel,
                createdBy: u.createdBy?.user?.concatedName,
                createdByDate: u.createdBy?.date,
                updatedBy: u.updatedBy?.user?.concatedName,
                updatedByDate: u.updatedBy?.date,
            }));
            dispatch({ type: "initialize", data: rows, count: data.count });
            dispatch({ type: "loading", loading: false });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).map(field => {
                updatedFilters.push({
                    field: field,
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

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`/product/remove`, { "ids": ids }).then(() => {
            fetchProduct();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }


    const ProductNameRenderer = params => (
        <Link className="link"
            onClick={() => {
                OpenProduct(params.data._id);
                setIsClone(false)
            }}>
            <CustomRenderCell value={params?.value} />
        </Link>
    )

    const ActionsRenderer = params => (
        <>
            <Tooltip title="Clone">
                <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => { OpenProduct(params.data._id); setIsClone(true) }}
                >
                    <FileCopyIcon color="primary" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
                <IconButton size="small" aria-label="Delete" onClick={() => {
                    setDeleteRecord(params.data);
                    setShowDeleteConfirmBox(true)
                }} >
                    <DeleteIcon color="error" />
                </IconButton>
            </Tooltip >
        </>
    )

    const [columns, setColumns] = useState([
        { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "productNameRenderer" },
        { field: "productCategory", headerName: "Product Category", show: true, cellRenderer: "commonRenderer" },
        { field: "productTemplate", headerName: "Product Template", show: true, cellRenderer: "commonRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
        { field: "description", headerName: "Description", show: true, cellRenderer: "commonRenderer" },
    ]);

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const OpenProduct = (_id) => {
        setProductId(_id)
        setOpen(true)
    }

    const handleClose = () => {
        setProductId(null)
        setOpen(false)
        fetchProduct();
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const frameworkComponents = {
        productNameRenderer: ProductNameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer
    };


    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.product.title }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    module="product(s)"
                    api={"product"}
                    refrenceId={null}
                    onSuccessfulImport={(isImportedSuccessfully) => {
                        if (isImportedSuccessfully) {
                            fetchProduct();
                        }
                    }}
                />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container>
                    <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center gap-1">
                        <GiAbstract055 className="headerLogo" /> <span className="listingHeader">{routes.product.title} </span>
                    </Grid>
                    <Grid md={6} sm={12} xs={12} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="product_header_search_bar"
                            width="300px"
                            value={search}
                        />
                        <Button className="ml-2 mr-2" onClick={() => OpenProduct(null)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            disabled={selectedRecords.length ? false : true}
                            aria-controls="action-menu"
                        >Actions <ExpandMore />
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left",
                            }}
                            id="action-menu"
                            open={Boolean(anchorEl)}
                            onClose={closeActions}
                        >
                            <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                        </Menu>
                    </Grid>
                </Grid>
            </div>
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
                    actionWidth={150}
                />
        </div>
        {open && <CreateProduct isClone={isClone} productId={productId} handleClose={handleClose} openFrom="productMaster" />}
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete product ${deleteRecord?._id ? deleteRecord?.productName : ""} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Layout>
    );
}

export default Product;
