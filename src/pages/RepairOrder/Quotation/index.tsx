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
import { quotation, dateFormat, pricingCondition, formatAmountWithCurrency, supplierContact, repairOrder, CustomDialogTransition, currencyCodeToSymbol, QUOTATION_STATUS } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import { ExpandMore } from '@material-ui/icons';
import { capitalize } from 'lodash';
import DateRangeIcon from '@material-ui/icons/DateRange';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import LeadTimeDialog from 'src/pages/Quotation/Productpackage/LeadTimeDialog';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Versions from 'src/pages/Quotation/Versions';
import { FcCancel, FcClock, FcOk, GiReceiveMoney, VscVersions } from 'react-icons/all';
import contactClass from '../../Contact/contact.module.scss';



const Quotation = ({ repairOrderData, setNextStep, currencySymbol, showActivity, renderedFrom, stepFullScreen }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [quotationData, setQuotationData] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [versionId, setVersionId] = useState(null);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [quotationSummary, setQuotationSummary] = useState({
    totalProfit: null,
    totalcost: null,
    totalsale: null
  });
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);

  useEffect(() => {
    fetchQuotationData();
  }, []);

  const fetchQuotationData = (versionNumber = null) => {
    axiosInstance()
      .get(`${repairOrder.api}/${repairOrderData._id}/quotation`)
      .then(({ data: { data } }) => {
        setQuotationData(data)
        fetchFields(data?.currency);
        let keys = Object.keys(data.versions);
        setCurrentVersion(versionNumber ? versionNumber : parseInt(keys[keys.length - 1]));
        setVersionId(data?.versions[versionNumber ? versionNumber : parseInt(keys[keys.length - 1])]?._id || null)
      })
  };

  useEffect(() => {
    versionId && fetchProductInventory();
  }, [versionId]);

  const fetchFields = async (currency) => {

    var data = await fetch_quotation_product_fields(currency);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const coloum: any = [
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {
              <p
                onClick={() => {
                  handleOpen(row.original);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            }

            <Chip
              className="ml-1"
              label={`${row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}`}
              size="small"
              color="primary"
              onClick={() => {
                window.open(
                  `${row.original.type === 'serializedAsset'
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
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0),
        Footer: (info) => {
          const total = info.rows
            .filter((f) => f.values.hasOwnProperty('leadTime') && !isNaN(f.values['leadTime']))
            .reduce((sum, row) => parseInt(row.values['leadTime']) + sum, 0);
          return <>{total}</>;
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
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
        });
      }
    });
    {
      isMobile ? (
        <Box display={'none'} />
      ) : (
        coloum.push({
          accessor: 'action',
          Header: '',
          minWidth: 100,
          width: 100,
          sticky: 'right',
          disableFilters: true,
          canDrag: false,
          Cell: ({ row }) =>
            !row.original.hideSelection && (
              <Grid container spacing={1}>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setLeadTimeDialog({ open: true, data: row.original });
                  }}
                >
                  <DateRangeIcon fontSize="small" color="primary" />
                </IconButton>
                <Box ml={1} />
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                    setDeleteData(obj);
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Grid>
            )
        })
      );
    }
    coloum.forEach((element) => {
      if (element.accessor.includes('detail')) {
        element['Footer'] = () => {
          return <>Total</>;
        };
      } else if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      } else if (element.accessor.includes('finalPrice')) {
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
      parent.detail = `${parent.type === 'serializedAsset' ? parent.serializedAssetDetail?.assetNumber : parent.type === 'product' ? parent.productDetail?.productName : parent.type === 'service' ? parent.serviceDetail?.serviceName : parent.packageDetail?.packageName}`;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    const totalFinalPrice = rows
      .filter(
        (f) =>
          f?.parentId === null &&
          f?.hasOwnProperty('finalPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['finalPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['finalPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);
    const totalSupplierPrice = rows
      .filter(
        (f) =>
          f?.parentId === null &&
          f?.hasOwnProperty('supplierPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['supplierPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['supplierPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);
    setQuotationSummary({
      totalProfit: formatAmountWithCurrency(quotationData?.currency, totalFinalPrice - totalSupplierPrice),
      totalcost: formatAmountWithCurrency(quotationData?.currency, totalSupplierPrice),
      totalsale: formatAmountWithCurrency(quotationData?.currency, totalFinalPrice)
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${_subRow.type === 'serializedAsset' ? _subRow.serializedAssetDetail?.assetNumber : _subRow.type === 'product' ? _subRow.productDetail?.productName : _subRow.type === 'service' ? _subRow.serviceDetail?.serviceName : _subRow.packageDetail?.packageName}`;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
      _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
      _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, _subRow);
    });
    if (subRows.length === 0 && parent.type === "package") {
      parent.isValid = false;
    }
    if (parent.type === "package") {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  }

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  }

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

  const defaultTotalValue = useMemo(() => {
    let result = '0';
    if (quotationData && quotationData?.currency) {
      result = `${currencyCodeToSymbol(quotationData.currency)} 0`;
    }
    return result;
  }, [quotationData]);

  const handleChangeVersion = (versionNumber) => {
    setVersionId(quotationData?.versions[versionNumber]?._id || null)
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex">
          <div>
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
          </div>
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
          <div>
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={(selectedProducts.length === 0)}
            >
              Actions<ExpandMore />
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
                  closeActions()
                  setIsProductEdit({ open: true, isBulkedit: true })
                }}>
                Bulk Edit
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeActions()
                  const dataToDelete = selectedProducts && selectedProducts
                    .filter((e) => !e.hideSelection)
                    .map((rec: any) => {
                      const obj: any = {};
                      obj.id = rec._id;
                      obj.type = rec?.type;
                      obj.materialId = rec?.materialId;
                      return obj;
                    });
                  setDeleteData(dataToDelete);
                }} >
                Delete
              </MenuItem>
            </Menu>
          </div>
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
              renderedFrom="quotation_product_package"
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
      {showQuotationSummaryDialog && (
        <Dialog
          open={showQuotationSummaryDialog}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={() => {
            setShowQuotationSummaryDialog(false);
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title="Quotation Summary"
            onClose={() => {
              setShowQuotationSummaryDialog(false);
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
              <div className={'quoteBox quoteProfit'}>
                <span className="quoteAmount" title={quotationSummary?.totalProfit?.fullFormatAmount}>
                  {quotationSummary?.totalProfit?.fullFormatAmount ? quotationSummary?.totalProfit?.fullFormatAmount : defaultTotalValue}{' '}
                  {quotationSummary?.totalcost?.fullFormatAmount
                    ? `(${findProfitPercentage(quotationSummary?.totalcost, quotationSummary?.totalProfit)} %)`
                    : ''}
                </span>
                <div className={'quoteBoxContent'}>
                  <span className={'quoteDetailHeading'}>Total Profit </span>
                </div>
              </div>
              <div className="quoteBox quoteCost">
                <span className="quoteAmount" title={quotationSummary?.totalcost?.fullFormatAmount}>
                  {quotationSummary?.totalcost?.fullFormatAmount ? quotationSummary?.totalcost?.fullFormatAmount : defaultTotalValue}
                </span>
                <div className={'quoteBoxContent'}>
                  <span className={'quoteDetailHeading'}>Total Cost Price </span>
                </div>
              </div>
              {(
                <div className="quoteBox quoteSale">
                  <span className="quoteAmount" title={quotationSummary?.totalsale?.fullFormatAmount}>
                    {quotationSummary?.totalsale?.fullFormatAmount ? quotationSummary?.totalsale?.fullFormatAmount : defaultTotalValue}
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
      {quotationData && showAllVersionStatus && (
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={quotationData?._id}
          handleChangeVersion={handleChangeVersion}
        />
      )}
    </Fragment>
  );
};

export default Quotation;
function findProfitPercentage(totalcost: any, totalProfit: any) {
  throw new Error('Function not implemented.');
}

