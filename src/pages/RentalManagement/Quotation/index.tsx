import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Chip, Typography, Menu, MenuItem, IconButton, Dialog, FormControl, Checkbox, TextField } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import { rentalManagement, dateFormat, formatAmountWithCurrency, QUOTATION_STATUS, pricingCondition, CustomDialogTransition } from '../../../constants/helpers';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { FcCancel, FcClock, FcOk } from 'react-icons/fc';
import { useData } from 'src/StateProvider/Provider';
import { GiReceiveMoney } from 'react-icons/gi';
import { VscVersions } from 'react-icons/vsc';
import contactClass from '../../Contact/contact.module.scss';
import { quotation } from '../../../constants/helpers';
import Versions from 'src/pages/Quotation/Versions';
import { ExpandMore } from '@material-ui/icons';
import LeadTimeDialog from 'src/pages/Quotation/Productpackage/LeadTimeDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import DateRangeIcon from '@material-ui/icons/DateRange';
import DeleteIcon from '@material-ui/icons/Delete';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import { orderBy } from 'lodash';
import { AiOutlineFileExcel } from 'react-icons/ai';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import SendEmail from 'src/pages/Quotation/SendEmail';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const Quotation = ({
  rentalManagementData,
  setNextStep,
  currencySymbol,
  isTabletScreen,
  isSmallScreen,
  showActivity,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete
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
  const [currentVersion, setCurrentVersion] = useState(null);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [material, setMaterial] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [versionId, setVersionId] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allColumn, setAllColumn] = useState([]);

  const defaultSelectColumns = [
    'Detail',
    'Unit',
    'Qty',
  ];
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState(defaultSelectColumns);
  const [showExcelArrangeColumns, setShowExcelArrangeColumns] = useState(false);

  useEffect(() => {
    fetchQuotationData();
  }, []);

  useEffect(() => {
    versionId && fetchProductInventory();
    if (
      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice
    ) {
      setNextStep(false);
    }
    if (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
      setNextStep(true);
    }
  }, [versionId]);

  const fetchQuotationData = (versionNumber = null) => {
    axiosInstance()
      .get(`${rentalManagement.api}/${rentalManagementData._id}/quotation`)
      .then(({ data: { data } }) => {
        setQuotationData(data);
        fetchFields(data?.currency);
        let keys = Object.keys(data.versions);
        setCurrentVersion(versionNumber ? versionNumber : parseInt(keys[keys.length - 1]));
        setVersionId(data?.versions[versionNumber ? versionNumber : parseInt(keys[keys.length - 1])]?._id || null);
      });
  };

  const fetchFields = async (currency) => {
    var { fields: data } = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    const coloum: any = [
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOffline || !allowedToEdit ? (
              <p> {row.original.detail}</p>
            ) : (
              <p className="link text-truncate" title={row.original.detail}>
                {row.original.detail}
              </p>
            )}
            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                  {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                </span>
              </Box>
            }
            {!isOffline && (
              <Chip
                className="ml-1"
                label={`${row.original.type === 'product' ? (!row.original.serializedProduct ? 'Non-Serialized Product' : 'Product') : 'Package'}`}
                size="small"
                color="primary"
                onClick={() => {
                  window.open(
                    `${row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                  );
                }}
              />
            )}
          </div>
        ),
        Footer: () => {
          return <>Total</>;
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
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
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
    setAllColumn(coloum.map(d => d.Header))
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${_subRow.type === 'serializedAsset'
        ? _subRow.serializedAssetDetail?.assetNumber
        : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
        }`;
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
    return orderBy(subRows, ['order'], ['asc']);
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.detail = `${parent.type === 'serializedAsset'
        ? parent.serializedAssetDetail?.assetNumber
        : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
        }`;
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
    setDeleting(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${versionId}/delete`, { ids: rows })
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
    });
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`, { material: rows })
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

  const handleChangeVersion = (versionNumber) => {
    setVersionId(quotationData?.versions[versionNumber]?._id || null);
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex">
          <Grid container >
            <Grid item xs={10} md={10} sm={10}>
              <Button
                onClick={() => {
                  setShowQuotationSummaryDialog(true);
                }}
                variant="outlined"
                size="small"
                className="mx-1"
                startIcon={<GiReceiveMoney />}
                color="primary"
              >
                Summary
              </Button>
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="primary"
                size="small"
                className={isMobile && !isTablet ? contactClass.mobile_button_layout : 'mx-1'}
                onClick={() => {
                  setShowAllVersionStatus(true);
                }}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                startIcon={isMobile && !isTablet ? null : <VscVersions />}
              >
                {isMobile && !isTablet ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
              </Button>
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="primary"
                size="small"
                className={isMobile && !isTablet ? contactClass.mobile_button_layout : 'mx-1'}
                onClick={() => {
                  setShowExcelArrangeColumns(true);
                }}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                startIcon={isMobile && !isTablet ? null : <AiOutlineFileExcel />}
              >
                {isMobile && !isTablet ? <AiOutlineFileExcel size={20} /> : `Excel Download`}
              </Button>
            </Grid>
            <Grid item xs={2} md={2} sm={2}>
              <SendEmail versionData={quotationData?.versions[currentVersion]} quotationData={quotationData} previewOnly={true} />
            </Grid>
          </Grid>

        </Box>
        <Box display="flex">
          {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
            <div className="d-flex align-items-center justify-content-center flex-column m-1">
              <FcClock size={25} />
              <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quote has been sent to customer</Typography>
            </div>
          ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
            <div className="d-flex align-items-center justify-content-center flex-column m-1">
              <FcOk size={25} />
              <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quote has been accepted by customer</Typography>
            </div>
          ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
            <div className="d-flex align-items-center justify-content-center flex-column m-1">
              <FcCancel size={25} />
              <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quote has been rejected by customer</Typography>
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
              </Menu>
            </div>
          )}
        </Box>
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
              hideSelection={!allowedToEdit}
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
          versionId={versionId}
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
        <Versions onClose={() => setShowAllVersionStatus(false)} quotationId={quotationData?._id} handleChangeVersion={handleChangeVersion} />
      )}
      {customerAcceptable && (
        <ManualReponseDialog
          versionId={versionId}
          quotationId={quotationData?._id}
          setCurrentStep={() => {
            fetchQuotationData(currentVersion);
            setNextStep(true);
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
          versionId={versionId}
          onClose={() => {
            setShowQuotationSummaryDialog(false);
          }}
        />
      )}
      {showExcelArrangeColumns && (
        <Dialog
          open={showExcelArrangeColumns}
          aria-labelledby="customized-dialog-title"
          maxWidth="sm"
          onClose={() => {
            setShowExcelArrangeColumns(false);
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title={`View Columns Excel`}
            onClose={() => {
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
              <Grid item xs={12} md={12} sm={12}>
                <FormControl fullWidth >
                  <Autocomplete
                    id="demo-mutiple-chip"
                    disabled={!allowedToEdit}
                    fullWidth
                    size="small"
                    multiple
                    value={visibleColumnsExcel}
                    onChange={(e, val) => {
                      if (val.includes("Select All") && ["Select All", ...allColumn].sort().toString() !== val.sort().toString()) {
                        setVisibleColumnsExcel(allColumn);
                      }
                      else if (["Select All", ...allColumn].sort().toString() === val.sort().toString()) {
                        setVisibleColumnsExcel([]);
                      }
                      else {
                        setVisibleColumnsExcel(val);
                      }
                    }}
                    options={["Select All", ...allColumn]}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(option, { selected }) => (
                      <React.Fragment>
                        <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={(showExcelArrangeColumns && ["Select All", ...allColumn].sort().toString() === ["Select All", ...visibleColumnsExcel].sort().toString()) ? true : selected} />
                        {option}
                      </React.Fragment>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label={`Visible Columns in Quote Excel`}
                        placeholder="Select "
                      />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <CustomButton
              variant="contained"
              color="primary"
              size="small"
              disabled={visibleColumnsExcel.length === 0}
              onClick={(e) => {
                e.preventDefault();
                setShowExcelArrangeColumns(false);
                axiosInstance().post(`${quotation.api}/template`, {
                  "id": quotationData._id,
                  "versionId": versionId,
                  "columns": visibleColumnsExcel
                }, { responseType: 'blob', })
                  .then(({ data }) => {
                    const url = window.URL.createObjectURL(new Blob([data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', quotationData.quotationNumber + "." + 'xlsx');
                    document.body.appendChild(link);
                    link.click();
                  })
                  .catch((err) => {
                    toastConfig.setToastConfig(err);
                  });
              }}
            >
              Download
            </CustomButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </Fragment>
  );
};

export default Quotation;
