import React, { useContext, useEffect, Fragment, useState, useCallback } from 'react'
import { useParams, useHistory } from "react-router-dom";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import axiosInstance from '../../axios/axiosInstance'
import { GiAbstract055 } from 'react-icons/gi';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDynamicGrid from '../../components/CustomDynamicGrid/CustomDynamicGrid'
import { getSearchQuery } from '../../services/util';
import { termsAndCondition } from '../../constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { DataGrid } from "@material-ui/data-grid";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import ManageTermsAndCondition from '../TermsAndConditions/ManageTermsAndCondition';
import ChatRender from '../../components/Chatter';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import EmailDialog from './EmailDialog';
import { FiDownloadCloud } from 'react-icons/fi';
import { FaRegClone } from 'react-icons/fa';
import { Tooltip } from '@material-ui/core'
import {
    Grid as GridDropTable,
    DragDropProvider,
    Table,
    TableHeaderRow,
    TableColumnReordering,
    TableColumnVisibility,
    ColumnChooser,
    Toolbar,
} from '@devexpress/dx-react-grid-material-ui';

import {
    Button,
    Radio,
    Grid,
    Paper,
    Typography
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    EditorState,
    convertToRaw,
    convertFromRaw
} from 'draft-js';
import draftToHtml from 'draftjs-to-html'
import { SettingsCellTwoTone } from '@material-ui/icons';
import { makeStyles } from "@material-ui/core/styles";
import { BiMailSend } from 'react-icons/bi';
import { AiOutlineEye } from 'react-icons/ai';

let termsTimeout;
var newQuote = false;
var fetchVersion = false;

let logo = null;
var companyName=""
var companyAddress=""

