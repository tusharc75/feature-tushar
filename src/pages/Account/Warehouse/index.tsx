
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, warehouse } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import routes from "src/components/Helpers/Routes";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { useHistory } from "react-router-dom";
import useColumns, { getFrameworkComponents, getStaticFields } from "src/constants/useColumns";
import ImportExportLinks from "src/components/Helpers/ImportExportLinks";
import { Button, Grid, IconButton, Menu, MenuItem, Tooltip } from "@material-ui/core";
import { AddOutlined, Delete, ExpandMore } from "@material-ui/icons";
import ConfirmationDialogRaw from "src/components/Helpers/ConfirmationDialog";
import { styles } from "@material-ui/pickers/views/Calendar/Calendar";
import { MdAdd } from "react-icons/md";
import WarhouseList from "./WarhouseList";

const Warehouse = ({ reference, api, id, renderedFrom, accountId = '' }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();
    const history = useHistory();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, filters, sorting, selectedRecords } = state;
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState(null)
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)
    const { getColumnData } = useColumns();
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [openAssignWarehouse, setOpenAssignWarehouse] = useState(false);
    const [isAddingWarehouse, setAddingWarehouse] = useState(false);
    const [warehouseArray, setWarehouseArray] = useState([]);

    useEffect(() => {
        fetchColumns()
    }, []);

    useEffect(() => {
        const timeout = setTimeout(fetchAccountWarehouse, 500);
        return () => clearTimeout(timeout)
    }, [page, limit, filters, sorting]);


    const ActionsRenderer = (params) => (
        <Tooltip title="Delete">
            <IconButton
                onClick={() => {
                    setShowConfirmBox({ open: true, data: [params.data] })
                }}
            >
                <Delete fontSize='small' color='error' />
            </IconButton>
        </Tooltip>
    )

    const fetchColumns = () => {
        axiosInstance()
            .get(`/field?resource=Warehouse`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn: any = getColumnData(renderedFrom, o?.fieldData, routes.warehouseDetail.path);
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData];
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                });
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                    actionsRenderer: ActionsRenderer
                };
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns([...columns]);
                fetchAccountWarehouse()
            })
    }

    const fetchAccountWarehouse = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`/${api}/${id}/warehouse`).then(({ data }) => {
            setWarehouseArray(data.data)
            let rows = data.data?.map((u, user) => {
                let finalObject = prepareDataForGrid(u?.warehouseDetail);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u?.warehouseDetail._id);
                return {
                    ...finalObject,
                };
            });
            dispatch({
                type: "initialize", data: rows, count: rows.length,
                selectedRecords: rows.filter(f => f.isChecked === true)
            });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const handleRemove = () => {
        setIsDeleting(true)
        const { data } = showConfirmBox
        let tempArray = warehouseArray.filter(obj => data.some(d => d._id === obj.warehouse)).map(d => d._id)
        axiosInstance().put(`/${api}/${id}/warehouse/remove`, {
            ids: tempArray
        })
            .then(() => {
                setIsDeleting(false)
                setShowConfirmBox({ open: false, data: null });
                fetchAccountWarehouse()
            })
            .catch(err => {
                toastConfig.setToastConfig(err)
                setIsDeleting(false)
            })


    }

    const handleAddWarehouse = (rows) => {
        setAddingWarehouse(true)
        axiosInstance().post(`/${api}/${id}/warehouse`, { "warehouse": rows.map(d => d._id) })
            .then(() => {
                setOpenAssignWarehouse(false)
                fetchAccountWarehouse()
                setAddingWarehouse(false)
            }).catch((error) => {
                setOpenAssignWarehouse(false)
                toastConfig.setToastConfig(error)
                setAddingWarehouse(false)
            });
    }

    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex" pt={1} alignItems="center">
                <Button
                    variant={'contained'}
                    color="primary"
                    size="small"
                    onClick={() => {
                        setOpenAssignWarehouse(true);
                    }}
                >
                    {`Assign ${routes.warehouse.title}`}
                </Button>
            </Box>
            <Box display="flex" pt={1} justifyContent="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={selectedRecords.length === 0 || isDeleting}
                    onClick={() => {
                        setShowConfirmBox({ open: true, data: selectedRecords })
                    }}>
                    Delete
                </Button>
                <Box mx={1} />
            </Box>
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns ?
                isMobile && !isTablet ? <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions.warehouse}
                    primaryField={columns?.find(d => d.field)}
                    onClick={(d) => {
                        history.push(`${routes.warehouseDetail.path}/${d._id}`)
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={(d) => {
                        history.push(`${routes.warehouseDetail.path}/${d._id}`)
                    }}
                    extraParamsToCheckDelete={false}
                    onDelete={() => { }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    additionalDetails={[]}
                    chips={[
                        {
                            label: "Storage Type",
                            field: "storageType",
                        },
                    ]}
                    owerCollaboratorInitialsOrImages=""
                    onCreate={false}
                    showClone={true}
                    onClone={() => { }}
                    renderedFrom={renderedFrom} /> :
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
                            actionWidth={100}
                            page={page}
                            loading={loading}
                            allowSelection={true}
                            allowAction={true}
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchAccountWarehouse}
                            isClientSideGrid={true}
                        /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </Grid>
        {showConfirmBox.open && (
            <ConfirmationDialogRaw
                open={true}
                message={`Are you sure you want to delete this ${routes.warehouse.title}?`}
                okBtnLoading={isDeleting}
                onClose={() => {
                    setShowConfirmBox({ open: false, data: null });
                }}
                onOk={handleRemove}
            />
        )}
        {openAssignWarehouse &&
            <WarhouseList
                isCustomer={reference === "customerContact"}
                api={reference === "customerContact" ? `/customer-account/${accountId}/warehouse` : "/warehouse"}
                isAddingWarehouse={isAddingWarehouse}
                addWarehouse={handleAddWarehouse}
                onClose={() => { setOpenAssignWarehouse(false) }}
                renderedFrom={renderedFrom}
                assignedWarehouse={dataRows.map(d => d._id)}
            />
        }
    </>
    );
}

export default Warehouse;