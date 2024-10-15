import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Box, CircularProgress, TableBody, TableHead, TableRow } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';
import { Error } from '@material-ui/icons';
import { flexRender } from '@tanstack/react-table';
import { defaultRangeExtractor, Range, useVirtualizer } from '@tanstack/react-virtual';
import React, { ForwardedRef, forwardRef, memo, useEffect, useMemo } from 'react';
import { RnderTableProps } from 'src/components/CustomReactTable/TableComponents/Table';
import { getStickyPosition } from '../utils';
import { CellRenderer, DraggableHeader, TColType } from './TableHelperComponents';

const MemoizedCellRenderer = memo(CellRenderer);

export const VirtualTable = forwardRef(function (
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
    pagination,
    isFooterVisible,
    rows,
    initialDataLoaded,
    customFilters,
    tableRef,
    excludedColumns,
    footerRowFound,
    stickyColumns
  }: RnderTableProps,
  ref: ForwardedRef<HTMLTableElement>
) {
  // virtualization
  const parentRef = React.useRef();

  // if footer present then + 2 for header and footer height
  // else + 1 for only header height
  const rowVirtualizer = useVirtualizer({
    count: isFooterVisible ? rows.length + 2 : rows.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10
  });
  const columns = table.getVisibleFlatColumns();

  const visibleColumns = useMemo(() => {
    return columns;
  }, [columns]);

  const columnVirtualizer = useVirtualizer({
    count: visibleColumns?.length || 1,
    estimateSize: (index) => columns[index]?.getSize(),
    getScrollElement: () => parentRef.current,
    horizontal: true,
    overscan: 5,
    rangeExtractor: React.useCallback(
      (range: Range, ...rest) => {
        const next = new Set([...defaultRangeExtractor(range), ...stickyColumns.stickyIndexes]);
        return [...next].sort((a, b) => a - b);
      },
      [stickyColumns.stickyIndexes]
    )
  });

  useEffect(() => {
    columnVirtualizer.measure();
  }, [visibleColumns?.length]);

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rows.length]);

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const { leftIndexes: stickyLeft, rightIndexes: stickyRight } = stickyColumns;

  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;

  if (columnVirtualizer && virtualColumns?.length) {
    let leftIndex = 0;
    // check to see if the window passed the left sticky columns then move the left index to the first nonsticky index
    if (virtualColumns[stickyLeft.length]?.index !== stickyLeft[stickyLeft.length - 1] + 1) {
      leftIndex = stickyLeft.length;
    }
    virtualPaddingLeft = virtualColumns[leftIndex]?.start ?? 0;

    let rightIndex = virtualColumns.length - 1;
    if (virtualColumns[rightIndex - stickyRight.length]?.index !== stickyRight[0] - 1) {
      rightIndex = virtualColumns.length - 1 - stickyRight.length;
    }

    virtualPaddingRight = columnVirtualizer.getTotalSize() - (virtualColumns[rightIndex]?.end ?? 0);
  }

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
        ref={parentRef}
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

        <MaUTable
          ref={tableRef}
          size="small"
          className="tableWrap sticky table"
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: `max(${columnVirtualizer.getTotalSize()}px, 100%)` }}
        >
          <TableHead
            style={{
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            className="header sticky top-0 z-[11] bg-[var(--dark-primary,_white)]"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="tr sticky top-0 z-[11] !flex bg-[var(--dark-primary,_white)]" key={headerGroup.id}>
                <SortableContext items={headerGroup.headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
                  {virtualPaddingLeft ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
                  {virtualColumns.map((vc) => {
                    const header = headerGroup.headers[vc?.index];
                    if (!header) return null;
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
                  {virtualPaddingRight ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} /> : null}
                  {/* {headerGroup.headers.map((header) => {
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
                  })} */}
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
            <VirtualTableBody
              onRowClick={onRowClick}
              rows={rows}
              virtualization={virtualization}
              state={state}
              setWholeRowsCellColor={setWholeRowsCellColor}
              table={table}
              dispatch={dispatch}
              setCellValue={setCellValue}
              submitInput={submitInput}
              cellValue={cellValue}
              resetField={resetField}
              rowVirtualizer={rowVirtualizer}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualColumns={virtualColumns}
            />
          </TableBody>
          {isFooterVisible && (
            <>
              <tfoot className="sticky bottom-0">
                {table?.getFooterGroups().map((footerGroup) => {
                  return (
                    <tr key={footerGroup.id} className="!flex ">
                      {virtualPaddingLeft ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
                      {virtualColumns.map((vc) => {
                        const header = footerGroup.headers[vc?.index];
                        if (!header) return null;
                        if (exportTableView && excludedColumns.includes(header.column.columnDef.id)) return null;
                        const columnDef = header.column.columnDef as TColType;
                        const { style } = getStickyPosition(columnDef, vc.index, table);
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
                      {virtualPaddingRight ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} /> : null}
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

const VirtualTableBody = ({
  onRowClick,
  rows,
  virtualization,
  state,
  setWholeRowsCellColor,
  table,
  dispatch,
  setCellValue,
  submitInput,
  cellValue,
  resetField,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualColumns
}) => {
  return (
    <>
      {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        return (
          <TableRow
            key={row?.id}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
              display: 'flex'
            }}
            className={`tr`}
            onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}
          >
            {virtualPaddingLeft ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
            {virtualColumns.map((virtualCell, index) => {
              const cell = row?.getVisibleCells()?.[virtualCell?.index];
              if (!cell) return null;
              return (
                <MemoizedCellRenderer
                  key={cell.id}
                  virtualStyles={{}}
                  virtualization={virtualization}
                  state={state}
                  cell={cell}
                  setWholeRowsCellColor={setWholeRowsCellColor}
                  row={row}
                  index={index}
                  table={table}
                  dispatch={dispatch}
                  setCellValue={setCellValue}
                  submitInput={submitInput}
                  cellValue={cellValue}
                  resetField={resetField}
                />
              );
            })}
            {virtualPaddingRight ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} /> : null}
            {/* {row.getVisibleCells().map((cell, index) => {
              if (exportTableView && excludedColumns.includes(cell.column.columnDef.id)) return null;
              return (
                <React.Fragment key={cell.id}>
                  <MemoizedCellRenderer
                    key={cell.id}
                    virtualStyles={{}}
                    virtualization={virtualization}
                    state={state}
                    cell={cell}
                    setWholeRowsCellColor={setWholeRowsCellColor}
                    row={row}
                    index={index}
                    table={table}
                    dispatch={dispatch}
                    setCellValue={setCellValue}
                    submitInput={submitInput}
                    cellValue={cellValue}
                    resetField={resetField}
                  />
                </React.Fragment>
              );
            })} */}
          </TableRow>
        );
      })}
    </>
  );
};
