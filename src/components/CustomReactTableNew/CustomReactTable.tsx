import { Box, useMediaQuery } from '@material-ui/core';
import {
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import SwipableListForMobile from 'src/components/CustomReactTableNew/SwipableListForMobile';
import { flattenArray } from 'src/constants/columns';
import { useDebounce } from 'src/hooks';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';
import { gridPageSizes } from '../../constants/helpers';
import GridHeader from './GridHeader';
import Pagination from './TableComponents/Pagination';
import { fuzzyFilter } from './ReactTableHelpers';
import { defaultColumn } from './TableComponents/TableHelperComponents';
import { useCreateColumns } from './hooks/useCreateColumns';
import type { TInitialState } from './hooks/useTableReducer';
import { childrenProperty, getDataFromLocalStorage, getStickyColumnNames, updateGridHiddenColumns, useSkipper } from './utils';
import TableComponent from './TableComponents/Table';

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
  showArrangeView = true
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
    sorting,
    error,
    showFilteredRecordsOnly,
    colState
  }: TInitialState = state;

  const {
    state: { user }
  }: any = useData();

  const debouncedSearch = useDebounce(search, 500);

  const isMobileView = useMediaQuery('(max-width:768px)');
  const [expandedRefChanged, setExpandedRefChanged] = useState(0);

  function toggleExpandChange() {
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

  const columnFilters = React.useMemo(() => {
    const filters = [];

    for (const key of Object.keys(customFilters)) {
      // in case of complex filters api should porovide filtered value
      if (typeof customFilters[key].filter !== 'string') continue;
      filters.push({ id: key, value: customFilters[key].filter });
    }
    return filters;
  }, [customFilters]);

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [cellValue, setCellValue] = React.useState('');
  const [baseColumns, setBaseColumns] = React.useState(() => newColumns);
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [sortedColumns, setSortedColumns] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState([]);

  // initialize
  useEffect(() => {
    if (JSON.stringify(baseColumns) !== JSON.stringify(newColumns)) {
      setBaseColumns(newColumns);
    }
  }, [newColumns]);

  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  // For Column Order and hidden columns
  useEffect(() => {
    try {
      const stickyColumnNames = getStickyColumnNames({ allColumn: newColumns, expander, hideSelection });

      const hColumns = [];
      for (const col of newColumns) {
        if (col.isVisible === false) {
          hColumns.push(col.id);
        }
      }

      if (reportSave) {
        if (selectedReportView) {
          let colOrder = [...(expander ? ['expander'] : []), ...(!hideSelection ? ['selection'] : [])];
          setHiddenColumns(hColumns);
          setColumnOrder(colOrder);
          dispatch({ type: 'updateColumnState', colState: selectedReportView?.columnState });
        } else {
          setColumnOrder(newColumns.map((m) => m?.id ?? m?.accessor));
        }
      } else {
        let gridMetaData = getDataFromLocalStorage();
        if (gridMetaData && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
          for (const n of [...gridMetaData[renderedFrom]?.hide]) {
            if (stickyColumnNames.stickyColumns.includes(n) || !n) continue;
            if (n === 'qtyDisplay') hColumns.push('qty');
            if (n === 'qty') hColumns.push('qtyDisplay');
            hColumns.push(n);
          }
          setHiddenColumns(hColumns);
        } else {
          setHiddenColumns(newColumns?.filter((e) => e?.show === false).map((m) => m?.id ?? m?.accessor));
        }
        if (gridMetaData && gridMetaData[renderedFrom]?.order && gridMetaData[renderedFrom]?.order?.length) {
          const colOrder = gridMetaData[renderedFrom]?.order || [];
          let orderIndices = {};
          for (let i = 0; i < colOrder.length; i++) {
            orderIndices[colOrder[i]] = i;
          }
          let orderedArr = [...newColumns].sort((a, b) => orderIndices[a?.id || a?.accessor] - orderIndices[b?.id || b?.accessor]);
          setSortedColumns(returnSortedColumns(newColumns, orderedArr));
          setColumnOrder(orderedArr.map((m) => m?.id ?? m?.accessor));
        } else {
          setSortedColumns(newColumns);
          setColumnOrder(newColumns.map((m) => m?.id ?? m?.accessor));
        }
      }
    } catch (ex) {
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`);
    }
  }, [newColumns, expander, hideSelection, renderedFrom, selectedReportView]);

  function reorder(draggedColumnId: string, targetColumnId: string, columnOrder: string[]) {
    columnOrder.splice(columnOrder.indexOf(targetColumnId), 0, columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string);
    const dragItem = newColumns.find((col) => col?.id === draggedColumnId || col?.accessor === draggedColumnId);
    const hoverItem = newColumns.find((col) => col?.id === targetColumnId || col?.accessor === targetColumnId);

    if (dragItem?.id === 'action' || dragItem?.id === 'selection' || dragItem?.canDrag === false) return;
    if (hoverItem?.id === 'action' || hoverItem?.id === 'selection' || hoverItem?.canDrag === false) return;

    const newBaseColumns = [...baseColumns].sort(
      (a, b) => columnOrder.findIndex((d) => d === a.accessor) - columnOrder.findIndex((d) => d === b.accessor)
    );

    const newcolumnOrderToSave = newBaseColumns
      ?.filter((o) => !['left', 'right']?.includes(o?.sticky) && !['expander', 'selection', 'action']?.includes(o?.id))
      ?.map((o) => o?.id);

    setBaseColumns(newBaseColumns);

    updateGridHiddenColumns({
      renderedFrom,
      user,
      columnOrder: newcolumnOrderToSave
    });

    return [...columnOrder];
  }

  const returnSortedColumns = useCallback((columns, colOrder) => {
    return [...columns].sort((a, b) => colOrder?.findIndex((d) => d === a.id) - colOrder?.findIndex((d) => d === b.id));
  }, []);

  useEffect(() => {
    setSortedColumns(returnSortedColumns(newColumns, columnOrder));
  }, [columnOrder, returnSortedColumns, newColumns]);

  const setSorting = useCallback(
    (getSortBy) => {
      const sortBy: SortingState = getSortBy();

      let tempArray = sorting.map((d) => {
        return { id: d.colId, desc: d.sort === 'asc' ? false : true };
      });

      if (JSON.stringify(sortBy) === JSON.stringify(tempArray)) {
        sortBy?.forEach((v) => {
          dispatch({
            type: 'sort',
            sorting: [{ colId: v.id, sort: 'desc' }],
            loading: isClientSideGrid ? false : true
          });
        });
        return;
      }

      sortBy?.forEach((v) => {
        // reset sorted Column
        if (tempArray.find((t) => t.id === v.id && t.desc)) {
          dispatch({
            type: 'sort',
            sorting: [],
            loading: isClientSideGrid ? false : true
          });
          return;
        }
        // set new sorting Column
        dispatch({
          type: 'sort',
          sorting: [{ colId: v.id, sort: v.desc ? 'desc' : 'asc' }],
          loading: isClientSideGrid ? false : true
        });
      });
    },
    [sorting, isClientSideGrid]
  );

  const getSorting = useMemo(() => {
    let tempArray = sorting.map((d) => {
      return { id: d.colId, desc: d.sort === 'asc' ? false : true };
    });
    return tempArray;
  }, [sorting]);

  const setColumnFilters = (filtersfn) => {
    const MINIMUM_SEARCH_DELAY = 600;

    const filters = filtersfn();

    const debouncedFilterDispatch = debounce((updatedCustomFilters) => {
      dispatch({ type: 'filter', filters: updatedCustomFilters, loading: isClientSideGrid ? false : true });
    }, MINIMUM_SEARCH_DELAY);
    const instantFilterDispatch = (updatedCustomFilters) => {
      dispatch({ type: 'filter', filters: updatedCustomFilters, loading: isClientSideGrid ? false : true });
    };

    setTimeout(() => {
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
        if (isClientSideGrid) {
          instantFilterDispatch(tempResult);
        } else {
          debouncedFilterDispatch(tempResult);
        }
      }
    }, MINIMUM_SEARCH_DELAY);
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

  const submitInput = () => {
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
  };

  const getVisibleColumns = React.useCallback(() => {
    const obj = {};

    for (const col of newColumns) {
      obj[col.id] = !hiddenColumns?.includes(col.id);
    }
    return obj;
  }, [newColumns, hiddenColumns]);

  useEffect(() => {
    return setGlobalFilter(searchQuery);
  }, [searchQuery, setGlobalFilter]);

  const table = useReactTable({
    data,
    columns: newColumns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    autoResetPageIndex,
    initialState: {
      columnVisibility: getVisibleColumns()
    },
    state: {
      expanded,
      columnOrder,
      sorting: getSorting,
      globalFilter: debouncedSearch.trim(),
      columnFilters: columnFilters,
      columnVisibility: getVisibleColumns(),
      rowSelection
    },
    // flags
    enableExpanding: expander,
    enableRowSelection: !hideSelection,
    enableHiding: true,
    enablePinning: true,
    enableFilters: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',

    // custom functions
    globalFilterFn: fuzzyFilter,
    defaultColumn: defaultColumn,

    // state setter
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,

    // accessors
    getRowId: (row) => row._id,
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
    if (!expander) return limit;
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
  }, [table, limit, expandedRefChanged, isAllRowsExpanded]);

  useEffect(() => {
    table.setPageSize(paginationLimit);
    if (!isClientSideGrid) return;
    table.setPageIndex(page);
  }, [isClientSideGrid, limit, page, table, data, paginationLimit]);

  const { rows } = table.getRowModel();

  // For row selection
  useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection);

    const currentPageSelectedRows = table.getSelectedRowModel().flatRows.map((d) => {
      const { subRows, ...rest } = d.original;
      return { ...rest };
    });
    const totalSelectedRows = [...currentPageSelectedRows, ...selectedRecords];

    const newData = [];
    for (const rowId of selectedRowIds) {
      const data = totalSelectedRows.find((d) => d._id === rowId);
      newData.push(data);
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
      for (const row of rows) {
        if (selectedRowIds.includes(row.original._id) && !row.getIsSelected()) {
          row.toggleSelected(true);
        }
      }
    }
  }, [selectedRecords.length]);

  return (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
      <div className="react-table-v8">
        <div className="table-container-v1" style={{ position: 'relative' }}>
          <GridHeader
            resource={resource}
            dispatch={dispatch}
            baseColumns={baseColumns}
            customFilters={customFilters}
            renderedFrom={renderedFrom}
            showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch}
            selectedRecords={selectedRecords}
            hideSelection={hideSelection}
            showFilters={showFilters}
            table={table}
            showArrangeView={showArrangeView}
            newColumns={newColumns}
            refreshGrid={refreshGrid}
            setHiddenColumns={setHiddenColumns}
            loading={loading}
            reportSave={reportSave}
            setColumnOrder={setColumnOrder}
            setSelectedReportView={setSelectedReportView}
            selectedReportView={selectedReportView}
          />
          {!isMobileView && (
            <div className="relative">
              {!loading && !error && rows.length === 0 && (
                <>
                  <Box
                    style={{ height: `calc(${height ?? '100%'} - 60px)` }}
                    className="w-full h-full absolute inset-0 top-[46px] flex justify-center items-center -z-10"
                  >
                    <div className=" px-10 py-5 rounded-lg text-center">
                      <p>No data found</p>
                    </div>
                  </Box>
                </>
              )}
              <TableComponent
                virtualization={virtualization}
                {...{
                  state,
                  setWholeRowsCellColor,
                  table,
                  dispatch,
                  setCellValue,
                  submitInput,
                  cellValue,
                  resetField,
                  isClientSideGrid,
                  reorder,
                  loading,
                  error,
                  height
                }}
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
          {(!isClientSideGrid || data.length > 25) && (
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
