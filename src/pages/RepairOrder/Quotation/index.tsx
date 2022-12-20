import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  useMediaQuery,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  makeStyles,
  MenuList,
  Popover
} from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import {
  quotation,
  dateFormat,
  pricingCondition,
  formatAmountWithCurrency,
  supplierContact,
  repairOrder,
  CustomDialogTransition,
  currencyCodeToSymbol,
  QUOTATION_STATUS,
  REPAIR_ORDER_STATUS
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import { ExpandMore } from '@material-ui/icons';
import { capitalize, orderBy } from 'lodash';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import LeadTimeDialog from 'src/pages/Quotation/Productpackage/LeadTimeDialog';
import Versions from 'src/pages/Quotation/Versions';
import { FcCancel, FcClock, FcOk, GiReceiveMoney, VscVersions } from 'react-icons/all';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import SendEmail from 'src/pages/RentalManagement/Quotation/SendEmail';

const Quotation = ({
  repairOrderData,
  setNextStep,
  currencySymbol,
  showActivity,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  setQuotationVersionData,
  invoiceStep = false,
  updateOrderStatus = null
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const isMobileScreen = useMediaQuery('(max-width: 767px)');
  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [allColumn, setAllColumn] = useState([]);

  useEffect(() => {
    fetchQuotationData();
  }, [repairOrderData]);

  useEffect(() => {
    if (updateOrderStatus && invoiceStep && repairOrderData.status !== REPAIR_ORDER_STATUS.completed) {
      updateOrderStatus(REPAIR_ORDER_STATUS.completed);
    }
  }, [invoiceStep]);

  useEffect(() => {
    if (updateOrderStatus && [REPAIR_ORDER_STATUS.preWork, REPAIR_ORDER_STATUS.inProgress].includes(repairOrderData.status)) {
      updateOrderStatus(REPAIR_ORDER_STATUS.buildingQuote);
    }
  });

  const fetchQuotationData = (versionNumber = null) => {
    setQuotationData(null);
    axiosInstance()
      .get(`${repairOrder.api}/${repairOrderData?._id}/check-create/quotation`)
      .then(({ data: { data } }) => {
        setQuotationData(data);
        let keys = Object.keys(data.versions);
        let tempCurrentVersion = versionNumber ? versionNumber : parseInt(keys[keys.length - 1]);
        setCurrentVersion(tempCurrentVersion);
        setQuotationVersionData({ quotationId: data?._id, ...data?.versions[tempCurrentVersion] });
        setNextStep(data?.versions[tempCurrentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? true : false);
        setHeaderStatus();
      });
  };

  useEffect(() => {
    if (quotationData?.versions[currentVersion] && quotationData?.versions[currentVersion]?._id) {
      fetchFields(quotationData?.currency);
      fetchProductInventory();
    }
  }, [quotationData && quotationData?.versions[currentVersion]?._id]);

  const setHeaderStatus = () => {
    if (updateOrderStatus && repairOrderData.status !== REPAIR_ORDER_STATUS.buildingQuote && repairOrderData.status === REPAIR_ORDER_STATUS.preWork) {
      updateOrderStatus(REPAIR_ORDER_STATUS.buildingQuote);
    }
  };

  const fetchFields = async (currency) => {
    setColumns(null);
    var data = await fetch_quotation_product_fields(currency);
    setAllFields(JSON.parse(JSON.stringify(data)));
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
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
              quotationData?.versions[currentVersion]?.status
            ) ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  handleOpen(row.original);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            )}

            <Chip
              className="ml-1"
              label={`${row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}`}
              size="small"
              color="primary"
              onClick={() => {
                window.open(
                  `${
                    row.original.type === 'serializedAsset'
                      ? routes.serializedAssetDetail.path
                      : row.original.type === 'product'
                      ? routes.productDetail.path
                      : row.original.type === 'package'
                      ? routes.packagesDetail.path
                      : routes.serviceMasterDetail.path
                  }/${row.original.materialId}`
                );
              }}
            />
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original?.productName}>
              {row.original?.productName ? (
                row.original?.productId ? (
                  <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.productId}`} target="_blank">
                    {row.original?.productName}
                  </a>
                ) : (
                  row.original?.productName
                )
              ) : (
                <NoDataCell />
              )}
            </p>
          </div>
        )
      }
      // {
      //   accessor: 'leadTime',
      //   Header: 'Lead Time (Days)',
      //   Cell: ({ row }) => (row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0),
      //   Footer: (info) => {
      //     const total = info.rows
      //       .filter((f) => f.values.hasOwnProperty('leadTime') && !isNaN(f.values['leadTime']))
      //       .reduce((sum, row) => parseInt(row.values['leadTime']) + sum, 0);
      //     return <>{total}</>;
      //   }
      // }
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
      } else if (element.fieldName === 'supplierAccount') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? (
              <p className="text-truncate">{row.original[element.fieldName].map((d) => d?.optionLabel).toString()}</p>
            ) : (
              <NoDataCell />
            )
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
                    <p>{formatAmountWithCurrency(currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                  <p>{formatAmountWithCurrency(currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                )
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
      } else if (element.accessor.includes(`${currency.toLowerCase()}`)) {
        element['Footer'] = (info) => {
          const total = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return (
            <>
              {currencySymbol} {formatAmountWithCurrency(currency, total)?.amountWithouCurrencyCode ?? total}
            </>
          );
        };
      }
    });
    setColumns(coloum);
    setAllColumn(coloum.map((d) => d.Header));
  };

  const fetchProductInventory = async () => {
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(
      `${quotation.api}/productpackage/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`
    );
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows?.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material
      ?.filter((e) => e.parentId === parent._id)
      ?.sort((a, b) => a?.order - b?.order)
      ?.sort((a, b) => a?.preWork - b?.preWork);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail?.assetNumber
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
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
    return orderBy(subRows, ['srno'], ['asc']);
  };

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSaveData = async (rows: any) => {
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
      delete element.leadTime;
      delete element.leadTimeData;
      delete element.productName;
      delete element.productId;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchProductInventory();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${quotationData?.versions[currentVersion]?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchProductInventory();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
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

  const handleChangeVersion = (versionNumber) => {
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
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

  const handleSendToCustomer = () => {
    axiosInstance()
      .put(`${quotation.api}/${quotationData?._id}/send-to-customer/${quotationData?.versions[currentVersion]?._id}`)
      .then(() => {
        fetchQuotationData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Sent to customer Sucessfully'
        });
        if (updateOrderStatus && repairOrderData.status !== REPAIR_ORDER_STATUS.waitingQuote) {
          updateOrderStatus(REPAIR_ORDER_STATUS.waitingQuote);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box
        display="flex"
        justifyContent="space-between"
        m={1}
        className={`flex-wrap`}
        style={{ gap: isMobileScreen ? '5px' : 0, justifyContent: isMobileScreen ? 'center' : 'space-between' }}
      >
        <Box display="flex">
          <SendEmail
            versionData={quotationData?.versions[currentVersion]}
            quotationData={quotationData}
            previewOnly={true}
            allowedToEdit={invoiceStep ? !allowedToEdit : allowedToEdit}
            versionId={quotationData?.versions[currentVersion]?._id}
            columns={columns}
            allColumn={allColumn}
            setShowAllVersionStatus={setShowAllVersionStatus}
            setShowQuotationSummaryDialog={setShowQuotationSummaryDialog}
            currentVersion={currentVersion}
            isSendEmail={true}
            hideSummary={true}
            hideVersions={invoiceStep}
          />
        </Box>
        {!isMobileScreen && !invoiceStep && (
          <Box display="flex">
            {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcClock size={25} />
                <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quote has been sent to customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcOk size={25} />
                <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quote has been accepted by customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcCancel size={25} />
                <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quote has been rejected by customer</Typography>
              </div>
            ) : null}
          </Box>
        )}
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
                  onClick={handleSendToCustomer}
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
              ) : [QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.acceptByCustomer].includes(quotationData?.versions[currentVersion]?.status) ? (
                <Button
                  onClick={() => {
                    cloneVersion();
                  }}
                  variant="outlined"
                  size="small"
                  className="mx-1"
                  color="primary"
                >
                  Create New Version
                </Button>
              ) : null}
              {![QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                quotationData?.versions[currentVersion]?.status
              ) && (
                <Button
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
              )}
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
                {/* {allowedToDelete && (
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
                  )} */}
              </Menu>
            </div>
          )}
        </Box>
        {isMobileScreen && (
          <Box display="flex" style={{ margin: '0 auto' }}>
            {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcClock size={25} />
                <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quote has been sent to customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcOk size={25} />
                <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quote has been accepted by customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcCancel size={25} />
                <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quote has been rejected by customer</Typography>
              </div>
            ) : null}
          </Box>
        )}
      </Box>
      {columns && rowsData ? (
        <>
          <Box
            p="6px"
            zIndex={5}
            width={
              stepFullScreen ? '100%' : isTabletScreen ? 'calc(100vw)' : isSmallScreen ? 'calc(100vw)' : showActivity ? '100%' : 'calc(100vw - 100px)'
            }
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
          >
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={
                !allowedToEdit ||
                [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                  quotationData?.versions[currentVersion]?.status
                )
              }
              renderedFrom={renderedFrom}
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
          refrenceType="repairOrder"
        />
      )}
      {customerAcceptable && (
        <ManualReponseDialog
          versionId={quotationData?.versions[currentVersion]?._id}
          quotationId={quotationData?._id}
          setCurrentStep={() => {
            fetchQuotationData(currentVersion);
          }}
          updateStatus={() => {
            fetchQuotationData(currentVersion);
          }}
          setCustomerAcceptable={setCustomerAcceptable}
          updateOrderStatus={updateOrderStatus}
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
