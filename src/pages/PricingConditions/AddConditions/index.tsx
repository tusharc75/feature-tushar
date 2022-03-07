import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { pricingCondition, gridLoadingTimeout } from "../../../constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { FaCartArrowDown, FaCartPlus } from "react-icons/fa";
import { ConsoleView, isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid, productTemplate } from "../../../constants/helpers";
import { getColumnData, getStaticFields, getFrameworkComponents, getSortedColumns, genrateColoum } from "../../../constants/columns"
import { GrBusinessService } from "react-icons/all";
import AddExistingMaterialDialog from "../AddExistingMaterialDialog";
import ConditionDialog from "./ConditionDialog";
import { startCase } from 'lodash';
import InfoIcon from "@material-ui/icons/Info";


const AddConditions = ({ pricingConditionId, detailData }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [addMaterialDialog, setAddMaterialDialog] = useState({ open: false, materialType: "" });

    const [condition, setCondition] = useState(null)
    const [showDialog, setShowDialog] = useState({ open: false, isBulkedit: false })
    const [conditionData, setConditionData] = useState(null)

    useEffect(() => {
        fetchCondition()
    }, [pricingConditionId]);

    const fetchCondition = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        setCondition(null);
        axiosInstance().get(`${pricingCondition.api}/condition/${pricingConditionId}`).then(({ data: { data } }) => {
            setCondition(JSON.parse(JSON.stringify(data)));
            data.forEach((element) => {
                element.detail = `${element.materialType === "product" ? element.productDetail?.productName : element.packageDetail?.packageName}`
                element.materialType = startCase(element.materialType)
                element.conditionType = element.conditionType?.join(",")
                element.unit = element.unit?.join(",")
                element.pricingMethod = element.pricingMethod?.join(",")
            })
            console.log(data)
            dispatch({ type: "initialize", data: data, count: data.length });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleAdd = (rows) => {
        const data = []
        rows.forEach(element => {
            data.push({ materialId: element._id, materialType: addMaterialDialog.materialType })
        });
        axiosInstance().post(`${pricingCondition.api}/condition/${pricingConditionId}`, { condition: data }).then(({ data: { data } }) => {
            setAddMaterialDialog({ open: false, materialType: "" });
            fetchCondition()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleDelete = (ids) => {
        axiosInstance().post(`${pricingCondition.api}/condition/remove/${pricingConditionId}`, { ids })
            .then(() => {
                fetchCondition()
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const handleOpen = (id) => {
        const result = condition.filter((e) => e._id === id);
        if (result.length) {
            setShowDialog({ open: true, isBulkedit: false })
            setConditionData(result[0])
        }
    }

    const DetailRenderer = (params) => (
        <Fragment>
            <p
                onClick={() => { handleOpen(params.data._id) }}
                className="link text-truncate"
                title={params.data.detail}
            >
                {params.data.detail}
            </p>
            <HtmlTooltip title="Details">
                <IconButton
                    size="small"
                    aria-label="Details"
                    onClick={() => {
                        window.open(`${params.data.materialType === "Product" ? routes.productDetail.path : routes.packagesDetail.path}/${params.data.materialId}`);
                    }}
                >
                    <InfoIcon fontSize="small" />
                </IconButton>
            </HtmlTooltip>
        </Fragment>
    );

    const ActionsRenderer = (params) => (
        <>
            <HtmlTooltip title="Edit">
                <IconButton
                    size="small"
                    aria-label="Edit"
                    onClick={() => { handleOpen(params.data._id) }}
                >
                    <EditIcon color="primary" />
                </IconButton>
            </HtmlTooltip>
            <GridDeleteIcon
                hasDeletePermission={permissions?.pricingCondition?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    handleDelete([params.data._id])
                }}
                entity="pricingCondition"
            />
        </>
    );

    const frameworkComponents = {
        detailRenderer: DetailRenderer,
        actionsRenderer: ActionsRenderer,
        commonRenderer: CommonRenderer,
    };

    const columns = [
        { field: "detail", headerName: "Detail", show: true, cellRenderer: "detailRenderer" },
        { field: "materialType", headerName: "Type", show: true, cellRenderer: "commonRenderer" },
        { field: "conditionType", headerName: "Condition Type", show: true, cellRenderer: "commonRenderer" },
        { field: "unit", headerName: "Unit", show: true, cellRenderer: "commonRenderer" },
        { field: "pricingMethod", headerName: "Pricing Method", show: true, cellRenderer: "commonRenderer" },
    ];

    return (<Fragment>
        <Box display="flex" justifyContent="space-between" m={1} mt={2}>
            <Box display="flex" alignItems="center">
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        setAddMaterialDialog({ open: true, materialType: "product" });
                    }}
                >
                    {`Add ${routes.product.title}`}
                </Button>
                <Box mx={1} />
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        setAddMaterialDialog({ open: true, materialType: "package" });
                    }}
                >
                    {`Add ${routes.packages.title}`}
                </Button>
            </Box>
            <Box display="flex">
                <HtmlTooltip title={Boolean(selectedRecords && selectedRecords.length > 1) ? "Bulk edit selected records" : "Select records to edit"}>
                    <span>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={!Boolean(selectedRecords && selectedRecords.length > 1)}
                            onClick={() => {
                                setShowDialog({ open: true, isBulkedit: true })
                                setConditionData(condition.filter((data) => selectedRecords.some((rec) => rec._id === data._id)))
                            }}
                        >
                            Bulk Edit
                        </Button>
                    </span>
                </HtmlTooltip>
                <Box mx={1} />
                <HtmlTooltip title={Boolean(selectedRecords && selectedRecords.length) ? "Delete selected records" : "Select records to delete"}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={!Boolean(selectedRecords && selectedRecords.length)}
                        onClick={() => {
                            const dataToDelete = selectedRecords && selectedRecords.map((rec: any) => {
                                return rec._id
                            })
                            handleDelete(dataToDelete)
                        }}
                    >
                        Delete
                    </Button>
                </HtmlTooltip>
            </Box>
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns && condition ?
                <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameworkComponents}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    allowAction={true}
                    loading={loading}
                    renderedFrom={"pricingConditionsList"}
                    refreshGrid={fetchCondition}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </Grid>
        {addMaterialDialog.open && (
            <AddExistingMaterialDialog
                type={addMaterialDialog.materialType}
                handleClose={() => {
                    setAddMaterialDialog({ open: false, materialType: "" })
                }}
                handleAdd={handleAdd}
            />
        )}
        {(showDialog.open && conditionData) && (
            <ConditionDialog
                conditionData={conditionData}
                detailData={detailData}
                isBulkedit={showDialog.isBulkedit}
                pricingConditionId={pricingConditionId}
                handleClose={() => {
                    setShowDialog({ open: false, isBulkedit: false })
                }}
                handleSuccess={() => {
                    setShowDialog({ open: false, isBulkedit: false })
                    fetchCondition()
                }}
            />
        )}
    </Fragment>
    );
};

export default AddConditions;
