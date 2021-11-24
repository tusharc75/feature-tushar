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
import { purchaseOrder, isObjectEmpty, gridLoadingTimeout, RESOURCE_LABEL } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from "react-router-dom";
import HtmlTooltip from "../../components/CustomTooltipTitle";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import useColumns, {getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { prepareDataForGrid } from "../../constants/helpers"
import ManagePurchaseOrder from "./ManagePurchaseOrder";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

const PurchaseOrder = () => {

    const toastConfig = useContext(CustomToastContext)
    const [showManagePurchaseOrderDialog, setShowManagePurchaseOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { user, permissions },
    }: any = useData();
    const {getColumnData} = useColumns();
    const history = useHistory();

    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        fetchPurchaseOrder()
    }, [page, limit, filters, sorting, search]);

    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Purchase Order")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(routes.purchaseOrder?.title, o?.fieldData, routes.purchaseOrderDetail.path)

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

    const fetchPurchaseOrder = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${purchaseOrder.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u, i) => ({
                ...prepareDataForGrid(u, user)
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

    const columnState = JSON.parse(localStorage.getItem(routes.purchaseOrder?.title));


    if (columnState) {
        columns.map((item) => {
            columnState.map((d) => {
                if (d.colId == item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }



    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`${purchaseOrder.api}/remove`, { "ids": ids }).then(() => {
            fetchPurchaseOrder();
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
                permissions?.purchaseOrder?.isCreate &&
                <HtmlTooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowManagePurchaseOrderDialog({ open: true, isClone: true, idToClone: params.data._id });
                        }}
                    >
                        <FileCopyIcon color="primary" />
                    </IconButton>
                </HtmlTooltip>
            }
            {permissions?.purchaseOrder?.isDelete &&
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
                <CustomBreadCrumbs routes={[routes.purchaseOrder]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions?.purchaseOrder}
                    module="purchase order"
                    api={purchaseOrder.api}
                    afterImportCompleted={() => {
                        fetchPurchaseOrder();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length}
                    ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                    onExportToExcelSuccess={() => {
                        if (gridApi) gridApi.deselectAll()
                        else fetchPurchaseOrder()
                    }}
                />
            </Grid>

        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiStockpiles size={20} style={{ paddingBottom: "3px" }} className="headerLogo" />
                        <span className="listingHeader">{routes.purchaseOrder?.title} </span>
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
                            {permissions?.purchaseOrder?.isCreate &&
                                <Button className={styles.add_submit_btn} onClick={() => {
                                    setShowManagePurchaseOrderDialog({ open: true, isClone: false, idToClone: null })
                                }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                            }

                            <HtmlTooltip title="Please select some purchase orders">
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
                                {permissions?.purchaseOrder?.isDelete && <MenuItem onClick={() => {
                                    closeActions()
                                    setShowDeleteConfirmBox(true)
                                }}>Delete</MenuItem>}
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
                        renderedFrom={routes.purchaseOrder?.title}
                        refreshGrid={fetchPurchaseOrder}
                    /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {
            showManagePurchaseOrderDialog.open &&
            <ManagePurchaseOrder
                isClone={showManagePurchaseOrderDialog.isClone}
                purchaseOrderId={showManagePurchaseOrderDialog.idToClone}
                onClose={() => setShowManagePurchaseOrderDialog({ open: false, isClone: false, idToClone: null })}
                onSuccess={() => {
                    setShowManagePurchaseOrderDialog({ open: false, isClone: false, idToClone: null });
                    fetchPurchaseOrder()
                }}
            />
        }
        {
            showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the ${storedRoutes ? storedRoutes.purchaseOrder?.title?.toLowerCase() : RESOURCE_LABEL.purchaseOrder?.toLowerCase()} ${deleteRecord?._id ? deleteRecord?.assetNumber : ""} ? `}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Fragment >
    );
}

export default PurchaseOrder;
