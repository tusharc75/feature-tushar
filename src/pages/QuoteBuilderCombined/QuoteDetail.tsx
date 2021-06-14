import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useReducer,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import { Skeleton, TabPanelProps } from "@material-ui/lab";
import { useHistory, useParams } from "react-router-dom";

import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { gridPageSizes } from "../../constants/helpers";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import axiosInstance from "./../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import { useData } from "../../StateProvider/Provider";
import Activity from "../../components/Activity";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageQuoteDialog from "./ManageQuote/ManageQuoteDialog";
import { DataGrid } from "@material-ui/data-grid";

import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";

import { AiFillPlusCircle } from "react-icons/ai";
import { withStyles } from "@material-ui/core/styles";
import { BiLayerPlus } from "react-icons/bi";
import { AiOutlineEye } from "react-icons/ai";
import { BiMailSend } from "react-icons/bi";
import { FiDownloadCloud } from "react-icons/fi";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { termsAndCondition } from "../../constants/helpers";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import ManageTermsAndCondition from "../TermsAndConditions/ManageTermsAndCondition";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Checkbox from "@material-ui/core/Checkbox";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Chip from "@material-ui/core/Chip";
import draftToHtml from "draftjs-to-html";
import Steps from "./Steps";
import { displayDate } from "../../services/util";
import AddIcon from "@material-ui/icons/Add";
// import EmailDialog from "./EmailDialog";
import { CreateEmail } from "../../components/Activity/Email/CreateEmail";
import {
  customerAccount,
  sidebarResource,
  supplierAccount,
  yyyyMMDD,
  stepsToIgnoreManualCompleteForOpportunity,
  getObjKeysWithValues,
  processFieldName,
  formatAmountWithCurrency,
} from "../../constants/helpers";
import { quoteBuilder } from "../../constants/helpers";
import MessageDialog from "../../components/Helpers/MessageDialog";
import ProductBuilder from "../../components/productBuilder";
import CustomDialogComponent from "../../components/CustomDialog/CustomDialogComponent";
import InfoIcon from "@material-ui/icons/Info";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import ProductGrid from "./ProductGrid";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import Dialog from "@material-ui/core/Dialog";
import { isMobile, isTablet } from "react-device-detect";
import {
  CustomDialogTransition,
  customerContact,
} from "../../constants/helpers";

import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';


const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiAccordion);


