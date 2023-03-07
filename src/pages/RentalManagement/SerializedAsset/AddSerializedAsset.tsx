import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import routes from "../../../components/Helpers/Routes";
import { Link, useHistory } from 'react-router-dom';
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { serializedAsset, isObjectEmpty, gridLoadingTimeout, CustomDialogTransition, getLocalStorageArrayData, INVENTORY_STATUS, transferAsset } from '../../../constants/helpers';
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { useData } from "../../../StateProvider/Provider";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { prepareDataForGrid } from "../../../constants/helpers"
import { isMobile, isTablet } from "react-device-detect";
import { groupBy, orderBy, sortBy, uniq, map } from "lodash";
import ManageTransferAsset from '../../TransferAssets/ManageTransferAsset';
import { Autocomplete } from "@material-ui/lab";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import HtmlTooltip from "../../../components/CustomTooltipTitle";

let searchTimeout;

const AddSerializedAsset = ({ renderedFrom = 'addSerializedAssets', isAdding, addSerializedAsset, handleSerializedAssetClose, selectedProducts, referenceType = null,
    referenceData = null,
    rentalId = null, repairJobId = null, transferAssetId = null, salesOrderId = null, notIn = null, filterByPlant = null }) => {

    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const theme = useTheme()
    const toastConfig = useContext(CustomToastContext)
    const [serializedProducts, setSerializedProducts] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const { getColumnData } = useColumns();
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [columns, setColumns] = useState(null)
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const { state: { permissions } }: any = useData();

    const [showTransferAssetDialog, setShowTransferAssetDialog] = useState(false);

    const [plantList, setPlantList] = useState([]);
    const [selectedPlant, setSelectedPlant] = useState(filterByPlant);
    const [subleaseAsset, setSubleaseAsset] = useState(false)

    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 600;
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
            fetchProductInventory()
        }, millisec);
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedPlant, subleaseAsset, selectedProduct]);

    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        axiosInstance().get(`/warehouse?noEntityWise=1`)
            .then(({ data: { data, count } }) => {
                setPlantList(data)
            })
            .catch((error) => {
            });
    }, [])

    const fetchGridColumns = () => {
        axiosInstance().get(`/field?resource=${serializedAsset.resource}`).then(({ data: { data } }) => {
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
                ...tempFrameworkComponent,
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            columns = [...columns, ...getStaticFields()]
            setColumns([...columns])
        })
    }

    useEffect(() => {
        let tempProducts = serializedProducts
        const alreadyStoredSelectedRecords = [...getLocalStorageArrayData(localStorageSelectedRecords)];
        if (tempProducts.length === 0) {
            selectedProducts.map(d => {
                if (tempProducts.find(obj => obj.id === d.id)) {
                    tempProducts.find(obj => obj.id === d.id).qty = d?.qty + tempProducts.find(obj => obj.id === d.id).qty
                }
                else {
                    tempProducts.push({ "id": d.id, "name": d.productName, "qty": d?.qty })
                }
            })
        }
        else {
            tempProducts = []
            selectedProducts.map(d => {
                tempProducts.push({ "id": d.id, "name": d.productName, "qty": d?.qty - alreadyStoredSelectedRecords?.filter(obj => obj.productId === d.id).length })
            })
        }
        setSerializedProducts(tempProducts)
    }, [selectedRecords]);

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        let queryString = getQueryString();
        if (selectedProducts.length > 0) {
            var updatedFilters = []
            if (selectedProduct) {
                updatedFilters.push({ field: 'product', term: selectedProduct })
            }
            else {
                updatedFilters = selectedProducts.map(m => { return { "field": "product", "term": m?.id ?? "" } })
            }
            queryString = `${queryString}&filterById=${JSON.stringify(updatedFilters)}&filterByIdType=or`
        }

        axiosInstance().get(`${serializedAsset.api}${queryString}`).then(({ data }) => {
            data.data = data.data
                .map((u) => {
                    let finalObject = prepareDataForGrid(u);
                    finalObject["isChecked"] = false;
                    return finalObject
                });
            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (showFilteredRecordsOnly) {
            deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map(m => m._id))}`;
        }
        const updatedFilters = [];
        if (!isObjectEmpty(filters)) {
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
        }
        if (updatedFilters.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        //  To fetch the remaining unassigned assets of that rental management
        if (rentalId) {
            deepFilter = `${deepFilter}&rentalJobId=${rentalId}&notIn=${notIn}`;
        } else if (repairJobId) {
            deepFilter = `${deepFilter}&repairJobId=${repairJobId}&notIn=${notIn}`;
        } else if (transferAssetId) {
            deepFilter = `${deepFilter}&transferAssetId=${transferAssetId}&notIn=${notIn}`;
        } else if (salesOrderId) {
            deepFilter = `${deepFilter}&salesOrder=${salesOrderId}&notIn=${notIn}`;
        } else {
            if (selectedPlant == null) {
                deepFilter = `${deepFilter}&entityWise=1`;
            } else {
                deepFilter = `${deepFilter}&entityWise=0&plant=${selectedPlant}`;
            }
            if (referenceType === "Repair Job") {
                deepFilter = `${deepFilter}&repairable=true`;
            }
            else if (referenceType === "Rental Job") {
                const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate }
                deepFilter = `${deepFilter}&rental=true&date=${JSON.stringify(dateFilter)}`;
            }
            else {
                deepFilter = `${deepFilter}&availableAsset=true`;
            }
        }
        if (subleaseAsset) {
            deepFilter = `${deepFilter}&subleaseAsset=1`;
        }
        else {
            deepFilter = `${deepFilter}&subleaseAsset=0`;
        }

        deepFilter = `${deepFilter}&isNonSerializedAsset=0`;

        return deepFilter;
    };

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            default:
                return field;
        }
    };

    const getRowStyleScheduled = (params) => {
        if (params?.data?.reserved) {
            return {
                'background-color': "#FAEAE9",
            }
        }
        else if ([INVENTORY_STATUS.available, INVENTORY_STATUS.new]?.includes(params?.data?.status)) {
            return {
                'background-color': "#DBF8DB",
            }
        }
        else if ([INVENTORY_STATUS.inUse]?.includes(params?.data?.status)) {
            return {
                'background-color': "#FFD580",
            }
        }
        return null;
    };

    const checkUniqWarehouse = () => {
        if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0) {
            return true;
        } else if (uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), "warehouseId")).length === 1) {
            if (uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), "warehouseId"))[0] === null ||
                uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), "warehouseId"))[0] === undefined) {
                return true;
            }
            if (uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), "warehouseId"))[0] === filterByPlant) {
                return true;
            }
            return false;
        } else {
            return true;
        }
    };

    const handleAddAssetToTransferAsset = (transferAssetId) => {
        axiosInstance().put(`${transferAsset.api}/add-asset/${transferAssetId}`, {
            assets: getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map(s => s._id),
            manualStatus: INVENTORY_STATUS.reserved
        })
            .then(({ data }) => {
                fetchProductInventory()
                setShowTransferAssetDialog(false)
                addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)])
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            })
    }

    return (<Fragment>
        {(<Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={`${referenceType === "ReplaceAsset" ? "Replace" : "Add"} ${routes.serializedAsset.title}`} onClose={handleSerializedAssetClose} ></CustomDialogHeader>
            <CustomDialogContent>
                <Box pt={1} pb={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={5}>
                            <Box display="flex">
                                <Box style={{ "display": "inline" }} >
                                    {serializedProducts.length > 0 ?
                                        serializedProducts.map(d =>
                                            <Box m={0.5} p={1} border={1}
                                                className="cursor-pointer"
                                                borderColor="grey.300"
                                                onClick={() => {
                                                    if (selectedProduct === d.id) {
                                                        setSelectedProduct(null)
                                                    }
                                                    else {
                                                        setSelectedProduct(d.id)
                                                    }
                                                }}
                                                style={{ "display": "inline-block" }}
                                                bgcolor={d.id === selectedProduct && "primary.main"}
                                                color={d.id === selectedProduct && "white"}
                                            >
                                                {d?.qty < 0 ?
                                                    <span key={d.name} className="text-error">{`${d.name} (${d?.qty})`}</span>
                                                    : (d?.qty === 0 ? <span key={d.name} className="text-success">{`${d.name} (${d?.qty})`}</span> :
                                                        <span key={d.name}>{`${d.name} (${d?.qty})`}</span>)}
                                            </Box>
                                        ) : null
                                    }
                                </Box>
                            </Box>
                            {serializedProducts.length > 0 && serializedProducts.some(s => s.qty < 0) ?
                                <div className="text-error font-weight-bold">You have selected more assets then needed.</div> : ""
                            }
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {referenceType === "Rental Job" &&
                                <Grid container >
                                    <Grid item xs={6} justifyContent={"flex-end"}>
                                        {permissions?.sublease &&
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        name="subleaseAsset"
                                                        checked={subleaseAsset}
                                                        onChange={(e) => {
                                                            dispatch({ type: "selection", selectedRecords: [] })
                                                            localStorage.removeItem(localStorageSelectedRecords)
                                                            setSubleaseAsset(e.target.checked)
                                                            if (e.target.checked) {
                                                                setSelectedPlant(null)
                                                            }
                                                            else {
                                                                setSelectedPlant(filterByPlant)
                                                            }
                                                        }}
                                                        color="primary"
                                                    />
                                                }
                                                label="Sublease Assets"
                                            />}
                                    </Grid>
                                    <Grid item xs={6} justifyContent={"flex-end"}>
                                        <Autocomplete
                                            fullWidth
                                            options={plantList}
                                            getOptionLabel={(option: any) => option ? option?.warehouseName : ""}
                                            getOptionSelected={(option: any, val) =>
                                                option._id === val
                                            }
                                            value={plantList.filter((data) => data._id === selectedPlant).length
                                                ? plantList.filter((data) => data._id === selectedPlant)[0]
                                                : ""
                                            }
                                            onChange={(e, val) => {
                                                if (selectedRecords.length > 0 && val?._id !== selectedPlant) {
                                                    toastConfig.setToastConfig({
                                                        open: true,
                                                        message: "All pre-selected records will be deselected if you change the plant.",
                                                        type: "warning"
                                                    })
                                                    dispatch({
                                                        type: "selection",
                                                        selectedRecords: []
                                                    })
                                                    localStorage.removeItem(localStorageSelectedRecords)
                                                }
                                                setSelectedPlant(val && val._id ? val._id : null)
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="plant"
                                                    placeholder="Plant"
                                                    label="Plant"
                                                    variant="outlined"
                                                    fullWidth
                                                    className="m-0"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            }
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box display="flex">
                                <Box flexGrow={1}>
                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox="terms_header_search_bar"
                                        value={search}
                                        width={isMobile && !isTablet ? '75%' : "100%"}
                                    />
                                </Box>
                                {permissions?.transferAsset?.isCreate &&
                                    (getLocalStorageArrayData(`${localStorageSelectedRecords}`).length !== 0 && !checkUniqWarehouse()) &&
                                    <Box pl={1}>
                                        <Button
                                            size="small"
                                            color="primary"
                                            onClick={() => { setShowTransferAssetDialog(true) }}
                                            variant={isMobile && !isTablet ? 'text' : 'contained'}
                                            disabled={isAdding || serializedProducts.some(d => d?.qty < 0)}
                                            className={isMobile && !isTablet ? 'mobile_button' : ""}
                                            endIcon={isAdding && <CircularProgress size={20} />}
                                        >
                                            {'Transfer to Job Plant'}
                                            {getLocalStorageArrayData(`${localStorageSelectedRecords}`).length ? " (" + getLocalStorageArrayData(`${localStorageSelectedRecords}`).length + ")" : ""}
                                        </Button>
                                    </Box>
                                }
                                <Box pl={1}>
                                    <HtmlTooltip title={(getLocalStorageArrayData(`${localStorageSelectedRecords}`).length !== 0 && !checkUniqWarehouse()) ? "Direct transfer to customer location" :
                                        referenceType === "Rental Job" ? "Add to Job" : referenceType === "ReplaceAsset" ? "Replace" : 'Add'}>
                                        <Button
                                            color="primary"
                                            size="small"
                                            onClick={() => addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)])}
                                            variant={isMobile && !isTablet ? 'text' : 'contained'}
                                            disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`).length === 0 || isAdding ||
                                                serializedProducts.some(d => d?.qty < 0)}
                                            className={isMobile && !isTablet ? 'mobile_button' : ""}
                                            endIcon={isAdding && <CircularProgress size={20} />}
                                        >
                                            {
                                                referenceType === "Rental Job" ? 'Add to Job' :
                                                    referenceType === "ReplaceAsset" ? "Replace" : 'Add'
                                            }
                                            {getLocalStorageArrayData(`${localStorageSelectedRecords}`).length ? " (" + getLocalStorageArrayData(`${localStorageSelectedRecords}`).length + ")" : ""}
                                        </Button>
                                    </HtmlTooltip>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                <div className={"listing-grid"}>
                    {Object.keys(frameWorkComponent).length > 0 && columns ?
                        // isMobile && !isTablet ?
                        //     <CustomSwipableList
                        //         allowSelection={true}
                        //         allowSwipe={true}
                        //         permissions={permissions}
                        //         primaryField={columns?.find(d => d.primaryField)}
                        //         onClick={(data) => {
                        //             history.push(`${routes.serializedAssetDetail.path}/${data._id}`)

                        //         }}
                        //         dataRows={dataRows}
                        //         selectedRecords={selectedRecords}
                        //         dispatch={dispatch}
                        //         onEdit={false}
                        //         extraParamsToCheckDelete={false}
                        //         onDelete={false}
                        //         rowCount={rowCount}
                        //         page={page}
                        //         loading={loading}
                        //         checkError={false}
                        //         chips={[
                        //             {
                        //                 label: "PO Number:",
                        //                 field: "purchaseOrder"
                        //             },
                        //             {
                        //                 label: "Product Category:",
                        //                 field: "productCategory"
                        //             },
                        //             {
                        //                 label: "Plant:",
                        //                 field: "warehouse"
                        //             }
                        //         ]}
                        //         onCreate={null}
                        //         showClone={false}
                        //         onClone={false}
                        //         fullHeight={true}
                        //         renderedFrom={renderedFrom}
                        //     /> :
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
                            customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                            renderedFrom={renderedFrom}
                            showOnlyShowFilteredRecordSwitch={true}
                            refreshGrid={fetchProductInventory}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                </div>
            </CustomDialogContent>
        </Dialog>
        )}
        {showTransferAssetDialog && (
            <ManageTransferAsset
                isClone={false}
                transferAssetId={null}
                onClose={() => setShowTransferAssetDialog(false)}
                onSuccess={(data) => {
                    handleAddAssetToTransferAsset(data?._id);
                }}
                referenceId={referenceData._id}
                referenceType={referenceType}
                referenceData={{
                    transferFromPlant: getLocalStorageArrayData(`${localStorageSelectedRecords}`)[0]?.warehouseId,
                    transferToPlant: referenceData?.warehouse,
                    wellName: referenceData?.wellName,
                    afeNumber: referenceData?.afeNumber
                }}
            />
        )}
    </Fragment>
    );
}

export default AddSerializedAsset;