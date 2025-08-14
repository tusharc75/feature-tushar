import axios from 'axios';
import { camelCase, kebabCase, startCase } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { MdFilterList } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import CustomReactTable, { getSortedVisibleColumns, getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  cn,
  CustomDialogTransition,
  dateFormatToSend,
  downloadExcel,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  primaryFields,
  sidebarResource
} from 'src/constants/helpers';
import { TableCommonProps } from 'src/pages/Reports/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import dayjs from 'dayjs';
import SendMailMenu from '../../tables/StandardReportTable/SendMailMenu';
import { isTablet } from 'react-device-detect';
import { Dialog } from '@mui/material';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';

let cancelTokenSource = null;

const ReportsTable = ({ state: reportState, isMobile, isSidebarOpen, dynamicForm = false }: TableCommonProps) => {
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
    navigateToMainPage,
    reportList
  } = reportState;

  const customReportData = selectedReport?.customReportData ? selectedReport?.customReportData : null;
  const resourceCamelCase = camelCase(selectedReport.resource);
  const resourceStartCase = startCase(selectedReport.resource);
  const renderedFrom = `${selectedReport.resource}_report_new`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, sorting, search, limit, filters, pageSizes, visibleColumns, columnOrder } = state;
  const [showGrid, setShowGrid] = useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [selectedReportView, setSelectedReportView] = useState(null);
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(null);
  const [isSendMail, setIsSendMail] = useState(false);
  const [htmlContent, setHtmlContent] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const reportConfig = reportList?.find((e) => e.type === resourceCamelCase);

  const fetchGridColumns = useCallback(async () => {
    setIsColumnsLoading(true);
    const {
      data: { data }
    }: any = await axiosInstance().get(`/field?resource=${resourceStartCase}&view=true`);

    if (resourceStartCase === sidebarResource.serializedAsset) {
      const {
        data: { data: lookupResource }
      } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.customerAccount},${sidebarResource.supplierAccount}`);
      if (lookupResource) {
        data?.forEach((e) => {
          if (e?.fieldData?.fieldName === 'currentOwner') {
            e.fieldData.lookup = false;
            e.fieldData.option = [...lookupResource?.[sidebarResource.customerAccount], ...lookupResource?.[sidebarResource.supplierAccount]];
          }
        });
      }
    }

    const resourceColumns = [...data];
    if (resourceStartCase === sidebarResource.purchaseOrder) {
      resourceColumns.push({
        fieldData: {
          _id: '630dc2429ec41861052355a9',
          fieldLabel: 'Received Date',
          type: 'date',
          option: [],
          required: false,
          isTooltip: false,
          tooltipMessage: '',
          editAble: true,
          deletAble: true,
          order: 6,
          fieldName: 'receivedDate',
          sectionName: 'PO Information',
          resource: 'Purchase Order',
          brand: data[0]?.fieldData?.brand,
          timeFrame: 'custom'
        },
        isCreate: true,
        isRead: true,
        isUpdate: true
      });
    }
    if (resourceStartCase === sidebarResource.serializedAsset && resourceColumns?.some((r) => r?.fieldData?.fieldName === 'status')) {
      const index = resourceColumns?.findIndex((r) => r?.fieldData?.fieldName === 'status');
      if (index !== -1) {
        resourceColumns?.splice(index + 1, 0, {
          fieldData: {
            _id: '630dc2429ec41869052355b1',
            fieldLabel: 'Status Period',
            type: 'date',
            option: [],
            required: false,
            isTooltip: false,
            tooltipMessage: '',
            editAble: true,
            deletAble: true,
            order: 71,
            fieldName: 'statusPeriod',
            sectionName: 'Product Inventory',
            resource: 'Serialized Asset',
            brand: data[0]?.fieldData?.brand,
            timeFrame: 'custom'
          },
          isCreate: true,
          isRead: true,
          isUpdate: true
        });
      }
    }
    setResourceColumns(resourceColumns);
    let columns = [];
    data.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]) {
        o.fieldData.primaryField = true;
      }
    });

    let newColumns;
    if (dynamicForm) {
      const detailPagePath = `/${kebabCase(selectedReport?.resource)}/detail`;
      newColumns = generateColumns(resourceStartCase, data, detailPagePath);
    } else {
      newColumns = generateColumns(
        routes[resourceCamelCase]?.title,
        data,
        routes[`${resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase}Detail`].path
      );
    }
    if (resourceStartCase === sidebarResource.quotation) {
      newColumns.push({
        accessor: 'versionComment',
        Header: 'Version Comment',
        show: true,
        disabled: false,
        Cell: ({ row }) => (
          <>
            <h5 className="text-truncate">{row.original['versionComment'] ? row.original['versionComment'] : <NoDataCell />}</h5>
          </>
        )
      });
    }
    columns = [...newColumns, ...getStaticFields()];
    if (resourceStartCase === sidebarResource.purchaseOrder) {
      columns.splice(1, 0, {
        accessor: 'poAmount',
        Header: 'Purchase Order Amount',
        disabled: false,
        Cell: ({ row }) => (
          <>
            <h5 className="text-truncate">{row.original['poAmount'] ? row.original['poAmount'] : <NoDataCell />}</h5>
          </>
        )
      });
    }
    if ([sidebarResource.invoice, sidebarResource.fieldTicket].includes(resourceStartCase)) {
      const extraColumns = [
        {
          accessor: 'amount',
          Header: 'Amount',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['amount'] ? row.original['amount'] : <NoDataCell />}</h5>
            </>
          )
        },
        {
          accessor: 'tax',
          Header: 'Tax',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['tax'] ? row.original['tax'] : <NoDataCell />}</h5>
            </>
          )
        },
        {
          accessor: 'discount',
          Header: 'Discount',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['discount'] ? row.original['discount'] : <NoDataCell />}</h5>
            </>
          )
        },
        {
          accessor: 'totalAmount',
          Header: 'Total Amount',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['totalAmount'] ? row.original['totalAmount'] : <NoDataCell />}</h5>
            </>
          )
        }
      ];
      columns = [...columns, ...extraColumns];
    }
    if (resourceStartCase === sidebarResource.workOrder) {
      columns.push({
        accessor: 'totalConsumablesCost',
        Header: 'Total Consumables Cost',
        show: true,
        disabled: false,
        Cell: ({ row }) => (
          <>
            <h5 className="text-truncate">{row.original['totalConsumablesCost'] ? row.original['totalConsumablesCost'] : <NoDataCell />}</h5>
          </>
        )
      });
    }
    columns?.forEach((e) => {
      e.editable = false;
    });
    setColumns([...columns]);
    setIsColumnsLoading(false);
  }, [generateColumns, resourceCamelCase, resourceStartCase, dynamicForm, setColumns, setIsColumnsLoading, setResourceColumns]);

  const getQueryString = (isExport = false, deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
    let filterQuery = `?page=${page}&limit=${limit}&`;
    let deepFilter = [];
    let newDeepFilter = [...deepFiltersP];

    if (isExport) {
      filterQuery = `?`;
    }

    if (sorting.length > 0) {
      filterQuery = `${filterQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      filterQuery = `${filterQuery}search=${encodeURIComponent(search)}&`;
    }
    if (!isObjectEmpty(filters)) {
      for (let i = 0; i < deepFiltersP.length; i++) {
        const tempFilter = deepFiltersP[i];
        if (filters[tempFilter.field]) {
          newDeepFilter = newDeepFilter.filter((d) => d.field !== tempFilter.field);
          deepFiltersP = newDeepFilter;
        }
      }
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

    const dateFilter: any = [];
    const statusPeriodDateFilter: any = [];

    const isStatusPeriod =
      resourceStartCase === sidebarResource.serializedAsset && resourceColumns?.some((r) => r?.fieldData?.fieldName === 'status');

    if (deepFiltersP?.length > 0) {
      deepFilter = [
        ...deepFilter,
        ...deepFiltersP
          ?.filter((d) => {
            if (d?.type === 'date') {
              if (isStatusPeriod && 'statusPeriod' === d?.field) {
                statusPeriodDateFilter.push({ field: `from_${d?.field}`, term: d?.term?.from });
                statusPeriodDateFilter.push({ field: `to_${d?.field}`, term: d?.term?.to });
              } else {
                dateFilter.push({ field: `from_${d?.field}`, term: d?.term?.from });
                dateFilter.push({ field: `to_${d?.field}`, term: d?.term?.to });
              }
              return false;
            }
            return d?.term?.length ? true : false;
          })
          ?.map((d) => {
            if (filterTerm[d?.field] === '$nin' && Array.isArray(d?.term)) {
              return {
                field: d?.field,
                term: { $nin: d?.term }
              };
            }
            return {
              field: d?.field,
              term: d?.term
            };
          })
      ];
    }
    if (dateFilter?.length > 0) {
      deepFilter = [...deepFilter, ...dateFilter?.filter((d) => dayjs(d?.term).isValid())?.map((d) => ({ ...d, term: dateFormatToSend(d?.term) }))];
    }

    if (statusPeriodDateFilter?.length > 0) {
      statusPeriodDateFilter?.forEach((d) => {
        if (d?.term) {
          filterQuery = `${filterQuery}${d?.field}=${d?.term}&`;
        }
      });
    }

    if (deepFilter && deepFilter.length > 0) {
      filterQuery = `${filterQuery}deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}&`;
    }

    if (isExport) {
      filterQuery = `${filterQuery}exportColumn=${JSON.stringify(getSortedVisibleColumns(columns, visibleColumns, columnOrder))}`;
    }

    return { query: `${filterQuery}`, deepFilter: newDeepFilter };
  };

  const fetchResourceData = useCallback(
    (deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
      setShowGrid(true);

      let { query, deepFilter } = getQueryString(false, deepFiltersP, filterByIdsP);
      setDeepFilters(deepFilter);

      if (cancelTokenSource) {
        cancelTokenSource.cancel();
      }
      cancelTokenSource = axios.CancelToken.source();
      dispatch({ type: 'loading', loading: true });

      let api = dynamicForm ? `/report/dynamic-form${query}` : `/report${routes[resourceCamelCase].path}${query}`;
      if (resourceCamelCase === 'quotes') {
        api = `/report/quote-builder${query}`;
      } else if (!dynamicForm) {
        api = `/report${routes[resourceCamelCase].path}${query}`;
      }

      const requestConfig: any = { cancelToken: cancelTokenSource?.token };
      if (dynamicForm) {
        requestConfig.headers = {
          resource: resourceStartCase
        };
      }

      axiosInstance()
        .get(api, requestConfig)
        .then(({ data: { data, count } }) => {
          data = data.map((u: any) => {
            let finalObject = prepareDataForGrid(u);
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
    },
    [dispatch, getQueryString, resourceCamelCase, resourceStartCase, dynamicForm, toastConfig]
  );

  const getApi = () => {
    let api = null;
    if (resourceCamelCase === 'quotes') {
      api = `/report/quote-builder`;
    } else {
      api = `/report${routes[resourceCamelCase].path}`;
    }
    return api;
  };

  useEffect(() => {
    if (customReportData && selectedReport?.type === 'custom-report') {
      if (customReportData?.filters?.length > 0) {
        const filterById: any = [];
        const deepFilter: any = [];
        customReportData?.filters?.forEach((f) => {
          if (f?.lookup) {
            filterById.push({
              field: f?.term,
              term: f?.value
            });
          } else {
            deepFilter.push({
              ...f,
              field: f?.term,
              term: f?.value
            });
          }
        });
        setFilterByIds(filterById);
        setDeepFilters(deepFilter);
      }
      setShowGrid(true);
    }
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (emailAttachments?.length > 0 || htmlContent) {
      setIsProcessing(null);
      setIsSendMail(true);
    }
  }, [emailAttachments, htmlContent]);

  useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, showGrid]);

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

    let { query: filterQuery } = getQueryString(true);

    var api = '';
    if (exportType === 'pdf') {
      api = `/report/dynamic-form/pdf`;
    } else if (exportType === 'html') {
      api = `/report/dynamic-form/pdf`;
    } else {
      api = `/report/dynamic-form/export`;
    }
    const extension = exportType === 'excel' ? 'xlsx' : 'pdf';
    const contentType = exportType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (processType === 'sendMail' && exportType === 'html') {
      axiosInstance()
        .get(`${api}${filterQuery}&html=true`, {
          headers: {
            resource: resourceStartCase
          }
        })
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
        responseType: 'arraybuffer',
        headers: {
          resource: resourceStartCase
        }
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

  return (
    <>
      <div className={cn('inline-flex justify-between gap-2', !isSidebarOpen ? 'w-[calc(100%-40px)]' : 'w-full')}>
        {showGrid && (
          <>
            {selectedReport?.type === 'custom-report' && customReportData ? (
              <div></div>
            ) : (
              <ThemeButton
                iconForMobile={<MdFilterList />}
                onClick={() => {
                  setShowGrid(false);
                  dispatch({ type: 'onlyFilter', filters: {} });
                }}
                startIcon={<MdFilterList />}
              >
                Show Filters
              </ThemeButton>
            )}
            {dynamicForm ? (
              <>
                {reportConfig?.isSendMail && <SendMailMenu exportData={exportData} isProcessing={isProcessing} />}
                {reportConfig?.isExportPdf && (
                  <ThemeButton
                    iconForMobile={false}
                    disabled={isProcessing === 'pdf'}
                    onClick={() => exportData('pdf', 'pdf')}
                    isLoading={isProcessing === 'pdf'}
                  >
                    Export To PDF
                  </ThemeButton>
                )}
                <ThemeButton
                  iconForMobile={false}
                  disabled={isProcessing === 'excel'}
                  onClick={() => exportData('excel', 'excel')}
                  isLoading={isProcessing === 'excel'}
                >
                  Export To Excel
                </ThemeButton>
              </>
            ) : (
              <AsynImportExportMenu
                resource={sidebarResource[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
                subResource={'report'}
                permissions={permissions[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
                module={''}
                api={getApi()}
                afterImportCompleted={() => {}}
                onlyExport={true}
                additionalParams={getQueryString(true).query}
              />
            )}
          </>
        )}
      </div>
      {columns ? (
        <CustomReactTable
          topLeftSlot={
            <DisplayFilterChip
              filterTerm={filterTerm}
              resourceColumns={resourceColumns}
              deepFilters={deepFilters}
              filterByIds={filterByIds}
              fetchResourceData={fetchResourceData}
              setDeepFilters={setDeepFilters}
              setFilterByIds={setFilterByIds}
              disableClear={customReportData && selectedReport?.type === 'custom-report' ? true : false}
            />
          }
          height={'calc(100vh - 270px)'}
          columns={
            selectedReport?.type === 'custom-report' && customReportData && customReportData?.column?.length > 0
              ? columns?.filter((t) => customReportData?.column?.includes(t?.accessor))
              : columns
          }
          state={state}
          resource={dynamicForm ? resourceStartCase : sidebarResource[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchResourceData}
          hideSelection={true}
          setSelectedReportView={setSelectedReportView}
          selectedReportView={selectedReportView}
        />
      ) : (
        <div className="h-[500px] p-4">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </div>
      )}
      {!showGrid && !customReportData && selectedReport?.type != 'custom-report' && (
        <Filter
          onClose={() => {
            dispatch({ type: 'onlyFilter', filters: {} });
            setShowGrid(true);
          }}
          loading={isColumnsLoading}
          filterTitle={selectedReport.title}
          resource={dynamicForm ? resourceStartCase : sidebarResource[resourceCamelCase]}
          columns={resourceColumns}
          onApplyFilter={fetchResourceData}
          deepFilters={deepFilters}
          setDeepFilters={setDeepFilters}
          filterByIds={filterByIds}
          setFilterByIds={setFilterByIds}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
          onCloseWithErrors={navigateToMainPage}
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
    </>
  );
};

export default ReportsTable;
