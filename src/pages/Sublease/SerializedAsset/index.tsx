import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { gridLoadingTimeout, serializedAsset } from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { prepareDataForGrid, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_TICKET_TYPE, DELIVERY_FROM_TO_TYPE, sublease, SUBLEASE_STATUS, INVENTORY_OWNER_TYPE } from "../../../constants/helpers"
import { useData } from "../../../StateProvider/Provider";
import {
    Button, Tooltip, IconButton, Menu, MenuItem,
    Dialog, TextField, CircularProgress
} from "@material-ui/core";
import { AiFillFilePdf, AiOutlineDeliveredProcedure } from 'react-icons/ai';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { groupBy, uniq, map } from "lodash";

const renderedFrom = 'SubleasingSerializedAsset';

const SerializedAsset = ({ subleaseData, fetchData }) => {

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const { getColumnData } = useColumns();
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [columns, setColumns] = useState(null)
    const { state: { user, permissions, selectedEntity } }: any = useData();

    const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
    const [isCompleteing, setIsCompleteing] = useState(false);
    const [isCompleteEnable, setIsCompleteEnable] = useState(false);

    useEffect(() => {
        fetchGridColumns()
    }, []);

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=${serializedAsset.resource}`)
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(routes.serializedAsset?.title, o?.fieldData, routes.serializedAssetDetail.path)
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
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns])
                fetchRecords()
            })
    }

    const fetchRecords = async () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const response = await axiosInstance().get(`${sublease.api}/${subleaseData._id}/serialized-asset`)
        var isComplate = true;
        let rows = response?.data?.data.map((u) => {
            if (u?.currentOwner?.optionValue !== subleaseData?.supplierAccount?.optionValue) {
                isComplate = false;
            }
            let res = {
                ...prepareDataForGrid(u, user)
            };
            return res;
        });
        setIsCompleteEnable(isComplate)
        dispatch({ type: "initialize", data: rows, count: rows.length });
        setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
    };

    const completeSublease = () => {
        setIsCompleteing(true);
        axiosInstance().put(`${sublease.api}/${subleaseData._id}/complete-sublease`).then(() => {
            setIsCompleteing(false);
            fetchData()
            fetchRecords()
        }).catch((error) => {
            setIsCompleteing(false)
            toastConfig.setToastConfig(error)
        });
    }

    const checkUniqWarehouse = () => {
        if (selectedRecords.length === 0) {
            return false;
        } else if (uniq(map(selectedRecords, "warehouseId")).length === 1) {
            return true;
        } else {
            return false;
        }
    };

    return (<>
        <Box display="flex" justifyContent="flex-end" pt={1}>
            {SUBLEASE_STATUS.completed != subleaseData?.status &&
                <Fragment>
                    <Tooltip title="Transfer to Plant">
                        <Button
                            variant={"contained"}
                            color="primary"
                            size="small"
                            onClick={() => {
                                const data = {}
                                data["ticketName"] = subleaseData.subleaseName;
                                data["refrenceId"] = subleaseData._id;
                                data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.supplier;
                                data["pickupFrom"] = subleaseData?.supplierAccount?.optionValue;
                                data["pickupFromAddress"] = subleaseData?.shippingAddress?.optionValue;
                                data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.plant;
                                setShowTicketDialog({ open: true, data: data });
                            }}
                            disabled={(selectedRecords.length === 0 || (selectedRecords.some(f => f.hasOwnProperty("warehouse")
                                || f.currentOwnerType !== INVENTORY_OWNER_TYPE.supplierAccount)))}
                        >
                            Receiving to Plant
                        </Button>
                    </Tooltip>
                    <Box mx={1} />
                    {selectedRecords.length > 0 && selectedRecords.filter((e) => e.currentOwnerType === INVENTORY_OWNER_TYPE.brand).length === selectedRecords.length &&
                        checkUniqWarehouse() ?
                        <Fragment>
                            <Tooltip title="Send to Supplier">
                                <Button
                                    variant={"contained"}
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                        console.log(selectedRecords)
                                        const data = {}
                                        data["ticketName"] = subleaseData.subleaseName;
                                        data["refrenceId"] = subleaseData._id;
                                        data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.plant;
                                        data["pickupFrom"] = selectedRecords[0]?.warehouseId;
                                        data["pickupFromAddress"] = selectedRecords[0]?.currentLocationId;
                                        data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.supplier;
                                        data["deliveryTo"] = subleaseData?.supplierAccount?.optionValue;
                                        data["deliveryToAddress"] = subleaseData?.shippingAddress?.optionValue;
                                        setShowTicketDialog({ open: true, data: data });
                                    }}
                                >
                                    Send to Supplier
                                </Button>
                            </Tooltip>
                            <Box mx={1} />
                        </Fragment>
                        : null
                    }
                    <Button
                        variant={"contained"}
                        color="primary"
                        size="small"
                        disabled={!isCompleteEnable || isCompleteing}
                        onClick={() => { completeSublease() }}
                    >
                        End Sublease
                    </Button>
                    <Box mx={1} />
                </Fragment>
            }
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns ?
                isMobile && !isTablet ?
                    <CustomSwipableList
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
                        onEdit={false}
                        extraParamsToCheckDelete={true}
                        onDelete={false}
                        rowCount={rowCount}
                        page={page}
                        loading={loading}
                        additionalDetails={[
                        ]}
                        chips={[
                            {
                                label: "Status : ",
                                field: "status",
                            }
                        ]}
                        owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                        onCreate={false}
                        showClone={false}
                        onClone={() => { }}
                        renderedFrom={renderedFrom}
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
                        allowAction={false}
                        loading={loading}
                        isClientSideGrid={true}
                        allowSelection={true}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchRecords}
                    />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </Grid>
        {showTicketDialog.open && (
            <ManageDeliveryTicket
                ticketType={DELIVERY_TICKET_TYPE.delivery}
                refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.sublease}
                refrenceData={showTicketDialog.data}
                productInventory={selectedRecords}
                onClose={() => setShowTicketDialog({ open: false, data: {} })}
                onSuccess={() => {
                    setShowTicketDialog({ open: false, data: {} });
                    fetchRecords();
                }}
            />
        )}
    </>
    );
};

export default SerializedAsset;
