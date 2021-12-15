import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { rentalManagement } from "../../../constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import AdditionalCostDialog from "./AdditionalCostDialog";
import { FaCartArrowDown, FaCartPlus } from "react-icons/fa";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid } from "../../../constants/helpers";
import { getColumnData, getStaticFields, getFrameworkComponents, getSortedColumns, genrateColoum } from "../../../constants/columns"
import { GrBusinessService } from "react-icons/all";

const AdditionalCost = ({ rentalManagementData, setNextStep }) => {

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
        fetchAdditionalCost();
    }, []);

    useEffect(() => {
        axiosInstance().get("/field/child?resource=Rental Management Cost").then(({ data: { data } }) => {
            const fields = CURReplaceByCurrencySingle(data, rentalManagementData.currency)
            let rendererNames = [];
            genrateColoum(fields, columns, rendererNames, false);
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

    const fetchAdditionalCost = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`).then(({ data: { data } }) => {
            let rows = data?.map((item) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            setNextStep(true)
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
                        setShowCostDialog(true)
                        setSelectedCostData(params.data)
                    }}
                >
                    <EditIcon color="primary" />
                </IconButton>
            </HtmlTooltip>
            <GridDeleteIcon
                hasDeletePermission={permissions?.rentalManagement?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    handleDeleteCost([params.data._id])
                }}
                entity="rentalManagement"
            />
        </>
    );

    const handleAddCost = (rows) => {
        axiosInstance().post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
            .then(() => {
                fetchAdditionalCost()
                setShowCostDialog(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const handleUpdateCost = (rows) => {
        axiosInstance().put(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/update`, { additionalCost: rows })
            .then(() => {
                fetchAdditionalCost()
                setShowCostDialog(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const handleDeleteCost = (ids) => {
        axiosInstance().post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/delete`, { ids })
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
                        {isMobile ? <GrBusinessService size={20} /> : "Add Cost"}
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
                    renderedFrom={routes.rentalManagement.title}
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
                    renderedFrom="rentalmanagmentadditionalcost"
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
                    currency={rentalManagementData?.currency}
                    costData={selectedCostData}
                />
            }
        </Fragment>
    );
};

export default AdditionalCost;
