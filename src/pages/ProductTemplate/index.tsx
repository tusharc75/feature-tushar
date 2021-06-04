import React, { useState, FC, useEffect, useContext, useReducer } from "react";
import {
    Button,
    Grid,
    IconButton,
    Link as MuiLink,
    Menu,
    MenuItem,
    Tooltip,
} from "@material-ui/core";
import { Link, useHistory } from "react-router-dom";
import { productTemplate, gridPageSizes, isObjectEmpty } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddIcon from "@material-ui/icons/Add";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer,
    CustomLoadingOverlay
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import DeleteIcon from '@material-ui/icons/Delete';
import { GiAbstract055 } from 'react-icons/gi';
import SearchBox from '../../components/Helpers/SearchBox'
import { ExpandMore } from "@material-ui/icons";
import FileCopyIcon from '@material-ui/icons/FileCopy';

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

let productTemplateTimeout;

const ProductTemplate: FC = () => {

    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);

    const {
        state: { user, permissions },
    }: any = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [renderCount, setRenderCount] = useState(0);
    const [productTemplatePermissions, setProductTemplatePermissions] = useState({
        isCreate: false,
        isUpdate: false,
        isRead: false,
        isDelete: false,
    });

    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];
    //  Grid Variables - End


    const { productTemplateApi, productTemplateResource } = productTemplate;

    useEffect(() => {
        if (permissions && permissions[productTemplateResource]) {
            setProductTemplatePermissions(permissions[productTemplateResource]);
        }
    }, [permissions]);

    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 5;
        if (productTemplateTimeout) {
            clearTimeout(productTemplateTimeout);
        }

        productTemplateTimeout = setTimeout(() => {
            fetchProductTemplate();
        }, millisec);
    }, [search]);

    useEffect(() => {
        if (renderCount > 0) {
            fetchProductTemplate();
        } else setRenderCount((preCount) => preCount + 1);
    }, [page, limit, filters, sorting]);


    const NameRenderer = params => <Link className="link"
        to={`${routes.productTemplate.path}/${params.data._id}`} title={params.value}>
        {params.value}
    </Link>;

    const ActionsRenderer = params => <>

        {
            <Tooltip title="Clone">
                <IconButton aria-label="Clone" onClick={() => CreateNew(params.data.id, true)}>
                    <FileCopyIcon fontSize="small" color="primary" />
                </IconButton>
            </Tooltip>
        }
        {/* {productTemplatePermissions.isUpdate ? */}
        { true ?
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

    </>

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        customLoadingOverlay: CustomLoadingOverlay,
        actionsRenderer: ActionsRenderer,
        customFloatingFilter: CustomFloatingFilter,
        // customLoadingCellRenderer: CustomLoadingCellRenderer,
        // customNoRowsOverlay: CustomNoRowsOverlay
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

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const CreateNew = (id, isClone) => {
        if (isClone) {
            history.push(routes.productTemplate.path + "/" + id, { isClone: true })
        }
        else {
            history.push(routes.productTemplate.path + "/0", { isClone: false })
        }
    }

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`/product-template/remove`, { "ids": ids }).then(({ data }) => {
            fetchProductTemplate();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
            toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
            });
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).map(field => {
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

    const fetchProductTemplate = () => {
        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        axiosInstance()
            .get(`${productTemplateApi}${queryString}`)
            .then(({ data: { data, count } }) => {

                let rows = data.map((u) => {

                    const { owner, collaborator, createdBy, updatedBy, staticData, ...restProperties } = u;

                    let res = {
                        ...restProperties,
                        id: u._id,
                        createdBy: u.createdBy?.user?.concatedName,
                        createdByDate: u.createdBy?.date,
                        updatedBy: u.updatedBy?.user?.concatedName,
                        updatedByDate: u.updatedBy?.date,
                    };
                    return res;
                });

                dispatch({ type: "initialize", data: rows, count: count });
                // if (gridApi && rows.length > 0) {
                //   gridApi.hideOverlay();
                // }
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: "loading", loading: false });
            });

    }

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };




    return (
        <Layout>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.productTemplate]} />
                </Grid>
                <Grid
                    item
                    md={8}
                    sm={1}
                    xs={2}>
                    <ImportExportLinks
                        module="productTemplateApi(s)"
                        api={productTemplateApi}
                        onSuccessfulImport={(isImportedSuccessfully) => {
                            if (isImportedSuccessfully) { fetchProductTemplate(); }
                        }}
                    />
                </Grid>
            </Grid>

            <CustomContainer>
                <div className="header-panel">
                    <Grid container>
                        <Grid item xs={6} className="d-flex align-items-center gap-1">
                            <GiAbstract055 /> <span className="listingHeader">{routes.productTemplate.title}</span>
                        </Grid>
                        <Grid md={6} sm={12} xs={12} container justify="flex-end">
                            <SearchBox
                                onSearch={handleSearch}
                                searchbox="terms_header_search_bar"
                                width="300px"
                                value={search}
                            />
                            <Button className="ml-2 mr-2" onClick={() => CreateNew("0", false)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
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
                    dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={150} />

                {showDeleteConfirmBox &&
                    <ConfirmationDialog
                        open={showDeleteConfirmBox}
                        message={`Are you sure, you want to delete product template ${deleteRecord?._id ? deleteRecord?.name : ""} ?`}
                        onClose={() => setShowDeleteConfirmBox(false)}
                        onOk={handleDelete}
                    />
                }
            </CustomContainer >
        </Layout >
    );

};

export default ProductTemplate;
