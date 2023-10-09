import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  makeStyles,
  FormControl,
  Checkbox,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  Typography,
  Menu,
  MenuItem
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useMemo, useState } from 'react';
import { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { BiLayerPlus, BiMailSend } from 'react-icons/bi';
import { FiDownloadCloud } from 'react-icons/fi';
import { GiVintageRobot, GiProfit } from 'react-icons/gi';
import { AiFillEdit, AiFillPlusCircle, AiOutlineEye } from 'react-icons/ai';
import { HiPencil } from 'react-icons/hi';
import axiosInstance from '../../../../axios/axiosInstance';
import Loader from '../../../../components/Loader';
import ProductBuilder from '../../../../components/productBuilder';
import {
  currencyCodeToSymbol,
  CustomDialogTransition,
  customerAccount,
  customerContact,
  formatAmountWithCurrency,
  opportunity,
  quote,
  QUOTE_PROCESS_STATUS,
  quoteBuilder,
  sidebarResource,
  supplierAccount
} from '../../../../constants/helpers';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';
import Steps from './Steps';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx-js-style';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import CustomDialogContent from '../../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import PerformanceTuningImg from '../../../../assets/PerformanceTuning.png';
import { CreateEmail } from '../../../../components/Activity/Email/CreateEmail';
import MessageDialog from '../../../../components/Helpers/MessageDialog';
import ColumnsDialog from './ColumnsDialog';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useData } from '../../../../StateProvider/Provider';
import DOAReasonDialog from '../../../DOA/DOAReasonDialog';
import { camelCase, isEqual, startCase } from 'lodash';
import { VscVersions } from 'react-icons/vsc';
import { MdDelete } from 'react-icons/md';
import { AiOutlineFileExcel, AiOutlineFilePdf } from 'react-icons/ai';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import CustomDialogFooter from '../../../../components/CustomDialog/CustomDialogFooter';
import CustomButton from '../../../../components/Helpers/CustomButton';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { stepIconInterface } from 'src/components/Steps/icons';
import PreviewDownload from 'src/components/PreviewDownload';

interface StepInterface extends stepIconInterface {
  key: string;
  label: string;
  name: string;
  title: string;
}

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    paddingRight: '15px'
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  chip: {
    margin: 2
  },
  noLabel: {
    marginTop: theme.spacing(3)
  },
  bgProduct: {
    background: '#f5f5f5 !important',
    paddingBottom: '0',
    border: '1px solid #163340',
    borderTop: '0px',
    borderBottom: 'none',
    boxShadow: 'none',
    borderRadius: '0'
  },
  productInformation: {
    background: 'white',
    padding: '9px',
    borderRadius: '3px',
    border: '1px solid #163340'
  },
  termsBtn: {
    position: 'absolute',
    top: '-16px',
    right: '0'
  },
  detailBox: {
    border: '1px solid #163340'
  },
  btnHeader: {
    position: 'absolute',
    top: '4px',
    right: '20px'
  }
}));

const DOASteps: StepInterface[] = [
  {
    key: 'New',
    label: 'Product Builder',
    name: 'New',
    title: 'Build',
    icon: 'add'
  },
  {
    key: 'Price Builder',
    label: 'Price Builder',
    name: 'Price Builder',
    title: 'Price',
    icon: 'priceBuilder'
  },
  {
    key: 'Quote Builder',
    label: 'Quote Builder',
    name: 'Quote Builder',
    title: 'Quote',
    icon: 'quoteBuilder'
  },
  {
    key: 'DOA Process',
    label: 'DOA Process',
    name: 'DOA Process',
    title: 'DOA Process',
    icon: 'doa'
  },
  {
    key: 'Send To Customer',
    label: 'Send To Customer',
    name: 'Send To Customer',
    title: 'Send',
    icon: 'sendToCustomer'
  },
  {
    key: 'End',
    label: 'End',
    name: 'End',
    title: 'Close',
    icon: 'closed'
  }
];

