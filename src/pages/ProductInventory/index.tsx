import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom'
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
import { productInventory, isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import ManageProductInventory from "./ManageProductInventory";
import ManageRepairJob from '../RepairJob/ManageRepairJob'
import FileCopyIcon from '@material-ui/icons/FileCopy';
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useHistory } from "react-router-dom";
import HtmlTooltip from "../../components/CustomTooltipTitle";

const ProductInventory = () => {

    const toastConfig = useContext(CustomToastContext)
    const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions },
    }: any = useData();
    const history = useHistory();

    const [warehouse, setWarehouse] = useState(history.location?.state?.warehouse);

    useEffect(() => {
        fetchProductInventory()
    }, [page, limit, filters, sorting, search, warehouse]);

    const columns = [
        { field: "serialNumber", headerName: "Serial Number", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "product", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productRenderer" },
        { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "productCategoryRenderer" },
        { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
        { field: "inServiceDate", headerName: "In Service Date", show: true, cellRenderer: "commonRenderer" },
        { field: "bornInDate", headerName: "Born on Date", show: true, cellRenderer: "commonRenderer" },
        { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "equipmentNumber", headerName: "Equipment Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
        { field: "batchNumber", headerName: "Batch Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "inventoryNumber", headerName: "Inventory Number", show: true, cellRenderer: "commonRenderer" },
        { field: "warehouse", headerName: "Warehouse", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u, i) => ({
                ...u,
                id: u._id,
                serialNumber: u.serialNumber,
                inServiceDate: u.inServiceDate,
                bornInDate: u.bornInDate,
                status: u.status,
                warehouse: u.warehouse?.optionLabel,
                product: u.product?.optionLabel,
                productId: u.product?.optionValue,
                createdBy: u.createdBy?.user?.concatedName,
                createdByDate: u.createdBy?.date,
                updatedBy: u.updatedBy?.user?.concatedName,
                updatedByDate: u.updatedBy?.date,
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

        if (warehouse?.optionValue) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "warehouse", term: warehouse?.optionValue }])}`
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

    const NameRenderer = (params) => (
        <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    );

    const ProductRenderer = (params) => (
        <Link className="link" title={params.value} to={`${routes.product.path}/detail/${params.data.productId}`}>
            {params.value}
        </Link>
    );

    const ProductCategoryRenderer = (params) => (
        <> {params.data.productCategory.optionLabel !== undefined && params.data.productCategory.optionLabel !== null ?
            (
                <Chip
                    className="ml-3"
                    style={{ backgroundColor: `${params.data.productCategory?.chipColour}` }}
                    label={`${params.data.productCategory?.optionLabel}`}
                />
            )
            : (
                <NoDataCell />
            )}
        </>
    );

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

    const frameworkComponents = {
        createdByRenderer: CreatedByRenderer,
        productRenderer: ProductRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer,
        nameRenderer: NameRenderer,
        productCategoryRenderer: ProductCategoryRenderer
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
                                label={`Warehouse : ${warehouse.optionLabel}`}
                                onDelete={() => {
                                    setWarehouse(null);
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
                            {permissions?.productInventory?.isUpdate &&
                                <HtmlTooltip title="Please select some inventories">
                                    <span>
                                        <Button
                                            className={styles.add_submit_btn}
                                            onClick={() => setShowRepairJobDialog(true)}
                                            variant="contained"
                                            size="small"
                                            color="primary"
                                            startIcon={<AddIcon />}
                                            disabled={!selectedRecords.length}
                                        >Create Repair Job
                                        </Button>
                                    </span>
                                </HtmlTooltip>
                            }
                            {permissions?.productInventory?.isDelete &&
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
                                <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
            </div>
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
                    actionWidth={150}
                    loading={loading}
                    renderedFrom="productInventoryPage"
                />
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
                message={`Are you sure you want to delete the product inventory ${deleteRecord?._id ? deleteRecord?.assetNumber : ""} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Fragment >
    );
}

export default ProductInventory;
