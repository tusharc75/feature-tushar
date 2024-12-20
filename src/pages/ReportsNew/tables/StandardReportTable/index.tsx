import MomentUtils from '@date-io/moment';
import { CircularProgress, Dialog, IconButton } from '@material-ui/core';
import { History, Visibility } from '@material-ui/icons';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import axios from 'axios';
import { camelCase, isArray, isEmpty, isNumber, isObject, startCase } from 'lodash';
import React, { useEffect, useState } from 'react';
import { isTablet } from 'react-device-detect';
import { MdFilterList } from 'react-icons/md';
import { Link } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Filter, { getErrors } from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  cn,
  CustomDialogTransition,
  downloadExcel,
  formatAmountWithCurrency,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  REPORT_LIST,
  sidebarResource
} from 'src/constants/helpers';
import { ReferenceRenderer } from 'src/pages/ProductInventory/History';
import AverageCostHistory from 'src/pages/ReportsNew/tables/AverageCostHistory';
import DisplayFilterChip from 'src/pages/ReportsNew/tables/DisplayFilterChip';
import PadData from 'src/pages/ReportsNew/tables/PadData';
import {
  CreditDebitRenderer,
  CreditDebitTypeRenderer,
  PackageRenderer,
  ProductRenderer,
  SerializedAssetRenderer,
  SerialNumberRenderer,
  ServiceRenderer,
  UnitNameRenderer
} from 'src/pages/ReportsNew/tables/StandardReportTable/helperComponents';
import SendMailMenu from 'src/pages/ReportsNew/tables/StandardReportTable/SendMailMenu';
import { TableCommonProps } from 'src/pages/ReportsNew/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

let cancelTokenSource = null;

