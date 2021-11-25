import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { purchaseOrder } from "../../../constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import ServiceDialog from "./ServiceDialog";
import { FaCartArrowDown, FaCartPlus } from "react-icons/fa";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid } from "../../../constants/helpers";
import { getColumnData, getStaticFields, getFrameworkComponents, getSortedColumns } from "../../../constants/columns"
import { GrBusinessService } from "react-icons/all";


const Product = ({ purchaseOrderData, id }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [showServiceDialog, setShowServiceDialog] = useState(false)
    const [selectedServiceData, setSelectedServiceData] = useState(null)

    useEffect(() => {
        fetchPurchaseOrderService();
    }, [id]);

    const GenrateColoum = (fields, column, rendererNames, editable) => {
        let _fields = fields;
        _fields.forEach((ele) => {
            if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _unit
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.leval = ele.leval
                            if (!ele.isFormula && !ele.isUneditable && editable) {
                                col.cellRenderer = "commonRenderer";
                                col.cellEditor = "numericCellEditor";
                                col.editable = true;
                            } else {
                                col.cellRenderer = "commonRenderer";
                            }
                            column.push(col)
                        }
                    })
                }
                else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        ele.displayCurrency.forEach((_currency) => {
                            let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                            let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
                            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                let col: any = {}
                                col.field = fieldName
                                col.headerName = fieldLabel
                                col.width = 180
                                col.show = true
                                col.leval = ele.leval
                                if (!ele.isFormula && !ele.isUneditable && editable) {
                                    col.cellRenderer = "commonRenderer";
                                    col.cellEditor = "numericCellEditor";
                                    col.editable = true;
                                } else {
                                    col.cellRenderer = "commonRenderer";
                                }
                                column.push(col)
                            }
                        })
                    })
                }
                else if (ele.type === "currencyAmount") {
                    ele.displayCurrency.forEach((_currency) => {
                        let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _currency
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.leval = ele.leval
                            if (!ele.isFormula && !ele.isUneditable && editable) {
                                col.cellRenderer = "commonRenderer";
                                col.cellEditor = "numericCellEditor";
                                col.editable = true;
                            } else {
                                col.cellRenderer = "commonRenderer";
                            }
                            column.push(col)
                        }
                    })
                }
            }
            else {
                if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                    let currentColumn: any = getColumnData(routes.productBuilder.title, ele, routes.productBuilder.path, true)
                    if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine") {
                        if (!ele.isFormula && !ele.isUneditable && editable) {
                            if (ele.type === "decimal" || ele.type === "percent") {
                                currentColumn.columnData.cellEditor = "numericCellEditor";
                            }
                            currentColumn.columnData.editable = true;
                        }
                    }
                    column.push({ ...currentColumn.columnData, leval: ele.leval });
                    if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                        rendererNames.push(currentColumn?.rendererName)
                    }
                }
            }
        })
    }

    useEffect(() => {
        axiosInstance().get("/field/child?resource=Purchase Order Service").then(({ data: { data } }) => {
            const fields = CURReplaceByCurrencySingle(data, purchaseOrderData.currency)
            let rendererNames = [];
            GenrateColoum(fields, columns, rendererNames, false);
            let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
            tempFrameworkComponent = {
                commonRenderer: CommonRenderer,
                actionsRenderer: ActionsRenderer,
                ...tempFrameworkComponent,
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            setColumns([...columns])
        })
    }, []);

    const fetchPurchaseOrderService = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`${purchaseOrder.api}/service/${id}`).then(({ data: { data } }) => {
            let rows = data?.map((item) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            dispatch({ type: "initialize", data: rows, count: rows.length });
            dispatch({ type: "loading", loading: false });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const ActionsRenderer = (params) => (
        <>
            <HtmlTooltip title="Edit">
                <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => {
                        setShowServiceDialog(true)
                        setSelectedServiceData(params.data)
                    }}
                >
                    <EditIcon color="primary" />
                </IconButton>
            </HtmlTooltip>
            <GridDeleteIcon
                hasDeletePermission={permissions?.purchaseOrder?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    deletePurchaseOrderService([params.data._id])
                }}
                entity="rentalManagement"
            />
        </>
    );

    const handleAddService = (rows) => {
        axiosInstance().post(`${purchaseOrder.api}/service/${id}/add`, { services: rows })
            .then(() => {
                fetchPurchaseOrderService()
                setShowServiceDialog(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const handleUpdateService = (rows) => {
        axiosInstance().put(`${purchaseOrder.api}/service/${id}/update`, { services: rows })
            .then(() => {
                fetchPurchaseOrderService()
                setShowServiceDialog(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const deletePurchaseOrderService = (ids) => {
        axiosInstance().post(`${purchaseOrder.api}/service/${id}/delete`, { ids })
            .then(() => {
                fetchPurchaseOrderService()
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    return (
        <Fragment>
            <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex">
                    <Button
                        variant={isMobile ? "outlined" : "contained"}
                        color="primary"
                        size="small"
                        onClick={() => {
                            setShowServiceDialog(true);
                            setSelectedServiceData(null)
                        }}
                    >
                        {isMobile ? <GrBusinessService size={20} /> : "Add Service"}
                    </Button>
                </Box>
            </Box>
            {columns && frameWorkComponent ? isMobile ?
                <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions}
                    primaryField={columns?.find(d => d.field === "description")}
                    onClick={(data) => {
                        setShowServiceDialog(true)
                        setSelectedServiceData(data)
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={(data) => {
                        setShowServiceDialog(true)
                        setSelectedServiceData(data)
                    }}
                    extraParamsToCheckDelete={true}
                    onDelete={(data) => {
                        deletePurchaseOrderService([data._id])
                    }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={
                        [{
                            label: `Description: `,
                            field: "description",
                            forceShow: true
                        }]
                    }
                    onCreate={null}
                    showClone={false}
                    fullHeight={true}
                    renderedFrom={routes.purchaseOrderDetail.title}
                    onClone={() => { }}
                />
                :
                <CustomAgGridEditable
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    allowAction={true}
                    actionWidth={150}
                    allowSelection={true}
                    isClientSideGrid={true}
                    loading={loading}
                    onCellValueChanged={(row) => {
                        //handleUpdateOrderProduct(row.data)
                    }}
                    renderedFrom="purchaseOrderDetailsPageInventory"
                    refreshGrid={fetchPurchaseOrderService}
                />
                : <Box
                    p={2}
                    height={500}
                    bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            }
            {showServiceDialog &&
                <ServiceDialog
                    onClose={() => {
                        setShowServiceDialog(false)
                        setSelectedServiceData(null)
                    }}
                    handleAddService={handleAddService}
                    handleUpdateService={handleUpdateService}
                    currency={purchaseOrderData?.currency}
                    serviceData={selectedServiceData}
                />
            }
        </Fragment>
    );
};

export default Product;
