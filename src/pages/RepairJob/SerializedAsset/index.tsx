import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { Link, useHistory } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Tooltip, IconButton, Menu, MenuItem, Dialog, TextField, CircularProgress } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import {
    gridLoadingTimeout, repairJob, REPAIR_JOB_STATUS, deliveryTicket, INVENTORY_STATUS, serializedAsset,
    DELIVERY_TICKET_TYPE, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_REFRENCE_TYPE, prepareDataForGrid, INVENTORY_OWNER_TYPE
} from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from "react-device-detect";
import ManageDeliveryTicket from "../../DeliveryTicket/ManageDeliveryTicket";
import AssetScrapRepairDialog from "../../../components/AssetScrapRepairDialog/AssetScrapRepairDialog";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { useData } from "../../../StateProvider/Provider";
import { ExpandMore } from '@material-ui/icons';
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { GiAutoRepair } from 'react-icons/gi';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { groupBy, uniq, map } from "lodash";

const SerializedAsset = ({ repairJobData, fetchRepairJobData, repairedAssetStatus, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions, selectedEntity } }: any = useData();

    const history = useHistory()
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

    const [downlodingFile, setDownlodingFile] = useState(false)
    const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false)
    const [okBtnLoading, setOkBtnLoading] = useState(false)

    const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: "", message: "" })
    const [anchorEl, setAnchorEl] = useState(null);

    const { getColumnData } = useColumns();
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [columns, setColumns] = useState(null)

    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: "", data: {} });
    const [repairAssetDialog, setRepairAssetDialog] = useState({ open: false, assetId: null, assetName: null, assetIds: [] })

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const openActions = (event) => {
        setAnchorActionEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorActionEl(null);
    };

    useEffect(() => {
        fetchGridColumns()
        fetchRecords();
    }, []);

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=${serializedAsset.resource}`)
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path)
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData]
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName)
                        }
                    }
                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    actionsRenderer: ActionsRenderer,
                    ...tempFrameworkComponent,
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns])
                fetchRecords()
            })
    }

    const fetchRecords = () => {
        dispatch({ type: "loading", loading: true });
        dispatch({ type: "initialize", data: [], count: 0 });
        if (gridApi) {
            gridApi.deselectAll();
        }
        localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
        axiosInstance().get(`${repairJob.api}/${repairJobData._id}/assets`)
            .then(({ data }) => {
                let rows: any = data?.data.map((u) => {
                    let finalObject = prepareDataForGrid(u, user);
                    finalObject["canDelete"] = false;
                    finalObject["isChecked"] = false;
                    finalObject["allowedToEdit"] = true;
                    finalObject["hideSelection"] = [INVENTORY_STATUS.lost].includes(u.status);
                    return finalObject;
                });
                dispatch({ type: "initialize", data: rows, count: rows.length });
                setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);

            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const ActionsRenderer = (params) => (
        <div className="d-flex gap-1">
            {params.data.repaired ?
                <HtmlTooltip title="Repaired">
                    <CheckCircleIcon color="primary" fontSize="small" />
                </HtmlTooltip>
                :
                ![INVENTORY_STATUS.lost, INVENTORY_STATUS.scrap].includes(params.data?.status) && params.data?.currentOwnerType === INVENTORY_OWNER_TYPE.brand ?
                    <HtmlTooltip title="Repair Asset">
                        <IconButton
                            size="small"
                            aria-label="Repair Asset"
                            color="primary"
                            onClick={() => {
                                setRepairAssetDialog({ open: true, assetId: params.data._id, assetName: `${params.data.assetNumber}`, assetIds: [] })
                            }}
                        >
                            <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                    </HtmlTooltip> : null
            }
        </div>
    );


    const handleTicketDialog = (ticketType, pickupFromType, deliveryToType) => {
        const data = {}
        data["ticketName"] = repairJobData.repairJobName;
        data["refrenceId"] = repairJobData._id;
        data["pickupFromType"] = pickupFromType;
        var pickupFrom = "";
        if (selectedRecords[0].currentOwnerType === INVENTORY_OWNER_TYPE.brand) {
            pickupFrom = selectedRecords[0].warehouseId;
        }
        else {
            pickupFrom = selectedRecords[0]?.currentOwnerId;
        }
        data["pickupFrom"] = pickupFrom;
        data["pickupFromAddress"] = selectedRecords[0]?.currentLocationId;

        data["deliveryToType"] = deliveryToType;
        setShowTicketDialog({ open: true, ticketType: ticketType, data: data });
        closeActions()
    };

    const checkUniqWarehouseAndOwner = () => {
        if (selectedRecords.length === 0) {
            return true;
        } else if (uniq(map(selectedRecords, "warehouseId")).length === 1) {
            if (uniq(map(selectedRecords, "currentOwnerType"))[0] === INVENTORY_OWNER_TYPE.brand) {
                return false;
            }
            else {
                return true;
            }
        } else {
            return true;
        }
    };

    const checkUniqcurrentOwnerType = () => {
        if (selectedRecords.length === 0) {
            return true;
        } else if (uniq(map(selectedRecords, "currentOwnerType")).length === 1) {
            if (uniq(map(selectedRecords, "currentOwnerType"))[0] === INVENTORY_OWNER_TYPE.brand) {
                return false;
            }
            else {
                return true;
            }
        } else {
            return true;
        }
    };

    const checkUniqSupplier = () => {
        if (selectedRecords.length === 0) {
            return true;
        } else if (uniq(map(selectedRecords, "currentOwnerId")).length === 1) {
            if (uniq(map(selectedRecords, "currentOwnerType"))[0] === INVENTORY_OWNER_TYPE.supplierAccount) {
                return false;
            }
            else {
                return true;
            }
        } else {
            return true;
        }
    };

    return (<>
        <Box display="flex" justifyContent="flex-end" m={1} >
            <Box display="flex" alignItems="center">
                {!isMobile && <Button
                    onClick={() => {
                        setDownlodingFile(true);
                        axiosInstance().get(`/repair-job/${repairJobData._id}/pdf`)
                            .then(({ data }) => {
                                axiosInstance()
                                    .get(`user/download?fileName=${data.data.fileName}`, {
                                        responseType: "blob",
                                    })
                                    .then(({ data }) => {
                                        const file = new Blob([data], { type: "application/pdf" });
                                        const fileURL = URL.createObjectURL(file);
                                        const pdfWindow = window.open();
                                        pdfWindow.location.href = fileURL;
                                        toastConfig.setToastConfig({ open: true, type: "success", message: "Preview file downloaded successfully." })
                                        setDownlodingFile(false);
                                    })
                                    .catch((err) => {
                                        toastConfig.setToastConfig(err);
                                        setDownlodingFile(false);
                                    });
                            }).catch((err) => {
                                toastConfig.setToastConfig(err);
                                setDownlodingFile(false);
                            })
                    }}
                    variant="outlined"
                    color="primary"
                    type="button"
                    size="small"
                    disabled={downlodingFile}
                    startIcon={<AiFillFilePdf />}
                >
                    {downlodingFile ? "Please wait..." : "Preview"}
                </Button>}
                <Box mx={1} />
                {repairJobData?.status !== REPAIR_JOB_STATUS.completed &&
                    <Fragment>
                        <Button variant="outlined" color="primary" aria-controls="simple-menu"
                            aria-haspopup="true"
                            disabled={selectedRecords.length === 0}
                            size="small"
                            onClick={handleClick}
                            endIcon={<ArrowDropDownIcon />}>
                            Change Status
                        </Button>
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={() => {
                                setAnchorEl(null)
                                setStatusToUpdate({ open: true, isUpdating: false, status: "Scrap", message: "" })
                            }}>Scrap</MenuItem>
                            <MenuItem onClick={() => {
                                setAnchorEl(null)
                                setStatusToUpdate({ open: true, isUpdating: false, status: "Lost", message: "" })
                            }}>Lost</MenuItem>
                        </Menu>
                        <Box mx={1} />
                        <Button
                            variant={isMobile && !isTablet ? "text" : "contained"}
                            color="primary"
                            type="button"
                            size="small"
                            style={isMobile && !isTablet ? { color: "#FFFF5C" } : {}}
                            disabled={selectedRecords.length === 0 || selectedRecords.some(s => s.repaired === true) || checkUniqcurrentOwnerType()}
                            onClick={() => {
                                setRepairAssetDialog({ open: true, assetId: null, assetName: null, assetIds: [...selectedRecords.map(m => m._id)] })
                            }}
                        >
                            {isMobile && !isTablet ? <GiAutoRepair /> : "Complete Repair"}
                        </Button>
                        <Box mx={1} />
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            aria-controls="action-menu"
                            disabled={(selectedRecords.length === 0)}
                        >
                            Actions <ExpandMore />
                        </Button>
                        <Menu
                            anchorEl={anchorActionEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left'
                            }}
                            id="action-menu"
                            open={Boolean(anchorActionEl)}
                            onClose={closeActions}
                        >
                            <MenuItem
                                disabled={(selectedRecords.length === 0 || checkUniqWarehouseAndOwner() || selectedRecords.some(s => s.repaired === true))}
                                onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.delivery, DELIVERY_FROM_TO_TYPE.plant, DELIVERY_FROM_TO_TYPE.plant) }}>
                                Send to Plant
                            </MenuItem>
                            <MenuItem
                                disabled={(selectedRecords.length === 0 || checkUniqWarehouseAndOwner() || selectedRecords.some(s => s.repaired === true))}
                                onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.loading, DELIVERY_FROM_TO_TYPE.plant, DELIVERY_FROM_TO_TYPE.supplier) }}>
                                Send to Supplier
                            </MenuItem>
                            <MenuItem
                                disabled={(selectedRecords.length === 0 || checkUniqSupplier() || selectedRecords.some(s => s.repaired === true))}
                                onClick={() => { handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier, DELIVERY_FROM_TO_TYPE.plant) }}>
                                Receiving from Supplier
                            </MenuItem>
                        </Menu>
                    </Fragment>
                }
            </Box>
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns ?
                isMobile && !isTablet ? <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={true}
                    primaryField={columns?.find(d => d.field)}
                    onClick={(data) => {
                        history.push(`${routes.serializedAssetDetail.path}/${data._id}`)
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={() => {

                    }}
                    extraParamsToCheckDelete={true}
                    onDelete={() => {

                    }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={[
                        {
                            label: "Status: ",
                            field: "status",
                        }
                    ]}
                    additionalDetails={[]}
                    owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                    onCreate={false}
                    showClone={false}
                    onClone={() => { }}
                    renderedFrom={renderedFrom}
                /> : <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    allowSelection={repairJobData && repairJobData["status"] === REPAIR_JOB_STATUS.completed ? false : true}
                    allowAction={true}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    rowClassRules={{
                        "red-data-row":
                            function (params) {
                                return ["Scrap", "Lost"].some(s => s === params.data.status);
                            },
                    }}
                    isClientSideGrid={true}
                    refreshGrid={fetchRecords}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </Grid>
        {
            showRemoveAssetFromReceivingTicketDialog && (
                <ConfirmationDialog
                    open={showRemoveAssetFromReceivingTicketDialog}
                    message={`Are you sure you want to remove selected records from Receiving Ticket(s) ? `}
                    onClose={() => {
                        setShowRemoveAssetFromReceivingTicketDialog(false);
                    }}
                    onOk={() => {
                        setOkBtnLoading(true);
                        const groupByCalls = groupBy(selectedRecords, "receivingTicketId");
                        let apiCalls = [];
                        Object.keys(groupByCalls).forEach((key) => {
                            apiCalls.push(axiosInstance().put(`${deliveryTicket.api} / ${key} / assets`, { ids: groupByCalls[key].map(m => m._id) }));
                        })
                        Promise.all(apiCalls).then(() => {
                            toastConfig.setToastConfig({ open: true, type: "success", message: `Selected records removed from assiged Receiving Ticket(s)` });
                            fetchRecords();
                        }).catch((error) => {
                            toastConfig.setToastConfig(error);
                        }).finally(() => {
                            setOkBtnLoading(false);
                            setShowRemoveAssetFromReceivingTicketDialog(false);
                        });
                    }}
                    okBtnLoading={okBtnLoading}
                />
            )
        }
        {statusToUpdate.open && <AssetScrapRepairDialog
            statusToUpdate={statusToUpdate}
            setStatusToUpdate={setStatusToUpdate}
            selectedRecords={selectedRecords}
            id={repairJobData._id}
            onClose={() => {
                setStatusToUpdate(prevState => ({ ...prevState, open: false }))
            }}
            onSuccess={() => {
                fetchRecords();
                repairedAssetStatus([]);
            }}
        />}
        {showTicketDialog.open &&
            <ManageDeliveryTicket
                ticketType={showTicketDialog.ticketType}
                refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.repairJob}
                refrenceData={showTicketDialog.data}
                productInventory={selectedRecords}
                onClose={() => setShowTicketDialog({ open: false, ticketType: "", data: {} })}
                onSuccess={() => {
                    setShowTicketDialog({ open: false, ticketType: "", data: {} })
                    fetchRecords();
                }}
            />}
        {repairAssetDialog.open && <ConfirmationDialog
            open={true}
            message={`Are you sure you want to complete repair of ${repairAssetDialog.assetId ? repairAssetDialog.assetName : "selected asset(s)"} ? `}
            onClose={() => {
                setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] })
            }}
            onOk={() => {
                setOkBtnLoading(true)
                axiosInstance().put(`${repairJob.api}/${repairJobData._id}/assets/repaired`, { assets: repairAssetDialog.assetId ? [repairAssetDialog.assetId] : repairAssetDialog.assetIds, repaired: true }).then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    setOkBtnLoading(false)
                    setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] });
                    fetchRepairJobData()
                    fetchRecords();
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                    setOkBtnLoading(false)
                })
            }}
            okBtnLoading={okBtnLoading}
        />
        }
    </>
    );
}

export default SerializedAsset;

