import { Button, Dialog, MenuItem, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiFillEdit } from 'react-icons/ai';
import { BiMailSend } from 'react-icons/bi';
import { GiVintageRobot } from 'react-icons/gi';
import { useHistory } from 'react-router-dom';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { stepIconInterface } from 'src/components/Steps/icons';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../../StateProvider/Provider';
import PerformanceTuningImg from '../../../../assets/PerformanceTuning.png';
import axiosInstance from '../../../../axios/axiosInstance';
import CustomDialogContent from '../../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../../components/CustomDialog/CustomDialogHeader';
import MessageDialog from '../../../../components/Helpers/MessageDialog';
import Loader from '../../../../components/Loader';
import ProductBuilder from '../../../../components/productBuilder';
import {
  CustomDialogTransition,
  QUOTE_PROCESS_STATUS,
  currencyCodeToSymbol,
  customerAccount,
  customerContact,
  formatAmountWithCurrency,
  quoteBuilder,
  sidebarResource
} from '../../../../constants/helpers';
import DOAReasonDialog from '../../../DOA/DOAReasonDialog';
import Steps from './Steps';
import { ThemeButton } from 'src/components/Helpers/Buttons';

interface StepInterface extends stepIconInterface {
  key: string;
  label: string;
  name: string;
  title: string;
}

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

