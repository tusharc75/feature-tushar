import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axios from "axios";
import { backendApi } from "../../config";
import { Box, Button, Divider, makeStyles } from "@material-ui/core";
import { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { downloadExcel, gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { getFrameworkComponents } from "../../constants/useColumns"
import { CommonRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { sortBy } from "lodash";
import DetailsPage from "src/components/Shared/DetailsPage";
import { FaDiceOne } from "react-icons/fa";
import axiosInstance from "src/axios/axiosInstance";

let levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];

const useStyles = makeStyles((theme) => ({
    root: {
        padding: '10px',
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'flex-end'
    },
    linksContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        ['@media (max-width: 960px)']: {
            display: 'none'
        }
    },
    links: {
        color: theme.palette.info.light, //  textDark
        fontSize: 15
    },
    darkLinks: {
        color: theme.palette.info.dark, //  textDark
        fontSize: 15
    },
    linkDivider: {
        backgroundColor: '#ffffff42', //  darkBg
        margin: '0 10px'
    },
    darkLinkDivider: {
        backgroundColor: 'grey', //  darkBg
        margin: '0 10px'
    },
    delBtn: {
        color: 'red'
    },
    expandIcon: {
        position: 'absolute',
        right: '0',
        color: 'white'
    },
    darkExpandIcon: {
        position: 'absolute',
        right: '0',
        color: theme.palette.info.dark,
    }
}));

const QuoteSupplierPrice = ({ quoteData, openAuthId }) => {
    let renderedFrom = "QuoteSupplierPrice"
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [productData, setProductData] = useState([]);
    const [productArray, setProductArray] = useState([]);
    const [requireFieldArray, setRequireFieldArray] = useState([]);
    const [quoteDetailsData, setQuoteDetailsData] = useState(null);
    const [isSubmited, setIsSubmited] = useState(false);
    const [disabledSubmitButton, setDisabledSubmitButton] = useState(true);

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
            setProductArray(rows)
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
            setRequireFieldArray(data?.requiredFields)
            GenrateColoum([...new Map(fields.map(item => [item["_id"], item])).values()], columns, rendererNames, data?.requiredFields, rows, data?.displayColumns);

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


    const GenrateColoum = (fields, column, rendererNames, requiredFields, rows, displayColumns) => {
        let _fields = fields;
        let tempProductData = []
        _fields.forEach((ele) => {

            if (displayColumns.includes(ele.fieldName) || requiredFields.includes(ele.fieldName)) {
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
                                    col.show = true
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
                                col.show = true
                                col.disabled = false
                                col.leval = ele.leval
                                col.cellRenderer = "commonRenderer";
                                if (requiredFields.includes(ele.fieldName)) {
                                    col.cellEditor = "numericCellEditor";
                                    col.editable = true;
                                    rows.forEach(data => {
                                        if (data[fieldName]) {
                                            let productIndex = tempProductData.findIndex(d => d.uniqueId === data?.uniqueId)
                                            let tempData = {
                                                "uniqueId": data?.uniqueId,
                                                [fieldName]: parseInt(data[fieldName] === "" ? 0 : data[fieldName])
                                            }
                                            if (productIndex === -1) {
                                                tempProductData = [...tempProductData, tempData]
                                            }
                                            else {
                                                tempProductData[productIndex][fieldName] = tempData[fieldName]
                                            }
                                        }
                                    })
                                    setProductData(tempProductData)
                                }
                                column.push(col)
                            }
                        })
                    }
                }
                else {
                    if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                        let col: any = {}
                        if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine" || ele.type === "multiSelect") {
                            col.field = ele.fieldName
                            col.headerName = ele.fieldLabel
                            col.width = 180
                            col.show = true
                            col.disabled = false
                            col.leval = ele.leval
                            col.cellRenderer = "commonRenderer";
                            column.push(col)
                        }

                    }
                }
            }
        })
    }

    const onCellValueChanged = (row) => {
        let tempFieldsNumber = []
        let productIndex = productData.findIndex(d => d.uniqueId === row.data?.uniqueId)
        let tempData = {
            "uniqueId": row.data?.uniqueId,
            [row?.column?.colId]: parseInt(row?.data[row?.column?.colId] === "" ? 0 : row?.data[row?.column?.colId])
        }
        if (productIndex === -1) {
            setProductData((prevState) => ([...prevState, tempData]))
        }
        else {
            let tempProductData = productData
            tempProductData[productIndex][row?.column?.colId] = tempData[row?.column?.colId]
            setProductData(tempProductData)
        }
    }

    const handleSubmit = () => {
        let checkField: boolean;
        if (requireFieldArray.length === 1) {
            checkField = !(productArray.length !== productData.length)
        }
        else {
            checkField = !(productArray.length !== productData.length || productData.length === 0 || !productData.every(data => Object.keys(data).length === (requireFieldArray.length + 1)))
        }

        if (checkField) {
            let tempData = {
                "products": productData,
                "requestId": quoteData?.data?.requestId,
                "openAuthId": openAuthId
            }

            axios.post(backendApi + `/quote-builder/supplier-price-response`, tempData).then(({ data }) => {
                setIsSubmited(true)
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        else {
            toastConfig.setToastConfig({
                message: "Please enter all required fields",
                type: "error",
                open: true,
            });
        }
    }

    const uploadData = (event) => {
        if (event.target.files && event.target.files.length) {
            toastConfig.setToastConfig({
                hideDuration: null,
                open: true,
                type: 'info',
                message: `Uploading ${module}, Please wait...`
            });
            const file = event.target.files[0];

            let formData = new FormData();
            formData.append('file', file);
            axiosInstance()
                .post(`/quote-builder/price-request-import/${quoteData?.data?.requestId}`, formData, {
                    responseType: 'blob',
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                .then((response) => {
                    if (!response.headers['content-disposition']) {
                        toastConfig.setToastConfig({
                            open: true,
                            type: 'success',
                            message: 'All Records Added Successfully'
                        });
                        fetchProduct();
                    } else {
                        const fileName = response.headers['content-disposition'].split('filename=')[1];
                        fetchProduct();
                    }
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    };

    /**
     * EXPORT TABLES INTO EXCEL
     */
    const exportToExcel = () => {
        toastConfig.setToastConfig({
            hideDuration: null,
            open: true,
            type: 'info',
            message: `Your file will be downloaded/uploaded in a matter of seconds`
        });
        axiosInstance()
            .get(`/quote-builder/price-request-template/${quoteData?.data?.requestId}`, {
                responseType: 'arraybuffer'
            })
            .then((response) => {
                const fileName = response.headers['content-disposition'].split('filename=')[1];
                downloadExcel(response.data, fileName);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: 'Exported to excel successfully.'
                });
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const ImportInput = (
        <input
            onClick={(e: any) => (e.target.value = null)}
            id="importFromExcel"
            name="importFromExcel"
            onChange={uploadData}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            style={{
                opacity: '0',
                position: 'absolute',
                zIndex: -1
            }}
            type="file"
        />
    );

    return (
        <>
            <Box display="flex" pt={1} justifyContent="flex-end">
                <Box mx={1} />
                {!isSubmited && <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    // disabled={disabledSubmitButton}
                    onClick={handleSubmit}
                >
                    Submit
                </Button>}
                <Box mx={1} />
            </Box>

            {isSubmited ?
                <h1 style={{ padding: "10px", display: "flex", justifyContent: "center", color: "#047d1c" }} title={" Thanks for your submission"}>
                    Thanks for your submission
                </h1>
                :
                <>
                    {quoteDetailsData ? (
                        <DetailsPage
                            data={quoteDetailsData}
                            fields={quoteFields}
                        />
                    ) : null}
                    <Box mt={2} p={2}>
                        <>
                            <div className={"detail-box-content"}>
                                <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                <h3 className="form-label-style" title={" Product List"}>
                                    Product List
                                </h3>
                            </div>
                            <div id="importExportLinks" className={`${classes.root}`}>
                                <div className={classes.linksContainer}>
                                    <>
                                        <label htmlFor="importFromExcel" className={`${classes.darkLinks} p-1 cursor-pointer`}>
                                            {ImportInput}
                                            Import from Excel
                                        </label>
                                        <Divider orientation="vertical" flexItem className={classes.darkLinks} />
                                    </>
                                    <label onClick={exportToExcel} className={`${classes.darkLinks} p-1 cursor-pointer`}>
                                        Export to Excel
                                    </label>
                                </div>
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
                                        refreshGrid={fetchProduct}
                                        renderedFrom={renderedFrom}
                                        isClientSideGrid={true}
                                        onCellValueChanged={onCellValueChanged} />
                                    : <Box p={2} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}

                        </>
                    </Box>
                </>}
        </>
    );
}

export default QuoteSupplierPrice;