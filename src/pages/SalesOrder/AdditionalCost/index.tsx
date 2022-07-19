import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Box, Button, IconButton } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { salesOrder } from "../../../constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import AdditionalCostDialog from "./AdditionalCostDialog";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid, CHILD_RESOURCE } from "../../../constants/helpers";
import { getFrameworkComponents, genrateColoum } from "../../../constants/columns"
import { GrBusinessService } from "react-icons/all";

const AdditionalCost = ({ salesOrderData, setNextStep, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [showCostDialog, setShowCostDialog] = useState(false)
    const [selectedCostData, setSelectedCostData] = useState(null)

    useEffect(() => {
        fetchFields()
    }, []);

    const fetchFields = async () => {
        var data = []
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.salesOrderCost}`)
        data = response?.data?.data

        const fields = CURReplaceByCurrencySingle(data, salesOrderData.currency)
        let rendererNames = [];
        genrateColoum(fields, columns, rendererNames, false, renderedFrom);
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            commonRenderer: CommonRenderer,
            actionsRenderer: ActionsRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        setColumns([...columns])
        fetchAdditionalCost();
    }

    const fetchAdditionalCost = async () => {
        try {
            dispatch({ type: "loading", loading: true });
            if (gridApi) {
                gridApi.setRowData([]);
            }
            var data: any = []
            const response = await axiosInstance().get(`${salesOrder.api}/additionalcost/${salesOrderData._id}`)
            data = response?.data?.data
            let rows = data?.map((item) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            setNextStep(true)
            dispatch({ type: "initialize", data: rows, count: rows.length });
            dispatch({ type: "loading", loading: false });
        }
        catch (error) {
            dispatch({ type: "loading", loading: false });
            toastConfig.setToastConfig(error);
        }
    };

    const ActionsRenderer = (params) => (
        <Fragment>
            <HtmlTooltip title="Edit">
                <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => {
                        setShowCostDialog(true)
                        setSelectedCostData(params.data)
                    }}
                >
                    <EditIcon color="primary" />
                </IconButton>
            </HtmlTooltip>
            <GridDeleteIcon
                hasDeletePermission={permissions?.salesOrder?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    handleDeleteCost([params.data._id])
                }}
                entity="salesOrder"
            />
        </Fragment>
    );

    const handleAddCost = (rows) => {
        axiosInstance().post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/add`, { additionalCost: rows })
            .then(() => {
                fetchAdditionalCost()
                setShowCostDialog(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const handleUpdateCost = (rows) => {
        axiosInstance().put(`${salesOrder.api}/additionalcost/${salesOrderData._id}/update`, { additionalCost: rows })
            .then(() => {
                fetchAdditionalCost()
                setShowCostDialog(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const handleDeleteCost = (ids) => {
        axiosInstance().post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/delete`, { ids })
            .then(() => {
                fetchAdditionalCost()
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
                            setShowCostDialog(true);
                            setSelectedCostData(null)
                        }}
                    >
                        {isMobile ? <GrBusinessService size={20} /> : "Add Services and Consumables"}
                    </Button>
                </Box>
            </Box>
            {columns && frameWorkComponent ? isMobile ?
                <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions}
                    primaryField={columns?.find(d => d.field)}
                    onClick={(data) => {
                        setShowCostDialog(true)
                        setSelectedCostData(data)
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={(data) => {
                        setShowCostDialog(true)
                        setSelectedCostData(data)
                    }}
                    extraParamsToCheckDelete={true}
                    onDelete={(data) => {
                        handleDeleteCost([data._id])
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
                    renderedFrom={renderedFrom}
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
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchAdditionalCost}
                />
                : <Box
                    p={2}
                    height={500}
                    bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            }
            {showCostDialog &&
                <AdditionalCostDialog
                    onClose={() => {
                        setShowCostDialog(false)
                        setSelectedCostData(null)
                    }}
                    handleAddCost={handleAddCost}
                    handleUpdateCost={handleUpdateCost}
                    currency={salesOrderData?.currency}
                    costData={selectedCostData}
                />
            }
        </Fragment>
    );
};

export default AdditionalCost;