const CreatePriceBuilder = (props) => {
    //const {id}= props;
    const { id } = useParams();
    //const {id}= {id:"6093cf0fcee24cd4d39ecda8"}

    const [currentVersion, setcurrentVersion] = useState(1);
    const [versions, setVersions] = useState([]);
    const toastConfig = useContext(CustomToastContext);
    const [dynamicCol, setDynamicCol] = useState([]);
    const [ColumnName, setColName] = useState([]);
    const [dynamicTableData, setDynamicTableData] = useState([])
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [query, setQuery] = useState({ page: 0, limit: 5 });
    const [searchVal, setSearchVal] = useState("");
    const [data, setData] = useState([]);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [RadioIndex, setRadioIndex] = useState(-1);
    const [checkAllAccounts, setCheckAllAccounts] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [editRecord, setEditRecord] = useState<any>({})
    const [tableColumnExtensions, settableColExt] = useState([
    ]);
    const [droppedColumns, setDroppedColumns] = useState([])
    const [QData, setQData] = useState({})
    const [editRestriction, setEditRestriction] = useState(false);
    let DOAlimit = 0;
    var DOAsetup=false;
    const [DOAapprovalreq, setDOAapprovalreq] = useState(false);
    const [sendtoCustomer, setsendtoCustomer] = useState(true);
    const [buttonMessage, setButtonMessage] = useState("Send to Customer");
    const [QBId, setQBId] = useState("");
    const [TandC, setTNC] = useState("");
    const [sendEmail, setSendEmail] = useState(false)
    var chatterID = "0";




    useEffect(() => {
        fetchDoaLimit();
    }, [])

    useEffect(() => {
        GetQuoteData(0);
    }, []);


    useEffect(() => {
        fetchTermsAndConditions()
    }, [query, searchVal])



    useEffect(() => {
        console.log("TNC is:");
        console.log(QData);
        console.log("TandC");
        console.log(data);
        let rows = data?.map((u) => ({
            ...u,
            isChecked: u._id === QData["TNC"] ? true : false,
            id: u._id,
        }));
        setDataRows([...rows]);
        for(var i=0;i<rows.length;i++){
            if(rows[i].isChecked){
                setRadioIndex(i);
                break;
            }
        }
    }, [data])


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

    const createImagePDF=(view, send)=>{ 
        axiosInstance()
        .get('/user/brandInfo')
        .then(({ data }) => {
            companyName=data.data.name;
            companyAddress=data.data.address
            fetchImage(data.data.logo,function(dataUri) {
                logo = dataUri;
                GeneratePdf(view,send)
               
            });
        })
        .catch((err) => {
            toastConfig.setToastConfig(err);
            setLoading(false);
        });
        
    }


    const fetchImage=(Url,cb)=> {
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

            canvas.getContext('2d').drawImage(image,0,0);

            cb(canvas.toDataURL('image/jpeg'));
        };

        image.src = Url;
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

    const fetchDoaLimit = () => {
        axiosInstance()
            .get('doa-request/limit')
            .then(({ data }) => {
                console.log("DOA limit is:");
                console.log(data);
                DOAsetup=data.data.doasetup;
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
    const columns = [
        {
            field: "isChecked",
            headerName: "Select",
            renderCell: (params) => (
                <Radio
                    color="primary"
                    // disabled={!params.canDelete}
                    checked={params.value}
                    onClick={(ev) => {
                        if (QData["Quote_Status"] !== "Quote Generated") {
                            setEditRestriction(true);
                        }
                        else {
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
                            console.log(gridData[indexOfRecord]._id);
                            handleUpdate(ColumnName, droppedColumns, gridData[indexOfRecord]._id, "", "");
                            const checkedRecords = gridData.filter((d) => d.isChecked === true);

                        }
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

    const GetQuoteData = (version) => {
        setDOAapprovalreq(false);
        setsendtoCustomer(true);
        setButtonMessage("Send to Customer");
        setLoaded(false);
        axiosInstance()
            .get('quote-builder?id=' + id + '&version=' + version)
            .then(({ data }) => {
                console.log(data.Data);
                QuoteData(data.Data);
                setQData(data.Data);
                chatterID = data.Data.chatter
                var totalversions = []
                if (version === 0) {
                    setcurrentVersion(data.Data.latestVersion);
                }
                for (var i = 1; i <= data.Data.latestVersion; i++) {
                    totalversions.push(i);
                }

                setQBId(data.Data._id);
                setVersions(totalversions);
                console.log('Chatter ID is:');
                console.log(chatterID);
                console.log(data.Data["TotalSellingPrice"]);
                if (data.Data["TNC"]) {
                    setTNC(data.Data["TNC"]);

                }
                console.log(DOAlimit);
                console.log(data.Data["Quote_Status"]);
                console.log(DOAsetup);

                if (data.Data["TotalSellingPriceamount"] > DOAlimit && data.Data["Quote_Status"] === "Quote Generated" && DOAsetup) {
                    console.log("Need DOA");
                    setDOAapprovalreq(true);
                    setsendtoCustomer(false);
                    setButtonMessage("Send for DOA");
                }
                else if (data.Data["Quote_Status"] === "Sent for DOA" || data.Data["Quote_Status"] === "Sent to Customer" || data.Data["Quote_Status"] === "Accepted by Customer" || data.Data["Quote_Status"] === "Rejected by Customer") {
                    console.log("sent for DOA");
                    setDOAapprovalreq(false);
                    setsendtoCustomer(false);

                }
                else if (data.Data["Quote_Status"].includes("Rejected by DOA")) {
                    console.log("Rejected by DOA");
                    setDOAapprovalreq(true);
                    setsendtoCustomer(false);
                    setButtonMessage("Resend for DOA");
                }
                setLoaded(true);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });

    }
    const QuoteData = (data) => {
        var TableData = [];
        var Col = [];
        var ColName = [];
        var columnext = [];
        var KeyValuePairs = [];
        type Type = {
            [key: string]: any;
        };

        for (var i = 0; i < data.inventory.length; i++) {
            var KeyValue: Type = {};
            for (var j = 0; j < data.inventory[i].length; j++) {
                var DataSet = data.inventory[i][j];
                if (ColName.indexOf(DataSet.fieldName) === -1) {
                    ColName = [...ColName, DataSet.fieldName];
                    Col = [...Col, { title: DataSet.fieldName, name: DataSet.fieldName }];
                    columnext = [...columnext, { ColumnName: DataSet.fieldName, width: 100 }];
                }
                KeyValue[DataSet.fieldName] = DataSet.fieldValue;
            }
            KeyValuePairs = [...KeyValuePairs, KeyValue];
        }
        if (data.ColumnOrder) {
            setColName(data.ColumnOrder);
        }
        else {
            setColName(ColName);
        }
        if (data.HiddenColumns) {
            setDroppedColumns(data.HiddenColumns);
        }
        if (fetchVersion === false && data.Quote_Status === 'Quote not generated yet') {
            newQuote = true;
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
        setDynamicCol(Col);
        settableColExt(columnext);
    };


    const GeneratePdf = (view, send) => {
        const PdfDoc = new jsPDF('p', 'pt', 'a4');

        const pagewidth= PdfDoc.internal.pageSize.width;
        if(logo!==null){
        PdfDoc.addImage(logo, 'JPEG', pagewidth-80, 0, 70, 50);
        }
        PdfDoc.setFontSize(26);
        PdfDoc.text(companyName,20,30);
        PdfDoc.setFontSize(14);
        PdfDoc.text(companyAddress,20,45);
        var PDFData = [];
        var PdfCol = [];
        dynamicTableData.forEach(dataEntry => {
            var PdfRow = [];
            ColumnName.forEach(ColName => {
                if (droppedColumns.indexOf(ColName) === -1) {
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
            content: `Quote Total : ${QData["TotalSellingPriceamount"]} ${QData["TotalSellingPricecurr"]}`, colSpan: PDFData[0].length,
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
                                handleUpdate(ColumnName, droppedColumns, TandC, "", data.fileName);
                                axiosInstance().post(`/doa-request/create/` + QBId)
                                    .then(({ data }) => {
                                        GetQuoteData(currentVersion);
                                        setButtonMessage("Send to Customer");
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
                        handleUpdate(ColumnName, droppedColumns, TandC, "", data.fileName);

                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                    });


            }
        }



    }

    const handleChangeVersion = (event) => {
        setcurrentVersion(event.target.value);
        fetchVersion = true;
        if (newQuote && event.target.value == Math.max(...versions)) {
            GetQuoteData(0);
        }
        else {
            GetQuoteData(event.target.value);
        }

    };

    const handlehiddenChange = (values) => {
        if (QData["Quote_Status"] !== "Quote Generated") {
            setEditRestriction(true);
        }
        else {
            setDroppedColumns(values);
            handleUpdate(ColumnName, values, TandC, "", "");
        }
    }

    const handleorder = (values) => {
        if (QData["Quote_Status"] !== "Quote Generated") {
            setEditRestriction(true);
        }
        else {
            setColName(values);
            handleUpdate(values, droppedColumns, TandC, "", "");
        }
    }

    const cloneQuote = () => {
        axiosInstance().post(`/quote-builder/cloneQuote/` + id + "?version=" + currentVersion)
            .then(({ data }) => {
                GetQuoteData(0);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    const handleUpdate = (
        colorder,
        hidecol,
        TNC,
        status,
        PDF
    ) => {
        const Update = {
            Columnorder: colorder,
            HiddenColumns: hidecol,
            TNC: TNC,
            status: status === "" ? QData["Quote_Status"] : status,
            PDF: PDF
        }

        axiosInstance().post(`/quote-builder/updateQuote/` + id + "?version=" + currentVersion, Update)
            .then(({ data }) => {

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });

    }


    const handleCases = () => {
        console.log("HandleCases");
        console.log(DOAapprovalreq);
        console.log(sendtoCustomer);
        if (DOAapprovalreq) {
            if (!QData["PDF"]) {
                GeneratePdf(false, true);
            }
            axiosInstance().post(`/doa-request/create/` + QBId)
                .then(({ data }) => {
                    GetQuoteData(currentVersion);
                    setButtonMessage("Send to Customer");
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        };
        if (sendtoCustomer) {
            console.log(QData);
            console.log(QData["PDF"])
            if (!QData["PDF"]) {
                GeneratePdf(false, true);
            }
            setSendEmail(true);
        }

    }

    const onSuccess = () => {
        setSendEmail(false)
        console.log("Success");
        handleUpdate(ColumnName, droppedColumns, TandC, "Sent to Customer", "");
        GetQuoteData(currentVersion)
    }


    return (
        <Layout>
            <Grid container direction="row">
                <CustomBreadCrumbs routes={[{ title: "Quote Builder" }]} />
            </Grid>
            <Grid container spacing={1} className="detail-container">
                <Grid item xs={12} sm={12} md={8} lg={8}>
                    <Paper className="subContainer">
                        <Grid container className="detailHeader">
                            <Grid item xs={12} md={5} sm={6} className="d-flex align-items-center gap-1">
                                <GiAbstract055 color="primary" /><span className="listingHeader">Quote Builder</span>
                                <div className="customDropdownBox">
                                    <select className="customSelect" value={currentVersion}
                                        onChange={handleChangeVersion}>
                                        {versions.map((team) => <option key={team} value={team}>{"Version : " + team}</option>)}
                                    </select>
                                    <Tooltip title="Clone"
                                        placement="right" >
                                        <FaRegClone onClick={() => cloneQuote()} />
                                    </Tooltip>
                                </div>
                            </Grid>
                            <Grid item xs={12} md={7} sm={6} className="d-flex align-items-center gap-1" container justify="flex-end">
                                <Button onClick={() => createImagePDF(true, false)} variant="outlined" size="small" startIcon={<AiOutlineEye />} color="primary">View</Button>
                                <Button onClick={() => createImagePDF(false, false)} variant="outlined" size="small" startIcon={<FiDownloadCloud />} color="primary">Download</Button>
                                <Button onClick={() => handleCases()} disabled={!DOAapprovalreq && !sendtoCustomer} startIcon={<BiMailSend />}  variant="contained" size="small" color="primary">{buttonMessage}</Button>
                            </Grid>
                        </Grid>
                        <Grid container>
                            <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
                                <Grid item xs={12} md={12} sm={12} className="d-flex align-items-center gap-1 quotePanel">
                                    <div className="quoteBox">
                                        <span>Total Profit</span>
                                        <span>{QData["TotalProfitamount"]} {QData["TotalProfitcurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Total Cost Price</span>
                                        <span>{QData["TotalCostamount"]} {QData["TotalCostcurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Total Selling Price</span>
                                        <span>{QData["TotalSellingPriceamount"]} {QData["TotalSellingPricecurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Total Margin</span>
                                        <span> {QData["TotalMarginamount"]} {QData["TotalMargincurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Status</span>
                                        <span> {QData["Quote_Status"]}</span>
                                    </div>
                                    <div>
                                    </div>
                                </Grid>
                                <GridDropTable
                                    rows={dynamicTableData}
                                    columns={dynamicCol} >
                                    <DragDropProvider />
                                    <Table
                                        columnExtensions={tableColumnExtensions}
                                    />
                                    <TableColumnReordering
                                        order={ColumnName}
                                        onOrderChange={(values) => handleorder(values)}
                                    />

                                    <TableHeaderRow />
                                    <TableColumnVisibility
                                        hiddenColumnNames={droppedColumns}
                                        onHiddenColumnNamesChange={(values) => handlehiddenChange(values)}
                                    />
                                    <Toolbar />
                                    <ColumnChooser />
                                </GridDropTable>
                            </Grid>
                            <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
                                <Grid container className="detailHeader">
                                    <Grid item xs={12} md={4} sm={6} className="d-flex align-items-center gap-1">
                                        <GiAbstract055 color="primary" /><span className="listingHeader">Terms and Conditons</span>
                                    </Grid>
                                    <Grid item xs={12} md={8} sm={6} className="d-flex align-items-center gap-1" container justify="flex-end">
                                        <Button onClick={() => setShowCreateDialog(true)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                                    </Grid>
                                    <Grid item xs={12} container justify="flex-end">
                                        <DataGrid
                                            components={{
                                                Toolbar: DataGridCustomToolbar,
                                                NoRowsOverlay: CustomDataGridNoDataFound,
                                            }}
                                            scrollbarSize={20}
                                            rows={dataRows}
                                            columns={columns}
                                            loading={loading}
                                            disableSelectionOnClick
                                            disableMultipleSelection
                                            paginationMode="server"
                                            pagination
                                            autoHeight
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
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={12} md={4} lg={4}>
                    <ChatRender id={QData["chatter"]} />
                </Grid>
            </Grid>

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

            <div>
                {editRestriction &&
                    <ConfirmationDialog
                        open={editRestriction}
                        message={`Cannot change Quote once sent for DOA process or to Customer.Please clone the Quote to make changes.`}
                        onClose={() => setEditRestriction(false)}
                        onOk={() => setEditRestriction(false)}
                    />
                }
            </div>
            <div>
                {sendEmail && <EmailDialog
                    handleClose={() => setSendEmail(false)}
                    success={onSuccess}
                    id={QData["_id"]} />
                }
            </div>

        </Layout >


    );

}

export default CreatePriceBuilder;