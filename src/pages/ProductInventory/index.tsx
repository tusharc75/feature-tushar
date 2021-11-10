import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { ExpandMore } from "@material-ui/icons";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { productInventory, isObjectEmpty, gridLoadingTimeout, RESOURCE_LABEL } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import ManageProductInventory from "./ManageProductInventory";
import ManageRepairJob from '../RepairJob/ManageRepairJob'
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from "react-router-dom";
import HtmlTooltip from "../../components/CustomTooltipTitle";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { getColumnData, getStaticFields, getFrameworkComponents } from "../../constants/columns"
import { prepareDataForGrid } from "../../constants/helpers"

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

const ProductInventory = () => {

    const toastConfig = useContext(CustomToastContext)
    const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions },
    }: any = useData();
    const history = useHistory();

    const [warehouse, setWarehouse] = useState(history.location?.state?.warehouse);
    const [redirectProduct, setRedirectProduct] = useState(history.location?.state?.product);

    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        fetchProductInventory()
    }, [page, limit, filters, sorting, search, warehouse]);

    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Product Inventory")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    if (o?.fieldData?.fieldName === "serialNumber") {
                        o.fieldData.primaryField = true
                    }
                    let currentColumn = getColumnData(routes.productInventory?.title, o?.fieldData, routes.productInventoryDetail.path)

                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData]
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName)
                        }
                    }
                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                    actionsRenderer: ActionsRenderer
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns])
            })
    }

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u, i) => ({
                ...prepareDataForGrid(u),
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

        if (warehouse?.optionValue && redirectProduct?.id) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "warehouse", term: warehouse?.optionValue }, { field: "product", term: redirectProduct?.id }])}`
        }
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

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`${productInventory.api}/remove`, { "ids": ids }).then(() => {
            fetchProductInventory();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const ActionsRenderer = params => (
        <>
            {
                permissions?.productInventory?.isCreate &&
                <HtmlTooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowManageProductInventoryDialog({ open: true, isClone: true, idToClone: params.data._id });
                        }}
                    >
                        <FileCopyIcon color="primary" />
                    </IconButton>
                </HtmlTooltip>
            }
            {permissions?.productInventory?.isDelete &&
                <HtmlTooltip title="Delete">
                    <IconButton size="small" aria-label="Delete" onClick={() => {
                        setDeleteRecord(params.data);
                        setShowDeleteConfirmBox(true)
                    }} >
                        <DeleteIcon color="error" />
                    </IconButton>
                </HtmlTooltip >
            }
        </>
    )

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
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

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.productInventory]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions?.productInventory}
                    module="product inventory"
                    api={productInventory.api}
                    afterImportCompleted={() => {
                        fetchProductInventory();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length}
                    ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                    onExportToExcelSuccess={() => {
                        if (gridApi) gridApi.deselectAll()
                        else fetchProductInventory()
                    }}
                />
            </Grid>

        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiStockpiles size={20} style={{ paddingBottom: "3px" }} className="headerLogo" />
                        <span className="listingHeader">{routes.productInventory?.title} </span>
                        {warehouse && (
                            <Chip
                                className="ml-3"
                                color="primary"
                                label={`Plants : ${warehouse.optionLabel}`}
                                onDelete={() => {
                                    setRedirectProduct(null);
                                    setWarehouse(null);
                                }}
                            />
                        )}
                        {redirectProduct && (
                            <Chip
                                className="ml-3"
                                color="primary"
                                label={`Product : ${redirectProduct.name}`}
                                onDelete={() => {
                                    setWarehouse(null);
                                    setRedirectProduct(null);
                                }}
                            />
                        )}
                    </Grid>
                    <Grid xs={6} container className={styles.filter_side} >
                        <Box className={styles.filter_side_header} component="div" >

                            <SearchBox
                                onSearch={handleSearch}
                                searchbox={styles.search_box_input}
                                width="242px"
                                size="small"
                                value={search}
                            />
                            {permissions?.productInventory?.isCreate &&
                                <Button className={styles.add_submit_btn} onClick={() => {
                                    setShowManageProductInventoryDialog({ open: true, isClone: false, idToClone: null })
                                }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                            }

                            <HtmlTooltip title="Please select some inventories">
                                <span>
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
                                </span>
                            </HtmlTooltip>
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
                                {permissions?.productInventory?.isDelete && <MenuItem onClick={() => {
                                    closeActions()
                                    setShowDeleteConfirmBox(true)
                                }}>Delete</MenuItem>}
                                {permissions?.repairJob?.isCreate && permissions?.productInventory?.isUpdate && <MenuItem onClick={() => {
                                    closeActions()
                                    setShowRepairJobDialog(true)
                                }}>Create Repair Job</MenuItem>}
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
            </div>
            {columns ?
                Object.keys(frameWorkComponent).length > 0 ?
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
                        actionWidth={150}
                        loading={loading}
                        renderedFrom={routes.productInventory?.title}
                        refreshGrid={fetchProductInventory}
                    /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {
            showManageProductInventoryDialog.open &&
            <ManageProductInventory
                isClone={showManageProductInventoryDialog.isClone}
                productInventoryId={showManageProductInventoryDialog.idToClone}
                onClose={() => setShowManageProductInventoryDialog({ open: false, isClone: false, idToClone: null })}
                onSuccess={() => {
                    setShowManageProductInventoryDialog({ open: false, isClone: false, idToClone: null });
                    fetchProductInventory()
                }}
            />
        }
        {
            showRepairJobDialog &&
            <ManageRepairJob
                fromInventory
                inventories={selectedRecords?.map(s => s.id)}
                open={showRepairJobDialog}
                onClose={() => setShowRepairJobDialog(false)}
                onSuccess={() => {
                    setShowRepairJobDialog(false);
                    fetchProductInventory()
                }}
            />
        }
        {
            showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the ${storedRoutes ? storedRoutes.productInventory?.title?.toLowerCase() : RESOURCE_LABEL.productInventory?.toLowerCase()} ${deleteRecord?._id ? deleteRecord?.assetNumber : ""} ? `}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Fragment >
    );
}

export default ProductInventory;
