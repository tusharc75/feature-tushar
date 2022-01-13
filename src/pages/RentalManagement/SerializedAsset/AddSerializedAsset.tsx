import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import routes from "../../../components/Helpers/Routes";
import { Link, useHistory } from 'react-router-dom';
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { productInventory, isObjectEmpty, gridLoadingTimeout, CustomDialogTransition, getLocalStorageArrayData, INVENTORY_STATUS } from '../../../constants/helpers';
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { useData } from "../../../StateProvider/Provider";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { prepareDataForGrid } from "../../../constants/helpers"
import { isMobile, isTablet } from "react-device-detect";
import { AddOutlined } from "@material-ui/icons";
import { MdAdd } from "react-icons/md";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";

const addSerializedAssetsRenderedFrom = "addSerializedAssets";
const localStorageSelectedRecords = `${addSerializedAssetsRenderedFrom}_selected`;

const AddSerializedAsset = ({ isAdding, addSerializedAsset, handleSerializedAssetClose, selectedProducts,
    rentalId = null, repairJobId = null, transferAssetId = null, salesOrderId = null, notIn = null, queryString = null, filterByPlant = null }) => {

    const toastConfig = useContext(CustomToastContext)
    const [serializedProducts, setSerializedProducts] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const { getColumnData } = useColumns();
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [columns, setColumns] = useState(null)
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const { state: { permissions } }: any = useData();
    const history = useHistory();

    useEffect(() => {
        fetchProductInventory()
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    useEffect(() => {
        fetchGridColumns()
    }, [])

    const fetchGridColumns = () => {
        axiosInstance().get("/field?resource=Product Inventory").then(({ data: { data } }) => {
            let columns = []
            let rendererNames = []
            data.forEach(o => {
                if (o?.fieldData?.fieldName === "serialNumber") {
                    o.fieldData.primaryField = true
                }
                let currentColumn = getColumnData(routes.productInventory?.title, o?.fieldData, routes.productInventoryDetail.path)
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
                if (d.productName) {
                    if (tempProducts.find(obj => obj.id === d._id)) {
                        tempProducts.find(obj => obj.id === d._id).qty = d?.qty + tempProducts.find(obj => obj.id === d._id).qty
                    }
                    else {
                        tempProducts.push({ "id": d._id, "name": d.productName, "qty": d?.qty })
                    }
                }
                if (d.packageName && d?.products?.length > 0) {
                    d.products.map(u => {
                        if (tempProducts.find(obj => obj.id === u?.productDetail?._id)) {
                            tempProducts.find(obj => obj.id === u?.productDetail?._id).qty = (u?.qty * d?.qty) + tempProducts.find(obj => obj.id === u?.productDetail?._id).qty
                        }
                        else {
                            tempProducts.push({ "id": u?.productDetail?._id, "name": u?.productDetail?.productName || "", "qty": u?.qty * d?.qty })
                        }
                    })
                }
            })
        }
        else {
            tempProducts = []
            selectedProducts.map(d => {
                if (d.productName) {
                    tempProducts.push({ "id": d._id, "name": d.productName, "qty": d?.qty - alreadyStoredSelectedRecords.filter(obj => obj.productId === d._id).length })
                }
                if (d.packageName && d?.products?.length > 0) {
                    d.products.map(u => {
                        if (tempProducts.find(obj => obj.id === d?.productDetail?._id)) {
                            tempProducts.find(obj => obj.id === d?.productDetail?._id).qty = u?.qty * d?.qty + tempProducts.find(obj => obj.id === d?.productDetail?._id).qty - alreadyStoredSelectedRecords.filter(obj => obj.productId === u?.productDetail?._id).length
                        }
                        else {
                            tempProducts.push({ "id": u?.productDetail?._id, "name": u?.productDetail?.productName || "", "qty": u?.qty * d?.qty - alreadyStoredSelectedRecords.filter(obj => obj.productId === u?.productDetail?._id).length })
                        }
                    })
                }
                // if (d?.qty - alreadyStoredSelectedRecords.filter(obj => obj.product.optionValue === d._id).length <= -1) {
                //     let tempSelectedRecoeds = [...alreadyStoredSelectedRecords]
                //     var idx = tempSelectedRecoeds.findIndex(obj => obj.product.optionValue === d._id);
                //     var removed = tempSelectedRecoeds.splice(idx, 1);
                //     // dispatch({ type: "loading", loading: true });
                //     // setTimeout(() => {
                //     //     dispatch({ type: "loading", loading: false });
                //     // }, gridLoadingTimeout);
                //     dispatch({ type: "selection", selectedRecords: tempSelectedRecoeds });
                // }
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
            queryString = `${queryString}&filterById=${JSON.stringify(selectedProducts.map(m => { return { "field": "product", "term": m?._id ?? "" } }))}&filterByIdType=or`
        }
        axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
            data.data = data.data
                // ?.filter(u => (u?.status === "Available" || u?.status === "New")
                // && selectedProducts.some(d => d._id === u?.product?.optionValue || d.products?.some(obj => obj?.productId === u?.product?.optionValue))
                // )
                .map((u) => {
                    let finalObject = prepareDataForGrid(u);
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
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
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
            deepFilter = `${deepFilter}&rental=${rentalId}&notIn=${notIn}`;
        } else if (repairJobId) {
            deepFilter = `${deepFilter}&repairJobId=${repairJobId}&notIn=${notIn}`;
        } else if (transferAssetId) {
            deepFilter = `${deepFilter}&transferAssetId=${transferAssetId}&notIn=${notIn}`;
        } else if (salesOrderId) {
            deepFilter = `${deepFilter}&salesOrder=${salesOrderId}&notIn=${notIn}`;
        } else {
            if (filterByPlant == null) {
                deepFilter = `${deepFilter}&entityWise=1`;
            } else {
                deepFilter = `${deepFilter}&entityWise=0&plant=${filterByPlant}`;
            }
            if (queryString) {
                deepFilter = `${deepFilter}&${queryString}`;
            } else {
                deepFilter = `${deepFilter}&availableAssets=true`;
            }
        }
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
        if ([INVENTORY_STATUS.available, INVENTORY_STATUS.new].indexOf(params?.data?.status) >= 0) {
            return {
                'background-color': "#d3ffe0",
            }
        }
        return null;
    };

    return (<Fragment>
        {(<Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={`Add ${routes.productInventory.title}`} onClose={handleSerializedAssetClose} ></CustomDialogHeader>
            <CustomDialogContent>
                <div className={isMobile ? "listing-grid" : "listing-grid p-3"}>
                    <Box mb={2}>
                        <Grid container spacing={1}>
                            <Grid item xs={12} sm={12} md={6}>
                                <div>
                                    {
                                        serializedProducts.length > 0 ?
                                            serializedProducts.map(d =>
                                                d?.qty < 0 ? <span className="text-error">{d.name ? `  ${d.name} (${d?.qty})  |` : ""}</span>
                                                    : (d?.qty === 0 ? <span className="text-success">{d.name ? `  ${d.name} (${d?.qty})  |` : ""}</span> : <span>{d.name ? `  ${d.name} (${d?.qty})  |` : ""}</span>)
                                            ) : null
                                    }
                                </div>
                                {
                                    serializedProducts.length > 0 && serializedProducts.some(s => s.qty < 0) ? <div className="text-error font-weight-bold">You have selected more assets then needed.</div> : ""
                                }
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} container justify={isMobile ? "flex-start" : "flex-end"}>
                            <Box className={isMobile ? "mobile-filter-side-header" : "filter-side-header-serialized"} component="div">
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox="terms_header_search_bar"
                                    value={search}
                                    width={isMobile ? '200px' : '242px'}
                                    style={isMobile ? { flex: 1 } : {}}
                                />
                                <Box ml={isMobile ? 0 : 1} mt={isMobile ? 0 : 1} className="d-flex">
                                    <Button size="small"
                                        color="primary"
                                        onClick={() => addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)])}
                                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                                        disabled={getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length === 0 || isAdding ||
                                            serializedProducts.some(d => d?.qty < 0)}
                                            className={isMobile && !isTablet ? 'mobile_button' : ""}
                                        endIcon={isAdding && <CircularProgress size={20} />}
                                        startIcon={isMobile && !isTablet ? "" : <AddOutlined />}
                                    >
                                        {getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length ? "(" + getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length + ")  " : ""}
                                        {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}</Button>
                                </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                    {Object.keys(frameWorkComponent).length > 0 && columns ?
                    isMobile && !isTablet ?
                    <CustomSwipableList
                      allowSelection={true}
                      allowSwipe={true}
                      permissions={permissions}
                      primaryField={columns?.find(d => d.primaryField)}
                      onClick={(data) => {
                        history.push(`${routes.productInventoryDetail.path}/${data._id}`)
        
                      }}
                      dataRows={dataRows}
                      selectedRecords={selectedRecords}
                      dispatch={dispatch}
                      onEdit={false}
                      extraParamsToCheckDelete={false}
                      onDelete={false}
                      rowCount={rowCount}
                      page={page}
                      loading={loading}
                      checkError={false}
                      chips={[
                          {
                            label:"PO Number:",
                            field:"pONumber"
                          },
                          {
                            label:"Product Category:",
                            field:"productCategory"
                          },
                          {
                            label:"Plant:",
                            field:"warehouse"
                          }
                      ]}
                      onCreate={null}
                      showClone={false}
                      onClone={false}
                      fullHeight={true}
                      renderedFrom={addSerializedAssetsRenderedFrom}
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
                            customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                            renderedFrom={addSerializedAssetsRenderedFrom}
                            showOnlyShowFilteredRecordSwitch={true}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                </div>
            </CustomDialogContent>
        </Dialog>
        )}
    </Fragment>
    );
}

export default AddSerializedAsset;