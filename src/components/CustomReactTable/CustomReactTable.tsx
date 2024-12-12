import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
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
import moment from 'moment';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import SwipableListForMobile from 'src/components/CustomReactTable/SwipableListForMobile';
import { flattenArray } from 'src/constants/columns';
import { useDebounce, useDndSensors } from 'src/hooks';
import xlsx from 'xlsx-js-style';
import { dateTimeFormat, gridPageSizes } from '../../constants/helpers';
import GridHeader from './GridHeader';
import { fuzzyFilter, serverFilter } from './ReactTableHelpers';
import Pagination from './TableComponents/Pagination';
import TableComponent from './TableComponents/Table';
import { DraggableHeader } from './TableComponents/TableHelperComponents';
import { useCreateColumns } from './hooks/useCreateColumns';
import type { TInitialState } from './hooks/useTableReducer';
import {
  adjustSizes,
  camelCaseToWords,
  childrenProperty,
  extractLastNumberFromDataRange,
  fitToColumn,
  getExcelColumnNameFromRange,
  getUniqueRows,
  useSkipper
} from './utils';

const handleApplySavedSize = (columns, columnSavedSizes) => {
  if (columnSavedSizes && Object.keys(columnSavedSizes).length) {
    const newData = columns?.map((column) => {
      if (columnSavedSizes[column.id]) {
        column.size = columnSavedSizes[column.id];
      } else {
        column.size = column.width || 200;
      }
      return column;
    });
    return newData;
  } else {
    return columns?.map((c) => ({ ...c, size: c.width }));
  }
};

