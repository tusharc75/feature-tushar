import React, { useState, useEffect, Fragment, useContext, useCallback } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ProductDialog from "./ProductDialog";
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import { getSearchQuery } from '../../services/util';
import { AiFillPlusCircle } from 'react-icons/ai';
import { BiLayerPlus } from 'react-icons/bi';
import { AiOutlineEye } from 'react-icons/ai';
import { BiMailSend } from 'react-icons/bi';
import { FiDownloadCloud } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { termsAndCondition } from '../../constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import ManageTermsAndCondition from '../../pages/TermsAndConditions/ManageTermsAndCondition';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import {
    EditorState,
    convertToRaw,
    convertFromRaw
} from 'draft-js';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Chip from '@material-ui/core/Chip';
import draftToHtml from 'draftjs-to-html';
import {
    Radio
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import EmailDialog from './EmailDialog'

var _ = require('lodash');


const useStyles = makeStyles((theme) => ({
    alignButtons: {
        top: "16px",
        left: "36%",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        justifyContent: "center",
        position: "absolute"
    },
    formControl: {
        minWidth: 120,
        width: "100%",
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    chip: {
        margin: 2,
    },

}));
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};
var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const ProductBuilder = (props) => {
    const { productBuilderId, TNC, Editable, status, columnView, PDF, QBId, currentv, Refresh } = props;
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext)
    const [isAddNewProduct, setIsAddNewProduct] = useState(false);
    const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState([]);
    const [columns, setColumns] = useState(null);
    const [productData, setProductData] = useState(null);
    const [totalProfit, setTotalProfit] = useState("");
    const [totalcost, setTotalCost] = useState("");
    const [totalsale, setTotalSale] = useState("");
    const [totalmargin, setTotalMargin] = useState("");
    const [dynamicTableData, setDynamicTableData] = useState([])
    const [ColumnName, setColName] = useState([]);
    const [visibleColumns, setVisibleColumnName] = useState([]);
    const [query, setQuery] = useState({ page: 0, limit: 5 });
    const [searchVal, setSearchVal] = useState("");
    const [data, setData] = useState([]);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [RadioIndex, setRadioIndex] = useState(-1);
    const [TandC, setTNC] = useState(TNC);
    const [checkAllAccounts, setCheckAllAccounts] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editRecord, setEditRecord] = useState<any>({})
    const [DOAreq, setDOAreq] = useState(false);
    const [Customerreq, setCustomerreq] = useState(true);
    const [sendEmail, setSendEmail] = useState(false)
    const [buttonMessage, setButtonMessage] = useState("Send to Customer");
    const theme = useTheme();

    let logo = null;
    var companyName = "";
    var companyAddress = "";
    let DOAlimit = 0;
    var DOAsetup = false;
    let termsTimeout;




    useEffect(() => {
        fetchTermsAndConditions()
    }, [query, searchVal])

    useEffect(() => {
        console.log("TNC is:");
        console.log("TandC");
        console.log(data);
        let rows = data?.map((u) => ({
            ...u,
            isChecked: u._id === TNC ? true : false,
            id: u._id,
        }));
        setDataRows([...rows]);
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].isChecked) {
                setRadioIndex(i);
                break;
            }
        }
    }, [data])

    useEffect(() => {
        fetchProduct();
    }, [productBuilderId]);



    const fetchTermsAndConditions = () => {
        if (termsTimeout) {
            clearTimeout(termsTimeout);
        }

        termsTimeout = setTimeout(() => {
            setLoading(true);
            let searchParams = searchVal
                ? { ...query, search: searchVal }
                : { ...query };
            let api = getSearchQuery(termsAndCondition.api, searchParams);
            setLoading(true);
            axiosInstance()
                .get(api)
                .then(({ data }) => {
                    setData(data.data);
                    setRowCount(data.count);
                    setCheckAllAccounts(false);
                    setLoading(false);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoading(false);
                });
        }, 600);
    }
    const columnsTNC = [
        {
            field: "isChecked",
            headerName: "Select",
            renderCell: (params) => (
                <Radio
                    color="primary"
                    // disabled={!params.canDelete}
                    checked={params.value}
                    onClick={(ev) => {
                        const gridData = dataRows;
                        const indexOfRecord = gridData.findIndex(
                            (d) => d.id === params.row.id
                        );
                        var prevvalue = gridData[indexOfRecord].isChecked;
                        for (var i = 0; i < gridData.length; i++) {
                            gridData[i].isChecked = false;
                        }
                        if (prevvalue) {
                            gridData[indexOfRecord].isChecked = false;
                            setRadioIndex(-1);
                        }
                        else {
                            gridData[indexOfRecord].isChecked = true;
                            setRadioIndex(indexOfRecord);
                        }

                        setDataRows([...gridData]);
                        setTNC(gridData[indexOfRecord]._id);
                        handleVersionUpdate(PDF, visibleColumns, status, gridData[indexOfRecord]._id);
                        console.log(gridData[indexOfRecord]._id);
                        const checkedRecords = gridData.filter((d) => d.isChecked === true);
                    }}
                />
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75
        },
        {
            field: "TACName", headerName: "Name", width: 500,
            renderCell: (params) => (
                <Link
                    onClick={() => {
                        setShowCreateDialog(true);
                    }}>
                    <CustomRenderCell value={params?.value} />
                </Link>
            )
        },

    ];


    const fetchDoaLimit = () => {
        axiosInstance()
            .get('doa-request/limit')
            .then(({ data }) => {
                console.log("DOA limit is:");
                console.log(data);
                DOAsetup = data.data.doasetup;
                DOAlimit = data.data.limit;
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });

    }

    const onFilterChange = useCallback((params) => {
        if (params.filterModel.items[0].value) {
            setQuery((prevState) => ({
                ...prevState,
                [params.filterModel.items[0].columnField]:
                    params.filterModel.items[0].value,
            }));
        } else {
            setQuery({ page: 0, limit: 25 });
        }
    }, []);


    let ActionsColoum: any = {
        field: "actions", headerName: "Actions ",
        renderCell: (params) => (
            <Fragment>
                <Tooltip title="Edit" >
                    <IconButton aria-label="Edit" onClick={() => { setProductData(params.row) }}  >
                        <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip >
                <Tooltip title="Delete" >
                    <IconButton aria-label="Delete" onClick={() => { removeProductInBuilder(params.row._id) }}  >
                        <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                </Tooltip >
            </Fragment>
        ),
        width: 200,
        disableColumnMenu: true,
        sortable: false,
        filterable: false,
    }

    const createImagePDF = (view, send) => {
        axiosInstance()
            .get('/user/brandInfo')
            .then(({ data }) => {
                companyName = data.data.name;
                companyAddress = data.data.address
                if (data.data.logo) {
                    fetchImage(data.data.logo, function (dataUri) {
                        logo = dataUri;
                        GeneratePdf(view, send)
                    });
                }
                else {
                    GeneratePdf(view, send)
                }

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });

    }

    const fetchImage = (Url, cb) => {
        var image = new Image();
        image.setAttribute('crossOrigin', 'anonymous'); //getting images from external domain

        image.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            console.log(image.naturalWidth);
            //next three lines for white background in case png has a transparent background
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';  /// set white fill style
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            canvas.getContext('2d').drawImage(image, 0, 0);

            cb(canvas.toDataURL('image/jpeg'));
        };

        image.src = Url;
    }

    const GeneratePdf = (view, send) => {
        const PdfDoc = new jsPDF('p', 'pt', 'a4');

        const pagewidth = PdfDoc.internal.pageSize.width;
        if (logo !== null) {
            PdfDoc.addImage(logo, 'JPEG', pagewidth - 80, 0, 70, 50);
        }
        PdfDoc.setFontSize(26);
        PdfDoc.text(companyName, 20, 30);
        PdfDoc.setFontSize(14);
        PdfDoc.text(companyAddress, 20, 45);
        var PDFData = [];
        var PdfCol = [];
        dynamicTableData.forEach(dataEntry => {
            var PdfRow = [];
            ColumnName.forEach(ColName => {
                if (visibleColumns.indexOf(ColName) !== -1) {
                    if (PdfCol.indexOf(ColName) == -1) {
                        PdfCol.push(ColName);
                    }
                    PdfRow.push(dataEntry[ColName]);
                }
            })
            PDFData.push(PdfRow);
        });
        PdfDoc.setFontSize(14);
        var text = "Please find the Quoatation Below:"
        var lineHeight = PdfDoc.getLineHeight();
        var splittedText = PdfDoc.splitTextToSize(text, 50)
        PdfDoc.text(text, 20, 90);
        var lines = splittedText.length
        var blockHeight = (lines) * lineHeight;
        PDFData = [...PDFData, [{
            content: `Quote Total : ${totalsale}`, colSpan: PDFData[0].length,
            styles: { halign: 'right', valign: 'middle' }
        }]];
        autoTable(PdfDoc, {
            margin: { top: 20 + blockHeight },
            head: [PdfCol],
            body: PDFData,
            styles: { halign: 'center', cellWidth: 'auto', overflow: 'linebreak' },
            theme: 'grid'
        });
        let finalY = (PdfDoc as any).lastAutoTable.finalY;
        if (RadioIndex !== -1) {
            let state = convertFromRaw(JSON.parse(dataRows[RadioIndex].description));
            let TNC = EditorState.createWithContent(state)
            var markup = draftToHtml(convertToRaw(TNC.getCurrentContent()));
            markup = markup.replaceAll(" ", "&nbsp");
            PdfDoc.html(markup, {
                callback: function (doc) {
                    if (view && !send) {
                        doc.output('dataurlnewwindow');
                    }
                    else if (!view && !send) {
                        doc.save();
                    }
                    if (send) {
                        var PDFtoAPIData = doc.output('blob');
                        console.log("PDF Data is");
                        console.log(PDFtoAPIData);
                        const formdata = new FormData();
                        formdata.append("file", PDFtoAPIData, "Quotation.pdf");
                        axiosInstance().post('/user/upload/', formdata, {
                            headers: {
                                "content-type": "multipart/form-data"
                            }
                        })
                            .then(({ data }) => {
                                console.log("PDF Response is:");
                                console.log(data);
                                axiosInstance().post(`/doa-request/create/`)
                                    .then(({ data }) => {
                                    })
                                    .catch((err) => {
                                        toastConfig.setToastConfig(err);
                                    });
                            })
                            .catch((err) => {
                                toastConfig.setToastConfig(err);
                            });


                    }

                }, x: 20, y: finalY + lineHeight, margin: [20, 10, 20, 10]
            });
        }
        else {
            if (view && !send) {
                PdfDoc.output('dataurlnewwindow');
            }
            else if (!view && !send) {
                PdfDoc.save('Quation.pdf');
            }
            if (send) {
                var PDFtoAPIData = PdfDoc.output('blob');
                console.log("PDF Data is");
                console.log(PDFtoAPIData);
                const formdata = new FormData();
                formdata.append("file", PDFtoAPIData, "Quotation.pdf");
                axiosInstance().post('/user/upload/', formdata, {
                    headers: {
                        "content-type": "multipart/form-data"
                    }
                })
                    .then(({ data }) => {
                        console.log("PDF Response is:");
                        console.log(data);
                        if (DOAreq) {
                            handleVersionUpdate(data.fileName, visibleColumns, "Sent for DOA", TandC);
                        }
                        else {
                            handleVersionUpdate(data.fileName, visibleColumns, status, TandC);
                        }

                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                    });


            }
        }
    };
    const handlePage = (params) => {
        if (query.page !== params.page) {
            setQuery((prevState) => ({ ...prevState, page: params.page }));
        }
    };



    const handlePageSize = (params) => {
        if (params.pageSize !== query.limit) {
            setQuery({ page: 0, limit: params.pageSize });
        }
    };

    const handleCloseCreateDialog = (params) => {
        setShowCreateDialog(false)
        setEditRecord({})
        if (params?.fetchData) fetchTermsAndConditions()
    }

    const handleSortModelChange = (params) => {
        if (params?.sortModel && params.sortModel.length > 0) {
            let temp = { ...params.sortModel[0] };
            setQuery((prevState) => ({
                ...prevState,
                page: 0,
                sortBy: temp.field,
                orderBy: temp.sort,
            }));
        }
    };

    const fetchProduct = () => {
        fetchDoaLimit();
        setLoading(true)
        axiosInstance().get(`/productbuilder/getproduct/` + productBuilderId).then(({ data: { data } }) => {
            data = data.data?.map((u) => ({
                ...u,
                id: u._id,
            }));
            productBuilderdatatoQuoteBuilderdata(data);
            setColumns(null);
            let column = [{ field: 'id', headerName: 'id', hide: true }]
            data.forEach((row) => {
                row.fields.forEach((ele) => {
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
                                    col.order = ele.order
                                    col.leval = ele.leval
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
                                        col.order = ele.order
                                        col.leval = ele.leval
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
                                    col.order = ele.order
                                    col.leval = ele.leval
                                    column.push(col)
                                }
                            })
                        }
                    }
                    else {
                        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = ele.fieldName
                            col.headerName = ele.fieldLabel
                            col.width = 180
                            if (ele.fieldName === "productName") {
                                col.renderCell = (params) => (
                                    Editable ?
                                        (<Link className="link" onClick={() => { setProductData(params.row) }}   >
                                            {params.row.productName}
                                        </Link>) : (<>{params.row.productName}</>)

                                )
                            }
                            else {
                                col.renderCell = (params) => (params.row[ele.fieldName] ?
                                    typeof params.row[ele.fieldName] === 'object' ? params.row[ele.fieldName][ele.fieldName] : params.row[ele.fieldName]
                                    : <NoDataCell />)
                            }
                            col.order = ele.order
                            col.leval = ele.leval
                            column.push(col)
                        }
                    }
                })
            });
            column = _.orderBy(column, 'order', 'asc');
            column = _.sortBy(column, function (item) {
                return levalOrderBy.indexOf(item.leval)
            });
            if (Editable) {
                column.push(ActionsColoum)
            }
            setColumns(column);
            setProduct(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const addProductInBuilder = (rows) => {
        let data: any = {}
        data.product = rows
        data._id = productBuilderId
        setLoading(true)
        axiosInstance().post(`/productbuilder/addproduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            fetchProduct()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
        // let data = [...product];
        // rows.map((_r) => data.push({ ..._r, id: (parseInt((Math.random() * 100000).toString())) }));
        // setProduct(data)
    }

    const handleSaveProduct = (row) => {
        let data: any = {}
        data.product = row
        data._id = productBuilderId
        setLoading(true)
        axiosInstance().put(`/productbuilder/updateProduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            setProductData(null)
            fetchProduct();
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const removeProductInBuilder = (_id) => {
        setLoading(true)
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._id = _id
        axiosInstance().post(`/productbuilder/deleteproduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            fetchProduct()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const productBuilderdatatoQuoteBuilderdata = (BuilderData) => {
        console.log(BuilderData);
        const inventory: { fieldName: string; fieldValue: any; }[][] = [];
        const ignoredKeys = ['fields', '_id', 'productId', 'templateFields', 'id'];
        var totalCost = 0;
        var totalSellingPrice = 0
        var totalMargin = 0
        var totalProfit = 0
        var CostCurrency = ""
        var SPCurrency = ""
        var MarginCurrency = ""
        var ProfitCurrency = ""
        BuilderData.map((quoteRows: { [x: string]: any; }) => {
            console.log(quoteRows);
            const quoteRowKeys = Object.keys(quoteRows);
            var inventorydata: { fieldName: string; fieldValue: any; }[] = [];
            quoteRowKeys.map((key) => {
                console.log(key);
                if (ignoredKeys.indexOf(key) === -1) {
                    var indexkey = key;
                    var currency = ""
                    if (key.includes("_")) {
                        var splitKey = key.split("_")
                        key = splitKey[0]
                        currency = splitKey[1]
                    }
                    var fields = quoteRows["fields"]
                    var field = fields.filter((d: { fieldName: string; }) => d.fieldName === key);
                    if (typeof (quoteRows[key]) === "object") {
                        inventorydata.push({
                            fieldName: field[0].fieldLabel,
                            fieldValue: quoteRows[key][key]
                        });
                    }
                    else {
                        inventorydata.push({
                            fieldName: field[0].fieldLabel,
                            fieldValue: quoteRows[indexkey]
                        });
                    }
                    if (key === 'totalCost') {
                        totalCost = totalCost + quoteRows[indexkey]
                        CostCurrency = currency.toUpperCase()
                    }
                    else if (key === 'totalSalesPrice') {
                        totalSellingPrice = totalSellingPrice + quoteRows[indexkey]
                        SPCurrency = currency.toUpperCase()
                    }
                    else if (key === "totalProfit") {
                        totalProfit = totalProfit + quoteRows[indexkey]
                        ProfitCurrency = currency.toUpperCase()
                    }
                    else if (key === "totalMargin") {
                        totalMargin = totalMargin + quoteRows[indexkey]
                        MarginCurrency = currency.toUpperCase()
                    }
                }
            })
            inventory.push(inventorydata);
        });
        console.log(inventory);

        setTotalProfit(totalProfit.toString() + " " + ProfitCurrency);
        setTotalMargin(totalMargin.toString() + " " + MarginCurrency);
        setTotalSale(totalSellingPrice.toString() + " " + SPCurrency);
        setTotalCost(totalCost.toString() + " " + CostCurrency);
        console.log("Check:");
        console.log(DOAsetup);
        console.log(DOAlimit);
        console.log(status)
        console.log(totalSellingPrice)
        setButtonMessage("Send to Customer");
        setDOAreq(false);
        setCustomerreq(true);

        if (DOAsetup && totalSellingPrice > DOAlimit && status === "Building Quote") {
            setDOAreq(true);
            setCustomerreq(false);
            setButtonMessage("Send for DOA");
        }
        else if (status.includes("Rejected by DOA")) {
            setDOAreq(true);
            setCustomerreq(false);
            setButtonMessage("Send for DOA");
        }
        else if (status === "Sent for DOA") {
            setDOAreq(false);
            setCustomerreq(false);
        }
        else if (status === "Sent to Customer" || status === "Accepted by Customer" || status === "Rejected by Customer") {
            setDOAreq(false);
            setCustomerreq(false);
        }
        var TableData = [];
        var Col = [];
        var ColName = [];
        var columnext = [];
        var KeyValuePairs = [];
        type Type = {
            [key: string]: any;
        };

        for (var i = 0; i < inventory.length; i++) {
            var KeyValue: Type = {};
            for (var j = 0; j < inventory[i].length; j++) {
                var DataSet = inventory[i][j];
                if (ColName.indexOf(DataSet.fieldName) === -1) {
                    ColName = [...ColName, DataSet.fieldName];
                    Col = [...Col, { title: DataSet.fieldName, name: DataSet.fieldName }];
                    columnext = [...columnext, { ColumnName: DataSet.fieldName, width: 100 }];
                }
                KeyValue[DataSet.fieldName] = DataSet.fieldValue;
            }
            KeyValuePairs = [...KeyValuePairs, KeyValue];
        }
        setColName(ColName);
        if (columnView) {
            setVisibleColumnName(columnView)
        }
        else {
            setVisibleColumnName(ColName);
        }


        for (var j = 0; j < KeyValuePairs.length; j++) {
            const DataSet = KeyValuePairs[j];
            var DataRecord: Type = {};
            for (var i = 0; i < ColName.length; i++) {
                if (ColName[i] in DataSet) {
                    DataRecord[ColName[i]] = DataSet[ColName[i]];
                }
                else {
                    DataRecord[ColName[i]] = '-';
                }
            }
            TableData = [...TableData, DataRecord]
        }
        setDynamicTableData(TableData);
    }

    const handleCases = () => {
        console.log("HandleCases");
        if (DOAreq) {
            if (!PDF) {
                GeneratePdf(false, true);
            }
            axiosInstance().post(`/doa-request/create/${QBId}?version=${currentv}`)
                .then(({ data }) => {
                    Refresh(currentv)
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        };
        if (Customerreq) {
            if (!PDF) {
                GeneratePdf(false, true);
            }
            setSendEmail(true);
        }
    }
    const handleChangeVisible = (event) => {
        setVisibleColumnName(event.target.value);
        handleVersionUpdate(PDF, event.target.value, status, TandC);
    };

    function getStyles(name, personName, theme) {
        return {
            fontWeight:
                personName.indexOf(name) === -1
                    ? theme.typography.fontWeightRegular
                    : theme.typography.fontWeightMedium,
        };
    }

    const cloneVersion = () => {
        axiosInstance().post(`/quote-builder/createVersion/${QBId}?version=${currentv}`, data).then(({ data: { data } }) => {
            Refresh(0);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleVersionUpdate = (PDFfile, Columns, Status, TC) => {
        var body = { PDF: PDFfile, acceptedColumns: Columns, status: Status, TNC: TC }
        axiosInstance()
            .post(`quote-builder/updateVersion/${QBId}?version=${currentv}`, body)
            .then(({ data }) => {

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }

    const onSuccess = () => {
        setSendEmail(false)
        console.log("Success");
        handleVersionUpdate("", visibleColumns, "Sent to Customer", TandC);
        Refresh(currentv);
    }

    return (<Box p={1}>
        <Box>
            <Grid container>
                <Grid item xs={12} sm={12} md={12} justify={"flex-end"} className="d-flex align-items-center gap-1">
                    {Editable ?
                        (<>
                            <Button variant="outlined" size="small" startIcon={<AiFillPlusCircle />} color="primary" onClick={() => { setIsAddNewProduct(true); }}>New</Button>
                            <Button variant="outlined" size="small" startIcon={<BiLayerPlus />} color="primary" onClick={() => { setIsAddExistingProduct(true); }}>Add Existing</Button></>) : (null)}
                    <Button variant="outlined" size="small" startIcon={<BiLayerPlus />} color="primary" onClick={() => { cloneVersion() }}>Clone Version</Button>
                    <Button onClick={() => createImagePDF(true, false)} variant="outlined" size="small" startIcon={<AiOutlineEye />} color="primary">View</Button>
                    <Button onClick={() => createImagePDF(false, false)} variant="outlined" size="small" startIcon={<FiDownloadCloud />} color="primary">Download</Button>
                    <Button onClick={() => handleCases()} disabled={!DOAreq && !Customerreq} startIcon={<BiMailSend />} variant="contained" size="small" color="primary">{buttonMessage}</Button>
                </Grid>
                <Grid item xs={12} md={12} sm={12} className="d-flex align-items-center gap-1 quotePanel mt-2">
                    <div className="quoteBox">
                        <span>Total Profit</span>
                        <span>{totalProfit}</span>
                    </div>
                    <div className="quoteBox">
                        <span>Total Cost Price</span>
                        <span>{totalcost}</span>
                    </div>
                    <div className="quoteBox">
                        <span>Total Selling Price</span>
                        <span>{totalsale}</span>
                    </div>
                    <div className="quoteBox">
                        <span>Total Margin</span>
                        <span>{totalmargin}</span>
                    </div>
                    <div className="quoteBox">
                        <span>Status</span>
                        <span>{status}</span>
                    </div>
                    <div>
                    </div>
                </Grid>
                <Grid item className="d-flex align-items-center gap-1 mb-2" xs={12} sm={12} md={12} >
                    {Editable ? (<FormControl className={classes.formControl}>
                        <InputLabel id="demo-mutiple-chip-label">Visible Columns in Quote</InputLabel>
                        <Select
                            labelId="demo-mutiple-chip-label"
                            id="demo-mutiple-chip"
                            multiple
                            value={visibleColumns}
                            onChange={handleChangeVisible}
                            input={<Input id="select-multiple-chip" />}
                            renderValue={(selected: any) => (
                                <div className={classes.chips}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} className={classes.chip} />
                                    ))}
                                </div>
                            )}
                            MenuProps={MenuProps}
                        >
                            {ColumnName.map((name) => (
                                <MenuItem key={name} value={name} style={getStyles(name, visibleColumns, theme)}>
                                    <Checkbox checked={visibleColumns.indexOf(name) > -1} />{name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>) : null}
                </Grid>
            </Grid>

            <Box height={500}>
                {columns &&
                    <DataGrid
                        checkboxSelection
                        components={{
                            NoRowsOverlay: CustomDataGridNoDataFound,
                        }}
                        loading={loading}
                        rows={product}
                        disableSelectionOnClick
                        disableMultipleSelection
                        columns={columns}
                        pageSize={25}
                        density="compact"
                    />}
            </Box>
            {Editable ?
                (<Box>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
                            <Grid container>
                                <Grid item xs={12} md={12} sm={12} className="d-flex align-items-center p-2 gap-1" container justify="flex-start">
                                    <Button onClick={() => setShowCreateDialog(true)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add Terms & Conditions</Button>
                                </Grid>
                                <Grid item xs={12} className="listing-grid">
                                    <DataGrid
                                        components={{
                                            Toolbar: DataGridCustomToolbar,
                                            NoRowsOverlay: CustomDataGridNoDataFound,
                                        }}
                                        scrollbarSize={20}
                                        rows={dataRows}
                                        columns={columnsTNC}
                                        loading={loading}
                                        disableSelectionOnClick
                                        disableMultipleSelection
                                        paginationMode="server"
                                        pagination
                                        onPageChange={handlePage}
                                        onPageSizeChange={handlePageSize}
                                        pageSize={query.limit}
                                        page={query.page}
                                        rowCount={rowCount}
                                        rowsPerPageOptions={[25, 50, 75]}
                                        onSortModelChange={handleSortModelChange}
                                        onFilterModelChange={onFilterChange}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>) :
                (null)}
        </Box>
        {
            showCreateDialog ? (
                <ManageTermsAndCondition
                    termsAndCondition={termsAndCondition}
                    open={showCreateDialog}
                    handleClose={handleCloseCreateDialog}
                    fetchData={fetchTermsAndConditions}
                    editRecord={editRecord}
                />
            ) : null
        }
        {isAddNewProduct && <CreateProduct isClone={false} productId={null} handleClose={() => setIsAddNewProduct(false)}
            isAddInBuilder={true} addProductInBuilder={addProductInBuilder}
        />}
        {isAddExistingProduct && <AddExistingProduct addProductInBuilder={addProductInBuilder} handleClose={() => setIsAddExistingProduct(false)} />}
        {productData && <ProductDialog productData={productData} handleSaveProduct={handleSaveProduct} handleClose={() => setProductData(null)} />}
        {sendEmail && <EmailDialog
            handleClose={() => setSendEmail(false)}
            success={onSuccess}
            id={QBId}
            version={currentv} />
        }
    </Box>
    );
}

export default ProductBuilder;
