import React, { useState, useEffect, Fragment, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiAbstract055 } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomContainer from "../../components/CustomContainer";
import CreateProductCategory from "./CreateProductCategory";
import routes from "../../components/Helpers/Routes";
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import {
    gridPageSizes,
    isObjectEmpty
} from "../../constants/helpers";
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";


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

const ProductCategory = () => {

    const toastConfig = useContext(CustomToastContext)

    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [open, setOpen] = useState(false);
    const [productCategoryId, setProductCategoryId] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    // const [selectedCategory, setSelectedCategory] = useState([]);

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Product Category", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];
    //  Grid Variables - End

    useEffect(() => {
        fetchProductCategory()
    }, [page, limit, filters, sorting, search])

    const NameRenderer = params => <span className="d-flex gap-2 align-items-center">
        <span className="link" onClick={() => {
            setProductCategoryId(params.data.id);
            setOpen(true);
        }}>
            <CustomRenderCell value={params.value} />
        </span>
    </span>

    const ActionsRenderer = params => <Fragment>
        <Tooltip title="Delete">
            <IconButton size="small" aria-label="Delete" onClick={() => { setDeleteRecord(params.data); setShowDeleteConfirmBox(true) }}  >
                <DeleteIcon color="error" />
            </IconButton>
        </Tooltip >
    </Fragment>

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer
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
    }

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
            deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };


    const fetchProductCategory = () => {

        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        axiosInstance().get(`/product-category${queryString}`).then(({ data: { data, count } }) => {

            let rows = data.map((u) => {
                const { createdBy, updatedBy, ...restProperties } = u;

                let res = {
                    ...restProperties,
                    id: u._id,

                    createdBy: u.createdBy?.user?.concatedName,
                    createdByDate: u.createdBy?.date,
                    updatedBy: u.updatedBy?.user?.concatedName,
                    updatedByDate: u.updatedBy?.date,
                }

                return res;
            });

            dispatch({ type: "initialize", data: rows, count: count });

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(m => m._id);
        }
        axiosInstance().put(`/product-category/remove`, { "ids": ids }).then(() => {
            fetchProductCategory();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            // setSelectedCategory([])
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.productCategory.title }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    module="product category"
                    api={"product-category"}
                    onSuccessfulImport={(isImportedSuccessfully) => {
                        if (isImportedSuccessfully) {
                            fetchProductCategory();
                        }
                    }}
                />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container>
                    <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{routes.productCategory.title}</span>
                    </Grid>
                    <Grid md={6} sm={12} xs={12} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="terms_header_search_bar"
                            width="300px"
                            value={search}
                        />
                        <Button className="ml-2 mr-2" onClick={() => { setProductCategoryId(null); setOpen(true); }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
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

            <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
                dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={100} />

            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure, you want to delete product category  ${deleteRecord?._id ? deleteRecord?.name : ""}  ?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }
            {open && <CreateProductCategory productCategoryId={productCategoryId} handleClose={() => { setOpen(false); fetchProductCategory() }} />}
        </CustomContainer>
    </Layout>
    );
}

export default ProductCategory;