let exportTimeout;

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
  virtualization = false,
  showArrangeView = true,
  hideExportTable = false,
  showOnlyMobileView = false,
  onRowClick = null,
  enableGlobalSearch = true,
  pagination = true,
  topLeftSlot = null
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
    error,
    visibleColumns,
    columnOrder,
    sorting,
    sizes: columnSavedSizes
  }: TInitialState = state;

  const debouncedSearch = useDebounce(search, 500);

  const isMobileView = useMediaQuery('(max-width:768px)');
  const [expandedRefChanged, setExpandedRefChanged] = useState(0);
  const [newColumns, setNewColumns] = useState([]);

  function toggleExpandChange() {
    if (isMobileView) return;
    setExpandedRefChanged((prev) => {
      return prev === 10 ? 0 : (prev += 1);
    });
  }

  const hookColumns = useCreateColumns({
    columns,
    expander,
    fetchChildAttachment,
    hideSelection,
    hideAction,
    dispatch,
    state,
    isClientSideGrid,
    toggleExpandChange,
    resource,
    renderedFrom
  });

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [cellValue, setCellValue] = React.useState('');
  const [baseColumns, setBaseColumns] = React.useState(() => newColumns);
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [sortedColumns, setSortedColumns] = useState([]);
  const [getsorting, setSorting] = useState([]);
  const [exportTableView, setExportTableView] = useState(false);
  const [activeHeader, setActiveHeader] = useState(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // initialize
  useEffect(() => {
    if (JSON.stringify(baseColumns) !== JSON.stringify(newColumns)) {
      setBaseColumns(newColumns);
    }
  }, [newColumns]);

  // Column DND
  function reorder(draggedColumnId: string, targetColumnId: string) {
    const newColumnOrder = columnOrder.toSpliced(
      columnOrder.indexOf(targetColumnId),
      0,
      columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
    );
    // const stickyColumns = getStickyColumnNames({ allColumn: newColumns, expander, hideSelection }).stickyColumns;
    // const newcolumnOrderToSave = newColumnOrder?.filter((o) => !stickyColumns?.includes(o));

    dispatch({ type: 'setColumnOrder', columnOrder: newColumnOrder });
    table.setColumnOrder(newColumnOrder);
    return [...columnOrder];
  }

  const returnSortedColumns = useCallback((columns, colOrder) => {
    return [...columns].sort((a, b) => colOrder?.findIndex((d) => d === a.id) - colOrder?.findIndex((d) => d === b.id));
  }, []);

  useEffect(() => {
    setSortedColumns(returnSortedColumns(newColumns, columnOrder));
  }, [columnOrder, returnSortedColumns, newColumns]);

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
    if (enableGlobalSearch) {
      return setGlobalFilter(searchQuery);
    }
  }, [searchQuery, setGlobalFilter, enableGlobalSearch]);

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
      columnVisibility: visibleColumns,
      rowSelection
    },
    // flags
    autoResetAll: false,
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
    onGlobalFilterChange: setGlobalFilter,

    // accessors
    getRowId: (row) => `${row._id}_${row?.index || 0}`,
    getSubRows: (row) => row[childrenProperty],

    // table models
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : null,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  });

  useLayoutEffect(() => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const { clientWidth } = container;
      const updatedColumns = adjustSizes(handleApplySavedSize(hookColumns ? [...hookColumns] : [], columnSavedSizes), visibleColumns, clientWidth);

      if (updatedColumns) {
        setNewColumns(updatedColumns);
        setTimeout(() => {
          table.resetHeaderSizeInfo();
          table.resetColumnSizing();
        }, 100);
      } else {
        setNewColumns([...hookColumns]);
      }
    } else {
      setNewColumns([...hookColumns]);
    }
  }, [visibleColumns, columnSavedSizes, hookColumns, table]);

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
    const testData = getUniqueRows([...currentPageSelectedRows, ...selectedRecords]);
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

  useEffect(() => {
    if (sorting.length === 0 || getsorting.length) return;
    if (sorting[0].sort === 'desc' && getsorting.some((c) => c.id === sorting[0].colId)) return;
    setSorting([{ id: sorting[0].colId, desc: sorting[0].sort === 'desc' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const handleTableExport = () => {
    clearTimeout(exportTimeout);
    setExportTableView(true);
    const { columnVisibility } = table.getState();
    const isFooterPresent = newColumns.some((c) => columnVisibility[c?.id] && typeof c.Footer === 'function');
    exportTimeout = setTimeout(() => {
      if (!tableRef.current) return;
      try {
        const wb = xlsx.utils.book_new();

        // Remove Hidden Elements "data-hide-in-export="true""
        const table = tableRef.current;
        table?.querySelectorAll('[data-hide-in-export="true"]').forEach((e) => {
          if (typeof e?.remove === 'function') e.remove();
        });

        const ws = xlsx.utils.table_to_sheet(table, { cellStyles: true, cellDates: true, raw: true, display: true });

        const columns = getExcelColumnNameFromRange(ws['!ref']);

        const lastRowNumber = extractLastNumberFromDataRange(ws['!ref']);

        for (const col of columns) {
          // For header style
          if (ws[`${col}1`]) {
            const headerRow = ws[`${col}1`];
            if (headerRow) {
              headerRow.s = {
                font: {
                  name: 'Calibri',
                  bold: true
                }
              };
            }
          }
          // For footer style
          if (lastRowNumber && isFooterPresent) {
            const lastRow = ws[`${col}${lastRowNumber}`];
            if (lastRow) {
              lastRow.s = {
                font: {
                  name: 'Calibri',
                  bold: true
                }
              };
            }
          }
        }

        // For redirecting to the domain and cell style for links
        const keys = Object.keys(ws);
        // const origin = window?.location?.origin;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (key.includes('!')) continue;
          if (ws[key].hasOwnProperty('l')) {
            delete ws[key].l; // this will remove link styles

            //! this section will style links
            // const data = ws[key];
            //  data.l.Target = `${origin}${data.l.Target}`;
            //  ws[key].s = {
            //    font: {
            //      name: 'Calibri',
            //      color: { rgb: '171db1' }
            //   }
            //  };
          }
        }

        // set column width to header width
        ws['!cols'] = fitToColumn(columns, ws);

        const name = `${camelCaseToWords(renderedFrom) || 'My Sheet'}-${moment().format(dateTimeFormat)}`;
        xlsx.utils.book_append_sheet(wb, ws, `Page-${(page ?? 0) + 1}`);
        xlsx.writeFile(wb, `${name}.xlsx`);
      } catch (error) {
        console.error(error);
      } finally {
        setExportTableView(false);
      }
    }, 0);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveHeader(null);

    if (!event.over) return;
    if (event.over.data.current.isNotDraggable) return;
    const { active, over } = event;
    if (active.id === over.id) return;
    reorder(active.id as string, over.id as string);
    // table.setColumnOrder(newColumnOrder);
  };
  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveHeader(event.active.data.current.props);
  };

  const sensors = useDndSensors();
  return (
    <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToHorizontalAxis]}>
      {exportTableView && (
        <div className="hidden [&_.hide-in-export]:!hidden [&_.show-in-export]:!block">
          <TableComponent
            ref={tableRef}
            virtualization={false}
            state={state}
            setWholeRowsCellColor={() => ''}
            table={table}
            dispatch={dispatch}
            setCellValue={setCellValue}
            submitInput={submitInput}
            cellValue={cellValue}
            resetField={resetField}
            isClientSideGrid={isClientSideGrid}
            loading={loading}
            exportTableView={true}
            error={error}
            height={height}
            onRowClick={onRowClick}
            resource={resource}
            expander={expander}
            hideSelection={hideSelection}
          />
        </div>
      )}
      <div className="react-table-v8 [&_.show-in-export]:!hidden">
        <div className="table-container-v1" style={{ position: 'relative' }}>
          <GridHeader
            handleTableExport={handleTableExport}
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
            setSelectedReportView={setSelectedReportView}
            selectedReportView={selectedReportView}
            state={state}
            expander={expander}
            hideExportTable={hideExportTable}
            topLeftSlot={topLeftSlot}
          />
          {!isMobileView && !showOnlyMobileView && (
            <div className="relative" ref={tableContainerRef}>
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
                loading={loading}
                error={error}
                height={height}
                onRowClick={onRowClick}
                resource={resource}
                pagination={pagination}
                expander={expander}
                hideSelection={hideSelection}
              />
            </div>
          )}
          {(isMobileView || showOnlyMobileView) && rows ? (
            <SwipableListForMobile
              table={table}
              key={page}
              allColumns={sortedColumns}
              allowSelection={!hideSelection}
              dispatch={dispatch}
              expander={expander}
              backgroundColorClass={setWholeRowsCellColor}
              renderedFrom={renderedFrom}
              state={state}
              submitInput={submitInput}
              cellValue={cellValue}
              setCellValue={setCellValue}
              isClientSideGrid={isClientSideGrid}
              onRowClick={onRowClick}
            />
          ) : null}
          {(!isClientSideGrid || data?.length > 25) && pagination && (
            <Pagination
              count={isClientSideGrid ? table.getExpandedRowModel().rows.length : (rowCount ?? data.length)}
              page={page}
              onPageChange={(event, newPage) => {
                dispatch({ type: 'pageChange', page: newPage });
                if (!isClientSideGrid || rowCount <= limit || data.length <= limit) return;
                table.setPageIndex(newPage);
              }}
              renderedFrom={renderedFrom}
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
      <DragOverlay>
        {activeHeader && (
          <span className="react-table-v8 block max-h-[45px] overflow-hidden [&_.drag-handle]:!cursor-grabbing">
            <DraggableHeader overlayMode={true} {...activeHeader} />
          </span>
        )}
      </DragOverlay>
    </DndContext>
  );
};
export default CustomReactTable;
