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
  dateFormatToSend,
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

let cancelTokenSource = null;

const ReportsTable = ({ state: reportState, isSidebarOpen, dynamicForm = false }: TableCommonProps) => {
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
    navigateToMainPage
  } = reportState;

  const customReportData = selectedReport?.customReportData ? selectedReport?.customReportData : null;
  const resourceCamelCase = camelCase(selectedReport.resource);
  const resourceStartCase: any = startCase(selectedReport.resource);
  const renderedFrom = selectedReport?.type === 'custom-report'? `${selectedReport.resource}_custom_report_new`: `${selectedReport.resource}_report_new`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, sorting, search, limit, filters, pageSizes, visibleColumns, columnOrder } = state;
  const [showGrid, setShowGrid] = useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [selectedReportView, setSelectedReportView] = useState(null);

  const fetchGridColumns = useCallback(async () => {
    setIsColumnsLoading(true);
    const {
      data: { data }
    }: any = await axiosInstance().get(`/report/columns?resource=${resourceStartCase}`);

    if (resourceStartCase === sidebarResource.serializedAsset) {
      const {
        data: { data: lookupResource }
      } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.customerAccount},${sidebarResource.supplierAccount}`);
      if (lookupResource) {
        data?.filterFields?.forEach((e: any) => {
          if (e?.fieldData?.fieldName === 'currentOwner') {
            e.fieldData.lookup = false;
            e.fieldData.option = [...lookupResource?.[sidebarResource.customerAccount], ...lookupResource?.[sidebarResource.supplierAccount]];
          }
        });
      }
    }

    const resourceColumns = [...data?.filterFields];
    setResourceColumns(resourceColumns);
    let columns = [];
    data?.columnFields?.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]) {
        o.fieldData.primaryField = true;
      }
    });

    let newColumns;
    if (dynamicForm) {
      const detailPagePath = `/${kebabCase(selectedReport?.resource)}/detail`;
      newColumns = generateColumns(resourceStartCase, data?.columnFields, detailPagePath);
    } else {
      newColumns = generateColumns(
        routes[resourceCamelCase]?.title,
        data?.columnFields,
        routes[`${resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase}Detail`].path
      );
    }
    columns = [...newColumns, ...getStaticFields()];
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
    if (dynamicForm) {
      api = `/report/dynamic-form`;
    } else if (resourceCamelCase === 'quotes') {
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
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, showGrid]);

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
            <AsynImportExportMenu
              resource={dynamicForm ? resourceStartCase : sidebarResource[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
              subResource={'report'}
              permissions={permissions[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
              module={''}
              api={getApi()}
              afterImportCompleted={() => { }}
              onlyExport={true}
              additionalParams={getQueryString(true).query}
              additionalHeaders={dynamicForm ? { resource: resourceStartCase } : null}
            />
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
    </>
  );
};

export default ReportsTable;
