import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, capitalize, Chip, CircularProgress, Dialog, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import moment from 'moment';
import { CustomDialogTransition, dateFormat, formatAmountWithCurrency, invoice, pricingCondition, rentalManagement } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import { Add, Edit, ExpandMore } from '@material-ui/icons';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { MuiPickersUtilsProvider, KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import InvoiceFacility from 'src/pages/Invoice/Invoice/InvoiceFacility';

const ViewBillingDialog = ({ rentalManagementData, invoiceData, currencySymbol, estimateStartDate, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [material, setMaterial] = useState([]);
  const [productData, setProductData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    try {
      let data = await fetch_invoice_product_fields(invoiceData?.currency);
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
                <p className="text-truncate" title={row.original?.detail}>
                  {row.original?.detail}
                </p>
              }
            </div>
          )
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
                      <p>{formatAmountWithCurrency(invoiceData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                    <p>{formatAmountWithCurrency(invoiceData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                {currencySymbol} {formatAmountWithCurrency(invoiceData?.currency, total)?.amountWithouCurrencyCode ?? total}
              </>
            );
          };
        }
      });
      setColumns(coloum);
      fetchProductInventory();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchProductInventory = async () => {
    var data: any = [];

    const response = await axiosInstance().get(`${invoice.api}/productpackage/${invoiceData._id}`);
    data = response?.data?.data;

    setMaterial(JSON.parse(JSON.stringify(data?.material || [])));
    if (estimateStartDate || data?.material[0]?.estimateStartDate) {
      estimateStartDate ? setStartDate(estimateStartDate) : setStartDate(data?.material[0]?.estimateStartDate);
    }
    if (data?.material[0]?.estimateEndDate) {
      setEndDate(data?.material[0]?.estimateEndDate);
    }
    setProductData(data);
    initializeTable(data);
  };

  const initializeTable = (data) => {
    var inventory: any = [];
    var nonSerializeAsset: any = [];
    inventory = data?.inventory;
    nonSerializeAsset = data?.nonSerializeAsset;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName}`;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.assetQty = parent.serializedProduct
        ? inventory?.filter((e) => e._id === parent._id).length
        : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow?.productDetail?.productName;
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = _subRow['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      _subRow.assetQty = _subRow.serializedProduct
        ? inventory?.filter((e) => e._id === _subRow._id).length
        : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
    });
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

  const handleApplyDate = async () => {
    let values = {
      actualStartDate: startDate,
      estimateStartDate: startDate,
      actualEndDate: endDate,
      estimateEndDate: endDate
    };

    let rows: any = [];
    selectedProducts.forEach((element) => {
      const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
      if (element.type === 'product') {
        rows.push({ ...element, ...calValues });
      } else if (element.type === 'package') {
        rows.push({ ...element, ...calValues });
        const product = material.filter((e) => e.parentId === element._id);
        resetValueZero(product);
        rows = [...rows, ...product];
      }
    });
    let tempRows = material.map((obj) => rows.find((o) => o.materialId === obj.materialId) || obj);
    let tempProduct = productData;
    tempProduct['material'] = tempRows;
    setProductData(tempProduct);
    setMaterial(tempRows);
    initializeTable(tempProduct);
  };

  const handleCreateBill = () => {
    rowsData.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.serializedProduct;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.subRows;
    });
    setUpdating(true);
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing`, { material: rowsData })
      .then(() => {
        onSuccess();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={invoiceData ? `Invoice Number : ${invoiceData?.invoiceNumber}` : `Create Billing `}
          onClose={onClose}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            {invoiceData && <InvoiceFacility invoiceData={invoiceData} />}
            {columns && rowsData ? (
              <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                <CustomReactTable
                  height={'calc(100vh - 285px)'}
                  columns={columns}
                  data={rowsData}
                  onSelect={setSelectedProducts}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  hideSelection={invoiceData ? true : false}
                  renderedFrom="rental_management_create_billing"
                  isClientSideGrid={true}
                />
              </Box>
            ) : (
              <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Fragment>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          {invoiceData === null && (
            <Button
              type="button"
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                handleCreateBill();
              }}
            >
              Create Bill
            </Button>
          )}
        </CustomDialogFooter>
      </Dialog>
    </Fragment>
  );
};

export default ViewBillingDialog;

function resetValueZero(product: any[]) {
  throw new Error('Function not implemented.');
}
