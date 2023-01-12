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
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AddExistingProductInventory from './AddExistingProductInventory';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import moment from 'moment';
import {
  quotation,
  dateFormat,
  pricingCondition,
  formatAmountWithCurrency,
  supplierContact,
  salesOrder,
  demandOrder
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile } from 'react-device-detect';
import { ExpandMore } from '@material-ui/icons';
import { capitalize } from 'lodash';
import DateRangeIcon from '@material-ui/icons/DateRange';
import SalesOrderQtyDialog from './DemandOrderQtyDialog';
import { fetch_salesOrder_product_fields } from 'src/components/SalesOrder/helper';
import LeadTimeDialog from './LeadTimeDialog';

const useStyles = makeStyles((theme) => ({
  paper: {
    width: '80%',
    maxHeight: 435
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  }
}));

const Productpackage = ({ salesOrderData, setNextStep, currencySymbol, showActivity, renderedFrom, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { user, permissions }
  }: any = useData();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [requestDialog, setRequestDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);
  const [supplierContactData, setSupplierContactData] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_salesOrder_product_fields(salesOrderData?.currency);
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

            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                <HtmlTooltip title="Add ">
                  <IconButton
                    onClick={(event) => setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX })}
                    size="small"
                  >
                    <Add color="disabled" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </Box>
            }

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
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
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
                    <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                  <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
              {currencySymbol} {formatAmountWithCurrency(salesOrderData?.currency, total)?.amountWithouCurrencyCode ?? total}
            </>
          );
        };
      }
    });
    setColumns(coloum);
    fetchProductInventory();
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${demandOrder.api}/productpackage/${salesOrderData._id}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.detail = `${
        parent.type === 'serializedAsset'
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
      parent.isValid = parent['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
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
      _subRow.isValid = _subRow['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
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
    return subRows;
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

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d?.unit && d?.unitMain?.length ? d?.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      material.push(element);
    });

    const priceData: any = await calculatePrice(material);
    material.forEach((element) => {
      const rateResult = priceData?.filter(
        (e) =>
          e.materialId === element.materialId &&
          e.materialType === element.type &&
          e.unit === element.unit &&
          e.pricingMethod === element.pricingMethod
      );
      if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${salesOrderData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${demandOrder.api}/productpackage/${salesOrderData._id}`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchProductInventory();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
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
      .put(`${demandOrder.api}/productpackage/${salesOrderData._id}`, { material: rows })
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
      .put(`${demandOrder.api}/productpackage/${salesOrderData?._id}/delete`, { ids: rows })
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
    if (salesOrderData) {
      const data: any = {};
      data.conditionType = ['Rent'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: salesOrderData?.currency
      }));
      data.supplier = [];
      data.customer = [salesOrderData?.customerAccount?.optionValue];
      data.warehouse = [salesOrderData?.warehouse?.optionValue];
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

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          {permissions?.product?.isRead && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
              }}
            >
              {`Add ${routes.product.title}`}
            </Button>
          )}
          <Box mx={1} />
          {permissions?.packages?.isRead && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
              }}
            >
              {`Add ${routes.packages.title}`}
            </Button>
          )}
          <Box mx={1} />
          {permissions?.serviceMaster?.isRead && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'service', parentId: null });
              }}
            >
              {`Add ${routes.serviceMaster.title}`}
            </Button>
          )}
        </Box>
        <Box display="flex">
          <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
            <span>
              <Button
                variant="contained"
                color="primary"
                size="small"
                disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                onClick={() => setIsProductEdit({ open: true, isBulkedit: true })}
              >
                Bulk Edit
              </Button>
            </span>
          </HtmlTooltip>
          <Box mx={1} />
          <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
              onClick={() => {
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
              endIcon={isDeleting && <CircularProgress size={20} color="primary" />}
            >
              Delete
            </Button>
          </HtmlTooltip>
          <Box mx={1} />
          {/* <div className="d-flex gap-2">
                        <span>
                            <Button variant={'outlined'} color="default" size="small" onClick={openActions} aria-controls="action-menu">
                                {' '}
                                {'Actions'} <ExpandMore />
                            </Button>
                        </span>
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
                                disabled={selectedProducts.length === 0}
                                onClick={() => {
                                    let tempSupplierAccountId = [];
                                    selectedProducts?.forEach((element) => {
                                        element?.supplierAccount?.forEach((e) => {
                                            if (tempSupplierAccountId.findIndex((d) => d === e?.optionValue) === -1) {
                                                tempSupplierAccountId.push(e?.optionValue);
                                            }
                                        });
                                    });
                                    axiosInstance()
                                        .get(
                                            `${supplierContact.contactApi}?filterById=${JSON.stringify([
                                                { field: 'accountName', term: { $in: tempSupplierAccountId } }
                                            ])}&filterType=and`
                                        )
                                        .then(({ data: { data, count } }) => {
                                            setSupplierContactData(data);
                                            setAskSupplierPriceDialog(true);
                                        })
                                        .catch((error) => {
                                            toastConfig.setToastConfig(error);
                                        });
                                    closeActions();
                                }}
                            >
                                Ask Supplier to Quote
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setSelectedType('Supplier');
                                    setRequestDialog(true);
                                    closeActions();
                                }}
                            >
                                View Supplier Quote
                            </MenuItem>
                            {/* <MenuItem
                onClick={() => {
                  setSelectedType('Customer');
                  setRequestDialog(true);
                  closeActions();
                }}
              >
                View Customer Price
              </MenuItem> 
                        </Menu>
                    </div> */}
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
              renderedFrom="sales_order_product_package"
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
        <SalesOrderQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
          salesOrderData={salesOrderData}
        />
      )}
      {addExistingProductDialog.open && (
        <AddExistingProductInventory
          renderedFrom={
            addExistingProductDialog.type === 'product'
              ? `${renderedFrom}-product`
              : addExistingProductDialog.type === 'service'
              ? `${renderedFrom}-service`
              : `${renderedFrom}-package`
          }
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAdd}
          handleProductInventoryClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          type={addExistingProductDialog.type}
          refrenceType={'Quotation'}
          ignoreIds={rowsData?.map((e) => e?.materialId)}
        />
      )}
      {addchildDialog.open && (
        <Popover
          anchorReference="anchorPosition"
          anchorPosition={{ top: addchildDialog.top, left: addchildDialog.bottom }}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={addchildDialog.open}
          onClose={() => {
            setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'product', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Product
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'package', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Package
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'service', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Services
            </MenuItem>
          </MenuList>
        </Popover>
      )}
      {leadTimeDialog.open && (
        <LeadTimeDialog
          salesOrderId={salesOrderData._id}
          data={leadTimeDialog?.data}
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setLeadTimeDialog({ open: false, data: null });
            fetchProductInventory();
          }}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
