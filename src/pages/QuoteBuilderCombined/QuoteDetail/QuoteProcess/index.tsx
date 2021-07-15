import { Button, CircularProgress, Grid, Paper, makeStyles, FormControl, Checkbox, TextField, IconButton, Tooltip } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useMemo, useState } from "react";
import { useContext } from "react";
import { AiFillPlusCircle, AiOutlineEye } from "react-icons/ai";
import { BiLayerPlus, BiMailSend } from "react-icons/bi";
import { FiDownloadCloud } from "react-icons/fi";
import { GiVintageRobot } from "react-icons/gi";
import { HiPencil } from "react-icons/hi";
import axiosInstance from "../../../../axios/axiosInstance";
import Loader from "../../../../components/Loader";
import ProductBuilder from "../../../../components/productBuilder";
import { currencyCodeToSymbol, formatAmountWithCurrency, quoteBuilder } from "../../../../constants/helpers";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";
import ProductGrid from "./ProductGrid";
import Steps from "./Steps";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import AdditionalData from "./AdditionalData";

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        paddingRight: "15px",
    },
    chips: {
        display: "flex",
        flexWrap: "wrap",
    },
    chip: {
        margin: 2,
    },
    noLabel: {
        marginTop: theme.spacing(3),
    },
    bgProduct: {
        background: "#f5f5f5 !important",
        padding: "10px",
        paddingBottom: "0",
        border: "1px solid #163340",
        borderBottom: "none",
        boxShadow: "none",
        borderRadius: "0",
    },
    productInformation: {
        background: "white",
        padding: "9px",
        borderRadius: "3px",
        border: "1px solid #163340",
    },
    termsBtn: {
        position: "absolute",
        top: "-16px",
        right: "0",
    },
    detailBox: {
        border: "1px solid #163340",
    },
    btnHeader: {
        position: "absolute",
        top: "4px",
        right: "20px",
    },
    productPos: {
        position: "absolute",
        top: "1px",
        left: "6px",
        [theme.breakpoints.down("xs")]: {
            position: "static",
            display: "flex",
            alignItems: "center"
        },
    }
}));

var defaultSelectColumns = [
    "Product Name",
    "Description",
    "Unit",
    "Qty",
    "Sales Price Per Unit",
    "Total Sales Price",
];

