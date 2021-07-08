import React, {
  useState,
  useEffect,
  useContext,
  useReducer,
  useMemo,
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
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import {
  opportunity,
  quote,
  currencyCodeToSymbol,
  gridLoadingTimeout,
} from "../../constants/helpers";
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

import { AiFillPlusCircle } from "react-icons/ai";
import { BiLayerPlus } from "react-icons/bi";
import { AiOutlineEye } from "react-icons/ai";
import { BiMailSend } from "react-icons/bi";
import { FiDownloadCloud } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { termsAndCondition } from "../../constants/helpers";
import ManageTermsAndCondition from "../TermsAndConditions/ManageTermsAndCondition";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Checkbox from "@material-ui/core/Checkbox";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";
import FormControl from "@material-ui/core/FormControl";
import draftToHtml from "draftjs-to-html";
import Steps from "./Steps";
import { displayDate } from "../../services/util";
import AddIcon from "@material-ui/icons/Add";
import { CreateEmail } from "../../components/Activity/Email/CreateEmail";
import {
  customerAccount,
  sidebarResource,
  supplierAccount,
  yyyyMMDD,
  stepsToIgnoreManualCompleteForOpportunity,
  processFieldName,
  formatAmountWithCurrency,
} from "../../constants/helpers";
import { quoteBuilder } from "../../constants/helpers";
import MessageDialog from "../../components/Helpers/MessageDialog";
import ProductBuilder from "../../components/productBuilder";
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
import { BiFoodMenu } from "react-icons/bi";
import { FaWpforms } from "react-icons/fa";
import { HiPencil } from "react-icons/hi";
import { GiVintageRobot } from "react-icons/gi";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import PerformanceTuningImg from "../../assets/PerformanceTuning.png";
import Loader from "../../components/Loader";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import VersionStatus from "./VersionStatus";
import ColumnsDialog from "./ColumnsDialog";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

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
  limit: 2,
  pageSizes: [2, 4, 6],
  search: "",
  filters: {},
  sorting: [],
  selectedRecords: [],
};

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
    // margin: "10px",
    // border: "1px solid #d9d7d7",
    // borderRadius: "6px"
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
}));

