import { useMediaQuery } from '@material-ui/core';
import {
  ExpandedState,
  Row,
  SortingState,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useData } from 'src/StateProvider/Provider';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import SwipableListForMobile from 'src/components/CustomReactTable/SwipableListForMobile';
import { flattenArray } from 'src/constants/columns';
import { useDebounce } from 'src/hooks';
import { gridPageSizes } from '../../constants/helpers';
import GridHeader from './GridHeader';
import { fuzzyFilter, serverFilter } from './ReactTableHelpers';
import Pagination from './TableComponents/Pagination';
import TableComponent from './TableComponents/Table';
import { useCreateColumns } from './hooks/useCreateColumns';
import type { TInitialState } from './hooks/useTableReducer';
import { childrenProperty, getStickyColumnNames, getUniqueDataByKey, updateGridHiddenColumns, useSkipper } from './utils';

const CustomReactTable = ({
  columns,
  onSelect = null,
  setWholeRowsCellColor = null,
  height = '100%',
  hideSelection = false,
  renderedFrom,
  isClientSideGrid = false,
  expander = false,
  refreshGrid = null,
  dispatch,
  state,
  fetchChildAttachment = null,
  showOnlyShowFilteredRecordSwitch = false,
  showFilters = false,
  resource = null,
  onSaveEdit = null,
  hideAction = false,
  selectedReportView = null,
  setSelectedReportView = null,
  reportSave = false,
  virtualization = false,
  showArrangeView = true,
  exportTable = false
}) => {
  const {
    currentEditingCellPosition,
    dataRows: data,
    rowCount,
    selectedRecords,
    loading,
    page,
    limit,
    search,
    filters: customFilters,
    error,
    visibleColumns,
    columnOrder
  }: TInitialState = state;

  const {
    state: { user }
  }: any = useData();

  const debouncedSearch = useDebounce(search, 500);

  const isMobileView = useMediaQuery('(max-width:768px)');
  const [expandedRefChanged, setExpandedRefChanged] = useState(0);

  function toggleExpandChange() {
    if (isMobileView) return;
    setExpandedRefChanged((prev) => {
      return prev === 10 ? 0 : (prev += 1);
    });
  }

  const newColumns = useCreateColumns({
    columns,
    expander,
    fetchChildAttachment,
    hideSelection,
    hideAction,
    dispatch,
    state,
    isClientSideGrid,
    toggleExpandChange
  });

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [cellValue, setCellValue] = React.useState('');
  const [baseColumns, setBaseColumns] = React.useState(() => newColumns);
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [sortedColumns, setSortedColumns] = useState([]);
  const [getsorting, setSorting] = useState([]);

  // initialize
  useEffect(() => {
    if (JSON.stringify(baseColumns) !== JSON.stringify(newColumns)) {
      setBaseColumns(newColumns);
    }
  }, [newColumns]);

  // Column DND
  function reorder(draggedColumnId: string, targetColumnId: string, columnOrder: string[]) {
    const newColumnOrder = columnOrder.toSpliced(
      columnOrder.indexOf(targetColumnId),
      0,
      columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
    );
    const dragItem = newColumns.find((col) => col?.id === draggedColumnId || col?.accessor === draggedColumnId);

    const stickyColumns = getStickyColumnNames({ allColumn: newColumns, expander, hideSelection }).stickyColumns;

    if (stickyColumns.includes(dragItem?.id)) return;

    const newBaseColumns = [...baseColumns].sort(
      (a, b) => columnOrder.findIndex((d) => d === a.accessor) - columnOrder.findIndex((d) => d === b.accessor)
    );

    const newcolumnOrderToSave = newBaseColumns?.filter((o) => !stickyColumns?.includes(o?.id))?.map((o) => o?.id);

    updateGridHiddenColumns({
      renderedFrom,
      user,
      columnOrder: newcolumnOrderToSave
    });
    dispatch({ type: 'setColumnOrder', columnOrder: newColumnOrder });
    return [...columnOrder];
  }

  const returnSortedColumns = useCallback((columns, colOrder) => {
    return [...columns].sort((a, b) => colOrder?.findIndex((d) => d === a.id) - colOrder?.findIndex((d) => d === b.id));
  }, []);

  useEffect(() => {
    setSortedColumns(returnSortedColumns(newColumns, columnOrder));
  }, [columnOrder, returnSortedColumns, newColumns]);

  const columnFilters = React.useMemo(() => {
    const filters = [];
    for (const key of Object.keys(customFilters)) {
      if (typeof customFilters[key].filter !== 'string') continue;
      filters.push({ id: key, value: customFilters[key].filter });
    }
    return filters;
  }, [customFilters]);

  const setColumnFilters = (filtersfn) => {
    if (!isClientSideGrid) return;
    const filters = filtersfn();
    let tempArray = Object.keys(customFilters).map((key, i) => {
      return { id: key, value: customFilters[key].filter };
    });
    if (JSON.stringify(filters) !== JSON.stringify(tempArray)) {
      var tempResult = {};
      filters?.forEach((v) => {
        if (v.value && v.value !== '') {
          tempResult[v.id] = { filter: v.value };
        } else {
          //this is for handling condition where the customFilters has a multiselect type field and we type something in some other filter
          if (customFilters[v.id] && customFilters[v.id].operator && customFilters[v.id].condition1) {
            tempResult[v.id] = customFilters[v.id];
          }
        }
      });
      dispatch({ type: 'filter', filters: tempResult, loading: isClientSideGrid ? false : true });
    }
  };

  const setGlobalFilter = useCallback(
    (value: string) => {
      let timer: NodeJS.Timeout;
      if (value) {
        timer = setTimeout(() => {
          let query = value?.trim();
          if (query !== '') {
            dispatch({ type: 'search', search: query, loading: isClientSideGrid ? false : true });
          }
        }, 500);
      } else {
        timer = setTimeout(() => {
          dispatch({ type: 'search', search: '', loading: false });
        }, 500);
      }
      return () => clearTimeout(timer);
    },
    [isClientSideGrid, dispatch]
  );

  // Editing cell functions
  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  const submitInput = useCallback(() => {
    skipAutoResetPageIndex();
    if (!currentEditingCellPosition) return;
    const updatedData = flattenArray(data)?.find((row) => row?._id === currentEditingCellPosition.rowId);
    updatedData[currentEditingCellPosition.columnName] = cellValue;
    const inputField = { [`${currentEditingCellPosition.columnName}`]: cellValue };

    if (onSaveEdit && ![undefined, null].includes(cellValue)) {
      onSaveEdit(inputField, updatedData);
    }
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  }, [cellValue, currentEditingCellPosition, data, onSaveEdit]);

  useEffect(() => {
    return setGlobalFilter(searchQuery);
  }, [searchQuery, setGlobalFilter]);

  const table = useReactTable({
    data: data || [],
    columns: newColumns,
    filterFns: {
      fuzzy: isClientSideGrid ? fuzzyFilter : serverFilter
    },
    autoResetPageIndex,
    initialState: {
      columnVisibility: visibleColumns
    },
    state: {
      expanded,
      columnOrder,
      sorting: getsorting,
      globalFilter: isClientSideGrid ? debouncedSearch.trim() : '',
      columnFilters: isClientSideGrid ? columnFilters : [],
      columnVisibility: visibleColumns,
      rowSelection
    },
    // flags
    enableExpanding: expander,
    enableRowSelection: (row: Row<any>) => !hideSelection && row.original.hideSelection !== true,
    enableHiding: true,
    enablePinning: true,
    enableFilters: true,
    enableColumnResizing: true,
    filterFromLeafRows: true,
    columnResizeMode: 'onChange',

    // custom functions
    globalFilterFn: isClientSideGrid ? fuzzyFilter : serverFilter,

    // state setter
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,

    // accessors
    getRowId: (row) => `${row._id}_${row?.index || 0}`,
    getSubRows: (row) => row[childrenProperty],

    // table models
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  });

  const isAllRowsExpanded = table.getIsAllRowsExpanded();

  const paginationLimit = useMemo(() => {
    if (!expander || isMobileView) return limit;
    if (isAllRowsExpanded) {
      if (isClientSideGrid) return table.getRowModel().flatRows.length;
      else return table.getExpandedRowModel().flatRows.length;
    }
    const getRowCount = (list: Row<any>[], limit) => {
      let rowLength = limit;
      for (let i = 0; i < limit; i++) {
        const item = list[i];
        if (!item) return rowLength;
        if (!item.subRows.length || !item.getIsExpanded()) continue;
        rowLength += getRowCount(item.subRows, item.subRows.length);
      }
      return rowLength;
    };
    let length = getRowCount(table.getExpandedRowModel().rows, limit);
    return Math.max(length, limit);
  }, [table, limit, expandedRefChanged, isAllRowsExpanded, isClientSideGrid, expander, isMobileView]);

  useEffect(() => {
    table.setPageSize(paginationLimit);
    if (!isClientSideGrid) return;
    table.setPageIndex(page);
  }, [isClientSideGrid, limit, page, table, data, paginationLimit]);

  const { rows } = table.getRowModel();
  const { flatRows: expandedRows } = table.getExpandedRowModel();

  // For row selection
  useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection);
    const currentPageSelectedRows = table.getSelectedRowModel().flatRows.map((d) => {
      const { subRows, ...rest } = d.original;
      return { ...rest };
    });
    const testData = getUniqueDataByKey([...currentPageSelectedRows, ...selectedRecords]);
    const newData = [];
    for (const data of testData) {
      if (selectedRowIds.includes(`${data._id}_${data?.index || 0}`)) newData.push(data);
    }

    if (onSelect) onSelect(newData);
    dispatch({
      type: 'selection',
      selectedRecords: newData
    });
  }, [rowSelection]);

  // parent selection effects
  useEffect(() => {
    if (selectedRecords.length === 0) {
      table.resetRowSelection();
    }
  }, [selectedRecords.length, table]);
  useEffect(() => {
    if (selectedRecords.length !== Object.keys(rowSelection).length) {
      const selectedRowIds = selectedRecords.map((d) => d._id);
      for (const row of expandedRows) {
        if (selectedRowIds.includes(row.original._id) && !row.getIsSelected()) {
          row.toggleSelected(true);
        }
      }
    }
  }, [selectedRecords.length]);

  // sorging effect
  useEffect(() => {
    const sortBy: SortingState = getsorting;

    // reset
    if (sortBy.length === 0) {
      dispatch({
        type: 'sort',
        sorting: [],
        loading: isClientSideGrid ? false : true
      });
    }
    // set new sorting Column
    sortBy?.forEach((v) => {
      dispatch({
        type: 'sort',
        sorting: [{ colId: v.id, sort: v.desc ? 'desc' : 'asc' }],
        loading: isClientSideGrid ? false : true
      });
    });
  }, [getsorting, isClientSideGrid, dispatch]);

  return (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
      <div className="react-table-v8 ">
        <div className="table-container-v1" style={{ position: 'relative' }}>
          <GridHeader
            isClientSideGrid={isClientSideGrid}
            resource={resource}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch}
            hideSelection={hideSelection}
            showFilters={showFilters}
            table={table}
            showArrangeView={showArrangeView}
            newColumns={newColumns}
            refreshGrid={refreshGrid}
            reportSave={reportSave}
            setSelectedReportView={setSelectedReportView}
            selectedReportView={selectedReportView}
            state={state}
            expander={expander}
            exportTable={exportTable}
          />
          {!isMobileView && (
            <div className="relative">
              <TableComponent
                virtualization={virtualization}
                state={state}
                setWholeRowsCellColor={setWholeRowsCellColor}
                table={table}
                dispatch={dispatch}
                setCellValue={setCellValue}
                submitInput={submitInput}
                cellValue={cellValue}
                resetField={resetField}
                isClientSideGrid={isClientSideGrid}
                reorder={reorder}
                loading={loading}
                error={error}
                height={height}
              />
            </div>
          )}
          {isMobileView && rows ? (
            <SwipableListForMobile
              table={table}
              key={page}
              allColumns={sortedColumns}
              allowSelection={!hideSelection}
              dataRows={rows}
              dispatch={dispatch}
              loading={loading}
              expander={expander}
              backgroundColorClass={setWholeRowsCellColor}
              renderedFrom={renderedFrom}
              state={state}
              submitInput={submitInput}
              cellValue={cellValue}
              setCellValue={setCellValue}
              isClientSideGrid={isClientSideGrid}
            />
          ) : null}
          {(!isClientSideGrid || data?.length > 25) && (
            <Pagination
              count={isClientSideGrid ? table.getExpandedRowModel().rows.length : rowCount ?? data.length}
              page={page}
              onPageChange={(event, newPage) => {
                dispatch({ type: 'pageChange', page: newPage });
                if (!isClientSideGrid || rowCount <= limit || data.length <= limit) return;
                table.setPageIndex(newPage);
              }}
              rowsPerPage={limit}
              onRowsPerPageChange={(event, value) => {
                dispatch({ type: 'pageSizeChange', limit: value, loading: isClientSideGrid ? false : true });
                if (!isClientSideGrid || rowCount <= limit || data.length <= limit) return;
                table.setPageSize(value);
              }}
              rowsPerPageOptions={gridPageSizes}
              disabled={loading}
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
};
export default CustomReactTable;
