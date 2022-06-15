import { useState, useEffect, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, product } from '../../constants/helpers';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { sortBy } from 'lodash';
import NoDataCell from "../../components/Helpers/NoDataCell";
import { CustomDialogTransition } from "../../constants/helpers";
import { Link } from "react-router-dom";
import routes from "../../components/Helpers/Routes";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import TextField from "@material-ui/core/TextField";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { prepareDataForGrid } from "../../constants/helpers";
import { CommonRenderer } from "../AgGridComponents/CustomAgGridCellRenderers";


const renderedFrom = "quoteSupplierPrice";
const localStorageSelectedRecords = `${renderedFrom}_selected`;

const SupplierAskPrice = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, supplierData, productBuilderId } = props;
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search,
        filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);


    const ProductNameRenderer = params => (
        <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    )

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance().get(`/quote-builder/supplier-response/${supplierData?._id}`).then(({ data: { data } }) => {

            let rows = data.map((item, index) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                    totalCost: item.totalCost || item.costPrice
                };
                return res;
            });
            let columns = []
            let rendererNames = [];
            let fields = []
            data?.forEach((ele) => {
                fields = [...fields, ...ele.fields]
            })

            GenrateColoum([...new Map(fields.map(item => [item["_id"], item])).values()], columns, rendererNames);

            let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
            tempFrameworkComponent = {
                commonRenderer: CommonRenderer,
                ...tempFrameworkComponent,
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            columns = sortBy(columns, ['order']);
            setColumns([...columns])

            dispatch({ type: "initialize", data: rows, count: rows.length });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const GenrateColoum = (fields, column, rendererNames) => {
        let _fields = fields;

        _fields.forEach((ele) => {
            if (ele.fieldName === "totalCost") {
                let col: any = {}
                col.field = ele.fieldName
                col.headerName = ele.fieldLabel
                col.width = 180
                col.show = true
                col.disabled = false
                col.order = ele.order
                col.cellRenderer = "commonRenderer";
                col.cellEditor = "numericCellEditor";
                col.editable = true;
                column.push(col)
            }
            else if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _unit
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.disabled = false
                            col.order = ele.order
                            col.cellRenderer = "commonRenderer";
                            column.push(col)
                        }
                    })
                }
                else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        ele.displayCurrency.forEach((_currency) => {
                            let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                            let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
                            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                let col: any = {}
                                col.field = fieldName
                                col.headerName = fieldLabel
                                col.width = 180
                                col.show = true
                                col.disabled = false
                                col.order = ele.order
                                col.cellRenderer = "commonRenderer";
                                column.push(col)
                            }
                        })
                    })
                }
                else if (ele.type === "currencyAmount") {
                    ele.displayCurrency.forEach((_currency) => {
                        let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _currency
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.disabled = false
                            col.order = ele.order
                            col.cellRenderer = "commonRenderer";
                            column.push(col)
                        }
                    })
                }
            }
            else {
                if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                    let col: any = {}
                    if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine") {
                        col.field = ele.fieldName
                        col.headerName = ele.fieldLabel
                        col.width = 180
                        col.show = true
                        col.disabled = false
                        col.order = ele.order
                        col.cellRenderer = "commonRenderer";
                        column.push(col)
                    }

                }
            }
        })
    }

    const handleAdd = () => {

        let tempData = {
            "uniqueId": supplierData?._id,
            "requestId": getLocalStorageArrayData(localStorageSelectedRecords)[0]?._id,
            "productBuilder": productBuilderId
        }

        axiosInstance().put(`/quote-builder/apply-supplier-price`, tempData).then(({ data }) => {
            toastConfig.setToastConfig({
                message: data?.message,
                type: "success",
                open: true,
            });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });

    }

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={"Select Supplier Price"} onClose={handleClose} ></CustomDialogHeader>
        <div className="listing-grid p-3">
            <Box mb={2}>
                <Grid container >
                    <Grid item xs={12} sm={12} md={12} container justify="flex-end">
                        <Box ml={1} mt={1} >
                            <Button size="small" color="primary" onClick={handleAdd} variant="contained" disabled={getLocalStorageArrayData(localStorageSelectedRecords).length === 1 ? false : true}>
                                Add</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            {columns && frameWorkComponent ?
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
                    refreshGrid={fetchProduct}
                    renderedFrom={renderedFrom}
                    showOnlyShowFilteredRecordSwitch={true}
                    isMultipleSelection={false}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Dialog>
    );
}

export default SupplierAskPrice;
