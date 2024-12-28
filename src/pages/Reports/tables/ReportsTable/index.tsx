import axios from 'axios';
import { camelCase, isEmpty, isObject, startCase } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { MdFilterList } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, primaryFields, sidebarResource } from 'src/constants/helpers';
import { TableCommonProps } from 'src/pages/Reports/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';

let cancelTokenSource = null;

const ReportsTable = ({ state: reportState, isMobile, isSidebarOpen }: TableCommonProps) => {
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
  const resourceCamelCase = camelCase(selectedReport.resource);
  const resourceStartCase = startCase(selectedReport.resource);
  const renderedFrom = `${selectedReport.resource}_report_new`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, sorting, search, limit, filters, pageSizes, visibleColumns } = state;
  const [showGrid, setShowGrid] = React.useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [selectedReportView, setSelectedReportView] = useState(null);

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
    setIsColumnsLoading(false);
    let columns = [];
    data.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]) {
        o.fieldData.primaryField = true;
      }
    });

    let newColumns = generateColumns(
      routes[resourceCamelCase]?.title,
      data,
      routes[`${resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase}Detail`].path
    );
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
  }, [generateColumns, resourceCamelCase, resourceStartCase, setColumns, setIsColumnsLoading, setResourceColumns]);

  const getFilter = useCallback(
    (isExport = false, deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
      let filterQuery = `page=${page}&`;
      let deepFilter = [];
      let newDeepFilter = [...deepFiltersP];

      if (!isExport) {
        filterQuery = `${filterQuery}limit=${limit}&`;
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

      const isStatusPeriod =
        resourceStartCase === sidebarResource.serializedAsset && resourceColumns?.some((r) => r?.fieldData?.fieldName === 'status');

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
              if (filterTerm[d?.field] === '$nin' && Array.isArray(d?.term)) {
                return {
                  ...d,
                  term: { $nin: d?.term }
                };
              }
              return d;
            })
        ];
      }
      if (isStatusPeriod && deepFiltersP?.filter((d) => d?.term && ['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field))?.length) {
        deepFiltersP
          ?.filter((d) => d?.term && ['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field))
          ?.forEach((ele) => {
            filterQuery = `${filterQuery}${ele?.field}=${ele?.term}&`;
          });
      }
      if (deepFilter && deepFilter.length > 0) {
        filterQuery = `${filterQuery}deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}&`;
      }

      return { query: `?${filterQuery}`, deepFilter: newDeepFilter };
    },
    [deepFilters, filterByIds, filterTerm, filters, limit, page, resourceColumns, resourceStartCase, search, sorting]
  );

  const fetchResourceData = useCallback(
    (deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
      setShowGrid(true);

      let { query, deepFilter } = getFilter(false, deepFiltersP, filterByIdsP);
      setDeepFilters(deepFilter);

      if (cancelTokenSource) {
        cancelTokenSource.cancel();
      }
      cancelTokenSource = axios.CancelToken.source();
      dispatch({ type: 'loading', loading: true });

      let api = `/report${routes[resourceCamelCase].path}${query}`;
      if (resourceCamelCase === 'quotes') {
        api = `/report/quote-builder/${query}`;
      } else {
        api = `/report${routes[resourceCamelCase].path}${query}`;
      }

      axiosInstance()
        .get(api, {
          cancelToken: cancelTokenSource?.token
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
    [dispatch, getFilter, resourceCamelCase, toastConfig]
  );

  const getApi = () => {
    if (!columns) return;
    let newColumns = columns?.map((col) => col.accessor);
    if (!isEmpty(visibleColumns) && isObject(visibleColumns)) {
      newColumns = [];
      for (const [key, value] of Object.entries(visibleColumns)) {
        if (value) {
          newColumns.push(key);
        }
      }
    }
    let { query: filterQuery } = getFilter(true);
    let api = null;
    if (resourceCamelCase === 'quotes') {
      api = `/report/quote-builder/export?exportColumn=${JSON.stringify(newColumns)}&${filterQuery}`;
    } else {
      api = `/report${routes[resourceCamelCase].path}/export?exportColumn=${JSON.stringify(newColumns)}&${filterQuery}`;
    }
    return api;
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, showGrid]);

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
            <AsynImportExportMenu
              resource={sidebarResource[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
              subResource={'report'}
              permissions={permissions[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
              module={''}
              api={getApi()}
              afterImportCompleted={() => {}}
              onlyExport={true}
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
            />
          }
          height={'calc(100vh - 270px)'}
          columns={columns}
          state={state}
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
          resource={sidebarResource[resourceCamelCase]}
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
