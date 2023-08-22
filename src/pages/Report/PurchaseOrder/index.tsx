import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box, Tooltip, IconButton } from '@material-ui/core';
import { camelCase, capitalize, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import {
  prepareDataForGrid,
  gridLoadingTimeout,
  downloadExcel,
  primaryFields,
  productInventory,
  isObjectEmpty,
  sidebarResource
} from 'src/constants/helpers';
import Loader from 'src/components/Loader';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from '../ReportFilters';
import { DateRenderer, NumberRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import HistoryIcon from '@material-ui/icons/History';
import AverageCostHistory from '../AverageCostHistory';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { useAppTheme } from 'src/constants/AppConfig';

import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';

let cancelTokenSource = null;

const Report = () => {

  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';
  const theme = useTheme();
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity }
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

      if (resourceCamelCase === 'purchaseOrderDetails') {
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
            resourceFieldData.push({
              ...field,
              fieldData: { ...field.fieldData, fieldLabel: 'Received Date', fieldName: 'date', type: 'date' }
            });
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
        columns = [
          ...columns,
          {
            field: 'date',
            headerName: 'Received/Rejected Date',
            show: true,
            disabled: false,
            cellRenderer: 'dateTimeRenderer',
            filter: false,
            sortable: false
          }
        ];

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent, ...customFrameworkComponents });
      }
      if (resourceCamelCase === 'inventoryEvaluation') {
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);

        POFields.filter((field) => ['purchaseOrderDate', 'supplierAccount', 'warehouse'].includes(field?.fieldData.fieldName)).forEach((field) => {
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

        productFields.forEach((o: any) => {
          if (o?.fieldData.fieldName === 'productCategory') {
            resourceFieldData.push(o);
          }
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
            headerName: 'Average Cost',
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
          if (['productName', 'productDescription', 'productNumber', 'productCategory', 'productCondition', 'totalQty', 'averagePrice', 'totalPrice', 'margin'].includes(e.field)
          ) {
            e.show = true;
          } else {
            e.show = false;
          }
        });
      }
      if (resourceCamelCase === 'inventoryHistory') {
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

        if (user?.user?.brandPolicy?.storageLocation && POFields?.length) {
          let storageLocationOptions: any = [];
          await axiosInstance()
            .get('/sa-formbuilder/lookup?lookupResource=Storage Location')
            .then(({ data: { data } }) => {
              storageLocationOptions = data['Storage Location'];
            });
          resourceFieldData.push({
            fieldData: {
              _id: '63f71ce5b17c69a1ab7e4c06',
              fieldLabel: 'Storage Location',
              type: 'dropDown',
              option: [...storageLocationOptions],
              required: false,
              isTooltip: false,
              tooltipMessage: '',
              editAble: true,
              deletAble: true,
              order: 5,
              hiddenField: false,
              isDefaultValue: false,
              disableOnEdit: false,
              addManualOptionInExcel: false,
              addAdditionalOption: false,
              lookup: true,
              lookupResource: sidebarResource.storageLocation,
              isDropdown: false,
              isWarningTooltip: false,
              warningTooltipMessage: '',
              defaultValue: '',
              fieldName: 'storageLocation',
              sectionName: 'PO Information',
              resource: sidebarResource.purchaseOrder,
              brand: user.brand
            },
            isCreate: true,
            isRead: true,
            isUpdate: true
          });
        }

        productFields.filter((field) => ['productName', 'productDescription', 'productNumber'].includes(field?.fieldData.fieldName))
          .forEach((field: any) => {
            if (field?.fieldData.fieldName === 'productName') {
              resourceFieldData.push({
                ...field,
                fieldData: { ...field.fieldData, fieldName: 'product', type: 'dropDown', lookup: true, option: productOption?.Product || [] }
              });
            }
            columns.push({
              field: field?.fieldData.fieldName === 'productName' ? 'product' : field?.fieldData.fieldName,
              headerName: field?.fieldData?.fieldLabel,
              show: true,
              disabled: false,
              cellRenderer: field?.fieldData.fieldName === 'productName' ? 'productRenderer' : 'commonRenderer'
            });
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
                return { backgroundColor: isDarkTheme ? 'hsl(120 73% 40% / 1)' : '#90ee90' };
              }
              if (params?.data?.type === 'debit') {
                return { backgroundColor: isDarkTheme ? 'hsl(1 100% 65% / 1)' : '#FFCCCB' };
              }
            }
          },
          { field: 'price', headerName: 'Cost', show: true, filter: false, cellRenderer: 'commonRenderer' },
          { field: 'totalPrice', headerName: 'Amount', show: true, filter: false, cellRenderer: 'commonRenderer' },
          { field: 'warehouse', headerName: routes.warehouse.title, show: true, cellRenderer: 'commonRenderer' },
          ...(user?.user?.brandPolicy?.storageLocation
            ? [
              {
                field: 'storageLocation',
                headerName: 'Storage Location',
                show: true,
                cellRenderer: 'commonRenderer'
              }
            ]
            : []),
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
      if (resourceCamelCase === 'averagePriceBySupplier') {
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
            headerName: 'Average Cost',
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
      if (resourceCamelCase === 'numberOfAssetsByStatus') {
        let { data } = await axiosInstance().get(`/serialized-asset/report/assets-number-by-status?page=0&limit=1`);
        data?.columns?.forEach((e) => {
          var cellRenderer = 'numberRenderer'
          if (e.fieldName === 'productName') {
            cellRenderer = 'productRenderer'
          }
          if (e.fieldName === 'productCategory') {
            cellRenderer = 'productCategoryRenderer'
          }
          if (["productDescription", "productNumber"]?.includes(e.fieldName)) {
            cellRenderer = 'commonRenderer'
          }
          if (e.fieldName === 'warehouse') {
            cellRenderer = 'plantRenderer'
          }
          columns.push({
            field: e.fieldName,
            headerName: e.fieldLabel,
            show: true,
            disabled: e.fieldName === 'productName' ? true : false,
            cellRenderer: cellRenderer,
            filter: false,
            sortable: false,
          })
        })

        let fieldOptionResponce = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Product,Product Category,Warehouse`);
        const fieldOption = fieldOptionResponce?.data?.data;
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c01',
            fieldLabel: columns?.find((e) => e.field === 'productName')?.headerName || 'Product Name',
            fieldName: 'product',
            type: 'dropDown',
            lookup: true,
            option: fieldOption["Product"],
            filter: false,
            sortable: false,
          }
        });
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c06',
            fieldLabel: columns?.find((e) => e.field === 'warehouse')?.headerName || 'Warehouse',
            fieldName: 'warehouse',
            type: 'dropDown',
            lookup: true,
            option: fieldOption["Warehouse"],
            filter: false,
            sortable: false,
          }
        });
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c07',
            fieldLabel: columns?.find((e) => e.field === 'productCategory')?.headerName || 'Product Category',
            fieldName: 'productCategory',
            type: 'dropDown',
            lookup: true,
            option: fieldOption["Product Category"],
            filter: false,
            sortable: false,
          }
        });


        setFrameWorkComponent({
          productRenderer: ProductRenderer,
          productCategoryRenderer: ProductCategoryRenderer,
          commonRenderer: CommonRenderer,
          plantRenderer: PlantRenderer,
          numberRenderer: NumberRenderer
        });
      }
      if (resourceCamelCase === 'assetUtilization') {
        let { data } = await axiosInstance().get(`/serialized-asset/report/assets-utilization/column`);
        data?.data?.forEach((e) => {
          var cellRenderer = 'commonRenderer'
          if (e.fieldName === 'assetNumber') {
            cellRenderer = 'assetRenderer'
          }
          if (e.fieldName === 'product') {
            cellRenderer = 'productRenderer'
          }
          if (e.fieldName === 'inUseDays') {
            cellRenderer = 'numberRenderer'
          }
          columns.push({
            field: e.fieldName,
            headerName: e.fieldLabel,
            show: true,
            disabled: false,
            cellRenderer: cellRenderer,
            filter: e.fieldName === 'assetNumber' ? true : false,
            sortable: false,
          })
        })

        let fieldOptionResponce = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Product,Warehouse`);
        const fieldOption = fieldOptionResponce?.data?.data;
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c01',
            fieldLabel: columns?.find((e) => e.field === 'productName')?.headerName || 'Product Name',
            fieldName: 'product',
            type: 'dropDown',
            lookup: true,
            option: fieldOption["Product"],
            filter: false,
            sortable: false,
          }
        });
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c06',
            fieldLabel: columns?.find((e) => e.field === 'warehouse')?.headerName || 'Warehouse',
            fieldName: 'warehouse',
            type: 'dropDown',
            lookup: true,
            option: fieldOption["Warehouse"],
            filter: false,
            sortable: false,
          }
        });


        setFrameWorkComponent({
          productRenderer: ProductRenderer,
          assetRenderer: AssetRenderer,
          commonRenderer: CommonRenderer,
          numberRenderer: NumberRenderer
        });
      }
      if (resourceCamelCase === 'userSession') {
        let fieldOptionResponce = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=User`);
        const fieldOption = fieldOptionResponce?.data?.data;
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c01',
            fieldLabel: 'User',
            fieldName: 'user',
            type: 'dropDown',
            lookup: true,
            option: fieldOption["User"],
            filter: false,
            sortable: false,
          }
        });
        resourceFieldData.push({
          isCreate: true,
          isRead: true,
          isUpdate: true,
          fieldData: {
            _id: '63f71ce5b17c69a1ab7e4c02',
            fieldLabel: 'Date',
            fieldName: 'date',
            type: 'date',
            filter: false,
            sortable: false,
          }
        });

        setFrameWorkComponent({
          commonRenderer: CommonRenderer,
          numberRenderer: NumberRenderer
        });
      }
      if (resourceCamelCase === 'inUseSerializedAsset') {
        const {
          data: { data }
        }: any = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
        const fieldData = data?.filter((e) => e?.fieldData?.fieldName !== 'status');

        const {
          data: { data: lookupResource }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Customer Account,Supplier Account`);
        if (lookupResource) {
          data?.forEach((e) => {
            if (e?.fieldData?.fieldName === 'currentOwner') {
              e.fieldData.option = [...lookupResource?.[`Customer Account`], ...lookupResource?.[`Supplier Account`]];
            }
          });
        }

        fieldData.push({
          "fieldData": {
            "fieldName": "rentalJob",
            "fieldLabel": "Rental Job",
            "lookup": true,
            "lookupResource": sidebarResource.rentalManagement,
            "order": fieldData?.length + 1,
            filter: false,
            sortable: false
          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })

        fieldData.push({
          "fieldData": {
            "fieldName": "customerAccount",
            "fieldLabel": "Customer Account",
            "lookup": true,
            "lookupResource": sidebarResource.customerAccount,
            "sectionName": "",
            "order": fieldData?.length + 1,
            filter: false
          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })
        fieldData.push({
          "fieldData": {
            "fieldName": "billingAddress",
            "fieldLabel": "Billing Address",
            "lookup": true,
            "lookupResource": sidebarResource.address,
            "sectionName": "",
            "order": fieldData?.length + 1,
            filter: false

          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })
        fieldData.push({
          "fieldData": {
            "fieldName": "shippingAddress",
            "fieldLabel": "Shipping Address",
            "lookup": true,
            "lookupResource": sidebarResource.address,
            "sectionName": "",
            "order": fieldData?.length + 1,
            filter: false
          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })
        fieldData.push({
          "fieldData": {
            "fieldName": "rate",
            "fieldLabel": "Rate",
            "order": fieldData?.length + 1,
            filter: false
          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })
        fieldData.push({
          "fieldData": {
            "fieldName": "startDate",
            "fieldLabel": "Start Date",
            type: 'date',
            "order": fieldData?.length + 1,
            filter: false

          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })
        fieldData.push({
          "fieldData": {
            "fieldName": "endDate",
            "fieldLabel": "End Date",
            type: 'date',
            "order": fieldData?.length + 1,
            filter: false

          },
          "isCreate": true,
          "isRead": true,
          "isUpdate": true
        })
        const fieldWithoutFilter = ["rentalJob", "customerAccount", "billingAddress", "shippingAddress", "rate", "startDate", "endDate"];
        fieldData.forEach((o) => {
          let currentColumn: any = getColumnData(
            routes.serializedAsset?.title,
            o?.fieldData,
            routes.serializedAssetDetail.path
          );
          if (fieldWithoutFilter.includes(currentColumn?.columnData?.field)) {
            currentColumn.columnData.filter = false;
            currentColumn.columnData.sortable = false;
          }
          if (currentColumn !== null) {
            columns = [...columns, { ...currentColumn?.columnData }];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
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
        <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`} target="_blank">
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Inventory' ? (
        <Link className="link" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`} target="_blank" >
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Asset' ? (
        <Link className="link" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`} target="_blank" >
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Sales Order' ? (
        <Link className="link" title={params.value} to={`${routes.salesOrderDetail.path}/${params.data.referenceId}`} target="_blank" >
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Bulk Asset Creation' ? (
        <Link className="link" title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`} target="_blank" >
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Serialized Asset' ? (
        <Link className="link" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data.referenceId}`} target="_blank">
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Rental Job' ? (
        <Link className="link" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`} target="_blank">
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Work Order' ? (
        <Link className="link" title={params.value} to={`${routes.workOrderDetail.path}/${params.data.referenceId}`} target="_blank">
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
    <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.purchaseOrderId}`} target="_blank" >
      {params.value}
    </Link>
  );

  const ProductRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`} target="_blank" >
      {params.value}
    </Link>
  );

  const AssetRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data._id}`} target="_blank" >
      {params.value}
    </Link>
  );

  const ProductCategoryRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.productCategoryDetail.path}/${params.data.productCategoryId}`} target="_blank" >
      {params.value}
    </Link>
  );

  const PlantRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.warehouseDetail.path}/${params.data.warehouseId}`} target="_blank" >
      {params.value}
    </Link>
  );

  const SupplierRenderer = (params: any) => (
    <Link className="link" title={params.value} to={`${routes.supplierAccountDetail.path}/${params.data.supplierAccountId}`} target="_blank" >
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
    dateRenderer: DateRenderer,
    dateTimeRenderer: DateTimeRenderer
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

    var api = ''
    if (resourceCamelCase === 'purchaseOrderDetails') {
      api = `${productInventory.api}/report/purchase-order-product-wise-report`;
    }
    if (resourceCamelCase === 'inventoryEvaluation') {
      api = `${productInventory.api}/report/purchase-order-price`;
    }
    if (resourceCamelCase === 'inventoryHistory') {
      api = `${productInventory.api}/report/history-report`;
    }
    if (resourceCamelCase === 'averagePriceBySupplier') {
      api = `${productInventory.api}/report/supplier-product-price`;
    }
    if (resourceCamelCase === 'numberOfAssetsByStatus') {
      api = `/serialized-asset/report/assets-number-by-status`;
    }
    if (resourceCamelCase === 'assetUtilization') {
      api = `/serialized-asset/report/assets-utilization`;
    }
    if (resourceCamelCase === 'userSession') {
      api = `/report/user/user-session`;
    }
    if (resourceCamelCase === 'inUseSerializedAsset') {
      api = `/serialized-asset/report/in-use-assets/`;
    }

    axiosInstance()
      .get(`${api}${filterQuery}`, {
        cancelToken: cancelTokenSource.token
      }).then(({ data: { data, count, columns } }) => {
        console.log(data, count, columns)
        if (resourceCamelCase === 'userSession') {
          setLoadingColumns(true);
          columns = columns?.map((e) => {
            return ({
              field: e.fieldName,
              headerName: e.fieldLabel,
              show: true,
              disabled: false,
              cellRenderer: 'commonRenderer',
              filter: false,
              sortable: false,
            })
          })
          setColumns(columns);
          setLoadingColumns(false);
        }
        data = data.map((u: any) => {
          if (resourceCamelCase === 'purchaseOrderDetails') {
            if (u?.productLedger?.type === 'credit') {
              u.actualReceived = u?.productLedger?.qty;
              u.rejectQuantity = 0;
            } else {
              u.rejectQuantity = u?.productLedger?.qty;
              u.actualReceived = 0;
            }
            u.date = u?.productLedger?.date;
          }
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

  const getFilter = (isExport = false) => {
    setShowPricefilter({ warehouse: null, fromDate: null, toDate: null });
    let filterQuery = ``;
    let deepFilter = [];

    if (!isExport) {
      filterQuery = `page=${page}&limit=${limit}&`;
    }
    if (sorting.length > 0) {
      filterQuery = `${filterQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      filterQuery = `${filterQuery}search=${encodeURIComponent(search)}&`;
    }
    if (selectedResources.length > 0) {
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
    }
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        deepFilter.push({
          field: field,
          term: filters[field].filter
        });
      });
    }

    if (deepFilter && deepFilter.length > 0) {
      filterQuery = `${filterQuery}deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}&`;
    }
    if (statusPeriod && statusPeriodDate) {
      const fields = Object.keys(statusPeriodDate);
      fields.forEach((field) => {
        if (statusPeriodDate[field]) {
          filterQuery = `${filterQuery}${field}=${moment(statusPeriodDate[field]).format('MM/DD/YYYY')}& `;
        }
      });
    }
    if (resourceCamelCase === 'userSession') {
      return `?column=true&${filterQuery}`;
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

    var api = ''
    if (resourceCamelCase === 'purchaseOrderDetails') {
      api = `${productInventory.api}/report/purchase-order-product-wise-report/export`;
    }
    if (resourceCamelCase === 'inventoryEvaluation') {
      api = `${productInventory.api}/report/purchase-order-price/export`;
    }
    if (resourceCamelCase === 'inventoryHistory') {
      api = `${productInventory.api}/report/history-report/export`;
    }
    if (resourceCamelCase === 'averagePriceBySupplier') {
      api = `${productInventory.api}/report/supplier-product-price/export`;
    }
    if (resourceCamelCase === 'numberOfAssetsByStatus') {
      api = `/serialized-asset/report/assets-number-by-status/export`;
    }
    if (resourceCamelCase === 'assetUtilization') {
      api = `/serialized-asset/report/assets-utilization/export`;
    }
    if (resourceCamelCase === 'userSession') {
      api = `/report/user/user-session/export`;
    }
    if (resourceCamelCase === 'inUseSerializedAsset') {
      api = `/serialized-asset/report/in-use-assets/export/`;
    }

    axiosInstance()
      .get(`${api}${filterQuery}&exportColumn=${JSON.stringify(columns)} `,
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
                          startIcon={<MdFilterList />}
                        >
                          Show Filters
                        </Button>
                      </Box>
                    )}
                    <MdDescription size={22} className="headerLogo" />
                    <span className="listingHeader">{` ${selectedReportView?.name ?? 'Reports'} `}</span>
                  </Box>
                </Grid>
              </Grid>
            </div>
            {!showGrid && (
              <Dialog
                open={true}
                maxWidth="md"
                fullWidth
                onClose={(e, reason) => {
                  if (reason !== 'backdropClick') {
                    history.push(routes.reports.path);
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }
                }}
              >
                <CustomDialogHeader
                  title={`Set Filters`}
                  onClose={() => {
                    history.push(routes.reports.path);
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }}
                />
                <div className="p-4 min-h-[600px]">
                  <DialogContent>
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
                  </DialogContent>
                </div>
              </Dialog>
            )}

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
                  allowAction={resourceCamelCase === 'inventoryEvaluation'}
                  refreshGrid={fetchResourceData}
                  showOnlyShowFilteredRecordSwitch={false}
                />
              ) : (
                <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
              )}
            </div>
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
