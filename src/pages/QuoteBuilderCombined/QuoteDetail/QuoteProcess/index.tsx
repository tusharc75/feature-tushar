import { Button, CircularProgress, Grid, Paper, makeStyles, FormControl, Checkbox, TextField, IconButton, Tooltip, Dialog, Typography, Menu, MenuItem } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useMemo, useState } from "react";
import { useContext } from "react";
import { useHistory } from "react-router-dom";
import { AiFillEdit, AiFillPlusCircle, AiOutlineEye } from "react-icons/ai";
import { BiLayerPlus, BiMailSend } from "react-icons/bi";
import { FiDownloadCloud } from "react-icons/fi";
import { GiVintageRobot, GiProfit } from "react-icons/gi";
import { HiPencil } from "react-icons/hi";
import axiosInstance from "../../../../axios/axiosInstance";
import Loader from "../../../../components/Loader";
import ProductBuilder from "../../../../components/productBuilder";
import { currencyCodeToSymbol, CustomDialogTransition, customerAccount, customerContact, formatAmountWithCurrency, opportunity, quote, quoteBuilder, sidebarResource, supplierAccount } from "../../../../constants/helpers";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";
import Steps from "./Steps";
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import AdditionalData from "./AdditionalData";
import CustomDialogContent from "../../../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../../../components/CustomDialog/CustomDialogHeader";
import { isMobile, isTablet } from "react-device-detect";
import PerformanceTuningImg from "../../../../assets/PerformanceTuning.png";
import { CreateEmail } from "../../../../components/Activity/Email/CreateEmail";
import MessageDialog from "../../../../components/Helpers/MessageDialog";
import ColumnsDialog from "./ColumnsDialog";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useData } from "../../../../StateProvider/Provider";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import DOAReasonDialog from "../../../DOA/DOAReasonDialog";
import { camelCase, isEqual, startCase } from "lodash";
import { VscVersions } from "react-icons/vsc";
import { MdDelete } from "react-icons/md";

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
        padding: "5px 10px",
        paddingBottom: "0",
        border: "1px solid #163340",
        borderTop:"0px",
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


