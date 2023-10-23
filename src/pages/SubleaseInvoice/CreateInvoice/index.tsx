import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton } from '@material-ui/core';
import { fetch_sublease_product_fields } from 'src/components/Sublease/helper';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import {
  CustomDialogTransition,
  dateFormat
} from 'src/constants/helpers';
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
import { camelCase, startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { generateCustomTableColumns } from 'src/constants/columns';
import moment from 'moment';

const CreateInvoiceDialog = ({ onClose, onSuccess, subleaseData }) => {

  const toastConfig = useContext(CustomToastContext);

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [material, setMaterial] = useState([]);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [appliedDate, setAppliedDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);

  const renderedFrom = `${camelCase(routes?.subleaseInvoice.title)}_create`;

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (columns) {
      fetchData();
    }
  }, [columns]);

  const fetchFields = async () => {
    setColumns(null);
    var data = await fetch_sublease_product_fields(subleaseData?.currency);
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateCustomTableColumns(data, subleaseData?.currency, renderedFrom);
    setAllFields(JSON.parse(JSON.stringify(data)));
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
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
                  ? row.original?.packageDetail?.packageType === 'Product'
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
                } else if (row.original.type === 'serializedAsset') {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
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
    column = [...column, ...newColumns];
    setColumns(column);
  };


  const fetchData = async () => {
    let data: any = {};
    let invoicedProducts: any = [];

    const response = await axiosInstance().get(`/sublease-invoice/material/${subleaseData._id}`);
    const invoiceResponse = await axiosInstance().get(`/sublease-invoice/${subleaseData?._id}/invoice/material-end-date-qty`);
    invoicedProducts = invoiceResponse?.data?.data?.material;

    data = response?.data?.data;


    let newMaterial: any = [];
    data?.material?.forEach((d) => {
      if (d?.type === 'service' && d?.parentId === null && !d?.actualStartDate) {
        d['actualStartDate'] = d?.estimateStartDate;
      }
      if (d?.type === 'package' && d?.packageDetail?.packageType === 'Service' && d?.parentId === null && !d?.actualStartDate) {
        d['actualStartDate'] = d?.estimateStartDate;
      }
    });

    data?.material
      ?.filter((d) => d.actualStartDate)
      ?.forEach((element) => {
        let values: any = {};
        values['actualEndDate'] = element?.actualEndDate || element?.estimateEndDate;
        values['manualEndDate'] = element?.actualEndDate;
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        newMaterial.push({ ...element, ...calValues });
      });

    data.material = newMaterial;
    if (invoicedProducts?.length) {
      data.material = data?.material
        ?.map((e) => {
          let materialData: any = { ...e };

          let pMethod = materialData?.pricingMethod?.split(',') || [];
          pMethod = pMethod.map((m) => m?.trim()).find((m) => !['Per Day', 'Per Week', 'Per Month'].includes(m));

          const product = invoicedProducts?.find((p) => p._id === e._id);
          if (product) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
            materialData.actualStartDate = actualEndDate;
          } else {
            materialData.actualStartDate = materialData.manualStartDate ? materialData.manualStartDate : new Date().setDate(new Date().getDate() + 1);
          }

          return materialData;
        })
        .filter((d) => d.qty > 0);
    }

    setMaterial(data?.material);
    initializeTable(data?.material);
  };

  const initializeTable = (material) => {
    const rows = material?.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent.type === 'serializedAsset'
              ? parent?.inventoryDetail?.assetNumber
              : parent.packageDetail?.packageName;
      parent.description =
        parent.type === 'product'
          ? parent?.productDetail?.productDescription || ''
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === 'serializedAsset'
                ? parent?.description || ''
                : '';
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(material, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow.type === 'serializedAsset'
              ? _subRow?.inventoryDetail?.assetNumber
              : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === 'serializedAsset'
                ? _subRow?.description || ''
                : '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleApplyDate = async () => {
    let tempValues: any = { actualEndDate: endDate };

    const invoiceResponse = await axiosInstance().get(`/sublease-invoice/${subleaseData?._id}/invoice/material-end-date-qty`);
    const invoicedProducts = invoiceResponse?.data?.data?.material;

    let rows: any = [];
    selectedProducts.forEach((element) => {

      element.invalidDate = false;

      const product = invoicedProducts?.material?.find((p) => p._id === element._id);

      const productStartDateTime = new Date(new Date(element.actualStartDate).toLocaleDateString()).getTime();
      const selectedEndDateTime = new Date(new Date(endDate).toLocaleDateString()).getTime();

      if (selectedEndDateTime < productStartDateTime) {
        element.invalidDate = true;
      } else if (product) {
        const productEndDateTime = new Date(new Date(product?.endDate).toLocaleDateString()).getTime();
        if (selectedEndDateTime < productEndDateTime) {
          element.invalidDate = true;
        } else {
          element.invalidDate = false;
        }
      }

      if (element?.manualEndDate) {
        const productManualEndDate = new Date(new Date(element?.manualEndDate).toLocaleDateString()).getTime();
        if (selectedEndDateTime > productManualEndDate) {
          tempValues.actualEndDate = element?.manualEndDate;
        }
        if (productManualEndDate < productStartDateTime) {
          element.invalidDate = true;
        }
      }
      let calValues: any;
      tempValues.pricingMethod = element?.pricingMethod;
      let values = JSON.parse(JSON.stringify(tempValues));
      calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
      element.isAppliedBill = true;
      rows.push({ ...element, ...calValues });
    });

    let tempRows = material?.map((obj) => rows.find((o) => o._id === obj._id) || obj);

    setMaterial(tempRows);
    initializeTable(tempRows);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows];
    });
    setAppliedDate(true);
  };

  const handleCreateBill = () => {
    rowsApplied?.forEach((element) => {
      delete element?.index;
      delete element?.detail;
      delete element?.qtyDisplay;
      delete element?.hideSelection;
      delete element?.productDetail;
      delete element?.packageDetail;
      delete element?.serviceDetail;
      delete element?.inventoryDetail;
      delete element?.description;
      delete element?.subRows;
      delete element?.manualEndDate;
    });
    setUpdating(true);
    axiosInstance()
      .post(`/sublease-invoice/${subleaseData._id}/progressive-billing`, {
        material: rowsApplied,
      })
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
        <CustomDialogHeader title={`Create Invoice`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <Grid container className={styles.rental_header_layout}>
                <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet"></Grid>
                <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                  <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                    <Grid style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }} className={isMobile ? styles.content_box : ''}>
                      <KeyboardDatePicker
                        autoOk
                        fullWidth
                        size="small"
                        variant="inline"
                        inputVariant="outlined"
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
                      <Box>
                        <HtmlTooltip title={selectedProducts?.length ? '' : 'Please select items to apply'}  >
                          <span>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={selectedProducts?.length && moment(endDate)?.isValid() ? false : true}
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
                    if (rowData?.isAppliedBill) return 'isAppliedBill';
                    return '';
                  }}
                  onSelect={setSelectedProducts}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                />
              </Box>
            ) : (
              <Box p={2} height={500}>
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
          <HtmlTooltip
            title={
              !appliedDate
                ? 'Please select items and apply end date'
                : rowsApplied?.some((d) => d.invalidDate === true)
                  ? 'Please select an appropriate date !'
                  : 'Create Bill'
            }
          >
            <span>
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                disabled={isUpdating || !appliedDate || rowsApplied.some((d) => d.invalidDate === true)}
                onClick={() => {
                  handleCreateBill();
                }}
              >
                Create Invoice
              </Button>
            </span>
          </HtmlTooltip>
        </CustomDialogFooter>
      </Dialog>

    </Fragment>
  );
};

export default CreateInvoiceDialog;
