import axios from 'axios';
import { kebabCase, startCase } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { MdFilterList } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getSortedVisibleColumns, getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn, dateFormatToSend, downloadExcel, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { TableCommonProps } from 'src/pages/Reports/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import dayjs from 'dayjs';

let cancelTokenSource = null;

const ReportsTable = ({ state: reportState, isMobile, isSidebarOpen }: TableCommonProps) => {
  const toastConfig = React.useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const { selectedReport, columns, resourceColumns, setColumns, setResourceColumns, setIsColumnsLoading, isColumnsLoading, navigateToMainPage } =
    reportState;

  const resourceStartCase = startCase(selectedReport.resource);

  const renderedFrom = `${selectedReport.resource}_report_new`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, sorting, search, limit, filters, pageSizes, visibleColumns, columnOrder } = state;
  const [showGrid, setShowGrid] = React.useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [selectedReportView, setSelectedReportView] = useState(null);
  const [isProcessing, setIsProcessing] = React.useState(null);

  const fetchGridColumns = useCallback(async () => {
    setIsColumnsLoading(true);
    const {
      data: { data }
    }: any = await axiosInstance().get(`/field?resource=${resourceStartCase}&view=true`);

    setResourceColumns(data);
    let columns = [];

    const detailPagePath = `/${kebabCase(selectedReport?.resource)}/detail`;

    let newColumns = generateColumns(resourceStartCase, data, detailPagePath);
    columns = [...newColumns, ...getStaticFields()];
    columns?.forEach((e) => {
      e.editable = false;
    });
    setColumns([...columns]);
    setIsColumnsLoading(false);
  }, [generateColumns, resourceStartCase, selectedReport?.resource, setColumns, setIsColumnsLoading, setResourceColumns]);

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

    if (deepFiltersP?.length > 0) {
      deepFilter = [
        ...deepFilter,
        ...deepFiltersP
          ?.filter((d) => {
            if (d?.type === 'date') {
              dateFilter.push({ field: `from_${d?.field}`, term: d?.term?.from });
              dateFilter.push({ field: `to_${d?.field}`, term: d?.term?.to });
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

      let api = `/report/dynamic-form${query}`;

      axiosInstance()
        .get(api, {
          cancelToken: cancelTokenSource?.token,
          headers: {
            resource: resourceStartCase
          }
        })
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
    [dispatch, getQueryString, resourceStartCase, toastConfig]
  );

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, showGrid]);

  const exportData = (exportType = 'excel') => {
    toastConfig.setToastConfig({
      open: true,
      message: `Please wait exporting data`,
      type: 'info'
    });

    setIsProcessing(exportType);

    let { query: filterQuery } = getQueryString(true);

    let api = `/report/dynamic-form/export`;

    axiosInstance()
      .get(`${api}${filterQuery}`, {
        responseType: 'arraybuffer',
        headers: {
          resource: resourceStartCase
        }
      })
      .then((res) => {
        const fileName = res.headers['content-disposition'].split('filename=')[1];

        downloadExcel(res.data, fileName);
        toastConfig.setToastConfig({
          open: true,
          message: 'Successfully Exported',
          type: 'success'
        });
        setIsProcessing(null);
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
            <ThemeButton
              iconForMobile={false}
              disabled={isProcessing === 'excel'}
              onClick={() => exportData('excel')}
              isLoading={isProcessing === 'excel'}
            >
              Export To Excel
            </ThemeButton>
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
              disableClear={false}
            />
          }
          height={'calc(100vh - 270px)'}
          columns={columns}
          state={state}
          resource={resourceStartCase}
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
      {!showGrid && (
        <Filter
          onClose={() => {
            dispatch({ type: 'onlyFilter', filters: {} });
            setShowGrid(true);
          }}
          loading={isColumnsLoading}
          filterTitle={selectedReport.title}
          resource={resourceStartCase}
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