const AccordionSummary = withStyles({
  root: {
    backgroundColor: "white",
    borderBottom: "1px solid #f1ece8",
    background: "#ffffff",
    fontWeight: "bold",
    padding: "0px",
    "&$expanded": {
      minHeight: 46,
    },
  },
  content: {
    "&$expanded": {
      margin: "12px 0",
    },
  },
  expanded: {},
})(MuiAccordionSummary);

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loadingTNC: action.loading,
      };

    case "initialize":
      return {
        ...state,
        dataRowsTNC: action.data,
        rowCountTNC: action.count,
        loadingTNC: false,
      };

    case "selection":
      return {
        ...state,
        selectedRecords: action.selectedRecords,
      };

    case "update":
      return {
        ...state,
        dataRowsTNC: action.data,
        loadingTNC: false,
      };

    case "filter":
      return {
        ...state,
        loadingTNC: true,
        filters: action.filters,
        page: 0,
      };

    case "sort":
      return {
        ...state,
        sorting: action.sorting,
        loadingTNC: true,
      };

    case "search":
      return {
        ...state,
        search: action.search,
        loadingTNC: true,
      };

    case "pageChange":
      return {
        ...state,
        page: action.page,
      };

    case "pageSizeChange":
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loadingTNC: true,
      };

    case "complete":
      return {
        ...state,
        loadingTNC: false,
      };

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRowsTNC: [],
  rowCountTNC: 0,
  loadingTNC: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: "",
  filters: {},
  sorting: [],
  selectedRecords: [],
};

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
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
    background: "#ececec !important",
    paddingBottom: "2px",
  },
  productInformation: {
    background: "white",
    margin: "9px",
    borderRadius: "3px",
    border: "1px solid #d2cbcb",
  },
  termsBtn: {
    position: "absolute",
    top: "-16px",
    right: "0",
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

const gettingVersionStatusText = "Getting Status...";

function QuoteDetail() {
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
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();

  var defaultSelectColumns = [
    "Product Name",
    "Description",
    "Unit",
    "Qty",
    "Sales Price Per Unit",
    "Total Sales Price",
  ];
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRowsTNC,
    rowCountTNC,
    loadingTNC,
    page,
    limit,
    pageSizes,
    search,
    filters,
    sorting,
    selectedRecords,
  } = state;
  const [gridApi, setTNCGridApi] = useState(null);

  const [columnsTNC, setColumnsTNC] = useState([
    {
      field: "name",
      headerName: "Name",
      cellRenderer: "nameRenderer",
    },
  ]);
  const [expandQuote, setExpandQuote] = useState(false);
  const [options, setOptions] = useState([]);
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [deletingDOA, setDeletingDOA] = useState(false);

  const [isCloning, setCloning] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [pdfFileBase64, setPdfFileBase64] = useState(null);
  const [excelFileBase64, setExcelFileBase64] = useState(null);
  const [copyOfquoteData, setCopyOfquoteData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [quoteFields, setquoteFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [versions, setVersions] = useState([]);
  const [productBuilderID, setProductBuilderID] = useState("");
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [supplierContacts, setSupplierContacts] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);
  const [showAddSupplierContactsDialog, setShowAddSupplierContactsDialog] =
    useState(false);
  const [showAddCustomerContactsDialog, setShowAddCustomerContactsDialog] =
    useState(false);

  const [currentVersion, setcurrentVersion] = useState(0);

  const [messageDialog, setMessageDialog] = useState({
    open: false,
    message: null,
  });
  const [expanded, setExpanded] = useState({
    supplierContacts: true,
    customerContacts: true,
  });
  const [supplierAccountOptions, setSupplierAccountOptions] = useState([]);
  const [loadingSupplierAccounts, setLoadingSupplierAccounts] = useState(false);
  const [contactsEmailsData, setContactsEmailsData] = useState([]);
  const [notToBeRemovedContacts, setNotToBeRemovedContacts] = useState([]);
  const [loadPB, setLoadPB] = useState(false);

  const [Editable, setEditable] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [TandC, setTNC] = useState([]);
  const [totalProfit, setTotalProfit] = useState({
    shortFormatAmount: "",
    fullFormatAmount: "",
  });
  const [totalcost, setTotalCost] = useState({
    shortFormatAmount: "",
    fullFormatAmount: "",
  });
  const [totalsale, setTotalSale] = useState({
    shortFormatAmount: "",
    fullFormatAmount: "",
  });
  const [totalmargin, setTotalMargin] = useState({
    shortFormatAmount: "",
    fullFormatAmount: "",
  });
  const [dynamicTableData, setDynamicTableData] = useState([]);
  const [ColumnName, setColName] = useState([]);
  const [visibleColumns, setVisibleColumnName] = useState([]);
  const [versionStatus, setversionStatus] = useState("Building Quote");
  const [DOAneeded, setDOAneeded] = useState(false);

  const [dataTNC, setDataTNC] = useState([]);

  const [editRecordTNC, setEditRecordTNC] = useState(null);
  const [DOAreq, setDOAreq] = useState(false);
  const [Customerreq, setCustomerreq] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [buttonMessage, setButtonMessage] = useState("Send to Customer");
  const [columnView, setColumnView] = useState([]);
  const [PDF, setPdf] = useState("");
  const theme = useTheme();
  const [nextStep, setNextStep] = useState(true);
  const [redCard, setRedCard] = useState(false);

  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [ProcessStatus, setProcessStatus] = useState("New");

  let logo = null;
  let companyName = "";
  let companyAddress = "";
  const [DOAlimit, setDOALimit] = useState(0);
  const [DOAsetup, setDOAsetup] = useState(false);
  const [lastUser, setLastUser] = useState(true);
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [versionStatusData, setVersionStatusData] = useState({
    columns: [],
    data: [],
  });
  const [allVersionStatusButtonText, setAllVersionStatusButtonText] =
    useState("All Version Status");
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [reminderLoading, setReminderLoading] = useState(false)

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  let { id } = useParams();


  interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Typography>{children}</Typography>
        )}
      </div>
    );
  }

  function a11yProps(index: any) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const [quotePermissions, setquotePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const { qbResource, qbApi } = quoteBuilder;

  useEffect(() => {
    fetchDoaLimit();
  }, []);

  useEffect(() => {
    if (permissions) {
      setquotePermissions(permissions[qbResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (id) {
      fetchQuoteData(0);
      getQuoteFields();
    }
  }, [id]);

  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  /**
   *
   * @param version
   * Fetch quote data with versions
   *
   */
  const fetchQuoteData = (version: any) => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${qbApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {

          setCustomizedRoutes([
            { title: "Quote", path: routes.quoteBuilder.path },
            { title: `${data?.quoteName}` },
          ]);

          // handleAllowToEditList(data);
          setQuoteData(data);

          let modifiedData = {};
          Object.assign(modifiedData, data);
          modifiedData["estimatedAmount"] = formatAmountWithCurrency(
            modifiedData["currency"],
            modifiedData["estimatedAmount"]
          ).shortFormatAmount;

          setCopyOfquoteData(modifiedData);

          fetchUserEmails(data);

          handleContactsEmails(data);

          handleMainPoints(data);
          setHeadingLbl(data?.quoteName);
          var keys = Object.keys(data.versions);
          setVersions(keys);
          var ps = "";
          var s = "";

          if (version === 0) {
            ps = data.versions[keys[keys.length - 1]].processStatus;
            s = data.versions[keys[keys.length - 1]].status;

            setcurrentVersion(parseInt(keys[keys.length - 1]));

            setProcessStatus(
              data.versions[keys[keys.length - 1]].processStatus
            );
            setProductBuilderID(
              data.versions[keys[keys.length - 1]].productBuilderId
            );
            setversionStatus(data.versions[keys[keys.length - 1]].status);
            if (data.versions[keys[keys.length - 1]].TNC) {
              setTNC(data.versions[keys[keys.length - 1]].TNC);
            }
            if (data.versions[keys[keys.length - 1]].acceptedColumns) {
              setColumnView(
                data.versions[keys[keys.length - 1]].acceptedColumns
              );
            }

            if (
              data.versions[keys[keys.length - 1]].status === "Building Quote"
            ) {
              setEditable(true);
            } else {
              setEditable(false);
            }
          } else {
            setcurrentVersion(version);
            setProcessStatus(data.versions[version].processStatus);
            setProductBuilderID(data.versions[version].productBuilderId);
            setversionStatus(data.versions[version].status);
            if (data.versions[version].TNC) {
              setTNC(data.versions[version].TNC);
            }
            if (data.versions[version].acceptedColumns) {
              setColumnView(data.versions[version].acceptedColumns);
            }
            if (data.versions[version].status === "Building Quote") {
              setEditable(true);
            } else {
              setEditable(false);
            }
            ps = data.versions[version].processStatus;
            s = data.versions[version].status;
          }

          if (ps === "DOA Process" && !s.includes("Accepted")) {
            setNextStep(false);
          }
          if (ps === "DOA Process" && s.includes("Accepted")) {
            setNextStep(true);
          }
          if (ps === "Customer Process") {
            setNextStep(false);
          }

          setAllowedToEdit(
            [...(data.collaborator ?? []), data.owner].some(
              (d) => d?.optionValue === user?.user?._id
            )
          );

          if (
            data?.staticData?.notToBeRemoved &&
            typeof data.staticData.notToBeRemoved === "object"
          ) {
            let ids = [];
            Object.keys(data?.staticData?.notToBeRemoved).map(
              (k) => (ids = [...ids, ...data.staticData.notToBeRemoved[k]])
            );
            setNotToBeRemovedContacts(ids);
          }

          let tempExpanded = {
            supplierContacts: true,
            customerContacts: true,
          };
          if (
            data?.staticData?.supplierContacts &&
            data.staticData.supplierContacts.length === 0
          ) {
            tempExpanded.supplierContacts = false;
          }
          if (
            data?.staticData?.customerContacts &&
            data.staticData.customerContacts.length === 0
          ) {
            tempExpanded.customerContacts = false;
          }
          setExpanded(tempExpanded);

          setTimeout(() => setLoading(false), 500);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint["Account Name"] = data?.accountName?.optionLabel || "";
    mainPoint["Expiry Date"] = yyyyMMDD(data.closeDate);
    mainPoint["Estimated Amount"] = data?.estimatedAmount
      ? formatAmountWithCurrency(data?.currency, data?.estimatedAmount)
        .shortFormatAmount
      : "";
    mainPoint["Quote Owner"] = data?.owner?.optionLabel || "";

    setMainPoints(mainPoint);
  };

  const getQuoteFields = () => {
    if (selectedEntity) {
      setLoadingFields(true);
      axiosInstance()
        .get(`/field?resource=Quotes&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setquoteFields(data);

          if (data && data.length) {
            let fieldData = data.find(
              (currentField) =>
                currentField?.fieldData?.fieldName === "supplierAccountName"
            )?.fieldData;
            if (fieldData?.option && fieldData.option.length) {
              setSupplierAccountOptions(
                fieldData.option.map((option) => ({
                  ...option,
                  isSelected: false,
                }))
              );
            }
          }
          const processSteps = data.find(
            (d) =>
              d.isRead &&
              d.fieldData.fieldName.toLowerCase() ===
              processFieldName.toLowerCase()
          );
          if (processSteps && processSteps.isRead) {
            setSteps(
              processSteps.fieldData.option.map((m) => {
                return {
                  text: m.optionLabel,
                  canCompleteManually:
                    !stepsToIgnoreManualCompleteForOpportunity.some(
                      (s) => s === m.optionValue.toLowerCase()
                    ),
                };
              })
            );
          }
          setLoadingFields(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoadingFields(false);
        });
    }
  };

  const NameRenderer = (params) => (
    <p
      className="cursor-pointer"
      title={params.value}
      onClick={() => {
        const data = dataRowsTNC.find((d) => d._id === params.data.id);
        setEditRecordTNC(data);
        setShowCreateDialog(true);
      }}
    >
      {params.value}
    </p>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
  };

  /**
   * @TNC HANDLER
   */

  const fetchTermsAndConditions = () => {
    dispatch({ type: "loading", loadingTNC: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }
    axiosInstance()
      .get(termsAndCondition.api)
      .then(({ data: { data, count } }) => {
        setDataTNC(data);
        let rows = data.map((tnc) => ({
          ...tnc,
          id: tnc._id,
          name: tnc.TACName,
        }));
        dispatch({
          type: "initialize",
          data: rows,
          count: count,
        });
        dispatch({ type: "loading", loadingTNC: false });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: "loading", loadingTNC: false });
      });
  };

  const fetchUserEmails = (quoteData) => {
    let ownerCollaboratorEmails = [];
    if (quoteData?.collaborator && quoteData.collaborator.length) {
      ownerCollaboratorEmails = quoteData.collaborator.filter((o) => o?.email).map((o) => o?.email);
    }
    if (quoteData?.owner?.email) {
      ownerCollaboratorEmails.push(quoteData.owner.email);
    }
    let toEmails = [];
    if (
      quoteData?.customerContactName &&
      quoteData?.customerContactName.length
    ) {
      toEmails = quoteData?.customerContactName.filter((o) => o?.email).map((o) => o.email);
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
        .post(`quote-builder/updateprocess/${id}?version=${currentVersion}`, {
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

  const createImagePDF = (view, send) => {
    axiosInstance()
      .get("/user/brandInfo")
      .then(({ data }) => {
        companyName = data.data.name;
        companyAddress = data.data.address;
        if (data.data.logo) {
          fetchImage(data.data.logo, function (dataUri) {
            logo = dataUri;
            GeneratePdf(view, send);
          });
        } else {
          GeneratePdf(view, send);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchImage = (Url, cb) => {
    var image = new Image();
    image.setAttribute("crossOrigin", "anonymous"); //getting images from external domain

    image.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      //next three lines for white background in case png has a transparent background
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; /// set white fill style
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      canvas.getContext("2d").drawImage(image, 0, 0);

      cb(canvas.toDataURL("image/jpeg"));
    };

    image.src = Url;
  };

  const GeneratePdf = (view, send) => {
    const PdfDoc = new jsPDF("p", "pt", "a4");
    let date = new Date();
    const excelHeader = [];
    const excelheaderName = [];
    const excelData = [];

    const pagewidth = PdfDoc.internal.pageSize.width;

    if (logo !== null) {
      PdfDoc.addImage(logo, "JPEG", pagewidth - 80, 0, 70, 50);
    }
    PdfDoc.setFontSize(26);
    PdfDoc.text(companyName, 20, 30);
    PdfDoc.setFontSize(12);
    PdfDoc.text(companyAddress, 20, 50);
    PdfDoc.setLineWidth(3);
    PdfDoc.line(15, 70, 260, 70);
    PdfDoc.line(330, 70, 580, 70);
    PdfDoc.setFontSize(14);
    PdfDoc.text("Quotation", 265, 75);
    var PDFData = [];
    var PdfCol = ["S. No."];
    var serialNumber = 1;
    dynamicTableData.forEach((dataEntry) => {
      var PdfRow = [serialNumber];
      var ExcelRow = {};
      ColumnName.forEach((ColName) => {
        if (defaultSelectColumns.indexOf(ColName) !== -1) {
          if (PdfCol.indexOf(ColName) == -1) {
            PdfCol.push(ColName);
          }
          PdfRow.push(dataEntry[ColName]);
        }

        if (visibleColumns.indexOf(ColName) !== -1) {
          if (excelheaderName.indexOf(ColName !== -1)) {
            excelheaderName.push(ColName);
            excelHeader.push({
              header: ColName,
              key: ColName.replace(" ", ""),
            });
          }
          ExcelRow[ColName.replace(" ", "")] = dataEntry[ColName];
        }
      });
      PDFData.push(PdfRow);
      excelData.push(ExcelRow);
      serialNumber = serialNumber + 1;
    });

    // if(!view && !send){
    //
    //
    //   const workbook = new excel.Workbook();
    //   const worksheet: any = workbook.addWorksheet("Quotation");
    //   worksheet.columns=excelHeader;
    //   //worksheet.addRows(2,excelData);
    //   downloadExcel(workbook.xlsx.writeBuffer(),"Quotation.xlsx");
    // }
    PdfDoc.setFontSize(10);
    PdfDoc.text(`Quote Id: ${productBuilderID}`, 285, 100);
    PdfDoc.text(`Currency: ${quoteData.currency}`, 285, 115);
    PdfDoc.text(`Date: ${displayDate(date)}`, 285, 130);
    PdfDoc.text(
      `Quote Expiry Date: ${displayDate(quoteData.expiryDate)}`,
      285,
      145
    );
    PdfDoc.text(`Inco Terms: ${quoteData.incoTerms}`, 285, 160);
    PdfDoc.setFontSize(8);
    PdfDoc.text("Bill To:", 20, 100);
    PdfDoc.setFontSize(12);
    PdfDoc.text(quoteData.customerAccountName.optionLabel, 20, 115);

    var text = "Please find the Quoatation Below:";
    var lineHeight = PdfDoc.getLineHeight();
    var splittedText = PdfDoc.splitTextToSize(text, 50);
    PdfDoc.text(text, 20, 200);
    var lines = splittedText.length;
    var blockHeight = lines * lineHeight;
    PDFData = [
      ...PDFData,
      [
        {
          content: `Quote Total : ${totalsale.fullFormatAmount}`,
          colSpan: PDFData[0].length,
          styles: { halign: "right", valign: "middle" },
        },
      ],
    ];

    autoTable(PdfDoc, {
      margin: { top: 140 + blockHeight, left: 20, right: 20 },
      head: [PdfCol],
      body: PDFData,
      styles: { halign: "center", cellWidth: "auto", overflow: "linebreak" },
      theme: "grid",
    });
    let finalY = (PdfDoc as any).lastAutoTable.finalY;

    finalY = finalY + 40;
    PdfDoc.setFontSize(10);
    PdfDoc.text("Note:", 20, finalY);

    finalY = finalY + 15;
    PdfDoc.text("Thanks for your business", 20, finalY);

    finalY = finalY + 50;
    PdfDoc.text("Customer Signature", 20, finalY);

    finalY = finalY + 75;
    PdfDoc.line(15, finalY, 260, finalY);

    if (selectedRecords.length) {
      PdfDoc.setDrawColor(0, 0, 0);
      PdfDoc.setFontSize(14);
      PdfDoc.setLineWidth(3);
      PdfDoc.line(15, finalY + 20, 580, finalY + 20);

      let finalmarkup = "";

      selectedRecords.forEach((selectTNC) => {
        finalmarkup =
          finalmarkup + `<h3><strong>${selectTNC.TACName}:</strong></h3>`;
        let state = convertFromRaw(JSON.parse(selectTNC.description));
        let TNC = EditorState.createWithContent(state);
        let markup = draftToHtml(convertToRaw(TNC.getCurrentContent()));

        finalmarkup = finalmarkup + markup + "<br>";
      });

      finalmarkup = finalmarkup.replaceAll(" ", "&nbsp");

      PdfDoc.html(finalmarkup, {
        callback: function (doc) {
          if (view && !send) {
            doc.setProperties({
              title: `Quotation - v${currentVersion}`,
            });
            const pdfBlobFile = doc.output("blob");
            generateBase64forFile(pdfBlobFile, "pdf");

            window.open(URL.createObjectURL(pdfBlobFile));
          } else if (!view && !send) {
            doc.save(`Quotation - v${currentVersion}`);
          }
          if (send) {
            let PDFtoAPIData = doc.output("blob");

            const formdata = new FormData();
            formdata.append("file", PDFtoAPIData, "Quotation.pdf");
            axiosInstance()
              .post("/user/upload/", formdata, {
                headers: {
                  "content-type": "multipart/form-data",
                },
              })
              .then(({ data }) => {
                handleVersionUpdate(data.fileName, visibleColumns, "", TandC);
              })
              .catch((err) => {
                toastConfig.setToastConfig(err);
              });
          }
        },
        x: 20,
        y: finalY + 50,
        margin: [20, 10, 20, 10],
      });
    } else {
      if (view && !send) {
        PdfDoc.setProperties({
          title: `Quotation - ${currentVersion}`,
        });
        const pdfBlobFile = PdfDoc.output("blob");
        generateBase64forFile(pdfBlobFile, "pdf");

        window.open(URL.createObjectURL(pdfBlobFile));
      } else if (!view && !send) {
        PdfDoc.save(`Quotation - v${currentVersion}.pdf`);
      }
      if (send) {
        let PDFtoAPIData = PdfDoc.output("blob");
        generateBase64forFile(PDFtoAPIData, "pdf");
        const formdata = new FormData();
        formdata.append("file", PDFtoAPIData, "Quotation.pdf");
        axiosInstance()
          .post("/user/upload/", formdata, {
            headers: {
              "content-type": "multipart/form-data",
            },
          })
          .then(({ data }) => {
            handleVersionUpdate(data.fileName, visibleColumns, "", TandC);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
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

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    if (editRecordTNC) {
      setEditRecordTNC(null);
    }
  };

  const fetchDoaLimit = () => {
    axiosInstance()
      .post("doa-request/limit", {})
      .then(({ data: { data } }) => {
        setDOAsetup(data.doasetup);
        setDOALimit(data.maxLimit.limit ? data.maxLimit.limit : 0);
        setLastUser(data.lastUser);
      })
      .catch((err) => {
        // toastConfig.setToastConfig(err);
      });
  };

  useEffect(() => {
    if (
      quoteData?.staticData?.customerContacts &&
      quoteData.staticData?.customerContacts.length &&
      customerContacts &&
      customerContacts.length === 0
    )
      fetchCustomerContactData(false);

    if (
      quoteData?.staticData?.supplierContacts &&
      quoteData.staticData?.supplierContacts.length &&
      supplierContacts &&
      supplierContacts.length === 0
    )
      fetchSupplierContactData(false);
  }, [quoteData]);

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = quoteFields.find(
        (d) =>
          d.isRead &&
          d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase()
      );
      if (processSteps && processSteps.isRead && quoteData) {
        const currentStepToShow =
          processSteps.fieldData.option.findIndex(
            (d) => d.optionLabel === quoteData[processFieldName]
          ) + 1;
        setActiveStep(currentStepToShow);
      }
    }
  }, [steps]);

  const exportToCSV = (send = false) => {
    const fileType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";

    if (dynamicTableData.length) {
      let newTable = [];
      dynamicTableData.forEach((d, i) => {
        let obj = {};
        visibleColumns.forEach((col) => {
          obj[col] = d[col];
        });

        newTable.push(obj);
      });

      newTable.push({
        "Product Name": "Total",
        "Total Sales Price": totalcost.fullFormatAmount,
      });

      const ws = XLSX.utils.json_to_sheet(newTable);
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], { type: fileType });

      console.log(data);

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

  const fetchSupplierContactData = (
    showDialog,
    useAccountList = false,
    accountList = []
  ) => {
    let ids = [];

    if (quoteData.supplierAccountName.length > 0 || useAccountList) {
      ids = useAccountList
        ? accountList.map((d) => d.optionValue)
        : quoteData.supplierAccountName.map((d) => d.optionValue);

      const filterById = JSON.stringify([
        { field: "accountName", term: ids.length > 1 ? { $in: ids } : ids[0] },
      ]);
      setLoadingSupplierAccounts(true);
      axiosInstance()
        .get(`supplier-contact?filterById=${filterById}`)
        .then(({ data: { data } }) => {
          let assignedContacts = quoteData.staticData?.supplierContacts ?? [];
          const updatedContacts = [];
          data.forEach((d) => {
            d["isChecked"] =
              assignedContacts.length > 0
                ? assignedContacts.some((item) => item?._id === d?._id)
                : false;
            updatedContacts.push(d);
          });

          setSupplierContacts(updatedContacts);
          setLoadingSupplierAccounts(false);
          if (!useAccountList) setShowAddSupplierContactsDialog(showDialog);
        })
        .catch((error) => {
          setLoadingSupplierAccounts(false);
        });
    } else {
      setShowAddSupplierContactsDialog(showDialog);
    }
    // else if (supplierAccountOptions && supplierAccountOptions.length) {
    //   ids = [...supplierAccountOptions.map(option => option.optionValue)]
    // }
  };
  const getContactEmails = (contacts) => {
    return contacts.reduce((emails, contact) => {
      if (contact?.email) emails.push(contact.email);
      return emails;
    }, []);
  };
  const handleContactsEmails = (quoteData) => {
    let data = [];
    if (quoteData && quoteData?.staticData) {
      const { customerContacts, supplierContacts } = quoteData?.staticData;
      if (customerContacts && customerContacts.length) {
        data = getContactEmails(customerContacts);
      }
      if (supplierContacts && supplierContacts.length) {
        data = [...data, ...getContactEmails(supplierContacts)];
      }
      if (data.length > 0) setContactsEmailsData(data);
    }
  };

  const fetchCustomerContactData = (showDialog) => {
    const filterById = JSON.stringify([
      {
        field: "accountName",
        term: quoteData?.customerAccountName?.optionValue,
      },
    ]);

    axiosInstance()
      .get(`customer-contact?filterById=${filterById}`)
      .then(({ data: { data } }) => {
        let assignedContacts = quoteData.staticData?.customerContacts ?? [];
        const updatedContacts = data.map((d) => {
          d["isChecked"] =
            assignedContacts.length > 0
              ? assignedContacts.some((item) => item?._id === d?._id)
              : false;
          return d;
        });
        setCustomerContacts(updatedContacts);
        setShowAddCustomerContactsDialog(showDialog);
      });
  };

  const handleDeleteQuote = () => {
    if (quoteData?._id) {
      axiosInstance()
        .put(`${qbApi}/remove?entity=${selectedEntity}`, {
          ids: [quoteData._id],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          goBackToListing();
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const goBackToListing = () => {
    history.push({
      pathname: routes.quoteBuilder.path,
    });
  };

  const handleChangeVersion = (event) => {
    setLoadPB(false);
    setcurrentVersion(parseInt(event.target.value));
    setProductBuilderID(
      quoteData["versions"][event.target.value]["productBuilderId"]
    );
    setversionStatus(quoteData["versions"][event.target.value]["status"]);

    setProcessStatus(
      quoteData["versions"][event.target.value]["processStatus"]
    );

    setLoadPB(true);
  };

  const handleClone = () => {
    axiosInstance()
      .post(`${qbApi}/clone/${quoteData._id}`)
      .then(({ data }) => {
        history.push(`${routes.quoteBuilder.path}/${data.data._id}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const productBuilderdatatoQuoteBuilderdata = (BuilderData) => {
    setOptions([]);
    setRedCard(false);
    let optionstoSet = [];
    let invalidQty = false;
    let invalidPrice = false;

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
    BuilderData.map((quoteRows: { [x: string]: any }) => {
      let hasTSP = false;
      const quoteRowKeys = Object.keys(quoteRows);
      let inventorydata: { fieldName: string; fieldValue: any }[] = [];
      quoteRowKeys.map((key) => {
        if (key === "qty") {
          if (quoteRows[key] === 0) {
            invalidQty = true;
          }
        }
        if (ignoredKeys.indexOf(key) === -1) {
          let indexkey = key;
          let currency = "";
          if (key.includes("_")) {
            let splitKey = key.split("_");
            key = splitKey[0];
            currency = splitKey[1];
          }
          let fields = quoteRows["fields"];
          let field = fields.filter(
            (d: { fieldName: string }) => d.fieldName === key
          );

          if (typeof field[0] !== "undefined") {
            if (typeof quoteRows[key] === "object") {
              inventorydata.push({
                fieldName: field[0].fieldLabel,
                fieldValue: quoteRows[key][key],
              });
            } else {
              inventorydata.push({
                fieldName: field[0].fieldLabel,
                fieldValue: quoteRows[indexkey],
              });
            }
            if (
              currency.toUpperCase() === quoteData?.currency &&
              key === "totalCost"
            ) {
              totalCost = totalCost + quoteRows[indexkey];
              CostCurrency = currency.toUpperCase();
            } else if (
              currency.toUpperCase() === quoteData?.currency &&
              key === "totalSalesPrice"
            ) {
              totalSellingPrice = totalSellingPrice + quoteRows[indexkey];
              SPCurrency = currency.toUpperCase();
              hasTSP = false;
            } else if (
              currency.toUpperCase() === quoteData?.currency &&
              key === "totalProfit"
            ) {
              totalProfit = totalProfit + quoteRows[indexkey];
              ProfitCurrency = currency.toUpperCase();
            } else if (
              currency.toUpperCase() === quoteData?.currency &&
              key === "totalMargin"
            ) {
              totalMargin = totalMargin + quoteRows[indexkey];
              MarginCurrency = currency.toUpperCase();
            }
          }
        }
      });
      if (!hasTSP) {
        invalidPrice = true;
      }
      inventory.push(inventorydata);
    });

    if (ProcessStatus === "Price Builder" && totalSellingPrice === 0) {
      setNextStep(false);
    }

    if (ProcessStatus === "Price Builder" && totalSellingPrice > 1) {
      setNextStep(true);
    }
    setTotalProfit(formatAmountWithCurrency(quoteData.currency, totalProfit));
    setTotalMargin(formatAmountWithCurrency(quoteData.currency, totalMargin));
    setTotalSale(
      formatAmountWithCurrency(quoteData.currency, totalSellingPrice)
    );
    setTotalCost(formatAmountWithCurrency(quoteData.currency, totalCost));
    if (totalSellingPrice < totalCost) {
      setRedCard(true);
    }

    if (ProcessStatus === "Price Builder") {
      if (!invalidQty || !invalidPrice) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    }

    setButtonMessage("Send to Customer");
    setDOAreq(false);
    setCustomerreq(true);
    if (DOAsetup && totalSellingPrice > DOAlimit && !lastUser) {
      setDOAneeded(true);
    } else {
      setDOAneeded(false);
    }
    if (
      DOAsetup &&
      totalSellingPrice > DOAlimit &&
      versionStatus === "Building Quote" &&
      !lastUser
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
      versionStatus === "Rejected by Customer"
    ) {
      setDOAreq(false);
      setCustomerreq(false);
    }
    let TableData = [];
    let Col = [];
    let ColName = [];
    let columnext = [];
    let KeyValuePairs = [];
    type Type = {
      [key: string]: any;
    };

    for (let i = 0; i < inventory.length; i++) {
      let KeyValue: Type = {};
      for (let j = 0; j < inventory[i].length; j++) {
        let DataSet = inventory[i][j];
        if (ColName.indexOf(DataSet.fieldName) === -1) {
          ColName = [...ColName, DataSet.fieldName];
          Col = [...Col, { title: DataSet.fieldName, name: DataSet.fieldName }];
          columnext = [
            ...columnext,
            { ColumnName: DataSet.fieldName, width: 100 },
          ];
        }
        KeyValue[DataSet.fieldName] = DataSet.fieldValue;
      }
      KeyValuePairs = [...KeyValuePairs, KeyValue];
    }
    setColName(ColName);
    setOptions(optionstoSet);
    if (columnView.length > 0) {
      setVisibleColumnName(columnView);
    } else {
      setVisibleColumnName(defaultSelectColumns);
    }

    for (let j = 0; j < KeyValuePairs.length; j++) {
      const DataSet = KeyValuePairs[j];
      let DataRecord: Type = {};
      for (let i = 0; i < ColName.length; i++) {
        if (ColName[i] in DataSet) {
          DataRecord[ColName[i]] = DataSet[ColName[i]];
        } else {
          DataRecord[ColName[i]] = "-";
        }
      }
      TableData = [...TableData, DataRecord];
    }
    setDynamicTableData(TableData);
  };

  const handleCases = () => {
    if (DOAreq) {
      if (!PDF) {
        axiosInstance()
          .post(`/doa-request/create/${id}?version=${currentVersion}`)
          .then(({ data }) => {
            handleVersionUpdate(PDF, visibleColumns, "Sent for DOA", TandC);
            fetchQuoteData(currentVersion);
            console.log(data);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }
    }
    if (Customerreq) {
      createImagePDF(false, true);

      exportToCSV(true);
      if (!PDF) {
        createImagePDF(false, true);
      }
      setSendEmail(true);
    }
  };

  const handleChangeVisible = (event) => {
    setVisibleColumnName(event.target.value);
    handleVersionUpdate(PDF, event.target.value, versionStatus, TandC);
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
    setCloning(true);
    axiosInstance()
      .post(
        `/quote-builder/createVersion/${id}?version=${currentVersion}`,
        dataTNC
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

  const handleVersionUpdate = (PDFfile, Columns, versionStatus, TC) => {
    let body = {
      PDF: PDFfile,
      acceptedColumns: Columns,
      status: versionStatus,
      TNC: TC,
    };
    axiosInstance()
      .post(`quote-builder/updateVersion/${id}?version=${currentVersion}`, body)
      .then(({ data }) => { })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const onSuccess = () => {
    setSendEmail(false);

    handleVersionUpdate("", visibleColumns, "Sent to Customer", TandC);
    fetchQuoteData(currentVersion);
  };

  const getVersionStatus = () => {
    setAllVersionStatusButtonText(gettingVersionStatusText);
    axiosInstance()
      .get(`/quote-builder/quote-hierarchy/${id}`)
      .then(({ data: { data } }) => {
        setShowVersionsDialog(true);

        const newData = data.versions.map((d, index) => {
          return { ...d, id: index + 1 };
        });

        setVersionStatusData({
          columns: [
            { field: "versionNumber", headerName: "Version #", flex: 0.5 },
            { field: "status", headerName: "Status", flex: 1 },
            // { field: "processStatus", headerName: "ProcessStatus" }
          ],
          data: newData,
        });

        setAllVersionStatusButtonText("All Version Status");
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setAllVersionStatusButtonText("All Version Status");
      });
  };

  let attachments = [];
  if (pdfFileBase64) {
    attachments.push({
      base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(",") + 1)),
      contentType: pdfFileBase64.split(";")[0].split(":")[1],
      name: `Quotation v${currentVersion}`
    });
  }
  if (excelFileBase64) {
    attachments.push({
      base64: excelFileBase64.substring(
        parseInt(excelFileBase64.indexOf(",") + 1)
      ),
      contentType: excelFileBase64.split(";")[0].split(":")[1],
      name: `Quotation v${currentVersion}`
    });
  }

  if (ProcessStatus !== "Quote Builder" && currentTabIndex === 1) {
    setCurrentTabIndex(0);
  }

  const deleteVersion = () => {
    let versions = quoteData?.versions;

    delete versions[currentVersion];

    setDeletingDOA(true);
    axiosInstance()
      .delete(`${qbApi}/${id}/${currentVersion}`)
      .then(() => {
        console.log("Succfully Deleted.");
        setDeletingDOA(false);
        fetchQuoteData(0);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setDeletingDOA(false);
      });
  };

  const ifQuoteApproved = () => {
    let approved = false;
    let versionApproved = currentVersion;

    if (quoteData) {
      versions.forEach((v) => {
        if (quoteData.versions[v]?.status.includes("Accepted by Customer")) {
          approved = true;
          versionApproved = v;
        }
      });
    }
    return {
      approved,
      versionApproved,
    };
  };
  const handleSendReminder = () => {
    if (quoteData?.versions && quoteData.versions[currentVersion] && quoteData.versions[currentVersion]?.adobeDocumentId) {
      setReminderLoading(true)
      axiosInstance()
        .get(`quote-builder/reminder/${quoteData.versions[currentVersion].adobeDocumentId}`)
        .then((data: { data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: "Reminder Sent",
          });
          setReminderLoading(false)
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setReminderLoading(false)
        });

    }
  }
  let isHideReminder = false
  if (quoteData?.versions && quoteData.versions[currentVersion] && quoteData.versions[currentVersion]?.adobeAgreementStatus === "SIGNED") {
    isHideReminder = true
  }

  return (
    <>
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Paper>
              {!quoteData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={headingLbl}
                  logo={quoteData?.leadLogo ? quoteData.leadLogo : undefined}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  <Button
                    variant="contained"
                    type="button"
                    size="small"
                    disabled={
                      allVersionStatusButtonText === gettingVersionStatusText
                    }
                    startIcon={<InfoIcon />}
                    color="primary"
                    onClick={() => {
                      getVersionStatus();
                    }}
                  >
                    {allVersionStatusButtonText}{" "}
                  </Button>

                  {quotePermissions.isDelete &&
                    quoteData?.owner.optionValue &&
                    user?.user?._id &&
                    quoteData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                </DetailsPageHeader>
              )}
              {loading && loadingFields ? (
                <Box padding={2}>
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6} key={i}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <>
                  {quoteData && (<>
                    <Tabs
                      className="oms-tab"
                      value={value}
                      onChange={handleChange}
                      indicatorColor="primary"
                      textColor="primary"
                    >
                      <Tab
                        label={<div className="d-flex align-items-center font-size-3"><FaWpforms className="mr-1" fontSize="inherit" /> Quotes Information</div>}
                        {...a11yProps(0)}
                      // label={"Quotes Information"}
                      />
                      <Tab
                        label={<div className="d-flex align-items-center font-size-3"><BiFoodMenu className="mr-1" fontSize="inherit" /> Product Information</div>}
                        {...a11yProps(1)}
                      />
                    </Tabs>
                    <TabPanel value={value} index={0}>
                      <Grid
                        container
                        className="detailHeader d-flex align-items-center form-label-style mb-0"
                      >
                        <Grid item xs={12} sm={4} className="justify-content-start">
                          <h2 className="mr-2">Quote Information</h2>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={8}
                          className="d-flex justify-content-end"
                        >

                          {quotePermissions.isCreate ? (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              className="mr-1"
                              onClick={handleClone}
                            >
                              Clone
                            </Button>
                          ) : null}
                          {allowedToEdit ? (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={handleOpenUpdateDialog}
                            >
                              Edit
                            </Button>
                          ) : null}

                        </Grid>
                      </Grid>
                      {copyOfquoteData ?
                        <DetailsPage
                          data={copyOfquoteData}
                          fields={quoteFields}
                        /> : null}
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                      <Paper className={classes.bgProduct}>
                        <Grid
                          container
                          className="detailHeader d-flex align-items-center form-label-style mb-0"
                        >
                          <Grid item xs={12} sm={4} className="justify-content-start">
                            <h2 className="mr-2">Product Information</h2>
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            sm={8}
                            className="d-flex justify-content-end"
                          >
                            <select
                              className="customSelect mx-1"
                              value={currentVersion}
                              onChange={handleChangeVersion}
                            >
                              {versions.map((team) => (
                                <option key={team} value={team}>
                                  {"Version : " + team}
                                </option>
                              ))}
                            </select>
                            {ifQuoteApproved().approved === false && (
                              <>
                                {currentVersion !== 1 && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={
                                      deletingDOA ||
                                      loading ||
                                      OtherSteps.indexOf(ProcessStatus) > 1
                                    }
                                    onClick={deleteVersion}
                                  >
                                    Delete Version
                                  </Button>
                                )}
                                <Button
                                  disabled={isCloning || loading}
                                  variant="contained"
                                  type="button"
                                  size="small"
                                  startIcon={
                                    isCloning ? (
                                      <CircularProgress color="inherit" size={16} />
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
                                    `Clone Version ${currentVersion}`
                                  )}
                                </Button>{" "}
                              </>
                            )}

                          </Grid>
                        </Grid>
                        <div>
                          {DOAneeded ? (
                            <Steps
                              steps={DOASteps}
                              currentStep={DOASteps.indexOf(ProcessStatus)}
                              id={id}
                              version={currentVersion}
                              Refresh={fetchQuoteData}
                              nextStep={nextStep}
                              versionStatus={versionStatus}
                              loading={loading}
                              approvedQuote={ifQuoteApproved()}
                              DOAlimit={DOAlimit}
                              totalCost={totalcost?.fullFormatAmount}
                              handleSendReminder={handleSendReminder}
                              hideReminderButton={isHideReminder}
                              reminderLoading={reminderLoading}
                            />
                          ) : (
                            <Steps
                              steps={OtherSteps}
                              currentStep={OtherSteps.indexOf(ProcessStatus)}
                              id={id}
                              version={currentVersion}
                              Refresh={fetchQuoteData}
                              nextStep={nextStep}
                              versionStatus={versionStatus}
                              loading={loading}
                              approvedQuote={ifQuoteApproved()}
                              DOAlimit={DOAlimit}
                              totalCost={totalcost?.fullFormatAmount}
                              handleSendReminder={handleSendReminder}
                              hideReminderButton={isHideReminder}
                              reminderLoading={reminderLoading}
                            />
                          )}
                        </div>
                        <div className={classes.productInformation}>
                          {ProcessStatus != "New" ? (
                            <Grid>
                              <Grid
                                item
                                xs={12}
                                md={12}
                                sm={12}
                                className="d-flex align-items-center gap-1 quotePanel"
                              >
                                <div className="quoteBox">
                                  <span
                                    className="quoteAmount"
                                    title={totalProfit.fullFormatAmount}
                                  >
                                    {totalProfit.shortFormatAmount}
                                  </span>
                                  <span>Total Profit</span>
                                </div>
                                <div className="quoteBox">
                                  <span
                                    className="quoteAmount"
                                    title={totalcost.fullFormatAmount}
                                  >
                                    {totalcost.shortFormatAmount}
                                  </span>
                                  <span>Total Cost Price</span>
                                </div>
                                {redCard ? (
                                  <div className="redQuoteBox">
                                    <span
                                      className="quoteAmount"
                                      title={totalsale.fullFormatAmount}
                                    >
                                      {totalsale.shortFormatAmount}
                                    </span>
                                    <span>Total Selling Price</span>
                                  </div>
                                ) : (
                                  <div className="quoteBox">
                                    <span
                                      className="quoteAmount"
                                      title={totalsale.fullFormatAmount}
                                    >
                                      {totalsale.shortFormatAmount}
                                    </span>
                                    <span>Total Selling Price</span>
                                  </div>
                                )}
                                <div className="quoteBox">
                                  <span
                                    className="quoteAmount"
                                    title={totalmargin.fullFormatAmount}
                                  >
                                    {totalmargin.shortFormatAmount}
                                  </span>
                                  <span>Total Margin</span>
                                </div>

                                <div></div>
                              </Grid>
                              <div></div>
                            </Grid>
                          ) : null}
                          <>
                            <Tabs
                              className="oms-tab"
                              value={currentTabIndex}
                              onChange={(index, newValue) => {
                                setCurrentTabIndex(newValue);
                              }}
                              indicatorColor="primary"
                              textColor="primary"
                              aria-label="icon tabs example"
                            >
                              <Tab
                                label="Quotes"
                                aria-controls="a11y-tabpanel-0"
                                id="a11y-tab-0"
                              />
                              {ProcessStatus === "Quote Builder" && (
                                <Tab
                                  label="Terms & Conditions"
                                  aria-controls="a11y-tabpanel-1"
                                  id="a11y-tab-1"
                                />
                              )}
                            </Tabs>
                          </>
                          {!loading && quoteData ? (
                            <Grid container className="position-relative">
                              <Grid
                                item
                                xs={12}
                                sm={12}
                                md={12}
                                className="d-flex align-items-center gap-1"
                              >
                                {ProcessStatus === "New" ? (
                                  <span className="productPos m-2">
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
                                  <Grid container>
                                    <Grid item xs={11} md={11} sm={11}>
                                      <FormControl
                                        fullWidth
                                        className={classes.formControl}
                                      >
                                        <InputLabel id="demo-mutiple-chip-label">
                                          Visible Columns in Quote
                                        </InputLabel>
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
                                                <Chip
                                                  key={value}
                                                  label={value}
                                                  className={classes.chip}
                                                />
                                              ))}
                                            </div>
                                          )}
                                          MenuProps={MenuProps}
                                        >
                                          {ColumnName.map((name) => (
                                            <MenuItem
                                              key={name}
                                              value={name}
                                              style={getStyles(
                                                name,
                                                visibleColumns,
                                                theme
                                              )}
                                            >
                                              <Checkbox
                                                checked={
                                                  visibleColumns.indexOf(name) > -1
                                                }
                                              />
                                              {name}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                ) : null}
                                {(ProcessStatus === "DOA Process" &&
                                  versionStatus === "Building Quote") ||
                                  (ProcessStatus === "Send To Customer" &&
                                    versionStatus !== "Sent to Customer") ? (
                                  <div className="w-100 d-flex align-items-center justify-content-end doaAction">
                                    {!ifQuoteApproved().approved && (
                                      <Button
                                        onClick={() => handleCases()}
                                        disabled={(!DOAreq && !Customerreq) || loading}
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
                                    onClick={() => createImagePDF(true, false)}
                                    variant="outlined"
                                    size="small"
                                    className="mr-1"
                                    startIcon={<AiOutlineEye />}
                                    color="primary"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      createImagePDF(false, false);
                                      exportToCSV();
                                    }}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<FiDownloadCloud />}
                                    color="primary"
                                  >
                                    Download
                                  </Button>
                                </span>
                              ) : null}
                              <Grid item xs={12} sm={12} md={12} className="mt-2">
                                {ProcessStatus === "Quote Builder" &&
                                  currentTabIndex === 0 &&
                                  visibleColumns.length > 0 ? (
                                  <ProductGrid
                                    productBuilderId={productBuilderID}
                                    refreshProducts={refreshProducts}
                                    columnsData={visibleColumns}
                                    currency={quoteData.currency}
                                    isAll={false}
                                  />
                                ) : currentTabIndex === 0 ? (
                                  <ProductBuilder
                                    productBuilderId={productBuilderID}
                                    isAddNewProduct={isAddNewProduct}
                                    setIsAddNewProduct={setIsAddNewProduct}
                                    isAddExistingProduct={isAddExistingProduct}
                                    setIsAddExistingProduct={setIsAddExistingProduct}
                                    refreshProducts={refreshProducts}
                                    stage={ProcessStatus === "New" ? "product" : "cost"}
                                    Editable={
                                      ProcessStatus === "Price Builder" ||
                                        ProcessStatus === "New"
                                        ? true
                                        : false
                                    }
                                  />
                                ) : null}
                                {ProcessStatus === "Quote Builder" &&
                                  currentTabIndex === 1 ? (
                                  <Box className="m-3">
                                    <div className="position-relative">
                                      <h4
                                        className="form-label-style"
                                        title="Add Terms & Conditions"
                                      >
                                        Terms & Conditions
                                      </h4>
                                      <Button
                                        onClick={() => setShowCreateDialog(true)}
                                        variant="contained"
                                        size="small"
                                        color="primary"
                                        className={classes.termsBtn}
                                        startIcon={<AddIcon />}
                                      >
                                        Add Terms & Conditions
                                      </Button>
                                    </div>
                                    <CustomAgGrid
                                      columns={columnsTNC}
                                      dataRows={dataRowsTNC}
                                      frameworkComponents={frameworkComponents}
                                      setGridApi={setTNCGridApi}
                                      dispatch={dispatch}
                                      rowCount={rowCountTNC}
                                      limit={limit}
                                      pageSizes={pageSizes}
                                      page={page}
                                      actionWidth={150}
                                      allowSelection={true}
                                      allowAction={false}
                                      isClientSideGrid={true}
                                    />
                                  </Box>
                                ) : null}
                              </Grid>
                            </Grid>
                          ) : null}
                        </div>
                      </Paper>
                    </TabPanel>
                  </>
                  )}
                </>
              )}
            </Paper >

          </Grid >
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Paper>
              {!quoteData ? (
                <Box>
                  <Skeleton variant="text" width="100px" height="25px" />
                  <Box marginY={1} />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width="100%" height="50px" />
                  ))}
                </Box>
              ) : (
                <div>
                  <Activity
                    relatedTo={[
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
                        type: "opportunity",
                        referenceId: quoteData?._id,
                        access: true,
                      },
                    ]}
                    handleActivityRefresh={() => { }}
                    emails={contactsEmailsData}
                  />
                </div>
              )}
            </Paper>
          </Grid>
        </Grid >

        {
          showConfirmBox ? (
            <ConfirmationDialog
              open={showConfirmBox}
              message={`Are you sure you want to delete this Quote?`}
              onClose={() => setShowConfirmBox(false)}
              onOk={handleDeleteQuote}
            />
          ) : null}

        {
          openUpdateDialog && (
            <ManageQuoteDialog
              open={openUpdateDialog}
              onSuccess={() => {
                setOpenUpdateDialog(false);
                fetchQuoteData(currentVersion);
              }}
              onClose={() => {
                setOpenUpdateDialog(false);
              }}
              isNew={false}
              dataToUpdate={quoteData}
              resource={null}
              isRedirectTodetailPage={false}
              contactId={null}
              opportunityId={null}
              disableOwnerDropDown={true}
              disableCurrency={true}
            // qbApi={qbApi}
            />
          )
        }

        {
          showCreateDialog && (
            <ManageTermsAndCondition
              termsAndCondition={termsAndCondition}
              open={showCreateDialog}
              handleClose={handleCloseCreateDialog}
              fetchData={fetchTermsAndConditions}
              editRecord={editRecordTNC}
            />
          )
        }

        {
          sendEmail && (
            <Dialog
              open={sendEmail}
              fullScreen={isMobile || isTablet}
              TransitionComponent={CustomDialogTransition}
              aria-labelledby="customized-dialog-title"
              maxWidth="md"
              onClose={() => setSendEmail(false)}
              fullWidth
            >
              <CreateEmail
                handleClose={() => setSendEmail(false)}
                fetchData={onSuccess}
                id={id}
                version={currentVersion}
                // account={quoteData.customerAccountName}
                isQuoteBuilder={true}
                // users={quoteData.collaborator}
                options={userEmails?.to}
                cc={userEmails?.cc ?? []}
                emailId={null}
                qouteBuilderAttachments={attachments}
                subject={`${user?.user?.brandName ?? "Brand"} Offer - ${quoteData?.quoteName ?? ""
                  }`}
              />
            </Dialog>
          )
        }

        {
          messageDialog.open && (
            <MessageDialog
              open={messageDialog.open}
              onClose={() => {
                setMessageDialog({ open: false, message: null });
              }}
              message={messageDialog.message}
            />
          )
        }

        {
          showVersionsDialog && (
            <CustomDialogComponent
              title="All Version Status"
              open={showVersionsDialog}
              onClose={() => {
                setShowVersionsDialog(false);
              }}
            >
              <div style={{ maxHeight: 500, width: "100%" }}>
                <DataGrid
                  components={{
                    NoRowsOverlay: CustomDataGridNoDataFound,
                  }}
                  autoHeight
                  rows={versionStatusData.data}
                  columns={versionStatusData.columns}
                  disableSelectionOnClick
                  disableMultipleSelection
                  disableColumnFilter
                  hideFooter
                />
              </div>
            </CustomDialogComponent>
          )
        }
      </Layout >
    </>
  );
}

export default QuoteDetail;
