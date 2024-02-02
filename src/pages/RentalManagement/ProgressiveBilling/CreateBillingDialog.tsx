import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Checkbox, Dialog, FormControlLabel, FormGroup, IconButton } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import moment from 'moment';
import {
  CustomDialogTransition,
  dateFormat,
  deliveryTicket,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  invoice,
  rentalManagement,
  MATERIAL_TYPE,
  ASSET_STATUS
} from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { camelCase, startCase } from 'lodash';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import EditIcon from '@material-ui/icons/Edit';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const CreateBillingDialog = ({ rentalManagementData, onClose, onSuccess }) => {
  const renderedFrom = `${camelCase(routes?.rentalManagementInvoice.title)}_create_invoice`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [material, setMaterial] = useState([]);
  const [orginalMaterial, setOrginalMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [appliedDate, setAppliedDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });
  const [proRata, setProRata] = useState(true);

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [proRata]);

  useEffect(() => {
    if (columns) {
      fetchData();
    }
  }, [columns, proRata]);

  const fetchFields = async () => {
    setColumns(null);
    var data = await fetch_rental_product_fields(rentalManagementData?.currency, false);
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    setAllFields(JSON.parse(JSON.stringify(data)));

    let newColumns = generateColumns(renderedFrom, data, null, false, rentalManagementData?.currency);

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile || isTablet ? 'none' : 'left',
        disabled: true,
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
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original.detail}</p>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : ''}
              </span>
            </Box>
            {row.original['type'] !== 'manualEntry' && (
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

    //remove all fields have 'estimate'
    newColumns = newColumns?.filter((d) => !d?.accessor?.includes('estimate'));

    const pricingMethodColumn = newColumns?.find((obj) => obj.accessor === 'pricingMethod');
    if (pricingMethodColumn) {
      pricingMethodColumn.Cell = ({ row }) => pricingMethodRenderer(row);
    }

    coloum = [...coloum, ...newColumns];

    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
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
    });

    setColumns(coloum);
  };

  const pricingMethodRenderer = (row) => {
    return row.original['pricingMethod'] ? (
      <>
        {' '}
        {['Per Week', 'Per Month'].includes(row.original['pricingMethod']) && proRata && row.original.isAppliedBill ? (
          <Box display="flex" alignItems="center">
            <p>{row.original['pricingMethod']}</p>
            <Box ml={1} />
            <HtmlTooltip title="Per Day Price is calculated">
              <InfoIcon fontSize="small" color="primary" />
            </HtmlTooltip>
          </Box>
        ) : (
          <p>{row.original['pricingMethod']}</p>
        )}
      </>
    ) : (
      <NoDataCell />
    );
  };

  const fetchData = async () => {

    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let data: any = {};
    let invoicedProducts: any = [];
    let additionalCost: any = [];
    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
    data = response?.data?.data;

    const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData?._id}/invoice/material-end-date-qty`);
    invoicedProducts = invoiceResponse?.data?.data?.material;
    additionalCost = invoiceResponse?.data?.data?.additionalCost;

    const queryString = `?rentalJob=${rentalManagementData._id}`;
    const invoiceDataResponce = await axiosInstance().get(`${invoice.api}${queryString}`);
    const invoiceData = invoiceDataResponce?.data?.data;

    const responseAdditionalCostData = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`);
    let additionalCostData = responseAdditionalCostData?.data?.data;
    if (additionalCost?.length > 0) {
      additionalCostData = additionalCostData.filter((d) => !additionalCost?.some((obj) => obj._id === d._id));
    }
    const result = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}`
    );
    const returnTicketProducts = {};
    result?.data?.data?.forEach((element) => {
      if (element.ticketType === DELIVERY_TICKET_TYPE.return && element?.products && element?.products?.length) {
        element?.products?.forEach((ele) => {
          returnTicketProducts[ele?.product] = ele?.qty;
        });
      }
    });

    let newMaterial: any = [];
    data?.material?.forEach((d) => {
      if (d?.type === MATERIAL_TYPE.service && d?.parentId === null && !d?.actualStartDate) {
        d['actualStartDate'] = new Date(d?.estimateStartDate).toISOString();
      }
      else if (d?.type === MATERIAL_TYPE.package && d?.packageDetail?.packageType === 'Service' && d?.parentId === null && !d?.actualStartDate) {
        d['actualStartDate'] = d?.estimateStartDate;
      }
      if (returnTicketProducts[d?.materialId] > 0) {
        let values = { qty: d?.qty - returnTicketProducts[d?.materialId] };
        returnTicketProducts[d?.materialId] = returnTicketProducts[d?.materialId] - d?.qty;
        const calValues = autoCalculateSpecificFields(values, { ...d, ...values }, allFields);
        Object.assign(d, calValues);
      }
    });

    data?.material?.filter((d) => d?.actualStartDate && d?.parentId === null && d?.type === MATERIAL_TYPE.product && d?.productDetail?.serializedProduct)
      ?.forEach((element) => {
        data?.inventory?.filter((d) => d._id === element?._id && !d.isReplaced && d?.manualStartDate)?.forEach((ele: any) => {
          ele.type = 'serializedAsset';
          ele.qty = 1;
          ele._id = ele?.inventoryDetail?._id;
          ele.materialId = ele?.inventoryDetail?._id;
          ele.description = `${element?.productDetail?.productName}-${element?.productDetail?.productDescription || ''}`;
          let values = { qty: 1 };
          values['actualStartDate'] = ele?.manualStartDate;
          values['actualEndDate'] = ele?.manualEndDate || element?.estimateEndDate;
          values['manualEndDate'] = ele?.manualEndDate;
          const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
          const { materialId, qty, type, _id, ...rest } = element;
          newMaterial.push({ ...rest, ...ele, ...calValues });
        });
      });

    data?.material?.filter((d) => d.actualStartDate)?.forEach((element) => {
      if (element?.parentId === null && element?.type === MATERIAL_TYPE.product && element?.productDetail?.serializedProduct) {
      } else {
        let values: any = {};
        values['actualEndDate'] = element?.actualEndDate || element?.estimateEndDate;
        values['manualEndDate'] = element?.actualEndDate;
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        newMaterial.push({ ...element, ...calValues });

        if (element?.type === MATERIAL_TYPE.product && element?.productDetail?.serializedProduct) {
          data?.inventory
            ?.filter((d) => d._id === element?._id && !d.isReplaced && d?.manualStartDate)
            ?.forEach((ele: any) => {
              ele.parentId = element?._id;
              ele.type = 'serializedAsset';
              ele.qty = 1;
              ele._id = ele?.inventoryDetail?._id;
              ele.materialId = ele?.inventoryDetail?._id;
              let values = { qty: 1 };
              values['actualStartDate'] = ele?.manualStartDate;
              values['actualEndDate'] = ele?.manualEndDate || element?.estimateEndDate;
              const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
              const { materialId, qty, type, _id, ...rest } = element;
              newMaterial.push({ ...rest, ...ele, ...calValues });
            });
        }
      }
    });

    if (additionalCostData.length > 0) {
      additionalCostData.forEach((element) => {
        element.type = 'manualEntry';
        element.materialId = element?._id;
        element.parentId = null;
        newMaterial.push(element);
      });
    }

    data.material = newMaterial;

    if (invoiceData?.length) {
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

          const product = invoicedProducts?.find((p) => p._id === e._id);
          if (product) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
            materialData.actualStartDate = actualEndDate;
          } else {
            materialData.actualStartDate = materialData.manualStartDate ? materialData.manualStartDate : new Date().setDate(new Date().getDate() + 1);
          }
          materialData.actualStartDate = new Date(materialData.actualStartDate)?.toISOString()

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
    initializeTable(data?.material);
  };

  const initializeTable = (material) => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

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
              : parent.type === 'manualEntry'
                ? parent?.costType
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
                : parent.type === 'manualEntry'
                  ? parent?.description
                  : '';
      parent.qtyDisplay = parent.qty;
      parent.isEditable =
        ['Per Day', 'Per Week', 'Per Month'].includes(parent?.pricingMethod) || parent.type === 'serializedAsset' || parent.type === 'manualEntry'
          ? false
          : true;
      parent.subRows = generateNestedData(material, parent);
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
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
      _subRow.isEditable = ['Per Day', 'Per Week', 'Per Month'].includes(_subRow?.pricingMethod) ? false : true;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const getParentIds = (_id, material, parentIds) => {
    const parent = material?.find((e) => e._id === _id);
    if (parent) {
      parentIds.push(parent._id);
      getParentIds(parent.parentId, material, parentIds);
    } else {
      return false;
    }
  };

  const handleApplyDate = async () => {
    let tempValues: any = { actualEndDate: endDate };
    var inUseStandByDays = [];
    if (user?.user?.brandPolicy?.assetDeliveredStatus) {
      const assetList: any = [];
      selectedRecords?.forEach((e) => {
        if (e.type === MATERIAL_TYPE.serializedAsset) {
          assetList.push({
            asset: e._id,
            startDate: moment(e.actualStartDate)?.format('MM/DD/YYYY'),
            endDate: moment(endDate)?.format('MM/DD/YYYY')
          });
        }
      });
      const inUseStandByDaysResponce = await axiosInstance().put(
        `/rental-management/${rentalManagementData?._id}/progressive-billing/date-range-status-count`,
        assetList
      );
      inUseStandByDays = inUseStandByDaysResponce?.data?.data;

      inUseStandByDays?.forEach((e) => {
        const asset = selectedRecords?.find((ele) => ele._id === e.asset);
        const parentIds = [];
        getParentIds(asset?.parentId, selectedRecords, parentIds);
        parentIds.push(asset?._id);
        e.parentIds = parentIds;
      });
    }

    const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData?._id}/invoice/material-end-date-qty`);
    const invoicedProducts = invoiceResponse?.data?.data?.material;

    let rows: any = [];
    selectedRecords?.forEach((element) => {
      if (element.type === 'manualEntry') {
        element.isAppliedBill = true;
        rows.push(element);
      } else {
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

        let priceFieldName = Object.keys(element).find((d) => d.includes('price_'));

        const priceField = allFields?.find((e) => e.fieldName === 'price');

        let calValues: any;
        let values = JSON.parse(JSON.stringify(tempValues));

        if (inUseStandByDays?.length) {
          const daysFound = inUseStandByDays?.find((e) => e.parentIds?.includes(element._id));
          if (daysFound) {
            values['inUseDays'] = daysFound[ASSET_STATUS.inUse] || 0;
            values['standByDays'] = daysFound[ASSET_STATUS.standBy] || 0;
            values['standByDaysNotChargeable'] = daysFound[ASSET_STATUS.standByNotChargeable] || 0;
          }
        }

        if (element.pricingMethod === 'Per Week') {
          if (proRata) {
            values['pricingMethod'] = 'Per Day';
            if (priceFieldName) {
              values[priceFieldName] = parseFloat(
                (orginalMaterial.find((d) => d._id === element._id)[priceFieldName] / 7)?.toFixed(priceField?.decimalPlaces || 2)
              );
            }
          }
          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
          calValues['pricingMethod'] = 'Per Week';
        } else if (element.pricingMethod === 'Per Month') {
          if (proRata) {
            values['pricingMethod'] = 'Per Day';
            if (priceFieldName) {
              values[priceFieldName] = parseFloat(
                (orginalMaterial.find((d) => d._id === element._id)[priceFieldName] / 30)?.toFixed(priceField?.decimalPlaces || 2)
              );
            }
          }
          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
          calValues['pricingMethod'] = 'Per Month';
        } else {
          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        }
        element.isAppliedBill = true;
        rows.push({ ...element, ...calValues });
      }
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

  const handleSaveData = async (rows: any) => {
    rows[0].isAppliedBill = true;
    const tempMaterial = [...material];
    tempMaterial?.forEach((e) => {
      const row = rows?.find((ele) => ele._id === e._id);
      if (row) {
        Object.assign(e, row);
      }
    })
    setMaterial(tempMaterial);
    initializeTable(tempMaterial);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows];
    });
    setIsProductEdit({ open: false, rowData: null });
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
      delete element?.subRows;
      delete element?.manualEndDate;
      delete element?.isAppliedBill;
      if (element.type !== 'manualEntry') {
        delete element?.description;
      }
    });
    setUpdating(true);
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing`, {
        material: rowsApplied.filter((d) => d.type !== 'manualEntry'),
        additionalCost: rowsApplied.filter((d) => d.type === 'manualEntry')
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
        <CustomDialogHeader title={`Create Billing `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <Grid container className={styles.rental_header_layout}>
                <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet"></Grid>
                <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                  <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                    <Grid style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }} className={isMobile ? styles.content_box : ''}>
                      <div>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={proRata} />}
                            key="proRata"
                            placeholder="Pro Rata"
                            label="Pro Rata"
                            style={{ whiteSpace: 'nowrap' }}
                            onChange={() => {
                              setProRata(!proRata);
                            }}
                          />
                        </FormGroup>
                      </div>
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
                      <Box style={{ display: 'flex', gap: '5px' }}>
                        <HtmlTooltip
                          title={
                            !Boolean(
                              selectedRecords && selectedRecords?.length && (endDate || selectedRecords?.every((d) => d.type === 'manualEntry'))
                            )
                              ? 'Please select product to apply'
                              : ''
                          }
                        >
                          <span>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={
                                !Boolean(
                                  selectedRecords && selectedRecords?.length && (endDate || selectedRecords?.every((d) => d.type === 'manualEntry'))
                                )
                              }
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
            {columns ? (
              <Box zIndex={5} p={1}>
                <CustomReactTable
                  height={'calc(100vh - 250px)'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  setWholeRowsCellColor={(rowData) => {
                    if (rowData?.invalidDate) return 'error';
                    if (rowData?.isAppliedBill) return 'isAppliedBill';
                    return '';
                  }}
                  refreshGrid={fetchData}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  expander={true}
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
                Create Bill
              </Button>
            </span>
          </HtmlTooltip>
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
