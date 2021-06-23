import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState, useContext } from 'react'
import { GoThumbsdown, GoThumbsup } from 'react-icons/go';
import Layout from "../../components/Layout";
import { DataGrid } from "@material-ui/data-grid";
import { Grid } from "@material-ui/core";
import {
    Button,
    makeStyles
} from "@material-ui/core";
import axios from 'axios'
import { couldStartTrivia } from "typescript";
import { backendApi } from './../../config';
import DOAReasonDialog from "../DOA/DOAReasonDialog";
import SignatureDialog from "../../components/Helpers/SignatureDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { displayDate } from "../../services/util";
import { formatAmountWithCurrency } from "../../constants/helpers";
import { AiOutlineEye } from 'react-icons/ai'

const useStyles = makeStyles((theme) => ({
    header: {
        background: "#163340",
        textAlign: "center",
        padding: "10px",
        color: "white",
        boxShadow: "1px 4px 5px #7c7979",
    },
    logo: {
        width: "140px",
    },
    brandLogo: {
        height: "45px",
        borderRadius: "3px",
    },
    footer: {
        position: "fixed",
        bottom: "7px",
        background: "#ecfcef",
        width: "100%",
        padding: "10px",
        display: "flex",
        alignItems: "center",
    },
    gridContent: {
        height: "calc(100vh - 24vh)",
        width: "100%",
        marginTop: "10px",
        overflow: "auto"
    }
}));

