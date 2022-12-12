import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Chip, CircularProgress, Dialog, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
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
import EditIcon from '@material-ui/icons/Edit';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';

const CreateBillingDialog = ({ rentalManagementData, currencySymbol, invoiceData, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [material, setMaterial] = useState([]);
  const [orginalMaterial, setOrginalMaterial] = useState([]);

  const [productData, setProductData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [appliedDate, setAppliedDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (columns) {
      fetchProductInventory();
    }
  }, [columns]);

  const fetchFields = async () => {
    var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, false);
    setAllFields(JSON.parse(JSON.stringify(allFields)));
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
        )
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
          Cell: ({ row }) =>
            row.original[element.fieldName]?.optionLabel ? (
              <p>{row.original[element.fieldName].optionLabel}</p>
            ) : row.original[element.fieldName] ? (
              <>{
                ['Per Week', 'Per Month'].includes(row.original[element.fieldName]) ?
                  <Box display="flex" alignItems="center">
                    <p>{row.original[element.fieldName]}</p>
                    <Box ml={1} /><Tooltip title="Per Day Price is calculated">
                      <InfoIcon fontSize="small" color="primary" />
                    </Tooltip>
                  </Box>
                  : <p>{row.original[element.fieldName]}</p>
              }

              </>
            ) : (
              <NoDataCell />
            )
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
          minWidth: 50,
          width: 50,
          sticky: 'right',
          disableFilters: true,
          canDrag: false,
          Cell: ({ row }) =>
            row.original.isEditable && (
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setIsProductEdit({ open: true, rowData: row.original });
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
            )
        })
      );
    }
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
    let data: any = {};
    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
    const {
      data: { data: invoicedProducts }
    } = await axiosInstance().get(`/rental-management/${rentalManagementData?._id}/invoice/material-end-date`);
    data = response?.data?.data;
    let materialDataConst: any = []
    data?.material?.forEach(element => {
      if (element?.productDetail?.serializedProduct === true) {
        data?.inventory?.filter(d => d.product === element?.materialId)?.forEach((ele: any) => {
          ele.type = 'asset';
          ele.qty = 1;
          ele._id = ele?.inventoryDetail?._id
          ele.materialId = ele?.inventoryDetail?._id
          let values = { qty: 1 };
          const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
          const { materialId, qty, type, _id, ...rest } = element
          materialDataConst.push({ ...rest, ...ele, ...calValues })
        });
      }
      else {
        materialDataConst.push(element)
      }
    });
    data.material = materialDataConst
    if (invoiceData) {
      // data.material = data.material?.filter((item) => ['Per Day', 'Per Week', 'Per Month'].includes(item?.pricingMethod));
      data.material = data?.material
        ?.map((e) => {
          let materialData: any = { ...e };

          let pMethod = materialData?.pricingMethod?.split(',') || [];
          pMethod = pMethod.map((m) => m?.trim()).find((m) => !['Per Day', 'Per Week', 'Per Month'].includes(m));

          if (!['Per Day', 'Per Week', 'Per Month'].includes(materialData?.pricingMethod) || materialData?.pricingMethod === pMethod) {
            let tempTotalPrevQty = invoiceData
              .map((obj) => {
                let tempQty = obj.material?.find((ele) => ele._id === materialData._id)?.qty;
                if (tempQty) return tempQty;
              })
              .filter((d) => d);
            tempTotalPrevQty = tempTotalPrevQty.reduce((a, b) => a + b, 0);
            let values = { qty: materialData.qty - tempTotalPrevQty };
            const calValues = autoCalculateSpecificFields(values, { ...materialData, ...values }, allFields);


            materialData = { ...materialData, ...calValues };
          }

          const product = invoicedProducts.find((p) => p._id === e._id);

          if (product) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);

            materialData.estimateStartDate = actualEndDate;
            materialData.actualStartDate = actualEndDate;
          }
          else {
            materialData.estimateStartDate = materialData.estimateStartDate ? materialData.estimateStartDate : new Date().setDate(new Date().getDate() + 1);
            materialData.actualStartDate = materialData.actualStartDate ? materialData.actualStartDate : new Date().setDate(new Date().getDate() + 1);
          }

          const row: any = invoiceData[0]?.material.find((m) => m._id === e._id);

          if (row) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
            setEndDate(actualEndDate);
          }
          return materialData;
        })
        .filter((d) => d.qty > 0);
    }
    setMaterial(data?.material);
    setOrginalMaterial(data?.material);
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
      parent.detail =
        parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent.type === 'asset'
              ? parent?.inventoryDetail?.assetNumber
              : parent.packageDetail?.packageName;
      parent.qtyDisplay = parent.qty;
      parent.isEditable = ['Per Day', 'Per Week', 'Per Month'].includes(parent?.pricingMethod) || parent.type === 'asset' ? false : true;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow.type === 'asset'
              ? _subRow?.inventoryDetail?.assetNumber
              : _subRow?.packageDetail?.packageName;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isEditable = ['Per Day', 'Per Week', 'Per Month'].includes(_subRow?.pricingMethod) ? false : true;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
    });
    return subRows;
  };

  const handleApplyDate = async () => {
    let tempValues = {
      actualEndDate: endDate,
      estimateEndDate: endDate
    };

    const {
      data: { data: invoicedProducts }
    } = await axiosInstance().get(`/rental-management/${rentalManagementData?._id}/invoice/material-end-date`);

    let rows: any = [];
    selectedProducts.forEach((element) => {
      const product = invoicedProducts.find((p) => p._id === element._id);
      const productStartDateTime = new Date(new Date(element.estimateStartDate).toLocaleDateString()).getTime();
      const selectedEndDateTime = new Date(new Date(endDate).toLocaleDateString()).getTime();

      if (selectedEndDateTime < productStartDateTime) {
        element.invalidDate = true;
      }
      else if (product) {
        const productEndDateTime = new Date(new Date(product?.endDate).toLocaleDateString()).getTime();
        if (selectedEndDateTime < productEndDateTime) {
          element.invalidDate = true;
        } else {
          element.invalidDate = false;
        }
      }
      let priceFieldName = Object.keys(element).find(d => d.includes("price_"))
      let calValues: any
      let values = JSON.parse(JSON.stringify(tempValues))
      if (element.pricingMethod === "Per Week") {
        values["pricingMethod"] = "Per Day"
        if (priceFieldName) values[priceFieldName] = orginalMaterial.find(d => d._id === element._id)[priceFieldName] / 7 //original becaause element is change when apply
        calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        calValues["pricingMethod"] = "Per Week"
      }
      else if (element.pricingMethod === "Per Month") {
        values["pricingMethod"] = "Per Day"
        if (priceFieldName) values[priceFieldName] = orginalMaterial.find(d => d._id === element._id)[priceFieldName] / 30
        calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        calValues["pricingMethod"] = "Per Month"
      }
      else {
        calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
      }
      element.isAppliedBill = true // row color
      rows.push({ ...element, ...calValues });
    });

    let tempRows = material?.map((obj) => rows.find((o) => o._id === obj._id) || obj);
    let tempProduct = productData;
    tempProduct['material'] = tempRows;
    setProductData(tempProduct);
    setMaterial(tempRows);
    initializeTable(tempProduct);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows];
    });
    setAppliedDate(true);
  };

  const handleSaveData = async (rows: any) => {
    rows[0].isAppliedBill = true // only 1 element will come and  row color
    let tempRows = material?.map((obj) => rows.find((o) => o._id === obj._id) || obj);
    let tempProduct = productData;
    tempProduct['material'] = tempRows;
    setProductData(tempProduct);
    setMaterial(tempRows);
    initializeTable(tempProduct);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows];
    });
    setIsProductEdit({ open: false, rowData: null });
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
      delete element?.estimateStartDate;
      delete element?.estimateEndDate;
      delete element?.estimateJobDuration;
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
                        // minDate={endDate || new Date()}
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
                      <Box style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                        <HtmlTooltip title={!Boolean(selectedProducts && selectedProducts.length) ? 'Please select product to apply' : ''}>
                          <span>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={!Boolean(selectedProducts && selectedProducts.length && endDate)}
                              size="small"
                              onClick={() => {
                                handleApplyDate();
                              }}
                            >
                              Apply
                            </Button>
                          </span>
                        </HtmlTooltip>
                      </Box>
                      {/* <Button
                        variant="contained"
                        color="primary"
                        disabled={
                          selectedProducts.filter((d) => !['Per Day', 'Per Week', 'Per Month'].includes(d.pricingMethod)).length === 0 ||
                          selectedProducts.length !== 1
                        }
                        size="small"
                        onClick={() => {
                          setOpenQtyEdit(true);
                        }}
                      >
                        Edit Qty
                      </Button> */}
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
                  setWholeRowsCellColor={(rowData) => {
                    if (rowData?.invalidDate) return 'error';
                    if (rowData?.isAppliedBill) return "isAppliedBill";
                    return '';
                  }}
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
            disabled={!appliedDate || rowsApplied.some(d => d.invalidDate === true)}
            onClick={() => {
              handleCreateBill();
            }}
          >
            Create Bill
          </Button>
        </CustomDialogFooter>
      </Dialog>
      {isProductEdit.open && (
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, rowData: null });
          }}
          isBulkedit={false}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={orginalMaterial.find((d) => d._id === isProductEdit.rowData._id)}
          material={material}
          selectedProducts={[]}
          loading={isUpdating}
          isQtyOnly={true}
        />
      )}
    </Fragment>
  );
};

export default CreateBillingDialog;
