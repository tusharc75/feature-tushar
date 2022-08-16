import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box, Tooltip, IconButton } from '@material-ui/core';
import { camelCase, capitalize, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdChevronLeft } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel, primaryFields, productInventory, isObjectEmpty } from 'src/constants/helpers';
import Loader from 'src/components/Loader';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from '../ReportFilters';
import { DateRenderer, NumberRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import HistoryIcon from '@material-ui/icons/History';
import AverageCostHistory from '../AverageCostHistory';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from '../../../components/Helpers/NoDataCell';

let cancelTokenSource = null;

const Report = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  } = useData();
  const { type } = useParams();
  const history = useHistory();

  const resourceCamelCase = camelCase(type);
  const resourceStartCase = startCase(type);
  const renderedFrom = `${type}_report`;

  const [showGrid, setShowGrid] = React.useState(false);
  const [selectedData, setSelectedData] = React.useState(null);
  const [betweenDate, setBetweenDate] = React.useState(null);
  const [statusPeriodDate, setStatusPeriodDate] = React.useState(null);
  const [filterOptions, setFilterOptions] = React.useState([]);
  const [selectedResources, setSelectedResources] = React.useState([]);
  const [resourceOptions, setResourceOptions] = React.useState(null);
  const [formValues, setFormValues] = React.useState({});
  const [resourceColumns, setResourceColumns] = React.useState([]);
  const [isExporting, setExporting] = React.useState(false);
  const [loadingColumns, setLoadingColumns] = React.useState(false);
  const [statusPeriod, setStatusPeriod] = React.useState(false);
  const [reportList, setReportList] = React.useState([]);
  const [selectedReportView, setSelectedReportView] = React.useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');

  // Grid Configs
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const { getColumnData } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, sorting, search, limit, filters, pageSizes } = state;

  const [showPriceHistory, setShowPriceHistory] = React.useState({ open: false, product: '', productName: '' });
  const [showPricefilter, setShowPricefilter] = React.useState({ warehouse: null, fromDate: null, toDate: null });

  const fetchGridColumns = async () => {
    try {
      setLoadingColumns(true);
      let columns = [];
      let rendererNames = [];
      let resourceFieldData = [];

      if (resourceCamelCase === 'purchaseOrderProduct') {
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: POProductFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order Product`);
        let {
          data: { data: productOption }
        } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product`);

        POFields.filter((field) =>
          ['purchaseOrderNumber', 'purchaseOrderDate', 'supplierAccount', 'warehouse'].includes(field?.fieldData.fieldName)
        ).forEach((field: any) => {
          if (field?.fieldData.fieldName === 'purchaseOrderNumber') {
            resourceFieldData.push(field);
            columns.push({
              field: 'purchaseOrder',
              headerName: field?.fieldData?.fieldLabel,
              show: true,
              disabled: false,
              cellRenderer: 'purchaseOrderRenderer'
            });
          }
          if (field?.fieldData.fieldName === 'supplierAccount') {
            resourceFieldData.push(field);
            columns.push({
              field: 'supplierAccount',
              headerName: field?.fieldData?.fieldLabel,
              show: true,
              disabled: false,
              cellRenderer: 'supplierRenderer'
            });
          }
          if (field?.fieldData.fieldName === 'warehouse') {
            resourceFieldData.push(field);
            columns.push({
              field: 'warehouse',
              headerName: field?.fieldData?.fieldLabel,
              show: true,
              disabled: false,
              cellRenderer: 'plantRenderer'
            });
          }
          if (field?.fieldData.fieldName === 'purchaseOrderDate') {
            resourceFieldData.push(field);
            columns.push({
              field: 'purchaseOrderDate',
              headerName: field?.fieldData?.fieldLabel,
              show: true,
              disabled: false,
              cellRenderer: 'dateRenderer'
            });
          }
        });

        productFields
          .filter((field) => ['productName', 'productNumber'].includes(field?.fieldData.fieldName))
          .forEach((field: any) => {
            if (field?.fieldData.fieldName === 'productName') {
              resourceFieldData.push({
                ...field,
                fieldData: { ...field.fieldData, fieldName: 'productId', type: 'dropDown', lookup: true, option: productOption?.Product || [] }
              });
              columns.push({
                field: 'productName',
                headerName: field?.fieldData?.fieldLabel,
                show: true,
                disabled: false,
                cellRenderer: 'productRenderer'
              });
            }
            if (field?.fieldData.fieldName === 'productNumber') {
              columns.push({
                field: 'productNumber',
                headerName: field?.fieldData?.fieldLabel,
                show: true,
                disabled: false,
                cellRenderer: 'commonRenderer'
              });
            }
          });

        POProductFields.forEach((o) => {
          let currentColumn = getColumnData('Purchase Order Product', o?.fieldData, '');
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent, ...customFrameworkComponents });
        columns = [
          ...columns,
          {
            field: 'soldQty',
            headerName: 'Sold Qty',
            show: true,
            disabled: false,
            cellRenderer: 'commonRenderer'
          }
        ];
      }
      if (resourceCamelCase === 'productAverageCost') {
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);
        // let {
        //   data: { data: productOption }
        // } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product`);

        POFields.filter((field) => ['purchaseOrderDate', 'supplierAccount', 'warehouse'].includes(field?.fieldData.fieldName)).forEach((field) => {
          if (field?.fieldData.fieldName === 'warehouse') {
            resourceFieldData.push(field);
          }
          // if (field?.fieldData.fieldName === 'supplierAccount') {
          //   resourceFieldData.push(field);
          //   // columns.push({
          //   //   field: 'supplierAccount',
          //   //   headerName: field?.fieldData?.fieldLabel,
          //   //   show: true,
          //   //   disabled: false,
          //   //   cellRenderer: 'supplierRenderer'
          //   // });
          // }
          if (field?.fieldData.fieldName === 'purchaseOrderDate') {
            resourceFieldData.push({
              ...field,
              fieldData: { ...field.fieldData, fieldLabel: 'Date', fieldName: 'date', type: 'date' }
            });
          }
        });

        productFields.forEach((o: any) => {
          if (o?.fieldData.fieldName === 'productCategory') {
            resourceFieldData.push(o);
          }
          // if (o?.fieldData.fieldName === 'productName') {
          //   resourceFieldData.push({
          //     ...o,
          //     fieldData: { ...o.fieldData, fieldName: 'product', type: 'dropDown', lookup: true, option: productOption?.Product || [] }
          //   });
          // }
          let currentColumn = getColumnData('Product', o?.fieldData, routes['productDetail'].path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent, ...customFrameworkComponents });
        columns = [
          ...columns,
          {
            field: 'availableQty',
            headerName: 'Quantity',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          },
          {
            field: 'averagePrice',
            headerName: 'Average Price',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          },
          {
            field: 'totalPrice',
            headerName: 'Total',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          }
        ];

        if (productFields?.filter((e) => e.fieldData.fieldName === 'listPrice')?.length) {
          columns.push({
            field: 'margin',
            headerName: 'Margin',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          });
        }

        columns?.forEach((e) => {
          if (
            [
              'productName',
              'productDescription',
              'productCategory',
              'productCondition',
              'availableQty',
              'averagePrice',
              'totalPrice',
              'margin'
            ].includes(e.field)
          ) {
            e.show = true;
          } else {
            e.show = false;
          }
        });
      }
      if (resourceCamelCase === 'productInventoryHistory') {
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: productOption }
        } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product`);

        POFields.filter((field) => ['purchaseOrderDate', 'warehouse'].includes(field?.fieldData.fieldName)).forEach((field) => {
          if (field?.fieldData.fieldName === 'warehouse') {
            resourceFieldData.push(field);
          }
          if (field?.fieldData.fieldName === 'purchaseOrderDate') {
            resourceFieldData.push({
              ...field,
              fieldData: { ...field.fieldData, fieldLabel: 'Date', fieldName: 'date', type: 'date' }
            });
          }
        });

        productFields
          .filter((field) => ['productName'].includes(field?.fieldData.fieldName))
          .forEach((field: any) => {
            if (field?.fieldData.fieldName === 'productName') {
              resourceFieldData.push({
                ...field,
                fieldData: { ...field.fieldData, fieldName: 'product', type: 'dropDown', lookup: true, option: productOption?.Product || [] }
              });
              columns.push({
                field: 'product',
                headerName: field?.fieldData?.fieldLabel,
                show: true,
                disabled: false,
                cellRenderer: 'productRenderer'
              });
            }
          });

        columns = [
          ...columns,
          { field: 'date', headerName: 'Date', show: true, cellRenderer: 'dateTimeRenderer', filter: false, sortable: false },
          { field: 'referenceType', headerName: 'Reference Type', show: true, cellRenderer: 'commonRenderer' },
          { field: 'reference', headerName: 'Reference', filter: false, sortable: false, show: true, cellRenderer: 'referenceRenderer' },
          { field: 'type', headerName: 'Type', show: true, cellRenderer: 'creditDebitTypeRenderer' },
          {
            field: 'qty',
            headerName: 'Credit/Debit',
            show: true,
            cellRenderer: 'creditDebitRenderer',
            filter: false,
            sortable: false,
            cellStyle: (params) => {
              if (params?.data?.type === 'credit') {
                return { backgroundColor: '#90ee90' };
              }
              if (params?.data?.type === 'debit') {
                return { backgroundColor: '#FFCCCB' };
              }
            }
          },
          { field: 'price', headerName: 'Price', show: true, filter: false, cellRenderer: 'commonRenderer' },
          { field: 'totalPrice', headerName: 'Amount', show: true, filter: false, cellRenderer: 'commonRenderer' },
          { field: 'warehouse', headerName: 'Plant', show: true, cellRenderer: 'commonRenderer' },
          { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
          { field: 'serialNumber', headerName: 'Serial Number', filter: false, show: true, cellRenderer: 'serialNumberRenderer' },
          { field: 'user', headerName: 'Transacted By', show: true, cellRenderer: 'commonRenderer' }
        ];

        setFrameWorkComponent({
          productRenderer: ProductRenderer,
          referenceRenderer: ReferenceRenderer,
          creditDebitTypeRenderer: CreditDebitTypeRenderer,
          creditDebitRenderer: CreditDebitRenderer,
          commonRenderer: CommonRenderer,
          serialNumberRenderer: SerialNumberRenderer,
          dateTimeRenderer: DateTimeRenderer
        });
      }
      if (resourceCamelCase === 'supplierWiseProductPrice') {
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);
        let {
          data: { data: productOption }
        } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product`);

        productFields.forEach((o: any) => {
          if (o?.fieldData.fieldName === 'productName') {
            resourceFieldData.push({
              ...o,
              fieldData: { ...o.fieldData, fieldName: 'product', type: 'dropDown', lookup: true, option: productOption?.Product || [] }
            });
          }
        });

        POFields.filter((field) => ['purchaseOrderDate', 'supplierAccount', 'warehouse'].includes(field?.fieldData.fieldName)).forEach((field) => {
          if (field?.fieldData.fieldName === 'warehouse') {
            resourceFieldData.push(field);
          }
          if (field?.fieldData.fieldName === 'supplierAccount') {
            resourceFieldData.push(field);
          }
          if (field?.fieldData.fieldName === 'purchaseOrderDate') {
            resourceFieldData.push({
              ...field,
              fieldData: { ...field.fieldData, fieldLabel: 'Date', fieldName: 'date', type: 'date' }
            });
          }
        });

        columns = [
          {
            field: 'product',
            headerName: 'Product',
            show: true,
            disabled: false,
            cellRenderer: 'productRenderer'
          },
          {
            field: 'supplierAccount',
            headerName: 'Supplier Account',
            show: true,
            disabled: false,
            cellRenderer: 'supplierRenderer'
          },
          {
            field: 'totalQty',
            headerName: 'Quantity',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          },
          {
            field: 'averagePrice',
            headerName: 'Average Price',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          },
          {
            field: 'totalPrice',
            headerName: 'Total',
            show: true,
            disabled: false,
            filter: false,
            sortable: false,
            cellRenderer: 'numberRenderer'
          }
        ];

        setFrameWorkComponent({
          productRenderer: ProductRenderer,
          supplierRenderer: SupplierRenderer,
          commonRenderer: CommonRenderer,
          numberRenderer: NumberRenderer
        });
      }

      setResourceColumns(resourceFieldData);
      setColumns(columns);
      setLoadingColumns(false);
    } catch (error) {
      setLoadingColumns(false);
      toastConfig.setToastConfig(error);
    }
  };

  React.useEffect(() => {
    if (initialRender.current) {
      fetchGridColumns();
      initialRender.current = false;
    }
  }, []);

  React.useEffect(() => {
    axiosInstance()
      .get(`/report-colum-setting?resource=${type}`)
      .then(({ data: { data } }) => {
        setReportList(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [showGrid]);

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, selectedEntity]);

  React.useEffect(() => {
    // const selectedResourceNames = selectedResources?.map((field) => field.fieldName);
    // const selectedDataNames = Object.keys(selectedData);
    if (!selectedData) return;
    setSelectedData((prevState: any) => {
      const dataKeys = Object.keys(prevState);
      const selectedKeys = Object.keys(selectedResources);

      if (selectedResources.length > 0 && dataKeys.length > 0) {
        dataKeys.forEach((key) => {
          if (selectedKeys.includes(key) && prevState?.hasOwnProperty(key)) {
            delete prevState[key];
          }
        });
      }
      return prevState;
    });
  }, [selectedData, selectedResources]);

  const SerialNumberRenderer = (params: any) => (
    <span>{params?.value?.length ? params?.value?.map((e) => e?.serialNumber)?.toString() : <NoDataCell />}</span>
  );

  const CreditDebitRenderer = (params: any) => (
    <span>{params?.value ? params?.data?.type === 'debit' ? `-${params?.value}` : params?.value : <NoDataCell />}</span>
  );

  const ReferenceRenderer = (params) =>
    params?.value ? (
      params.data.referenceType === 'Purchase Order' ? (
        <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Inventory' ? (
        <Link className="link" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Asset' ? (
        <Link className="link" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Sales Order' ? (
        <Link className="link" title={params.value} to={`${routes.salesOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Bulk Asset Creation' ? (
        <Link className="link" title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Serialized Asset' ? (
        <Link className="link" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : (
        params.value
      )
    ) : params.data.referenceType === 'Product Inventory' ? (
      <p>Manual Entry</p>
    ) : (
      <NoDataCell />
    );

  const CreditDebitTypeRenderer = (params: any) => <span>{capitalize(params?.value)}</span>;

  const PurchaseOrderRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.purchaseOrderId}`}>
      {params.value}
    </Link>
  );

  const ProductRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
      {params.value}
    </Link>
  );

  const PlantRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.warehouseDetail.path}/${params.data.warehouseId}`}>
      {params.value}
    </Link>
  );

  const SupplierRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.supplierAccountDetail.path}/${params.data.supplierAccountId}`}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip title="View History">
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowPriceHistory({ open: true, product: params?.data?._id, productName: params?.data?.productName });
          }}
        >
          <HistoryIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
    </>
  );

  const customFrameworkComponents = {
    purchaseOrderRenderer: PurchaseOrderRenderer,
    productRenderer: ProductRenderer,
    plantRenderer: PlantRenderer,
    supplierRenderer: SupplierRenderer,
    actionsRenderer: ActionsRenderer,
    numberRenderer: NumberRenderer,
    dateRenderer: DateRenderer
  };

  const fetchResourceData = () => {
    setShowGrid(true);
    let filterQuery = getFilter();
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(
        `${
          resourceCamelCase === 'purchaseOrderProduct'
            ? `${productInventory.api}/report/purchase-order-product-wise-report`
            : resourceCamelCase === 'productAverageCost'
            ? `${productInventory.api}/report/purchase-order-price`
            : resourceCamelCase === 'productInventoryHistory'
            ? `${productInventory.api}/report/history-report`
            : `${productInventory.api}/report/supplier-product-price`
        }${filterQuery}`,
        {
          cancelToken: cancelTokenSource.token
        }
      )
      .then(({ data: { data, count } }) => {
        data = data.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          if (finalObject?.listPrice) {
            finalObject.margin = ((finalObject?.listPrice + (finalObject?.averagePrice || 0)) / finalObject?.listPrice)?.toFixed(2);
          }
          return finalObject;
        });
        dispatch({ type: 'initialize', data: data, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
          toastConfig.setToastConfig(err);
        }
      });
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const getFilter = (isExport = false) => {
    setShowPricefilter({ warehouse: null, fromDate: null, toDate: null });
    let filterQuery = ``;
    if (!isExport) {
      filterQuery = `page=${page}&limit=${limit}&`;
    }
    if (sorting.length > 0) {
      filterQuery = `${filterQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      filterQuery = `${filterQuery}search=${encodeURI(search)}&`;
    }
    if (selectedResources.length > 0) {
      let deepFilter = [];
      if (selectedData) {
        const keys = selectedData ? Object.keys(selectedData) : [];
        const idFilter = keys.filter((key) => selectedData[key] && selectedData[key].lookup);
        const forDeepFilter = keys.filter((key) => selectedData[key] && !selectedData[key].lookup);

        let filterById = idFilter.map((key) => {
          if (key === 'warehouse') {
            setShowPricefilter((prevState) => ({ ...prevState, warehouse: options.map((d: any) => d.optionValue) }));
          }
          const options = selectedData[key].value;
          return {
            field: key,
            term: {
              $in: options.map((d: any) => d.optionValue)
            }
          };
        });

        forDeepFilter.forEach((key) => {
          const options = selectedData[key].value;
          options.forEach((o: any) => {
            deepFilter.push({
              field: key,
              term: o.optionValue
            });
          });
        });

        if (filterById.length > 0) {
          filterQuery = `${filterQuery}filterById=${JSON.stringify(filterById)}&`;
        }
      }

      if (betweenDate) {
        const fields = Object.keys(betweenDate);
        fields.forEach((field) => {
          if (betweenDate[field]) {
            if (field === 'from_date') {
              setShowPricefilter((prevState) => ({ ...prevState, fromDate: moment(betweenDate[field]).format('MM/DD/YYYY') }));
            }
            if (field === 'to_date') {
              setShowPricefilter((prevState) => ({ ...prevState, toDate: moment(betweenDate[field]).format('MM/DD/YYYY') }));
            }
            deepFilter.push({
              field,
              term: moment(betweenDate[field]).format('MM/DD/YYYY')
            });
          }
        });
      }

      if (deepFilter && deepFilter.length > 0) {
        filterQuery = `${filterQuery}deepFilter=${encodeURI(JSON.stringify(deepFilter))}&`;
      }
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      filterQuery = `${filterQuery}deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&`;
    }

    if (statusPeriod && statusPeriodDate) {
      const fields = Object.keys(statusPeriodDate);
      fields.forEach((field) => {
        if (statusPeriodDate[field]) {
          filterQuery = `${filterQuery}${field}=${moment(statusPeriodDate[field]).format('MM/DD/YYYY')}& `;
        }
      });
    }

    return `?${filterQuery}`;
  };

  const exportData = () => {
    if (isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    let columns = [];
    if (gridApi) {
      columns = gridApi.columnController.displayedColumns;
      columns = columns.map((col) => col.colId);
    }
    setExporting(true);
    let filterQuery = getFilter(true);
    axiosInstance()
      .get(
        `${
          resourceCamelCase === 'purchaseOrderProduct'
            ? `${productInventory.api}/report/purchase-order-product-wise-report/export`
            : resourceCamelCase === 'productAverageCost'
            ? `${productInventory.api}/report/purchase-order-price/export`
            : resourceCamelCase === 'productInventoryHistory'
            ? `${productInventory.api}/report/history-report/export`
            : `${productInventory.api}/report/supplier-product-price/export`
        }${filterQuery}&exportColumn=${JSON.stringify(columns)} `,
        {
          responseType: 'arraybuffer'
        }
      )
      .then((res) => {
        const fileName = res.headers['content-disposition'].split('filename=')[1];
        downloadExcel(res.data, fileName);
        setExporting(false);
        toastConfig.setToastConfig({
          open: true,
          message: 'Successfully Exported',
          type: 'success'
        });
      })
      .catch((err) => {
        setExporting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div>
        <Grid container className="headerbox">
          <Grid item xs={10}>
            <CustomBreadCrumbs
              routes={[
                { title: 'Reports', path: '/reports' },
                { title: resourceStartCase, path: '' }
              ]}
            />
          </Grid>
          <Grid item xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justifyContent="flex-end">
                  {showGrid && (
                    <div id="importExportLinks" style={{ minWidth: 80 }}>
                      <span
                        aria-disabled={isExporting}
                        onClick={exportData}
                        className={`${isExporting ? 'cursor-stop' : 'cursor-pointer'} mr - 2 setLink`}
                        style={{ color: theme.palette.info.light }}
                      >
                        Export All
                      </span>
                    </div>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <CustomContainer>
          <>
            <div className="header-panel">
              <Grid container className={styles.filter_side_container}>
                <Grid item xs={12} className="d-flex align-items-center gap-1 layout-for-tablet">
                  <Box display="flex" justifyContent="center" alignItems="center">
                    {showGrid && (
                      <Box mr={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          disableElevation
                          onClick={() => {
                            setShowGrid(false);
                            dispatch({ type: 'onlyFilter', filters: {} });
                          }}
                          startIcon={<MdChevronLeft />}
                        >
                          Go Back
                        </Button>
                      </Box>
                    )}
                    <MdDescription size={22} className="headerLogo" />
                    <span className="listingHeader">{` ${selectedReportView?.name ?? 'Reports'} `}</span>
                  </Box>
                </Grid>
              </Grid>
            </div>
            <hr />
            {!showGrid ? (
              <ReportFilters
                resourceColumns={resourceColumns}
                betweenDate={betweenDate}
                setBetweenDate={setBetweenDate}
                resource={'Purchase Order Type'}
                setSelectedData={setSelectedData}
                loading={loading}
                fetchReportData={fetchResourceData}
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                selectedResources={selectedResources}
                setSelectedResources={setSelectedResources}
                resourceOptions={resourceOptions}
                setResourceOptions={setResourceOptions}
                formValues={formValues}
                setFormValues={setFormValues}
                loadingColumns={loadingColumns}
                setSelectedReportView={setSelectedReportView}
                selectedReportView={selectedReportView}
                reportList={reportList}
                setReportList={setReportList}
                statusPeriod={statusPeriod}
                setStatusPeriod={setStatusPeriod}
                statusPeriodDate={statusPeriodDate}
                setStatusPeriodDate={setStatusPeriodDate}
                statusTimeFrame={statusTimeFrame}
                setStatusTimeFrame={setStatusTimeFrame}
                selectedData={selectedData}
              />
            ) : (
              <div>
                {Object.keys(frameWorkComponent).length > 0 && columns ? (
                  <CustomAgGrid
                    setSelectedReportView={setSelectedReportView}
                    selectedReportView={selectedReportView}
                    reportSave={true}
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={100}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    allowSelection={false}
                    allowAction={resourceCamelCase === 'productAverageCost'}
                    refreshGrid={fetchResourceData}
                    showOnlyShowFilteredRecordSwitch={false}
                  />
                ) : (
                  <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
                )}
              </div>
            )}
          </>
        </CustomContainer>
      </div>
      {showPriceHistory.open && (
        <AverageCostHistory
          product={showPriceHistory.product}
          productName={showPriceHistory.productName}
          handleClose={() => {
            setShowPriceHistory({ open: false, product: '', productName: '' });
          }}
          showPricefilter={showPricefilter}
        />
      )}
    </MuiPickersUtilsProvider>
  );
};

export default Report;