const DOASteps = [
    "New",
    "Price Builder",
    "Quote Builder",
    "DOA Process",
    "Send To Customer",
    "End",
];
const OtherSteps = [
    "New",
    "Price Builder",
    "Quote Builder",
    "Send To Customer",
    "End",
];
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function QuoteProcess({ quoteData, ProcessStatus, allowedToEdit, ifQuoteApproved, currentVersion, handleChangeVersion, productBuilderId, versionStatus, fetchQuoteData, quotePermissions, handleOpenUpdateDialog }) {

    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const { qbResource, qbApi } = quoteBuilder;

    const [nextStep, setNextStep] = useState(true);
    const [options, setOptions] = useState([]);
    const [redCard, setRedCard] = useState(false);
    const [totalProfit, setTotalProfit] = useState({
        shortFormatAmount: "",
        fullFormatAmount: "",
        fullFormatAmountWithCurrencyName: "",
    });
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalcost, setTotalCost] = useState({
        shortFormatAmount: "",
        fullFormatAmount: "",
        fullFormatAmountWithCurrencyName: "",
    });
    const [totalsale, setTotalSale] = useState({
        shortFormatAmount: "",
        fullFormatAmount: "",
        fullFormatAmountWithCurrencyName: "",
    });
    const [totalmargin, setTotalMargin] = useState({
        shortFormatAmount: "",
        fullFormatAmount: "",
        fullFormatAmountWithCurrencyName: "",
    });

    const [buttonMessage, setButtonMessage] = useState("Send to Customer");
    const [DOAreq, setDOAreq] = useState(false);
    const [DOAneeded, setDOAneeded] = useState(false);
    const [Customerreq, setCustomerreq] = useState(true);
    const [DOAData, setDOAData] = useState(null);
    const [DOAlimit, setDOALimit] = useState(0);
    const [DOAmaxLimit, setDOAMaxLimit] = useState(0);
    const [DOAsetup, setDOAsetup] = useState(false);
    const [visibleColumns, setVisibleColumnName] = useState([]);
    const [ColumnName, setColName] = useState([]);
    const [columnView, setColumnView] = useState([]);
    const [dynamicTableData, setDynamicTableData] = useState([]);
    const [deletingDOA, setDeletingDOA] = useState(false);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [isCloning, setCloning] = useState(false);
    const [isRearrangeColumns, setRearrangeColumns] = useState(false);
    const [isAddNewProduct, setIsAddNewProduct] = useState(false);
    const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
    const [updatingVersion, setUpdatingVersion] = useState(false);
    const [pdfFileName, setPdfFileName] = useState("");
    const [PDF, setPdf] = useState("");
    const [loading, setLoading] = useState(false);
    const [pdfFileBase64, setPdfFileBase64] = useState(null);
    const [excelFileBase64, setExcelFileBase64] = useState(null);
    const [generatingPdfFile, setGeneratingFile] = useState(false);
    const [sendEmail, setSendEmail] = useState(false);
    const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
    const [showAiDialog, setShowAiDialog] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(true);

    useEffect(() => {
        if (currentVersion !== 0) fetchDOAData();
      }, [currentVersion, DOAreq]);

      useEffect(() => {
        fetchDoaLimit();
      }, [quoteData]);  

      const fetchDOAData = () => {
        if (ProcessStatus === "DOA Process") {
          axiosInstance()
            .get(`doa-request/doaFlow/${quoteData._id}/${currentVersion}`)
            .then(({ data: { data } }) => {
              setDOAData(data.reverse());
            })
            .catch((err) => {
              setDOAData(null);
              // toastConfig.setToastConfig(err);
            });
        }
      };
    

    const defaultTotalValue = useMemo(() => {
        let result = "0";
        if (quoteData && quoteData?.currency) {
            result = `${currencyCodeToSymbol(quoteData.currency)} 0`;
        }
        return result;
    }, [quoteData]);


    const productCalculationForDoa = (BuilderData) => {

        const inventory: { fieldName: string; fieldValue: any }[][] = [];
        const ignoredKeys = [
            "fields",
            "_id",
            "productId",
            "templateFields",
            "id",
            "string",
            "srno",
        ];

        let totalCost = 0;
        let totalSellingPrice = 0;
        let totalMargin = 0;
        let totalProfit = 0;
        let CostCurrency = "";
        let SPCurrency = "";
        let MarginCurrency = "";
        let ProfitCurrency = "";

        BuilderData = BuilderData.map((data) => ({
            ...data,
            [`profitPercentPerUnit`]:
                data["profitPercentPerUnit"] === null ||
                    data["profitPercentPerUnit"] === undefined
                    ? 0
                    : data["profitPercentPerUnit"],
            [`commissionPercentPerUnit`]:
                data["commissionPercentPerUnit"] === null ||
                    data["commissionPercentPerUnit"] === undefined
                    ? 0
                    : data["commissionPercentPerUnit"],
            [`totalCostPerUnit_${quoteData.currency.toLowerCase()}`]:
                data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`] ===
                    null ||
                    data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`] ===
                    undefined
                    ? 0
                    : data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`],
        }));

        if (ProcessStatus === "Price Builder") {
            let hasPrice = false;
            BuilderData.forEach((data) => {
                if (
                    data[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] ||
                    data[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] !==
                    "undefined"
                ) {
                    hasPrice = true;
                } else {
                    hasPrice = false;
                }
            });
            const withZeroQty = BuilderData.filter((d) => d.qty === 0);
            let withZeroAmt = [];
            if (hasPrice) {
                withZeroAmt = BuilderData.filter(
                    (d) =>
                        d[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] === 0
                );
            }

            if (!withZeroAmt.length && hasPrice && !withZeroQty.length) {
                setNextStep(true);
            } else {
                setNextStep(false);
            }
        }
        BuilderData.forEach((quoteRows: { [x: string]: any }) => {
            const quoteRowKeys = Object.keys(quoteRows);

            let inventorydata: { fieldName: string; fieldValue: any }[] = [];

            quoteRowKeys.forEach((key) => {
                if (ignoredKeys.indexOf(key) === -1) {
                    let indexkey = key;
                    let currency = "";
                    if (key.includes("_")) {
                        let splitKey = key.split("_");
                        key = splitKey[0];
                        currency = splitKey[1].toUpperCase();
                    }
                    let fields = quoteRows["fields"];
                    let field = fields.filter(
                        (d: { fieldName: string }) => d.fieldName === key
                    );

                    if (typeof field[0] !== "undefined") {
                        if (typeof quoteRows[key] === "object") {
                            inventorydata.push({
                                fieldName: field[0].fieldLabel,
                                fieldValue: quoteRows[key] ? quoteRows[key][key] : null,
                            });
                        } else {
                            inventorydata.push({
                                fieldName: field[0].fieldLabel,
                                fieldValue:
                                    quoteRows[indexkey] === null ? 0 : quoteRows[indexkey],
                            });
                        }

                        if (currency === quoteData?.currency && key === "totalCost") {
                            totalCost = totalCost + quoteRows[indexkey];
                            CostCurrency = currency;
                        } else if (
                            currency === quoteData?.currency &&
                            key === "totalSalesPrice"
                        ) {
                            totalSellingPrice = totalSellingPrice + quoteRows[indexkey];
                            SPCurrency = currency;
                        } else if (
                            currency === quoteData?.currency &&
                            key === "totalProfit"
                        ) {
                            totalProfit = totalProfit + quoteRows[indexkey];
                            ProfitCurrency = currency;
                        } else if (
                            currency === quoteData?.currency &&
                            key === "totalMargin"
                        ) {
                            totalMargin = totalMargin + quoteRows[indexkey];
                            MarginCurrency = currency;
                        }
                    }
                }
            });

            inventory.push(inventorydata);
        });

        return {
            inventory: inventory,
            totalMargin: totalMargin,
            totalSellingPrice: totalSellingPrice,
            totalCost: totalCost,
            totalProfit: totalProfit
        };
    }

    const handleVersionUpdate = (
        PDFfile,
        Columns,
        versionStatus,
        view = false,
        download = false
    ) => {
        let body = {
            acceptedColumns: Columns,
            status: versionStatus,
        };

        setUpdatingVersion(true);
        axiosInstance()
            .post(`quote-builder/updateVersion/${quoteData._id}?version=${currentVersion}`, body)
            .then(({ data: { data } }) => {
                setUpdatingVersion(false);

                setPdfFileName(data.fileName)
                if (view && data.fileName) {
                    setUpdatingVersion(true);
                    axiosInstance()
                        .get(`user/download?fileName=${data.fileName}`, {
                            responseType: "blob",
                        })
                        .then(({ data }) => {
                            setUpdatingVersion(false);
                            const file = new Blob([data], { type: "application/pdf" });
                            const fileURL = URL.createObjectURL(file);
                            const pdfWindow = window.open();
                            pdfWindow.location.href = fileURL;
                        })
                        .catch((err) => {
                            setUpdatingVersion(true);
                        });
                } else if (download && data.fileName) {
                    setUpdatingVersion(true);
                    axiosInstance()
                        .get(`user/download?fileName=${data.fileName}`, {
                            responseType: "blob",
                        })
                        .then(({ data }) => {
                            setUpdatingVersion(false);
                            const url = window.URL.createObjectURL(
                                new Blob([data], { type: "application/pdf" })
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute(
                                "download",
                                `Quotation-${quoteData.quoteName}-v${currentVersion}.pdf`
                            );
                            document.body.appendChild(link);
                            link.click();
                        })
                        .catch((err) => {
                            setUpdatingVersion(true);
                        });
                }
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setUpdatingVersion(false);
            });
    };

    const exportToCSV = (send = false) => {
        const fileType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const fileExtension = ".xlsx";

        if (dynamicTableData.length) {
            let newTable = [];
            dynamicTableData.forEach((d, i) => {
                let obj = {};
                visibleColumns.forEach((col) => {
                    obj[col] = d[col] || "";
                });

                newTable.push(obj);
            });

            newTable.push({
                "Product Name": "Total:",
                "Total Sales Price": totalsale.fullFormatAmount,
            });

            const ws = XLSX.utils.json_to_sheet(newTable);
            const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
            const excelBuffer = XLSX.write(wb, {
                bookType: "xlsx",
                type: "array",
            });
            const data = new Blob([excelBuffer], { type: fileType });

            if (send) {
                generateBase64forFile(data, "excel");
            } else {
                FileSaver.saveAs(
                    data,
                    `Quotation - v${currentVersion}` + fileExtension
                );
            }
        }
    };

    const generateBase64forFile = (blobData, type) => {
        let reader = new FileReader();
        reader.readAsDataURL(blobData);
        reader.onloadend = function () {
            let base64data = reader.result;
            if (type === "pdf") {
                setPdfFileBase64(base64data);
            }

            if (type === "excel") {
                setExcelFileBase64(base64data);
            }
        };
    };


    const handleViewPdf = (view = false, download = false) => {

        if (!pdfFileName) {
            handleVersionUpdate(
                "",
                visibleColumns,
                versionStatus,
                view,
                download
            );
        }
        else {
            if (view) {
                setUpdatingVersion(true);
                axiosInstance()
                    .get(
                        `user/download?fileName=${pdfFileName}`,
                        {
                            responseType: "blob",
                        }
                    )
                    .then(({ data }) => {
                        setUpdatingVersion(false);
                        const file = new Blob([data], { type: "application/pdf" });
                        const fileURL = URL.createObjectURL(file);
                        const pdfWindow = window.open();
                        pdfWindow.location.href = fileURL;
                    })
                    .catch((err) => {
                        setUpdatingVersion(true);
                    });
            } else if (download) {
                setUpdatingVersion(true);
                axiosInstance()
                    .get(
                        `user/download?fileName=${pdfFileName}`,
                        {
                            responseType: "blob",
                        }
                    )
                    .then(({ data }) => {
                        setUpdatingVersion(false);
                        const url = window.URL.createObjectURL(
                            new Blob([data], { type: "application/pdf" })
                        );
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute(
                            "download",
                            `Quotation-${quoteData.quoteName}-v${currentVersion}.pdf`
                        );
                        document.body.appendChild(link);
                        link.click();
                    })
                    .catch((err) => {
                        setUpdatingVersion(true);
                    });
            }
        }

    };


    const refreshProducts = (data) => {
        fetchDoaLimit();

        if (ProcessStatus === "New" && data.length === 0) {
            setNextStep(false);
        }
        if (ProcessStatus === "New" && data.length > 0) {
            setNextStep(true);
        }
        if (ProcessStatus === "Price Builder" && data.length === 0) {
            axiosInstance()
                .post(`quote-builder/updateprocess/${quoteData._id}?version=${currentVersion}`, {
                    processStatus: "New",
                })
                .then(({ data }) => {
                    fetchQuoteData(currentVersion);
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
        productBuilderdatatoQuoteBuilderdata(data);
    };

    const fetchDoaLimit = () => {
        if (quoteData) {
            axiosInstance()
                .post("doa-request/limit", { user: quoteData?.createdBy?.user?._id })
                .then(({ data: { data } }) => {
                    setDOAsetup(data.doasetup);
                    setDOALimit(data.limit ? data.limit : 0);
                    setDOAMaxLimit(data.maxLimit.limit ? data.maxLimit.limit : 0);
                    // setLastUser(data.lastUser);
                })
                .catch((err) => {
                    // toastConfig.setToastConfig(err);
                });
        }
    };

    const productBuilderdatatoQuoteBuilderdata = (BuilderData) => {
        if (BuilderData.length) {
            setOptions([]);
            setRedCard(false);
            let optionstoSet = [];
            const { inventory, totalMargin, totalSellingPrice, totalCost, totalProfit } = productCalculationForDoa(BuilderData);
            setTotalProfit(formatAmountWithCurrency(quoteData.currency, totalProfit));
            setTotalMargin(formatAmountWithCurrency(quoteData.currency, totalMargin));
            setTotalSale(
                formatAmountWithCurrency(quoteData.currency, totalSellingPrice)
            );
            setTotalPrice(totalCost);
            setTotalCost(formatAmountWithCurrency(quoteData.currency, totalCost));
            if (totalSellingPrice < totalCost) {
                setRedCard(true);
            }
            setButtonMessage("Send to Customer");
            setDOAreq(false);
            setCustomerreq(true);
            if (DOAsetup && totalSellingPrice > DOAlimit) {
                setDOAneeded(true);
            } else {
                setDOAneeded(false);
            }
            if (
                DOAsetup &&
                totalSellingPrice > DOAlimit &&
                versionStatus === "Building Quote"
            ) {
                setDOAreq(true);
                setCustomerreq(false);
                setButtonMessage("Send for DOA");
            } else if (versionStatus.includes("Rejected by DOA")) {
                setDOAreq(true);
                setCustomerreq(false);
                setButtonMessage("Re-Send for DOA");
            } else if (versionStatus === "Sent for DOA") {
                setDOAreq(false);
                setCustomerreq(false);
            } else if (
                versionStatus === "Sent to Customer" ||
                versionStatus === "Accepted by Customer" ||
                versionStatus === "Rejected by Customer" ||
                versionStatus === "Not Booked by Customer" ||
                versionStatus === "Invalid by Customer" ||
                versionStatus === "Booked by Customer"
            ) {
                setDOAreq(false);
                setCustomerreq(false);
            }

            const ColName = inventory[0].map((col) =>
                col.fieldName === "Productname" ? "Product Name" : col.fieldName
            );
            const allData: any = [];
            inventory.forEach((col) => {
                let obj: { [key: string]: string | number } = {};

                col.forEach((_col) => {
                    obj[
                        _col.fieldName === "Productname" ? "Product Name" : _col.fieldName
                    ] = _col.fieldValue || "";
                });

                allData.push(obj);
            });

            setColName(ColName);
            setOptions(optionstoSet);
            if (columnView.length > 0) {
                setVisibleColumnName(columnView);
            } else {
                setVisibleColumnName(defaultSelectColumns);
            }
            setDynamicTableData(allData);
        }
    };

    const cloneVersion = () => {
        let selectedRecords = []
        setCloning(true);
        axiosInstance()
            .post(
                `/quote-builder/createVersion/${quoteData._id}?version=${currentVersion}`,
                selectedRecords
            )
            .then(({ data: { data } }) => {
                fetchQuoteData(0);
                setCloning(false);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setCloning(false);
            });
    };


    const deleteVersion = () => {
        let versions = quoteData?.versions;

        delete versions[currentVersion];

        setDeletingDOA(true);
        axiosInstance()
            .delete(`${qbApi}/${quoteData._id}/${currentVersion}`)
            .then(() => {
                setDeletingDOA(false);
                fetchQuoteData(0);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setDeletingDOA(false);
            });
    };

    const handleSendReminder = () => {
        if (quoteData && currentVersion) {
            setReminderLoading(true);
            axiosInstance()
                .get(`quote-builder/reminder/${quoteData._id}/${currentVersion}`)
                .then((data: { data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: "Reminder Sent",
                    });
                    setReminderLoading(false);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setReminderLoading(false);
                });
        }
    };
    let isHideReminder = false;
    if (
        quoteData?.versions &&
        quoteData.versions[currentVersion] &&
        quoteData.versions[currentVersion]?.adobeAgreementStatus === "SIGNED"
    ) {
        isHideReminder = true;
    }

    const handleCases = () => {
        if (DOAreq) {
            axiosInstance()
                .post(`/doa-request/create/${quoteData._id}?version=${currentVersion}`)
                .then(({ data }) => {
                    handleVersionUpdate(PDF, visibleColumns, "Sent for DOA",);
                    fetchQuoteData(currentVersion);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
        if (Customerreq) {
            exportToCSV(true);
            setSendEmail(true);
            if (!pdfFileBase64) {
                setGeneratingFile(true);
                axiosInstance()
                    .get(
                        `user/download?fileName=${pdfFileName}`,
                        {
                            responseType: "blob",
                        }
                    )
                    .then(({ data }) => {
                        setGeneratingFile(false);
                        const file = new Blob([data], { type: "application/pdf" });
                        generateBase64forFile(file, "pdf");
                    })
                    .catch((err) => {
                        setGeneratingFile(false);
                    });
            }
        }
    };


    return (
        <>
            <Paper className={classes.bgProduct}>
                <Grid
                    container
                    className="detailHeader d-flex align-items-center form-label-style mt-0 mb-0"
                >
                    {ProcessStatus === "New" ? null : (
                        <Grid
                            item
                            xs={12}
                            sm={7}
                            md={7}
                            className="quoteHeader"
                        >
                            <div
                                className={redCard ? "redQuoteBox" : "quoteBox"}
                            >
                                <span>Total Profit </span>
                                <span className="quoteAmount" title={totalProfit.fullFormatAmount} >
                                    {totalProfit.shortFormatAmount
                                        ? totalProfit.shortFormatAmount
                                        : defaultTotalValue}
                                </span>
                            </div>
                            <div className="quoteBox">
                                <span>Total Cost Price </span>
                                <span className="quoteAmount" title={totalcost.fullFormatAmount}  >
                                    {totalcost.shortFormatAmount
                                        ? totalcost.shortFormatAmount
                                        : defaultTotalValue}
                                </span>
                            </div>
                            {redCard ? (
                                <div className="redQuoteBox">
                                    <span>Total Selling Price </span>
                                    <span className="quoteAmount" title={totalsale.fullFormatAmount} >
                                        {totalsale.shortFormatAmount
                                            ? totalsale.shortFormatAmount
                                            : defaultTotalValue}
                                    </span>
                                </div>
                            ) : (
                                <div className="quoteBox">
                                    <span>Total Selling Price </span>
                                    <span className="quoteAmount" title={totalsale.fullFormatAmount}
                                    >
                                        {totalsale.shortFormatAmount
                                            ? totalsale.shortFormatAmount
                                            : defaultTotalValue}
                                    </span>
                                </div>
                            )}
                        </Grid>
                    )}
                    <Grid
                        item
                        xs={ProcessStatus === "New" ? 12 : 12}
                        sm={ProcessStatus === "New" ? 12 : 5}
                        md={ProcessStatus === "New" ? 12 : 5}
                        className="d-flex align-items-center justify-content-end"
                    >
                        {allowedToEdit && ifQuoteApproved.approved ? (
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<HiPencil />}
                                onClick={handleOpenUpdateDialog}
                            >
                                Edit Information
                            </Button>
                        ) : null}
                        <select
                            className="customSelect mx-1"
                            value={currentVersion}
                            onChange={handleChangeVersion}
                        >
                            {Object.keys(quoteData.versions).map((team) => (
                                <option key={team} value={team}>
                                    {"Version : " + team}
                                </option>
                            ))}
                        </select>
                        {ifQuoteApproved.approved === false && (
                            <>
                                {currentVersion !== 1 && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        disabled={
                                            !allowedToEdit ||
                                            deletingDOA || loading || (DOAneeded
                                                ? DOASteps.indexOf(ProcessStatus) > 1
                                                : OtherSteps.indexOf(ProcessStatus) > 1)
                                        }
                                        onClick={deleteVersion}
                                    >
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    disabled={!allowedToEdit || isCloning || loading}
                                    variant="contained"
                                    type="button"
                                    size="small"
                                    startIcon={
                                        isCloning ? (
                                            <CircularProgress
                                                color="inherit"
                                                size={16}
                                            />
                                        ) : (
                                            <BiLayerPlus />
                                        )
                                    }
                                    className="mx-1"
                                    color="primary"
                                    onClick={() => {
                                        cloneVersion();
                                    }}
                                >
                                    {isCloning ? (
                                        <>Cloning v{currentVersion}</>
                                    ) : (
                                        `Clone ${currentVersion}`
                                    )}
                                </Button>{" "}
                            </>
                        )}
                    </Grid>
                </Grid>
                <div>
                    <Steps
                        steps={DOAneeded ? DOASteps : OtherSteps}
                        currentStep={DOAneeded ? DOASteps.indexOf(ProcessStatus) : OtherSteps.indexOf(ProcessStatus)}
                        id={quoteData._id}
                        version={currentVersion}
                        Refresh={fetchQuoteData}
                        nextStep={nextStep}
                        versionStatus={versionStatus}
                        loading={loading}
                        approvedQuote={ifQuoteApproved}
                        DOAlimit={DOAmaxLimit}
                        totalCost={totalPrice}
                        handleSendReminder={handleSendReminder}
                        reminderLoading={reminderLoading}
                        hideReminderButton={isHideReminder}
                        openInvoiceDialog={() => setOpenInvoiceDialog(true)}
                        allowedToEdit={allowedToEdit}
                        DOAData={DOAData}
                        handleVersionUpdate={() => {
                            handleVersionUpdate(
                                "",
                                visibleColumns,
                                versionStatus
                            );
                        }}
                    />
                </div>
            </Paper>
            <div className={`mt-0 subDetailModule ${classes.detailBox}`} >

                {!loading && quoteData ? (
                    <Grid container className="position-relative">
                        <Grid
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            className="d-flex align-items-center gap-1"
                        >
                            {!ifQuoteApproved.approved &&
                                ProcessStatus === "New" && allowedToEdit ? (
                                <span className={`${classes.productPos} m-2`}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        className="mr-1"
                                        startIcon={<AiFillPlusCircle />}
                                        color="primary"
                                        onClick={() => {
                                            setIsAddNewProduct(true);
                                        }}
                                    >
                                        New
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<BiLayerPlus />}
                                        color="primary"
                                        onClick={() => {
                                            setIsAddExistingProduct(true);
                                        }}
                                    >
                                        Add Existing
                                    </Button>
                                </span>
                            ) : null}

                            {ProcessStatus === "Quote Builder" ? (
                                <Grid
                                    container
                                    justify="space-between"
                                    alignItems="center"
                                >
                                    <Grid item xs={11} md={11} sm={11}>
                                        <FormControl
                                            fullWidth
                                            className={classes.formControl}
                                        >
                                            <Autocomplete
                                                id="demo-mutiple-chip"
                                                disabled={!allowedToEdit}
                                                fullWidth
                                                size="small"
                                                multiple
                                                value={visibleColumns}
                                                onChange={(e, val) => {
                                                    setVisibleColumnName(val);
                                                    handleVersionUpdate(
                                                        PDF,
                                                        val,
                                                        versionStatus
                                                    );
                                                }}
                                                options={ColumnName}
                                                disableCloseOnSelect
                                                getOptionLabel={(option) => option}
                                                renderOption={(option, { selected }) => (
                                                    <React.Fragment>
                                                        <Checkbox
                                                            icon={icon}
                                                            checkedIcon={checkedIcon}
                                                            style={{ marginRight: 8 }}
                                                            checked={selected}
                                                        />
                                                        {option}
                                                    </React.Fragment>
                                                )}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        label="Visible Columns in Quote"
                                                        placeholder="Select "
                                                    />
                                                )}
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={1} md={1} sm={1}>
                                        <IconButton
                                            disabled={!allowedToEdit}
                                            title="Re-arrange columns"
                                            color="inherit"
                                            onClick={() => setRearrangeColumns(true)}
                                        >
                                            <ImportExportIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ) : null}
                            {(ProcessStatus === "DOA Process" &&
                                versionStatus === "Building Quote") ||
                                (ProcessStatus === "Send To Customer" &&
                                    versionStatus !== "Sent to Customer") ? (
                                <div className="w-100 d-flex align-items-center justify-content-end doaAction">
                                    {!ifQuoteApproved.approved && (
                                        <Button
                                            onClick={() => handleCases()}
                                            disabled={
                                                !allowedToEdit || (!DOAreq && !Customerreq) || loading
                                            }
                                            startIcon={<BiMailSend />}
                                            variant="contained"
                                            size="small"
                                            color="primary"
                                        >
                                            {buttonMessage}
                                        </Button>
                                    )}
                                </div>
                            ) : null}
                        </Grid>
                        {ProcessStatus !== "New" &&
                            ProcessStatus !== "Price Builder" ? (
                            <span className="d-flex align-items-center justify-content-end mt-3 ml-3">
                                <Button
                                    onClick={() => {
                                        handleViewPdf(true, false);
                                    }}
                                    variant="outlined"
                                    disabled={updatingVersion}
                                    size="small"
                                    className="mr-1"
                                    startIcon={<AiOutlineEye />}
                                    color="primary"
                                >
                                    View
                                </Button>
                                <Button
                                    disabled={updatingVersion}
                                    onClick={() => {
                                        handleViewPdf(false, true);
                                        exportToCSV();
                                    }}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<FiDownloadCloud />}
                                    color="primary"
                                >
                                    Download
                                </Button>

                                <Tooltip title="AI Suggestion">
                                    <IconButton
                                        onClick={() => {
                                            setShowAiDialog(true);
                                        }}
                                    >
                                        <GiVintageRobot />
                                    </IconButton>
                                </Tooltip>
                            </span>
                        ) : null}
                        <Grid item xs={12} sm={12} md={12} className="mt-2">
                            {quoteData && !loading && productBuilderId ? (
                                ProcessStatus === "Quote Builder" &&
                                    visibleColumns.length > 0 ? (
                                    <ProductGrid
                                        productBuilderId={productBuilderId}
                                        refreshProducts={refreshProducts}
                                        stage={"cost"}
                                        isAll={false}
                                        columnsData={visibleColumns}
                                        currency={quoteData?.currency}
                                    />
                                ) : (
                                    <ProductBuilder
                                        fromQuote={true}
                                        permissions={quotePermissions}
                                        hasPermission={allowedToEdit}
                                        currency={quoteData?.currency.toLowerCase()}
                                        productBuilderId={productBuilderId}
                                        isAddNewProduct={isAddNewProduct}
                                        setIsAddNewProduct={setIsAddNewProduct}
                                        isAddExistingProduct={isAddExistingProduct}
                                        setIsAddExistingProduct={
                                            setIsAddExistingProduct
                                        }
                                        refreshProducts={refreshProducts}
                                        stage={
                                            ProcessStatus === "New" ? "product" : "cost"
                                        }
                                        isPriceBuilder={
                                            ProcessStatus === "Price Builder"
                                        }
                                        Editable={
                                            allowedToEdit && (ProcessStatus === "Price Builder" ||
                                                ProcessStatus === "New")
                                                ? true
                                                : false
                                        }
                                    />
                                )
                            ) : (
                                <Loader
                                    style={{ minHeight: 300 }}
                                    text="Loading..."
                                />
                            )}
                            {ProcessStatus === "Quote Builder" ? (
                               <AdditionalData
                               allowedToEdit={allowedToEdit}
                               />
                               ) : null}
                        </Grid>
                    </Grid>
                ) : null}
            </div>
        </>
    )
}