const OtherSteps: StepInterface[] = [
  {
    key: 'New',
    label: 'Product Builder',
    name: 'New',
    title: 'Build',
    icon: 'add'
  },
  {
    key: 'Price Builder',
    label: 'Price Builder',
    name: 'Price Builder',
    title: 'Price',
    icon: 'priceBuilder'
  },
  {
    key: 'Quote Builder',
    label: 'Quote Builder',
    name: 'Quote Builder',
    title: 'Quote',
    icon: 'quoteBuilder'
  },
  {
    key: 'Send To Customer',
    label: 'Send To Customer',
    name: 'Send To Customer',
    title: 'Send',
    icon: 'sendToCustomer'
  },
  {
    key: 'End',
    label: 'End',
    name: 'End',
    title: 'Close',
    icon: 'closed'
  }
];

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function QuoteProcess(props) {
  const {
    state,
    dispatch,
    quoteData,
    processStatus,
    allowedToEdit,
    ifQuoteApproved,
    currentVersion,
    handleChangeVersion,
    productBuilderId,
    versionStatus,
    fetchQuoteData,
    columnView,
    columnViewExcel,
    handleOpenUpdateDialog,
    fetchTNC,
    handleVersionUpdate,
    updatingVersion,
    globalLoading,
    setShowTotalSalesDialog,
    showTotalSalesDialog,
    DOAlimit,
    DOAsetup
  } = props;

  const defaultSelectColumns = [
    'Product Description',
    'Unit',
    'Qty',
    `Sales Price Per Unit ${quoteData?.currency}`,
    `Total Sales Price ${quoteData?.currency}`
  ];

  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const { qbResource, qbApi } = quoteBuilder;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const history = useHistory();

  const [quoteCurrency] = useState(quoteData?.currency);
  const [nextStep, setNextStep] = useState(false);
  const [prevStep, setPrevStep] = useState(true);
  const [redCard, setRedCard] = useState(false);
  const [totalProfit, setTotalProfit] = useState({
    shortFormatAmount: '',
    fullFormatAmount: '',
    fullFormatAmountWithCurrencyName: ''
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalcost, setTotalCost] = useState({
    shortFormatAmount: '',
    fullFormatAmount: '',
    fullFormatAmountWithCurrencyName: ''
  });
  const [totalsale, setTotalSale] = useState({
    shortFormatAmount: '',
    fullFormatAmount: '',
    fullFormatAmountWithCurrencyName: ''
  });
  const [totalmargin, setTotalMargin] = useState({
    shortFormatAmount: '',
    fullFormatAmount: '',
    fullFormatAmountWithCurrencyName: ''
  });

  const [DOAreq, setDOAreq] = useState(false);
  const [DOAneeded, setDOAneeded] = useState(false);
  const [Customerreq, setCustomerreq] = useState(true);
  const [DOAData, setDOAData] = useState(null);
  const [DOAApproved, setDOAApproved] = useState(false);
  const [DOARequestId, setDOARequestId] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(defaultSelectColumns);
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState(defaultSelectColumns);
  const [ColumnName, setColName] = useState([]);
  const [dynamicTableData, setDynamicTableData] = useState([]);
  const [isRearrangeColumns, setRearrangeColumns] = useState(false);
  const [isRearrangeColumnsExcel, setRearrangeColumnsExcel] = useState(false);
  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfFileBase64, setPdfFileBase64] = useState(null);
  const [excelFileBase64, setExcelFileBase64] = useState(null);
  const [generatingPdfFile, setGeneratingFile] = useState(false);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [sendEmail, setSendEmail] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [viewDownloadLoading, setViewDownloadLoading] = useState(false);
  const [showPDFArrangeColumns, setShowPDFArrangeColumns] = useState(false);
  const [showExcelArrangeColumns, setShowExcelArrangeColumns] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [columns, setColumnData] = useState([]);

  const [sendToLoading, setSendToLoading] = useState(false);

  const [messageDialog, setMessageDialog] = useState({ open: false, message: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (currentVersion !== 0) {
      fetchDOAData();
    }
  }, [currentVersion, DOAreq, DOAneeded]);

  useEffect(() => {
    dispatch({ type: 'selection', selectedRecords: quoteData?.versions[currentVersion]?.TNC });
    axiosInstance()
      .get(`/doa-request`)
      .then(({ data: { data } }) => {
        let rows = data.map((doa) => ({
          ...doa,
          name: doa.DOAName,
          quotedBy: doa.QuotedBy.firstName,
          quoteById: doa.QuotedBy.id,
          requestedBy: doa.RequestedBy.firstName,
          requestedById: doa.RequestedBy.id
        }));
        if (data.length !== 0) {
          axiosInstance()
            .get(`/doa-request/can-i-approve/${quoteData._id}/${currentVersion}`)
            .then(({ data: { data } }) => {
              setDOAApproved(data.canApprove);
              setDOARequestId(data.requestId);
            })
            .catch((err) => {
              // toastConfig.setToastConfig(err);
            });
        }
      })
      .catch((error) => {
        //   toastConfig.setToastConfig(error);
      });
  }, [currentVersion]);

  useEffect(() => {
    setVisibleColumns(columnView && columnView.length ? columnView : defaultSelectColumns);
    setVisibleColumnsExcel(columnViewExcel && columnViewExcel.length ? columnViewExcel : defaultSelectColumns);
  }, [columnView]);

  useEffect(() => {
    fetchUserEmails();
    if (processStatus === QUOTE_PROCESS_STATUS.doaProcess) {
      const currentVersionStatus = quoteData?.versions[currentVersion]?.status;
      if (currentVersionStatus.includes('Accepted')) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    }
    if (processStatus === QUOTE_PROCESS_STATUS.sendToCustomer) {
      if (ifQuoteApproved.approved || quoteData?.versions[currentVersion]?.offered) {
        setNextStep(true);
      }
    }
  }, [quoteData]);

  useEffect(() => {
    if (DOAsetup) {
      axiosInstance()
        .get(`/productbuilder/getproduct/` + productBuilderId)
        .then(({ data }) => {
          let tempProductData = data.data;
          data = data.data?.product?.map((u, index) => ({
            ...u,
            id: u._id,
            index: index + 1,
            // productTemplateDisplayValue: u.productTemplate?.optionLabel,
            productCategoryDisplayValue: u.productCategory?.optionLabel,
            priceTemplateDisplayValue: u.priceTemplate?.optionLabel
          }));
          const { totalSellingPrice } = productCalculationForDoa(tempProductData);

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
          if (DOAsetup && totalSellingPrice > DOAlimit && versionStatus === 'Building Quote') {
            setDOAreq(true);
            setCustomerreq(false);
          } else if (versionStatus.includes('Rejected by DOA')) {
            setDOAreq(true);
            setCustomerreq(false);
          } else if (versionStatus === 'Sent for DOA') {
            setDOAreq(false);
            setCustomerreq(false);
          } else if (
            versionStatus === 'Sent to Customer' ||
            versionStatus === 'Accepted by Customer' ||
            versionStatus === 'Rejected by Customer' ||
            versionStatus === 'Not Booked by Customer' ||
            versionStatus === 'Others' ||
            versionStatus === 'Booked by Customer'
          ) {
            setDOAreq(false);
            setCustomerreq(false);
          }
        });
    }
  }, [DOAsetup, DOAlimit]);

  const fetchDOAData = () => {
    if ((processStatus === QUOTE_PROCESS_STATUS.doaProcess && DOAneeded) || (versionStatus.includes('Rejected by DOA') && processStatus === 'End')) {
      axiosInstance()
        .get(`doa-request/doaFlow/${quoteData._id}/${currentVersion}`)
        .then(({ data: { data } }) => {
          setDOAData(data.reverse());
        })
        .catch((err) => {
          setDOAData(null);
        });
    }
  };

  const defaultTotalValue = useMemo(() => {
    let result = '0';
    if (quoteData && quoteData?.currency) {
      result = `${currencyCodeToSymbol(quoteData.currency)} 0`;
    }
    return result;
  }, [quoteData]);

  const productCalculationForDoa = (BuilderData) => {
    const inventory: { fieldName: string; fieldValue: any }[][] = [];
    const ignoredKeys = ['fields', '_id', 'productId', 'templateFields', 'id', 'string', 'index'];

    let totalCost = 0;
    let totalSellingPrice = 0;
    let totalMargin = 0;
    let totalProfit = 0;

    let tempBuilderData = BuilderData.product?.map((data) => ({
      ...data,
      [`profitPercentPerUnit`]:
        data['profitPercentPerUnit'] === null || data['profitPercentPerUnit'] === undefined ? 0 : data['profitPercentPerUnit'],
      [`commissionPercentPerUnit`]:
        data['commissionPercentPerUnit'] === null || data['commissionPercentPerUnit'] === undefined ? 0 : data['commissionPercentPerUnit'],
      [`totalCostPerUnit_${quoteData.currency.toLowerCase()}`]:
        data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`] === null ||
        data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`] === undefined
          ? 0
          : data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`]
    }));

    const fieldArray = [];
    BuilderData.productFields?.map((data) => fieldArray.push(data));
    BuilderData.priceTemplate?.map((data) => data['fields'].map((d) => fieldArray.push(d)));
    BuilderData.productTemplate?.map((data) => data['fields'].map((d) => fieldArray.push(d)));
    let colName = [];
    let dynamicTable = [];
    let requiredValuesData = [];

    const filterKeys = ['priceTemplate', 'productTemplate', 'productCategory', 'productImage'];
    tempBuilderData.forEach((quoteRows: { [x: string]: any }, i) => {
      const quoteRowKeys = Object?.keys(quoteRows);
      let inventorydata: { fieldName: string; fieldValue: any }[] = [];

      const labelsWithVal = {};
      const requiredValues = {};

      quoteRowKeys.forEach((key) => {
        if (fieldArray) {
          fieldArray.forEach((data, i) => {
            if (!filterKeys.includes(data.fieldName)) {
              const fieldLabel = data.fieldLabel;
              const fieldName = data.fieldName;
              const required = data.required;
              const labels = [];

              if (data.displayCurrency && data.displayUnits) {
                data.displayCurrency.forEach((cur) => {
                  if (data.displayUnits) {
                    data.displayUnits?.forEach((unit) => {
                      const casedLabel = `${fieldName}_${quoteCurrency.toLowerCase()}`;
                      if (required) {
                        requiredValues[casedLabel] = quoteRows[casedLabel];
                      }
                      if (quoteRows[casedLabel]) {
                        labels.push(`${fieldLabel} ${unit.toUpperCase()} ${cur}`);
                        labelsWithVal[`${fieldLabel} ${unit.toUpperCase()} ${cur}`] = quoteRows[casedLabel];
                      }
                    });
                  } else {
                    const casedLabel = `${fieldName}_${cur.toLowerCase()}`;
                    if (required) {
                      requiredValues[casedLabel] = quoteRows[casedLabel];
                    }
                    if (quoteRows[casedLabel]) {
                      labels.push(`${fieldLabel} ${cur}`);
                      labelsWithVal[`${fieldLabel} ${cur}`] = quoteRows[casedLabel];
                    }
                  }
                });
              } else if (data.displayUnits && !data.displayCurrency) {
                data.displayUnits.forEach((unit) => {
                  const casedLabel = `${fieldName}_${unit.toLowerCase()}`;
                  if (required) {
                    requiredValues[casedLabel] = quoteRows[casedLabel];
                  }
                  if (quoteRows[casedLabel]) {
                    labels.push(`${fieldLabel} ${unit.toUpperCase()}`);
                    labelsWithVal[`${fieldLabel} ${unit.toUpperCase()}`] = quoteRows[casedLabel];
                  }
                });
              } else if (data.displayCurrency) {
                data.displayCurrency.forEach((cur) => {
                  const casedLabel = `${fieldName}_${cur.toLowerCase()}`;
                  if (required) {
                    requiredValues[casedLabel] = quoteRows[casedLabel];
                  }
                  if (quoteRows[casedLabel]) {
                    labels.push(`${fieldLabel} ${cur}`);
                    labelsWithVal[`${fieldLabel} ${cur}`] = quoteRows[casedLabel];
                  }
                });
              } else {
                if (required) {
                  requiredValues[fieldName] = quoteRows[fieldName];
                }
                if (quoteRows[fieldName]) {
                  labels.push(fieldLabel);
                  labelsWithVal[fieldLabel] = quoteRows[fieldName];
                }
              }

              labels.forEach((d) => {
                if (!colName.includes(d)) {
                  colName.push(d);
                }
              });
            }
          });
        }
        requiredValuesData.push(requiredValues);

        if (ignoredKeys.indexOf(key) === -1) {
          let indexkey = key;
          let currency = '';
          if (key.includes('_')) {
            let splitKey = key.split('_');
            key = splitKey[0];
            currency = splitKey[1].toUpperCase();
          }
          if (currency === quoteData?.currency && key === 'totalCost') {
            totalCost = totalCost + quoteRows[indexkey];
          } else if (currency === quoteData?.currency && key === 'totalSalesPrice') {
            totalSellingPrice = totalSellingPrice + quoteRows[indexkey];
          } else if (currency === quoteData?.currency && key === 'totalProfit') {
            totalProfit = totalProfit + quoteRows[indexkey];
          } else if (currency === quoteData?.currency && key === 'totalMargin') {
            totalMargin = totalMargin + quoteRows[indexkey];
          }
        }
      });

      const ungivenValues =
        requiredValuesData.length > 0 &&
        requiredValuesData.filter((d) => {
          const isEmpty = Object.entries(d).filter(([k, v]) => v === undefined || v === null || v === '');

          return isEmpty.length > 0 ? true : false;
        });

      if (DOASteps.findIndex((d) => d?.key === processStatus) === 1 || processStatus === 'Price Builder') {
        let hasPrice = false;
        tempBuilderData.forEach((data) => {
          if (
            data[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] ||
            data[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] !== 'undefined'
          ) {
            hasPrice = true;
          } else {
            hasPrice = false;
          }
        });
        const withZeroQty = tempBuilderData.filter((d) => d.qty === 0);
        let withZeroAmt = [];
        if (hasPrice) {
          withZeroAmt = tempBuilderData.filter((d) => d[`totalSalesPrice_${quoteData?.currency.toLowerCase()}`] === 0);
        }

        // if ((!ungivenValues && ungivenValues.length === 0) || (!withZeroAmt.length && hasPrice && !withZeroQty.length)) {
        //   setNextStep(true);
        // } else {
        //   setNextStep(false);
        // }
      }
      dynamicTable.push(labelsWithVal);
      inventory.push(inventorydata);
    });
    // requiredFieldArray.every(v => v.value === true) ? setNextStep(true) : setNextStep(false)
    // setColName(colName);
    setDynamicTableData(dynamicTable);
    return {
      inventory: inventory,
      totalMargin: totalMargin,
      totalSellingPrice: totalSellingPrice,
      totalCost: totalCost,
      totalProfit: totalProfit
    };
  };

  const generateBase64forFile = (blobData, type) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data = reader.result;
      if (type === 'pdf') {
        setPdfFileBase64(base64data);
      }

      if (type === 'excel') {
        setExcelFileBase64(base64data);
      }
    };
  };

  const refreshProducts = (data) => {
    if (data && Object.keys(data).length !== 0) {
      setRedCard(false);
      const { totalMargin, totalSellingPrice, totalCost, totalProfit } = productCalculationForDoa(data);
      setTotalProfit(formatAmountWithCurrency(quoteData.currency, totalProfit));
      setTotalMargin(formatAmountWithCurrency(quoteData.currency, totalMargin));
      setTotalSale(formatAmountWithCurrency(quoteData.currency, totalSellingPrice));
      setTotalPrice(totalCost);
      setTotalCost(formatAmountWithCurrency(quoteData.currency, totalCost));
      if (totalSellingPrice < totalCost) {
        setRedCard(true);
      }
      setDOAreq(false);
      setCustomerreq(true);
      if (DOAsetup && totalSellingPrice > DOAlimit) {
        setDOAneeded(true);
      } else {
        setDOAneeded(false);
      }
      if (DOAsetup && totalSellingPrice > DOAlimit && versionStatus === 'Building Quote') {
        setDOAreq(true);
        setCustomerreq(false);
      } else if (versionStatus.includes('Rejected by DOA')) {
        setDOAreq(true);
        setCustomerreq(false);
      } else if (versionStatus === 'Sent for DOA') {
        setDOAreq(false);
        setCustomerreq(false);
      } else if (
        versionStatus === 'Sent to Customer' ||
        versionStatus === 'Accepted by Customer' ||
        versionStatus === 'Rejected by Customer' ||
        versionStatus === 'Not Booked by Customer' ||
        versionStatus === 'Others' ||
        versionStatus === 'Booked by Customer'
      ) {
        setDOAreq(false);
        setCustomerreq(false);
      }
    }
  };

  const exportToCSV = (send = false) => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    if (dynamicTableData.length) {
      let newTable = [];
      dynamicTableData.forEach((d, i) => {
        let obj = {};
        visibleColumnsExcel.forEach((col) => {
          if (Array.isArray(d[col]) && d[col].length > 0) {
            if (d[col][0]?.hasOwnProperty('optionLabel')) {
              obj[col] = d[col]?.map((d) => d.optionLabel).join() || '';
            } else {
              obj[col] = d[col]?.join() || '';
            }
          } else if (d[col]?.hasOwnProperty('optionLabel')) {
            obj[col] = d[col]?.optionLabel || '';
          } else {
            obj[col] = d[col] || '';
          }
        });

        newTable.push(obj);
      });

      newTable = newTable.map((row, i) => {
        return {
          'SR No.': i + 1,
          ...row
        };
      });

      const res = newTable.reduce(
        (result, item) => {
          const keys = Object?.keys(item);
          keys.forEach((key) => {
            if (!key.includes(quoteCurrency)) {
              return;
            }
            result[key] = result[key] ? result[key] + item[key] : item[key];
          });
          return result;
        },
        { ['SR No.']: 'Total' }
      );

      Object?.keys(res).forEach((k) => {
        if (k.includes(quoteCurrency)) {
          res[k] =
            res[k] && res[k].toString().split('.')[1] !== undefined && res[k].toString().split('.')[1].length > 4
              ? parseFloat(res[k]).toFixed(4)
              : res[k];
        }
      });

      newTable.push(res);

      const wb = utils.book_new();
      const ws = utils.json_to_sheet(newTable);
      const range = utils.decode_range(ws['!ref']);
      let cs,
        rs: number = range.s.r;
      let ce,
        re: number = range.e.r;

      let wscols = [];

      for (cs = range.s.r; cs <= range.e.c; ++cs) {
        let sCell = utils.encode_cell({ c: cs, r: rs });

        ws[sCell].s = {
          font: {
            name: 'Calibri',
            sz: 12,
            bold: true,
            color: { rgb: 'ffffff' }
          },
          fill: {
            fgColor: { rgb: '02617d' }
          }
        };

        if (sCell !== 'A1') {
          wscols.push({ wch: 20 });
        } else {
          wscols.push({ wch: 6 });
        }
      }

      for (ce = range.e.c; ce >= range.s.r; --ce) {
        let cell = utils.encode_cell({ c: ce, r: re });

        if (ws[cell])
          ws[cell].s = {
            font: {
              name: 'Calibri',
              sz: 12,
              bold: true,
              color: { rgb: 'ffffff' }
            },
            fill: {
              fgColor: { rgb: 'ff6666' }
            }
          };
      }

      Object.keys(ws).forEach((key, i) => {
        if (key === '!cols' || key === '!ref') return;

        if (ws[key]?.s) {
          ws[key].s = {
            ...ws[key]?.s,
            alignment: {
              horizontal: 'left'
            }
          };
        } else {
          if (key.includes('A')) {
            ws[key].s = {
              font: {
                name: 'Calibri',
                sz: 12,
                bold: false,
                color: { rgb: 'ffffff' }
              },
              fill: {
                fgColor: { rgb: '02617d' }
              },
              alignment: {
                horizontal: 'left'
              }
            };
          } else {
            ws[key].s = {
              alignment: {
                horizontal: 'left'
              }
            };
          }
        }
      });

      ws['!cols'] = wscols;
      utils.book_append_sheet(wb, ws);
      const excelBuffer = write(wb, {
        bookType: 'xlsx',
        type: 'array'
      });
      const data = new Blob([excelBuffer], { type: fileType });

      if (send) {
        generateBase64forFile(data, 'excel');
      } else {
        saveAs(data, `Quotation - v${currentVersion}` + fileExtension);
      }
    }
  };

  const QuoteStatusChange = (accepted, signature, comment) => {
    if (DOARequestId) {
      if (accepted !== 'Rejected') {
        axiosInstance()
          .post('/doa-request/doaResponse/' + DOARequestId, { response: 'Accepted' })
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            fetchQuoteData(currentVersion);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setShowQuoteStatusChangeDialog(false);
          });
      } else {
        axiosInstance()
          .post('/doa-request/doaResponse/' + DOARequestId, { response: 'Rejected', comment: comment })
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            fetchQuoteData(currentVersion);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setShowQuoteStatusChangeDialog(false);
          });
      }
    }
  };

  const handleViewPdf = (view = false, download = false) => {
    setViewDownloadLoading(true);
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
                  responseType: 'blob'
                })
                .then(({ data }) => {
                  const file = new Blob([data], { type: 'application/pdf' });
                  const fileURL = URL.createObjectURL(file);
                  const pdfWindow = window.open();
                  pdfWindow.location.href = fileURL;
                  setViewDownloadLoading(false);
                })
                .catch((err) => {
                  setViewDownloadLoading(false);
                  toastConfig.setToastConfig(err);
                });
            } else if (download && data.data.fileName) {
              axiosInstance()
                .get(`user/download?fileName=${data.data.fileName}`, {
                  responseType: 'blob'
                })
                .then(({ data }) => {
                  const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Quotation-${quoteData.quoteName}-v${currentVersion}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  setViewDownloadLoading(false);
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setViewDownloadLoading(false);
                });
            } else {
              setViewDownloadLoading(false);
            }
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setViewDownloadLoading(false);
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setViewDownloadLoading(false);
      });
  };

  const handleCases = () => {
    if (Customerreq) {
      exportToCSV(true);
      if (!pdfFileBase64) {
        setGeneratingFile(true);
        setLoading(true);
        if (quoteData.versions[currentVersion].PDF) {
          axiosInstance()
            .get(`user/download?fileName=${quoteData.versions[currentVersion].PDF}`, {
              responseType: 'blob'
            })
            .then(({ data }) => {
              setGeneratingFile(false);
              const file = new Blob([data], { type: 'application/pdf' });
              generateBase64forFile(file, 'pdf');
              setSendEmail(true);
              setLoading(false);
            })
            .catch((err) => {
              toastConfig.setToastConfig({
                open: true,
                type: 'error',
                message: 'PDF generating error'
              });
              setLoading(false);
              setGeneratingFile(false);
            });
        } else {
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
              axiosInstance()
                .get(`user/download?fileName=${data.data.fileName}`, {
                  responseType: 'blob'
                })
                .then(({ data }) => {
                  setGeneratingFile(false);
                  const file = new Blob([data], { type: 'application/pdf' });
                  generateBase64forFile(file, 'pdf');
                  setSendEmail(true);
                  setLoading(false);
                })
                .catch((err) => {
                  toastConfig.setToastConfig({
                    open: true,
                    type: 'error',
                    message: 'PDF generating error'
                  });
                  setLoading(false);
                  setGeneratingFile(false);
                });
            })
            .catch((err) => {
              toastConfig.setToastConfig({
                open: true,
                type: 'error',
                message: 'PDF generating error'
              });
              setLoading(false);
              setGeneratingFile(false);
            });
          // })
          // .catch((err) => {
          //     setGeneratingFile(false);
          // });
        }
      } else {
        setSendEmail(true);
      }
    }
  };

  const onSendEmailSuccess = () => {
    setSendEmail(false);
    // handleVersionUpdate("", visibleColumns, "Sent to Customer", selectedRecords);
    handleAttachments();
    fetchQuoteData(currentVersion);
  };

  let attachments = [];
  if (pdfFileBase64) {
    attachments.push({
      base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(',') + 1)),
      contentType: pdfFileBase64.split(';')[0].split(':')[1],
      name: `Quotation-${quoteData.quoteName}-v${currentVersion}`
    });
  }
  if (excelFileBase64) {
    attachments.push({
      base64: excelFileBase64.substring(parseInt(excelFileBase64.indexOf(',') + 1)),
      contentType: excelFileBase64.split(';')[0].split(':')[1],
      name: `Quotation-${quoteData.quoteName}-v${currentVersion}`
    });
  }

  const fetchUserEmails = () => {
    let ownerCollaboratorEmails = [];
    if (quoteData?.collaborator && quoteData.collaborator.length) {
      ownerCollaboratorEmails = quoteData.collaborator.filter((o) => o?.email).map((o) => o?.email);
    }
    if (quoteData?.owner?.email) {
      ownerCollaboratorEmails.push(quoteData.owner.email);
    }
    let toEmails = [];
    if (quoteData?.customerContactName && quoteData?.customerContactName.length) {
      toEmails = quoteData?.customerContactName.filter((o) => o?.email).map((o) => o.email);
      setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
    } else {
      axiosInstance()
        .get(`/${customerAccount.accountApi}/related/${quoteData?.customerAccountName?.optionValue}`)
        .then(({ data: { data } }) => {
          let relatedContacts =
            data[sidebarResource[customerContact.contactResource]] && data[sidebarResource[customerContact.contactResource]]['Account_Name']
              ? data[sidebarResource[customerContact.contactResource]]['Account_Name']
              : [];
          if (relatedContacts.length) {
            toEmails = relatedContacts.map((o) => o?.email);
          }
          setUserEmails({
            cc: [...ownerCollaboratorEmails],
            to: [...toEmails]
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
      name: 'Quotation V' + currentVersion,
      fileUrl: '',
      relatedTo: [
        {
          type: quote.quoteResource,
          referenceId: quoteData?._id,
          access: true
        },
        {
          type: quoteData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
          referenceId: quoteData?.customerAccountName ? quoteData?.customerAccountName?.optionValue : quoteData?.supplierAccountName?.optionValue,
          access: false
        },
        {
          type: opportunity.opportunityResource,
          referenceId: quoteData.opportunity?.optionValue,
          access: false
        }
      ]
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

  const findProfitPercentage = (CP, Profit) => {
    let parsedCP = parseInt(CP?.amountWithouCurrencyCode?.replace(/[^0-9]/g, '') ?? 0);
    let profit = parseInt(Profit?.amountWithouCurrencyCode?.replace(/[^0-9]/g, '') ?? 0);
    return ((profit * 100) / parsedCP).toFixed(2);
  };

  const handleSendForDOA = () => {
    setSendToLoading(true);
    axiosInstance()
      .post(`/doa-request/create/${quoteData._id}?version=${currentVersion}`)
      .then(({ data }) => {
        handleVersionUpdate(visibleColumns, visibleColumnsExcel, 'Sent for DOA', state?.selectedRecords);
        fetchQuoteData(currentVersion);
        fetchDOAData();
        setSendToLoading(false);
      })
      .catch((err) => {
        setSendToLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOfferToCustomer = () => {
    setSendToLoading(true);
    axiosInstance()
      .patch(`/quote-builder/send-offer/${quoteData._id}/${currentVersion}`)
      .then(({ data }) => {
        setSendToLoading(false);
        fetchQuoteData(currentVersion);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        setSendToLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <div>
        <Steps
          steps={DOAneeded ? DOASteps : OtherSteps}
          currentStep={
            DOAneeded
              ? DOASteps.findIndex((d) => d?.key === processStatus)
              : processStatus === QUOTE_PROCESS_STATUS.doaProcess
              ? OtherSteps.findIndex((d) => d?.key === QUOTE_PROCESS_STATUS.quoteBuilder)
              : OtherSteps.findIndex((d) => d?.key === processStatus)
          }
          id={quoteData._id}
          version={currentVersion}
          Refresh={fetchQuoteData}
          nextStep={nextStep}
          // nextStep={
          //   processStatus === 'Send To Customer' && (!ifQuoteApproved.approved && !quoteData?.versions[currentVersion]?.offered) ? false :
          //     ['Rejected by Customer', 'Sent for DOA', 'Sent to Customer'].includes(versionStatus) ? true : nextStep
          // }
          isPrevStep={['Rejected by Customer', 'Sent for DOA', 'Sent to Customer'].includes(versionStatus) ? false : prevStep}
          versionStatus={versionStatus}
          loading={loading}
          approvedQuote={ifQuoteApproved}
          handleVersionUpdate={() => {
            handleVersionUpdate(
              visibleColumns,
              visibleColumnsExcel,
              versionStatus === 'Sent for DOA' && !DOAneeded ? 'Sent to Customer' : versionStatus,
              state?.selectedRecords
            );
          }}
          isStepEnded={['End'].includes(processStatus)}
          handleViewPdf={handleViewPdf}
          allowedToEdit={allowedToEdit}
          DOAData={DOAData}
          quoteData={quoteData}
          globalLoading={globalLoading}
          setStepFullScreen={() => setStepFullScreen(true)}
        />
      </div>

      <div className={`pt-[12px] subDetailModule `}>
        <ContentFullScreen
          title={DOASteps.find((d) => d?.key === processStatus).label || ''}
          fullScreen={stepFullScreen}
          setFullScreen={setStepFullScreen}
        >
          {!loading && quoteData ? (
            <Grid container className="position-relative">
              <div className="flex items-center justify-between flex-wrap w-full mx-3 gap-[8px]">
                <div className="flex flex-wrap items-center gap-2">
                  {!ifQuoteApproved.approved && processStatus === QUOTE_PROCESS_STATUS.new && allowedToEdit ? (
                    <>
                      <Tooltip title="Add New Product">
                        <Button
                          variant={isMobile && !isTablet ? 'text' : 'outlined'}
                          className="btn-outline-v1"
                          size="small"
                          startIcon={<AiFillPlusCircle />}
                          color="primary"
                          disabled={!permissions.product?.isCreate}
                          onClick={() => {
                            setIsAddNewProduct(true);
                          }}
                        >
                          {isMobile && !isTablet ? '' : 'Add New Product'}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Add Existing Product">
                        <Button
                          variant={isMobile && !isTablet ? 'text' : 'outlined'}
                          className="btn-outline-v1"
                          size="small"
                          startIcon={<BiLayerPlus />}
                          color="primary"
                          onClick={() => {
                            setIsAddExistingProduct(true);
                          }}
                        >
                          {isMobile && !isTablet ? '' : 'Add Existing Product'}
                        </Button>
                      </Tooltip>
                    </>
                  ) : null}
                  {![QUOTE_PROCESS_STATUS.new, QUOTE_PROCESS_STATUS.priceBuilder].includes(processStatus) && allowedToEdit && (
                    <PreviewDownload
                      resource={sidebarResource.quoteBuilder}
                      referenceId={quoteData?._id}
                      fileName={`${`Quote-${quoteData?.quoteName}-V(${currentVersion})`}`}
                      columns={columns}
                      hideDetailButton={true}
                      isSendEmail={
                        processStatus === QUOTE_PROCESS_STATUS.sendToCustomer &&
                        versionStatus !== 'Send To Customer' &&
                        !ifQuoteApproved.approved &&
                        !quoteData?.versions[currentVersion]?.offered
                          ? true
                          : false
                      }
                      isExcelDownload={true}
                      extraQueryParams={{ uniqueId: quoteData?.versions[currentVersion]?._id }}
                      versionNumber={currentVersion}
                      subject={`${user?.user?.brandName ?? 'Brand'} Offer - ${quoteData?.quoteName ?? ''}`}
                      defaultColumns={[
                        'productName',
                        'unit',
                        'qty',
                        `salesPricePerUnit_${quoteData?.currency?.toLowerCase()}`,
                        `totalSalesPrice_${quoteData?.currency?.toLowerCase()}`
                      ]}
                      handleRefresh={() => {
                        fetchQuoteData(currentVersion);
                      }}
                    />
                  )}
                  {[QUOTE_PROCESS_STATUS.sendToCustomer].includes(processStatus) && (
                    <>
                      <Tooltip title="AI Suggestion">
                        <Button
                          variant={isMobile && !isTablet ? 'text' : 'outlined'}
                          className="btn-outline-v1"
                          size="small"
                          color="primary"
                          startIcon={<GiVintageRobot />}
                          onClick={() => {
                            setShowAiDialog(true);
                          }}
                        >
                          {isMobile && !isTablet ? '' : 'AI Suggestion'}
                        </Button>
                      </Tooltip>
                      {permissions[qbResource]?.isUpdate &&
                        (user?.user?._id === quoteData?.owner?.optionValue ||
                          quoteData?.collaborator?.some((d) => d?.optionValue === user?.user?._id)) && (
                          <Tooltip title="Edit Quote PDF Template">
                            <Button
                              onClick={() => {
                                quoteData?.pDFTemplate.optionValue &&
                                  history.push(
                                    `/quote-pdf-template/detail/${quoteData.pDFTemplate.optionValue}?quote=${quoteData._id}&version=${currentVersion}`
                                  );
                              }}
                              variant={isMobile && !isTablet ? 'text' : 'outlined'}
                              size="small"
                              className="btn-outline-v1"
                              startIcon={isMobile && !isTablet ? '' : <AiFillEdit />}
                              color="primary"
                            >
                              {isMobile && !isTablet ? <AiFillEdit size={20} /> : ''}
                              {isMobile && !isTablet ? '' : 'Quote Template'}
                            </Button>
                          </Tooltip>
                        )}
                    </>
                  )}
                </div>
                {/* Test Code */}
                {processStatus === QUOTE_PROCESS_STATUS.quoteBuilder ? (
                  <span className="d-flex flex-wrap gap-2 align-items-center justify-content-end ml-auto">
                    <Tooltip title="View">
                      <Button
                        onClick={() => {
                          handleViewPdf(true, false);
                        }}
                        variant="outlined"
                        disabled={viewDownloadLoading || updatingVersion}
                        size="small"
                        className="setIconForMobile"
                        startIcon={isMobile && !isTablet ? '' : <AiOutlineEye />}
                        color="primary"
                      >
                        {isMobile && !isTablet ? <AiOutlineEye size={20} /> : ''}
                        {isMobile && !isTablet ? '' : 'View'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Download">
                      <Button
                        disabled={viewDownloadLoading || updatingVersion}
                        onClick={() => {
                          handleViewPdf(false, true);
                          exportToCSV();
                        }}
                        variant="outlined"
                        size="small"
                        className="setIconForMobile"
                        startIcon={isMobile && !isTablet ? '' : <FiDownloadCloud />}
                        color="primary"
                      >
                        {isMobile && !isTablet ? <FiDownloadCloud size={20} /> : ''}
                        {isMobile && !isTablet ? '' : 'Download'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="PDF Columns">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AiOutlineFilePdf />}
                        color="primary"
                        onClick={() => {
                          setShowPDFArrangeColumns(true);
                        }}
                      >
                        {isMobile && !isTablet ? '' : 'PDF Columns'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Excel Columns">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AiOutlineFileExcel />}
                        color="primary"
                        onClick={() => {
                          setShowExcelArrangeColumns(true);
                        }}
                      >
                        {isMobile && !isTablet ? '' : 'Excel Columns'}
                      </Button>
                    </Tooltip>
                  </span>
                ) : null}
                {/* Test Code */}

                {processStatus === QUOTE_PROCESS_STATUS.doaProcess && versionStatus === 'Building Quote' && DOAneeded ? (
                  <div className={`flex flex-wrap items-center ml-auto ${isMobile ? 'actio-pos-quote' : ''}`}>
                    <Button
                      onClick={() => {
                        handleSendForDOA();
                      }}
                      disabled={!allowedToEdit || sendToLoading}
                      startIcon={<BiMailSend />}
                      variant="contained"
                      size="small"
                      color="primary"
                    >
                      {isMobile && !isTablet ? '' : `Send for DOA`}
                    </Button>
                  </div>
                ) : null}

                {processStatus === QUOTE_PROCESS_STATUS.sendToCustomer && versionStatus !== 'Send To Customer' && !ifQuoteApproved.approved ? (
                  <div className={`flex flex-wrap items-center ml-auto ${isMobile ? 'actio-pos-quote' : ''}`}>
                    <span className="d-flex align-items-center justify-content-end ml-3">
                      {!quoteData?.versions[currentVersion]?.offered && (
                        <Button
                          onClick={() => {
                            handleOfferToCustomer();
                          }}
                          disabled={!allowedToEdit || sendToLoading}
                          variant="contained"
                          size="small"
                          color="primary"
                        >
                          {isMobile && !isTablet ? '' : `Process Quote`}
                        </Button>
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
              <Grid item xs={12} sm={12} md={12} className="mt-1">
                {quoteData && !loading && productBuilderId ? (
                  <ProductBuilder
                    fromQuote={true}
                    quoteData={quoteData}
                    permissions={permissions[qbResource]}
                    hasPermission={allowedToEdit}
                    currency={quoteData?.currency.toLowerCase()}
                    productBuilderId={productBuilderId}
                    isAddNewProduct={isAddNewProduct}
                    setIsAddNewProduct={setIsAddNewProduct}
                    isAddExistingProduct={isAddExistingProduct}
                    setIsAddExistingProduct={setIsAddExistingProduct}
                    setColumnForPDFExcel={setColName}
                    setColumnData={setColumnData}
                    refreshProducts={refreshProducts}
                    stage={processStatus === QUOTE_PROCESS_STATUS.new ? 'product' : 'cost'}
                    isPriceBuilder={processStatus === QUOTE_PROCESS_STATUS.priceBuilder}
                    Editable={allowedToEdit && [QUOTE_PROCESS_STATUS.new, QUOTE_PROCESS_STATUS.priceBuilder]?.includes(processStatus) ? true : false}
                    fullScreen={stepFullScreen}
                    processStatus={processStatus}
                    setNextStep={setNextStep}
                  />
                ) : (
                  <Loader style={{ minHeight: 300 }} text="Loading..." />
                )}
              </Grid>
            </Grid>
          ) : null}
        </ContentFullScreen>
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
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title="AI Suggestion"
            onClose={() => {
              setShowAiDialog(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <div className="text-align-center">
              <Typography variant="h4">Under Construction </Typography>
              <img alt="image" src={`${PerformanceTuningImg}`} style={{ height: '300px' }} />
            </div>
          </CustomDialogContent>
        </Dialog>
      )}

      {(isRearrangeColumns || isRearrangeColumnsExcel) && (
        <DndProvider backend={HTML5Backend}>
          <ColumnsDialog
            setColumns={isRearrangeColumns ? setVisibleColumns : setVisibleColumnsExcel}
            columns={isRearrangeColumns ? visibleColumns : visibleColumnsExcel}
            visibleColumns={isRearrangeColumns ? visibleColumnsExcel : visibleColumns} //we need both columns to update quote
            setOpenDialog={isRearrangeColumns ? setRearrangeColumns : setRearrangeColumnsExcel}
            id={quoteData._id}
            version={currentVersion}
            refresh={fetchQuoteData}
            versionStatus={versionStatus}
            selectedTNC={state?.selectedRecords}
            type={isRearrangeColumns ? 'pdf' : 'excel'}
          />
        </DndProvider>
      )}

      {sendEmail && (
        <Dialog
          open={sendEmail}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={() => {
            setSendEmail(false);
            setFullScreen(false);
          }}
          fullWidth
        >
          <CreateEmail
            generatingFile={generatingPdfFile}
            handleClose={() => {
              setSendEmail(false);
              setFullScreen(false);
            }}
            fetchData={onSendEmailSuccess}
            id={quoteData._id}
            showESign={true}
            versionNumber={currentVersion}
            isQuoteBuilder={true}
            options={userEmails?.to}
            cc={userEmails?.cc ?? []}
            emailId={null}
            qouteBuilderAttachments={attachments}
            subject={`${user?.user?.brandName ?? 'Brand'} Offer - ${quoteData?.quoteName ?? ''}`}
            fromQuote={true}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            referenceType="quote"
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
      {showTotalSalesDialog && processStatus !== 'New' && (
        <Dialog
          open={showTotalSalesDialog}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={() => {
            setShowTotalSalesDialog(false);
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title="Quote Summary"
            onClose={() => {
              setShowTotalSalesDialog(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
          />
          <CustomDialogContent>
            <Grid item className="quoteHeader">
              <div className={redCard ? 'quoteBox quoteRed' : 'quoteBox quoteProfit'}>
                <span className="quoteAmount" title={totalProfit.fullFormatAmount}>
                  {totalProfit.fullFormatAmount ? totalProfit.fullFormatAmount : defaultTotalValue}{' '}
                  {totalcost.fullFormatAmount ? `(${findProfitPercentage(totalcost, totalProfit)} %)` : ''}
                </span>
                <div className={'quoteBoxContent'}>
                  <span className={'quoteDetailHeading'}>Total Profit </span>
                </div>
              </div>
              <div className="quoteBox quoteCost">
                <span className="quoteAmount" title={totalcost.fullFormatAmount}>
                  {totalcost.fullFormatAmount ? totalcost.fullFormatAmount : defaultTotalValue}
                </span>
                <div className={'quoteBoxContent'}>
                  <span className={'quoteDetailHeading'}>Total Cost Price </span>
                </div>
              </div>
              {redCard ? (
                <div className="quoteBox quoteRed">
                  <div className={'quoteBoxContent'}>
                    {' '}
                    <span>Total Selling Price </span>
                  </div>
                  <span className="quoteAmount" title={totalsale.fullFormatAmount}>
                    {totalsale.fullFormatAmount ? totalsale.fullFormatAmount : defaultTotalValue}
                  </span>
                </div>
              ) : (
                <div className="quoteBox quoteSale">
                  <span className="quoteAmount" title={totalsale.fullFormatAmount}>
                    {totalsale.fullFormatAmount ? totalsale.fullFormatAmount : defaultTotalValue}
                  </span>
                  <div className={'quoteBoxContent'}>
                    <span className={'quoteDetailHeading'}>Total Selling Price </span>
                  </div>
                </div>
              )}
            </Grid>
          </CustomDialogContent>
        </Dialog>
      )}
      {(showPDFArrangeColumns || showExcelArrangeColumns) && processStatus !== 'New' && (
        <Dialog
          open={showPDFArrangeColumns ? showPDFArrangeColumns : showExcelArrangeColumns}
          aria-labelledby="customized-dialog-title"
          maxWidth="sm"
          onClose={() => {
            setShowPDFArrangeColumns(false);
            setShowExcelArrangeColumns(false);
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title={showPDFArrangeColumns ? `View Columns PDF` : `View Columns Excel`}
            onClose={() => {
              setShowPDFArrangeColumns(false);
              setShowExcelArrangeColumns(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <Grid container justify="space-between" alignItems="center">
              <Grid item xs={11} md={11} sm={11}>
                <FormControl fullWidth className={classes.formControl}>
                  <Autocomplete
                    id="demo-mutiple-chip"
                    disabled={!allowedToEdit}
                    fullWidth
                    size="small"
                    multiple
                    value={showPDFArrangeColumns ? visibleColumns : visibleColumnsExcel}
                    onChange={(e, val) => {
                      if (val.includes('Select All') && ['Select All', ...ColumnName].sort().toString() !== val.sort().toString()) {
                        showPDFArrangeColumns ? setVisibleColumns(ColumnName) : setVisibleColumnsExcel(ColumnName);
                      } else if (['Select All', ...ColumnName].sort().toString() === val.sort().toString()) {
                        showPDFArrangeColumns ? setVisibleColumns([]) : setVisibleColumnsExcel([]);
                      } else {
                        showPDFArrangeColumns ? setVisibleColumns(val) : setVisibleColumnsExcel(val);
                      }
                    }}
                    options={['Select All', ...ColumnName]}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(option, { selected }) => (
                      <React.Fragment>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={
                            (showExcelArrangeColumns &&
                              ['Select All', ...ColumnName].sort().toString() === ['Select All', ...visibleColumnsExcel].sort().toString()) ||
                            (showPDFArrangeColumns &&
                              ['Select All', ...ColumnName].sort().toString() === ['Select All', ...visibleColumns].sort().toString())
                              ? true
                              : selected
                          }
                        />
                        {option}
                      </React.Fragment>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label={showPDFArrangeColumns ? `Visible Columns in Quote PDF` : `Visible Columns in Quote Excel`}
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
                  onClick={() => (showPDFArrangeColumns ? setRearrangeColumns(true) : setRearrangeColumnsExcel(true))}
                >
                  <ImportExportIcon />
                </IconButton>
              </Grid>
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <CustomButton
              loading={loading}
              variant="contained"
              color="primary"
              size="small"
              disabled={showPDFArrangeColumns ? visibleColumns.length === 0 : visibleColumnsExcel.length === 0}
              onClick={(e) => {
                e.preventDefault();
                handleVersionUpdate(visibleColumns, visibleColumnsExcel, versionStatus, state?.selectedRecords);
                setShowPDFArrangeColumns(false);
                setShowExcelArrangeColumns(false);
              }}
            >
              Save
            </CustomButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </>
  );
}
