import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, CircularProgress, TableBody, TableHead, TableRow } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';
import { Error } from '@material-ui/icons';
import { Row, Table, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { Dispatch, ForwardedRef, forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { TActios, TInitialState } from '../hooks/useTableReducer';
import { getStickyPosition } from '../utils';
import { CellRenderer, DraggableHeader, TColType } from './TableHelperComponents';

const MemoizedCellRenderer = memo(CellRenderer);

type TTableProps = {
  state: TInitialState;
  setWholeRowsCellColor: any;
  dispatch: Dispatch<TActios>;
  table: Table<any>;
  setCellValue: React.Dispatch<React.SetStateAction<string>>;
  submitInput: () => void;
  cellValue: string;
  resetField: () => void;
  isClientSideGrid: boolean;
  loading: boolean;
  error: boolean;
  height?: any;
  exportTableView?: boolean;
  virtualization: boolean;
  onRowClick: (row: Row<any>) => void;
  resource: string;
  pagination?: boolean;
};

const TableComponent = forwardRef(function (
  {
    state,
    setWholeRowsCellColor,
    table,
    dispatch,
    setCellValue,
    submitInput,
    cellValue,
    resetField,
    isClientSideGrid,
    loading,
    error,
    height,
    exportTableView = false,
    virtualization = false,
    onRowClick,
    resource,
    pagination
  }: TTableProps,
  ref: ForwardedRef<HTMLTableElement>
) {
  const { filters: customFilters, initialDataLoaded }: TInitialState = state;
  const columns = table.getAllColumns();
  const { columnVisibility } = table.getState();
  const tableRef = useRef<HTMLTableElement | null>(null);

  useImperativeHandle(
    ref,
    function () {
      return tableRef.current;
    },
    []
  );

  const visibleColumns = useMemo(() => {
    return columns.filter((column) => columnVisibility[column.id]);
  }, [columnVisibility, columns]);

  let rows: Row<any>[];
  if (exportTableView) {
    rows = table.getExpandedRowModel().flatRows;
  } else {
    rows = table.getRowModel().rows;
  }

  // virtualization
  const parentRef = React.useRef();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => 45,
    overscan: 3
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => visibleColumns[i].getSize(),
    overscan: 3
  });

  useEffect(() => {
    if (virtualization) rowVirtualizer.measure();
  }, [rowVirtualizer, rows.length, virtualization]);

  useEffect(() => {
    if (virtualization) columnVirtualizer.measure();
  }, [columnVirtualizer, visibleColumns.length, virtualization]);

  const VirtualTable = () => {
    return (
      <>
        {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
          const row = rows[virtualRow.index] as Row<any>;
          return (
            <TableRow
              key={row.id}
              className={`tr  d-flex`}
              style={{
                maxHeight: `${virtualRow.size}px`,
                height: `${virtualRow.size}px`,
                position: 'absolute',
                width: '100%',
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`
              }}
              onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}
            >
              {columnVirtualizer.getVirtualItems().map((virtualCell, index) => {
                const cell = row.getVisibleCells()[virtualCell.index];
                return (
                  <MemoizedCellRenderer
                    key={cell.id}
                    virtualStyles={{
                      position: 'absolute',
                      top: 0,
                      left: `${virtualCell.start}px`,
                      width: `${virtualCell.size}px`,
                      height: `${virtualRow.size}px`
                      // transform: `translateX(${virtualCell.start}px) translateY(${virtualRow.start}px)`
                    }}
                    {...{
                      virtualization,
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
      </>
    );
  };

  const excludedColumns = ['action', 'selection', 'expander'];

  const NormalTable = () => {
    return (
      <>
        {rows.map((row) => {
          return (
            <TableRow key={row.id} className={`tr`} onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}>
              {row.getVisibleCells().map((cell, index) => {
                if (exportTableView && excludedColumns.includes(cell.column.columnDef.id)) return null;
                return (
                  <MemoizedCellRenderer
                    key={cell.id}
                    virtualStyles={{}}
                    {...{
                      virtualization,
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
      </>
    );
  };

  const styles = useMemo(
    () => (virtualization ? { width: `${columnVirtualizer.getTotalSize()}px`, height: `${rowVirtualizer.getTotalSize()}px` } : {}),
    [virtualization, columnVirtualizer, rowVirtualizer]
  );

  // const footers;

  const footerRowFound = table?.getFooterGroups()[0].headers.some((h) => h.column.columnDef.footer);

  const tableRowsLengthGreterThanZero = table.getRowModel().rows.length > 0;

  const isFooterVisible = useMemo(
    () => isClientSideGrid && footerRowFound && tableRowsLengthGreterThanZero,
    [footerRowFound, isClientSideGrid, tableRowsLengthGreterThanZero]
  );

  return (
    <>
      <div
        style={{
          display: 'block',
          overflow: loading ? 'hidden' : 'auto',
          maxHeight: height ?? '100%',
          height: isFooterVisible && !pagination ? 'unset' : height || '100%'
        }}
        className="isolate z-10 border bg-[var(--dark-primary,_white)] max-[900px]:min-h-[500px]"
        ref={virtualization ? parentRef : undefined}
      >
        {!loading && !error && rows.length === 0 && initialDataLoaded && (
          <>
            <Box className=" absolute inset-0 top-[46px] -z-10 m-auto flex h-fit w-fit select-none items-center justify-center">
              <div className=" rounded-lg px-10 py-5 text-center">
                <p>No data found</p>
              </div>
            </Box>
          </>
        )}
        {(loading || error || !initialDataLoaded) && (
          <Box className="absolute inset-0 z-50 flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.2)] dark:bg-[rgba(0,0,0,0.1)]">
            <div className="rounded-lg bg-[white] px-10 py-5 text-center shadow-md dark:bg-[var(--dark-secondary)]">
              {error ? (
                <>
                  <Error className="mx-auto mb-2" />
                  <p>Something Went Wrong</p>
                </>
              ) : loading || !initialDataLoaded ? (
                <>
                  <CircularProgress />
                  <p>Loading...</p>
                </>
              ) : null}
            </div>
          </Box>
        )}

        <MaUTable ref={tableRef} size="small" className="tableWrap sticky table" style={styles}>
          <TableHead
            style={{
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            className="header sticky top-0 z-[11] bg-[var(--dark-primary,_white)]"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="tr sticky top-0 z-[11] bg-[var(--dark-primary,_white)] " key={headerGroup.id}>
                <SortableContext items={headerGroup.headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map((header) => {
                    if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                    return (
                      <DraggableHeader
                        virtualization={virtualization}
                        table={table}
                        customFilters={customFilters}
                        dispatch={dispatch}
                        isClientSideGrid={isClientSideGrid}
                        header={header}
                        key={header.id}
                        resource={resource}
                      />
                    );
                  })}
                </SortableContext>
              </TableRow>
            ))}
          </TableHead>
          <TableBody
            style={{
              overflow: 'hidden'
            }}
            className={`body relative ${isClientSideGrid && footerRowFound ? 'with-footer' : ''}`}
          >
            {virtualization ? <VirtualTable /> : <NormalTable />}
          </TableBody>
          {isFooterVisible && (
            <>
              <tfoot className="">
                {table?.getFooterGroups().map((footerGroup) => {
                  return (
                    <tr key={footerGroup.id}>
                      {footerGroup.headers.map((header, index) => {
                        if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                        const columnDef = header.column.columnDef as TColType;
                        const { style } = getStickyPosition(columnDef, index, table);
                        const colSize = header.getSize();
                        return (
                          <th
                            className={`sticky bottom-0 bg-[var(--dark-primary,_white)]`}
                            style={{
                              ...style,
                              position: 'sticky',
                              zIndex: columnDef.sticky === 'left' || columnDef.sticky === 'right' ? 12 : 'unset',
                              minWidth: colSize,
                              maxWidth: colSize
                            }}
                            key={header.id}
                          >
                            {header?.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </tfoot>
            </>
          )}
        </MaUTable>
      </div>
    </>
  );
});

export default TableComponent;