const StandardReportsTable = ({ state: reportState, isMobile, isSidebarOpen }: TableCommonProps) => {
  const toastConfig = React.useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const {
    selectedReport,
    columns,
    resourceColumns,
    setColumns,
    setResourceColumns,
    setIsColumnsLoading,
    permissions,
    isColumnsLoading,
    selectedEntity,
    navigateToMainPage
  } = reportState;

  const resourceCamelCase = camelCase(selectedReport.resource);
  const resourceStartCase = startCase(selectedReport.resource);
  const renderedFrom = `${selectedReport.resource}_report_new`;
  const reportConfig = REPORT_LIST?.find((e) => e.type === resourceCamelCase);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, sorting, search, limit, filters, pageSizes, visibleColumns } = state;
  const [showGrid, setShowGrid] = React.useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [defaultColumns, setDefaultColumns] = React.useState([]);

  const [showPadData, setShowPadData] = React.useState({ open: false, data: [] });
  const [showPriceHistory, setShowPriceHistory] = React.useState({ open: false, product: '', productName: '' });

  const [footerData, setFooterData] = React.useState<Record<string, number>>(null);
  const [emailAttachments, setEmailAttachments] = React.useState([]);
  const [isProcessing, setIsProcessing] = React.useState(null);
  const [isSendMail, setIsSendMail] = React.useState(false);
  const [htmlContent, setHtmlContent] = React.useState(null);
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  React.useEffect(() => {
    if (showGrid && getErrors(defaultColumns, deepFilters).errorColumns.length === 0) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, selectedEntity]);

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
                <History fontSize="small" color="primary" />
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
                <Visibility fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const fetchGridColumns = async () => {
    try {
      setIsColumnsLoading(true);
      let columns = [];
      let {
        data: {
          data: { columnFields, filterFields }
        }
      } = await axiosInstance().get(`/report/${selectedReport.resource}/column`);
      let newColumns = generateColumns(selectedReport.resource, columnFields);
      newColumns?.forEach((o) => {
        if (resourceCamelCase === 'inventoryHistory') {
          if (o?.accessor === 'type') {
            o.cell = ({ row }) => CreditDebitTypeRenderer(row);
          }
          if (o?.accessor === 'qty') {
            o.cell = ({ row }) => CreditDebitRenderer(row, 'qty');
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
        if (o?.accessor === 'productName' || o?.accessor === 'product') {
          o.cell = ({ row }) => ProductRenderer(row);
        }
        if (o?.accessor === 'serviceName') {
          o.cell = ({ row }) => ServiceRenderer(row);
        }
        if (o?.accessor === 'packageName') {
          o.cell = ({ row }) => PackageRenderer(row);
        }
        if (o?.accessor === 'assetNumber') {
          o.cell = ({ row }) => SerializedAssetRenderer(row);
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
      } else if (resourceCamelCase === 'inUsedSerializedAsset') {
        newColumns?.forEach((e) => {
          if (['billingAddress', 'shippingAddress']?.includes(e.accessor)) {
            e.disableFilters = true;
            e.disableSortBy = true;
          }
        });
        columns = [...newColumns];
      } else if (resourceCamelCase === 'purchaseOrderDetails') {
        newColumns?.forEach((e) => {
          if (['productId', 'productNumber', 'productDescription', 'serviceName', 'serviceDescription', 'description']?.includes(e.accessor)) {
            e.disableFilters = true;
            e.disableSortBy = true;
          }
        });
        columns = [...newColumns];
      } else if (resourceCamelCase === 'volumeReport') {
        columns = [...newColumns, ActionsRenderer];
      } else {
        columns = [...newColumns];
      }

      setResourceColumns(filterFields);
      if (reportConfig?.defaultColumn) {
        setDefaultColumns(filterFields.filter((field) => field?.fieldData?.required)?.map((field) => field?.fieldData));
      }
      setColumns(columns);
      setIsColumnsLoading(false);
    } catch (error) {
      setIsColumnsLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const getQueryString = (isExport = false, deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {

    let filterQuery = ``;
    let deepFilter = [];

    if (!isExport) {
      filterQuery = `page=${page}&limit=${limit}&`;
    }
    if (selectedReport.resource === 'iot-data-points') {
      filterQuery += `column=true&timezone=${Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone}&`;
    }
    if (sorting.length > 0) {
      filterQuery = `${filterQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      filterQuery = `${filterQuery}search=${encodeURIComponent(search)}&`;
    }

    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        deepFilter.push({
          field: field,
          term: filters[field].filter
        });
      });
    }

    if (filterByIdsP?.length > 0) {
      const filterById = filterByIdsP
        ?.filter((f) => f?.term?.length > 0)
        ?.map((f) => {
          const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
          return {
            field: f?.field,
            term: {
              [term]: f?.term?.map?.((d: any) => d.optionValue)
            }
          };
        });
      if (filterById?.length > 0) {
        filterQuery = `${filterQuery}filterById=${JSON.stringify(filterById)}&`;
      }
    }

    const isStatusPeriod = resourceStartCase === sidebarResource.serializedAsset && resourceColumns?.some((r) => r?.fieldData?.fieldName === 'status');

    if (deepFiltersP?.length > 0) {
      deepFilter = [
        ...deepFilter,
        ...deepFiltersP
          ?.filter((d) => {
            const hasTermLength = d?.term?.length ? true : false;
            if (isStatusPeriod) {
              return hasTermLength && !['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field);
            }
            return hasTermLength;
          })
          ?.map((d) => {
            if (filterTerm[d?.field] === '$nin' && isArray(d?.term)) {
              return {
                ...d,
                term: { $nin: d?.term }
              };
            }
            return d;
          })
      ];
    }

    if (isStatusPeriod && deepFiltersP?.filter((d) => d?.term && ['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field))) {
      deepFiltersP?.filter((d) => d?.term && ['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field))
        ?.forEach((ele) => {
          filterQuery = `${filterQuery}${ele?.field}=${ele?.term}&`;
        });
    }

    if (deepFilter && deepFilter.length > 0) {
      filterQuery = `${filterQuery}deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}&`;
    }

    if (resourceCamelCase === 'userSession') {
      return `?column=true&${filterQuery}`;
    }

    if (isExport) {
      let newColumns = columns.map((col) => col.accessor);
      if (!isEmpty(visibleColumns) && isObject(visibleColumns)) {
        newColumns = [];
        for (const [key, value] of Object.entries(visibleColumns)) {
          if (value) {
            newColumns.push(key);
          }
        }
      }
      filterQuery = `${filterQuery}&exportColumn=${JSON.stringify(newColumns)}`;
    }

    return `?${filterQuery}`;
  };

  const fetchResourceData = (deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
    setShowGrid(true);
    let filterQuery = getQueryString(false, deepFiltersP, filterByIdsP);
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });

    var api = `/report/${selectedReport.resource}`;
    axiosInstance()
      .get(`${api}${filterQuery}`, {
        cancelToken: cancelTokenSource?.token
      })
      .then(({ data: { data, count, columns } }) => {
        if (resourceCamelCase === 'userSession') {
          setIsColumnsLoading(true);
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
          setIsColumnsLoading(false);
        }
        if (resourceCamelCase === 'iotDataPoints') {
          setIsColumnsLoading(true);
          let newColumns = generateColumns(selectedReport.resource, columns);
          setColumns(newColumns);
          setIsColumnsLoading(false);
        }

        data = data.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          return finalObject;
        });
        if ([`dailyVolumeReport`, 'volumeReport', 'rentalVolumeReport']?.includes(resourceCamelCase)) {
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
    };
  };

  const exportData = (exportType = 'excel', processType = 'excel') => {
    toastConfig.setToastConfig({
      open: true,
      message: `Please wait ${processType === 'sendMail' ? '' : 'exporting data'}`,
      type: 'info'
    });

    setIsProcessing(processType);

    let filterQuery = getQueryString(true);

    var api = '';
    if (exportType === 'pdf') {
      api = `/report/${selectedReport.resource}/pdf`;
    } else if (exportType === 'html') {
      api = `/report/${selectedReport.resource}/pdf`;
    } else {
      api = `/report/${selectedReport.resource}/export`;
    }
    const extension = exportType === 'excel' ? 'xlsx' : 'pdf';
    const contentType = exportType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (processType === 'sendMail' && exportType === 'html') {
      axiosInstance()
        .get(`${api}${filterQuery}&html=true`)
        .then((res) => {
          setHtmlContent(res.data);
          setIsProcessing(null);
        })
        .catch((err) => {
          setIsProcessing(null);
          toastConfig.setToastConfig(err);
        });
      return;
    }

    axiosInstance()
      .get(`${api}${filterQuery}`, {
        responseType: 'arraybuffer'
      })
      .then((res) => {
        const fileName = res.headers['content-disposition'].split('filename=')[1];
        if (processType === 'sendMail') {
          const blobData = new Blob([res.data], { type: contentType });
          generateBase64forFile(blobData, fileName, extension);
        } else if (processType === 'pdf') {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName + '.pdf');
          document.body.appendChild(link);
          link.click();
          toastConfig.setToastConfig({
            open: true,
            message: 'Successfully Exported',
            type: 'success'
          });
          setIsProcessing(null);
        } else {
          downloadExcel(res.data, fileName);
          toastConfig.setToastConfig({
            open: true,
            message: 'Successfully Exported',
            type: 'success'
          });
          setIsProcessing(null);
        }
      })
      .catch((err) => {
        setIsProcessing(null);
        toastConfig.setToastConfig(err);
      });
  };

  const getFilteredColumn = (column) => {
    let tempColumn = column;
    if (resourceCamelCase === 'dailyVolumeReport') {
      const dayWiseFilter = deepFilters?.find((e) => e.field === 'dayWise')
      if (!dayWiseFilter || (dayWiseFilter && dayWiseFilter?.term === 'No')) {
        tempColumn = tempColumn?.filter((e) => e.accessor !== 'date');
      }
      const padWiseFilter = deepFilters?.find((e) => e.field === 'padWise')
      if (padWiseFilter && padWiseFilter?.term === 'Yes') {
        tempColumn = tempColumn?.filter((e) => !['asset', 'customerAccount'].includes(e.accessor));
      }
      return tempColumn;
    }
    if (resourceCamelCase === 'volumeReport') {
      const unitWiseFilter = deepFilters?.find((e) => e.field === 'unitWise')
      if (!unitWiseFilter || (unitWiseFilter && unitWiseFilter?.term === 'No')) {
        tempColumn = tempColumn?.filter((e) => !['asset', 'padName', 'customerAccount']?.includes(e.accessor));
      }
      return tempColumn;
    }
    return column;
  };

  useEffect(() => {
    if (emailAttachments?.length > 0 || htmlContent) {
      setIsProcessing(null);
      setIsSendMail(true);
    }
  }, [emailAttachments, htmlContent]);

  useEffect(() => {
    if ([`dailyVolumeReport`, 'volumeReport', 'rentalVolumeReport']?.includes(resourceCamelCase) && footerData) {
      const dataKeys = Object.keys(footerData);
      const newColumns = columns.map((col: any, index) => {
        if (index === 0) {
          return { ...col, Footer: 'Total' };
        }
        if (dataKeys.includes(col.accessor)) {
          return {
            ...col,
            Footer:
              footerData[col.accessor] && isNumber(footerData[col.accessor]) ? (
                col?.type === 'currencyNumber' ? (
                  `${formatAmountWithCurrency(col?.currency, footerData[col.accessor])?.fullFormatAmountWithoutSpace}`
                ) : (
                  footerData[col.accessor]
                )
              ) : (
                <NoDataCell />
              )
          };
        }
        return col;
      });
      setColumns(newColumns as TColType[]);
    }
  }, [columns?.length, selectedReport.resource, footerData]);

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      {showGrid && (
        <div className={cn('inline-flex justify-between gap-2', !isSidebarOpen ? 'w-[calc(100%-40px)]' : 'w-full')}>
          <>
            <ThemeButton
              iconForMobile={<MdFilterList />}
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
            </ThemeButton>
            <span id="importExportLinks" className="space-x-2">
              {['inUsedSerializedAsset', 'lostAssets'].includes(resourceCamelCase) ? (
                <AsynImportExportMenu
                  resource={sidebarResource.report}
                  subResource={selectedReport.resource}
                  referenceId={null}
                  permissions={permissions?.report}
                  module={selectedReport.resource}
                  api={`/report/${selectedReport.resource}`}
                  afterImportCompleted={() => { }}
                  isExportCount={true}
                  exportCount={0}
                  ids={[]}
                  onlyExport={true}
                  additionalParams={getQueryString(true)}
                />
              ) : (
                <>
                  {reportConfig?.isSendMail && <SendMailMenu exportData={exportData} isProcessing={isProcessing} />}
                  {reportConfig?.isExportPdf && (
                    <ThemeButton
                      iconForMobile={false}
                      variant="outlined"
                      size="small"
                      disabled={isProcessing === 'pdf'}
                      onClick={() => exportData('pdf', 'pdf')}
                      startIcon={isProcessing === 'pdf' && <CircularProgress color="inherit" size={18} />}
                    >
                      Export To PDF
                    </ThemeButton>
                  )}
                  <ThemeButton
                    iconForMobile={false}
                    variant="outlined"
                    size="small"
                    disabled={isProcessing === 'excel'}
                    onClick={() => exportData('excel', 'excel')}
                    startIcon={isProcessing === 'excel' && <CircularProgress color="inherit" size={18} />}
                  >
                    Export To Excel
                  </ThemeButton>
                </>
              )}
            </span>
          </>
        </div>
      )}
      {columns ? (
        <>
          <CustomReactTable
            topLeftSlot={
              <DisplayFilterChip
                deepFilters={deepFilters}
                filterByIds={filterByIds}
                fetchResourceData={fetchResourceData}
                setDeepFilters={setDeepFilters}
                setFilterByIds={setFilterByIds}
              />
            }
            height={'calc(100vh - 270px)'}
            columns={getFilteredColumn(columns)}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchResourceData}
            hideSelection={true}
            hideExportTable={true}
            pagination={[`dailyVolumeReport`, 'volumeReport', 'rentalVolumeReport']?.includes(resourceCamelCase) ? false : true}
            isClientSideGrid={[`dailyVolumeReport`, 'volumeReport', 'rentalVolumeReport']?.includes(resourceCamelCase) ? true : false}
          />
        </>
      ) : (
        <div className="h-[500px] p-4">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </div>
      )}
      {!showGrid && (
        <Filter
          onClose={() => {
            setShowGrid(true);
          }}
          loading={isColumnsLoading}
          resource={sidebarResource[resourceCamelCase]}
          columns={resourceColumns}
          onApplyFilter={fetchResourceData}
          deepFilters={deepFilters}
          filterTitle={selectedReport.title}
          setDeepFilters={setDeepFilters}
          filterByIds={filterByIds}
          setFilterByIds={setFilterByIds}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
          defaultColumns={defaultColumns}
          reportConfig={reportConfig}
          onCloseWithErrors={navigateToMainPage}
        />
      )}
      {showPriceHistory.open && (
        <AverageCostHistory
          product={showPriceHistory.product}
          productName={showPriceHistory.productName}
          handleClose={() => {
            setShowPriceHistory({ open: false, product: '', productName: '' });
          }}
          deepFilters={deepFilters}
          filterByIds={filterByIds}
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
            setEmailAttachments([]);
            setHtmlContent(null);
            setFullScreen(false);
            setIsSendMail(false);
          }}
          fullWidth
          disableEnforceFocus={true}
        >
          <CreateEmail
            isQuoteBuilder={true}
            relatedTo={null}
            emailId={null}
            handleClose={() => {
              setEmailAttachments([]);
              setHtmlContent(null);
              setIsSendMail(false);
            }}
            fetchData={() => {
              setEmailAttachments([]);
              setHtmlContent(null);
              setIsSendMail(false);
            }}
            qouteBuilderAttachments={emailAttachments}
            isMinimized={true}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            content={htmlContent}
          />
        </Dialog>
      )}
    </MuiPickersUtilsProvider>
  );
};

export default StandardReportsTable;
