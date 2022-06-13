import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axios from "axios";
import { backendApi } from "../../config";
import { Box, IconButton } from "@material-ui/core";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, packages, isObjectEmpty, prepareDataForGrid, getLocalStorageArrayData, deliveryTicket } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import { CommonRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { sortBy } from "lodash";

const QuoteSupplierPrice = ({ quoteData }) => {
    let renderedFrom = "QuoteSupplierPrice"
    const toastConfig = useContext(CustomToastContext)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [productData, setProductData] = useState(null);



    useEffect(() => {
        fetchProduct()
    }, []);


    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axios.get(backendApi + `/quote-builder/supplier-price-response/${quoteData?.data?.requestId}`).then(({ data: { data } }) => {
            setProductData(data.products);
            let rows = data.products.map((item, index) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                res.srno = index + 1;
                res.isChecked = false;
                return res;
            });
            let columns = []
            columns = [
                {
                    field: "srno",
                    headerName: "Item #",
                    width: 150,
                    show: true,
                    disabled: true,
                    order: 0,
                    cellRenderer: "commonRenderer",
                    primaryField: true
                },
            ];
            let rendererNames = [];
            let fields = []
            data.products?.forEach((ele) => {
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
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
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

    const onCellValueChanged = (row) => {

        let tempData = {

            "products": [{

                "uniqueId": "629f14a5c6ed5202cdc75d1d",

                "costPrice": 10

            }],

            "requestId": "62a068d9a49ae06188867761"
        }

        // axios.post(backendApi + `/quote-builder/supplier-price-response`, tempData).then(({ data: { data } }) => {

        // })
        //     .catch((error) => {
        //         toastConfig.setToastConfig(error);
        //     });
    }

    return (
        <Box mt={2} p={2}>
            {isMobile && !isTablet ? <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={{ isCreate: false, isRead: true, isUpdate: true, isDelete: false }}
                primaryField={columns?.find(d => d.field === "productName")}
                onClick={(data) => { }}
                selectedRecords={[]}
                dataRows={dataRows}
                dispatch={dispatch}
                onEdit={() => {

                }}
                extraParamsToCheckDelete={true}
                onDelete={() => {
                }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                chips={[]}
                onCreate={null}
                showClone={false}
                fullHeight={true}
                renderedFrom={renderedFrom}
                onClone={() => {
                }}
            /> :
                columns ?
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
                        allowAction={false}
                        loading={loading}
                        allowSelection={false}
                        showOnlyShowFilteredRecordSwitch={true}
                        refreshGrid={fetchProduct}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                        onCellValueChanged={onCellValueChanged} />
                    : <Box p={2} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </Box>
    );
}

export default QuoteSupplierPrice;