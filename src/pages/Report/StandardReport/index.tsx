import React, { useEffect } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { Grid, Button, Box, IconButton } from '@material-ui/core';
import { camelCase, capitalize, isArray, isNumber, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import {
  prepareDataForGrid,
  gridLoadingTimeout,
  downloadExcel,
  isObjectEmpty,
  sidebarResource,
  REPORT_LIST,
  formatAmountWithCurrency,
  CustomDialogTransition
} from 'src/constants/helpers';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from '../ReportFilters';
import AverageCostHistory from '../AverageCostHistory';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { useAppTheme } from 'src/constants/AppConfig';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import CustomReactTable, { useTableReducer, useColumns } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import HistoryIcon from '@material-ui/icons/History';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import WarningIcon from '@material-ui/icons/Warning';
import PadData from 'src/pages/Report/PadData';
import PreviewDownload from 'src/components/PreviewDownload';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import { isMobile, isTablet } from 'react-device-detect';

let cancelTokenSource = null;

const Report = () => {
  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { selectedEntity, permissions }
  } = useData();
  const { type } = useParams();
  const history = useHistory();

  const resourceCamelCase = camelCase(type);
  const resourceStartCase = startCase(type);
  const renderedFrom = `${type}_report_new`;
  const reportConfig = REPORT_LIST?.find((e) => e.type === resourceCamelCase);

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
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');
  const [defaultColumns, setDefaultColumns] = React.useState([]);
  const [footerData, setFooterData] = React.useState<Record<string, number>>(null);

  // Grid Configs
  const { generateColumns } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const { state, dispatch } = useTableReducer();
  const { loading, page, sorting, search, limit, filters, pageSizes, colState, dataRows } = state;

  const [showPriceHistory, setShowPriceHistory] = React.useState({ open: false, product: '', productName: '' });
  const [showPadData, setShowPadData] = React.useState({ open: false, data: [] });
  const [showPricefilter, setShowPricefilter] = React.useState({ warehouse: null, fromDate: null, toDate: null });
  const [isSendMail, setIsSendMail] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [emailAttachments, setEmailAttachments] = React.useState([]);
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

  const fetchGridColumns = async () => {
    try {
      setLoadingColumns(true);
      let columns = [];
      let {
        data: {
          data: { columnFields, filterFields }
        }
      } = await axiosInstance().get(`/report/${type}/column`);
      let newColumns = generateColumns(type, columnFields);
      newColumns?.forEach((o) => {
        if (resourceCamelCase === 'inventoryHistory') {
          if (o?.accessor === 'type') {
            o.cell = ({ row }) => CreditDebitTypeRenderer(row);
          }
          if (o?.accessor === 'qty') {
            o.cell = ({ row }) => CreditDebitRenderer(row);
          }
        }
        if (resourceCamelCase === 'fleetReport') {
          if (o?.accessor === 'unitNumber') {
            o.cell = ({ row }) => UnitNameRenderer(row);
          }
        }
        if (o?.accessor === 'reference') {
          o.cell = ({ row }) => ReferenceRenderer(row);
          o.disableFilters = true;
          o.disableSortBy = true;
        }
        if (o?.accessor === 'serialNumber') {
          o.cell = ({ row }) => SerialNumberRenderer(row);
          o.disableFilters = true;
          o.disableSortBy = true;
        }
        if (type === 'number-of-assets-by-status' && (o?.accessor === 'productName' || o?.accessor === 'product')) {
          o.cell = ({ row }) => ProductRenderer(row);
        }
        if (o?.accessor === 'serviceName') {
          o.cell = ({ row }) => ServiceRenderer(row);
        }
        o.editable = false;
      });
      if (resourceCamelCase === 'inventoryEvaluation') {
        newColumns?.forEach((e) => {
          if (e.accessor === 'productName') {
            e.cell = ({ row }) => ProductRenderer(row);
          }
          if (
            !['productName', 'productDescription', 'productNumber', 'productCategory', 'totalQty', 'averagePrice', 'totalPrice', 'margin']?.includes(
              e.accessor
            )
          ) {
            e.show = false;
          }
        });
        columns = [...newColumns, ActionsRenderer];
      }
      else if (resourceCamelCase === 'inUsedSerializedAsset') {
        newColumns?.forEach((e) => {
          if (['billingAddress', 'shippingAddress']?.includes(e.accessor)) {
            e.disableFilters = true;
            e.disableSortBy = true;
          }
        });
        columns = [...newColumns];
      }
      else if (resourceCamelCase === 'purchaseOrderDetails') {
        newColumns?.forEach((e) => {
          if (['productId', 'productNumber', 'productDescription', 'serviceName', 'serviceDescription', 'description']?.includes(e.accessor)) {
            e.disableFilters = true;
            e.disableSortBy = true;
          }
        });
        columns = [...newColumns];
      }
      else if (resourceCamelCase === 'volumeReport') {
        columns = [...newColumns, ActionsRenderer];
      }
      else {
        columns = [...newColumns];
      }
      setResourceColumns(filterFields);
      if (reportConfig?.defaultColumn) {
        setDefaultColumns(filterFields.filter((field) => field?.fieldData?.required)?.map((field) => field?.fieldData?.fieldName));
        setSelectedResources(filterFields.filter((field) => field?.fieldData?.required));
      }
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

  const CreditDebitRenderer = (row) => {
    return (
      <div
        style={{
          backgroundColor:
            row?.original?.type === 'credit'
              ? isDarkTheme
                ? 'hsl(120 73% 40% / 1)'
                : '#90ee90'
              : row?.original?.type === 'debit'
                ? isDarkTheme
                  ? 'hsl(1 100% 65% / 1)'
                  : '#FFCCCB'
                : ''
        }}
      >
        {row?.original?.qty ? (
          <h5 className="text-truncate" title={row?.original?.qty}>
            {row?.original?.type === 'debit' ? `-${row?.original?.qty}` : row?.original?.qty}
          </h5>
        ) : (
          <NoDataCell />
        )}
      </div>
    );
  };

  const ProductRenderer = (row) => {
    return (
      <div>
        {row?.original?.productName ? (
          <Link
            className="link"
            title={row?.original?.productName}
            to={`${routes.productDetail.path}/${row?.original?.productId || row?.original?._id}`}
            target="_blank"
          >
            {row?.original?.productName}
          </Link>
        ) : (
          <NoDataCell />
        )}
      </div>
    );
  };

  const ServiceRenderer = (row) => {
    return (
      <div>
        {row?.original?.serviceName ? (
          <Link
            className="link"
            title={row?.original?.serviceName}
            to={`${routes.serviceMasterDetail.path}/${row?.original?.serviceId}`}
            target="_blank"
          >
            {row?.original?.serviceName}
          </Link>
        ) : (
          <NoDataCell />
        )}
      </div>
    );
  };

  const ReferenceRenderer = (row) => {
    return (
      <div>
        {row?.original?.reference ? (
          row?.original?.referenceType === 'Purchase Order' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.purchaseOrderDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Transfer Inventory' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.transferInventoryDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Transfer Asset' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.transferAssetDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Sales Order' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.salesOrderDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Bulk Asset Creation' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.bulkAssetCreationDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Serialized Asset' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.serializedAssetDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Rental Job' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.rentalManagementDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Work Order' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.workOrderDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Field Ticket' ? (
            <Link
              className="link"
              target="_blank"
              title={row?.original?.reference}
              to={`${routes.fieldTicketDetail.path}/${row?.original?.referenceId}`}
            >
              {row?.original?.reference}
            </Link>
          ) : (
            row?.original?.reference
          )
        ) : row?.original?.referenceType === 'Product Inventory' ? (
          <h5 className="text-truncate">Manual Entry</h5>
        ) : (
          <NoDataCell />
        )}
      </div>
    );
  };

  const UnitNameRenderer = (row) => {
    return (
      <div>
        <Link className="link text-truncate" title={row?.original?.unitNumber} to={`${routes.unitDetail.path}/${row?.original?._id}`} target="_blank">
          {row?.original?.unitNumber}
        </Link>
        {row?.original?.unitInOtherDeal && (
          <Box ml={1}>
            <HtmlTooltip title={'Unit is assigned to multiple active contracts'} placement="top" arrow>
              <WarningIcon style={{ fontSize: '16px' }} fontSize="small" color="error" />
            </HtmlTooltip>
          </Box>
        )}
      </div>
    );
  };

  const CreditDebitTypeRenderer = (row) => {
    return <div>{row?.original?.type ? <span>{capitalize(row?.original?.type)}</span> : <NoDataCell />}</div>;
  };

  const SerialNumberRenderer = (row) => {
    return (
      <div>
        {row.original?.serialNumber && isArray(row.original.serialNumber) && row.original.serialNumber?.length ? (
          row?.original?.serialNumber?.map((e) => e?.serialNumber)?.toString()
        ) : (
          <NoDataCell />
        )}
      </div>
    );
  };

  const ActionsRenderer = {
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
        {resourceCamelCase === 'inventoryEvaluation' && (
          <HtmlTooltip title={'View History'}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setShowPriceHistory({ open: true, product: row?.original?._id, productName: row?.original?.productName });
                }}
              >
                <HistoryIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        {resourceCamelCase === 'volumeReport' && (
          <HtmlTooltip title={'View Pad Wise Data'}>
            <span>
              <IconButton
                size="small"
                aria-label="View Pad Wise Data"
                onClick={() => {
                  setShowPadData({ open: true, data: row?.original || [] });
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const fetchResourceData = () => {
    setShowGrid(true);
    let filterQuery = getQueryString();
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });

    var api = `/report/${type}`;
    axiosInstance()
      .get(`${api}${filterQuery}`, {
        cancelToken: cancelTokenSource?.token
      })
      .then(({ data: { data, count, columns } }) => {
        if (resourceCamelCase === 'userSession') {
          setLoadingColumns(true);
          columns = columns?.map((e) => {
            return {
              accessor: e.fieldName,
              Header: e.fieldLabel,
              disableSortBy: true,
              disableFilters: true,
              Cell: ({ row }) => {
                return (
                  <div>
                    {row?.original?.[e?.fieldName] ? (
                      e.fieldName === 'user' ? (
                        <Link
                          className="link"
                          title={row?.original?.[e?.fieldName]}
                          to={`${routes.userDetail.path}/${row?.original?.userId}`}
                          target="_blank"
                        >
                          {row?.original?.[e?.fieldName]}
                        </Link>
                      ) : (
                        <h5 className="text-truncate" title={row?.original?.[e?.fieldName]}>
                          {row?.original?.[e?.fieldName]}
                        </h5>
                      )
                    ) : (
                      <NoDataCell />
                    )}
                  </div>
                );
              }
            };
          });
          setColumns(columns);
          setLoadingColumns(false);
        }
        if (resourceCamelCase === 'iotDataPoints') {
          setLoadingColumns(true);
          let newColumns = generateColumns(type, columns);
          setColumns(newColumns);
          setLoadingColumns(false);
        }
        data = data.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          return finalObject;
        });
        if ([`dailyVolumeReport`, 'volumeReport']?.includes(resourceCamelCase)) {
          data = data.filter((d) => {
            if (d?.isFooter) {
              setFooterData(d);
              return false;
            } else {
              return true;
            }
          });
        }
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

  const getQueryString = (isExport = false) => {
    if (!isExport) {
      setShowPricefilter({ warehouse: null, fromDate: null, toDate: null });
    }
    let filterQuery = ``;
    let deepFilter = [];

    if (!isExport) {
      filterQuery = `page=${page}&limit=${limit}&`;
    }
    if (type === 'iot-data-points') {
      filterQuery += `column=true&timezone=${Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone}&`;
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
            if (!isExport) {
              setShowPricefilter((prevState) => ({
                ...prevState,
                warehouse: selectedData[key]?.value?.map((d: any) => d.optionValue)
              }));
            }
          }
          if (!Array.isArray(selectedData[key].value)) {
            return { field: key, term: selectedData[key].value.optionValue };
          }
          return {
            field: key,
            term: {
              $in: selectedData[key]?.value?.map((d: any) => d.optionValue)
            }
          };
        });

        forDeepFilter.forEach((key) => {
          if (selectedData[key].type === 'checkBox') {
            deepFilter.push({
              field: key,
              term: selectedData[key].value ? 'Yes' : 'No'
            });
          } else if (selectedData[key].type === 'singleLine') {
            deepFilter.push({
              field: key,
              term: selectedData[key].value
            });
          } else if (!Array.isArray(selectedData[key].value)) {
            deepFilter.push({
              field: key,
              term: selectedData[key]?.value
            });
          } else {
            deepFilter.push({
              field: key,
              term: selectedData[key].value?.map((d: any) => d.optionValue)
            });
          }
        });

        if (filterById.length > 0) {
          filterQuery = `${filterQuery}filterById=${JSON.stringify(filterById)}&`;
        }
      }

      if (betweenDate) {
        const fields = Object.keys(betweenDate);
        fields.forEach((field) => {
          if (betweenDate[field]) {
            if (!isExport) {
              if (field === 'from_date') {
                setShowPricefilter((prevState) => ({ ...prevState, fromDate: moment(betweenDate[field]).format('MM/DD/YYYY') }));
              }
              if (field === 'to_date') {
                setShowPricefilter((prevState) => ({ ...prevState, toDate: moment(betweenDate[field]).format('MM/DD/YYYY') }));
              }
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

    if (isExport) {
      let newColumns = columns.map((col) => col.accessor);
      if (colState.length) {
        newColumns = colState?.filter((col) => col?.isVisible).map((col) => col?.accessor);
      }
      filterQuery = `${filterQuery}&exportColumn=${JSON.stringify(newColumns)}`;
    }

    return `?${filterQuery}`;
  };

  const exportData = (sendMail = false) => {
    if (isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: `Please wait ${sendMail ? '' : 'exporting data'}`,
      type: 'info'
    });
    let newColumns = columns.map((col) => col.accessor);
    if (colState.length) {
      newColumns = colState?.filter((col) => col?.isVisible).map((col) => col?.accessor);
    }
    if(!sendMail) setExporting(true);
    
    let filterQuery = getQueryString(true);

    var api = '';
    api = `/report/${type}/export`;

    axiosInstance()
      .get(`${api}${filterQuery}&exportColumn=${JSON.stringify(newColumns)}`, {
        responseType: 'arraybuffer'
      })
      .then((res) => {
        const fileName = res.headers['content-disposition'].split('filename=')[1];
        if(sendMail){
        const blobData = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        generateBase64forFile(blobData, fileName, 'xlsx');
        }else {
          downloadExcel(res.data, fileName);
          setExporting(false);
          toastConfig.setToastConfig({
            open: true,
            message: 'Successfully Exported',
            type: 'success'
          });
        }
      })
      .catch((err) => {
        setExporting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, fileName, extension) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      const attachments = {
        base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
        contentType: base64data.split(';')[0].split(':')[1],
        extension: `.${extension}`,
        name: fileName
      };
      setEmailAttachments((prevState) => {
        return [...prevState, attachments];
      });
      setIsSendMail(true);
    };
  };

  const handleDownload = async ()=>{
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    setIsDownloading(true);
    axiosInstance()
      .get(`/report/${type}/pdf`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', reportConfig.title + '.pdf');
        document.body.appendChild(link);
        link.click();
        setIsDownloading(false);
        toastConfig.setToastConfig({
          open: true,
          message: 'Successfully Exported',
          type: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading(false);
      });
  }

  useEffect(() => {
    if ([`dailyVolumeReport`, 'volumeReport']?.includes(resourceCamelCase) && footerData) {
      const dataKeys = Object.keys(footerData);
      const newColumns = columns.map((col, index) => {
        if (index === 0) {
          return { ...col, Footer: 'Total' };
        }
        if (dataKeys.includes(col.accessor)) {
          return {
            ...col, Footer: footerData[col.accessor] && isNumber(footerData[col.accessor]) ?
              col?.type === "currencyNumber" ?
                `${formatAmountWithCurrency(col?.currency, footerData[col.accessor])?.fullFormatAmountWithoutSpace}` :
                footerData[col.accessor] : <NoDataCell />
          };
        }
        return col;
      });
      setColumns(newColumns);
    }
  }, [columns?.length, type, footerData]);

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: 'Reports', path: '/reports' }, { title: reportConfig?.title }]} />
          {showGrid && (
            <div id="importExportLinks" style={{ minWidth: 80 }}>
              {resourceCamelCase === 'inUsedSerializedAsset' ? (
                <AsynImportExportMenu
                  resource={sidebarResource.report}
                  subResource={type}
                  referenceId={null}
                  permissions={permissions?.report}
                  module={routes.productionOrder.title}
                  api={`/report/${type}`}
                  afterImportCompleted={() => { }}
                  isExportCount={true}
                  exportCount={0}
                  ids={[]}
                  onlyExport={true}
                  additionalParams={getQueryString(true)}
                />
              ) : (
                <div className="flex gap-1 items-center">
                {reportConfig?.isSendMail && 
                ( 
                <Button variant="outlined" size="small" disabled={isSendMail} onClick={()=> exportData(true)} className={`btn-outline-v-1`}>
                  Send Mail
                </Button>
              )}
                {reportConfig?.isExportPdf && 
                (
                  <Button variant="outlined" size="small" disabled={isDownloading} onClick={()=> handleDownload()} className={`btn-outline-v-1`}>
                  Export To Pdf
                </Button>
              )}
                 <Button variant="outlined" size="small" disabled={isExporting} onClick={()=> exportData()} className={`btn-outline-v-1`}>
                  Export To Excel
                </Button>
                </div>
               
              )}
            </div>
          )}
        </div>
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={12} className="d-flex align-items-center layout-for-tablet gap-1">
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
                  if (defaultColumns?.length) {
                    history.push(routes.reports.path);
                  } else {
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }
                }
              }}
            >
              <CustomDialogHeader
                title={`Set Filters`}
                onClose={() => {
                  if (defaultColumns?.length) {
                    history.push(routes.reports.path);
                  } else {
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }
                }}
              />
              <div className="min-h-[600px] p-4">
                <DialogContent>
                  <ReportFilters
                    resourceColumns={resourceColumns}
                    betweenDate={betweenDate}
                    setBetweenDate={setBetweenDate}
                    resource={resourceStartCase}
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
                    statusPeriod={statusPeriod}
                    setStatusPeriod={setStatusPeriod}
                    statusPeriodDate={statusPeriodDate}
                    setStatusPeriodDate={setStatusPeriodDate}
                    statusTimeFrame={statusTimeFrame}
                    setStatusTimeFrame={setStatusTimeFrame}
                    selectedData={selectedData}
                    defaultResource={defaultColumns}
                    reportConfig={reportConfig}
                  />
                </DialogContent>
              </div>
            </Dialog>
          )}
          <div>
            {columns ? (
              <>
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={!selectedData?.['dayWise']?.value && resourceCamelCase === 'dailyVolumeReport'
                    ? columns?.filter((e) => e.accessor !== 'date') : columns}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchResourceData}
                  hideSelection={true}
                  reportSave={true}
                  pagination={[`dailyVolumeReport`, 'volumeReport']?.includes(resourceCamelCase) ? false : true}
                  isClientSideGrid={[`dailyVolumeReport`, 'volumeReport']?.includes(resourceCamelCase) ? true : false}
                />
              </>
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </div>
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
      {showPadData.open && (
        <PadData
          handleClose={() => {
            setShowPadData({ open: false, data: [] });
          }}
          column={columns}
          data={showPadData.data}
        />
      )}
      {isSendMail && (
        <Dialog
        open={isSendMail}
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={() => {
          setIsSendMail(false);
          setEmailAttachments([]);
          setFullScreen(false);
        }}
        fullWidth
      >
        <CreateEmail
        isQuoteBuilder={true}
        relatedTo = {null}
        emailId={null}
        handleClose={() => {
            setIsSendMail(false)
            setEmailAttachments([]);
        }}
        fetchData={()=>{
            setIsSendMail(false);
            setEmailAttachments([]);
        }}
        qouteBuilderAttachments={emailAttachments}
        isMinimized={true}
        onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      </Dialog>
      )
      }
    </MuiPickersUtilsProvider>
  );
};

export default Report;
