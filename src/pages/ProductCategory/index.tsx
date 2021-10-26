import { useState, useEffect, Fragment, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { FaThemeisle } from 'react-icons/fa';
import styles from "../Leads/Header.module.scss";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomContainer from "../../components/CustomContainer";
import CreateProductCategory from "./CreateProductCategory";
import routes from "../../components/Helpers/Routes";
import SearchBox from '../../components/Helpers/SearchBox'
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import DeleteIcon from "@material-ui/icons/Delete";
import {
    gridLoadingTimeout,
    gridPageSizes,
    isObjectEmpty
} from "../../constants/helpers";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { useData } from "../../StateProvider/Provider";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import NoDataCell from "../../components/Helpers/NoDataCell";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import { getColumnData, getStaticFields, getFrameworkComponents } from "../../constants/columns"
import { prepareDataForGrid } from "../../constants/helpers"

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
                rowCount: action.count
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

    const location = useLocation()
    const toastConfig = useContext(CustomToastContext)
    const {
        state: { permissions, user, selectedEntity },
    }: any = useData();

    const [productCategoryPermissions, setProductCategoryPermissions] = useState({
        isCreate: permissions.productCategory?.isCreate,
        isUpdate: permissions.productCategory?.isUpdate,
        isRead: permissions.productCategory?.isRead,
        isDelete: permissions.productCategory?.isDelete
    });

    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [open, setOpen] = useState({ open: false, isClone: false });

    const [productCategoryId, setProductCategoryId] = useState(null);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})

    // const [selectedCategory, setSelectedCategory] = useState([]);

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columnState = JSON.parse(localStorage.getItem("productCategoryPage"));

    const [anchorEl, setAnchorEl] = useState(null);
    if (columnState) {
        columns.map((item) => {
            columnState.map((d) => {
                if (d.colId == item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }
    //  Grid Variables - End

    useEffect(() => {
        const parsedParams = queryString.parse(location?.search);
        if (parsedParams?.id) {
            setProductCategoryId(parsedParams?.id);
            setOpen({ open: true, isClone: false });
        }
    }, [location])

    useEffect(() => {
        if (permissions && permissions.productCategory) {
            setProductCategoryPermissions(permissions.productCategory);
        }
    }, [permissions]);

    useEffect(() => {
        fetchProductCategory()
    }, [page, limit, filters, sorting, search, selectedEntity])

    useEffect(() => {
        fetchGridColumns()
    }, [])

    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Product Category")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    if (o?.fieldData?.primaryField === true) {
                        columns = [...columns,
                        { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" }]
                    }
                    else {
                        let currentColumn = getColumnData(routes.productCategory.title, o?.fieldData, routes.productCategory.path)

                        if (currentColumn !== null) {
                            columns = [...columns, currentColumn?.columnData]
                            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                                rendererNames.push(currentColumn?.rendererName)
                            }
                        }
                    }
                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                    nameRenderer: NameRenderer,
                    actionsRenderer: ActionsRenderer
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns])
            })
    }

    const NameRenderer = params => <span className="d-flex gap-2 align-items-center">
        <Chip
            className="ml-3 link"
            style={{ backgroundColor: `${params.data.chipColour}` }}
            label={`${params.value}`}
            onClick={() => {
                setProductCategoryId(params.data.id);
                setOpen({ open: true, isClone: false });
            }}
        />
    </span>

    const ActionsRenderer = params => <Fragment>
        <Tooltip
            className={productCategoryPermissions.isCreate ? "" : "cursor-stop"}
            title={productCategoryPermissions.isCreate ? "Clone" : "You do not have permission to clone/create"} >
            <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                    setProductCategoryId(params.data.id);
                    setOpen({ open: true, isClone: true })
                }}
            >
                <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
        </Tooltip>
        {productCategoryPermissions.isDelete && (params?.data?.createdById == user?.user?._id) ?
            <Tooltip title="Delete" >
                <IconButton aria-label="Delete" onClick={() => {
                    setDeleteRecord(params.data);
                    setShowDeleteConfirmBox(true)
                }}>
                    <DeleteIcon
                        fontSize="small" color="error" />
                </IconButton>
            </Tooltip> :
            <Tooltip className="cursor-stop" title={`You do not have permission to delete `}>
                <IconButton aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        }
    </Fragment >

    const ProductCategoryRenderer = (params) => (
        <> {params.data.parentCategory?.optionLabel !== undefined && params.data.parentCategory?.optionLabel !== null ?
            (
                <Chip
                    className="ml-3"
                    style={{ backgroundColor: `${params.data.parentCategory?.chipColour}` }}
                    label={`${params.data.parentCategory?.optionLabel}`}
                />
            )
            : (
                <NoDataCell />
            )}
        </>
    );

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
        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

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
        dispatch({ type: "loading", loading: true });
        const queryString = getQueryString();

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance().get(`/product-category${queryString}`).then(({ data: { data, count } }) => {

            let rows = data.map((u) => {
                return prepareDataForGrid(u)
            });

            dispatch({ type: "initialize", data: rows, count: count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

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
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.productCategory.title }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions.productCategory}
                    module="product category"
                    api={"product-category"}
                    afterImportCompleted={() => {
                        fetchProductCategory();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length}
                    ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                    onExportToExcelSuccess={() => {
                        if (gridApi) gridApi.deselectAll()
                        else fetchProductCategory()
                    }}
                />
            </Grid>

        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
                        <FaThemeisle size={20} style={{ paddingBottom: "3px" }} /> <span className="listingHeader">{routes.productCategory.title}</span>
                    </Grid>
                    <Grid md={6} sm={6} xs={12} container className={styles.filter_side}>
                        <Box className={styles.filter_side_header} component="div" >
                            <SearchBox
                                onSearch={handleSearch}
                                searchbox={styles.search_box_input}
                                width="242px"
                                size="small"
                                value={search}
                            />
                            {productCategoryPermissions.isCreate &&
                                <Button className={styles.add_submit_btn} onClick={() => {
                                    setProductCategoryId(null);
                                    setOpen({ open: true, isClone: false });
                                }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                            }
                            {productCategoryPermissions.isDelete &&
                                <Button
                                    className={styles.action_submit_btn}
                                    variant="outlined"
                                    color="default"
                                    size="small"
                                    onClick={openActions}
                                    disabled={selectedRecords.length ? false : true}
                                    aria-controls="action-menu"
                                >Actions <ExpandMore />
                                </Button>
                            }
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
                                <MenuItem onClick={() => {
                                    closeActions()
                                    {selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0])}
                                    setShowDeleteConfirmBox(true)
                                }}>Delete</MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
            </div>

            {
                Object.keys(frameWorkComponent).length > 0 ?
                    <CustomAgGrid columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowAction={true}
                        loading={loading}
                        renderedFrom={routes.productCategory.title}
                        refreshGrid={fetchProductCategory}
                    /> : null
            }

            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete product category  ${deleteRecord?._id ? deleteRecord?.name : ""}?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }

            {open?.open &&
                <CreateProductCategory
                    isUpdateDisabled={false}
                    productCategoryId={productCategoryId}
                    isClone={open?.isClone}
                    onClose={() => setOpen({ open: false, isClone: false })}
                    onSuccess={() => {
                        setOpen({ open: false, isClone: false });
                        fetchProductCategory()
                    }}
                />
            }
        </CustomContainer>
    </Fragment >
    );
}

export default ProductCategory;
