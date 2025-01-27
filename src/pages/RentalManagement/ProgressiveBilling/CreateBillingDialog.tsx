import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@mui/material/Grid2';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Checkbox, Dialog, FormControlLabel, FormGroup, IconButton } from '@mui/material';
import { useData } from 'src/StateProvider/Provider';
import { fetch_rental_cost_fields, fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import {
  CustomDialogTransition,
  deliveryTicket,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  invoice,
  rentalManagement,
  MATERIAL_TYPE,
  ASSET_STATUS,
  sidebarResource,
  getObjKeysWithValues,
  displayDate,
  dateFormatToSend
} from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { camelCase, isEqual, startCase } from 'lodash';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import { FiExternalLink } from 'react-icons/fi';
import InvoiceDataDialog from 'src/pages/RentalManagement/ProgressiveBilling/InvoiceDataDialog';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';
import { getNestedQty } from 'src/pages/RentalManagement/rentalOfflineHelper';

const calculateServiceDays = (serviceLog: any[], startDate: any, endDate: any) => {
  const uniqueDates = new Set<string>();
  const logs = [];
  const newStartDate = dayjs(startDate).startOf('day');
  const newEndDate = dayjs(endDate).startOf('day');
  serviceLog?.forEach((log) => {
    const logStartDate = dayjs(log.startDate).startOf('day');
    const logEndDate = dayjs(log.endDate || endDate).startOf('day');
    let index = 0;
    let tempStartDate;
    let tempEndDate;
    let count = 0;
    for (let m = dayjs(logStartDate); m.diff(logEndDate, 'day') <= 0;) {
      if (m.isBetween(newStartDate, newEndDate, null, '[]')) {
        uniqueDates.add(m.format('MM/DD/YYYY'));
        if (index === 0) {
          tempStartDate = new Date(m.format('MM/DD/YYYY'));
        }
        tempEndDate = new Date(m.format('MM/DD/YYYY'));
        count++;
        index++;
      }
      m = m.add(1, 'day')
    }
    if (count) {
      logs.push({ startDate: tempStartDate, endDate: tempEndDate, actualJobDuration: count });
    }
  });
  return { actualJobDuration: uniqueDates.size, logs };
};

const CreateBillingDialog = ({ rentalManagementData, onClose, onSuccess }) => {
  const renderedFrom = `${camelCase(sidebarResource.rentalManagementInvoice)}_create_invoice`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [orginalMaterial, setOrginalMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [materialFields, setMaterialFields] = useState([]);
  const [costFields, setCostFields] = useState([]);

  const [isApplingDate, setIsApplingDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });
  const [proRata, setProRata] = useState(true);
  const [rentalResourceData, setRentalResourceData] = useState(null);
  const [invoiceResourceData, setInvoiceResourceData] = useState(null);
  const [openInvoiceDataDialog, setOpenInvoiceDataDialog] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    axiosInstance()
      .get(`/dynamic-form/policy?resource=${sidebarResource.rentalManagement}`)
      .then(({ data: { data } }) => {
        setRentalResourceData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
    axiosInstance()
      .get(`/dynamic-form/policy?resource=${sidebarResource.invoice}`)
      .then(({ data: { data } }) => {
        setInvoiceResourceData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

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
    setMaterialFields(JSON.parse(JSON.stringify(data)));

    var costFields = await fetch_rental_cost_fields(rentalManagementData?.currency, false);
    setCostFields(costFields);

    let newColumns = generateColumns(
      renderedFrom,
      data?.filter((d) => d?.isRead),
      null,
      false,
      rentalManagementData?.currency
    );

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
              {row.original['type'] === MATERIAL_TYPE.product
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === MATERIAL_TYPE.package
                  ? row.original?.packageDetail?.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === MATERIAL_TYPE.service
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
          <div className="flex items-center gap-1">
            <p>{row.original.detail}</p>
            <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
              {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : ''}
            </span>
            {![MATERIAL_TYPE.manualEntry, MATERIAL_TYPE.other]?.includes(row.original['type']) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
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
    newColumns = newColumns?.filter((d) => !d?.accessor?.includes('estimate'));
    newColumns?.forEach((e) => {
      if (e.accessor === 'pricingMethod') {
        e.Cell = ({ row }) => pricingMethodRenderer(row);
      }
    });
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
      Cell: ({ row }) => (
        <>
          {row?.original['type'] !== 'other' && row.original.isEditable && (
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                setIsProductEdit({ open: true, rowData: row.original });
              }}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          )}
        </>
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

    const currency = rentalManagementData?.currency?.toLowerCase();

    const orignalMaterial = JSON.parse(JSON.stringify(data.material))

    data.material = data?.material?.filter((e) => e[`price_${currency}`] || e[`finalPrice_${currency}`]);

    if (rentalResourceData?.policy?.hidePackageInInvoice) {
      data.material = data.material?.filter((e) => e.type !== MATERIAL_TYPE.package);
      data.material?.forEach((e) => {
        e.qty = getNestedQty(orignalMaterial, e);
        e.parentId = null;
      });
    }

    let newMaterial: any = [];
    data?.material?.forEach((d) => {
      // if (d?.type === MATERIAL_TYPE.service && !d?.actualStartDate) {
      //   d['actualStartDate'] = new Date(d?.estimateStartDate).toISOString();
      // } else
      if (d?.type === MATERIAL_TYPE.package && !d?.actualStartDate) {
        d['actualStartDate'] = d?.estimateStartDate;
      }
      if (returnTicketProducts[d?.materialId] > 0) {
        let values = { qty: d?.qty - returnTicketProducts[d?.materialId] };
        returnTicketProducts[d?.materialId] = returnTicketProducts[d?.materialId] - d?.qty;
        const calValues = autoCalculateSpecificFields(values, { ...d, ...values }, materialFields);
        Object.assign(d, calValues);
      }
    });

    data?.material
      ?.filter((d) => d?.actualStartDate && d?.parentId === null && d?.type === MATERIAL_TYPE.product && d?.productDetail?.serializedProduct)
      ?.forEach((element) => {
        data?.inventory
          ?.filter((d) => d._id === element?._id && !d.isReplaced && d?.manualStartDate)
          ?.forEach((ele: any) => {
            ele.type = 'serializedAsset';
            ele.qty = 1;
            ele._id = ele?.inventoryDetail?._id;
            ele.materialId = ele?.inventoryDetail?._id;
            ele.description = `${element?.productDetail?.productName}-${element?.productDetail?.productDescription || ''}`;
            let values = { qty: 1 };
            values['actualStartDate'] = ele?.manualStartDate;
            values['actualEndDate'] = ele?.manualEndDate || element?.estimateEndDate;
            values['manualEndDate'] = ele?.manualEndDate;
            const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
            const { materialId, qty, type, _id, ...rest } = element;
            newMaterial.push({ ...rest, ...ele, ...calValues });
          });
      });

    data?.material
      ?.filter((d) => d.actualStartDate)
      ?.forEach((element) => {
        if (element?.parentId === null && element?.type === MATERIAL_TYPE.product && element?.productDetail?.serializedProduct) {
        } else {
          let values: any = {};
          if (element.type !== MATERIAL_TYPE.service) {
            values['actualEndDate'] = element?.actualEndDate || element?.estimateEndDate;
          }
          values['manualEndDate'] = element?.actualEndDate;
          const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
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
                const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
                const { materialId, qty, type, _id, ...rest } = element;
                newMaterial.push({ ...rest, ...ele, ...calValues });
              });
          }
        }
      });

    if (additionalCostData.length > 0) {
      additionalCostData.forEach((element) => {
        element.type = MATERIAL_TYPE.manualEntry;
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
          pMethod = pMethod.map((m) => m?.trim()).find((m) => !['Per Day', 'Per Week', 'Per Month', 'Per Barrel'].includes(m));

          if (!['Per Day', 'Per Week', 'Per Month', 'Per Barrel'].includes(materialData?.pricingMethod) || materialData?.pricingMethod === pMethod) {
            let tempTotalPrevQty = invoiceData
              .map((obj) => {
                let tempQty = obj.material?.find((ele) => ele._id === materialData._id)?.qty;
                if (tempQty) return tempQty;
              })
              .filter((d) => d);

            tempTotalPrevQty = tempTotalPrevQty.reduce((a, b) => a + b, 0);
            let values = { qty: materialData.qty - tempTotalPrevQty };
            const calValues = autoCalculateSpecificFields(values, { ...materialData, ...values }, materialFields);
            materialData = { ...materialData, ...calValues };
          }

          const product = invoicedProducts?.find((p) => p._id === e._id);
          if (product) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
            materialData.actualStartDate = actualEndDate;
          } else {
            materialData.actualStartDate = materialData.manualStartDate ? materialData.manualStartDate : new Date().setDate(new Date().getDate() + 1);
          }
          materialData.actualStartDate = new Date(materialData.actualStartDate)?.toISOString();

          const row: any = invoiceData[0]?.material.find((m) => m._id === e._id);
          if (row) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
            setEndDate(actualEndDate);
          }
          return materialData;
        })
        .filter((d) => d.qty > 0);
    }

    data.material?.forEach((element) => {
      if (element?.type === MATERIAL_TYPE.service && element?.pricingMethod === 'Per Day' && element?.serviceLog?.length) {
        const { actualJobDuration } = calculateServiceDays(element?.serviceLog, element['actualStartDate'], element['actualEndDate']);
        element.actualJobDuration = actualJobDuration;
      }
    });

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
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceName
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent?.inventoryDetail?.assetNumber
              : parent.type === MATERIAL_TYPE.manualEntry
                ? parent?.detail
                : parent.packageDetail?.packageName;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription || ''
          : parent.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === MATERIAL_TYPE.serializedAsset
                ? parent?.description || ''
                : parent.type === MATERIAL_TYPE.manualEntry
                  ? parent?.description
                  : '';
      parent.isEditable =
        ['Per Day', 'Per Week', 'Per Month'].includes(parent?.pricingMethod) ||
          parent.type === MATERIAL_TYPE.serializedAsset ||
          parent.type === MATERIAL_TYPE.manualEntry
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
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow?.inventoryDetail?.assetNumber
              : _subRow.type === MATERIAL_TYPE.package
                ? _subRow?.packageDetail?.packageName
                : _subRow.type === MATERIAL_TYPE.other
                  ? _subRow?.detail
                  : '';
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === MATERIAL_TYPE.serializedAsset
                ? _subRow?.description || ''
                : '';
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
    const records = [...selectedRecords];

    setIsApplingDate(true);
    dispatch({ type: 'loading', loading: true });
    const childRows: any = [];
    var inUseStandByDays = [];
    if (user?.user?.brandPolicy?.assetDeliveredStatus) {
      const assetList: any = [];
      records?.forEach((e) => {
        if (e.type === MATERIAL_TYPE.serializedAsset) {
          assetList.push({
            asset: e._id,
            startDate: dateFormatToSend(e.actualStartDate),
            endDate: dateFormatToSend(endDate)
          });
        }
      });
      const inUseStandByDaysResponce = await axiosInstance().put(
        `/rental-management/${rentalManagementData?._id}/progressive-billing/date-range-status-count`,
        assetList
      );
      inUseStandByDays = inUseStandByDaysResponce?.data?.data;

      inUseStandByDays?.forEach((e) => {
        const asset = records?.find((ele) => ele._id === e.asset);
        const parentIds = [];
        getParentIds(asset?.parentId, records, parentIds);
        parentIds.push(asset?._id);
        e.parentIds = parentIds;
      });
    }

    const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData?._id}/invoice/material-end-date-qty`);
    const invoicedProducts = invoiceResponse?.data?.data?.material;

    const assetList = records?.filter((r) => r?.pricingMethod === 'Per Barrel');
    let rentalUnitVolume;
    if (assetList?.length) {
      rentalUnitVolume = await axiosInstance().post(
        `${routes.rentalManagement.path}/${rentalManagementData?._id}/inventory/rental-unit-volume-utilization`,
        assetList?.map((d) => ({
          asset: d?._id,
          fromDate: dateFormatToSend(d?.actualStartDate),
          toDate: dateFormatToSend(endDate)
        }))
      );
    }

    let rows: any = [];

    records?.forEach((element) => {
      let values: any = { actualEndDate: endDate };

      if (element.type === MATERIAL_TYPE.manualEntry) {
        element.isAppliedBill = true;
        rows.push(element);
      } else {
        element.invalidDate = false;

        const product = invoicedProducts?.material?.find((p) => p._id === element._id);

        const productStartDateTime = dayjs(new Date(element.actualStartDate));
        const selectedEndDateTime = dayjs(new Date(endDate));

        if (productStartDateTime.isAfter(selectedEndDateTime)) {
          element.invalidDate = true;
        } else if (product) {
          const productEndDateTime = dayjs(new Date(product?.endDate));
          if (productEndDateTime.isAfter(selectedEndDateTime)) {
            element.invalidDate = true;
          } else {
            element.invalidDate = false;
          }
        }

        if (element?.manualEndDate) {
          const productManualEndDate = dayjs(new Date(element?.manualEndDate));
          if (selectedEndDateTime.isAfter(productManualEndDate)) {
            values.actualEndDate = element?.manualEndDate;
          }
          if (productStartDateTime.isAfter(productManualEndDate)) {
            element.invalidDate = true;
          }
        }

        let priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;

        const extraRows: any = [];
        const priceField = materialFields?.find((e) => e.fieldName === 'price');
        let calValues: any;

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
          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
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
          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
          calValues['pricingMethod'] = 'Per Month';
        } else if (element.pricingMethod === 'Per Barrel') {
          const totalBBLs = rentalUnitVolume?.data?.data
            ?.find((r) => r?.asset === element?._id)
            ?.data?.reduce((prevValue, currentValue) => prevValue + currentValue?.DailyEvapBBLs, 0);

          values['actualJobDuration'] = totalBBLs;
          if (priceFieldName) {
            values[priceFieldName] = parseFloat(
              orginalMaterial.find((d) => d._id === element._id)[priceFieldName]?.toFixed(priceField?.decimalPlaces || 2)
            );
          }

          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
          childRows.push(
            ...rentalUnitVolume?.data?.data
              ?.find((r) => r?.asset === element?._id)
              ?.data?.map((d) => ({
                ...d,
                type: MATERIAL_TYPE.other,
                detail: displayDate(d?.date),
                actualJobDuration: d?.DailyEvapBBLs,
                parentId: element?._id
              }))
          );
        } else {
          if (element?.type === MATERIAL_TYPE.service && element?.pricingMethod === 'Per Day' && element?.serviceLog?.length) {
            const { actualJobDuration, logs } = calculateServiceDays(element?.serviceLog, element['actualStartDate'], values['actualEndDate']);
            if (logs?.length > 1) {
              values['actualStartDate'] = logs[0]?.startDate;
              values['actualEndDate'] = logs[0]?.endDate;
              values['actualJobDuration'] = logs[0]?.actualJobDuration;
              element.hideSelection = true;
              logs?.forEach((e, index) => {
                if (index !== 0) {
                  const row = { ...element };
                  const tempValue = {};
                  tempValue['actualStartDate'] = e?.startDate;
                  tempValue['actualEndDate'] = e?.endDate;
                  tempValue['actualJobDuration'] = e?.actualJobDuration;
                  const tempCalValues = autoCalculateSpecificFields(tempValue, { ...row, ...tempValue }, materialFields);
                  row.isAppliedBill = true;
                  row.hideSelection = true;
                  extraRows.push({ ...row, ...tempCalValues });
                }
              });
            } else {
              values['actualJobDuration'] = actualJobDuration;
              if (!actualJobDuration) {
                element.invalidDate = true;
              }
            }
          }
          calValues = autoCalculateSpecificFields(values, { ...element, ...values }, materialFields);
        }
        element.isAppliedBill = true;
        rows.push({ ...element, ...calValues });
        if (extraRows?.length) {
          rows = [...rows, ...extraRows];
        }
      }
    });
    let tempRows: any = [];
    material?.forEach((obj) => {
      if (rows.filter((o) => o._id === obj._id)?.length) {
        tempRows = [...tempRows, ...rows.filter((o) => o._id === obj._id)];
      } else {
        tempRows.push(obj);
      }
    });

    const parentPackages = tempRows?.filter((ele) => !ele.parentId && ele.type === MATERIAL_TYPE.package);
    parentPackages.forEach((parent) => {
      processPackage(parent, tempRows);
    });

    setMaterial(tempRows);
    initializeTable([...tempRows, ...childRows]);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows, ...childRows];
    });
    setIsApplingDate(false);
  };

  const processPackage = (parent, allMaterial) => {
    const processMaterial = (parent) => {
      if ([MATERIAL_TYPE.service, MATERIAL_TYPE.product].includes(parent.type)) {
        return parent;
      }

      const childMaterial = allMaterial?.filter((m) => m.parentId && isEqual(m.parentId, parent._id)) || [];
      const childData = [];
      childMaterial?.forEach((child) => {
        const data = processMaterial(child);
        childData.push(data);
      });
      let updatedParent = parent;
      if (childData?.length > 0) {
        updatedParent = sumOnParent(parent, childData, materialFields, rentalManagementData.currency);
        let calValues = autoCalculateSpecificFields({ ['actualEndDate']: updatedParent['actualEndDate'] }, updatedParent, materialFields);

        if (calValues['actualJobDuration']) {
          updatedParent['actualJobDuration'] = calValues['actualJobDuration'];
        }
        Object.assign(parent, updatedParent);
      }

      return updatedParent;
    };

    processMaterial(parent);
  };

  const sumOnParent = (parent, child, fields, currency) => {
    const resetFields = [];
    fields.forEach((element) => {
      if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
        if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            resetFields.push({ fieldName: element.fieldName + '_' + _unit.toLowerCase(), type: 'amount' });
          });
        } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              resetFields.push({ fieldName: element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase(), type: 'amount' });
            });
          });
        } else if (element.type === 'currencyAmount') {
          element.displayCurrency.forEach((_currency) => {
            resetFields.push({ fieldName: element.fieldName + '_' + _currency.toLowerCase(), type: 'amount' });
          });
        }
      } else if (element.type === 'percent') {
        resetFields.push({ fieldName: element.fieldName, type: 'percent' });
      } else if (element.type === 'date') {
        resetFields.push({ fieldName: element.fieldName, type: 'date' });
      }
    });
    const sumValues: any = {};
    resetFields.forEach((_field: any) => {
      sumValues[_field.fieldName] = 0;
      if (['actualStartDate', 'actualEndDate'].includes(_field.fieldName)) {
        const { minStartDate, maxEndDate } = child?.reduce(
          (acc, ele) => {
            if (ele?.actualStartDate) {
              const startDate = new Date(ele?.actualStartDate);
              if (!acc.minStartDate || startDate < acc.minStartDate) {
                acc.minStartDate = startDate;
              }
            }
            if (ele?.actualEndDate) {
              const endDate = new Date(ele?.actualEndDate);
              if (!acc.maxEndDate || endDate > acc.maxEndDate) {
                acc.maxEndDate = endDate;
              }
            }
            return acc;
          },
          { minStartDate: null, maxEndDate: null }
        );

        sumValues['actualStartDate'] = minStartDate;
        sumValues['actualEndDate'] = maxEndDate;
      } else {
        child.forEach((element) => {
          sumValues[_field.fieldName] += element[_field.fieldName] ? element[_field.fieldName] : 0;
        });
      }
    });

    resetFields.forEach((ele) => {
      if (ele.type === 'amount') {
        parent[ele.fieldName] = sumValues[ele.fieldName];
      } else {
        if (ele.fieldName === 'discountPercentage') {
          parent[ele.fieldName] = parseFloat(
            ((sumValues[`discount_${currency?.toLowerCase()}`] / sumValues[`totalPrice_${currency?.toLowerCase()}`]) * 100)?.toFixed(2)
          );
        }
        if (ele.fieldName === 'taxPercentage') {
          parent[ele.fieldName] = parseFloat(
            (
              (sumValues[`tax_${currency?.toLowerCase()}`] /
                (sumValues[`totalPrice_${currency?.toLowerCase()}`] - sumValues[`discount_${currency?.toLowerCase()}`])) *
              100
            )?.toFixed(2)
          );
        }
        if (['actualStartDate', 'actualEndDate'].includes(ele.fieldName)) {
          parent[ele.fieldName] = sumValues[ele.fieldName];
        }
      }
    });
    return parent;
  };

  const handleSaveData = async (rows: any) => {
    rows[0].isAppliedBill = true;
    const tempMaterial = [...material];
    tempMaterial?.forEach((e) => {
      const row = rows?.find((ele) => ele._id === e._id);
      if (row) {
        Object.assign(e, row);
      }
    });
    setMaterial(tempMaterial);
    initializeTable(tempMaterial);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows];
    });
    setIsProductEdit({ open: false, rowData: null });
  };

  const handleCreateBill = (invoiceData = null) => {
    setIsSubmitting(true);
    const material = [];
    const additionalCost = [];
    rowsApplied?.forEach((element: any) => {
      if (element.type === MATERIAL_TYPE.service && element?.parentId) {
        if (!rowsApplied?.find((e) => e._id === element?.parentId)) {
          element.parentId = null;
        }
      }
      if ([MATERIAL_TYPE.manualEntry]?.includes(element?.type)) {
        additionalCost.push({
          _id: element._id,
          type: element.type,
          ...getObjKeysWithValues(element, costFields)
        });
      } else {
        const obj: any = {
          _id: element._id,
          type: element.type,
          parentId: element.parentId,
          materialId: element.materialId,
          ...getObjKeysWithValues(element, materialFields)
        };
        if (element?.type === MATERIAL_TYPE.other) {
          obj.detail = element.detail;
        }
        material.push(obj);
      }
    });
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing`, {
        material: material,
        additionalCost: additionalCost,
        invoiceData: invoiceData
      })
      .then(() => {
        setIsSubmitting(false);
        setOpenInvoiceDataDialog(false);
        onSuccess();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Create Billing `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <Grid container className={styles.rental_header_layout}>
              <Grid size={{ xs: 12, md: 6, sm: 12 }} className="d-flex align-items-center layout-for-tablet gap-1"></Grid>
              <Grid size={{ xs: 12, md: 6, sm: 12 }} className={styles.filter_side}>
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
                    <CustomDatePicker
                      fullWidth
                      size="small"
                      value={endDate}
                      name="endDate"
                      label="Invoice Closing Date"
                      onChange={(date: any) => {
                        setEndDate(date ? date : null);
                      }}
                      margin="dense"
                    />
                    <Box style={{ display: 'flex', gap: '5px' }}>
                      <HtmlTooltip
                        title={
                          selectedRecords?.length === 0
                            ? 'Please select items to apply'
                            : selectedRecords?.every((d) => d.type === MATERIAL_TYPE.manualEntry)
                              ? ''
                              : !dayjs(endDate)?.isValid()
                                ? 'Please select valid date'
                                : ''
                        }
                      >
                        <span>
                          <ThemeButton
                            buttonType="theme"
                            disabled={
                              isApplingDate ||
                              !Boolean(
                                selectedRecords?.length &&
                                ((endDate && dayjs(endDate)?.isValid()) || selectedRecords?.every((d) => d.type === MATERIAL_TYPE.manualEntry))
                              )
                            }
                            onClick={() => {
                              handleApplyDate();
                            }}
                          >
                            Apply
                          </ThemeButton>
                        </span>
                      </HtmlTooltip>
                    </Box>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Fragment>
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
                refreshGrid={() => {
                  setRowsApplied([]);
                  fetchData();
                }}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                expander={rentalResourceData?.policy?.hidePackageInInvoice ? false : true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton
            buttonType="transparent"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </ThemeButton>
          <HtmlTooltip
            title={
              rowsApplied?.length === 0
                ? 'Please select items and invoice closing date then apply '
                : rowsApplied?.some((d) => d.invalidDate === true)
                  ? 'Please select an appropriate date !'
                  : 'Create Bill'
            }
          >
            <span>
              <ThemeButton
                buttonType="theme"
                disabled={isSubmitting || rowsApplied?.length === 0 || rowsApplied.some((d) => d.invalidDate === true)}
                onClick={() => {
                  if (invoiceResourceData?.policy?.rentalInvoiceFields?.length > 0) {
                    setOpenInvoiceDataDialog(true);
                  } else {
                    handleCreateBill();
                  }
                }}
              >
                Create Bill
              </ThemeButton>
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
          loading={isSubmitting}
          isQtyOnly={true}
          isRateRequired={false}
        />
      )}
      {openInvoiceDataDialog && (
        <InvoiceDataDialog
          onClose={() => {
            setOpenInvoiceDataDialog(false);
          }}
          invoiceFields={invoiceResourceData?.policy?.rentalInvoiceFields}
          onSuccess={(data) => {
            handleCreateBill(data);
          }}
        />
      )}
    </Fragment>
  );
};

export default CreateBillingDialog;
