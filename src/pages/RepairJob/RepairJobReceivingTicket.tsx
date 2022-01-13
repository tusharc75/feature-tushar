import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link, useHistory } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import {
    Button, Tooltip, IconButton, Menu, MenuItem,
    Dialog, TextField, CircularProgress
} from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import {
    gridLoadingTimeout, receivingTicket, repairJob,
    sidebarResource, productInventory as productInventoryHelperObject, repairJobStatus, deliveryTicket, INVENTORY_STATUS
} from "../../constants/helpers";
import { groupBy } from "lodash";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { makeStyles } from '@material-ui/core/styles';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { FaSuitcase } from "react-icons/fa";
import { isMobile, isTablet } from "react-device-detect";
import ManageDeliveryTicket from "../DeliveryTicket/ManageDeliveryTicket";
import AssetScrapRepairDialog from "../../components/AssetScrapRepairDialog/AssetScrapRepairDialog";

const renderedFrom = "repairJob_receiving_ticket"

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
    },
    paper: {
        width: '80%',
        maxHeight: 435,
    },
}));

const RepairJobReceivingTicket = (props) => {
    const { repairJobData, setNextButtonDisabled, setPreviousButtonDisabled, isRepairEnded, setRepairEnded } = props

    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const history = useHistory()
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [downlodingFile, setDownlodingFile] = useState(false)
    const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false)
    const [okBtnLoading, setOkBtnLoading] = useState(false)

    const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: "", message: "" })
    const [anchorEl, setAnchorEl] = useState(null);

    const [showReceivingTicketDialog, setShowReceivingTicketDialog] = useState({ open: false, selectedAssets: [] });

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleReceivingTicketDialog = (selectedAssets) => {
        setShowReceivingTicketDialog({ open: true, selectedAssets: selectedAssets })
    }

    useEffect(() => {
        fetchRecords();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (repairJobData && repairJobData.typeOfRepair === "External" && dataRows.length > 0) {
            const repairedAssets = dataRows.filter((asset: any) => asset?.repaired);
            const assetsWithReceivingTicket = dataRows.filter((asset: any) => asset?.isDelivered);
            const lostAssets = dataRows.filter((asset: any) => asset?.status === "Lost");

            let repairedAssetsLength = dataRows.length - lostAssets.length

            if (repairJobData && repairJobData.status === repairJobStatus[2]) {
                setRepairEnded(true)
            } else if (repairedAssets.length === repairedAssetsLength && assetsWithReceivingTicket.length === repairedAssetsLength) {
                setRepairEnded(true)
            }
        }
    }, [repairJobData, dataRows])

    const fetchRecords = () => {
        if (gridApi) {
            gridApi.deselectAll();
        }

        localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));

        axiosInstance().get(`${repairJob.repairJobApi}/${repairJobData._id}/get-assets`)
            .then(({ data }) => {
                let tempProductInventory = data.data.map(u => ({ ...u, _id: u?.id, productName: u?.product?.optionLabel }))
                dispatch({ type: "loading", loading: true });
                axiosInstance()
                    .get(`${routes.deliveryTicket.path}/typewise?refrenceType=Repair Job&refrenceId=${repairJobData._id}`)
                    .then(({ data }) => {

                        data.data.map(obj => {
                            tempProductInventory.map((d, index) => {
                                if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                                    tempProductInventory[index]["type"] = obj?.type
                                    if (obj.ticketType === "Loading") {
                                        tempProductInventory[index]["deliveryTicket"] = obj?.ticketName
                                        tempProductInventory[index]["deliveryTicketId"] = obj?._id;
                                        tempProductInventory[index]["isDeliveryTicketDelivered"] = obj?.status === "Delivered";
                                    }
                                    if (obj.ticketType === "Receiving") {
                                        tempProductInventory[index]["receivingTicket"] = obj?.ticketName
                                        tempProductInventory[index]["receivingTicketId"] = obj?._id
                                        tempProductInventory[index]["isDelivered"] = obj?.status === "Delivered";
                                    }
                                }
                            })
                        });

                        tempProductInventory.forEach((d) => {
                            d["_id"] = d["id"];
                            d["hideSelection"] = d.status === INVENTORY_STATUS.indTransit || d.status === INVENTORY_STATUS.lost || (d.hasOwnProperty("isDelivered") && d["isDelivered"] === true);
                        })

                        setNextButtonDisabled(!tempProductInventory.every(s => { return ["Available", "Scrap", "Lost"].findIndex(d => d === s.status) > -1 }))
                        // setPreviousButtonDisabled(tempProductInventory.some(s => s["receivingTicketId"]));

                        dispatch({
                            type: "initialize", data: tempProductInventory, count: tempProductInventory.length
                        });
                        setTimeout(() => {
                            dispatch({ type: "loading", loading: false });
                        }, gridLoadingTimeout);

                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                    });
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            }).finally(() => {
                setStatusToUpdate(prevState => ({ ...prevState, open: false }))
            });
    }


    const InventoryRenderer = (params) => (
        <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    );

    const ProductNameRenderer = (params) => (
        <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data?.product?.optionValue}`}>
            {params.value}
        </Link>
    );

    const DeliveryTicketRenderer = (params) => (
        params?.value ? (
            <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
                {params.value}
            </Link>
        ) : (
            <NoDataCell />
        )
    );

    const ReceivingTicketRenderer = (params) => (
        params?.value ? (
            <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.receivingTicketId}`}>
                {params.value}
            </Link>
        ) : (
            <NoDataCell />
        )
    );

    const frameworkComponents = {
        receivingTicketRenderer: ReceivingTicketRenderer,
        deliveryTicketRenderer: DeliveryTicketRenderer,
        inventoryRenderer: InventoryRenderer,
        productNameRenderer: ProductNameRenderer,
        commonRenderer: CommonRenderer,
        dateRenderer: DateRenderer,
    };

    const columns = [
        { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "inventoryRenderer" },
        { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
        { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "deliveryTicketRenderer" },
        { field: "receivingTicket", headerName: "Receiving Ticket", show: true, cellRenderer: "receivingTicketRenderer" },
        { field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "productNameRenderer" },
        { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
    ];

    const columnState = JSON.parse(localStorage.getItem(renderedFrom));
    if (columnState) {
        columns.forEach((item) => {
            columnState.forEach((d) => {
                if (d.colId === item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }

    return (<>

        <Box display="flex" justifyContent="flex-end" className="gap-1 px-2">
            <Button
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
            </Button>

            {
                repairJobData && repairJobData["status"] !== repairJobStatus[2] && <Button variant="outlined" color="primary" aria-controls="simple-menu"
                    aria-haspopup="true"
                    disabled={selectedRecords.length === 0}
                    size="small"
                    onClick={handleClick}
                    endIcon={<ArrowDropDownIcon />}>
                    Change Status
                </Button>
            }

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
            {
                repairJobData && repairJobData["status"] !== repairJobStatus[2] &&
                <IconButton
                    disabled={selectedRecords.length === 0 || !selectedRecords.every(f => f.deliveryTicketId && f.isDeliveryTicketDelivered) || selectedRecords.some(f => f.hasOwnProperty("receivingTicketId"))}
                    onClick={() => {
                        handleReceivingTicketDialog(selectedRecords)
                    }}
                    color='primary'
                    size="small"
                >
                    <Tooltip
                        title="Create Receiving Ticket">
                        <AddBoxRoundedIcon />
                    </Tooltip>
                </IconButton>
            }

            {
                repairJobData && repairJobData["status"] !== repairJobStatus[2] &&
                <IconButton
                    disabled={selectedRecords.length === 0 || selectedRecords.some(f => !f.hasOwnProperty("receivingTicketId"))}
                    onClick={() => {
                        setShowRemoveAssetFromReceivingTicketDialog(true)
                    }}
                    color='primary'
                    size="small"
                >
                    <Tooltip
                        title="Remove Assets From Receiving Ticket(s)">
                        <RemoveCircleRoundedIcon />
                    </Tooltip>
                </IconButton>
            }
        </Box>

        <Grid item xs={12} md={12} sm={12} className="mt-3">

            {columns ?
                isMobile && !isTablet ? <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={true}
                    primaryField={columns?.find(d => d.field)}
                    onClick={() => {
                        // history.push(`${routes.rentalManagementDetail.path}/${data._id}`)
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
                        },
                        {
                            label: "Receiving Ticket : ",
                            field: "receivingTicket",
                            onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.receivingTicketId}`)
                        },
                        {
                            label: "Loading Ticket : ",
                            field: "deliveryTicket",
                            onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.deliveryTicketId}`)
                        },
                    ]}
                    additionalDetails={[

                    ]}
                    owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                    onCreate={false}
                    showClone={false}
                    onClone={() => { }}
                    renderedFrom={renderedFrom}
                /> : <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameworkComponents}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    allowSelection={repairJobData && repairJobData["status"] === repairJobStatus[2] ? false : true}
                    allowAction={false}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    rowClassRules={{
                        "red-data-row":
                            function (params) {
                                return ["Scrap", "Lost"].some(s => s === params.data.status);
                            },
                    }}
                    isClientSideGrid={true}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

            }
        </Grid>

        {
            showRemoveAssetFromReceivingTicketDialog && (
                <ConfirmationDialog
                    open={showRemoveAssetFromReceivingTicketDialog}
                    message={`Are you sure you want to remove selected records from ${sidebarResource.receivingTicket}(s) ?`}
                    onClose={() => {
                        setShowRemoveAssetFromReceivingTicketDialog(false);
                    }}
                    onOk={() => {
                        setOkBtnLoading(true);

                        const groupByCalls = groupBy(selectedRecords, "receivingTicketId");
                        let apiCalls = [];

                        Object.keys(groupByCalls).forEach((key) => {
                            apiCalls.push(axiosInstance().put(`${deliveryTicket.deliveryTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map(m => m._id) }));
                        })

                        Promise.all(apiCalls).then(() => {
                            toastConfig.setToastConfig({ open: true, type: "success", message: `Selected records removed from assiged ${sidebarResource.receivingTicket}(s)` });
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

        {
            statusToUpdate.open && <AssetScrapRepairDialog
                statusToUpdate={statusToUpdate}
                setStatusToUpdate={setStatusToUpdate}
                selectedRecords={selectedRecords}
                id={repairJobData._id}
                onClose={() => {
                    setStatusToUpdate(prevState => ({ ...prevState, open: false }))
                }}
                onSuccess={() => {
                    fetchRecords();
                }}
            />
        }

        {
            showReceivingTicketDialog.open && <ManageDeliveryTicket
                ticketType="Receiving"
                refrenceType="Repair Job"
                refrenceData={repairJobData}
                productInventory={showReceivingTicketDialog.selectedAssets}
                onClose={() => setShowReceivingTicketDialog({ open: false, selectedAssets: [] })}
                onSuccess={() => {
                    setShowReceivingTicketDialog({ open: false, selectedAssets: [] })
                    fetchRecords();
                }}
                warehouseId={repairJobData?.plant?.optionValue}
                repairJobData={repairJobData}
            />


            // <ManageReceivingTicket
            //     open={showReceivingTicketDialog.open}
            //     isClone={false}
            //     receivingTicketId={null}
            //     productInventoryForReceivingTicket={showReceivingTicketDialog.selectedAssets}
            //     repairJobData={repairJobData}
            //     onClose={() => setShowReceivingTicketDialog({ open: false, selectedAssets: [] })}
            //     onSuccess={() => {
            //         setShowReceivingTicketDialog({ open: false, selectedAssets: [] })
            //         fetchRecords();
            //     }}
            //     // onSuccess={() => {
            //     //     setShowReceivingTicketDialog(false)
            //     //     fetchProductInventory()
            //     // }}
            //     isRedirectToDetailPage={false}
            // />
        }

    </>
    );
}

export default RepairJobReceivingTicket;