export default function QuoteProcess(props) {
  const {
    state,
    dispatch,
    quoteData,
    processStatus,
    allowedToEdit,
    ifQuoteApproved,
    currentVersion,
    productBuilderId,
    versionStatus,
    fetchQuoteData,
    handleVersionUpdate,
    globalLoading,
    setShowTotalSalesDialog,
    showTotalSalesDialog,
    DOAlimit,
    DOAsetup
  } = props;

  const toastConfig = useContext(CustomToastContext);
  const { qbResource } = quoteBuilder;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const history = useHistory();

  const [quoteCurrency] = useState(quoteData?.currency);
  const [nextStep, setNextStep] = useState(false);
  const [prevStep, setPrevStep] = useState(true);
  const [redCard, setRedCard] = useState(false);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });

  const [totalProfit, setTotalProfit] = useState({
    shortFormatAmount: '',
    fullFormatAmount: '',
    fullFormatAmountWithCurrencyName: ''
  });

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

  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState('');
  const [loading, setLoading] = useState(false);

  const [showAiDialog, setShowAiDialog] = useState(false);

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
            .catch((err) => {});
        }
      })
      .catch((error) => {});
  }, [currentVersion]);

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
      }
      dynamicTable.push(labelsWithVal);
      inventory.push(inventorydata);
    });
    return {
      inventory: inventory,
      totalMargin: totalMargin,
      totalSellingPrice: totalSellingPrice,
      totalCost: totalCost,
      totalProfit: totalProfit
    };
  };

  const refreshProducts = (data) => {
    if (data && Object.keys(data).length !== 0) {
      setRedCard(false);
      const { totalMargin, totalSellingPrice, totalCost, totalProfit } = productCalculationForDoa(data);
      setTotalProfit(formatAmountWithCurrency(quoteData.currency, totalProfit));
      setTotalMargin(formatAmountWithCurrency(quoteData.currency, totalMargin));
      setTotalSale(formatAmountWithCurrency(quoteData.currency, totalSellingPrice));
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
        handleVersionUpdate('Sent for DOA', state?.selectedRecords);
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

  const isAddButtonVisible = useMemo(
    () => !ifQuoteApproved.approved && processStatus === QUOTE_PROCESS_STATUS.new && allowedToEdit,
    [allowedToEdit, ifQuoteApproved.approved, processStatus]
  );

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!permissions.product?.isCreate}
          onClick={() => {
            setIsAddNewProduct(true);
          }}
        >
          Add New Product
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsAddExistingProduct(true);
          }}
        >
          Add Existing Products
        </MenuItem>
      </>
    );
  };

  const previewDownloadProps = ![QUOTE_PROCESS_STATUS.new, QUOTE_PROCESS_STATUS.priceBuilder].includes(processStatus)
    ? {
        resource: sidebarResource.quoteBuilder,
        referenceId: quoteData?._id,
        fileName: `${`Quote-${quoteData?.quoteName}-V(${currentVersion})`}`,
        columns: columns,
        hideDetailButton: true,
        isSendEmail:
          processStatus === QUOTE_PROCESS_STATUS.sendToCustomer &&
          versionStatus !== 'Send To Customer' &&
          !ifQuoteApproved.approved &&
          !quoteData?.versions[currentVersion]?.offered &&
          allowedToEdit
            ? true
            : false,
        isExcelDownload: true,
        extraQueryParams: { uniqueId: quoteData?.versions[currentVersion]?._id },
        versionNumber: currentVersion,
        subject: `${user?.user?.brandName ?? 'Brand'} Offer - ${quoteData?.quoteName ?? ''}`,
        defaultColumns: [
          'productName',
          'unit',
          'qty',
          `salesPricePerUnit_${quoteData?.currency?.toLowerCase()}`,
          `totalSalesPrice_${quoteData?.currency?.toLowerCase()}`
        ],
        handleRefresh: () => {
          fetchQuoteData(currentVersion);
        },
        toEmails: userEmails?.to,
        ccEmails: userEmails?.cc ?? []
      }
    : null;

  const leftSideContents = () => {
    return (
      <>
        {[QUOTE_PROCESS_STATUS.sendToCustomer].includes(processStatus) && (
          <>
            <ThemeButton
              onClick={() => {
                setShowAiDialog(true);
              }}
              startIcon={<GiVintageRobot />}
              mobileTooltip="AI Suggestion"
              iconForMobile={<GiVintageRobot />}
            >
              AI Suggestion
            </ThemeButton>
            {permissions[qbResource]?.isUpdate &&
              (user?.user?._id === quoteData?.owner?.optionValue || quoteData?.collaborator?.some((d) => d?.optionValue === user?.user?._id)) && (
                <ThemeButton
                  onClick={() => {
                    quoteData?.pDFTemplate.optionValue &&
                      history.push(
                        `/quote-pdf-template/detail/${quoteData.pDFTemplate.optionValue}?quote=${quoteData._id}&version=${currentVersion}`
                      );
                  }}
                  startIcon={<AiFillEdit />}
                  mobileTooltip="Quote Template"
                  iconForMobile={<AiFillEdit />}
                >
                  'Quote Template
                </ThemeButton>
              )}
          </>
        )}
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        {processStatus === QUOTE_PROCESS_STATUS.doaProcess && versionStatus === 'Building Quote' && DOAneeded ? (
          <ThemeButton
            onClick={() => {
              handleSendForDOA();
            }}
            disabled={!allowedToEdit || sendToLoading}
            startIcon={<BiMailSend />}
            buttonType="theme"
          >
            {isMobile && !isTablet ? '' : `Send for DOA`}
          </ThemeButton>
        ) : null}
        {processStatus === QUOTE_PROCESS_STATUS.sendToCustomer && versionStatus !== 'Send To Customer' && !ifQuoteApproved.approved ? (
          <>
            {!quoteData?.versions[currentVersion]?.offered && (
              <ThemeButton
                onClick={() => {
                  handleOfferToCustomer();
                }}
                disabled={!allowedToEdit || sendToLoading}
                buttonType="theme"
              >
                {isMobile && !isTablet ? '' : `Process Quote`}
              </ThemeButton>
            )}
          </>
        ) : null}
      </>
    );
  };

  return (
    <>
      <div className={`subDetailModule pt-[12px] `}>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <Grid container className="position-relative">
            <Grid size={{ xs: 12, sm: 12, md: 12 }} className="mt-1">
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
                isPrevStep={['Rejected by Customer', 'Sent for DOA', 'Sent to Customer'].includes(versionStatus) ? false : prevStep}
                versionStatus={versionStatus}
                loading={loading}
                approvedQuote={ifQuoteApproved}
                handleVersionUpdate={() => {
                  handleVersionUpdate(versionStatus === 'Sent for DOA' && !DOAneeded ? 'Sent to Customer' : versionStatus, state?.selectedRecords);
                }}
                isStepEnded={['End'].includes(processStatus)}
                allowedToEdit={allowedToEdit}
                DOAData={DOAData}
                quoteData={quoteData}
                globalLoading={globalLoading}
                stepFullScreen={stepFullScreen}
                setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              />
              {quoteData && !loading && productBuilderId ? (
                <ProductBuilder
                  isAddButtonVisible={isAddButtonVisible}
                  addButtonMenuItems={addButtonMenuItems}
                  previewDownloadProps={previewDownloadProps}
                  leftSideContents={leftSideContents}
                  rightSideContents={rightSideContents}
                  fromQuote={true}
                  quoteData={quoteData}
                  permissions={permissions[qbResource]}
                  hasPermission={allowedToEdit}
                  currency={quoteData?.currency}
                  productBuilderId={productBuilderId}
                  isAddNewProduct={isAddNewProduct}
                  setIsAddNewProduct={setIsAddNewProduct}
                  isAddExistingProduct={isAddExistingProduct}
                  setIsAddExistingProduct={setIsAddExistingProduct}
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
          <CustomDialogContent isFooterPresent={false}>
            <div className="text-align-center">
              <Typography variant="h4">Under Construction </Typography>
              <img alt="image" src={`${PerformanceTuningImg}`} style={{ height: '300px' }} />
            </div>
          </CustomDialogContent>
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
          <CustomDialogContent isFooterPresent={false}>
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
    </>
  );
}
