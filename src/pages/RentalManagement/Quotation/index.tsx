import { useState, useEffect, useContext, Fragment } from 'react';
import {
  Grid,
  Box,
  Button,
  Chip,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  FormControl,
  Checkbox,
  TextField,
  Tooltip
} from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import {
  rentalManagement,
  dateFormat,
  formatAmountWithCurrency,
  QUOTATION_STATUS,
  pricingCondition,
  CustomDialogTransition
} from '../../../constants/helpers';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { FcCancel, FcClock, FcOk } from 'react-icons/fc';
import { useData } from 'src/StateProvider/Provider';
import { quotation } from '../../../constants/helpers';
import Versions from 'src/pages/Quotation/Versions';
import LeadTimeDialog from 'src/pages/Quotation/Productpackage/LeadTimeDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import { orderBy, startCase } from 'lodash';
import SendEmail from './SendEmail';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';

const Quotation = ({
  rentalManagementData,
  setNextStep,
  currencySymbol,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  fetchQuotationData,
  quotationData,
  currentVersion,
  setCurrentVersion
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [material, setMaterial] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [allColumn, setAllColumn] = useState([]);

  useEffect(() => {
    if (quotationData && quotationData?.versions[currentVersion]?._id) {
      fetchFields(quotationData?.currency);
      fetchProductInventory();
    } else {
      fetchQuotationData(null, true);
    }
  }, []);

  useEffect(() => {
    if (quotationData && quotationData?.versions[currentVersion]?._id) {
      fetchFields(quotationData?.currency);
      fetchProductInventory();
    }
    if (
      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice
    ) {
      setNextStep(false);
    }
    if (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
      setNextStep(true);
    }
  }, [quotationData?.versions[currentVersion]?._id]);
  const additionalCost = ['service', 'product', 'package', 'asset'];
  const fetchFields = async (currency) => {
    // setNextStep(false)
    var data = await fetch_quotation_product_fields(rentalManagementData?.currency);
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        disableFilters: true,
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row.original['type'] === 'product'
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === 'package'
                ? row.original?.packageDetail.packageType === 'Product'
                  ? '(Product)'
                  : '(Service)'
                : row.original.type === 'service'
                ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                : ''}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p title={row.original.detail}>{row.original.detail}</p>
            <Box ml={1} mr={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>
            {additionalCost.includes(row.original.type) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'asset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else if (row.original.type === 'package') {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      }
    ];

    data.forEach((element) => {
      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
        });
      } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
        if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            let fieldName = element.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _unit;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
            });
          });
        } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) =>
                  row.original[fieldName] ? (
                    <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                  ) : (
                    <NoDataCell />
                  )
              });
            });
          });
        } else if (element.type === 'currencyAmount') {
          element.displayCurrency.forEach((_currency) => {
            let fieldName = element.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _currency;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) =>
                row.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                ),
              Footer: (info) => {
                const total = info?.rows
                  ?.filter((f) => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                  .reduce((sum, row) => row.values[fieldName] + sum, 0);
                return (
                  <>
                    {currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}
                  </>
                );
              }
            });
          });
        }
      } else {
        if (element.fieldName === 'qty') {
          element.fieldName = 'qtyDisplay';
        }
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) =>
            row.original[element.fieldName]?.optionLabel ? (
              <p>{row.original[element.fieldName].optionLabel}</p>
            ) : row.original[element.fieldName] ? (
              <p>{row.original[element.fieldName]}</p>
            ) : (
              <NoDataCell />
            )
        });
      }
    });
    coloum.forEach((element) => {
      if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns(coloum);
    setAllColumn(coloum.map((d) => d.Header));
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
          ? _subRow?.serializedAssetDetail?.assetNumber
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceName
          : _subRow?.packageDetail?.packageName
      }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = parent?.qty * _subRow.qty;
      _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
      _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    // setNextStep(true)
    return orderBy(subRows, ['order'], ['asc']);
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(
      `${quotation.api}/productpackage/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`
    );
    const additionalCost = await axiosInstance().get(`${quotation.api}/service/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`);
    const additionalCostData = additionalCost?.data?.data?.map((e) => {
      const detail = e?.description;
      return {
        ...e,
        type: e?.costType,
        detail: detail,
        parentId: null
      };
    });
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data?.inventory ? data?.inventory : [];
    const rowsMaterial = data.material.filter((e) => e.parentId === null);
    const rows = [...rowsMaterial, ...additionalCostData];
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.type === 'package'
          ? parent.packageDetail?.packageName
          : parent.detail
      }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
          ? parent?.productDetail?.productDescription || ''
          : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription || ''
          : parent?.description;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const cloneVersion = () => {
    const versionId = quotationData?.versions[currentVersion]?._id;
    axiosInstance()
      .post(`/quotation/clone-version/${quotationData._id}/${versionId}`)
      .then(() => {
        fetchQuotationData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleDelete = (rows) => {
    setNextStep(false);
    setDeleting(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${quotationData?.versions[currentVersion]?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchProductInventory();
        setDeleteData(null);
        setNextStep(true);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
        setNextStep(true);
      });
  };

  const calculatePrice = (arr: any[]) => {
    if (quotationData) {
      const data: any = {};
      data.conditionType = ['Rent'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: quotationData?.currency
      }));
      data.supplier = [];
      data.customer = [quotationData?.customerAccount?.optionValue];
      data.warehouse = [quotationData?.warehouse?.optionValue];
      return new Promise((resolve, reject) => {
        axiosInstance()
          .post(pricingCondition.api + `/calculatePrice`, data)
          .then(({ data: { data } }) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  };

  const handleSaveData = async (rows: any) => {
    setNextStep(false);
    rows.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.subRows;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchProductInventory();
        setNextStep(true);
      })
      .catch((error) => {
        setNextStep(true);
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeVersion = (versionNumber) => {
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  return (
    <Fragment>
      <Box
        display="flex"
        m={1}
        sx={{ flexWrap: isMobile ? 'wrap' : 'no-wrap', justifyContent: isMobile ? 'center' : 'space-between' }}
        style={{ gap: isMobile ? '8px' : '0px' }}
      >
        <Box display="flex">
          <SendEmail
            versionData={quotationData?.versions[currentVersion]}
            quotationData={quotationData}
            previewOnly={true}
            allowedToEdit={allowedToEdit}
            versionId={quotationData?.versions[currentVersion]?._id}
            columns={columns}
            allColumn={allColumn}
            setShowAllVersionStatus={setShowAllVersionStatus}
            setShowQuotationSummaryDialog={setShowQuotationSummaryDialog}
            currentVersion={currentVersion}
            isSendEmail={true}
            hideSummary={true}
          />
        </Box>
        {isMobile ? (
          <>
            <Box display="flex">
              {allowedToEdit && (
                <div>
                  {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
                  quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice ? (
                    <Button
                      disabled={material
                        .filter((e) => e.parentId === null)
                        .some(
                          (d) =>
                            d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === 0 ||
                            d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === null ||
                            d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === undefined
                        )}
                      onClick={() => {
                        axiosInstance()
                          .put(`${quotation.api}/${quotationData?._id}/send-to-customer/${quotationData?.versions[currentVersion]?._id}`)
                          .then(() => {
                            fetchQuotationData(currentVersion);
                            toastConfig.setToastConfig({
                              open: true,
                              type: 'success',
                              message: 'Sent to customer Sucessfully'
                            });
                          })
                          .catch((error) => {
                            toastConfig.setToastConfig(error);
                          });
                      }}
                      variant="outlined"
                      size="small"
                      className="mx-1"
                      color="primary"
                    >
                      Send to customer
                    </Button>
                  ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                    <Button
                      onClick={() => {
                        setCustomerAcceptable(true);
                      }}
                      variant="outlined"
                      size="small"
                      className="mx-1"
                      color="primary"
                    >
                      Accept / Reject
                    </Button>
                  ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                    <Button
                      onClick={() => {
                        cloneVersion();
                      }}
                      variant="outlined"
                      size="small"
                      className="mx-1"
                      color="primary"
                    >
                      {`Clone Version-${currentVersion}`}
                    </Button>
                  ) : null}
                  {/* <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedProducts.length === 0}
              >
                Actions
                <ExpandMore />
              </Button>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="action-menu"
                open={Boolean(anchorEl)}
                onClose={closeActions}
              >
                <MenuItem
                  onClick={() => {
                    closeActions();
                    setIsProductEdit({ open: true, isBulkedit: true });
                  }}
                >
                  Bulk Edit
                </MenuItem>
                {allowedToDelete && (
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      const dataToDelete =
                        selectedProducts &&
                        selectedProducts
                          .filter((e) => !e.hideSelection)
                          .map((rec: any) => {
                            const obj: any = {};
                            obj.id = rec._id;
                            obj.type = rec?.type;
                            obj.materialId = rec?.materialId;
                            return obj;
                          });
                      setDeleteData(dataToDelete);
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
              </Menu> */}
                </div>
              )}
            </Box>
            <Box display="flex" sx={{ flexBasis: isMobile ? '100%' : '', justifyContent: isMobile ? 'center' : '' }}>
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcClock size={25} />
                  <Typography style={{ color: '#00acc1', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been sent to customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcOk size={25} />
                  <Typography style={{ color: '#28a745', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been accepted by customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcCancel size={25} />
                  <Typography style={{ color: '#dc3545', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been rejected by customer
                  </Typography>
                </div>
              ) : null}
            </Box>
          </>
        ) : (
          <>
            <Box display="flex" sx={{ flexBasis: isMobile ? '100%' : '', justifyContent: isMobile ? 'center' : '' }}>
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcClock size={25} />
                  <Typography style={{ color: '#00acc1', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been sent to customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcOk size={25} />
                  <Typography style={{ color: '#28a745', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been accepted by customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcCancel size={25} />
                  <Typography style={{ color: '#dc3545', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been rejected by customer
                  </Typography>
                </div>
              ) : null}
            </Box>
            <Box display="flex">
              {allowedToEdit && (
                <div>
                  {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
                  quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice ? (
                    <Button
                      disabled={material
                        .filter((e) => e.parentId === null)
                        .some(
                          (d) =>
                            d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === 0 ||
                            d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === null ||
                            d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === undefined
                        )}
                      onClick={() => {
                        axiosInstance()
                          .put(`${quotation.api}/${quotationData?._id}/send-to-customer/${quotationData?.versions[currentVersion]?._id}`)
                          .then(() => {
                            fetchQuotationData(currentVersion);
                            toastConfig.setToastConfig({
                              open: true,
                              type: 'success',
                              message: 'Sent to customer Sucessfully'
                            });
                          })
                          .catch((error) => {
                            toastConfig.setToastConfig(error);
                          });
                      }}
                      variant="outlined"
                      size="small"
                      className="mx-1"
                      color="primary"
                    >
                      Send to customer
                    </Button>
                  ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                    <Button
                      onClick={() => {
                        setCustomerAcceptable(true);
                      }}
                      variant="outlined"
                      size="small"
                      className="mx-1"
                      color="primary"
                    >
                      Accept / Reject
                    </Button>
                  ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                    <Button
                      onClick={() => {
                        cloneVersion();
                      }}
                      variant="outlined"
                      size="small"
                      className="mx-1"
                      color="primary"
                    >
                      {`Clone Version-${currentVersion}`}
                    </Button>
                  ) : null}
                  {/* <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedProducts.length === 0}
              >
                Actions
                <ExpandMore />
              </Button>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="action-menu"
                open={Boolean(anchorEl)}
                onClose={closeActions}
              >
                <MenuItem
                  onClick={() => {
                    closeActions();
                    setIsProductEdit({ open: true, isBulkedit: true });
                  }}
                >
                  Bulk Edit
                </MenuItem>
                {allowedToDelete && (
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      const dataToDelete =
                        selectedProducts &&
                        selectedProducts
                          .filter((e) => !e.hideSelection)
                          .map((rec: any) => {
                            const obj: any = {};
                            obj.id = rec._id;
                            obj.type = rec?.type;
                            obj.materialId = rec?.materialId;
                            return obj;
                          });
                      setDeleteData(dataToDelete);
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
              </Menu> */}
                </div>
              )}
            </Box>
          </>
        )}
      </Box>
      {columns && rowsData ? (
        <>
          <Box
            p="6px"
            zIndex={5}
            width={'100%'}
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
          >
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={true}
              hideAction={true}
              renderedFrom="quotation_product_package_quotation"
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {isProductEdit.open && (
        <QuotationQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          quotationData={quotationData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
        />
      )}
      {leadTimeDialog.open && (
        <LeadTimeDialog
          quotationId={quotationData._id}
          data={leadTimeDialog?.data}
          versionId={quotationData?.versions[currentVersion]?._id}
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setLeadTimeDialog({ open: false, data: null });
            fetchProductInventory();
          }}
        />
      )}
      {quotationData && showAllVersionStatus && (
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={quotationData?._id}
          handleChangeVersion={handleChangeVersion}
          refrenceType="rentalJob"
        />
      )}
      {customerAcceptable && (
        <ManualReponseDialog
          versionId={quotationData?.versions[currentVersion]?._id}
          quotationId={quotationData?._id}
          setCurrentStep={() => {
            fetchQuotationData(currentVersion);
          }}
          setNextStep={(type: string) => {
            if (type && type.includes('Rejected')) {
              setNextStep(false);
            } else {
              setNextStep(true);
            }
          }}
          updateStatus={() => {
            fetchQuotationData(currentVersion);
          }}
          setCustomerAcceptable={setCustomerAcceptable}
        />
      )}
      {showQuotationSummaryDialog && (
        <QuotationSummeryDialog
          quotationData={quotationData}
          versionId={quotationData?.versions[currentVersion]?._id}
          onClose={() => {
            setShowQuotationSummaryDialog(false);
          }}
        />
      )}
    </Fragment>
  );
};

export default Quotation;
