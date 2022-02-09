import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { gridLoadingTimeout, deliveryTicket, serializedAsset, DELIVERY_TICKET_REFRENCE_TYPE } from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { prepareDataForGrid } from "../../../constants/helpers"
import { useData } from "../../../StateProvider/Provider";

const renderedFrom = 'SubleasingTickets';

const Tickets = ({ subleaseData }) => {

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const { getColumnData } = useColumns();
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [columns, setColumns] = useState(null)
    const { state: { user, permissions, selectedEntity } }: any = useData();

    useEffect(() => {
        fetchGridColumns()
    }, []);

    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Delivery Ticket")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(routes.deliveryTicket.title, o?.fieldData, routes.deliveryTicketDetail.path)
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
        let data;
        const response = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.sublease}&refrenceId=${subleaseData._id}`)
        data = response?.data?.data
        let rows = data.map((u) => {
            let res = {
                ...prepareDataForGrid(u, user)
            };
            return res;
        });
        dispatch({ type: "initialize", data: rows, count: rows.length });
        setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
    };

    return (<>
        <Box display="flex" justifyContent="flex-end" pt={1}>
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
                            },
                            {
                                label: "Loading Ticket : ",
                                field: "loadingTicket",
                                onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`)
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
    </>
    );
};

export default Tickets;
