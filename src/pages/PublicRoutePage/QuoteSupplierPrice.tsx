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
import DetailsPageHeader from "src/components/DetailsPageHeader";

const QuoteSupplierPrice = ({ quoteData }) => {
    let renderedFrom = "QuoteSupplierPrice"
    const toastConfig = useContext(CustomToastContext)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [productData, setProductData] = useState([]);
    const [quoteDetailsData, setQuoteDetailsData] = useState(null);

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
                "_id": "628e0cb1dc9001aec1d293da",
                "fieldLabel": "Est. Revenue (USD)",
                "type": "number",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 2,
                "sectionName": "Quote Information",
                "fieldName": "estRevenueUSD",
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
        {
            "fieldData": {
                "_id": "628e0cb1dc9001aec1d293de",
                "fieldLabel": "Project Name",
                "type": "multiLine",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 6,
                "sectionName": "Quote Information",
                "fieldName": "projectName",
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
                "_id": "628e0cb1dc9001aec1d293df",
                "fieldLabel": "End-user",
                "type": "multiLine",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 7,
                "sectionName": "Quote Information",
                "fieldName": "enduser",
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
                "_id": "628e0cb1dc9001aec1d293e0",
                "fieldLabel": "Customer Reference Number",
                "type": "singleLine",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "order": 8,
                "sectionName": "Quote Information",
                "fieldName": "customerReferenceNumber",
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
                "_id": "628e0cb1dc9001aec1d293e1",
                "fieldLabel": "Est. Volume (MT)",
                "type": "number",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "order": 9,
                "sectionName": "Quote Information",
                "fieldName": "estVolumeMT",
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
                "_id": "628e0cb1dc9001aec1d293e2",
                "fieldLabel": "Est. GM (USD)",
                "type": "number",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "order": 10,
                "sectionName": "Quote Information",
                "fieldName": "estGMUSD",
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
                "_id": "628e0cb1dc9001aec1d293e5",
                "fieldName": "currency",
                "fieldLabel": "Currency",
                "required": true,
                "type": "currency",
                "sectionName": "Quote Information",
                "order": 13,
                "editAble": true,
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
                "_id": "628e0cb1dc9001aec1d293e7",
                "fieldLabel": "Quote Status",
                "type": "dropDown",
                "option": [
                    {
                        "optionLabel": "Received, not yet quoted",
                        "optionValue": "Received, not yet quoted",
                        "order": 1,
                        "default": false
                    },
                    {
                        "optionLabel": "Quoted",
                        "optionValue": "Quoted",
                        "order": 2,
                        "default": false
                    },
                    {
                        "optionLabel": "Won",
                        "optionValue": "Won",
                        "order": 3,
                        "default": false
                    },
                    {
                        "optionLabel": "Lost / Cancelled",
                        "optionValue": "Lost / Cancelled",
                        "order": 4,
                        "default": false
                    }
                ],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 15,
                "hiddenField": false,
                "isDefaultValue": false,
                "disableOnEdit": false,
                "addManualOptionInExcel": false,
                "addAdditionalOption": false,
                "lookup": false,
                "lookupResource": "",
                "isDropdown": false,
                "isWarningTooltip": false,
                "warningTooltipMessage": "",
                "defaultValue": "",
                "sectionName": "Quote Information",
                "fieldName": "quoteStatus",
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
                "_id": "628e0cb1dc9001aec1d293ed",
                "fieldName": "probability",
                "fieldLabel": "Probability (%)",
                "required": false,
                "type": "percent",
                "sectionName": "Quote Information",
                "order": 21,
                "editAble": true,
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
            "requestId": quoteData?.data?.requestId
        }

        axios.post(backendApi + `/quote-builder/supplier-price-response`, tempData).then(({ data }) => {
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
            <Box mt={2} p={2}>
                <>
                    <DetailsPageHeader
                        heading={"Product List"}
                        mainPoints={null}
                        showHeading={true}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button>
                        {/* <div className={"detail-box-content"}>
                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                            <h3 className="form-label-style" title={" Product List"}>
                                Product List
                            </h3>
                        </div> */}
                        {/* <Button
                            variant="text"
                            size="small"
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button> */}
                    </DetailsPageHeader>
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
                </>
            </Box>
        </>
    );
}

export default QuoteSupplierPrice;