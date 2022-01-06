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
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { purchaseOrder, isObjectEmpty, gridLoadingTimeout, RESOURCE_LABEL } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import HtmlTooltip from "../../components/CustomTooltipTitle";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { prepareDataForGrid } from "../../constants/helpers"
import ManagePurchaseOrder from "./ManagePurchaseOrder";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import { MdAccountCircle } from "react-icons/md";
import { AiFillCrown, MdAdd } from "react-icons/all";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile } from 'react-device-detect';
import { useHistory } from "react-router-dom";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

const PurchaseOrder = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();

    const [showManagePurchaseOrderDialog, setShowManagePurchaseOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
    const [isAllChecked, setIsAllChecked] = useState(false);
    const [clonedData, setClonedData] = useState([])
    const localStorageSelectedRecords = `${routes.purchaseOrder?.title}_selected`;

    const [fromRental, setFromRental] = useState(history.location?.state?.rental);
    const [fromSalesOrder, setFromSalesOrder] = useState(history.location?.state?.salesOrder);

    const {
        state: { user, permissions, selectedEntity },
    }: any = useData();
    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        fetchPurchaseOrder()
    }, [page, limit, filters, sorting, search, selectedEntity, fromRental, fromSalesOrder]);

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
        let dataToProcess, count;
        axiosInstance().get(`${purchaseOrder.api}${queryString}`).then(({ data }) => {
            dataToProcess = data?.data;
            count = data?.count;

            let rows = dataToProcess.map((u) => {
                const { owner, collaborator, createdBy, updatedBy, subMarketSegment, staticData, marketSegment, ...restProperties } = u;

                let finalObject = prepareDataForGrid(u);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
                finalObject["allowedToEdit"] = (
                    [...(u.collaborator ?? []), u.owner].some(
                        (d) => d?.optionValue === user?.user?._id
                    )
                );

                finalObject["owerCollaboratorInitialsOrImages"] = [];
                if (finalObject["owner"])
                    finalObject["owerCollaboratorInitialsOrImages"].push({ initials: finalObject["owner"] });

                finalObject["owerCollaboratorInitialsOrImages"].forEach((f) => {
                    if (f.initials) {
                        f.initials = f.initials.split(" ").map((i) => i[0]).join("");
                    }
                })

                let res = {
                    ...finalObject,
                };
                return res;
            });
            setIsAllChecked(false);
            setClonedData(data)
            if (appendRows) {
                dispatch({
                    type: "initialize", data: [...dataRows, ...rows],
                    count: data.count, selectedRecords: [...dataRows, ...rows].filter(f => f.isChecked === true)
                });
            } else {
                dispatch({
                    type: "initialize", data: rows, count: data.count,
                    selectedRecords: rows.filter(f => f.isChecked === true)
                });
            }

            if (gridApi) {
                try {
                    let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : []
                    if (oldSelectedRecords.length > 0) {
                        gridApi.forEachNode(function (node) {
                            node.setSelected(
                                oldSelectedRecords.some((o) => o === node.data._id)
                            );
                        });
                    }
                } catch (ex) {
                    console.error("Error in getting selected records from local storage")
                }
            }

            dispatch({ type: "initialize", data: rows, count: data.count });
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
        let filterById = [];

        if (fromRental) {
            filterById.push({ field: "rentalJob", term: fromRental?._id });
        }

        if (fromSalesOrder) {
            filterById.push({ field: "salesOrder", term: fromSalesOrder?._id });
        }

        if (filterById.length > 0) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`
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
            {/* {permissions?.purchaseOrder?.isDelete &&
                <HtmlTooltip title="Delete">
                    <IconButton size="small" aria-label="Delete" onClick={() => {
                        setDeleteRecord(params.data);
                        setShowDeleteConfirmBox(true)
                    }} >
                        <DeleteIcon color="error" />
                    </IconButton>
                </HtmlTooltip >
            } */}
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
                        {fromRental && (
                            <Chip
                                className="ml-3"
                                color="primary"
                                label={`Product : ${fromRental?.rentalJobName}`}
                                onDelete={() => {
                                    setFromRental(null);
                                }}
                            />
                        )}
                        {fromSalesOrder && (
                            <Chip
                                className="ml-3"
                                color="primary"
                                label={`Product : ${fromSalesOrder?.salesOrderNo}`}
                                onDelete={() => {
                                    setFromSalesOrder(null);
                                }}
                            />
                        )}
                    </Grid>
                    <Grid xs={isMobile ? 12 : 6} container className={styles.filter_side} >
                        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div" >
                            <Grid style={{ display: "flex", flex: 1 }}>
                                <SearchBox
                                    onSearch={handleSearch}
                                    width="242px"
                                    size="small"
                                    value={search}
                                    style={isMobile ? { flex: 1 } : {}}
                                />

                            </Grid>

                            <Grid style={{ display: "flex", gap: "5px" }}>
                                {permissions?.purchaseOrder?.isCreate &&
                                    <Button onClick={() => {
                                        setShowManagePurchaseOrderDialog({ open: true, isClone: false, idToClone: null })
                                    }} variant={isMobile ? "text" : "contained"} size="small" color="primary" className={isMobile ? "mobile_button" : styles.add_submit_btn}
                                        startIcon={isMobile ? null : <AddOutlined />}> {isMobile ? <MdAdd size={23} /> : "Add"}</Button>
                                }

                                {/* <HtmlTooltip title="Please select some purchase orders">
                                    <span>
                                        <Button
                                            variant={isMobile ? "text" : "contained"}
                                            color="default"
                                            size="small"
                                            onClick={openActions}
                                            disabled={selectedRecords.length ? false : true}
                                            aria-controls="action-menu"
                                            className={isMobile ? "mobile_button" : styles.add_submit_btn}
                                        >
                                            {isMobile ? "" : "Actions"} <ExpandMore />

                                        </Button>
                                    </span>
                                </HtmlTooltip> */}
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
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </div>
            {columns ?
                Object.keys(frameWorkComponent).length > 0 ?
                    isMobile ?
                        <CustomSwipableList
                            allowSelection={true}
                            allowSwipe={true}
                            permissions={permissions.purchaseOrder}
                            primaryField={columns?.find(d => d.primaryField)}
                            onClick={(data) => {
                                history.push(`${routes.purchaseOrderDetail.path}/${data._id}`)
                            }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                                history.push(`${routes.purchaseOrderDetail.path}/${data._id}?openEdit=true`)
                            }}
                            extraParamsToCheckDelete={true}
                            onDelete={(data) => {
                                setDeleteRecord(data);
                                setShowDeleteConfirmBox(true)
                            }}
                            rowCount={rowCount}
                            page={page}
                            loading={loading}
                            chips={[
                                {
                                    label: "Delivery Date: ",
                                    field: "deliveryDate",
                                    fieldType: "date",
                                    setBackground: (data) => { return data.status === "" && new Date() > new Date(data.deliveryDate) ? { backgroundColor: "#efcccc" } : null }
                                },
                                {
                                    label: "Status: ",
                                    field: "status",
                                }
                            ]}
                            onCreate={false}
                            showClone={true}
                            onClone={(data) => { setShowManagePurchaseOrderDialog({ open: true, isClone: true, idToClone: data._id }); }}
                            renderedFrom={routes.purchaseOrder?.title}
                        /> :
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
                currency={user?.entity?.find(d => d._id === selectedEntity)?.currency}
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
