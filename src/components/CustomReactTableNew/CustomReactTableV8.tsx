import { Box, Button, CircularProgress, TableBody, TableHead, TableRow, useMediaQuery } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';
import { Error } from '@material-ui/icons';
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
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { BiFilterAlt } from 'react-icons/bi';
import SwipableListForMobile from 'src/components/CustomReactTableNew/SwipableListForMobile';
import { flattenArray } from 'src/constants/columns';
import { useDebounce } from 'src/hooks';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';
import { gridPageSizes } from '../../constants/helpers';
import HtmlTooltip from '../CustomTooltipTitle';
import ArrangeViewButton from './helperComponents/ArrangeViewButton';
import CustomReactTableHeaderOptions from './helperComponents/CustomReactTableHeaderOptions';
import GridFilter from './helperComponents/Filters';
import GridHeader from './helperComponents/GridHeader';
import Pagination from './TableComponents/Pagination';
import { fuzzyFilter } from './ReactTableHelpers';
import { CellRenderer, defaultColumn, DraggableHeader, IndeterminateCheckbox } from './TableComponents/TableHelperComponents';
import { useCreateColumns } from './hooks/useCreateColumns';
import type { TInitialState } from './hooks/useTableReducer';
import { childrenProperty, getDataFromLocalStorage, getStickyColumnNames, updateGridHiddenColumns, useSkipper } from './utils';

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
  hideAction = false
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
    error
  }: TInitialState = state;
  const {
    state: { user }
  }: any = useData();

  const debouncedSearch = useDebounce(search, 500);

  const isMobileView = useMediaQuery('(max-width:768px)');
  const newColumns = useCreateColumns({ columns, expander, fetchChildAttachment, hideSelection, dispatch, state });

  const columnFilters = React.useMemo(() => {
    let tempArray = Object.keys(customFilters).map((key, i) => {
      return { id: key, value: customFilters[key].filter };
    });
    return tempArray;
  }, [customFilters]);

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [cellValue, setCellValue] = React.useState('');
  const [baseColumns, setBaseColumns] = React.useState(() => newColumns);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [currentFomValue, setCurrentFomValue] = useState({});
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

  // For row selection
  useEffect(() => {
    let flatSelectedData = [];
    Object.keys(rowSelection).forEach((key) => {
      const splittedArray = key.split('.');
      if (splittedArray.length === 0) {
        const { subRows, ...rest } = data[key];
        flatSelectedData.push({ ...rest });
      } else if (rowSelection[key]) {
        let dataToStore = null;
        splittedArray.forEach((f, index) => {
          if (index === 0) {
            dataToStore = { ...data[f] };
          } else {
            dataToStore = { ...dataToStore['subRows'][f] };
          }
        });
        const { subRows, ...rest } = dataToStore;
        flatSelectedData.push({ ...rest });
      }
    });

    const includedRow: any = [];
    const notIncludedRow: any = [];

    selectedRecords.forEach((row) => {
      if (data.find((d) => d.id === row.id)) {
        includedRow.push(row);
      } else {
        notIncludedRow.push(row);
      }
    });

    if (onSelect) onSelect([...notIncludedRow, ...flatSelectedData]);
    dispatch({
      type: 'selection',
      selectedRecords: [...notIncludedRow, ...flatSelectedData]
    });
  }, [rowSelection, renderedFrom]);

  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };
  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  // For Column Order
  useEffect(() => {
    try {
      const stickyColumnNames = getStickyColumnNames({ allColumn: newColumns, expander, hideSelection });
      let gridMetaData = getDataFromLocalStorage();
      if (gridMetaData && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
        setHiddenColumns(gridMetaData[renderedFrom]?.hide || []);
      }
      if (gridMetaData && gridMetaData[renderedFrom]?.order && gridMetaData[renderedFrom]?.order?.length) {
        const colOrder = [...stickyColumnNames.left, ...gridMetaData[renderedFrom]?.order, ...stickyColumnNames.right];
        setColumnOrder(colOrder);
        setSortedColumns(returnSortedColumns(newColumns, colOrder));
      } else {
        setSortedColumns(newColumns);
        setColumnOrder(newColumns.map((m) => m?.id ?? m?.accessor));
      }
    } catch (ex) {
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`);
    }
  }, [newColumns, expander, hideSelection, renderedFrom]);

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
      ?.filter((o) => o?.sticky === undefined && !['expander', 'selection', 'action']?.includes(o?.id))
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
      if (isClientSideGrid) return;

      let tempArray = sorting.map((d) => {
        return { id: d.colId, desc: d.sort === 'asc' ? false : true };
      });

      if (JSON.stringify(sortBy) === JSON.stringify(tempArray)) return;

      sortBy?.forEach((v) => {
        // reset sorted Column
        if (tempArray.find((t) => t.id === v.id && t.desc)) {
          dispatch({
            type: 'sort',
            sorting: []
          });
          return;
        }
        // set new sorting Column
        dispatch({
          type: 'sort',
          sorting: [{ colId: v.id, sort: v.desc ? 'desc' : 'asc' }]
        });
      });
    },
    [sorting]
  );

  const getSorting = useMemo(() => {
    let tempArray = sorting.map((d) => {
      return { id: d.colId, desc: d.sort === 'asc' ? false : true };
    });
    return tempArray;
  }, [sorting]);

  const setColumnFilters = (filters) => {
    const MINIMUM_SEARCH_DELAY = 600;

    const debouncedFilterDispatch = debounce((updatedCustomFilters) => {
      dispatch({ type: 'filter', filters: updatedCustomFilters });
    }, MINIMUM_SEARCH_DELAY);

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
        if (!isClientSideGrid) debouncedFilterDispatch(tempResult);
      }
    }, MINIMUM_SEARCH_DELAY);
  };

  const setGlobalFilter = useCallback(
    (value: string) => {
      let timer: NodeJS.Timeout;
      if (!isClientSideGrid) {
        if (value) {
          timer = setTimeout(() => {
            let query = value?.trim();
            if (query !== '') {
              dispatch({ type: 'search', search: query });
            }
          }, 500);
        } else {
          timer = setTimeout(() => {
            dispatch({ type: 'search', search: '' });
            dispatch({ type: 'loading', loading: false });
          }, 500);
        }
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
    defaultColumn: defaultColumn,
    columnResizeMode: 'onChange',
    enableHiding: true,
    enableExpanding: expander,
    enableRowSelection: !hideSelection,
    enablePinning: true,
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
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    getSubRows: (row) => row[childrenProperty],
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  });

  useEffect(() => {
    table.setPageSize(limit);
    if (!isClientSideGrid) return;
    table.setPageIndex(page);
  }, [isClientSideGrid, limit, page, table]);

  const { rows } = table.getRowModel();

  return (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
      <div className="react-table-v8">
        <div className="table-container-v1" style={{ position: 'relative' }}>
          <GridHeader
            refreshGrid={refreshGrid}
            loading={loading}
            buttons={
              <>
                {showFilters && (
                  <HtmlTooltip title="Apply Filters" placement="top" arrow>
                    <Button
                      style={{ marginRight: '8px', color: '#424242' }}
                      startIcon={<BiFilterAlt />}
                      size={'small'}
                      variant="outlined"
                      className="btn-outline-v1 light "
                      onClick={handleFilterOpen}
                    >
                      Filter
                    </Button>
                  </HtmlTooltip>
                )}
                <ArrangeViewButton
                  columns={newColumns}
                  loading={loading}
                  renderedFrom={renderedFrom}
                  setHiddenColumns={setHiddenColumns}
                  // getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
                  defaultColumns={newColumns}
                  setColumnOrder={setColumnOrder}
                />
              </>
            }
            startButtons={
              isMobileView &&
              !hideSelection && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer ml-[13px]">
                    <IndeterminateCheckbox
                      {...{
                        checked: table.getIsAllRowsSelected(),
                        indeterminate: table.getIsSomeRowsSelected(),
                        onChange: table.getToggleAllRowsSelectedHandler()
                      }}
                      className="mx-auto text-center [&_svg]:[font-size:20px] "
                    />
                    <span>Select All</span>
                  </label>
                </>
              )
            }
          >
            <CustomReactTableHeaderOptions
              columns={baseColumns}
              customFilters={customFilters}
              renderedFrom={renderedFrom}
              dispatchTable={dispatch}
              showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch && !hideSelection}
              selectedRecords={selectedRecords?.length}
              showFilters={showFilters}
              handleFilterOpen={handleFilterOpen}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              currentFomValue={currentFomValue}
              setCurrentFomValue={setCurrentFomValue}
            />
            {/* Select All For Mobile */}

            {isFilterOpen && (
              <GridFilter
                resource={resource}
                customFilters={customFilters}
                handleClose={handleFilterClose}
                setSelectedFilter={setSelectedFilter}
                selectedFilter={selectedFilter}
                currentFomValue={currentFomValue}
                setCurrentFomValue={setCurrentFomValue}
                dispatch={dispatch}
              />
            )}
          </GridHeader>
          {!isMobileView && (
            <>
              <div
                style={{
                  display: 'block',
                  overflow: !loading && !error && rows.length === 0 ? 'hidden' : 'auto',
                  height: height ?? '100%'
                }}
                className="border"
              >
                {(loading || error) && (
                  <Box className="bg-[rgba(255,255,255,0.2)] dark:bg-[rgba(0,0,0,0.1)] w-full h-full z-50 absolute inset-0 flex justify-center items-center">
                    <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg text-center shadow-md">
                      {error ? (
                        <>
                          <Error className="mx-auto mb-2" />
                          <p>Something Went Wrong</p>
                        </>
                      ) : loading ? (
                        <>
                          <CircularProgress />
                          <p>Loading...</p>
                        </>
                      ) : null}
                    </div>
                  </Box>
                )}
                <div
                  className="relative"
                  style={{
                    position: 'relative'
                  }}
                >
                  {!loading && !error && rows.length === 0 && (
                    <>
                      <Box
                        style={{ height: `calc(${height ?? '100%'} - 60px)` }}
                        className="w-full h-full absolute inset-0 top-[46px] flex justify-center items-center"
                      >
                        <div className=" px-10 py-5 rounded-lg text-center">
                          <p>No data found</p>
                        </div>
                      </Box>
                    </>
                  )}
                  <MaUTable size="small" className="tableWrap table sticky">
                    <TableHead
                      style={{ overflowY: 'auto', overflowX: 'hidden' }}
                      className="header sticky top-0 bg-[var(--dark-primary,_white)] z-[11]"
                    >
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow className="tr sticky top-0 bg-[var(--dark-primary,_white)] z-[11] " key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <DraggableHeader
                                table={table}
                                customFilters={customFilters}
                                dispatch={dispatch}
                                isClientSideGrid={isClientSideGrid}
                                reorder={reorder}
                                header={header}
                                key={header.id}
                              />
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableHead>
                    <TableBody
                      style={{
                        overflow: 'hidden'
                      }}
                      className="body relative"
                    >
                      {rows.map((row) => {
                        return (
                          <TableRow key={row.id} className={`tr`}>
                            {row.getVisibleCells().map((cell, index) => {
                              return (
                                <CellRenderer
                                  key={cell.id}
                                  {...{
                                    state,
                                    cell,
                                    setWholeRowsCellColor,
                                    row,
                                    index,
                                    table,
                                    dispatch,
                                    setCellValue,
                                    submitInput,
                                    cellValue,
                                    resetField
                                  }}
                                />
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      {/* {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
                        const row = rows[virtualRow.index] as Row<any>;
                        return (
                          <TableRow
                            key={row.id}
                            className={`tr  d-flex`}
                            style={{
                              display: 'flex',
                              maxHeight: `${virtualRow.size}px`,
                              height: `${virtualRow.size}px`,
                              position: 'absolute',
                              width: '100%',
                              top: 0,
                              left: 0,
                              transform: `translateY(${virtualRow.start}px)`
                            }}
                          >
                            {columnVirtualizer.getVirtualItems().map((virtualCell, index) => {
                              const cell = row.getVisibleCells()[virtualCell.index];
                              return (
                                <CellRenderer
                                  key={cell.id}
                                  styles={{
                                    position: 'absolute',
                                    top: 0,
                                    left: `${virtualCell.start}px`,
                                    width: `${virtualCell.size}px`,
                                    height: `${virtualRow.size}px`
                                    // transform: `translateX(${virtualCell.start}px) translateY(${virtualRow.start}px)`
                                  }}
                                  {...{
                                    state,
                                    cell,
                                    setWholeRowsCellColor,
                                    row,
                                    index,
                                    table,
                                    dispatch,
                                    setCellValue,
                                    submitInput,
                                    cellValue,
                                    resetField
                                  }}
                                />
                              );
                            })}
                           
                          </TableRow>
                        );
                      })} */}
                    </TableBody>
                  </MaUTable>
                </div>
              </div>
            </>
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

          {!isClientSideGrid && (
            <Pagination
              count={rowCount}
              page={page}
              onPageChange={(event, newPage) => {
                table.setPageIndex(newPage);
                dispatch({ type: 'pageChange', page: newPage });
              }}
              rowsPerPage={limit}
              onRowsPerPageChange={(event, value) => {
                dispatch({ type: 'pageSizeChange', limit: value });
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