function QuoteDetail() {
  const history = useHistory();
  const location = useLocation();
  const [tabValue, setTabValue] = React.useState(0);
  const handleMainTabChange = (
    event: React.ChangeEvent<{}>,
    newValue: number
  ) => {
    setTabValue(newValue);
  };
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
      rowDrag: true,
      headerName: "Name",
      cellRenderer: "nameRenderer",
    },
  ]);

  const [selectedTnC, setSelectedTnC] = useState([]);
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
  const [quoteFields, setQuoteFields] = useState([]);

  const [mainPoints, setMainPoints] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);

  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
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
  const [dynamicTableData, setDynamicTableData] = useState([]);
  const [ColumnName, setColName] = useState([]);
  const [visibleColumns, setVisibleColumnName] = useState([]);
  const [versionStatus, setversionStatus] = useState("Building Quote");
  const [DOAneeded, setDOAneeded] = useState(false);
  const [isRearrangeColumns, setRearrangeColumns] = useState(false);

  const [dataTNC, setDataTNC] = useState([]);

  const [editRecordTNC, setEditRecordTNC] = useState(null);
  const [DOAreq, setDOAreq] = useState(false);
  const [Customerreq, setCustomerreq] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [buttonMessage, setButtonMessage] = useState("Send to Customer");
  const [columnView, setColumnView] = useState([]);
  const [PDF, setPdf] = useState("");
  const [PDFAttachment, setPdfAttachment] = useState("");
  const theme = useTheme();
  const [nextStep, setNextStep] = useState(true);
  const [redCard, setRedCard] = useState(false);

  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [ProcessStatus, setProcessStatus] = useState("New");

  let logo = null;
  let companyName = "";
  let companyAddress = "";
  const [DOAData, setDOAData] = useState(null);
  const [DOAlimit, setDOALimit] = useState(0);
  const [DOAmaxLimit, setDOAMaxLimit] = useState(0);
  const [DOAsetup, setDOAsetup] = useState(false);
  const [lastUser, setLastUser] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [versionStatusData, setVersionStatusData] = useState({
    columns: [
      {
        field: "versionNumber",
        headerName: "Version #",
        flex: 0.5,
        renderCell: (params: any) => (
          <Link
            title={params.value}
            className="text-truncate link"
            onClick={() => {
              setTabValue(2);
              fetchQuoteData(params.value);
              setcurrentVersion(params.value);
              // setShowVersionsDialog(false);
            }}
          >
            {params.value}
          </Link>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        renderCell: (params: any) => (
          <Link
            title={params.value}
            className="text-truncate link"
            onClick={() => {
              setcurrentVersion(params.row.versionNumber);
              fetchQuoteData(params.row.versionNumber);
              setTabValue(2);
              // setShowVersionsDialog(false);
            }}
          >
            {params.value}
          </Link>
        ),
      },
      {
        field: "comment",
        headerName: "Comment",
        flex: 1,
        renderCell: (params: any) => (
          <Typography title={params.value}>{params.value}</Typography>
        ),
      },
      { field: "totalcost", headerName: "Total Cost", flex: 0.5 },
      {
        field: "totalSalesPrice",
        headerName: "Total Sales Price",
        flex: 0.5,
      },
      // { field: "processStatus", headerName: "ProcessStatus" }
    ],
    data: [],
  });
  // const [allVersionStatusButtonText, setAllVersionStatusButtonText] =
  //   useState("All Version Status");
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [reminderLoading, setReminderLoading] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [updatingVersion, setUpdatingVersion] = useState(false);
  const [generatingPdfFile, setGeneratingFile] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState({
    show: false,
    text: null,
  });
  const [prevVersionTNC, setPrevVersionTNC] = useState([]);
  const [brandQuoteDigitalSignature, setBrandQuoteDigitalSignature] = useState(
    user?.user?.brandQuoteDigitalSignature
  );
  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  let { id } = useParams();

  const [quotePermissions, setquotePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  const defaultTotalValue = useMemo(() => {
    let result = "0";
    if (quoteData && quoteData?.currency) {
      result = `${currencyCodeToSymbol(quoteData.currency)} 0`;
    }
    return result;
  }, [quoteData]);

  const { qbResource, qbApi } = quoteBuilder;

  const [companyDetails, setCompanyDetails] = useState({
    name: "",
    address: "",
  });
  const [base64Logo, setBase64Logo] = useState(null);
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
        id={`main-tabpanel-${index}`}
        aria-labelledby={`main-tab-${index}`}
        {...other}
      >
        {children}
      </div>
    );
  }

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      "aria-controls": `main-tabpanel-${index}`,
    };
  }

  useEffect(() => {
    fetchDoaLimit();

    axiosInstance()
      .get("/user/brandInfo")
      .then(({ data }) => {
        setCompanyDetails({ name: data.data.name, address: data.data.address });
        if (data.data.logo) {
          fetchImage(data.data.logo, function (dataUri) {
            setBase64Logo(dataUri);
          });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setGeneratingPdf({ show: false, text: null });
      });
  }, []);

  useEffect(() => {
    if (currentVersion !== 0) fetchDOAData();
  }, [currentVersion, DOAreq]);

  useEffect(() => {
    if (permissions) {
      setquotePermissions(permissions[qbResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (id) {
      if (location.state !== undefined) {
        setTabValue(location.state?.tabValue);
        fetchQuoteData(parseInt(location.state?.versionNumber));
        setcurrentVersion(parseInt(location.state?.versionNumber));
        getQuoteFields();
      } else {
        fetchQuoteData(0);
        getQuoteFields();
      }
    }
  }, [id]);

  useEffect(() => {
    getVersionStatus();
  }, [quoteData]);

  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  // useEffect(() => {
  //   if (DOAneeded && DOASteps.indexOf(ProcessStatus) > 1) {
  //     createImagePDF(false, true);
  //   } else if (OtherSteps.indexOf(ProcessStatus) > 1) {
  //     createImagePDF(false, true);
  //   }
  // }, [ProcessStatus]);

  /**
   *
   * @param version
   * Fetch quote data with versions
   *
   */
  const fetchQuoteData = (version: any) => {
    if (selectedEntity) {
      if (selectedRecords.length > 0) {
        setTNC(selectedRecords);
      }
      setLoading(true);
      setNextStep(true);
      axiosInstance()
        .get(`${qbApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setCustomizedRoutes([
            { title: "Quote", path: routes.quoteBuilder.path },
            { title: `${data?.quoteName}` },
          ]);

          // handleAllowToEditList(data);
          setQuoteData(data);
          if (data?.versions) {
            let lastVersionData = data?.versions[currentVersion - 1];
            if (lastVersionData && lastVersionData.TNC) {
              setPrevVersionTNC(lastVersionData.TNC.map((o) => o._id));
            }
          }

          let modifiedData = {};
          Object.assign(modifiedData, data);
          modifiedData["estimatedAmount"] = formatAmountWithCurrency(
            modifiedData["currency"],
            modifiedData["estimatedAmount"]
          ).shortFormatAmount;

          modifiedData["invoiceAmount"] = formatAmountWithCurrency(
            modifiedData["currency"],
            modifiedData["invoiceAmount"]
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
            if (data.versions[keys[keys.length - 1]].PDF) {
              setPdf(data.versions[keys[keys.length - 1]].PDF);
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
          setQuoteFields(data);

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
        setEditRecordTNC(params.data);
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
      // gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${termsAndCondition.api}?limit=0`)
      .then(({ data: { data, count } }) => {
        let selectedRows = [];
        let rows = data.map((tnc, i) => {
          if (selectedTnC.indexOf(tnc._id) >= 0) {
            selectedRows.push(tnc);
          }
          return {
            ...tnc,
            id: tnc._id,
            name: tnc.TACName,
          };
        });
        dispatch({
          type: "initialize",
          data: rows,
          count: count,
        });
        dispatch({ type: "selection", selectedRecords: selectedRows });
        setDataTNC(data);
        setTimeout(() => {
          dispatch({ type: "loading", loadingTNC: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: "loading", loadingTNC: false });
      });
  };

  const fetchUserEmails = (quoteData) => {
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

  const createImagePDF = (view, send, base64 = false) => {
    setGeneratingPdf({ show: true, text: "Generating..." });
    GeneratePdf(view, send, base64);

    // axiosInstance()
    //   .get("/user/brandInfo")
    //   .then(({ data }) => {
    //     companyName = data.data.name;
    //     companyAddress = data.data.address;
    //     if (data.data.logo) {
    //       fetchImage(data.data.logo, function (dataUri) {
    //         logo = dataUri;
    //         GeneratePdf(view, send, base64);
    //       });
    //     } else {
    //       GeneratePdf(view, send, base64);
    //     }
    //   })
    //   .catch((err) => {
    //     toastConfig.setToastConfig(err);
    //     setGeneratingPdf({ show: false, text: null });
    //   });
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

  const GeneratePdf = (view, send, base64 = false) => {
    const PdfDoc = new jsPDF("p", "pt", "a4");
    let date = new Date();

    const pagewidth = PdfDoc.internal.pageSize.width;

    if (base64Logo !== null) {
      PdfDoc.addImage(base64Logo, "JPEG", pagewidth - 65, 10, 40, 40);
    }
    PdfDoc.setFontSize(26);
    PdfDoc.text(companyDetails.name, 20, 30);
    PdfDoc.setFontSize(12);
    PdfDoc.text(companyDetails.address, 20, 50);
    PdfDoc.setLineWidth(3);
    PdfDoc.line(15, 70, 260, 70);
    PdfDoc.line(330, 70, 580, 70);
    PdfDoc.setFontSize(14);
    PdfDoc.text("Quotation", 265, 75);
    let PDFData = [];
    let PdfCol = ["Item #"];
    let serialNumber = 1;
    dynamicTableData.forEach((dataEntry) => {
      let PdfRow = [serialNumber];
      visibleColumns.forEach((ColName, idx) => {
        if (idx < 6) {
          if (ColumnName.indexOf(ColName) !== -1) {
            if (PdfCol.indexOf(ColName) === -1) {
              PdfCol.push(ColName);
            }
            PdfRow.push(dataEntry[ColName]);
          }
        }
      });
      PDFData.push(PdfRow);
      serialNumber = serialNumber + 1;
    });

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

    if (selectedRecords.length || TandC.length) {
      let selecteTNCData = selectedRecords.length > 0 ? selectedRecords : TandC;
      PdfDoc.setDrawColor(0, 0, 0);
      PdfDoc.setFontSize(14);
      PdfDoc.setLineWidth(3);
      PdfDoc.line(15, finalY + 20, 580, finalY + 20);

      let finalmarkup = "";

      selecteTNCData.forEach((selectTNC) => {
        finalmarkup =
          finalmarkup + `<h3><strong>${selectTNC.TACName}:</strong></h3>`;
        let state = convertFromRaw(JSON.parse(selectTNC.description));
        let TNC = EditorState.createWithContent(state);
        let markup = draftToHtml(convertToRaw(TNC.getCurrentContent()));

        finalmarkup = finalmarkup + markup + "<br>";
      });

      // finalmarkup = finalmarkup.replaceAll(" ", "&nbsp;");
      finalmarkup = finalmarkup.replaceAll(
        "<p>",
        "<p style='overflow-wrap:break-word;word-wrap:break-word;'>"
      );
      // finalmarkup = finalmarkup.replaceAll("</p>", "</p>");

      let signatureContent =
        "<br><br><span--style='font-size:10px;'>Note:</span><br>";
      signatureContent =
        signatureContent +
        `<span--style='font-size:10px;'>Thanks for your business</span><br><br>`;

      signatureContent =
        signatureContent +
        `<span--style='font-size:10px'>Customer Signature</span><br><br><br><br>`;
      signatureContent =
        signatureContent +
        `<span--style='color:lightgrey'>__________________________</span>`;

      signatureContent = signatureContent.replaceAll(" ", "&nbsp;");
      signatureContent = signatureContent.replaceAll("--", " ");

      finalmarkup = finalmarkup + signatureContent;

      PdfDoc.html(`<div style='width:520px;'>${finalmarkup}</div>`, {
        callback: function (doc) {
          if (view && !send) {
            doc.setProperties({
              title: `Quotation-${quoteData.quoteName}-v${currentVersion}`,
            });
            const pdfBlobFile = doc.output("blob");
            generateBase64forFile(pdfBlobFile, "pdf");

            window.open(URL.createObjectURL(pdfBlobFile));
          } else if (!view && !send && !base64) {
            doc.save(`Quotation-${quoteData.quoteName}-v${currentVersion}`);
          } else if (base64) {
            doc.setProperties({
              title: `Quotation-${quoteData.quoteName}-v${currentVersion}`,
            });
            const pdfBlobFile = doc.output("blob");
            generateBase64forFile(pdfBlobFile, "pdf");
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
                setPdf(data.fieldName);
                handleVersionUpdate(data.fileName, visibleColumns, "", TandC);
                setPdfAttachment(data.fileName);
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
      finalY = finalY + 40;
      PdfDoc.setFontSize(10);
      PdfDoc.text("Note:", 20, finalY);

      finalY = finalY + 15;
      PdfDoc.text("Thanks for your business", 20, finalY);

      finalY = finalY + 50;
      PdfDoc.text("Customer Signature", 20, finalY);

      finalY = finalY + 75;
      PdfDoc.line(15, finalY, 260, finalY);

      if (view && !send) {
        PdfDoc.setProperties({
          title: `Quotation-${quoteData.quoteName}-v${currentVersion}`,
        });
        const pdfBlobFile = PdfDoc.output("blob");
        generateBase64forFile(pdfBlobFile, "pdf");

        window.open(URL.createObjectURL(pdfBlobFile));
      } else if (!view && !send && !base64) {
        PdfDoc.save(`Quotation-${quoteData.quoteName}-v${currentVersion}.pdf`);
      } else if (base64) {
        PdfDoc.setProperties({
          title: `Quotation-${quoteData.quoteName}-v${currentVersion}`,
        });
        const pdfBlobFile = PdfDoc.output("blob");
        generateBase64forFile(pdfBlobFile, "pdf");
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
            setPdfAttachment(data.fileName);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }
    }

    setTimeout(() => {
      setGeneratingPdf({ show: false, text: null });
    }, 1500);
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
      .post("doa-request/limit", { user: quoteData?.createdBy?.user?._id })
      .then(({ data: { data } }) => {
        setDOAsetup(data.doasetup);
        setDOALimit(data.limit ? data.limit : 0);
        setDOAMaxLimit(data.maxLimit.limit ? data.maxLimit.limit : 0);
        setLastUser(data.lastUser);
      })
      .catch((err) => {
        // toastConfig.setToastConfig(err);
      });
  };

  const fetchDOAData = () => {
    axiosInstance()
      .get(`doa-request/doaFlow/${id}/${currentVersion}`)
      .then(({ data: { data } }) => {
        setDOAData(data.reverse());
      })
      .catch((err) => {
        setDOAData(null);
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
          obj[col] = d[col] || "";
        });

        newTable.push(obj);
      });

      newTable.push({
        "Product Name": "Total:",
        "Total Sales Price": totalsale.fullFormatAmount,
        "Total Cost": totalcost.fullFormatAmount,
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
        history.push(`${routes.quoteBuilder.path}/detail/${data.data._id}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const productBuilderdatatoQuoteBuilderdata = (BuilderData) => {
    if (BuilderData.length) {
      setOptions([]);
      setRedCard(false);
      let optionstoSet = [];

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

  const handleCases = () => {
    if (DOAreq) {
      axiosInstance()
        .post(`/doa-request/create/${id}?version=${currentVersion}`)
        .then(({ data }) => {
          handleVersionUpdate(PDF, visibleColumns, "Sent for DOA", TandC);
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
            `user/download?fileName=${quoteData.versions[currentVersion].PDF}`,
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
        TandC
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

  const handleVersionUpdate = (
    PDFfile,
    Columns,
    versionStatus,
    TC,
    view = false,
    download = false
  ) => {
    let body = {
      acceptedColumns: Columns,
      status: versionStatus,
      TNC: selectedRecords.length > 0 ? selectedRecords : TandC,
    };

    setUpdatingVersion(true);
    axiosInstance()
      .post(`quote-builder/updateVersion/${id}?version=${currentVersion}`, body)
      .then(({ data: { data } }) => {
        setUpdatingVersion(false);

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

  const handleViewPdf = (view = false, download = false) => {
    const pdfFileName = quoteData.versions[currentVersion].PDF;

    if (!pdfFileName) {
      handleVersionUpdate(
        "",
        visibleColumns,
        versionStatus,
        selectedRecords.length > 0 ? selectedRecords : TandC,
        view,
        download
      );
    }
    else {
      if (view) {
        setUpdatingVersion(true);
        axiosInstance()
          .get(
            `user/download?fileName=${quoteData.versions[currentVersion].PDF}`,
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
            `user/download?fileName=${quoteData.versions[currentVersion].PDF}`,
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

  const onSuccess = () => {
    setSendEmail(false);
    handleVersionUpdate("", visibleColumns, "Sent to Customer", TandC);
    handleAttachments();
    fetchQuoteData(currentVersion);
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

    if (PDFAttachment !== "") {
      request.fileUrl = PDFAttachment;
      axiosInstance()
        .post(`/attachment`, request)
        .then(({ data }) => { })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const getVersionStatus = () => {
    // setAllVersionStatusButtonText(gettingVersionStatusText);
    setLoadingVersions(true);
    axiosInstance()
      .get(`/quote-builder/quote-hierarchy/${id}`)
      .then(({ data: { data } }) => {
        // setShowVersionsDialog(true);

        const newData = data.versions.map((d, index) => {
          return {
            ...d,
            id: index + 1,
            comment: d.comment ? d.comment : "",
            totalcost: formatAmountWithCurrency(
              quoteData?.currency,
              d.productData.totalCost
            ).fullFormatAmount,
            totalSalesPrice: formatAmountWithCurrency(
              quoteData?.currency,
              d.productData.totalSalesPrice
            ).fullFormatAmount,
          };
        });

        setVersionStatusData((prevState) => {
          return {
            ...prevState,
            data: newData,
          };
        });

        setLoadingVersions(false);
        // setAllVersionStatusButtonText("All Version Status");
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoadingVersions(false);
        // setAllVersionStatusButtonText("All Version Status");
      });
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

  // if (ProcessStatus !== "Quote Builder" && currentTabIndex === 1) {
  //   setCurrentTabIndex(0);
  // }

  const deleteVersion = () => {
    let versions = quoteData?.versions;

    delete versions[currentVersion];

    setDeletingDOA(true);
    axiosInstance()
      .delete(`${qbApi}/${id}/${currentVersion}`)
      .then(() => {
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
    let disapproved = false;
    let versionApproved = currentVersion;
    let versionDisapproved = currentVersion;
    let manualApproval = false;

    if (quoteData) {
      versions.forEach((v) => {
        if (quoteData.versions[v]?.status.includes("Accepted by Customer") || quoteData.versions[v]?.status.includes("Booked by Customer")) {
          approved = true;
          versionApproved = v;
          manualApproval = quoteData.versions[v]?.customerResponse?.manual;
        }
        if (quoteData.versions[v]?.status.includes("Rejected by Customer") || quoteData.versions[v]?.status.includes("Not Booked by Customer") || quoteData.versions[v]?.status.includes("Invalid by Customer")) {
          disapproved = true;
          versionDisapproved = v;
        }
      });
    }
    return {
      approved,
      versionApproved,
      disapproved,
      versionDisapproved,
      manualApproval,
    };
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

  return (
    <>
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={12} lg={8}>
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
                  mainPoints={{
                    ...mainPoints,
                    "Quote Status": ifQuoteApproved().approved
                      ? ifQuoteApproved().manualApproval
                        ? `End (Accepted By Customer Manually)`
                        : `End (Accepted By Customer)`
                      : "In Progress",
                  }}
                  showHeading={true}
                >
                  {/* <Button
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
                  </Button> */}
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
                  <Tabs
                    className="quote-tab"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        display: "none",
                      },
                    }}
                  >
                    <Tab
                      style={{
                        background: tabValue === 0 ? "#163340" : "",
                        color: tabValue === 0 ? "white" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center font-size-3">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      style={{
                        background: tabValue === 1 ? "#163340" : "",
                        color: tabValue === 1 ? "white" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center font-size-3">
                          <FaWpforms className="mr-1" fontSize="inherit" />{" "}
                          Details
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      style={{
                        background: tabValue === 2 ? "#163340" : "",
                        color: tabValue === 2 ? "white" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center font-size-3">
                          <BiFoodMenu className="mr-1" fontSize="inherit" />{" "}
                          Quote Versions
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                  </Tabs>

                  <TabPanel value={tabValue} index={0}>
                    <VersionStatus
                      loadingVersions={loadingVersions}
                      versionStatusData={versionStatusData}
                    />
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <div className={`position-relative ${classes.detailBox}`}>
                      {quoteData && (
                        <>
                          <div className={classes.btnHeader}>
                            {quotePermissions?.isCreate ? (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                className="mr-1"
                                startIcon={<BiLayerPlus />}
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
                                startIcon={<HiPencil />}
                                onClick={handleOpenUpdateDialog}
                              >
                                Edit
                              </Button>
                            ) : null}
                          </div>
                          {copyOfquoteData ? (
                            <DetailsPage
                              data={copyOfquoteData}
                              fields={
                                !ifQuoteApproved().approved
                                  ? quoteFields.filter(
                                    (_f) =>
                                      _f.fieldData.sectionName !==
                                      "Post-Quote Information"
                                  )
                                  : quoteFields
                              }
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
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
                              <span
                                className="quoteAmount"
                                title={totalProfit.fullFormatAmount}
                              >
                                {totalProfit.shortFormatAmount
                                  ? totalProfit.shortFormatAmount
                                  : defaultTotalValue}
                              </span>
                            </div>
                            <div className="quoteBox">
                              <span>Total Cost Price </span>
                              <span
                                className="quoteAmount"
                                title={totalcost.fullFormatAmount}
                              >
                                {totalcost.shortFormatAmount
                                  ? totalcost.shortFormatAmount
                                  : defaultTotalValue}
                              </span>
                            </div>
                            {redCard ? (
                              <div className="redQuoteBox">
                                <span>Total Selling Price </span>
                                <span
                                  className="quoteAmount"
                                  title={totalsale.fullFormatAmount}
                                >
                                  {totalsale.shortFormatAmount
                                    ? totalsale.shortFormatAmount
                                    : defaultTotalValue}
                                </span>
                              </div>
                            ) : (
                              <div className="quoteBox">
                                <span>Total Selling Price </span>
                                <span
                                  className="quoteAmount"
                                  title={totalsale.fullFormatAmount}
                                >
                                  {totalsale.shortFormatAmount
                                    ? totalsale.shortFormatAmount
                                    : defaultTotalValue}
                                </span>
                              </div>
                            )}
                            {/* <div className="quoteBox noBorder">
                              <span>Total Margin </span>
                              <span
                                className="quoteAmount"
                                title={totalmargin.fullFormatAmount}
                              >
                                {totalmargin.shortFormatAmount
                                  ? totalmargin.shortFormatAmount
                                  : defaultTotalValue}
                              </span>
                            </div> */}
                          </Grid>
                        )}
                        <Grid
                          item
                          xs={ProcessStatus === "New" ? 12 : 12}
                          sm={ProcessStatus === "New" ? 12 : 5}
                          md={ProcessStatus === "New" ? 12 : 5}
                          className="d-flex justify-content-end"
                        >
                          {allowedToEdit && ifQuoteApproved().approved ? (
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
                                    deletingDOA || loading || DOAneeded
                                      ? DOASteps.indexOf(ProcessStatus) > 1
                                      : OtherSteps.indexOf(ProcessStatus) > 1
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
                                  `Clone Version ${currentVersion}`
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
                          id={id}
                          version={currentVersion}
                          Refresh={fetchQuoteData}
                          nextStep={nextStep}
                          versionStatus={versionStatus}
                          loading={loading}
                          approvedQuote={ifQuoteApproved()}
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
                              versionStatus,
                              selectedRecords.length > 0
                                ? selectedRecords
                                : TandC
                            );
                          }}
                        />
                      </div>
                    </Paper>
                  </TabPanel>

                  {tabValue === 2 && (
                    <div
                      className={`mt-0 subDetailModule ${classes.detailBox}`}
                    >
                      {/* <Tabs
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
                      </Tabs> */}
                      {!loading && quoteData ? (
                        <Grid container className="position-relative">
                          <Grid
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            className="d-flex align-items-center gap-1"
                          >
                            {!ifQuoteApproved().approved &&
                              ProcessStatus === "New" ? (
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
                                      fullWidth
                                      size="small"
                                      multiple
                                      value={visibleColumns}
                                      onChange={(e, val) => {
                                        setVisibleColumnName(val);
                                        handleVersionUpdate(
                                          PDF,
                                          val,
                                          versionStatus,
                                          TandC
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
                                {!ifQuoteApproved().approved && (
                                  <Button
                                    onClick={() => handleCases()}
                                    disabled={
                                      (!DOAreq && !Customerreq) || loading
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
                            {quoteData && !loading && productBuilderID ? (
                              ProcessStatus === "Quote Builder" &&
                                visibleColumns.length > 0 ? (
                                <ProductGrid
                                  productBuilderId={productBuilderID}
                                  refreshProducts={refreshProducts}
                                  stage={"cost"}
                                  isAll={false}
                                  columnsData={visibleColumns}
                                  currency={quoteData?.currency}
                                />
                              ) : (
                                <ProductBuilder
                                  fromQuote={true}
                                  permissions={permissions?.quoteBuilder}
                                  hasPermission={allowedToEdit}
                                  currency={quoteData?.currency.toLowerCase()}
                                  productBuilderId={productBuilderID}
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
                                    ProcessStatus === "Price Builder" ||
                                      ProcessStatus === "New"
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
                              <Box className="m-3">
                                <div className="position-relative">
                                  <h4
                                    className="form-label-style"
                                    title="Add Additional Data"
                                  >
                                    Additional Data
                                  </h4>
                                  <Button
                                    onClick={() => setShowCreateDialog(true)}
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    className={classes.termsBtn}
                                    startIcon={<AddIcon />}
                                  >
                                    Add Additional Data
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
                                  allowPagination={false}
                                  selectedRecords={
                                    selectedRecords.length > 0
                                      ? selectedRecords
                                      : TandC
                                  }
                                  loading={loadingTNC}
                                  onSelection={(selectedRecords) => {
                                    setSelectedTnC([
                                      ...selectedRecords.map((o) => o._id),
                                    ]);
                                  }}
                                />
                              </Box>
                            ) : null}
                          </Grid>
                        </Grid>
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={4}>
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
                    restrictedAddActivities={
                      allowedToEdit ? [] : ["Attachment", "Case"]
                    }
                    relatedTo={[
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
                    ]}
                    handleActivityRefresh={() => { }}
                    emails={contactsEmailsData}
                  />
                </div>
              )}
            </Paper>
          </Grid>
        </Grid>

        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this Quote?`}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteQuote}
          />
        ) : null}

        {openUpdateDialog && (
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
            quoteApproved={ifQuoteApproved().approved}
          />
        )}

        {showCreateDialog && (
          <ManageTermsAndCondition
            termsAndCondition={termsAndCondition}
            open={showCreateDialog}
            handleClose={handleCloseCreateDialog}
            fetchData={fetchTermsAndConditions}
            editRecord={editRecordTNC}
            displayTitle={"Additional Data"}

          />
        )}

        {isRearrangeColumns && (
          <DndProvider backend={HTML5Backend}>
            <ColumnsDialog
              setColumns={setVisibleColumnName}
              columns={visibleColumns}
              setOpenDialog={setRearrangeColumns}
              id={id}
              version={currentVersion}
              refresh={fetchQuoteData}
            />
          </DndProvider>
        )}

        {sendEmail && (
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
              generatingFile={generatingPdfFile}
              handleClose={() => setSendEmail(false)}
              fetchData={onSuccess}
              id={id}
              showESign={true}
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

        {showAiDialog && (
          <Dialog
            open={showAiDialog}
            aria-labelledby="customized-dialog-title"
            maxWidth="sm"
            onClose={() => {
              setShowAiDialog(false);
            }}
            fullWidth
            fullScreen={isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
          >
            <CustomDialogHeader
              title="AI Suggestion"
              onClose={() => {
                setShowAiDialog(false);
              }}
            />
            <CustomDialogContent>
              <div className="text-align-center">
                <Typography variant="h4">Under Construction </Typography>
                <img
                  src={`${PerformanceTuningImg}`}
                  style={{ height: "300px" }}
                />
              </div>
            </CustomDialogContent>
          </Dialog>
        )}
      </Layout>
    </>
  );
}

export default QuoteDetail;
