import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Grid, Box, Button, Tooltip, IconButton, Menu, MenuItem, Dialog, TextField, CircularProgress } from "@material-ui/core";
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne, findAll } from '../../../constants/indexdbhelper';
import axiosInstance from '../../../axios/axiosInstance';
import { sidebarResource, prepareDataForGrid, DELIVERY_TICKET_STATUS } from '../../../constants/helpers';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import routes from '.././../../components/Helpers/Routes';
import { DELIVERY_TICKET_MAPPED_STATUS, gridLoadingTimeout, deliveryTicket } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useHistory } from 'react-router-dom';
import SignatureDialog from '../../../components/Helpers/SignatureDialog';
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { camelCase } from 'lodash';


const MultipleTicketProcess = ({ refrenceData, ticketType, refrenceType }) => {
    const renderedFrom = `${camelCase(routes?.deliveryTicket.title)}_grid-2`
    const { state: { user, selectedEntity, permissions } }: any = useData();
    const { getColumnData } = useColumns();
    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
    const { isOffline } = useContext(CustomOfflineContext);

    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});

    const [openSignatureDialog, setOpenSignatureDialog] = useState({ label: "", open: false });
    const [signaturesToSend, setSignaturesToSend] = useState([]);
    const [isUpdating, setUpdating] = useState(false);


    useEffect(() => {
        fetchGridColumns();
    }, []);

    const fetchGridColumns = async () => {
        let data;
        if (isOffline) {
            data = await findOne(objectStore.resource, objectStore.deliveryTicket)
        }
        else {
            const response = await axiosInstance().get(`/field?resource=${sidebarResource['deliveryTicket']}&entity=${selectedEntity}&view=true&showHiddenFields=true`)
            data = response?.data?.data
        }
        data = data.filter((e) => e?.fieldData?.fieldName !== "productInventory")
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, `${routes.deliveryTicket.path}/detail`);
            if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                    rendererNames.push(currentColumn?.rendererName);
                }
            }
            return o?.fieldData;
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
            ...tempFrameworkComponent,
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
        fetchDeliveryTicket()
    };

    const fetchDeliveryTicket = async () => {
        try {
            if (selectedEntity) {
                dispatch({ type: 'loading', loading: true });
                if (gridApi) {
                    gridApi.setRowData([]);
                }
                let data: any = [], count;
                if (!isOffline) {
                    const response = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${refrenceType}&refrenceId=${refrenceData._id}&ticketType=${ticketType?.toString()}`)
                    data = response?.data?.data;
                    count = data?.length;
                }
                else {
                    data = await findAll(objectStore.deliveryTicket);
                    count = data?.length || 0;
                }
                let rows = data.map((u) => {
                    let res: any = {
                        ...prepareDataForGrid(u, user)
                    };
                    res["isChecked"] = false;
                    res["hideSelection"] = [DELIVERY_TICKET_STATUS.delivered].includes(res.status);
                    return res;
                });
                if (appendRows) {
                    dispatch({ type: 'initialize', data: [...dataRows, ...rows], count: count });
                } else {
                    dispatch({ type: 'initialize', data: rows, count: count });
                }
                setTimeout(() => { dispatch({ type: 'loading', loading: false }); }, gridLoadingTimeout);
            }
        }
        catch (error) {
            dispatch({ type: 'loading', loading: false });
            toastConfig.setToastConfig(error);
        }
    };

    const handleSignature = async (signedData) => {
        const status = openSignatureDialog.label === "Sign-off - Dispatch" ? "Start Delivery" : "Sign-Off";
        const indexOfExistingSignature = signaturesToSend.findIndex((sign) => sign.type === signedData.type && sign.status === status);
        let signatures: any = []
        if (indexOfExistingSignature === -1) {
            signatures = [...signaturesToSend, { type: signedData.type, signature: signedData.sign, name: signedData?.name, status: status }]
        } else {
            signatures[indexOfExistingSignature] = {
                ...signatures[indexOfExistingSignature],
                type: signedData.type,
                signature: signedData.sign,
                status: status,
                name: signedData?.name
            }
        }
        setSignaturesToSend(signatures)
        if (signatures.length === 2) {
            setUpdating(true)
            let data = {}
            data["_ids"] = selectedRecords.map((d) => d._id);
            data["status"] = DELIVERY_TICKET_MAPPED_STATUS[openSignatureDialog.label]
            data["signatures"] = signatures
            axiosInstance().post(`${deliveryTicket.api}/updatebulk`, data).then(({ data: { data } }) => {
                setUpdating(false)
                setOpenSignatureDialog({ open: false, label: "" })
                setSignaturesToSend([])
                fetchDeliveryTicket()
            }).catch((error) => {
                setUpdating(false)
                toastConfig.setToastConfig(error);
            });
        }
    }

    return (<>
        <Box display="flex" justifyContent="flex-end" pt={1}>
            <Box display="flex" alignItems="center">
                <Tooltip
                    title="Sign-off - Dispatch">
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setOpenSignatureDialog({ label: "Sign-off - Dispatch", open: true })
                        }}
                        disabled={selectedRecords.length === 0 || (selectedRecords.some(f => f.status !== DELIVERY_TICKET_STATUS.new))}
                    >
                        Sign-off - Dispatch
                    </Button>
                </Tooltip>
                <Box mx={1} />
                <Tooltip
                    title="Sign-off - Delivery">
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setOpenSignatureDialog({ label: "Sign-off - Delivery", open: true })
                        }}
                        disabled={selectedRecords.length === 0 || (selectedRecords.some(f => f.status !== DELIVERY_TICKET_STATUS.indTransit))}
                    >
                        Sign-off - Delivery
                    </Button>
                </Tooltip>
                <Box mx={1} />
            </Box>
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns && frameWorkComponent ?
                isMobile && !isTablet ? (
                    <CustomSwipableList
                        allowSelection={true}
                        allowSwipe={true}
                        permissions={permissions.deliveryTicket}
                        primaryField={columns?.find((d) => d.primaryField)}
                        onClick={(data) => {
                            history.push(`${routes.deliveryTicketDetail.path}/${data._id}`);
                        }}
                        dataRows={dataRows}
                        selectedRecords={selectedRecords}
                        dispatch={dispatch}
                        onEdit={() => { }}
                        extraParamsToCheckDelete={true}
                        onDelete={() => { }}
                        rowCount={rowCount}
                        page={page}
                        loading={loading}
                        chips={[
                            {
                                label: 'Status: ',
                                field: 'status'
                            },
                            {
                                label: 'Job Name: ',
                                field: 'ticketName'
                            }
                        ]}
                        onCreate={null}
                        showClone={false}
                        onClone={() => { }}
                        renderedFrom={renderedFrom}
                    />
                ) : Object.keys(frameWorkComponent).length > 0 ? (
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
                        actionWidth={100}
                        isClientSideGrid={true}
                        loading={loading}
                        allowSelection={true}
                        allowAction={false}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchDeliveryTicket}
                    />
                ) : null :
                <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </Grid>
        {openSignatureDialog.open &&
            <SignatureDialog
                submitting={isUpdating}
                label={openSignatureDialog.label}
                steps={openSignatureDialog.label === "Sign-off - Dispatch" ? ["Supervisor", "Delivery Person"] : ["Delivery Person", "Receiver"]}
                forDelivery={true}
                open={true}
                onClose={() => {
                    setOpenSignatureDialog({ open: false, label: "" })
                }}
                onSigned={handleSignature}
            />}
    </>
    )
}

export default MultipleTicketProcess