const DOASteps = [
    {
        key: "New",
        label: "Product Builder",
    },
    {
        key: "Price Builder",
        label: "Price Builder",
    },
    {
        key: "Quote Builder",
        label: "Quote Builder",
    },
    {
        key: "DOA Process",
        label: "DOA Process",
    },
    {
        key: "Send To Customer",
        label: "Send To Customer",
    },
    {
        key: "End",
        label: "End",
    },
];
const OtherSteps = [
    {
        key: "New",
        label: "Product Builder",
    },
    {
        key: "Price Builder",
        label: "Price Builder",
    },
    {
        key: "Quote Builder",
        label: "Quote Builder",
    },
    {
        key: "Send To Customer",
        label: "Send To Customer",
    },
    {
        key: "End",
        label: "End",
    },
];
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function QuoteProcess(props) {
    const {
        state,
        dispatch,
        quoteData,
        ProcessStatus,
        allowedToEdit,
        ifQuoteApproved,
        currentVersion,
        handleChangeVersion,
        productBuilderId,
        versionStatus,
        fetchQuoteData,
        columnView,
        handleOpenUpdateDialog,
        fetchTNC,
        handleVersionUpdate,
        updatingVersion,
        globalLoading
    } = props
    const defaultSelectColumns = [
        "Product Description",
        "Unit",
        "Qty",
        `Sales Price Per Unit ${quoteData?.currency}`,
        `Total Sales Price ${quoteData?.currency}`,
    ]
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const { qbResource, qbApi } = quoteBuilder;
    const {
        state: { user, permissions },
    }: any = useData();
    const history = useHistory();

    const [quoteCurrency] = useState(quoteData?.currency)
    const [nextStep, setNextStep] = useState(true);
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
    const [DOAApproved, setDOAApproved] = useState(false);
    const [DOARequestId, setDOARequestId] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState(defaultSelectColumns);
    const [ColumnName, setColName] = useState([]);
    const [dynamicTableData, setDynamicTableData] = useState([]);
    const [deletingDOA, setDeletingDOA] = useState(false);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [isCloning, setCloning] = useState(false);
    const [isRearrangeColumns, setRearrangeColumns] = useState(false);
    const [isAddNewProduct, setIsAddNewProduct] = useState(false);
    const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
    const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
    const [quoteStatusChangeData, setQuoteStatusChangeData] = useState("");
    const [approvedButtonText] = useState("Accept");
    const [loading, setLoading] = useState(false);
    const [pdfFileBase64, setPdfFileBase64] = useState(null);
    const [excelFileBase64, setExcelFileBase64] = useState(null);
    const [generatingPdfFile, setGeneratingFile] = useState(false);
    const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
    const [sendEmail, setSendEmail] = useState(false);
    const [showAiDialog, setShowAiDialog] = useState(false);
    const [viewDownloadLoading, setViewDownloadLoading] = useState(false);
    const [messageDialog, setMessageDialog] = useState({
        open: false,
        message: null,
    });
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    useEffect(() => {
        if (currentVersion !== 0) {
            fetchDOAData();
        }

    }, [currentVersion, DOAreq, DOAneeded]);

    useEffect(() => {
        dispatch({ type: "selection", selectedRecords: quoteData?.versions[currentVersion]?.TNC });

        axiosInstance()
            .get(`/doa-request`)
            .then(({ data: { data } }) => {
                let rows = data.map((doa) => ({
                    ...doa,
                    name: doa.DOAName,
                    quotedBy: doa.QuotedBy.firstName,
                    quoteById: doa.QuotedBy.id,
                    requestedBy: doa.RequestedBy.firstName,
                    requestedById: doa.RequestedBy.id,
                }));
                if (data.length !== 0) {
                    axiosInstance()
                        .get(`/doa-request/can-i-approve/${quoteData._id}/${currentVersion}`)
                        .then(({ data: { data } }) => {
                            setDOAApproved(data.canApprove)
                            setDOARequestId(data.requestId)
                        })
                        .catch((err) => {
                            // toastConfig.setToastConfig(err);
                        });
                }

            })
            .catch((error) => {
                //   toastConfig.setToastConfig(error);
            });
    }, [currentVersion])

    useEffect(() => {
        setVisibleColumns(columnView && columnView.length ? columnView : defaultSelectColumns)
    }, [columnView])

    useEffect(() => {
        fetchDoaLimit();
        fetchUserEmails();
        const tempProcessStatus = quoteData?.versions[currentVersion]?.processStatus;
        const tempOverallStatus = quoteData?.versions[currentVersion]?.status;

        if (tempProcessStatus === "DOA Process" && !tempOverallStatus.includes("Accepted") && DOAneeded) {
            setNextStep(false);
        }
        if (tempProcessStatus === "DOA Process" && tempOverallStatus.includes("Accepted") && DOAneeded) {
            setNextStep(true);
        }
        if (tempProcessStatus === "Customer Process") {
            setNextStep(false);
        }

    }, [quoteData]);

    useEffect(() => {
        if (DOAsetup) {
            axiosInstance()
                .get(`/productbuilder/getproduct/` + productBuilderId)
                .then(({ data: { data } }) => {
                    data = data.data?.product?.map((u, index) => ({
                        ...u,
                        id: u._id,
                        srno: index + 1,
                        // productTemplateDisplayValue: u.productTemplate?.optionLabel,
                        productCategoryDisplayValue: u.productCategory?.optionLabel,
                        priceTemplateDisplayValue: u.priceTemplate?.optionLabel,
                    }));
                    const { totalSellingPrice } = productCalculationForDoa(data);

                    if (DOAsetup && totalSellingPrice > DOAlimit) {
                        setDOAneeded(true);
                    } else {
                        setDOAneeded(false);
                    }
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
                })
        }
    }, [DOAsetup])

    const fetchDOAData = () => {
        if ((ProcessStatus === "DOA Process" && DOAneeded) || (versionStatus.includes("Rejected by DOA") && ProcessStatus === "End")) {
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

        // if (ProcessStatus === "Price Builder") {
        // let hasPrice = false;
        // BuilderData.forEach((data) => {
        //     if (
        //         data[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] ||
        //         data[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] !==
        //         "undefined"
        //     ) {
        //         hasPrice = true;
        //     } else {
        //         hasPrice = false;
        //     }
        // });
        // const withZeroQty = BuilderData.filter((d) => d.qty === 0);
        // let withZeroAmt = [];
        // if (hasPrice) {
        //     withZeroAmt = BuilderData.filter(
        //         (d) =>
        //             d[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] === 0
        //     );
        // }

        // if (!withZeroAmt.length && hasPrice && !withZeroQty.length) {
        //     setNextStep(true);
        // } else {
        //     setNextStep(false);
        // }
        // }
        let colName = [];
        let dynamicTable = [];
        let requiredValuesData = []

        const filterKeys = ["priceTemplate", "productTemplate", "productCategory", "productImage"]
        BuilderData.forEach((quoteRows: { [x: string]: any }, i) => {
            const quoteRowKeys = Object?.keys(quoteRows);
            let inventorydata: { fieldName: string; fieldValue: any }[] = [];
            // if (i === 0) console.log(quoteRows)
            // Making table columns and data for table
            quoteRowKeys.forEach((key) => {
                if (key === "fields") {
                    const labelsWithVal = {}
                    const requiredValues = {}
                    quoteRows[key].forEach((data, i) => {
                        // console.log(data)
                        if (!filterKeys.includes(data.fieldName)) {
                            const fieldLabel = data.fieldLabel;
                            const fieldName = data.fieldName;
                            const required = data.required
                            const labels = []

                            if (data.displayCurrency && data.units) {
                                data.displayCurrency.forEach((cur) => {
                                    if (data.units) {
                                        data.units.forEach(unit => {
                                            const casedLabel = `${fieldName}_${quoteCurrency.toLowerCase()}`
                                            if (required) {
                                                requiredValues[casedLabel] = quoteRows[casedLabel]
                                            }
                                            if (quoteRows[casedLabel]) {
                                                labels.push(`${fieldLabel} ${unit.toUpperCase()} ${cur}`)
                                                labelsWithVal[`${fieldLabel} ${unit.toUpperCase()} ${cur}`] = quoteRows[casedLabel]
                                            }
                                        })
                                    } else {
                                        const casedLabel = `${fieldName}_${cur.toLowerCase()}`
                                        if (required) {
                                            requiredValues[casedLabel] = quoteRows[casedLabel]
                                        }
                                        if (quoteRows[casedLabel]) {
                                            labels.push(`${fieldLabel} ${cur}`)
                                            labelsWithVal[`${fieldLabel} ${cur}`] = quoteRows[casedLabel]
                                        }
                                    }
                                })
                            } else if (data.units && !data.displayCurrency) {
                                data.units.forEach((unit) => {
                                    const casedLabel = `${fieldName}_${quoteCurrency.toLowerCase()}`
                                    if (required) {
                                        requiredValues[casedLabel] = quoteRows[casedLabel]
                                    }
                                    if (quoteRows[casedLabel]) {
                                        labels.push(`${fieldLabel} ${unit.toUpperCase()}`)
                                        labelsWithVal[`${fieldLabel} ${unit.toUpperCase()}`] = quoteRows[casedLabel]
                                    }
                                })

                            } else if (data.displayCurrency) {
                                data.displayCurrency.forEach((cur) => {
                                    const casedLabel = `${fieldName}_${cur.toLowerCase()}`
                                    if (required) {
                                        requiredValues[casedLabel] = quoteRows[casedLabel]
                                    }
                                    if (quoteRows[casedLabel]) {
                                        labels.push(`${fieldLabel} ${cur}`)
                                        labelsWithVal[`${fieldLabel} ${cur}`] = quoteRows[casedLabel]
                                    }

                                })
                            } else {
                                if (required) {
                                    requiredValues[fieldName] = quoteRows[fieldName]
                                }
                                if (quoteRows[fieldName]) {
                                    labels.push(fieldLabel)
                                    labelsWithVal[fieldLabel] = quoteRows[fieldName]
                                }
                            }

                            labels.forEach(d => {
                                if (!colName.includes(d)) {
                                    colName.push(d)
                                }
                            })
                            // if (data.required) {
                            //     (quoteRows[fieldName] && quoteRows[fieldName] !== "") || ((quoteRows[`${fieldName}_${data.displayCurrency.toLowerCase()}`] && quoteRows[`${fieldName}_${data.displayCurrency.toLowerCase()}`] !== "")) ? requiredFieldArray.push({ "key": quoteRows[fieldName], "value": true }) : requiredFieldArray.push({ "key": quoteRows[fieldName], "value": false }) //next button disable logic
                            // }
                        }
                    })

                    dynamicTable.push(labelsWithVal)
                    requiredValuesData.push(requiredValues)
                }

                const ungivenValues = requiredValuesData.length > 0 && requiredValuesData.filter((d) => {
                    const isEmpty = Object.entries(d).filter(([k, v]) => v === undefined || v === null || v === "")

                    return isEmpty.length > 0 ? true : false
                })

                if (DOASteps.findIndex(d => d?.key === ProcessStatus) === 1 || ProcessStatus === "Price Builder") {
                    if (ungivenValues && ungivenValues.length > 0) {
                        setNextStep(false)
                    } else {
                        setNextStep(true)
                    }
                }


                if (ignoredKeys.indexOf(key) === -1) {
                    let indexkey = key;
                    let currency = "";
                    if (key.includes("_")) {
                        let splitKey = key.split("_")
                        key = splitKey[0];
                        currency = splitKey[1].toUpperCase();
                    }
                    // let fields = quoteRows["fields"];
                    // let field = fields.filter(
                    //     (d: { fieldName: string }) => d.fieldName === key
                    // );

                    // if (typeof field[0] !== "undefined") {
                    //     // if (typeof quoteRows[key] === "object") {
                    //     //     inventorydata.push({
                    //     //         fieldName: field[0].fieldLabel,
                    //     //         fieldValue: quoteRows[key] ? quoteRows[key][key] : null,
                    //     //     });
                    //     // } else {
                    //     //     inventorydata.push({
                    //     //         fieldName: field[0].fieldLabel,
                    //     //         fieldValue:
                    //     //             quoteRows[indexkey] === null ? 0 : quoteRows[indexkey],
                    //     //     });
                    //     // }

                    if (currency === quoteData?.currency && key === "totalCost") {
                        totalCost = totalCost + quoteRows[indexkey];
                    } else if (
                        currency === quoteData?.currency &&
                        key === "totalSalesPrice"
                    ) {
                        totalSellingPrice = totalSellingPrice + quoteRows[indexkey];
                    } else if (
                        currency === quoteData?.currency &&
                        key === "totalProfit"
                    ) {
                        totalProfit = totalProfit + quoteRows[indexkey];
                    } else if (
                        currency === quoteData?.currency &&
                        key === "totalMargin"
                    ) {
                        totalMargin = totalMargin + quoteRows[indexkey];
                    }
                    // }
                }
            });

            inventory.push(inventorydata);
        });
        // requiredFieldArray.every(v => v.value === true) ? setNextStep(true) : setNextStep(false)
        setColName(colName)
        setDynamicTableData(dynamicTable);
        // console.log("*** TABLE ***: ", dynamicTable)
        return {
            inventory: inventory,
            totalMargin: totalMargin,
            totalSellingPrice: totalSellingPrice,
            totalCost: totalCost,
            totalProfit: totalProfit
        };
    }



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
                .then(() => {
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
            setRedCard(false);
            const { totalMargin, totalSellingPrice, totalCost, totalProfit } = productCalculationForDoa(BuilderData);
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
        }
    };

    const cloneVersion = () => {
        const previousVersionTNC = quoteData.versions[currentVersion]?.acceptedColumns
        setCloning(true);
        axiosInstance()
            .post(
                `/quote-builder/createVersion/${quoteData._id}?version=${currentVersion}`,
                { TNC: previousVersionTNC }
            )
            .then(() => {
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

            const res = newTable.reduce((result, item) => {
                const keys = Object?.keys(item);
                keys.forEach(key => {
                    if (!key.includes(quoteCurrency)) { return; }
                    result[key] = result[key]
                        ? result[key] + item[key]
                        : item[key];
                });
                return result;
            }, { ["Product Description"]: "Total" });

            Object?.keys(res).forEach(k => {
                if (k.includes(quoteCurrency)) {
                    res[k] = res[k] && res[k].toString().split(".")[1] !== undefined
                        && res[k].toString().split(".")[1].length > 4
                        ? parseFloat(res[k]).toFixed(4)
                        : res[k]
                }
            })


            newTable.push(res);

            const ws = utils.json_to_sheet(newTable);
            const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
            const excelBuffer = write(wb, {
                bookType: "xlsx",
                type: "array",
            });
            const data = new Blob([excelBuffer], { type: fileType });

            if (send) {
                generateBase64forFile(data, "excel");
            } else {
                saveAs(
                    data,
                    `Quotation - v${currentVersion}` + fileExtension
                );
            }
        }
    };

    const QuoteStatusChange = (accepted, signature, comment) => {
        if (DOARequestId) {
            if (accepted !== "Rejected") {

                axiosInstance()
                    .post("/doa-request/DOAResponse/" + DOARequestId, { response: "Accepted" })
                    .then(({ data }) => {
                        toastConfig.setToastConfig({
                            open: true,
                            type: "success",
                            message: data.message,
                        });
                        fetchQuoteData(currentVersion);
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setShowQuoteStatusChangeDialog(false)
                    });

            } else {
                axiosInstance()
                    .post("/doa-request/DOAResponse/" + DOARequestId, { response: "Rejected", comment: comment })
                    .then(({ data }) => {
                        toastConfig.setToastConfig({
                            open: true,
                            type: "success",
                            message: data.message,
                        });
                        fetchQuoteData(currentVersion);
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setShowQuoteStatusChangeDialog(false)
                    });
            }
        }

    };

    const handleViewPdf = (view = false, download = false) => {
        setViewDownloadLoading(true)
        let body = {
            acceptedColumns: visibleColumns,
            status: versionStatus,
            TNC: state.selectedRecords
        };
        axiosInstance()
            .post(`quote-builder/updateVersion/${quoteData._id}?version=${currentVersion}`, body)
            .then(() => {
                axiosInstance()
                    .post(`/quote-builder/generate-quote-pdf/${quoteData._id}/${currentVersion}`)
                    .then(({ data }) => {
                        if (view && data.data.fileName) {
                            axiosInstance()
                                .get(`user/download?fileName=${data.data.fileName}`, {
                                    responseType: "blob",
                                })
                                .then(({ data }) => {
                                    const file = new Blob([data], { type: "application/pdf" });
                                    const fileURL = URL.createObjectURL(file);
                                    const pdfWindow = window.open();
                                    pdfWindow.location.href = fileURL;
                                    setViewDownloadLoading(false)
                                })
                                .catch((err) => {
                                    setViewDownloadLoading(false)
                                    toastConfig.setToastConfig(err);
                                });
                        } else if (download && data.data.fileName) {
                            axiosInstance()
                                .get(`user/download?fileName=${data.data.fileName}`, {
                                    responseType: "blob",
                                })
                                .then(({ data }) => {
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
                                    setViewDownloadLoading(false)
                                })
                                .catch((err) => {
                                    toastConfig.setToastConfig(err);
                                    setViewDownloadLoading(false)
                                });
                        }
                        else {
                            setViewDownloadLoading(false)
                        }
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setViewDownloadLoading(false)
                    });
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setViewDownloadLoading(false)
            });

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
                    handleVersionUpdate(visibleColumns, "Sent for DOA", state?.selectedRecords);
                    fetchQuoteData(currentVersion);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
        if (Customerreq) {
            exportToCSV(true);
            if (!pdfFileBase64) {
                setGeneratingFile(true);
                setLoading(true)
                if (quoteData.versions[currentVersion].PDF) {
                    axiosInstance()
                        .get(
                            `user/download?fileName=${quoteData.versions[currentVersion].PDF}`,
                            {
                                responseType: "blob",
                            }
                        )
                        .then(({ data }) => {
                            setGeneratingFile(false);
                            const file = new Blob([data], { type: "application/pdf" });
                            generateBase64forFile(file, "pdf");
                            setSendEmail(true)
                            setLoading(false)
                        })
                        .catch((err) => {
                            toastConfig.setToastConfig({
                                open: true,
                                type: "error",
                                message: "PDF generating error",
                            });
                            setLoading(false)
                            setGeneratingFile(false);
                        });
                }
                else {
                    // let body = {
                    //     acceptedColumns: quoteData.versions[currentVersion].acceptedColumns,
                    //     status: quoteData.versions[currentVersion].status,
                    //     TNC: quoteData.versions[currentVersion].TNC
                    // };
                    // axiosInstance()
                    //     .post(`quote-builder/updateVersion/${quoteData._id}?version=${currentVersion}`, body)
                    //     .then(() => {
                    axiosInstance()
                        .post(`/quote-builder/generate-quote-pdf/${quoteData._id}/${currentVersion}`)
                        .then(({ data }) => {
                            axiosInstance().get(
                                `user/download?fileName=${data.data.fileName}`,
                                {
                                    responseType: "blob",
                                }
                            )
                                .then(({ data }) => {
                                    setGeneratingFile(false);
                                    const file = new Blob([data], { type: "application/pdf" });
                                    generateBase64forFile(file, "pdf");
                                    setSendEmail(true)
                                    setLoading(false)

                                })
                                .catch((err) => {
                                    toastConfig.setToastConfig({
                                        open: true,
                                        type: "error",
                                        message: "PDF generating error",
                                    });
                                    setLoading(false)
                                    setGeneratingFile(false);
                                });
                        })
                        .catch((err) => {
                            toastConfig.setToastConfig({
                                open: true,
                                type: "error",
                                message: "PDF generating error",
                            });
                            setLoading(false)
                            setGeneratingFile(false);
                        });
                    // })
                    // .catch((err) => {
                    //     setGeneratingFile(false);
                    // });
                }
            }
            else {
                setSendEmail(true)
            }
        }
    };

    const handleVersionUpdateFromAdditionalData = (additionalData) => {
        if (!isEqual(state.selectedRecords, additionalData)) {
            handleVersionUpdate(
                visibleColumns,
                versionStatus,
                additionalData
            );
        }

    }

    const onSendEmailSuccess = () => {
        setSendEmail(false);
        // handleVersionUpdate("", visibleColumns, "Sent to Customer", selectedRecords);
        handleAttachments();
        fetchQuoteData(currentVersion);
    };

    let attachments = [];
    if (pdfFileBase64) {
        attachments.push({
            base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(",") + 1)),
            contentType: pdfFileBase64.split(";")[0].split(":")[1],
            name: `Quotation-${quoteData.quoteName}-v${currentVersion}`,
        });
    }
    if (excelFileBase64) {
        attachments.push({
            base64: excelFileBase64.substring(
                parseInt(excelFileBase64.indexOf(",") + 1)
            ),
            contentType: excelFileBase64.split(";")[0].split(":")[1],
            name: `Quotation-${quoteData.quoteName}-v${currentVersion}`,
        });
    }

    const fetchUserEmails = () => {
        let ownerCollaboratorEmails = [];
        if (quoteData?.collaborator && quoteData.collaborator.length) {
            ownerCollaboratorEmails = quoteData.collaborator
                .filter((o) => o?.email)
                .map((o) => o?.email);
        }
        if (quoteData?.owner?.email) {
            ownerCollaboratorEmails.push(quoteData.owner.email);
        }
        let toEmails = [];
        if (
            quoteData?.customerContactName &&
            quoteData?.customerContactName.length
        ) {
            toEmails = quoteData?.customerContactName
                .filter((o) => o?.email)
                .map((o) => o.email);
            setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
        } else {
            axiosInstance()
                .get(
                    `/${customerAccount.accountApi}/related/${quoteData?.customerAccountName?.optionValue}`
                )
                .then(({ data: { data } }) => {
                    let relatedContacts =
                        data[sidebarResource[customerContact.contactResource]] &&
                            data[sidebarResource[customerContact.contactResource]][
                            "Account_Name"
                            ]
                            ? data[sidebarResource[customerContact.contactResource]][
                            "Account_Name"
                            ]
                            : [];
                    if (relatedContacts.length) {
                        toEmails = relatedContacts.map((o) => o?.email);
                    }
                    setUserEmails({
                        cc: [...ownerCollaboratorEmails],
                        to: [...toEmails],
                    });
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
    };

    const handleAttachments = () => {
        let request;

        request = {
            name: "Quotation V" + currentVersion,
            fileUrl: "",
            relatedTo: [
                {
                    type: quote.quoteResource,
                    referenceId: quoteData?._id,
                    access: true,
                },
                {
                    type: quoteData?.customerAccountName
                        ? customerAccount?.accountResource
                        : supplierAccount?.accountResource,
                    referenceId: quoteData?.customerAccountName
                        ? quoteData?.customerAccountName?.optionValue
                        : quoteData?.supplierAccountName?.optionValue,
                    access: false,
                },
                {
                    type: opportunity.opportunityResource,
                    referenceId: quoteData.opportunity?.optionValue,
                    access: false,
                },
            ],
        };

        // if (PDFAttachment !== "") {
        //   request.fileUrl = PDFAttachment;
        //   axiosInstance()
        //     .post(`/attachment`, request)
        //     .then(({ data }) => { })
        //     .catch((error) => {
        //       toastConfig.setToastConfig(error);
        //     });
        // }
    };


    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleChangeVersionInQuote = (event) => {
        handleChangeVersion(event);
        setAnchorEl(null);
    }

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
                            >   <div className={"quoteBoxContent"}>
                                <span className={"quoteBoxicon"}>
                                <GiProfit size={16}/>
                                </span>
                                <span className={"quoteDetailHeading"}>Total Profit </span>
                            </div>
                                <span className="quoteAmount" title={totalProfit.fullFormatAmount} >
                                    {totalProfit.fullFormatAmount
                                        ? totalProfit.fullFormatAmount
                                        : defaultTotalValue}
                                </span>

                            </div>
                            <div className="quoteBox">
                                <div className={"quoteBoxContent"}>
                                <span className={"quoteBoxicon"}>
                                <GiProfit size={16}/>
                                </span>
                                <span className={"quoteDetailHeading"}>Total Cost Price </span>
                                </div>
                                <span className="quoteAmount" title={totalcost.fullFormatAmount}  >
                                    {totalcost.fullFormatAmount
                                        ? totalcost.fullFormatAmount
                                        : defaultTotalValue}
                                </span>

                            </div>
                            {redCard ? (
                                <div className="redQuoteBox">
                                    <span>Total Selling Price </span>
                                    <span className="quoteAmount" title={totalsale.fullFormatAmount} >
                                        {totalsale.fullFormatAmount
                                            ? totalsale.fullFormatAmount
                                            : defaultTotalValue}
                                    </span>
                                </div>
                            ) : (
                                <div className="quoteBox">
                                    <div className={"quoteBoxContent"}>
                                <span className={"quoteBoxicon"}>
                                <GiProfit size={16}/>
                                </span>
                                    <span className={"quoteDetailHeading"}>Total Selling Price </span>
                                    </div>
                                    <span className="quoteAmount" title={totalsale.fullFormatAmount}
                                    >
                                        {totalsale.fullFormatAmount
                                            ? totalsale.fullFormatAmount
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
                        {DOAApproved && versionStatus === "Sent for DOA" && (
                            <>
                                <Button
                                    onClick={() => {
                                        QuoteStatusChange("Accepted", "", "")
                                    }}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ThumbUpIcon />}
                                    color="primary"
                                >
                                    {approvedButtonText}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setQuoteStatusChangeData("Rejected")
                                        setShowQuoteStatusChangeDialog(true)
                                    }}
                                    startIcon={<ThumbDownIcon />}
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                >
                                    Reject
                                </Button>
                            </>
                        )}
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
                        <div>
                            <Button
                                className="customSelect mx-1"
                                variant="text"
                                color="primary"
                                size="small"
                                aria-controls="simple-menu"
                                aria-haspopup="true"
                                style={{color:"var(--warning)"}}
                                onClick={handleClick}
                                startIcon={<VscVersions style={{paddingTop:"2px"}} size={18}/>}>

                                {`Version : ${currentVersion}`}

                            </Button>
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                {Object?.keys(quoteData.versions).map((versionNumber) => (
                                    <MenuItem onClick={handleChangeVersionInQuote} key={versionNumber} value={versionNumber}>
                                        {"Version : " + versionNumber}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </div>
                        {(
                            <>
                                {currentVersion !== 1 && ifQuoteApproved.approved === false && (
                                    <Button
                                        variant="text"
                                        size="small"
                                        style={{color:"var(--error)"}}
                                        disabled={
                                            !allowedToEdit ||
                                            deletingDOA || loading || (DOAneeded
                                                ? DOASteps.findIndex(d => d?.key === ProcessStatus) > 1
                                                : OtherSteps.findIndex(d => d?.key === ProcessStatus) > 1)
                                        }
                                        startIcon={<MdDelete size={16}/>}
                                        onClick={deleteVersion}
                                    >
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    disabled={!allowedToEdit || isCloning || loading || ifQuoteApproved.approved}
                                    variant="text"
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
                                    style={{color:"var(--success-light)"}}
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
                        currentStep={DOAneeded ? DOASteps.findIndex(d => d?.key === ProcessStatus) : ProcessStatus === "DOA Process" ? OtherSteps.findIndex(d => d?.key === "Quote Builder") : OtherSteps.findIndex(d => d?.key === ProcessStatus)}
                        id={quoteData._id}
                        version={currentVersion}
                        Refresh={fetchQuoteData}
                        nextStep={nextStep}
                        versionStatus={versionStatus}
                        loading={loading}
                        approvedQuote={ifQuoteApproved}
                        handleVersionUpdate={() => {
                            handleVersionUpdate(
                                visibleColumns,
                                versionStatus === "Sent for DOA" && !DOAneeded ? "Sent to Customer" : versionStatus,
                                state?.selectedRecords
                            );
                        }}
                        handleViewPdf={handleViewPdf}
                        allowedToEdit={allowedToEdit}
                        DOAData={DOAData}
                        quoteData={quoteData}
                        globalLoading={globalLoading}
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
                                        disabled={!permissions.product?.isCreate}
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
                                                    setVisibleColumns(val);
                                                    handleVersionUpdate(
                                                        val,
                                                        versionStatus,
                                                        state?.selectedRecords
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
                                versionStatus === "Building Quote" && DOAneeded) ||
                                (ProcessStatus === "Send To Customer" &&
                                    versionStatus !== "Sent to Customer") ? (
                                <div className="w-100 d-flex align-items-center justify-content-end doaAction">
                                    {!ifQuoteApproved.approved && (
                                        <Button
                                            onClick={() => {
                                                handleCases();
                                                fetchUserEmails()
                                            }}
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
                                    disabled={viewDownloadLoading || updatingVersion}
                                    size="small"
                                    className="mr-1"
                                    startIcon={<AiOutlineEye />}
                                    color="primary"
                                >
                                    View
                                </Button>
                                <Button
                                    disabled={viewDownloadLoading || updatingVersion}
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
                                {(permissions[qbResource]?.isUpdate && permissions?.quotePdfTemplate.isUpdate &&
                                    (user?.user?._id === quoteData?.owner?.optionValue || quoteData?.collaborator?.some(d => d === user?.user?._id)) &&
                                    (user?.user?._id === quoteData?.pDFTemplate?.owner || quoteData?.pDFTemplate?.collaborator?.some(d => d === user?.user?._id))) &&
                                    <Button
                                        onClick={() => {
                                            quoteData?.pDFTemplate.optionValue && history.push(`/quote-pdf-template/detail/${quoteData.pDFTemplate.optionValue}`, {
                                                quoteData: quoteData,
                                                version: currentVersion,
                                                redirectTo: `/quotes/detail/${quoteData._id}`
                                            })
                                        }}
                                        variant="outlined"
                                        size="small"
                                        className="mx-1"
                                        startIcon={<AiFillEdit />}
                                        color="primary"
                                    >
                                        Edit Template
                                    </Button>}
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
                                // ProcessStatus === "Quote Builder" &&
                                //     visibleColumns.length > 0 ? (
                                //     <ProductGrid
                                //         productBuilderId={productBuilderId}
                                //         refreshProducts={refreshProducts}
                                //         stage={"cost"}
                                //         isAll={true}
                                //         columnsData={visibleColumns}
                                //         currency={quoteData?.currency}
                                //     />

                                <ProductBuilder
                                    fromQuote={true}
                                    permissions={permissions[qbResource]}
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

                            ) : (
                                <Loader
                                    style={{ minHeight: 300 }}
                                    text="Loading..."
                                />
                            )}
                            {/* {ProcessStatus === "Quote Builder" && (
                                <AdditionalData
                                    fetchTNC={fetchTNC}
                                    state={state}
                                    dispatch={dispatch}
                                    allowedToEdit={allowedToEdit}
                                    handleVersionUpdateFromAdditionalData={handleVersionUpdateFromAdditionalData}
                                />
                            )} */}
                        </Grid>
                    </Grid>
                ) : null}
            </div>
            {showAiDialog && (
                <Dialog
                    open={showAiDialog}
                    aria-labelledby="customized-dialog-title"
                    maxWidth="sm"
                    onClose={() => {
                        setShowAiDialog(false);
                    }}
                    fullWidth
                    fullScreen={fullScreen || (isMobile || isTablet)}
                    TransitionComponent={CustomDialogTransition}
                >
                    <CustomDialogHeader
                        title="AI Suggestion"
                        onClose={() => {
                            setShowAiDialog(false);
                        }}
                        isMinimized={!fullScreen}
                        onMinimizeMaximize={() => {
                            setFullScreen(prevState => !prevState)
                        }}
                        showManimizeMaximize={true}
                    />
                    <CustomDialogContent>
                        <div className="text-align-center">
                            <Typography variant="h4">Under Construction </Typography>
                            <img
                                alt="image"
                                src={`${PerformanceTuningImg}`}
                                style={{ height: "300px" }}
                            />
                        </div>
                    </CustomDialogContent>
                </Dialog>
            )}

            {isRearrangeColumns && (
                <DndProvider backend={HTML5Backend}>
                    <ColumnsDialog
                        setColumns={setVisibleColumns}
                        columns={visibleColumns}
                        setOpenDialog={setRearrangeColumns}
                        id={quoteData._id}
                        version={currentVersion}
                        refresh={fetchQuoteData}
                        versionStatus={versionStatus}
                        selectedTNC={state?.selectedRecords}
                    />
                </DndProvider>
            )}

            {sendEmail && (
                <Dialog
                    open={sendEmail}
                    fullScreen={fullScreen || (isMobile || isTablet)}
                    TransitionComponent={CustomDialogTransition}
                    aria-labelledby="customized-dialog-title"
                    maxWidth="md"
                    onClose={() => {
                        setSendEmail(false)
                        setFullScreen(false);
                    }}
                    fullWidth
                >
                    <CreateEmail
                        generatingFile={generatingPdfFile}
                        handleClose={() => {
                            setSendEmail(false)
                            setFullScreen(false);
                        }}
                        fetchData={onSendEmailSuccess}
                        id={quoteData._id}
                        showESign={true}
                        version={currentVersion}
                        isQuoteBuilder={true}
                        options={userEmails?.to}
                        cc={userEmails?.cc ?? []}
                        emailId={null}
                        qouteBuilderAttachments={attachments}
                        subject={`${user?.user?.brandName ?? "Brand"} Offer - ${quoteData?.quoteName ?? ""
                            }`}
                        fromQuote={true}
                        isMinimized={!fullScreen}
                        onMinimizeMaximize={() => {
                            setFullScreen(prevState => !prevState)
                        }}
                        showManimizeMaximize={true}
                    />
                </Dialog>
            )}

            {messageDialog.open && (
                <MessageDialog
                    open={messageDialog.open}
                    onClose={() => {
                        setMessageDialog({ open: false, message: null });
                    }}
                    message={messageDialog.message}
                />
            )}
            {showQuoteStatusChangeDialog && (
                <DOAReasonDialog
                    reasonDialogOpen={showQuoteStatusChangeDialog}
                    handleCloseDialog={() => setShowQuoteStatusChangeDialog(false)}
                    QuoteStatusChange={QuoteStatusChange}
                    accepted={quoteStatusChangeData}
                />
            )}
        </>
    )
}
