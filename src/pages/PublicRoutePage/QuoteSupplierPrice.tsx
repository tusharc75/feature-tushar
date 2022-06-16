import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axios from "axios";
import { backendApi } from "../../config";
import { Box, Button } from "@material-ui/core";
import { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { getFrameworkComponents } from "../../constants/useColumns"
import { CommonRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { sortBy } from "lodash";
import DetailsPage from "src/components/Shared/DetailsPage";
import { FaDiceOne } from "react-icons/fa";

const displayColumns = ["qty", "totalCostPerUnit", "productName", "productDesc", "unit"]
let levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];
const QuoteSupplierPrice = ({ quoteData, openAuthId }) => {
    let renderedFrom = "QuoteSupplierPrice"
    const toastConfig = useContext(CustomToastContext)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [productData, setProductData] = useState([]);
    const [quoteDetailsData, setQuoteDetailsData] = useState(null);
    const [isSubmited, setIsSubmited] = useState(false);

    const quoteFields = [
        {
            "fieldData": {
                "_id": "628e0cb1dc9001aec1d293d9",
                "fieldLabel": "Quote Name",
                "type": "singleLine",
                "option": [],
                "required": true,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 1,
                "isUneditable": true,
                "hiddenField": false,
                "isDefaultValue": true,
                "disableOnEdit": true,
                "unique": true,
                "primaryField": true,
                "lookup": false,
                "lookupResource": "",
                "isDropdown": false,
                "isWarningTooltip": false,
                "warningTooltipMessage": "",
                "defaultValue": "Auto Generated",
                "fieldName": "quoteName",
                "sectionName": "Quote Information",
                "resource": "Quotes",
                "brand": "62666e58de44fa0e29624707",
                "roleType": 0
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },
        {
            "fieldData": {
                "_id": "628e0cb1dc9001aec1d293db",
                "fieldLabel": "Quote Date",
                "type": "date",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 3,
                "sectionName": "Quote Information",
                "fieldName": "quoteDate",
                "resource": "Quotes",
                "brand": "62666e58de44fa0e29624707",
                "roleType": 0
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },

    ]

    useEffect(() => {
        fetchProduct()
    }, []);


    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axios.get(backendApi + `/quote-builder/supplier-price-response/${quoteData?.data?.requestId}`).then(({ data: { data } }) => {
            setQuoteDetailsData(data?.quote);
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
            columns = sortBy(columns, function (item: any) {
                return levalOrderBy.indexOf(item.leval)
            });
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
            if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _unit
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = displayColumns.includes(ele.fieldName) ? true : false
                            col.disabled = false
                            col.leval = ele.leval
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
                                col.show = displayColumns.includes(ele.fieldName) ? true : false
                                col.disabled = false
                                col.leval = ele.leval
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
                            col.show = displayColumns.includes(ele.fieldName) ? true : false
                            col.disabled = false
                            col.leval = ele.leval
                            col.cellRenderer = "commonRenderer";
                            if (ele.fieldName === "totalCostPerUnit") {
                                col.cellEditor = "numericCellEditor";
                                col.editable = true;
                            }
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
                        col.show = displayColumns.includes(ele.fieldName) ? true : false
                        col.disabled = false
                        col.leval = ele.leval
                        col.cellRenderer = "commonRenderer";
                        column.push(col)
                    }

                }
            }
        })
    }

    const onCellValueChanged = (row) => {
        let tempData = {
            "uniqueId": row.data?.uniqueId,
            "costPrice": parseInt(row?.newValue)
        }
        let productIndex = productData.findIndex(d => d.uniqueId === tempData.uniqueId)
        if (productIndex === -1) {
            setProductData((prevState) => ([...prevState, tempData]))
        }
        else {
            let tempProductData = productData
            tempProductData[productIndex].costPrice = tempData.costPrice
        }

    }

    const handleSubmit = () => {

        let tempData = {
            "products": productData,
            "requestId": quoteData?.data?.requestId,
            "openAuthId": openAuthId
        }

        axios.post(backendApi + `/quote-builder/supplier-price-response`, tempData).then(({ data }) => {
            setIsSubmited(true)
            toastConfig.setToastConfig({
                message: data.message,
                type: "success",
                open: true,
            });
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }

    return (
        <>
            {quoteDetailsData ? (
                <DetailsPage
                    data={quoteDetailsData}
                    fields={quoteFields}
                />
            ) : null}
            {isSubmited ?
                <h1 style={{ padding: "10px", display: "flex", justifyContent: "center", color: "#047d1c" }} title={" Thanks for your submission"}>
                    Thanks for your submission
                </h1>

                : <Box mt={2} p={2}>
                    <>
                        <div className={"detail-box-content"}>
                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                            <h3 className="form-label-style" title={" Product List"}>
                                Product List
                            </h3>
                        </div>
                        {
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
                        <Box display="flex" pt={1} justifyContent="flex-end">
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                disabled={productData.length === 0}
                                onClick={handleSubmit}
                            >
                                Submit
                            </Button>
                            <Box mx={1} />
                        </Box>
                    </>
                </Box>}

        </>
    );
}

export default QuoteSupplierPrice;