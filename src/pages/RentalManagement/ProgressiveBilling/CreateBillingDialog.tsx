import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Chip, CircularProgress, Dialog, IconButton, Menu, MenuItem } from '@material-ui/core';
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
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { MuiPickersUtilsProvider, KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { startCase } from 'lodash';
import InfoIcon from '@material-ui/icons/InfoOutlined';

const CreateBillingDialog = ({ rentalManagementData, currencySymbol, latestInvoice, onClose, onSuccess }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [material, setMaterial] = useState([]);

  const [productData, setProductData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [appliedDate, setAppliedDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, false);
    setAllFields(allFields);
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        width: 200,
        disableFilters: true,
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
            <p>{row.original.detail}</p>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : ''}
              </span>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === 'service') {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === 'product') {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === 'asset') {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <InfoIcon fontSize="small" color="primary" />
            </IconButton>
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
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName]).format(dateFormat)}</p> : <NoDataCell />)
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
  };

  const fetchProductInventory = async () => {
    var data: any = [];
    var prevInvoiceData: any = [];

    if (latestInvoice) {
      prevInvoiceData = await axiosInstance().get(`${invoice.api}/${latestInvoice}`);
      prevInvoiceData = prevInvoiceData?.data?.data
    }

    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
    data = response?.data?.data;

    if (prevInvoiceData) {
      data.material = data.material?.filter((item) => ['Per Day', 'Per Week', 'Per Month'].includes(item?.pricingMethod));
      data?.material?.forEach((e) => {
        const row: any = prevInvoiceData?.material?.find((ele) => ele._id === e._id);
        if (row) {
          console.log(row)
          const actualEndDate = new Date(row?.actualEndDate)?.setDate((new Date(row?.actualEndDate))?.getDate() + 1)
          e.estimateStartDate = actualEndDate
          e.actualStartDate = actualEndDate
          setEndDate(actualEndDate);
        }
      })
    }
    setMaterial(data?.material);
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
      parent.detail = parent.type === 'product' ? parent.productDetail?.productName :
        parent.type === 'service' ? parent?.serviceDetail?.serviceName : parent.packageDetail?.packageName
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow.type === 'product' ? _subRow?.productDetail?.productName :
        _subRow.type === 'service' ? _subRow?.serviceDetail?.serviceName : _subRow?.packageDetail?.packageName
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
    });
    return subRows;
  };

  const handleApplyDate = async () => {
    let values = {
      actualEndDate: endDate,
      estimateEndDate: endDate
    };
    let rows: any = [];
    selectedProducts.forEach((element) => {
      const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
      rows.push({ ...element, ...calValues });
    });
    let tempRows = material?.map((obj) => rows.find((o) => o._id === obj._id) || obj);
    let tempProduct = productData;
    tempProduct['material'] = tempRows;
    setProductData(tempProduct);
    setMaterial(tempRows);
    initializeTable(tempProduct);
    setRowsApplied(rows);
    setAppliedDate(true);
  };

  const handleCreateBill = () => {
    rowsApplied?.forEach((element) => {
      delete element?.srno;
      delete element?.detail;
      delete element?.qtyDisplay;
      delete element?.hideSelection;
      delete element?.productDetail;
      delete element?.packageDetail;
      delete element?.serviceDetail;
      delete element?.serviceDetail;
      delete element?.subRows;
      delete element?.estimateStartDate
      delete element?.estimateEndDate
      delete element?.estimateJobDuration
    });
    setUpdating(true);
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing`, { material: rowsApplied })
      .then(() => {
        setUpdating(false);
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
        <CustomDialogHeader title={`Create Billing `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <Grid container className={styles.rental_header_layout}>
                <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet"></Grid>
                <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                  <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                    <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={isMobile ? styles.content_box : ''}>
                      {/* <KeyboardDatePicker
                            autoOk
                            fullWidth
                            size="small"
                            disablePast
                            variant="inline"
                            inputVariant="outlined"
                            minDate={estimateStartDate}
                            value={startDate}
                            name="startDate"
                            label="Start Date"
                            onChange={(date: any) => {
                              setStartDate(date ? date : null);
                            }}
                            format={dateFormat}
                            InputLabelProps={{
                              shrink: true
                            }}
                            margin="dense"
                          /> */}
                      <KeyboardDatePicker
                        autoOk
                        fullWidth
                        size="small"
                        disablePast
                        variant="inline"
                        inputVariant="outlined"
                        minDate={endDate || new Date()}
                        value={endDate}
                        name="endDate"
                        label="End Date"
                        onChange={(date: any) => {
                          setEndDate(date ? date : null);
                        }}
                        format={dateFormat}
                        InputLabelProps={{
                          shrink: true
                        }}
                        margin="dense"
                      />
                      <Grid style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                        <HtmlTooltip title={!Boolean(selectedProducts && selectedProducts.length) ? 'Please select product to apply' : ''}>
                          <span>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={!Boolean(selectedProducts && selectedProducts.length)}
                              size="small"
                              onClick={() => {
                                handleApplyDate();
                              }}
                            >
                              Apply
                            </Button>
                          </span>
                        </HtmlTooltip>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </MuiPickersUtilsProvider>
            {columns && rowsData ? (
              <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                <CustomReactTable
                  height={'calc(100vh - 285px)'}
                  columns={columns}
                  data={rowsData}
                  onSelect={setSelectedProducts}
                  childrenProperty="subRows"
                  uniqueKey="_id"
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
          <Button
            type="button"
            variant="contained"
            color="primary"
            size="small"
            disabled={!appliedDate}
            onClick={() => {
              handleCreateBill();
            }}
          >
            Create Bill
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </Fragment>
  );
};

export default CreateBillingDialog;