const QuoteApproval = () => {
    let location = useLocation().search;
    const toastConfig = useContext(CustomToastContext);

    const classes = useStyles();
    const { id } = useParams();
    const [replied, setReplied] = useState(false);
    const [validQuote, setValidQuote] = useState(true);
    const [columns, setColumns] = useState([]);
    const [logo, setLogo] = useState(null);
    const [rows, setRows] = useState([]);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [currency, setCurrency] = useState("");
    const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
    const [quoteStatusChangeData, setQuoteStatusChangeData] = useState("");
    const [showSignatureDialog, setShowSignatureDialog] = useState(false);
    const [quoteData, setQuoteData] = useState(null);
    const [brandData, setBrandData] = useState(null);
    const [versionDetails, setVersionDetails] = useState(null);
    const [pdfFileBase64, setPdfFileBase64] = useState(null);
    const [totalsale, setTotalSale] = useState({
        shortFormatAmount: "",
        fullFormatAmount: "",
        fullFormatAmountWithCurrencyName: "",
    });
    const [generatingPdf, setGeneratingPdf] = useState({
        show: false,
        text: null,
    });

    useEffect(() => {
        // getCompanyDetails();
        fetchQuote();
    }, []);

    //to fetch Quote Data from QuoteID 
    const fetchQuote = () => {

        axios.get(backendApi + "/quote-builder/getQuotefromId/" + id + location)
            .then(({ data }) => {
                const newColumn = data.Columns.map((obj) => ({ ...obj, width: 200 }))
                if (data.Quote_Status === "Sent to Customer") {
                    setLogo(data.logo);
                    setColumns(newColumn);
                    setRows(data.Rows);
                    setSellingPrice(data.TotalSellingPriceamount);
                    setCurrency(data.TotalSellingPricecurr);

                    setQuoteData(data.quoteDetail);
                    setBrandData(data.brand);
                    setVersionDetails(data.versionDetails);
                    setTotalSale(formatAmountWithCurrency(data.TotalSellingPricecurr, data.TotalSellingPriceamount)
                    );
                }
                else if (data.Quote_Status === "Accepted by Customer" || data.Quote_Status === "Rejected by Customer") {
                    setReplied(true);
                }
                else {
                    setValidQuote(false);
                }
            })
            .catch((err) => {
                console.log(err);
                setValidQuote(false);
            });
    }

    const QuoteStatusChange = (accepted, signedDocumentUrl, comment) => {
        let body;
        if (accepted !== "Rejected") {
            body = { status: "Accepted by Customer", signedDocument: signedDocumentUrl }
        }
        else {
            body = { status: "Rejected by Customer", comment: comment }
        }
        axios.post(backendApi + "/quote-builder/updateStatusfromCustomer/" + id + location, body)
            .then(({ data }) => {
                setReplied(true);
                setShowQuoteStatusChangeDialog(false)
                setShowSignatureDialog(false);
            })
            .catch((err) => {
                console.log(err);
                setShowQuoteStatusChangeDialog(false)
                setShowSignatureDialog(false);
            });
    };


    const generateBase64forFile = (blobData, type) => {
        let reader = new FileReader();
        reader.readAsDataURL(blobData);
        reader.onloadend = function () {
            let base64data = reader.result;
            if (type === "pdf") {
                setPdfFileBase64(base64data);
            }
        };
    };

    const generatePdf = (view, send, signatureData = null) => {
        const PdfDoc = new jsPDF("p", "pt", "a4");

        const pagewidth = PdfDoc.internal.pageSize.width;

        if (logo !== null) {
            PdfDoc.addImage(logo, "JPEG", pagewidth - 65, 10, 40, 40);
        }
        PdfDoc.setFontSize(26);
        PdfDoc.text(brandData.name, 20, 30);
        PdfDoc.setFontSize(12);
        PdfDoc.text(brandData.address, 20, 50);
        PdfDoc.setLineWidth(3);
        PdfDoc.line(15, 70, 260, 70);
        PdfDoc.line(330, 70, 580, 70);
        PdfDoc.setFontSize(14);
        PdfDoc.text("Quotation", 265, 75);
        var PDFData = [];
        var PdfCol = ["S. No."];
        var serialNumber = 1;

        rows.forEach((dataEntry) => {
            var PdfRow = [serialNumber];
            // var ExcelRow = {};
            columns.map(m => m.field).forEach((ColName) => {
                // if (defaultSelectColumns.indexOf(ColName) !== -1) {
                if (PdfCol.indexOf(ColName) == -1) {
                    PdfCol.push(ColName);
                }
                PdfRow.push(dataEntry[ColName]);
                // }

                // if (visibleColumns.indexOf(ColName) !== -1) {
                //     if (excelheaderName.indexOf(ColName !== -1)) {
                //         excelheaderName.push(ColName);
                //         excelHeader.push({
                //             header: ColName,
                //             key: ColName.replace(" ", ""),
                //         });
                //     }
                //     ExcelRow[ColName.replace(" ", "")] = dataEntry[ColName];
                // }
            });
            PDFData.push(PdfRow);
            // excelData.push(ExcelRow);
            serialNumber = serialNumber + 1;
        });

        PdfDoc.setFontSize(10);
        PdfDoc.text(`Quote Id: ${id}`, 285, 100);
        PdfDoc.text(`Currency: ${quoteData.currency}`, 285, 115);
        PdfDoc.text(`Date: ${displayDate(versionDetails.quoteDate)}`, 285, 130);
        PdfDoc.text(
            `Quote Expiry Date: ${displayDate(quoteData.expiryDate)}`,
            285,
            145
        );
        PdfDoc.text(`Inco Terms: ${quoteData.incoTerms}`, 285, 160);
        PdfDoc.setFontSize(8);
        PdfDoc.text("Bill To:", 20, 100);
        PdfDoc.setFontSize(12);
        PdfDoc.text(quoteData.customerAccountName, 20, 115);

        var text = "Please find the quotation below:";
        var lineHeight = PdfDoc.getLineHeight();
        var splittedText = PdfDoc.splitTextToSize(text, 50);
        PdfDoc.text(text, 20, 200);
        var lines = splittedText.length;
        var blockHeight = lines * lineHeight;
        PDFData = [
            ...PDFData,
            [
                {
                    content: `Quote Total: ${totalsale.fullFormatAmountWithCurrencyName}`,
                    colSpan: PDFData && PDFData.length > 0 ? PDFData[0].length : 1,
                    styles: { halign: "right", valign: "middle" },
                },
            ],
        ];

        autoTable(PdfDoc, {
            margin: { top: 150 + blockHeight, left: 20, right: 20 },
            head: [PdfCol],
            body: PDFData,
            styles: { halign: "center", cellWidth: "auto", overflow: "linebreak" },
            theme: "grid",
        });
        let finalY = (PdfDoc as any).lastAutoTable.finalY;

        if (versionDetails.TNC.length) {
            PdfDoc.setDrawColor(0, 0, 0);
            PdfDoc.setFontSize(14);
            PdfDoc.setLineWidth(3);
            PdfDoc.line(15, finalY + 20, 580, finalY + 20);

            let finalmarkup = "";

            versionDetails.TNC.forEach((selectTNC) => {
                finalmarkup =
                    finalmarkup + `<h3><strong>${selectTNC.TACName}:</strong></h3>`;
                let state = convertFromRaw(JSON.parse(selectTNC.description));
                let TNC = EditorState.createWithContent(state);
                let markup = draftToHtml(convertToRaw(TNC.getCurrentContent()));

                finalmarkup = finalmarkup + markup + "<br>";
            });

            // finalmarkup = finalmarkup.replaceAll(" ", "&nbsp;");
            finalmarkup = finalmarkup.replaceAll("<p>", "<p style='overflow-wrap:break-word;word-wrap:break-word;'>");
            // finalmarkup = finalmarkup.replaceAll("</p>", "</p>");

            let signatureContent = "<br><br><span--style='font-size:10px;'>Note:</span><br>";
            signatureContent =
                signatureContent +
                `<span--style='font-size:10px;'>Thanks for your business</span><br><br>`;

            signatureContent =
                signatureContent +
                `<span--style='font-size:10px'>Customer Signature</span><br><br>`;

            if (signatureData) {
                signatureContent =
                    signatureContent + `<img--src='${signatureData}' height='30px' width='30px' />`
                signatureContent =
                    signatureContent + "<br>"
            } else {
                signatureContent = signatureContent + "<br><br>";
            }

            signatureContent =
                signatureContent +
                `<span--style='color:lightgrey'>_____________________________</span>`;

            signatureContent = signatureContent.replaceAll(" ", "&nbsp;");
            signatureContent = signatureContent.replaceAll("--", " ");
            signatureContent = signatureContent.replaceAll("<img--src", "<img src");

            finalmarkup = finalmarkup + signatureContent;

            PdfDoc.html(`<div style='width:520px;'>${finalmarkup}</div>`, {
                callback: function (doc) {
                    if (view) {
                        doc.setProperties({
                            title: `Quotation-${quoteData?.name}-v${quoteData.version}`,
                        });
                        const pdfBlobFile = doc.output("blob");
                        generateBase64forFile(pdfBlobFile, "pdf");

                        window.open(URL.createObjectURL(pdfBlobFile));
                        setGeneratingPdf({ show: false, text: null })
                    }
                    if (send) {
                        let PDFtoAPIData = doc.output("blob");

                        const formdata = new FormData();
                        formdata.append("file", PDFtoAPIData, versionDetails.PDF);
                        axios.post(backendApi + "/user/upload-public/", formdata, {
                                headers: {
                                    "content-type": "multipart/form-data",
                                },
                            })
                            .then(({ data }) => {
                                QuoteStatusChange(true, data.fileUrl, null);
                                // setPdf(data.fieldName);
                                // handleVersionUpdate(data.fileName, visibleColumns, "", TandC);
                            })
                            // .catch((err) => {
                            //     toastConfig.setToastConfig(err);
                            // });
                            setGeneratingPdf({ show: false, text: null })
                    }
                },
                x: 20,
                y: finalY + 50,
                margin: [20, 10, 20, 10],
            });
        } else {
            finalY = finalY + 40;
            PdfDoc.setFontSize(10);
            PdfDoc.text("Note:", 20, finalY);

            finalY = finalY + 15;
            PdfDoc.text("Thanks for your business", 20, finalY);

            finalY = finalY + 50;
            PdfDoc.text("Customer Signature", 20, finalY);

            finalY = finalY + 30;
            if (signatureData) {
                PdfDoc.addImage(signatureData, 'PNG', 40, finalY, 100, 100);
                finalY = finalY + 80;
            }

            finalY = finalY + 30;
            PdfDoc.line(15, finalY, 260, finalY);

            if (view) {
                PdfDoc.setProperties({
                    title: `Quotation-${quoteData?.name}-v${quoteData.version}`,
                });
                const pdfBlobFile = PdfDoc.output("blob");
                generateBase64forFile(pdfBlobFile, "pdf");

                window.open(URL.createObjectURL(pdfBlobFile));
                setGeneratingPdf({ show: false, text: null })
            }
            if (send) {
                let PDFtoAPIData = PdfDoc.output("blob");
                generateBase64forFile(PDFtoAPIData, "pdf");
                const formdata = new FormData();
                formdata.append("file", PDFtoAPIData, versionDetails.PDF);

                axios.post(backendApi + "/user/upload-public/", formdata, {
                    headers: {
                        "content-type": "multipart/form-data",
                    },
                })
                .then(({ data }) => {
                    QuoteStatusChange(true, data.fileUrl, null);
                    // setPdf(data.fieldName);
                    // handleVersionUpdate(data.fileName, visibleColumns, "", TandC);
                });

                setGeneratingPdf({ show: false, text: null })
                // .catch((err) => {
                //     toastConfig.setToastConfig(err);
                // });
            }
        }
    };

    return (
        <div>
            {validQuote ?
                (<div>
                    {replied ? (
                        <Grid container className={classes.header}>
                            <Grid item xs={12} md={1} sm={2}>
                                <img
                                    className={classes.logo}
                                    src="https://equip-t.com/wp-content/uploads/2021/05/cropped-eQuip-T-logo-green-tech.png"
                                    alt="equip logo"
                                    title="eQuipt Logo"
                                />
                            </Grid>
                            <Grid item xs={6} md={9} sm={8} className="d-flex align-items-center justify-content-center">
                                <h1>Thanks, Response for the Quote has been sent.</h1>
                            </Grid>
                            <Grid item xs={6} md={2} sm={2}>
                                {logo && (
                                    <img
                                        src={logo}
                                        alt="brand"
                                        className={classes.brandLogo}
                                    />)}
                            </Grid>
                        </Grid>
                    ) : (
                        <div>
                            <Grid container className={classes.header}>
                                <Grid item xs={12} md={1} sm={2}>
                                    <img
                                        className={classes.logo}
                                        src="https://equip-t.com/wp-content/uploads/2021/05/cropped-eQuip-T-logo-green-tech.png"
                                        alt="equip logo"
                                        title="eQuipt Logo"
                                    />
                                </Grid>
                                <Grid item xs={6} md={9} sm={8} className="d-flex align-items-center justify-content-center">
                                    <h1>Approve Quote: {quoteData?.name}</h1>
                                </Grid>
                                <Grid item xs={6} md={2} sm={2} className="pull-right">
                                    {logo && (
                                        <img
                                            src={logo}
                                            alt="brand"
                                            className={classes.brandLogo}
                                        />)}
                                </Grid>
                            </Grid>

                            <div className="mt-2 mx-4">
                                <Grid container alignItems="center">
                                    <Grid item xs={12} md={4} sm={4}>
                                        <h2>Total : {sellingPrice} {currency}</h2>
                                    </Grid>
                                    <Grid item xs={12} md={8} sm={8} className="centerItem d-flex" justify="flex-end">
                                        <Button variant="contained" disabled={generatingPdf.show === true} className="mr-1" startIcon={<AiOutlineEye />} color="primary" onClick={() => {
                                            setGeneratingPdf({ show: true, text: "Generating..." })
                                            generatePdf(true, false)
                                        }
                                        }>
                                            {generatingPdf.show === true ? "Generating..." : "View"}
                                        </Button>
                                        <Button variant="contained" className="mr-1" startIcon={<GoThumbsup />} color="primary" onClick={() => setShowSignatureDialog(true)}>
                                            Accept
                                        </Button>
                                        <Button variant="contained" startIcon={<GoThumbsdown />} color="secondary" onClick={() => {
                                            setQuoteStatusChangeData("Rejected")
                                            setShowQuoteStatusChangeDialog(true)
                                        }} >
                                            Reject
                                        </Button>
                                    </Grid>
                                </Grid>
                            </div>

                            <div className={classes.gridContent}>
                                <DataGrid
                                    columns={columns}
                                    rows={rows}
                                    getRowId={(row) => row.id} />
                            </div>

                        </div>)}
                </div>
                ) : (
                    <div>
                        <h1>Invalid URL, Please check the URL</h1>
                    </div>
                )}
            {
                showQuoteStatusChangeDialog && (
                    <DOAReasonDialog
                        reasonDialogOpen={showQuoteStatusChangeDialog}
                        handleCloseDialog={() => setShowQuoteStatusChangeDialog(false)}
                        QuoteStatusChange={QuoteStatusChange}
                        accepted={quoteStatusChangeData}
                    />
                )
            }

            {
                showSignatureDialog && <SignatureDialog open={showSignatureDialog} onSigned={(imageData) => {
                    // QuoteStatusChange("Accepted", imageData, "");
                    generatePdf(false, true, imageData);
                    // setShowSignatureDialog(false);
                }} onClose={() => { setShowSignatureDialog(false) }} />
            }
        </div >
    );

}

export default QuoteApproval;